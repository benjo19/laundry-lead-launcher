
import { AIProvider } from './aiEmailService';

interface ContentGenerationParams {
  platform: string;
  contentType: string;
  industry: string;
  companyName?: string;
  topic?: string;
  additionalContext?: string;
}

interface GeneratedContent {
  content: string;
}

export class AIContentService {
  private apiKey: string;
  private provider: AIProvider;

  constructor(apiKey: string, provider: AIProvider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async generateContent(params: ContentGenerationParams): Promise<GeneratedContent> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(params);

    try {
      if (this.provider === 'gemini') {
        return await this.generateWithGemini(systemPrompt, userPrompt);
      } else {
        return await this.generateWithOpenAI(systemPrompt, userPrompt);
      }
    } catch (error) {
      console.error('AI Content generation error:', error);
      throw error;
    }
  }

  private async generateWithOpenAI(systemPrompt: string, userPrompt: string): Promise<GeneratedContent> {
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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate content with OpenAI');
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated from OpenAI');
    }

    return { content: generatedText };
  }

  private async generateWithGemini(systemPrompt: string, userPrompt: string): Promise<GeneratedContent> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 500,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate content with Gemini');
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini');
    }

    return { content: generatedText };
  }

  private buildSystemPrompt(): string {
    return `Ti si ekspert za marketing sadržaj i društvene mreže. Tvoj zadatak je kreiranje angažirajućeg sadržaja na hrvatskom jeziku za različite industrije i platforme.

VAŽNE SMJERNICE:
- Uvijek piši na hrvatskom jeziku
- Prilagodi ton i stil prema platformi (LinkedIn profesionalno, Facebook opuštenо, Instagram vizualno)
- Koristi relevantne hashtag-ove i emoji-je
- Sadržaj treba biti kratak i direktan (maksimalno 200 riječi za LinkedIn, 150 za Facebook, 100 za Instagram)
- Fokusiraj se na vrijednost za čitatelje
- Koristi konkretne primjere i savjete kada god možeš

STRUKTURA ODGOVORA:
Generiraj SAMO sadržaj objave, bez dodatnih objašnjenja.`;
  }

  private buildUserPrompt(params: ContentGenerationParams): string {
    const { platform, contentType, industry, companyName, topic, additionalContext } = params;

    let prompt = `Generiraj ${this.getContentTypeDescription(contentType)} za ${platform} socijalnu mrežu.

INDUSTRIJA: ${industry}`;

    if (companyName) {
      prompt += `\nTVRTKA: ${companyName}`;
    }

    if (topic) {
      prompt += `\nTEMA: ${topic}`;
    }

    if (additionalContext) {
      prompt += `\nDODATNE INFORMACIJE: ${additionalContext}`;
    }

    prompt += `\n\nKreiraj sadržaj koji je relevantan za ${industry} industriju i prilagođen ${platform} platformi.`;

    return prompt;
  }

  private getContentTypeDescription(type: string): string {
    const descriptions = {
      'tip': 'korisni savjet ili tip',
      'case-study': 'studiju slučaja',
      'news': 'objavu o novostima',
      'promotional': 'promocijski sadržaj',
      'educational': 'edukacijski sadržaj',
      'behind-scenes': 'iza kulisa sadržaj'
    };
    return descriptions[type as keyof typeof descriptions] || 'personalizirani sadržaj';
  }
}
