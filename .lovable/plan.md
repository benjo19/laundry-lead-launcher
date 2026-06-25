
## Što sam našao

Backend je čist. Zadnjih 7 AI Gateway poziva za `generate-email` (zadnji u 15:42:20) — svi uspješni, 200 OK, 2-3 s. Edge funkcija isto 200 OK. Auth radi.

Znači "zaglavljivanje" se događa **na klijentu**. Identificirao sam 4 stvarna uzroka:

### 1. `useEffect` s `setSavedFormData` u deps okida re-render petlju
`src/components/EmailGenerator.tsx` linije 66-74 — efekt sprema u localStorage svaki put kad se promijeni bilo koje polje, a `recipients` je array koji se rekreira. Kombinirano sa `setIsGenerating(true)` toggle-om, ovo može uzrokovati duge zamrznute renderove kod velikih lista leadova (346 leadova u logu). Treba debounce + ukloniti `setSavedFormData` iz deps.

### 2. Pozadinski `triggerWebhook` curi nakon outer timeouta u `saveDraft`
`EmailGenerator.tsx` 593-597: `Promise.race` između webhook poziva (do 60s+ s 3 retrya) i 90s timeouta. Ako timeout odjavi, **`triggerWebhook` i dalje radi u pozadini**, drži `isLoading` u `useMakeIntegration`, i ako korisnik ponovno klikne — gleda stale state. Treba dijeliti `AbortController` između outer guarda i fetcha tako da prekid stvarno otkaže webhook.

### 3. `isGenerating` se ne resetira ako `generateEmail` baci sinkrono prije `try`
`generateEmailContent` (226-314) — pre-flight provjere (template/industry/AI config) rade `return` **bez** `setIsGenerating(false)`, ali `setIsGenerating(true)` je tek na liniji 254 nakon njih. To je OK. Ali ako `useIntegratedEmailService` baci unhandled rejection iz `withTimeout` (npr. session refresh hang prije `try`), finally se izvršava. Ipak — ako se preflight `supabase.auth.getSession()` zaglavi prije nego što se `withTimeout` upali (rare), klijent stoji. Dodati `AbortSignal` na getSession i hard 6s outer timer.

### 4. Backfill efekt blokira na mountu s velikim listama
Linije 136-197 — pri svakom mountu povlači `select * from emails where status='Sent'` pa iterira `updateLeadStatus` u petlji sekvencijalno za N leadova. S 346 leadova ovo lako traje 5-30s i blokira interakcije izgleda kao "zamrznuto". Treba: 1) limitirati select, 2) batch updates, 3) ne blokirati UI (pustiti u idleCallback).

---

## Plan popravka

### A. `src/components/EmailGenerator.tsx`

1. **Auto-save formi → debounce 500ms**, makni `setSavedFormData` iz deps efekta (linije 66-74).
2. **saveDraft**: zamijeniti `Promise.race` sa zajedničkim `AbortController` — proslijediti ga u `triggerWebhook` da otkaže fetch kad timeout istekne; ukloniti curenje pozadinskog requesta.
3. **Backfill efekt**: dodati `requestIdleCallback` wrapper, limitirati query na zadnjih 500 sent emailova, raditi `Promise.all` umjesto `for await`, i preskočiti ako `leads.length > 1000`.
4. **Generate gumb**: dodati hard safety timer (60s) koji forsira `setIsGenerating(false)` čak i ako promise nikad ne resolve-a (safety net).

### B. `src/hooks/useIntegratedEmailService.ts`

5. Pre-flight `supabase.auth.getSession()` već ima 5s timeout — dodati isti i za `refreshSession()` (trenutno nezaštićen, linija 75).
6. Logirati `console.log` na svakom koraku ('preflight ok', 'context fetched', 'invoking edge', 'edge returned') tako da u idućem incidentu odmah vidimo gdje visi.

### C. `src/hooks/useMakeIntegration.ts`

7. `triggerWebhook` mora prihvatiti externi `AbortSignal` parametar i proslijediti ga svakom fetch pokušaju (umjesto samo internog per-attempt controllera).
8. Ako externi signal abortira, prekini retry petlju odmah i baci `AbortError`.

### D. Dijagnostika (jednokratno)

9. Dodati lagani in-app debug panel iza `?debug=1` koji prikazuje: zadnji error iz `generateEmail`/`saveDraft`, trajanje zadnjeg poziva, status `isGenerating`/`isSavingDraft`. Olakšava korisniku da nam pošalje točan trag bez DevToolsa.

---

## Što NE mijenjam

- Edge funkciju `generate-email` — radi.
- AI Gateway poziv — radi.
- Make.com webhook URL i format — ostaju.
- Auth flow — ostaje.

## Verifikacija

- Klik "Generiraj" 5x zaredom s velikim leads listom → gumb se nikad ne zaglavi >60s.
- Klik "Spremi Draft" → ako Make.com ne odgovori za 20s, vidiš toast, gumb se otključa, **nema pozadinskog ghost POSTa** u Network tabu.
- localStorage piše se rijetko (debounce), ne na svaki keystroke.
- Backfill ne blokira tipkanje na mountu.
