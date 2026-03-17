
# Plan: Filtriranje "Dodaj sve iz baze" po odabranoj industriji

## Sto se mijenja

Kada koristite industry mode i odaberete industriju, gumb "Dodaj sve iz baze" ce dodati **samo leadove koji pripadaju toj industriji**, umjesto svih leadova iz baze.

Ako je odabrano "Sve industrije / Opcenito", dodaju se svi leadovi kao i dosad.

## Tehnicke promjene

### Datoteka: `src/components/EmailGenerator.tsx`

1. **Azurirati `addAllFromDatabase` funkciju** - dodati provjeru: ako je `generationType === 'industry'` i `selectedIndustry` nije prazan niti `'opcenito'`, filtriraj leadove po `industry` polju koje odgovara odabranoj industriji (label matching, case-insensitive).

2. **Azurirati gumb "Dodaj sve iz baze" u industry modu** - prikazati broj filtriranih leadova u zagradi, npr. "Dodaj sve iz baze (12)" umjesto bez broja.

3. **Pomocna funkcija `getFilteredEmailAddresses`** - nova funkcija koja poziva `getAllEmailAddresses()` i filtrira rezultate prema odabranoj industriji. Filtriranje se radi usporedbom `lead.industry` polja s labelom odabrane industrije (case-insensitive, partial match) jer se industry polje u bazi moze razlikovati od tocnog labela.

### Logika filtriranja

- Ako je `selectedIndustry === 'opcenito'` ili prazan: vrati sve leadove (bez filtera)
- Inace: filtriraj leadove cije `industry` polje sadrzi kljucnu rijec industrije (npr. za "hoteli" trazi "hotel" u lead.industry polju)
- Leadovi iz Lead Discovery (`discoveredLeads`) se takoder filtriraju po istom principu

### Promjena u UI-ju

- Gumb u industry modu pokazuje broj dostupnih leadova za tu industriju
- Toast poruka nakon dodavanja navodi industriju: "Dodano X email adresa za industriju: Hoteli i smjestaj"
