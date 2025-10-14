
import { useState, useEffect } from 'react';
import { ContentPost } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { AIContentService } from '@/services/aiContentService';
import { AIProvider } from '@/services/aiEmailService';
import { useAISettings } from '@/hooks/useAISettings';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useMakeIntegration } from '@/hooks/useMakeIntegration';
import { useZapierIntegration } from '@/hooks/useZapierIntegration';

export const useContentBooster = () => {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentFormat, setContentFormat] = useState('text');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [platform, setPlatform] = useState<'LinkedIn' | 'Facebook' | 'Instagram' | 'TikTok'>('LinkedIn');

  // Use AI settings and business profile hooks
  const { aiSettings, isAIConfigured } = useAISettings();
  const { profile, getContextForAI } = useBusinessProfile();

  // Initialize form fields from business profile
  useEffect(() => {
    if (profile) {
      setIndustry(profile.industry || '');
      setCompanyName(profile.company_name || '');
    }
  }, [profile]);

  const [posts, setPosts] = useLocalStorage<ContentPost[]>('contentPosts', [
    {
      id: 1,
      platform: 'LinkedIn',
      content: '🚀 Marketing Agent pomaže poduzećima da automatiziraju svoje marketing procese i pronalaze nove klijente kroz naprednu AI tehnologiju. Saznajte kako možemo transformirati vaš pristup marketing-u! #MarketingAutomation #AI #DigitalMarketing',
      contentType: 'promotional',
      date: '2024-02-15',
      status: 'Published',
      engagement: '42 lajkova, 6 komentara'
    },
    {
      id: 2,
      platform: 'Facebook',
      content: 'Znate li da 73% poduzeća koja koriste marketing automatizaciju vide povećanje konverzije? 📈 Marketing Agent platformu koriste tvrtke diljem Europe za poboljšanje svojih marketing rezultata. Pridružite se uspješnima! 💪',
      contentType: 'tip',
      date: '2024-02-14',
      status: 'Scheduled',
      scheduledTime: '18:00'
    },
  ]);

  const { toast } = useToast();
  const { triggerWebhook } = useMakeIntegration();
  const { triggerContentCreated } = useZapierIntegration();

  const generateContent = async () => {
    if (!contentType || !industry) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo odaberite tip sadržaja i industriju.",
        variant: "destructive"
      });
      return;
    }

    if (!isAIConfigured()) {
      toast({
        title: "AI nije konfiguriran",
        description: "Molimo konfigurirajte AI postavke u Postavkama prije generiranja sadržaja.",
        variant: "destructive"
      });
      return;
    }

    if (contentFormat === 'text-with-image' && !(aiSettings?.openai_api_key || aiSettings?.api_key)) {
      toast({
        title: "Generiranje slika nije podržano",
        description: "Za generiranje slika potreban je OpenAI API ključ.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl('');
    
    try {
      const hasOpenAIKey = !!(aiSettings?.openai_api_key || aiSettings?.api_key);
      const providerForThis = (contentFormat === 'text-with-image' && hasOpenAIKey)
        ? 'openai'
        : aiSettings!.provider;

      const selectedKey = providerForThis === 'openai'
        ? (aiSettings!.openai_api_key || aiSettings!.api_key || '')
        : (aiSettings!.gemini_api_key || aiSettings!.api_key || '');

      const aiService = new AIContentService();
      
      // Get business context for better content generation (now async)
      const businessContext = await getContextForAI();
      
      // Add specific context about Marketing Agent if company name contains it or if no specific company context
      let enhancedContext = additionalContext;
      if (businessContext) {
        enhancedContext = `${additionalContext}\n\nInformacije o poduzeću:\n${businessContext}`;
      } else {
        // Default context for Marketing Agent platform
        enhancedContext = `${additionalContext}\n\nMarketing Agent je napredna AI platforma za marketing automatizaciju koja pomaže poduzećima u generiranju leadova, stvaranju personaliziranog sadržaja i automatizaciji komunikacije s klijentima.`;
      }
      
      const result = await aiService.generateContent({
        platform: 'Social Media',
        contentType,
        industry,
        companyName: companyName || 'Marketing Agent',
        topic: topic || undefined,
        additionalContext: enhancedContext || undefined,
        format: contentFormat,
      });

      setContent(result.content);
      
      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      }
      
      toast({
        title: "AI Sadržaj generiran",
        description: `Personalizirani sadržaj je uspješno generiran za ${industry} industriju pomoću ${providerForThis === 'openai' ? 'OpenAI' : 'Google Gemini'}.`,
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: "Greška pri generiranju",
        description: error instanceof Error ? error.message : "Dogodila se greška pri AI generiranju sadržaja.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setContentType('');
    // Don't reset industry and companyName as they come from business profile
    setTopic('');
    setAdditionalContext('');
    setScheduledDate('');
    setScheduledTime('');
    setGeneratedImageUrl('');
  };

  const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  const publishNow = async () => {
    console.log('publishNow: Starting publish process', { content });

    if (!content) {
      console.log('publishNow: Missing content');
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite sadržaj.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add to local posts list
      const newPost: ContentPost = {
        id: Date.now(),
        platform: platform,
        content,
        contentType: contentType as ContentPost['contentType'] || 'promotional',
        date: new Date().toISOString().split('T')[0],
        status: 'Published',
        imageUrl: generatedImageUrl || undefined
      };

      setPosts([newPost, ...posts]);

      // Prepare webhook data with image file
      let webhookData: any = {
        text: content
      };

      // If image exists, fetch it and prepare as blob
      if (generatedImageUrl) {
        try {
          const imageResponse = await fetch(generatedImageUrl);
          const imageBlob = await imageResponse.blob();
          webhookData.image = imageBlob;
        } catch (error) {
          console.error('Error fetching image for webhook:', error);
          webhookData.image = generatedImageUrl; // Fallback to URL
        }
      } else {
        webhookData.image = "";
      }

      // Trigger both webhooks in parallel
      await Promise.all([
        triggerWebhook('content_published', webhookData),
        triggerContentCreated(webhookData)
      ]);

      resetForm();

      toast({
        title: "Webhook pokrenut",
        description: `Sadržaj je poslan putem webhook-a${generatedImageUrl ? ' sa slikom' : ''}.`,
      });

      console.log('publishNow: Webhook triggered successfully', { hasImage: !!generatedImageUrl });
    } catch (error) {
      console.error('publishNow: Error during publish process:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri otvaranju društvene mreže.",
        variant: "destructive"
      });
    }
  };

  const schedulePost = () => {
    if (!content || !scheduledDate || !scheduledTime) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite sve podatke za zakazivanje objave.",
        variant: "destructive"
      });
      return;
    }

    const newPost: ContentPost = {
      id: Date.now(),
      platform: platform,
      content,
      contentType: contentType as ContentPost['contentType'] || 'promotional',
      date: scheduledDate,
      status: 'Scheduled',
      scheduledTime
    };

    setPosts([newPost, ...posts]);
    resetForm();

    toast({
      title: "Objava zakazana",
      description: `Sadržaj je zakazan za objavu ${scheduledDate} u ${scheduledTime}.`,
    });
  };

  const deletePost = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
    toast({
      title: "Objava obrisana",
      description: "Objava je uspješno obrisana.",
    });
  };

  return {
    content,
    setContent,
    contentType,
    setContentType,
    industry,
    setIndustry,
    companyName,
    setCompanyName,
    topic,
    setTopic,
    additionalContext,
    setAdditionalContext,
    scheduledTime,
    setScheduledTime,
    scheduledDate,
    setScheduledDate,
    isGenerating,
    apiKey: (aiSettings?.provider === 'openai'
      ? (aiSettings?.openai_api_key || aiSettings?.api_key)
      : (aiSettings?.gemini_api_key || aiSettings?.api_key)) || '',
    setApiKey: () => {}, // No-op since we use saved settings
    aiProvider: (aiSettings?.provider || 'openai') as AIProvider,
    setAiProvider: () => {}, // No-op since we use saved settings
    contentFormat,
    setContentFormat,
    generatedImageUrl,
    platform,
    setPlatform,
    posts,
    generateContent,
    publishNow,
    schedulePost,
    deletePost,
    // Add new properties for checking AI configuration
    isAIConfigured,
    businessProfile: profile,
    canGenerateImages: !!(aiSettings?.openai_api_key || aiSettings?.api_key),
  };
};
