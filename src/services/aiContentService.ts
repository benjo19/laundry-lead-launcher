
import { AIProvider } from './aiEmailService';

interface ContentGenerationParams {
  platform: string;
  contentType: string;
  industry: string;
  companyName?: string;
  topic?: string;
  additionalContext?: string;
  format?: string;
}

interface GeneratedContent {
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export class AIContentService {
  private apiKey: string;
  private provider: AIProvider;

  constructor(apiKey: string, provider: AIProvider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async generateContent(params: ContentGenerationParams): Promise<GeneratedContent> {
    const systemPrompt = this.buildSystemPrompt(params.format === 'text-with-image');
    const userPrompt = this.buildUserPrompt(params);

    try {
      let result: GeneratedContent;
      
      if (this.provider === 'gemini') {
        result = await this.generateWithGemini(systemPrompt, userPrompt);
      } else {
        result = await this.generateWithOpenAI(systemPrompt, userPrompt);
      }

      // Generate image if requested
      if (params.format === 'text-with-image' && result.imagePrompt) {
        try {
          result.imageUrl = await this.generateImage(result.imagePrompt);
        } catch (error) {
          console.error('Image generation failed:', error);
          // Continue without image if generation fails
        }
      }

      return result;
    } catch (error) {
      console.error('AI Content generation error:', error);
      throw error;
    }
  }

  private async generateImage(prompt: string): Promise<string> {
    if (this.provider !== 'openai') {
      throw new Error('Image generation is only supported with OpenAI');
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    return data.data[0]?.url || '';
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

    return this.parseGeneratedContent(generatedText);
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

    return this.parseGeneratedContent(generatedText);
  }

  private parseGeneratedContent(text: string): GeneratedContent {
    // Check if text contains image prompt marker
    const imagePromptMatch = text.match(/\[IMAGE_PROMPT:(.*?)\]/);
    
    if (imagePromptMatch) {
      const imagePrompt = imagePromptMatch[1].trim();
      const content = text.replace(/\[IMAGE_PROMPT:.*?\]/, '').trim();
      return { content, imagePrompt };
    }

    return { content: text };
  }

  private buildSystemPrompt(includeImage: boolean = false): string {
    let prompt = `Ti si ekspert za marketing sadržaj i društvene mreže. Tvoj zadatak je kreiranje angažirajućeg sadržaja na hrvatskom jeziku za različite industrije i platforme.

VAŽNE SMJERNICE:
- Uvijek piši na hrvatskom jeziku
- Prilagodi ton i stil prema platformi (LinkedIn profesionalno, Facebook opuštenо, Instagram vizualno, TikTok trendi i zabavno)
- Koristi relevantne hashtag-ove i emoji-je
- Sadržaj treba biti kratak i direktan (maksimalno 200 riječi za LinkedIn, 150 za Facebook, 100 za Instagram/TikTok)
- Fokusiraj se na vrijednost za čitatelje
- Koristi konkretne primjere i savjete kada god možeš`;

    if (includeImage) {
      prompt += `

GENERIRANJE SLIKA:
- Ako generirate sadržaj s slikom, na kraju dodajte [IMAGE_PROMPT: kratak opis slike na engleskom]
- Opis slike treba biti relevantan za sadržaj i industriju
- Koristite jednostavne, jasne opise (npr. "professional laundry worker in modern facility")`;
    }

    prompt += `

STRUKTURA ODGOVORA:
Generiraj SAMO sadržaj objave, bez dodatnih objašnjenja.`;

    return prompt;
  }

  private buildUserPrompt(params: ContentGenerationParams): string {
    const { platform, contentType, industry, companyName, topic, additionalContext, format } = params;

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

    if (format === 'text-with-image') {
      prompt += `\nFORMAT: Generiraj tekst s prijedlogom za sliku`;
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
