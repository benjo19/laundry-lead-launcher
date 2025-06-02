
interface EmailGenerationParams {
  recipientCompany: string;
  recipientEmail: string;
  emailType: 'intro' | 'follow-up' | 'proposal' | 'reminder';
  additionalContext?: string;
  industry?: string;
  companyInfo?: {
    location?: string;
    website?: string;
    rating?: number;
    businessType?: string;
  };
}

interface GeneratedEmailContent {
  subject: string;
  content: string;
}

export class AIEmailService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generatePersonalizedEmail(params: EmailGenerationParams): Promise<GeneratedEmailContent> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(params);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate email');
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        throw new Error('No content generated');
      }

      return this.parseGeneratedEmail(generatedText);
    } catch (error) {
      console.error('AI Email generation error:', error);
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `Ti si ekspert za B2B marketing i prodaju. Tvoj zadatak je kreiranje personaliziranih, profesionalnih emailova na hrvatskom jeziku za Marketing Agent platformu.

VAŽNE SMJERNICE:
- Uvijek piši na hrvatskom jeziku
- Budi profesionalan ali pristupačan
- Fokusiraj se na koristi za klijenta, ne na funkcionalnosti
- Koristi konkretne brojke i primjere kad god možeš
- Prilagodi ton prema vrsti emaila
- Email treba biti kratak i direktan (maksimalno 200 riječi)
- Uvijek završi jasnim pozivom na akciju

STRUKTURA ODGOVORA:
Odgovori u sljedećem formatu:
SUBJECT: [naslov emaila]
CONTENT: [sadržaj emaila]

Marketing Agent platforma pomaže tvrtkama:
- Automatsko pronalaženje novih klijenata
- Personalizirane email kampanje
- CRM podsjetnici
- Automatsko generiranje sadržaja za društvene mreže
- Povećanje broja klijenata za 40-60%
- Smanjenje vremena utrošenog na marketing za 70%`;
  }

  private buildUserPrompt(params: EmailGenerationParams): string {
    const { recipientCompany, recipientEmail, emailType, additionalContext, industry, companyInfo } = params;

    let prompt = `Generiraj ${this.getEmailTypeDescription(emailType)} email za:

TVRTKA: ${recipientCompany}
EMAIL: ${recipientEmail}`;

    if (industry) {
      prompt += `\nINDUSTRIJA: ${industry}`;
    }

    if (companyInfo) {
      if (companyInfo.location) prompt += `\nLOKACIJA: ${companyInfo.location}`;
      if (companyInfo.website) prompt += `\nWEBSITE: ${companyInfo.website}`;
      if (companyInfo.rating) prompt += `\nREJTING: ${companyInfo.rating}/5`;
      if (companyInfo.businessType) prompt += `\nTIP POSLOVANJA: ${companyInfo.businessType}`;
    }

    if (additionalContext) {
      prompt += `\nDODATNE INFORMACIJE: ${additionalContext}`;
    }

    prompt += `\n\nPersonaliziraj email specifično za ${recipientCompany} koristeći dostupne informacije.`;

    return prompt;
  }

  private getEmailTypeDescription(type: string): string {
    const descriptions = {
      'intro': 'uvodnu prezentaciju',
      'follow-up': 'follow-up',
      'proposal': 'poslovni prijedlog',
      'reminder': 'podsjetnik'
    };
    return descriptions[type as keyof typeof descriptions] || 'personalizirani';
  }

  private parseGeneratedEmail(text: string): GeneratedEmailContent {
    const lines = text.split('\n');
    let subject = '';
    let content = '';
    let isContent = false;

    for (const line of lines) {
      if (line.startsWith('SUBJECT:')) {
        subject = line.replace('SUBJECT:', '').trim();
      } else if (line.startsWith('CONTENT:')) {
        isContent = true;
        content = line.replace('CONTENT:', '').trim();
      } else if (isContent && line.trim()) {
        content += '\n' + line;
      }
    }

    // Fallback ako parsing ne radi kako treba
    if (!subject || !content) {
      const parts = text.split('\n\n');
      subject = parts[0]?.replace('SUBJECT:', '').trim() || 'Personalizirani prijedlog - Marketing Agent';
      content = parts.slice(1).join('\n\n').replace('CONTENT:', '').trim() || text;
    }

    return { subject, content };
  }
}
