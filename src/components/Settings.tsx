
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings as SettingsIcon, User, Mail, Share2, Bot, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import BusinessProfileSettings from './BusinessProfileSettings';
import AISettings from './AISettings';
import EmailSettings from './EmailSettings';
import SocialSettings from './SocialSettings';
import MakeIntegration from './MakeIntegration';
import { useLanguage } from '@/contexts/LanguageContext';

const Settings = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back_to_dashboard')}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('settings')}</h1>
              <p className="text-slate-600">{t('manage_settings')}</p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2" />
              {t('settings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="business" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
                <TabsTrigger value="business" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('business_profile')}</span>
                  <span className="sm:hidden">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('ai_settings')}</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('email')}</span>
                  <span className="sm:hidden">Email</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('social_networks')}</span>
                  <span className="sm:hidden">Social</span>
                </TabsTrigger>
                <TabsTrigger value="make" className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Make.com</span>
                  <span className="sm:hidden">Make</span>
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

              <TabsContent value="make">
                <MakeIntegration />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
