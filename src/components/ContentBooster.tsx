import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Share2, Sparkles, Calendar, Facebook, Linkedin, Instagram, Trash2, Clock, Bot } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ContentPost } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AIContentService } from '@/services/aiContentService';
import { AIProvider } from '@/services/aiEmailService';

const ContentBooster = () => {
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

  const platforms = [
    { value: 'LinkedIn', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
    { value: 'Facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-800' },
    { value: 'Instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  ];

  const contentTypes = [
    { value: 'tip', label: 'Korisni savjet' },
    { value: 'case-study', label: 'Studija slučaja' },
    { value: 'news', label: 'Novosti' },
    { value: 'promotional', label: 'Promocijski sadržaj' },
    { value: 'educational', label: 'Edukacijski sadržaj' },
    { value: 'behind-scenes', label: 'Iza kulisa' },
  ];

  const industries = [
    { value: 'praone', label: 'Profesionalne praone rublja' },
    { value: 'ugostiteljstvo', label: 'Ugostiteljstvo i turizam' },
    { value: 'zdravstvo', label: 'Zdravstvo i medicina' },
    { value: 'obrazovanje', label: 'Obrazovanje' },
    { value: 'tehnologija', label: 'Tehnologija i IT' },
    { value: 'retail', label: 'Maloprodaja' },
    { value: 'proizvodnja', label: 'Proizvodnja' },
    { value: 'usluge', label: 'Poslovne usluge' },
    { value: 'nekretnine', label: 'Nekretnine' },
    { value: 'fitness', label: 'Fitness i wellness' },
    { value: 'općenito', label: 'Općenito poslovanje' },
  ];

  const aiProviders = [
    { value: 'openai', label: 'OpenAI GPT', placeholder: 'sk-...', docs: 'https://platform.openai.com/api-keys' },
    { value: 'gemini', label: 'Google Gemini', placeholder: 'AIza...', docs: 'https://aistudio.google.com/app/apikey' },
  ];

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

    setIsGenerating(true);
    
    try {
      const aiService = new AIContentService(apiKey, aiProvider);
      
      const result = await aiService.generateContent({
        platform,
        contentType,
        industry,
        companyName: companyName || undefined,
        topic: topic || undefined,
        additionalContext: additionalContext || undefined,
      });

      setContent(result.content);
      
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
  };

  const deletePost = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
    toast({
      title: "Objava obrisana",
      description: "Objava je uspješno obrisana.",
    });
  };

  const getPlatformIcon = (platformName: string) => {
    const platformData = platforms.find(p => p.label === platformName);
    if (!platformData) return FileText;
    return platformData.icon;
  };

  const getPlatformColor = (platformName: string) => {
    const platformData = platforms.find(p => p.label === platformName);
    return platformData?.color || 'text-gray-600';
  };

  const currentProvider = aiProviders.find(p => p.value === aiProvider);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Content Booster</h2>
          <p className="text-slate-600">Generirajte i planirajte sadržaj za društvene mreže pomoću AI-a</p>
        </div>
        <div className="flex space-x-2">
          <span className="text-sm text-slate-600">
            Objavljeno: {posts.filter(p => p.status === 'Published').length} | 
            Zakazano: {posts.filter(p => p.status === 'Scheduled').length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              AI Content Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Bot className="h-4 w-4 inline mr-1" />
                AI Provider
              </label>
              <Select value={aiProvider} onValueChange={(value: AIProvider) => setAiProvider(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite AI servis" />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {currentProvider?.label} API Ključ
              </label>
              <Input
                type="password"
                placeholder={currentProvider?.placeholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mb-2"
              />
              <p className="text-xs text-slate-500">
                Potreban za AI generiranje sadržaja. 
                <a href={currentProvider?.docs} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  Nabavite API ključ ovdje
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Industrija *
              </label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite industriju" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Platforma *
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite platformu" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((plat) => {
                    const Icon = plat.icon;
                    return (
                      <SelectItem key={plat.value} value={plat.value}>
                        <div className="flex items-center">
                          <Icon className={`h-4 w-4 mr-2 ${plat.color}`} />
                          {plat.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tip sadržaja *
              </label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite tip sadržaja" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naziv tvrtke (opcionalno)
              </label>
              <Input
                placeholder="Vaša tvrtka d.o.o."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tema (opcionalno)
              </label>
              <Input
                placeholder="Specifična tema ili proizvod"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dodatne informacije (opcionalno)
              </label>
              <Textarea
                placeholder="Dodatni kontekst, ciljana publika, posebne napomene..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="min-h-20"
              />
            </div>

            <Button 
              onClick={generateContent} 
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? `Generiranje ${currentProvider?.label} sadržaja...` : `Generiraj AI Sadržaj (${currentProvider?.label})`}
            </Button>

            <Textarea
              placeholder="Generirani AI sadržaj će se pojaviti ovdje ili unesite vlastiti..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Datum zakazivanja
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vrijeme zakazivanja
                </label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={publishNow} className="flex-1 bg-green-600 hover:bg-green-700">
                <Share2 className="h-4 w-4 mr-2" />
                Objavi Odmah
              </Button>
              <Button onClick={schedulePost} variant="outline" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Zakaži
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objave i Raspored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {posts.map((post) => {
                const Icon = getPlatformIcon(post.platform);
                const colorClass = getPlatformColor(post.platform);
                return (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Icon className={`h-4 w-4 mr-2 ${colorClass}`} />
                        <span className="font-medium text-slate-900">{post.platform}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={post.status === 'Published' ? 'default' : 'secondary'}>
                          {post.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-3 line-clamp-3">{post.content}</p>
                    
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{post.date}</span>
                      <div className="flex items-center">
                        {post.status === 'Scheduled' && post.scheduledTime && (
                          <div className="flex items-center mr-2">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{post.scheduledTime}</span>
                          </div>
                        )}
                        <span>{post.engagement || (post.status === 'Scheduled' ? 'Zakazano' : 'Objavljeno')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {posts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Nema kreiranog sadržaja.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentBooster;
