
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Share2, Sparkles, Calendar, Facebook, Linkedin, Instagram, Trash2, Clock } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ContentPost } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ContentBooster = () => {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('');
  const [contentType, setContentType] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

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
    { value: 'tip', label: 'Savjet za industriju' },
    { value: 'case-study', label: 'Studija slučaja' },
    { value: 'news', label: 'Novosti' },
    { value: 'promotional', label: 'Promocijski sadržaj' },
  ];

  const contentTemplates = {
    tip: {
      LinkedIn: `💡 Savjet za praone: [SAVJET]

Znate li da [STATISTIKA]? 

Ovo vam može pomoći:
✅ [KORIST 1]
✅ [KORIST 2] 
✅ [KORIST 3]

Marketing Agent automatizira ovakve procese i pomaže vam fokusirati se na ono što je važno.

#LaundryTips #BusinessEfficiency #MarketingAgent`,

      Facebook: `🎯 Korisni savjet za vlasnike praonica!

[SAVJET]

💪 Rezultati koje možete očekivati:
• [REZULTAT 1]
• [REZULTAT 2]
• [REZULTAT 3]

Želite saznati više? Marketing Agent je tu da vam pomogne! 🚀`,

      Instagram: `✨ PRO TIP za praone ✨

[KRATKI_SAVJET]

💡 [OBJAŠNJENJE]

Sviđa vam se ovakav sadržaj? Pratite nas za više savjeta! 

#praonica #businesstips #marketingagent #entrepreneur`
    },
    'case-study': {
      LinkedIn: `📊 STUDIJA SLUČAJA: [NAZIV_TVRTKE]

IZAZOV: [OPIS_PROBLEMA]

RJEŠENJE: Marketing Agent platforma
• [IMPLEMENTACIJA 1]
• [IMPLEMENTACIJA 2]
• [IMPLEMENTACIJA 3]

REZULTATI nakon 3 mjeseca:
📈 [REZULTAT 1]
📈 [REZULTAT 2] 
📈 [REZULTAT 3]

#CaseStudy #LaundryIndustry #DigitalTransformation`,

      Facebook: `🏆 USPJEH NAŠIH KLIJENATA

[NAZIV_TVRTKE] je u samo 3 mjeseca:
✅ [REZULTAT 1]
✅ [REZULTAT 2]
✅ [REZULTAT 3]

Kako? Marketing Agent im je pomogao automatizirati marketing procese!

Čitate li ovakve priče? Budite sljedeći! 💪`,

      Instagram: `🔥 SUCCESS STORY 🔥

[KRATKI_OPIS_USPJEHA]

Rezultat: [GLAVNI_REZULTAT]

Vaša priča može biti sljedeća! 💫

#success #casestudy #praonica #digitalmarketing`
    }
  };

  const generateContent = () => {
    if (!platform || !contentType) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo odaberite platformu i tip sadržaja.",
        variant: "destructive"
      });
      return;
    }

    const templates = contentTemplates[contentType as keyof typeof contentTemplates];
    const template = templates?.[platform as keyof typeof templates];

    if (template) {
      setContent(template);
      toast({
        title: "Sadržaj generiran",
        description: "AI predložak je generiran. Možete ga prilagoditi prema potrebi.",
      });
    } else {
      // Fallback generiranje
      const fallbackContent = generateFallbackContent(platform, contentType);
      setContent(fallbackContent);
      toast({
        title: "Sadržaj generiran",
        description: "Generiran je osnovni sadržaj koji možete prilagoditi.",
      });
    }
  };

  const generateFallbackContent = (platform: string, type: string) => {
    const contents = {
      tip: `💡 Korisni savjet za vlasnike praonica!

Optimizirajte svoje marketing procese s Marketing Agent platformom.

Prednosti:
✅ Automatsko pronalaženje klijenata
✅ Personalizirani email marketing
✅ Efikasno upravljanje komunikacijom

#MarketingAgent #LaundryBusiness #DigitalMarketing`,

      'case-study': `📊 Naši klijenti postižu nevjerojatne rezultate!

Jedna praonica je u 3 mjeseca:
📈 Povećala broj klijenata za 45%
📈 Smanjila troškove marketinga za 60%
📈 Automatizirala 80% komunikacije

Marketing Agent čini razliku! 🚀

#CaseStudy #Success #LaundryIndustry`,

      news: `📰 Novosti iz industrije praonica

Najnoviji trendovi pokazuju da digitalizacija postaje ključna za rast u praoničarskoj industriji.

Marketing Agent predvodi ovu transformaciju! 

#Industry #News #DigitalTransformation`,

      promotional: `🎯 Spremni za revoluciju u marketingu?

Marketing Agent platforma omogućava:
• Automatsko generiranje leadova
• Pametan email marketing  
• Praćenje rezultata u realnom vremenu

Zakazajte demo danas! 💼

#MarketingAgent #B2B #LaundryBusiness`
    };

    return contents[type as keyof typeof contents] || contents.promotional;
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Content Booster</h2>
          <p className="text-slate-600">Generirajte i planirajte sadržaj za društvene mreže</p>
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
                Tip sadržaja
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

            <Button onClick={generateContent} className="w-full bg-purple-600 hover:bg-purple-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Generiraj AI Sadržaj
            </Button>

            <Textarea
              placeholder="Generirani sadržaj će se pojaviti ovdje ili unesite vlastiti..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-48"
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
