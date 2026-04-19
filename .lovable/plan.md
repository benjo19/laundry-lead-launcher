

## Plan: Alat za pronalaženje i spajanje duplikata u Lead Hunteru

Cilj: Dodati alat koji pronalazi duplikate leadova (po emailu ili nazivu firme), prikazuje ih u grupama, omogućuje pregled svake grupe te spajanje (zadržavanje jednog "master" zapisa s objedinjenim podacima i brisanje ostalih).

### Korisničko iskustvo

1. U Lead Hunteru se pojavljuje novi gumb **"Pronađi duplikate"** (uz "Dodaj Lead").
2. Klikom se otvara dijalog (Dialog) koji:
   - Skenira leadove i grupira ih po:
     - **Emailu** (normalizirano: lowercase, trim) — ignorira prazne
     - **Nazivu firme** (normalizirano: lowercase, trim, uklonjeni d.o.o./j.d.o.o./obrt sufiksi i višestruki razmaci)
   - Prikazuje listu grupa duplikata, svaka grupa pokazuje 2+ leadova.
   - Toggle na vrhu: "Po emailu" / "Po nazivu firme" / "Oboje".
3. Za svaku grupu korisnik:
   - Vidi sve leadove u grupi (firma, email, telefon, lokacija, status, datum dodavanja).
   - Bira **"master" zapis** (radio button) — defaultno najstariji ili onaj s najviše popunjenih polja.
   - Klikom **"Spoji grupu"**: master dobiva objedinjena polja iz duplikata (popunjava prazna polja master-a vrijednostima iz duplikata, notes se konkatenira), ostali leadovi se brišu.
4. Bulk akcija: **"Spoji sve grupe"** s automatskim odabirom mastera (najviše popunjenih polja, tie-breaker = najstariji).
5. Toast s rezultatima nakon operacije; lista leadova se osvježava.

### Tehnička implementacija

**Novi fajlovi:**

- `src/components/lead-hunter/DuplicateFinderDialog.tsx`
  - Glavni dijalog. Prima `leads: Lead[]`, `onMerge: (masterId, duplicateIds, mergedData) => Promise<void>`, `onClose`.
  - State: `mode: 'email' | 'company' | 'both'`, `selectedMasters: Record<groupId, leadId>`.
  - Računa grupe duplikata pomoću `useMemo`.
  - Renderira listu grupa s `Card` komponentama; svaki lead u grupi je redak s `RadioGroup` za odabir mastera.
  - Gumbi: "Spoji ovu grupu", "Spoji sve grupe", "Zatvori".

- `src/components/lead-hunter/utils/duplicateDetection.ts`
  - `normalizeCompany(name: string): string` — lowercase, trim, ukloni `d.o.o.`, `j.d.o.o.`, `obrt`, `d.d.`, višestruke razmake.
  - `normalizeEmail(email: string): string` — lowercase, trim.
  - `findDuplicateGroups(leads: Lead[], mode: 'email' | 'company' | 'both'): DuplicateGroup[]`
  - `pickBestMaster(leads: Lead[]): Lead` — najviše ne-praznih polja, tie-breaker = najstariji `dateAdded`.
  - `mergeLeadData(master: Lead, duplicates: Lead[]): Partial<Lead>` — popuni prazna polja mastera, konkatenira `notes` s odvajačem.

**Izmjene u postojećim fajlovima:**

- `src/components/LeadHunter.tsx`:
  - Dodati state `isDuplicateDialogOpen`.
  - Dodati gumb **"Pronađi duplikate"** (s `Copy` ili `GitMerge` ikonom iz lucide) u header pored "Dodaj Lead".
  - Implementirati `handleMergeDuplicates(masterId, duplicateIds, mergedData)`:
    - `updateLead(masterId, mergedData)` — koristi postojeći `updateLeadNotes` i novi update poziv ili poziva direktno `supabase.from('leads').update(...)`.
    - Za svaki duplikat: `deleteLead(duplicateId)`.
    - Toast s brojem spojenih.
    - `refreshLeads()`.

- `src/hooks/useLeadManagement.ts` ili `useSupabaseLeads.ts`:
  - Provjeriti postoji li generička `updateLead(id, partial)` funkcija; ako ne, dodati je (već postoje `updateLeadStatus` i `updateLeadNotes`, treba općenitiji update za spajanje više polja odjednom).

### Edge cases

- Grupe s leadovima koji imaju različit `business_profile_id` — prikazati upozorenje da master može biti samo jedan profil.
- Email prazan = ne ulazi u email grupiranje.
- "Both" mode: lead može pripadati u dvije grupe; rješavamo tako da koristimo Union-Find (disjoint set) — leadovi koji se podudaraju po bilo kojem kriteriju ulaze u istu grupu.
- Ako korisnik već odabere mastera koji je u međuvremenu obrisan iz druge grupe — graciozno preskoči.

### Datoteke koje će se kreirati/mijenjati

- **Nove**: `src/components/lead-hunter/DuplicateFinderDialog.tsx`, `src/components/lead-hunter/utils/duplicateDetection.ts`
- **Izmijenjene**: `src/components/LeadHunter.tsx`, `src/hooks/useLeadManagement.ts` (dodati generički `updateLead` ako ne postoji)

