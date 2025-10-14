
import { supabase } from '@/integrations/supabase/client';

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
  constructor() {
    // No API key needed - using Lovable AI Gateway
  }

  async generateContent(params: ContentGenerationParams): Promise<GeneratedContent> {
    const systemPrompt = this.buildSystemPrompt(params.format === 'text-with-image');
    const userPrompt = this.buildUserPrompt(params);

    try {
      // Use Lovable AI Gateway through edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: `${systemPrompt}\n\n${userPrompt}`,
          language: 'hr'
        }
      });

      if (error) throw error;

      const generatedText = data.response || '';
      let result = this.parseGeneratedContent(generatedText);

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
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompt }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate image');
    }

    return data?.imageUrl || '';
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
- Sadržaj MORA biti prilagođen specifično za odabranu platformu
- Koristi relevantne hashtag-ove i emoji-je
- Fokusiraj se na vrijednost za čitatelje
- Koristi konkretne primjere i savjete kada god možeš

PLATFORMSKI SPECIFIČNE SMJERNICE:

LINKEDIN:
- Profesionalan i formalan ton
- Fokus na B2B vrijednost, industriju, stručno znanje
- Duži sadržaj (150-200 riječi)
- 3-5 relevantnih hashtag-ova na kraju
- Manji broj emoji-a (povremeno, profesionalni)
- Struktura: Uvod > Glavni sadržaj > Call-to-action ili pitanje za angažman

FACEBOOK:
- Prijateljski i topao ton
- Fokus na priče, emotivnu povezanost, zajednicu
- Srednja duljina (100-150 riječi)
- 2-4 hashtag-ova
- Umjerena upotreba emoji-a
- Struktura: Privlačan uvod > Priča ili savjet > Poziv na akciju

INSTAGRAM:
- Kreativan i vizualan ton
- Kratki, snažni stavovi
- Kratki sadržaj (50-100 riječi)
- 5-10 hashtag-ova na kraju
- Slobodna upotreba emoji-a
- Struktura: Hook u prvom redu > Sadržaj > Hashtag-ovi

TIKTOK:
- Zabavan, energičan, trendi ton
- Razgovorni stil, kao da pričaš prijatelju
- Vrlo kratak sadržaj (30-80 riječi)
- 3-5 trendi hashtag-ova
- Puno emoji-a i kreativnih znakova
- Struktura: Hook > Brzi savjet/zanimljivost > CTA`;

    if (includeImage) {
      prompt += `

GENERIRANJE SLIKA:
- Ako generirate sadržaj sa slikom, na kraju odgovora dodajte točno jedan tag: [IMAGE_PROMPT: ...]
- Opis mora biti na engleskom jeziku
- Opis MORA odražavati odabranu industriju i stil platforme te, kada su dostupni, uključiti ključne pojmove iz TEMA i DODATNE INFORMACIJE
- Fokusirajte se na jasne vizualne elemente (subjekt, okruženje, stil, osvjetljenje), bez teksta u slici
- Primjer: "professional laundry worker in modern facility"`; 
    }

    prompt += `

STRUKTURA ODGOVORA:
Generiraj SAMO sadržaj objave, bez dodatnih objašnjenja.`;

    return prompt;
  }

  private buildUserPrompt(params: ContentGenerationParams): string {
    const { platform, contentType, industry, companyName, topic, additionalContext, format } = params;

    let prompt = `PLATFORMA: ${platform}
Generiraj ${this.getContentTypeDescription(contentType)} STRIKTNO PRILAGOĐEN za ${platform}.

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

    // Add platform-specific instructions
    prompt += `\n\nIMPERATIV: Sadržaj MORA biti napisan za ${platform}:`;
    
    switch(platform.toLowerCase()) {
      case 'linkedin':
        prompt += `\n- Profesionalan i formalan jezik
- Fokus na poslovne koristi i stručnost
- 150-200 riječi
- Završi sa 3-5 profesionalnih hashtag-ova
- Minimalna upotreba emoji-a`;
        break;
      case 'facebook':
        prompt += `\n- Prijateljski i topao ton
- Ispričaj priču koja se povezuje s ljudima
- 100-150 riječi
- Dodaj 2-4 hashtag-a
- Umjereno koristi emoji-je`;
        break;
      case 'instagram':
        prompt += `\n- Kreativan i vizualan jezik
- Prvi red mora biti jak i privlačan
- 50-100 riječi
- Završi sa 5-10 relevantnih hashtag-ova
- Slobodno koristi emoji-je`;
        break;
      case 'tiktok':
        prompt += `\n- Zabavan, energičan, razgovorni ton
- Piši kao da pričaš prijatelju
- 30-80 riječi
- 3-5 trendi hashtag-a (#foryou, #viral, itd.)
- Puno emoji-a i energije`;
        break;
    }

    if (format === 'text-with-image') {
      prompt += `\nFORMAT: Generiraj tekst s prijedlogom za sliku.`;
      prompt += `\nZA [IMAGE_PROMPT]: koristite engleski jezik, opišite ključne vizualne elemente (subjekt, okruženje, stil, svjetlo).`;
      prompt += `\nObavezno ugradite industriju: ${industry}.`;
      if (companyName) {
        prompt += `\nAko je relevantno, prilagodite stil/brending tvrtki: ${companyName}.`;
      }
      if (topic) {
        prompt += `\nTema/koncept slike: ${topic}.`;
      }
      if (additionalContext) {
        prompt += `\nDodatni vizualni kontekst/ključne riječi: ${additionalContext}.`;
      }
      prompt += `\nUskladite vizualni stil s platformom (${platform}).`;
      prompt += `\n- LinkedIn: clean, corporate, minimalistic, neutral colors, professional lighting.`;
      prompt += `\n- Facebook: friendly lifestyle, relatable people, warm tones, approachable.`;
      prompt += `\n- Instagram: vibrant, aesthetic, shallow depth of field, trending look.`;
      prompt += `\n- TikTok: dynamic, fun, bold colors, energetic composition.`;
      prompt += `\nKadriranje i omjer stranica (aspect ratio) prilagodite platformi.`;
      prompt += `\n- LinkedIn: 1.91:1 (npr. 1200x627), landscape composition.`;
      prompt += `\n- Facebook: 4:5 (npr. 1080x1350), portrait composition.`;
      prompt += `\n- Instagram: 1:1 (npr. 1080x1080), square composition.`;
      prompt += `\n- TikTok: 9:16 (npr. 1080x1920), vertical composition.`;
      prompt += `\nNa kraju odgovora dodajte točno jedan [IMAGE_PROMPT: ...] bez dodatnih komentara.`;
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
