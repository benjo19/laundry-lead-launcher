import { useState } from 'react';
import { ContentPost } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { AIContentService } from '@/services/aiContentService';
import { AIProvider } from '@/services/aiEmailService';

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
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
  const [contentFormat, setContentFormat] = useState('text');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

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

  const generateContent = async () => {
    if (!platform || !contentType || !industry) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo odaberite platformu, tip sadržaja i industriju.",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API ključ potreban",
        description: `Molimo unesite ${aiProvider === 'openai' ? 'OpenAI' : 'Google Gemini'} API ključ za AI generiranje sadržaja.`,
        variant: "destructive"
      });
      return;
    }

    if (contentFormat === 'text-with-image' && aiProvider !== 'openai') {
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
      const aiService = new AIContentService(apiKey, aiProvider);
      
      const result = await aiService.generateContent({
        platform,
        contentType,
        industry,
        companyName: companyName || undefined,
        topic: topic || undefined,
        additionalContext: additionalContext || undefined,
        format: contentFormat,
      });

      setContent(result.content);
      
      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      }
      
      toast({
        title: "AI Sadržaj generiran",
        description: `Personalizirani sadržaj je uspješno generiran za ${industry} industriju pomoću ${aiProvider === 'openai' ? 'OpenAI' : 'Google Gemini'}.`,
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
    setIndustry('');
    setCompanyName('');
    setTopic('');
    setAdditionalContext('');
    setScheduledDate('');
    setScheduledTime('');
    setGeneratedImageUrl('');
  };

  const publishNow = () => {
    if (!content || !platform) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite sadržaj i odaberite platformu.",
        variant: "destructive"
      });
      return;
    }

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

    toast({
      title: "Objava uspješno objavljena",
      description: `Sadržaj je uspješno objavljen na ${platform}.`,
    });
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
    apiKey,
    setApiKey,
    aiProvider,
    setAiProvider,
    contentFormat,
    setContentFormat,
    generatedImageUrl,
    posts,
    generateContent,
    publishNow,
    schedulePost,
    deletePost,
  };
};
