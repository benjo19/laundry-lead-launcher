
# Marketing Agent - Kompletna Dokumentacija Aplikacije

## Pregled Aplikacije

Marketing Agent je AI-powered web aplikacija za marketing automation i CRM, razvijena u React-u s TypeScript-om. Aplikacija koristi Supabase za backend i autentifikaciju, te integrirane AI servise za generiranje sadržaja.

## Tehnički Stack

### Frontend
- **React 18** s TypeScript
- **Vite** - build tool
- **Tailwind CSS** - styling
- **Shadcn UI** - komponente
- **React Router** - navigacija
- **Tanstack Query** - data fetching
- **Lucide React** - ikone

### Backend & Baza
- **Supabase** - Backend as a Service
- **PostgreSQL** - glavna baza podataka
- **Supabase Auth** - autentifikacija
- **Supabase Edge Functions** - serverless funkcije

### AI Integracije
- OpenAI GPT modeli za generiranje sadržaja
- AI email generator
- AI content booster
- AI lead analysis

## Struktura Aplikacije

```
src/
├── components/           # UI komponente
│   ├── ui/              # Shadcn UI komponente
│   ├── content-booster/ # Content generation
│   ├── crm/            # CRM funkcionalnosti
│   └── lead-discovery/  # Lead discovery
├── pages/              # Stranice
│   ├── Index.tsx       # Dashboard
│   ├── Auth.tsx        # Prijava/registracija
│   └── NotFound.tsx    # 404 stranica
├── hooks/              # Custom hooks
├── services/           # AI servisi
├── types/              # TypeScript tipovi
├── contexts/           # React konteksti
├── integrations/       # Supabase integracija
└── lib/               # Utility funkcije
```

## Ključne Funkcionalnosti

### 1. Autentifikacija
- Email/password prijava
- Google OAuth
- Registracija novih korisnika
- Session management
- Protected routes

### 2. Lead Discovery & Hunter
- AI-powered pretraživanje leadova
- Filtriranje po industriji i lokaciji
- Analiza potencijala leadova
- Automatsko dodavanje u CRM
- Export funkcionalnosti

### 3. Email Generator
- AI generiranje personalnih emailova
- Template sustav
- Bulk email sending
- Email tracking (open/click rates)
- Integration s email providerima

### 4. Content Booster
- AI generiranje social media sadržaja
- Multi-platform podrška (LinkedIn, Facebook, Instagram)
- Content kalendar
- Automated posting
- Engagement tracking

### 5. CRM Sustav
- Lead management
- Status tracking
- Notes i komentari
- Reminders i taskovi
- Analytics i izvještaji

### 6. Analytics Dashboard
- Lead conversion metrics
- Email performance
- Content engagement
- ROI tracking
- Custom reports

### 7. Settings & Configuration
- Business profile setup
- AI model konfiguracija
- Email provider settings
- Social media integration
- Language preferences (HR/EN)

## Baza Podataka Schema

### Tablice

#### `profiles`
```sql
CREATE TABLE profiles (
  id uuid references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

#### `leads`
```sql
CREATE TABLE leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  company text not null,
  email text,
  phone text,
  location text,
  employees text,
  industry text,
  website text,
  status text default 'Nova',
  potential text default 'Srednji',
  source text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

#### `emails`
```sql
CREATE TABLE emails (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  to_email text not null,
  subject text not null,
  content text not null,
  template text,
  status text default 'Draft',
  sent_at timestamp with time zone,
  open_rate text,
  click_rate text,
  created_at timestamp with time zone default now()
);
```

#### `user_settings`
```sql
CREATE TABLE user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  business_profile jsonb,
  ai_settings jsonb,
  email_settings jsonb,
  email_provider text,
  social_platforms jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## AI Servisi

### 1. AI Email Service (`src/services/aiEmailService.ts`)
```typescript
export interface EmailGenerationRequest {
  recipientName: string;
  recipientCompany: string;
  senderName: string;
  senderCompany: string;
  purpose: string;
  tone: 'professional' | 'friendly' | 'casual';
  language: 'hr' | 'en';
}

export const generateEmail = async (request: EmailGenerationRequest): Promise<string>
```

### 2. AI Content Service (`src/services/aiContentService.ts`)
```typescript
export interface ContentGenerationRequest {
  platform: 'LinkedIn' | 'Facebook' | 'Instagram';
  contentType: 'tip' | 'case-study' | 'news' | 'promotional';
  topic: string;
  targetAudience: string;
  tone: string;
  language: 'hr' | 'en';
}

export const generateContent = async (request: ContentGenerationRequest): Promise<string>
```

### 3. AI Lead Analysis Service (`src/services/aiLeadAnalysisService.ts`)
```typescript
export interface LeadAnalysisRequest {
  company: string;
  industry: string;
  location: string;
  employees: string;
  website?: string;
}

export const analyzeLead = async (request: LeadAnalysisRequest): Promise<LeadAnalysisResult>
```

## Supabase Edge Functions

### 1. Generate Email Function
```typescript
// supabase/functions/generate-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { recipientName, recipientCompany, purpose, tone, language } = await req.json()
  
  // OpenAI API poziv za generiranje emaila
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a ${tone} email in ${language}...`
        },
        {
          role: 'user',
          content: `Create email for ${recipientName} from ${recipientCompany}...`
        }
      ]
    })
  })
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 2. Social Post Function
```typescript
// supabase/functions/social-post/index.ts
serve(async (req) => {
  const { platform, contentType, topic, targetAudience, tone, language } = await req.json()
  
  // AI generiranje social media sadržaja
  // Return generated content
})
```

### 3. Send Email Function
```typescript
// supabase/functions/send-email/index.ts
serve(async (req) => {
  const { to, subject, content, template } = await req.json()
  
  // Integracija s email providerima (SendGrid, Mailgun, etc.)
  // Email sending logic
})
```

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://uwtzhkdgprmrmknjrfeb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (za Edge Functions)
OPENAI_API_KEY=sk-...

# Email Providers
SENDGRID_API_KEY=SG...
MAILGUN_API_KEY=...

# Social Media APIs
LINKEDIN_CLIENT_ID=...
FACEBOOK_APP_ID=...
INSTAGRAM_CLIENT_ID=...
```

## Google OAuth Setup

### 1. Google Cloud Console
1. Kreirajte novi projekt u Google Cloud Console
2. Omogućite Google+ API
3. Kreirajte OAuth 2.0 credentials
4. Dodajte authorized origins i redirect URIs:
   - Origins: `http://localhost:3000`, `https://uwtzhkdgprmrmknjrfeb.supabase.co`
   - Redirects: `https://uwtzhkdgprmrmknjrfeb.supabase.co/auth/v1/callback`

### 2. Supabase Configuration
1. Authentication > Providers > Google
2. Omogućite Google provider
3. Dodajte Client ID i Client Secret
4. Postavite redirect URL: `https://uwtzhkdgprmrmknjrfeb.supabase.co/auth/v1/callback`

### 3. URL Configuration
Site URL: `http://localhost:3000`
Redirect URLs:
- `http://localhost:3000`
- `https://uwtzhkdgprmrmknjrfeb.supabase.co/auth/v1/callback`

## Installation & Setup

### 1. Dependencies Installation
```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install react-router-dom
npm install lucide-react
npm install @radix-ui/react-*
npm install tailwindcss
npm install class-variance-authority
npm install clsx tailwind-merge
npm install react-hook-form @hookform/resolvers
npm install zod
npm install date-fns
npm install recharts
```

### 2. Tailwind CSS Setup
```javascript
// tailwind.config.ts
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        // ... ostali custom colors
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}
```

### 3. Shadcn UI Setup
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
```

## Deployment

### 1. Supabase Project Setup
1. Kreirajte novi Supabase projekt
2. Postavite bazu podataka schema
3. Konfigurirajte Authentication providers
4. Deploy Edge Functions
5. Postavite environment variables

### 2. Frontend Deployment
```bash
npm run build
# Deploy na Vercel, Netlify ili drugoj platformi
```

### 3. Environment Configuration
Postavite production environment variables:
- Supabase URL i keys
- OpenAI API key
- Email provider keys
- Social media API keys

## Sigurnosne Napomene

### 1. Row Level Security (RLS)
```sql
-- Omogućite RLS na svim tablicama
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies za leads tablicu
CREATE POLICY "Users can only see their own leads" ON leads
    FOR ALL USING (auth.uid() = user_id);

-- Policies za emails tablicu  
CREATE POLICY "Users can only see their own emails" ON emails
    FOR ALL USING (auth.uid() = user_id);
```

### 2. API Key Security
- Nikad ne stavljajte API keyeve u frontend kod
- Koristite environment variables
- Implementirajte rate limiting
- Validirajte sve user inpute

## Testing

### 1. Unit Tests
```bash
npm install --save-dev vitest @testing-library/react
npm run test
```

### 2. E2E Tests
```bash
npm install --save-dev playwright
npm run test:e2e
```

## Tipovi i Interfejsi

### Lead Interface
```typescript
export interface Lead {
  id: string;
  company: string;
  location: string;
  employees: string;
  phone: string;
  email: string;
  status: 'Nova' | 'Kontaktiran' | 'Zainteresiran' | 'Odbačen' | 'Zatvoren';
  potential: 'Visok' | 'Srednji' | 'Nizak';
  dateAdded: string;
  notes?: string;
  industry?: string;
  website?: string;
  source?: string;
}
```

### Email Interface
```typescript
export interface Email {
  id: string;
  to: string;
  subject: string;
  content: string;
  template?: string;
  dateSent: string;
  status: 'Draft' | 'Sent' | 'Failed';
  openRate?: string;
  clickRate?: string;
}
```

### Content Post Interface
```typescript
export interface ContentPost {
  id: string;
  platform: 'LinkedIn' | 'Facebook' | 'Instagram';
  content: string;
  contentType: 'tip' | 'case-study' | 'news' | 'promotional';
  date: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  engagement?: string;
  scheduledTime?: string;
}
```

## Troubleshooting

### Česti Problemi

1. **Google OAuth Error "requested path is invalid"**
   - Provjerite Site URL i Redirect URLs u Supabase
   - Provjerite Authorized origins u Google Cloud Console

2. **Supabase Connection Issues**
   - Provjerite environment variables
   - Provjerite network connectivity
   - Provjerite Supabase project status

3. **AI Service Errors**
   - Provjerite OpenAI API key
   - Provjerite rate limits
   - Provjerite input validation

## Dodatne Napomene

### Performance Optimizacija
- Koristite React.memo za komponente
- Implementirajte lazy loading
- Optimizirajte database queries
- Koristite CDN za statične resurse

### Skalabilnost
- Implementirajte caching strategiju
- Koristite database indexe
- Implementirajte queue sustav za background taskove
- Monitorirajte performance metrics

### Maintenance
- Redovito updateajte dependencies
- Implementirajte backup strategiju
- Monitorirajte error logs
- Implementirajte health check endpointe

---

**Verzija dokumentacije:** 1.0  
**Datum:** 2024-01-08  
**Autor:** Marketing Agent Development Team
