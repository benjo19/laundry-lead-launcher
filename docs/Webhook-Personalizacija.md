# Webhook Personalizacija - Uputstvo za Korisnike

Ova aplikacija podržava personalizovane integracije sa vanjskim servisima. **Svaki korisnik konfiguriše svoje vlastite webhook URL-ove i integracije**, što znači da vaši podaci idu samo na vaše servise.

---

## 🔗 Zapier Integracija

### Šta je Zapier?
Zapier je alat za automatizaciju koji povezuje različite aplikacije i servise. Možete kreirati "Zaps" (automatizacije) koje se pokreću kada se nešto dogodi u ovoj aplikaciji.

### Kako Postaviti Zapier Integraciju

#### Korak 1: Kreirajte Zapier Account
1. Idite na [zapier.com](https://zapier.com)
2. Napravite besplatan nalog
3. Kliknite na "Create Zap"

#### Korak 2: Podesite Webhook Trigger
1. U Zapier-u, izaberite **"Webhooks by Zapier"** kao trigger aplikaciju
2. Izaberite **"Catch Hook"** kao trigger event
3. Kliknite **Continue**
4. **Kopirajte Custom Webhook URL** - izgleda ovako:
   ```
   https://hooks.zapier.com/hooks/catch/123456/abcdef/
   ```

#### Korak 3: Unesite Webhook URL u Aplikaciju
1. U aplikaciji, idite na **Settings → Integrations → Zapier**
2. Zalijepite vaš webhook URL u polje "Zapier Webhook URL"
3. Kliknite **Save** da sačuvate
4. Kliknite **Test Connection** da testirate

#### Korak 4: Podesite Action u Zapier-u
Nakon što testirate connection, vratite se u Zapier i:
1. Kliknite na **Test trigger** - trebali biste vidjeti test podatke
2. Dodajte **Action** (npr. Google Sheets, Email, Slack, itd.)
3. Mapirajte polja iz webhookas prema vašoj akciji
4. Testirajte i aktivirajte Zap

### Primjeri Zapier Akcija

#### 📊 Dodaj Lead u Google Sheets
**Trigger:** Webhook prima novi lead
**Action:** Dodaj red u Google Sheets sa:
- Company name
- Email
- Phone
- Status
- Timestamp

#### 📧 Pošalji Email Notifikaciju
**Trigger:** Webhook prima reminder
**Action:** Pošalji email sa detaljima o reminder-u

#### 💬 Slack Notifikacija
**Trigger:** Webhook prima novi lead
**Action:** Pošalji poruku u Slack kanal

#### 📅 Kreiraj Trello Card
**Trigger:** Webhook prima novi lead
**Action:** Kreiraj Trello karticu sa lead detaljima

### Test Podaci Format

Kada šaljete test, webhook prima JSON podatke u ovom formatu:

```json
{
  "test": true,
  "timestamp": "2025-01-23T10:30:00.000Z",
  "message": "Test data from your app",
  "triggered_from": "https://your-app.com"
}
```

Kada aplikacija automatski šalje podatke (npr. novi lead), format je:

```json
{
  "type": "new_lead",
  "data": {
    "company": "Example Corp",
    "email": "contact@example.com",
    "phone": "+123456789",
    "status": "Nova",
    "created_at": "2025-01-23T10:30:00.000Z"
  },
  "timestamp": "2025-01-23T10:30:00.000Z"
}
```

---

## 📅 Google Calendar Integracija

### Dvije Opcije za Integraciju

#### **Opcija 1: Jednostavna Integracija (Preporučeno za početnike)**
- Ne zahtijeva API keys
- Kreira Google Calendar linkove
- Klik na link otvara Google Calendar sa predpopunjenim podacima
- Manualno potvrđujete da li želite dodati event

**Kako Koristiti:**
1. U Settings → Integrations → Google Calendar
2. Izaberite "Simple Integration"
3. Kliknite **Activate Simple Integration**
4. Kada kreirate reminder, dobit ćete link koji vodi na Google Calendar

#### **Opcija 2: API Integracija (Napredna)**
- Automatski dodaje evente u vaš kalendar
- Zahtijeva Google Cloud API credentials
- Nema manualne potvrde - direktno dodaje event

**Kako Postaviti API Integraciju:**

##### Korak 1: Kreirajte Google Cloud Project
1. Idite na [Google Cloud Console](https://console.cloud.google.com)
2. Kreirajte novi projekat
3. Omogućite **Google Calendar API**

##### Korak 2: Kreirajte OAuth 2.0 Credentials
1. Idite na **APIs & Services → Credentials**
2. Kliknite **Create Credentials → OAuth Client ID**
3. Izaberite **Web application**
4. Dodajte **Authorized JavaScript origins:**
   ```
   https://your-app-domain.com
   http://localhost:5173  (za development)
   ```
5. Dodajte **Authorized redirect URIs:**
   ```
   https://your-app-domain.com
   http://localhost:5173  (za development)
   ```
6. **Kopirajte Client ID**

##### Korak 3: Kreirajte API Key
1. U istom Google Cloud Console
2. **APIs & Services → Credentials**
3. Kliknite **Create Credentials → API Key**
4. **Kopirajte API Key**
5. (Opcionalno) Ograničite API key samo na Google Calendar API

##### Korak 4: Unesite Credentials u Aplikaciju
1. U Settings → Integrations → Google Calendar
2. Unesite **Client ID**
3. Unesite **API Key**
4. Izaberite **Calendar ID** (obično "primary")
5. Omogućite **Auto Sync** ako želite
6. Kliknite **Connect**

##### Korak 5: Autorizujte Aplikaciju
1. Google će otvoriti popup za prijavu
2. Izaberite vaš Google account
3. Dozvolite aplikaciji pristup vašem kalendaru
4. Nakon uspješne autorizacije, vidjet ćete **"Connected"** status

### Test Connection
Kada ste povezani, možete testirati:
1. Kliknite **Test Connection**
2. Trebali biste vidjeti listu vaših kalendara
3. Ako uspješno, znači da je integracija aktivna

### Troubleshooting Google Calendar

**Problem:** "Error connecting to Google Calendar"
- Provjerite da li je Google Calendar API omogućen u Cloud Console
- Provjerite da li su Client ID i API Key tačni
- Provjerite Authorized JavaScript origins u Cloud Console

**Problem:** "Access denied"
- Provjerite OAuth consent screen podešavanja
- Dodajte svoj email u Test Users ako je app u "Testing" statusu

**Problem:** "Invalid credentials"
- Regenerišite API Key u Cloud Console
- Kreirajte novi OAuth Client ID

---

## 🔧 Make.com Integracija

### Šta je Make.com (bivši Integromat)?
Make.com je napredna platforma za automatizaciju, slična Zapier-u ali sa većim mogućnostima za kompleksne scenarije.

### Kako Postaviti Make.com Integraciju

#### Korak 1: Kreirajte Make.com Account
1. Idite na [make.com](https://www.make.com)
2. Napravite besplatan nalog
3. Kreirajte novi scenario

#### Korak 2: Dodajte Webhook Module
1. Kliknite na **"+"** da dodate modul
2. Izaberite **"Webhooks"**
3. Izaberite **"Custom webhook"**
4. Kreirajte novi webhook ili izaberite postojeći
5. **Kopirajte webhook URL**

#### Korak 3: Unesite URL u Aplikaciju
1. U aplikaciji, idite na **Settings → Integrations → Make.com**
2. Zalijepite webhook URL u polje
3. Kliknite **Save**
4. Kliknite **Test Connection**

#### Korak 4: Podesite Scenario u Make.com
1. Vratite se u Make.com scenario
2. Kliknite **"Run once"** da prihvatite test podatke
3. Dodajte module za obradu podataka (Router, Filter, itd.)
4. Dodajte action module (Google Sheets, CRM, Email, itd.)
5. Aktivirajte scenario

### Primjeri Make.com Scenarija

#### 📊 Multi-Sheet Lead Tracking
**Trigger:** Webhook prima lead
**Actions:**
1. **Filter:** Provjerava status leada
2. **Router:** 
   - Ako je status "Hot" → Dodaj u "Priority Leads" sheet
   - Ako je "Cold" → Dodaj u "Follow-up" sheet
3. **Slack:** Pošalji notifikaciju za hot leads

#### 📧 Advanced Email Campaigns
**Trigger:** Webhook prima novi kontakt
**Actions:**
1. **Gmail:** Pošalji welcome email
2. **Delay:** Čekaj 3 dana
3. **Gmail:** Pošalji follow-up email
4. **Google Sheets:** Loguj email aktivnost

#### 🔄 Multi-Platform Sync
**Trigger:** Webhook prima lead
**Actions:**
1. **Google Sheets:** Dodaj lead
2. **HubSpot:** Kreiraj kontakt
3. **Slack:** Notifikacija
4. **Trello:** Kreiraj karticu

### Data Format

Make.com prima iste podatke kao Zapier. Primjer:

```json
{
  "type": "content_created",
  "data": {
    "platform": "LinkedIn",
    "content": "Post content here...",
    "scheduled_time": "2025-01-25T10:00:00.000Z"
  },
  "timestamp": "2025-01-23T10:30:00.000Z"
}
```

---

## 🔐 Sigurnost i Privatnost

### Vaši Podaci su Privatni
- **Svaki korisnik ima svoje webhook URL-ove** spremljene u bazi podataka
- **RLS (Row Level Security) policies** osiguravaju da samo vi možete vidjeti svoje podatke
- **Nema zajedničkih webhook-ova** - svaki korisnik konfiguriše svoje

### Najbolje Prakse
1. **Čuvajte webhook URL-ove privatnim** - nemojte dijeliti na javnim mjestima
2. **Testirajte integracije** prije nego što ih aktivirate
3. **Koristite HTTPS** uvijek kada je moguće
4. **Redovno provjeravajte** koje aplikacije imaju pristup vašim podacima

### Multi-Device Sync
- Vaše podešavanja su spremljena u cloud bazi
- Možete pristupiti istim integracijama sa bilo kog uređaja
- Promjene se automatski sinhronizuju

---

## ❓ Često Postavljana Pitanja (FAQ)

### Q: Da li moraju svi korisnici da podese svoje integracije?
**A:** Da, svaki korisnik mora unijeti svoje webhook URL-ove jer podaci idu direktno na njihove servise (Google Sheets, Calendar, itd.).

### Q: Šta ako izgubim svoj webhook URL?
**A:** Možete ga uvijek pronaći u vašem Zapier/Make.com account-u i ponovo ga unijeti u aplikaciji.

### Q: Da li mogu koristiti više webhook-ova istovremeno?
**A:** Da, možete konfigurisati Zapier, Make.com, i Google Calendar istovremeno.

### Q: Koliko košta?
**A:** Zapier, Make.com, i Google Calendar nude besplatne tier-ove koji su dovoljni za većinu korisnika.

### Q: Šta se šalje putem webhook-a?
**A:** Samo podaci relevantni za event (npr. lead info, reminder detalji). Ne šalje se ništa osjetljivo kao passwordi.

### Q: Mogu li vidjeti webhook-ove drugih korisnika?
**A:** Ne, svaki korisnik vidi samo svoje webhook URL-ove. Ovo je zaštićeno Row Level Security politikama.

### Q: Šta ako promijenim webhook URL?
**A:** Jednostavno unesite novi URL u aplikaciji i sačuvajte. Stari će biti automatski zamijenjen.

---

## 📞 Podrška

Ako imate problema ili pitanja:
1. Provjerite **Test Connection** button da vidite status
2. Provjerite konzolu u browser-u za error poruke (F12)
3. Provjerite da li su URL-ovi tačni
4. Kontaktirajte podršku sa detaljima problema

---

## 🎓 Video Tutoriali (Planirano)

- [ ] Zapier Setup - Korak po korak
- [ ] Google Calendar API Configuration
- [ ] Make.com Advanced Scenarios
- [ ] Common Troubleshooting Issues

---

**Verzija:** 1.0  
**Zadnje Ažuriranje:** 23. Januar 2025
