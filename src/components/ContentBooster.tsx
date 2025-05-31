
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Share2, Sparkles, Calendar, Facebook, Linkedin, Instagram } from 'lucide-react';

const ContentBooster = () => {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('');
  const [contentType, setContentType] = useState('');

  const platforms = [
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
    { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-800' },
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  ];

  const contentTypes = [
    { value: 'tip', label: 'Savjet za industriju' },
    { value: 'case-study', label: 'Studija slučaja' },
    { value: 'news', label: 'Novosti' },
    { value: 'promotional', label: 'Promocijski sadržaj' },
  ];

  const generatedPosts = [
    {
      id: 1,
      platform: 'LinkedIn',
      content: '🧽 Znate li da profesionalne praone troše 40% manje vode kad koriste moderne sustave za upravljanje procesima? Marketing Agent pomaže praonama optimizirati ne samo marketing, već i operativne procese. #Sustainability #LaundryTech',
      date: '2024-02-15',
      status: 'Objavljeno',
      engagement: '47 lajkova, 8 komentara'
    },
    {
      id: 2,
      platform: 'Facebook',
      content: 'Vaša praonica zaslužuje najbolje! 💪 S Marketing Agent platformom automatski pronađite nove klijente i zadržite postojeće kroz personaliziranu komunikaciju. Saznajte više o tome kako digitalizirati Vaš business! 📈',
      date: '2024-02-14',
      status: 'Zakazano',
      engagement: 'Zakazano za 18:00'
    },
  ];

  const generateContent = () => {
    const sampleContent = `🚀 Revolucionarnite svoj marketing u praoničarskoj industriji!

Znate li da 73% praonica još uvijek oslanja na tradicionalne metode pronalaska klijenata? 

Marketing Agent mijenja igru:
✅ Automatsko pronalaženje potencijalnih klijenata
✅ Personalizirani email marketing
✅ CRM s podsjetnicima
✅ Automatsko generiranje sadržaja

Vrijeme je da Vaš business zakorači u digitalnu eru! 💼

#MarketingAgent #DigitalTransformation #LaundryBusiness #B2BSaas`;

    setContent(sampleContent);
  };

  const getPlatformIcon = (platformName: string) => {
    const platform = platforms.find(p => p.label === platformName);
    if (!platform) return FileText;
    return platform.icon;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Content Booster</h2>
          <p className="text-slate-600">Generirajte sadržaj za društvene mreže</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Calendar className="h-4 w-4 mr-2" />
          Zakaži Objave
        </Button>
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
                Platforma
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
              placeholder="Generirani sadržaj će se pojaviti ovdje..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-40"
            />

            <div className="flex space-x-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Share2 className="h-4 w-4 mr-2" />
                Objavi Odmah
              </Button>
              <Button variant="outline">
                Zakaži
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nedavne Objave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedPosts.map((post) => {
                const Icon = getPlatformIcon(post.platform);
                return (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="font-medium text-slate-900">{post.platform}</span>
                      </div>
                      <Badge variant={post.status === 'Objavljeno' ? 'default' : 'secondary'}>
                        {post.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-3 line-clamp-3">{post.content}</p>
                    
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{post.date}</span>
                      <span>{post.engagement}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentBooster;
