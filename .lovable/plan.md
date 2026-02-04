
# Plan: Migracija na Lovable AI Gateway

## Pregled

Omoguciti svim korisnicima koristenje AI funkcionalnosti bez potrebe za unosom vlastitih API kljuceva. Koristit cemo Lovable AI Gateway koji vec ima konfiguriran `LOVABLE_API_KEY`.

## Trenutno stanje

### Vec koristi Lovable AI Gateway (ne treba mijenjati):
- `supabase/functions/generate-email/index.ts`
- `supabase/functions/ai-chat/index.ts`
- `supabase/functions/generate-image/index.ts`
- `src/services/aiContentService.ts` (poziva `ai-chat`)
- `src/hooks/useIntegratedEmailService.ts` (poziva `generate-email`)

### Treba migrirati:
- `supabase/functions/ai-knowledge-chat/index.ts` - koristi korisnicke API kljuceve
- `src/services/aiLeadAnalysisService.ts` - direktni pozivi prema OpenAI/Gemini iz frontenda
- `src/services/aiEmailService.ts` - direktni pozivi (ali se ne koristi aktivno)

### Treba pojednostaviti:
- `src/components/AISettings.tsx` - ukloniti polja za API kljuceve
- `src/hooks/useAISettings.ts` - pojednostaviti logiku

---

## Koraci implementacije

### Korak 1: Migracija `ai-knowledge-chat` Edge funkcije

**Datoteka:** `supabase/functions/ai-knowledge-chat/index.ts`

**Promjene:**
1. Ukloniti dohvacanje korisnickih `ai_settings` (linije 192-219)
2. Ukloniti funkcije `callAnthropicAPI`, `callOpenAIAPI`, `callGeminiAPI`
3. Dodati novu funkciju `callLovableAI` koja koristi `LOVABLE_API_KEY`
4. Koristiti model `google/gemini-2.5-flash` (default)

```text
Struktura nove funkcije:
+----------------------------------+
| ai-knowledge-chat                |
+----------------------------------+
| 1. Autentikacija korisnika       |
| 2. Dohvati knowledge base        |
| 3. Pripremi kontekst             |
| 4. Pozovi Lovable AI Gateway     |
|    - LOVABLE_API_KEY             |
|    - google/gemini-2.5-flash     |
| 5. Vrati odgovor                 |
+----------------------------------+
```

### Korak 2: Nova Edge funkcija za analizu leadova

**Nova datoteka:** `supabase/functions/ai-lead-analysis/index.ts`

**Sto radi:**
- Prima listu leadova za analizu
- Koristi Lovable AI Gateway za ocjenu svakog leada
- Vraca analizirane leadove s AI ocjenama

**Zamjenjuje:** direktne pozive iz `src/services/aiLeadAnalysisService.ts`

### Korak 3: Refaktoriranje frontend servisa

**Datoteka:** `src/services/aiLeadAnalysisService.ts`

**Promjene:**
1. Ukloniti metode `callOpenAI` i `callGemini`
2. Ukloniti dohvacanje `ai_settings` iz baze
3. Izmijeniti `analyzeLeads` da poziva novu Edge funkciju:
   ```typescript
   const { data, error } = await supabase.functions.invoke('ai-lead-analysis', {
     body: { leads }
   });
   ```

**Datoteka:** `src/services/aiEmailService.ts`

**Promjene:**
- Oznaciti kao deprecated ili obrisati (vec postoji `useIntegratedEmailService` koji koristi `generate-email`)

### Korak 4: Pojednostaviti AI Settings UI

**Datoteka:** `src/components/AISettings.tsx`

**Promjene:**
1. Ukloniti polja za OpenAI i Gemini API kljuceve
2. Dodati poruku "AI Powered by Lovable"
3. Zadrzati samo:
   - Google Maps API Key (za Lead Discovery)
   - Web Search Provider odabir

**Novi izgled:**
```text
+----------------------------------------+
| AI Postavke                            |
+----------------------------------------+
| [x] AI je omogucen                     |
|     Powered by Lovable AI Gateway      |
|     Model: Gemini 2.5 Flash            |
+----------------------------------------+
| Google Maps API Kljuc (opcionalno)     |
| [____________________________] [Prikazi]|
| Za Lead Discovery funkcionalnost       |
+----------------------------------------+
| Web Search Provider                    |
| [Google CSE v]                         |
+----------------------------------------+
|           [Spremi Postavke]            |
+----------------------------------------+
```

### Korak 5: Pojednostaviti useAISettings hook

**Datoteka:** `src/hooks/useAISettings.ts`

**Promjene:**
1. Pojednostaviti `AISettings` interface - ukloniti `api_key`, `openai_api_key`, `gemini_api_key`
2. `isAIConfigured()` uvijek vraca `true` (AI je uvijek dostupan)
3. Zadrzati samo `google_maps_api_key` i `search_provider`

### Korak 6: Azurirati config.toml

**Datoteka:** `supabase/config.toml`

**Promjene:**
- Dodati novu funkciju `ai-lead-analysis`

---

## Tehnicke napomene

### Lovable AI Gateway
- URL: `https://ai.gateway.lovable.dev/v1/chat/completions`
- API Key: `LOVABLE_API_KEY` (automatski dostupan)
- Default model: `google/gemini-2.5-flash`
- Kompatibilan s OpenAI API formatom

### Error handling
Sve Edge funkcije trebaju obraditi:
- 429 (Rate limit) - "Previse zahtjeva, pokusajte kasnije"
- 402 (Payment required) - "Potrebno dodati kredite"
- 500 (Server error) - Genericka greska

### Migracija podataka
- Postojeci `ai_settings` u bazi se nece brisati
- Korisnici koji imaju vlastite kljuceve ih mogu zadrzati kao backup
- Nove funkcionalnosti koriste iskljucivo Lovable AI Gateway

---

## Redoslijed implementacije

1. Kreirati `ai-lead-analysis` Edge funkciju
2. Migrirati `ai-knowledge-chat` na Lovable AI Gateway
3. Azurirati `aiLeadAnalysisService.ts`
4. Pojednostaviti `AISettings.tsx` i `useAISettings.ts`
5. Testirati sve AI funkcionalnosti

---

## Ocekivani rezultat

- Korisnici mogu odmah koristiti AI bez konfiguracije
- Nema vise "AI nije konfiguriran" gresaka
- Centralizirano upravljanje AI-jem kroz Lovable
- Google Maps API Key ostaje opcionalan za Lead Discovery
