
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings as SettingsIcon, User, Mail, Bot, Zap, Calendar, Webhook } from 'lucide-react';
import { Link } from 'react-router-dom';
import BusinessProfileSettings from './BusinessProfileSettings';
import EmailSettings from './EmailSettings';
import MakeIntegration from './MakeIntegration';
import ZapierIntegration from './ZapierIntegration';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';
import ContentBoosterWebhook from './ContentBoosterWebhook';
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
              <TabsList className="grid w-full grid-cols-6 gap-1 p-1 mb-6 h-auto">
                <TabsTrigger value="business" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <User className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Mail className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Email</span>
                </TabsTrigger>
                <TabsTrigger value="make" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Zap className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Make</span>
                </TabsTrigger>
                <TabsTrigger value="zapier" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Zap className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Zapier</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Calendar className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Kalendar</span>
                </TabsTrigger>
                <TabsTrigger value="content-webhook" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Webhook className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Content</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="business">
                <BusinessProfileSettings />
              </TabsContent>

              <TabsContent value="email">
                <EmailSettings />
              </TabsContent>

              <TabsContent value="make">
                <MakeIntegration />
              </TabsContent>

              <TabsContent value="zapier">
                <ZapierIntegration />
              </TabsContent>

              <TabsContent value="calendar">
                <GoogleCalendarIntegration />
              </TabsContent>

              <TabsContent value="content-webhook">
                <ContentBoosterWebhook />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
