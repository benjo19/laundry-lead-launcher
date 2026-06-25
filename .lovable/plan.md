## Cilj
Filteri grada/države u Lead Hunteru sada krivo izvlače komponente jer se `lead.location` razbija po zarezima i pretpostavlja se fiksni redoslijed. Riješiti tako da se (a) prilikom spremanja leada zapišu `city` i `country` direktno (iz Google `address_components`), i (b) postoji jedan robustan helper koji parsira postojeće slobodno-tekstualne adrese kao fallback.

## Što treba napraviti

1. **Edge function `google-maps-lead-search`** — proširiti `detailsFields` s `address_components` i `address_component`, te u responseu vraćati `address_components` po placeu. To je glavni izvor istine.

2. **`SearchOperations.ts`** — proslijediti `address_components` u `DiscoveredLead` (dodati polje), kao i izveden `city`/`country`.

3. **Novi helper `src/utils/locationParser.ts`** — jedna funkcija:
   ```
   parseLocation(location?: string, components?: GoogleAddressComponent[]): { city, country, postalCode, street }
   ```
   - Ako su dani `address_components`, koristi `types` (`locality`, `postal_town`, `administrative_area_level_2`, `country`, `postal_code`) — pouzdano.
   - Inače regex fallback nad slobodnim tekstom: prepoznati zadnji segment kao zemlju (ako odgovara poznatim ISO/Croatian nazivima ili je čisti tekst bez brojeva), izvući poštanski broj uzorkom `\b\d{4,6}\b` i ono što ostane uz njega tretirati kao grad. Pokriti uobičajene Google formate:
     - `Ulica 1, 10000 Zagreb, Hrvatska`
     - `Ulica 1, Zagreb, Hrvatska`
     - `10000 Zagreb`
     - `Zagreb, Croatia`

4. **`useLeadAddition.ts`** — pri spremanju leada koristiti `parseLocation` i upisati `country` (postoji) te dodati upis grada u `notes`/`location` po potrebi. Postojeća kolona `country` već postoji u tablici `leads`.

5. **Migration** — dodati kolonu `city text` u `public.leads` (nullable) i indeks `(city)`, `(country)` za filtere.

6. **`LeadHunter.tsx` (linije 46–101)** — zamijeniti split-po-zarezu logiku s:
   - `uniqueCities` = unique iz `lead.city ?? parseLocation(lead.location).city`
   - `uniqueCountries` = unique iz `lead.country ?? parseLocation(lead.location).country`
   - Isto pravilo u `filteredLeads` umjesto trenutnog `parts[...]`.

7. **Backfill** — jednokratna SQL `UPDATE` koji za postojeće retke gdje je `city`/`country` NULL pokuša popuniti iz `location` preko jednostavnog SQL regexa (postavlja `country` na zadnji segment, `city` na pretposljednji bez brojeva). Konzervativno — kompleksne slučajeve preskačemo, frontend fallback `parseLocation` će ih ionako pokriti.

## Tehnički detalji
- `parseLocation` čisti helper, bez ovisnosti — testabilan.
- Ne diramo Apify flow (već vraća slično formatiranu adresu — fallback regex je dovoljan); kada postoji vrijeme može se i tamo dodati structured parsing.
- Filtri ostaju klijent-side; brzina ostaje ista jer rezultat memoiziramo.

## Što se NE mijenja
- UI izgled filtera, ostatak Lead Huntera, drugi search backendi (Apify/Firecrawl) — i dalje koriste fallback parser.
