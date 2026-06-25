
# Redizajn CRM-a u premium B2B prodajni cockpit (Brentareno / industrijska oprema za pranje)

Cilj: zadržati svu postojeću funkcionalnost, Supabase integraciju, auth, rute i hookove. Mijenjamo isključivo vizualni sloj, navigaciju, strukturu dashboarda i raspored postojećih modula u nove "stranice". Tamo gdje stranica ne postoji, gradi se nova UI ljuska nad postojećim podacima (leads, emails, reminders, business_documents).

## 1. Design system (temelj — radi se prvo)

Mijenja se `src/index.css` i `tailwind.config.ts`:

- Pozadina app: svijetli slate `hsl(220 20% 97%)`
- Sidebar: tamno navy `hsl(222 35% 14%)` s muted tekstom `hsl(215 20% 70%)` i aktivnom stavkom u `hsl(213 70% 55%)`
- Kartice: bijele `hsl(0 0% 100%)` s borderom `hsl(220 16% 90%)` i mekom sjenom `0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04)`
- Primary: duboko navy `hsl(217 60% 28%)`, hover `hsl(217 60% 24%)`
- Success (samo dobiveni dealovi): `hsl(150 55% 38%)`
- Warning (hot leadovi / hitno): `hsl(32 90% 50%)`
- Danger (zakašnjelo / izgubljeno): `hsl(0 70% 48%)`
- Neutralni status tokeni za badgeve: `--status-new`, `--status-contacted`, `--status-negotiation`, `--status-won`, `--status-lost`, `--status-cold`
- Tipografija: Inter (već učitan). Skala: `text-2xl font-semibold` za naslove stranica, `text-sm text-muted-foreground` za helper, `tabular-nums font-semibold` za KPI brojeve
- Radius: `--radius: 0.625rem`
- Brišu se "playful" gradijenti iz `bg-app-gradient` i zamjenjuju ravnom slate pozadinom
- Dark mode ostaje, ali kalibriran na isti navy/slate ključ

Sva boja u komponentama ide preko semantičkih tokena — bez `text-white`, `bg-blue-500`, itd.

## 2. Navigacija i ljuska aplikacije

Mijenja se `src/components/Sidebar.tsx` i `src/pages/Index.tsx`.

Nova lijeva navigacija (točno ovaj redoslijed, hrvatski):

1. Dashboard → postojeći `Dashboard.tsx` (redizajn)
2. Leadovi → postojeći `LeadHunter.tsx` (redizajn tablice/karata)
3. Klijenti → **nova view-ljuska** nad istim `leads` zapisima filtriranim po `status in ('Dobiveno','Pregovori')` + profil stranica
4. Ponude → **novi Kanban** nad postojećim `offers` tablicom (već postoji u DB)
5. Follow-up → preraspored `CRMReminder.tsx` u tab-formu (Danas / Zakašnjelo / Ovaj tjedan / Sve)
6. Dokumenti → postojeći `BusinessDocuments.tsx` (čišći grid)
7. AI Mail → postojeći `EmailGenerator.tsx` (pojednostavljen UI)
8. Integracije → postojeći `MakeIntegration` + `ZapierIntegration` + `GoogleCalendarIntegration` + `EmailSettings` u jednoj stranici s status badgevima
9. Postavke → postojeći `Settings.tsx`

Stari moduli koji ostaju dostupni ali sakriveni iz glavnog menija (do odluke): Lead Discovery, Knowledge Base, AI Asistent, Content Booster, Analytics, Subscription, Admin Dashboard — pristupačni iz Postavki / submenu-a. Ako želite da neki od njih ostane u glavnom meniju, recite koji.

Sidebar dobiva: logo + naziv ("Brentareno CRM"), aktivnu stavku s navy bg + lijevim akcent borderom, podnožje s user chipom i Odjavi se. Collapsible na desktopu (icon-only), off-canvas na mobitelu (već postoji `Sheet`).

## 3. Dashboard

`src/components/Dashboard.tsx` — kompletan reskin, isti podaci (Supabase `leads`, `reminders`, `offers`, `emails`).

Layout:

```text
+----------------------------------------------------+----------------+
| KPI red (6 kompaktnih kartica)                     |                |
| Današnji follow-upovi | Zakašnjele aktivnosti     | Brze akcije    |
| Hot leadovi | Otvorene ponude                      | (4 gumba)      |
| Vrijednost pipelinea | Procijenjena marža          |                |
+----------------------------------------------------+ Sažetak        |
| Prioritet danas (lista, max 8)                     | podsjetnika    |
+----------------------------------------------------+                |
| Zakašnjele ponude | Hot leadovi (2 kolone)         |                |
+----------------------------------------------------+----------------+
```

- KPI kartice: ikona (lucide, monoline, muted), label (`text-xs text-muted-foreground uppercase tracking-wide`), broj (`text-3xl font-semibold tabular-nums`), delta (mali badge)
- "Prioritet danas": redak = avatar inicijal, firma, sljedeći korak, badge prioriteta, gumb "Otvori"
- Brze akcije (desni widget): Dodaj lead, Dodaj ponudu, Dodaj follow-up, Generiraj prodajni mail — svaki gumb navigira na odgovarajući modul / otvara postojeći dialog
- Sažetak podsjetnika: 3 nadolazeća iz `reminders`

Vrijednost pipelinea i marža računaju se iz `offers` (postojeća polja `value`, `margin` — provjerit ću pravi naziv u migraciji prije implementacije).

## 4. Leadovi

`src/components/LeadHunter.tsx` (+ child komponente) — redizajn:

- Header: naslov, broj rezultata, filteri (grad, država, segment, status, prioritet), gumbi "Dodaj lead", "Izvezi CSV" (već postoji)
- Tablica na desktopu (sticky header, zebra-free, hover bg `muted/40`):
  | Firma / Kontakt | Grad, Država | Segment | Status | Prioritet | Sljedeći korak | Follow-up | Procij. vrijednost | Akcije |
- Status badge boje vezane uz `--status-*` tokene
- Prioritet: 🔴 Vruće / 🟠 Toplo / ⚪ Hladno (točka + tekst, bez emojija u kodu)
- Akcije po retku: Otvori, Generiraj mail, Dodaj follow-up
- Na mobitelu: tablica → card layout (svaka kartica isti podaci, akcije u dnu)
- Status enum proširuje se na: Novi, Kontaktiran, Analiza potreba, Ponuda u pripremi, Ponuda poslana, Pregovori, Čeka leasing/financiranje, Dobiveno, Izgubljeno, Hladno. Tip `Lead.status` proširuje se u `src/types/index.ts`; postojeće vrijednosti se mapiraju ("Nova" → "Novi", "Kontaktirano" → "Kontaktiran")

## 5. Klijenti

Nova lagana stranica `src/components/Clients.tsx` koja koristi postojeći `useSupabaseLeads` filtriran na statuse "Dobiveno" + "Pregovori" + "Čeka leasing". Layout: lista + detalj.

Profil klijenta (kad se klikne):
- Lijevo: kontakt detalji, firma, grad/država, segment
- Sredina: bilješke (auto-save, postojeća logika iz lead details modala), polja "Interes za stroj", "Budžet", "Timeline" (nova kolona `client_notes` ili reuse `notes` JSON polja — vidi sekciju 10)
- Desno: sljedeće akcije, povezane ponude (`offers`), dokumenti, prečac "Generiraj AI mail"

## 6. Ponude (Kanban)

Nova komponenta `src/components/OffersKanban.tsx` nad postojećom `offers` tablicom. Kolone (po `status`):

Nacrt → Poslano → Pregovori → Leasing/Financiranje → Dobiveno → Izgubljeno

Karta ponude:
- Naziv klijenta (iz `leads.company` preko `client_id` — provjerit ću schema)
- Vrijednost (`value`, formatiran EUR)
- Procij. marža (badge)
- Proizvodi (chips, max 3 + "+N")
- Zadnji kontakt (relative time)
- Sljedeća akcija + follow-up datum
- Drag & drop među kolonama (dnd-kit — već u repo? ako ne, plan dodaje ovisnost)

Status promjena = update reda u `offers`. Ako `offers.status` enum ne pokriva sve kolone, planira se migracija (vidi sekciju 10).

## 7. Follow-up

Refaktor postojećeg `CRMReminder.tsx` u tab-bazirano sučelje:

- Tabovi: Danas | Zakašnjelo | Ovaj tjedan | Sve aktivnosti
- Svaki red: klijent/lead, tip akcije, due date (s relativnim "za 2h" / "kasni 3d"), prioritet badge
- Akcije: "Označi riješeno" (update `reminders.completed = true`), "Generiraj mail" (navigira na AI Mail s prefilled lead/klijent)
- Sticky FAB na mobitelu: "Dodaj follow-up"

## 8. AI Mail

Pojednostavljenje `EmailGenerator.tsx` u 3-koraka layout:

1. Odaberi lead / klijent (dropdown s search-em)
2. Odaberi cilj: Prvi kontakt | Follow-up | Slanje ponude | Podsjetnik nakon ponude | Leasing/financiranje | Reactivation izgubljenog leada
3. Generiraj → output card s mailom, gumbi "Kopiraj", "Spremi u bilješke klijenta", "Pošalji webhookom"

Sva postojeća webhook/retry/debounce/idempotency logika ostaje netaknuta. Mijenja se samo prezentacija — gornji checkbox za equipment sale već je automatski (memo u repo).

## 9. Dokumenti i Integracije

- **Dokumenti**: `BusinessDocuments.tsx` dobiva čišći grid (3 kolone desktop / 1 mobitel). Kartica = ikona po extensionu, ime, brand, kategorija, datum, search bar na vrhu, upload gumb gore desno
- **Integracije**: nova stranica koja slaže `MakeIntegration`, `ZapierIntegration`, `GoogleCalendarIntegration`, `EmailSettings` u kartice s badgevima statusa (Povezano / Nije povezano / Potrebna provjera) na temelju postojećih provjera URL/token

## 10. Database promjene (manje, samo gdje treba)

Tri male migracije — pokreću se prije implementacije UI-ja koji ih treba:

1. **Prošireni status leada**: dodati provjeru/CHECK trigger na `leads.status` i backfill starih vrijednosti ("Nova"→"Novi", "Kontaktirano"→"Kontaktiran"). Bez breaking changeova jer `status` je TEXT
2. **Prošireni status ponuda**: `offers.status` proširen na enum vrijednosti Nacrt/Poslano/Pregovori/Leasing/Dobiveno/Izgubljeno + backfill
3. **Klijent polja**: dodati `machine_interest TEXT`, `budget TEXT`, `timeline TEXT` na `leads` (nullable), s GRANT-ovima sukladno postojećoj RLS

Bez novih tablica, bez novih RLS politika.

## 11. Mobile

- Sidebar → off-canvas (već postoji `MobileHeader` + `Sheet`)
- Sve tablice → card layout ispod `md` breakpointa
- Sticky bottom FAB na Leadovi/Follow-up/Ponude za primarnu akciju
- KPI kartice: 2 kolone na mobitelu, 3 na tabletu, 6 na desktopu

## 12. Tehnička pravila izvedbe

- Sve nove i refaktorirane komponente koriste isključivo semantičke tokene
- Komponente <300 linija — gdje treba, izvlači se u `src/components/<page>/...`
- Zadržava se postojeći routing (`/`, `/admin`, `/auth`), samo se mijenja interni `activeModule` enum + Sidebar mapping
- Postojeći hookovi (`useSupabaseLeads`, `useLeadManagement`, `useMakeIntegration`, `useIntegratedEmailService`, itd.) ostaju netaknuti

## 13. Redoslijed implementacije (faze, jedna po jedna)

1. Design tokeni + Sidebar + AppShell (vizualni temelj svih stranica)
2. Dashboard reskin s pravim Supabase podacima
3. Leadovi reskin + status proširenje + migracija #1
4. Ponude Kanban + migracija #2
5. Follow-up tab UI
6. Klijenti stranica + migracija #3
7. AI Mail pojednostavljenje
8. Dokumenti + Integracije reskin
9. Mobile polish i sticky FAB-ovi

Svaka faza je samostalno deploy-abilna — preview ostaje funkcionalan između faza.

## Otvorena pitanja prije starta

- Sakrivam li Knowledge Base / AI Asistent / Content Booster / Analytics iz glavnog menija (premještam u Postavke), ili ih ostavljam vidljive?
- Smije li se dodati `@dnd-kit/core` za Kanban drag & drop, ili da Kanban radi s dropdown-promjenom statusa bez drag-a?
- Krenuti odmah s fazom 1 (tokeni + sidebar + shell) nakon odobrenja, ili želite najprije rendering preview tri smjera za Dashboard prije nego što fiksiram dizajn tokene?
