
Cilj: popraviti zapinjanje na “Generiranje AI sadržaja...” tako da generiranje emaila ili uspješno završi, ili jasno prijavi grešku i vrati gumb u normalno stanje.

Što sam našao
- U `EmailGenerator.tsx` se `isGenerating` pali prije poziva i gasi tek kad se async lanac završi. Ako bilo koji korak “visi”, UI ostaje zauvijek u loading stanju.
- U `useIntegratedEmailService.ts` nema timeouta ni za `getContextForAI(...)` ni za `supabase.functions.invoke('generate-email')`.
- `useIntegratedEmailService` koristi vlastiti `useAuth()` umjesto centralnog `AuthContext` stanja, pa može doći do nesklada sesije.
- `getContextForAI()` u `useBusinessProfile.ts` može čekati na storage/signed URL/dokumente bez zaštite od sporog ili blokiranog zahtjeva.
- Replay pokazuje i problem sa zaglavljivanjem na `/auth`, što može blokirati pozive edge funkcija koje traže prijavu.

Plan popravka
1. Učvrstiti auth izvor
- U `useIntegratedEmailService.ts` prebaciti provjeru korisnika na `useAuthContext()` umjesto zasebnog `useAuth()`.
- Time će Email Generator koristiti isto auth stanje kao i `ProtectedRoute`.

2. Dodati timeout i fail-fast zaštitu za generiranje
- U `useIntegratedEmailService.ts` dodati timeout wrapper za:
  - dohvat business konteksta
  - poziv `generate-email` edge funkciji
- Ako timeout istekne:
  - prikazati jasan toast tipa “Generiranje traje predugo, pokušajte ponovno”
  - vratiti `null`
  - omogućiti da se gumb odmah otključa

3. Ograničiti rizik u business kontekstu
- U `useBusinessProfile.ts` zaštititi dohvat dokumenata tako da spori ili neuspješni storage fetch ne blokira cijelo generiranje.
- Ako dokumenti ne uspiju, generiranje treba nastaviti bez njih, samo s osnovnim profilom.

4. Poboljšati UI ponašanje u Email Generatoru
- U `src/components/EmailGenerator.tsx` dodati:
  - jasniji loading tekst (“Pripremam kontekst...”, “Generiram email...” ako želimo jednostavnu faznu poruku)
  - fallback poruku kad generiranje ne vrati rezultat
  - opcionalno gumb “Pokušaj ponovno” bez ručnog refresh-a stranice
- Bitno: nikad ne ostaviti `isGenerating` u true nakon greške ili timeouta.

5. Stabilizirati auth screen
- U `src/pages/Auth.tsx` i po potrebi `src/hooks/useAuth.tsx` smanjiti šansu da korisnik ostane zaglavljen na “Provjera prijave...”.
- Kad auth provjera pukne ili istekne, korisnik mora dobiti login formu i mogućnost nastavka, umjesto beskonačnog limba.
- Po potrebi dodatno očistiti stale session handling da se ne blokira edge poziv.

Tehnički detalji
- Datoteke za izmjenu:
  - `src/hooks/useIntegratedEmailService.ts`
  - `src/hooks/useBusinessProfile.ts`
  - `src/components/EmailGenerator.tsx`
  - vjerojatno `src/pages/Auth.tsx`
  - po potrebi `src/hooks/useAuth.tsx`
- Ne očekujem promjene baze ni migracije.
- Edge funkciju `supabase/functions/generate-email/index.ts` ne bih prvo mijenjao, jer glavni problem izgleda u klijentskom čekanju i auth/session sloju; po potrebi možemo naknadno dodati i server-side timeout/logging poruke.

Kako ću verificirati nakon implementacije
- Generiranje s odabranim predloškom mora završiti uspjehom ili jasnom greškom unutar razumnog vremena.
- Gumb više ne smije ostati trajno na “Generiranje AI sadržaja...”.
- Ako business dokumenti kasne ili padnu, email se i dalje mora generirati bez njih.
- Ako sesija nije valjana, korisnik treba odmah dobiti razumljivu auth poruku umjesto beskonačnog čekanja.
