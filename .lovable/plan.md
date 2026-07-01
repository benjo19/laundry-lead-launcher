## Cilj
Prebaciti slanje emaila prema Make webhooku iz "jedan payload s recipients arrayem" u **jedan email s više primatelja u BCC** — AI generira samo jednom, primatelji se ne vide međusobno.

## Ključne promjene

### 1. Parsiranje emailova iz `manualEmailInput` (`src/components/EmailGenerator.tsx`)
Nova helper funkcija `parseEmails(input: string)`:
- Splita po `,`, `;`, novom redu i razmaku (regex `/[\s,;]+/`)
- Trim + lowercase
- Validira format (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
- Deduplikacija preko `Set`
- Vraća `{ valid: string[], invalid: string[] }`
Primjenjuje se i pri dodavanju kroz UI (`addManualEmail`) i pri finalnoj sanitizaciji u `sendEmail` / `saveDraft`.

### 2. Novi payload format (i za `sendEmail` i za `saveDraft`)
Umjesto `recipients: [...]` iteratora, gradi payload:
```json
{
  "event_type": "draft" | "sent",
  "data": {
    "subject": "...",
    "content": "...",
    "company_name": "<selectedProfile.name>",
    "to_email": "auto.mind.ai2025@gmail.com",
    "to_emails_list": ["a@x.com","b@y.com"],
    "bcc_emails": "a@x.com, b@y.com"
  },
  "idempotency_key": "<uuid>"
}
```
- `to_email` = fiksni sender/primary (`auto.mind.ai2025@gmail.com`) — konfigurirano kao konstanta na vrhu komponente.
- `to_emails_list` = array validiranih dedupiranih emailova.
- `bcc_emails` = isti popis, joined s `", "`.
- `idempotency_key` = `crypto.randomUUID()` (fallback `Date.now()+random`).
- `console.log('📤 Final webhook payload:', payload)` prije poziva.

### 3. Slanje kroz `useMakeIntegration.triggerWebhook`
Trenutno `triggerWebhook(eventType, data)` interno wrap-a: `{ event_type, data, ... }`. Provjeriti da:
- Ne dodaje `recipients` iterator strukturu.
- Prosljeđuje `idempotency_key` iz payload podataka na top-level (već postoji za draft — proširit ću i za sent).

Ako `useMakeIntegration` trenutno automatski ubacuje `recipients` polje, ukloniti to za ovaj flow — pozivat ćemo s čistim `data` objektom točno kako je specificirano.

### 4. Uklanjanje starog per-recipient bulk send koda
- Skinuti `bulkSendProgress` loop koji označava svakog primatelja pojedinačno (ostaje samo jedan status: success/fail za cijeli send).
- `sendStatuses` map ostaje, ali se puni jednom vrijednošću po primatelju na temelju rezultata jednog webhook poziva (svi success ili svi fail).

### 5. AI generacija — bez promjene
Već generira jednom (`generateEmail`) — samo osigurati da se ne poziva po primatelju.

## Datoteke
- `src/components/EmailGenerator.tsx` — glavne izmjene (parse, payload, send, saveDraft).
- `src/hooks/useMakeIntegration.ts` — mala prilagodba: propuštanje `to_emails_list` / `bcc_emails` netaknuto u `data`, `idempotency_key` na top-level i za `sent`, bez dodavanja `recipients` arraya.

## Van opsega
- Make.com scenarij (korisnik sam prilagođava mapping — Iterator više nije potreban).
- Backend/edge funkcije.
- UI redizajn.
