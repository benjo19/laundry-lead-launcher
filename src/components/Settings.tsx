
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings2, User, Brain, Mail, Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import BusinessProfileSettings from './BusinessProfileSettings';
import AISettings from './AISettings';
import EmailSettings from './EmailSettings';
import SocialSettings from './SocialSettings';

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('settings')}</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">{t('manage_settings')}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('back_to_dashboard')}</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="business" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <User className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{t('business_profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Brain className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{t('ai_settings')}</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Mail className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{t('email')}</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Share2 className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{t('social_networks')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessProfileSettings />
        </TabsContent>

        <TabsContent value="ai">
          <AISettings />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="social">
          <SocialSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
