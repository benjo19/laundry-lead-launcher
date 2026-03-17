
Da, moguće je.

Trenutno webhook za email već šalje:
- `event_type`
- `data.subject`
- `data.content`
- `data.to_emails_list`
- `data.company_name` = ime aktivnog SaaS profila (`selectedProfile.name`, npr. `frkahr`, `automind`)

Ali trenutno ne šalje posebno ime klijenta kao odvojeno polje.

Plan:
1. U `EmailGenerator.tsx` proširiti payload za email webhook tako da uz postojeći `company_name` šalje i podatke o klijentu.
2. Dodati 2 odvojena polja za klijenta, jer si odabrao “oboje”:
   - `client_company_name` = naziv firme primatelja
   - `client_name` = ime osobe, ako postoji
3. Za `sent` event:
   - kod bulk slanja obogatiti svaki zapis u `recipients` nizu tako da ne sadrži samo `to_email` i `company`, nego i klijentove podatke kao zasebna polja
   - po potrebi na root `data` razinu dodati i agregirane vrijednosti za single-recipient scenarij radi lakšeg Make routanja
4. Za `draft` event:
   - kad postoji jedan odabrani kontakt, poslati ista polja (`client_company_name`, `client_name`) i u draft webhooku
   - ako je draft generički ili bez kontakta, polja ostaviti prazna / izostaviti
5. U `useMakeIntegration.ts` proširiti email formatter tako da ta nova polja prođu u finalni `unifiedData.data` objekt koji ide prema Make.com.
6. Po želji dodati i `schema` za email evente kako bi Make lakše prepoznao nova polja (`company_name`, `client_company_name`, `client_name`, `to_emails_list`, `recipients`).

Važna napomena:
- `company_name` će ostati ime SaaS profila, ne naziv klijenta.
- naziv klijenta i ime osobe ići će kao zasebna polja, da Make Router može razlikovati:
  - koji profil šalje (`company_name`)
  - kojem klijentu ide email (`client_company_name`, `client_name`)
  - koji je tip akcije (`event_type = draft | sent`)

Tehnički detalj:
- U trenutnom kodu već postoji dohvat kontakta preko `getAllEmailAddresses()` i `selectedContact`, ali ne vidim da model podataka trenutno jasno nosi “ime osobe” za email kontakte. Zato ću pri implementaciji:
  - prvo iskoristiti postojeće podatke ako ime osobe već postoji u lead/discovered lead zapisu
  - ako ne postoji, ostaviti `client_name` opcionalnim
- Za bulk slanje najčišći format bi bio ovakav:
```json
{
  "event_type": "sent",
  "data": {
    "company_name": "frkahr",
    "subject": "...",
    "content": "...",
    "to_emails_list": ["a@x.com", "b@y.com"],
    "recipients": [
      {
        "to_email": "a@x.com",
        "client_company_name": "Klijent d.o.o.",
        "client_name": "Ana"
      }
    ]
  }
}
```

Ako odobriš implementaciju, napravit ću to tako da radi i za draft i za send, bez slanja `sender_website`.
