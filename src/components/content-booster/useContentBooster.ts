
import { useState, useEffect } from 'react';
import { ContentPost } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { AIContentService } from '@/services/aiContentService';
import { AIProvider } from '@/services/aiEmailService';
import { useSocialService } from '@/hooks/useSocialService';
import { useAISettings } from '@/hooks/useAISettings';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';

export const useContentBooster = () => {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('');
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
      content: '🧽 Znate li da profesionalne praone troše 40% manje vode kad koriste moderne sustave za upravljanje procesima? Marketing Agent pomaže praonama optimizirati ne samo marketing, već i operativne procese. #Sustainability #LaundryTech',
      contentType: 'tip',
      date: '2024-02-15',
      status: 'Published',
      engagement: '47 lajkova, 8 komentara'
    },
    {
      id: 2,
      platform: 'Facebook',
      content: 'Vaša praonica zaslužuje najbolje! 💪 S Marketing Agent platformom automatski pronađite nove klijente i zadržite postojeće kroz personaliziranu komunikaciju. Saznajte više o tome kako digitalizirati Vaš business! 📈',
      contentType: 'promotional',
      date: '2024-02-14',
      status: 'Scheduled',
      scheduledTime: '18:00'
    },
  ]);

  const { toast } = useToast();
  const { postToSocial } = useSocialService();

  const generateContent = async () => {
    if (!platform || !contentType || !industry) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo odaberite platformu, tip sadržaja i industriju.",
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

    if (contentFormat === 'text-with-image' && aiSettings?.provider !== 'openai') {
      toast({
        title: "Generiranje slika nije podržano",
        description: "Generiranje slika je dostupno samo s OpenAI providerom.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl('');
    
    try {
      const aiService = new AIContentService(aiSettings!.api_key, aiSettings!.provider);
      
      // Get business context for better content generation
      const businessContext = getContextForAI();
      const enhancedAdditionalContext = businessContext 
        ? `${additionalContext}\n\nInformacije o poduzeću:\n${businessContext}`
        : additionalContext;
      
      const result = await aiService.generateContent({
        platform,
        contentType,
        industry,
        companyName: companyName || undefined,
        topic: topic || undefined,
        additionalContext: enhancedAdditionalContext || undefined,
        format: contentFormat,
      });

      setContent(result.content);
      
      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      }
      
      toast({
        title: "AI Sadržaj generiran",
        description: `Personalizirani sadržaj je uspješno generiran za ${industry} industriju pomoću ${aiSettings!.provider === 'openai' ? 'OpenAI' : 'Google Gemini'}.`,
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
    setPlatform('');
    setContentType('');
    // Don't reset industry and companyName as they come from business profile
    setTopic('');
    setAdditionalContext('');
    setScheduledDate('');
    setScheduledTime('');
    setGeneratedImageUrl('');
  };

  const publishNow = async () => {
    console.log('publishNow: Starting publish process', { content, platform });

    if (!content || !platform) {
      console.log('publishNow: Missing content or platform');
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite sadržaj i odaberite platformu.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('publishNow: Attempting to post to social media');
      
      const socialPlatform = platform.toLowerCase() as 'facebook' | 'linkedin' | 'instagram';
      await postToSocial(content, socialPlatform, generatedImageUrl || undefined);

      console.log('publishNow: Social post successful, adding to local posts');

      const newPost: ContentPost = {
        id: Date.now(),
        platform: platform as ContentPost['platform'],
        content,
        contentType: contentType as ContentPost['contentType'] || 'promotional',
        date: new Date().toISOString().split('T')[0],
        status: 'Published'
      };

      setPosts([newPost, ...posts]);
      resetForm();

      console.log('publishNow: Process completed successfully');
    } catch (error) {
      console.error('publishNow: Error during publish process:', error);
      // Error is already handled in useSocialService
    }
  };

  const schedulePost = () => {
    if (!content || !platform || !scheduledDate || !scheduledTime) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite sve podatke za zakazivanje objave.",
        variant: "destructive"
      });
      return;
    }

    const newPost: ContentPost = {
      id: Date.now(),
      platform: platform as ContentPost['platform'],
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
    platform,
    setPlatform,
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
    // Remove manual API key and provider since we're using saved settings
    apiKey: aiSettings?.api_key || '',
    setApiKey: () => {}, // No-op since we use saved settings
    aiProvider: (aiSettings?.provider || 'openai') as AIProvider,
    setAiProvider: () => {}, // No-op since we use saved settings
    contentFormat,
    setContentFormat,
    generatedImageUrl,
    posts,
    generateContent,
    publishNow,
    schedulePost,
    deletePost,
    // Add new properties for checking AI configuration
    isAIConfigured,
    businessProfile: profile,
  };
};
