
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Share2, Calendar, Bot, Image, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { AIProvider } from '@/services/aiEmailService';
import { platforms, contentTypes, industries, contentFormats } from './constants';
import { useNavigate } from 'react-router-dom';

interface ContentFormProps {
  content: string;
  setContent: (content: string) => void;
  platform: string;
  setPlatform: (platform: string) => void;
  contentType: string;
  setContentType: (contentType: string) => void;
  industry: string;
  setIndustry: (industry: string) => void;
  companyName: string;
  setCompanyName: (companyName: string) => void;
  topic: string;
  setTopic: (topic: string) => void;
  additionalContext: string;
  setAdditionalContext: (additionalContext: string) => void;
  scheduledTime: string;
  setScheduledTime: (scheduledTime: string) => void;
  scheduledDate: string;
  setScheduledDate: (scheduledDate: string) => void;
  isGenerating: boolean;
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  aiProvider: AIProvider;
  setAiProvider: (aiProvider: AIProvider) => void;
  contentFormat: string;
  setContentFormat: (format: string) => void;
  generatedImageUrl: string;
  canGenerateImages: boolean;
  onGenerateContent: () => void;
  onPublishNow: () => void;
  onSchedulePost: () => void;
  isAIConfigured: () => boolean;
  businessProfile: any;
}

const ContentForm: React.FC<ContentFormProps> = ({
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
  aiProvider,
  contentFormat,
  setContentFormat,
  generatedImageUrl,
  canGenerateImages,
  onGenerateContent,
  onPublishNow,
  onSchedulePost,
  isAIConfigured,
  businessProfile,
}) => {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
          AI Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Configuration Status */}
        {isAIConfigured() ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              AI je konfiguriran i spreman za korištenje ({aiProvider === 'openai' ? 'OpenAI' : 'Google Gemini'}).
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 flex items-center justify-between">
              <span>AI nije konfiguriran. Idite u Postavke za konfiguraciju.</span>
              <Button variant="outline" size="sm" onClick={handleGoToSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Postavke
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Business Profile Status */}
        {businessProfile ? (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Poslovni profil konfiguriran: {businessProfile.company_name} ({businessProfile.industry})
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 flex items-center justify-between">
              <span>Konfigurirajte poslovni profil za bolji sadržaj.</span>
              <Button variant="outline" size="sm" onClick={handleGoToSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Postavke
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Image className="h-4 w-4 inline mr-1" />
            Format sadržaja
          </label>
          <Select value={contentFormat} onValueChange={setContentFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Odaberite format" />
            </SelectTrigger>
            <SelectContent>
              {contentFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contentFormat === 'text-with-image' && !canGenerateImages && (
            <p className="text-xs text-amber-600 mt-1">
              Za generiranje slika potreban je OpenAI API ključ
            </p>
          )}
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
            Naziv tvrtke
          </label>
          <Input
            placeholder="Vaša tvrtka d.o.o."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={!!businessProfile?.company_name}
          />
          {businessProfile?.company_name && (
            <p className="text-xs text-slate-500 mt-1">
              Popunjeno iz poslovnog profila
            </p>
          )}
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
          {businessProfile && (
            <p className="text-xs text-slate-500 mt-1">
              Informacije iz poslovnog profila će automatski biti uključene
            </p>
          )}
        </div>

        <Button 
          onClick={onGenerateContent} 
          disabled={isGenerating || !isAIConfigured()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isGenerating ? `Generiranje sadržaja...` : `Generiraj AI Sadržaj`}
        </Button>

        {generatedImageUrl && (
          <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Generirana slika:
            </label>
            <img 
              src={generatedImageUrl} 
              alt="AI generirana slika" 
              className="w-full max-w-sm rounded-lg border"
            />
          </div>
        )}

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
          <Button onClick={onPublishNow} className="flex-1 bg-green-600 hover:bg-green-700">
            <Share2 className="h-4 w-4 mr-2" />
            Objavi Odmah
          </Button>
          <Button onClick={onSchedulePost} variant="outline" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Zakaži
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentForm;
