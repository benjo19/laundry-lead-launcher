

# Plan: Dodavanje svih email adresa iz baze pri slanju generickog emaila

## Sto se mijenja

Kada saljete genericki email (po industriji ili obicni), moci cete jednim klikom dodati sve email adrese iz vase baze leadova kao primatelje. Umjesto jednog primatelja, email ce se moci poslati na vise adresa odjednom.

## Kako ce izgledati

- Novo polje za visestruke primatelje (multi-select) umjesto jednog dropdown-a
- Gumb **"Dodaj sve iz baze"** koji jednim klikom dodaje sve email adrese iz leadova
- Mogucnost rucnog dodavanja email adresa (upisite email i pritisnite Enter)
- Mogucnost uklanjanja pojedinacnih adresa klikom na X
- Prikaz broja odabranih primatelja
- Prilikom slanja, email se salje na svaki odabrani primatelj (bulk send)

---

## Tehnicke promjene

### Datoteka: `src/components/EmailGenerator.tsx`

1. **Zamjena `recipient` (string) s `recipients` (string[])**
   - State promjena: `useState<string[]>([])` umjesto `useState('')`
   - Azuriranje svih referenci na recipient

2. **Novi UI za visestruke primatelje**
   - Prikaz odabranih primatelja kao badge/chip komponente s X gumbom
   - Dropdown za odabir iz postojecih leadova (ostaje)
   - Input za rucni unos s Enter tipkom za dodavanje
   - Gumb "Dodaj sve iz baze" koji poziva `getAllEmailAddresses()` i dodaje sve

3. **Azuriranje `sendEmail` funkcije**
   - Iteracija kroz sve primatelje
   - Slanje emaila za svakog primatelja pojedinacno (webhook poziv per recipient)
   - Progress indikator tijekom bulk slanja

4. **Azuriranje `saveDraft` funkcije**
   - Spremanje svih primatelja u draft

5. **Azuriranje `generateEmailContent` funkcije**
   - Generiranje jednog generickog emaila koji se primjenjuje na sve primatelje

### Datoteka: `src/hooks/useLocalStorage.ts`
- Nema promjena (vec podrzava array tipove)

### Datoteka: `src/types/index.ts`
- Provjeriti da Email tip podrzava visestruke primatelje (to polje moze biti string s zarezom ili ostati string za svaki zapis)

---

## Korisnicko iskustvo

1. Korisnik odabere "Za industriju" ili "Za konkretnog primatelja"
2. Klikom na "Dodaj sve iz baze" dodaju se sve email adrese
3. Korisnik moze ukloniti pojedine adrese ili dodati nove rucno
4. Generira email sadrzaj (jedan genericki)
5. Klikom na "Posalji" email ide na sve odabrane primatelje

