

# Plan: Slanje svih primatelja u jednom webhook pozivu

## Sto se mijenja

Umjesto slanja zasebnog webhook poziva za svaki email, svi primatelji i njihovi podaci ce se poslati u **jednom JSON webhook pozivu**. Tako Make.com/Zapier odmah dobije kompletnu listu svih email adresa i moze ih automatski obraditi.

## Tehnicke promjene

### Datoteka: `src/components/EmailGenerator.tsx`

**Trenutno ponasanje:** Za svakog primatelja salje se zaseban webhook poziv s jednim emailom.

**Novo ponasanje:** 
1. Prije petlje za slanje, pripremi se jedan JSON objekt sa svim primateljima
2. Posalji jedan webhook poziv sa svim podacima
3. Petlja za individualno slanje ostaje za spremanje u bazu i pracenje progresa

**Struktura novog webhook payloada:**
```json
{
  "event_type": "sent",
  "timestamp": "2026-02-23T...",
  "user_id": "...",
  "data": {
    "subject": "Naslov emaila",
    "content": "<p>HTML sadrzaj</p>",
    "total_recipients": 5,
    "recipients": [
      {
        "to_email": "ana@firma1.hr",
        "company": "Firma 1"
      },
      {
        "to_email": "ivan@firma2.hr",
        "company": "Firma 2"
      }
    ]
  },
  "schema": {
    "subject": "string",
    "content": "string",
    "total_recipients": "number",
    "recipients": "array"
  }
}
```

**Konkretne promjene u kodu:**
- Prije `for` petlje (oko linije 289), dodati pripremu bulk payloada sa svim primateljima
- Poslati jedan `triggerWebhook('sent', bulkPayload)` poziv prije petlje
- Zadrzati petlju samo za spremanje u bazu (bez individualnih webhook poziva)
- Ukloniti `triggerWebhook` poziv iz petlje (linija 307)

### Datoteka: `src/hooks/useMakeIntegration.ts`

- Nema strukturalnih promjena - `triggerWebhook` vec prima bilo koji `data` objekt
- Webhook ce automatski proslijediti novi format jer koristi `JSON.stringify`

## Korisnicko iskustvo

Korisnik nece primijetiti razliku u UI-ju. Jedina promjena je da Make.com/Zapier sada prima sve email adrese odjednom u jednom pozivu, sto omogucuje automatsku obradu svih primatelja bez visestrukih triggera.

