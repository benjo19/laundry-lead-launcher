
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings as SettingsIcon, User, Mail, Bot, Zap, Calendar, Webhook, UserCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import BusinessProfileManager from './BusinessProfileManager';
import EmailSettings from './EmailSettings';
import MakeIntegration from './MakeIntegration';
import ZapierIntegration from './ZapierIntegration';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';
import ContentBoosterWebhook from './ContentBoosterWebhook';
import SimpleWebhookIntegration from './SimpleWebhookIntegration';
import AISettings from './AISettings';
import JarvisTelegramLink from './JarvisTelegramLink';
import { AccountSettings } from './AccountSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';

const Settings = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAdminStatus();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'account';

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
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 p-1 mb-6 h-auto">
                <TabsTrigger value="account" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <UserCircle className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">{t('account')}</span>
                </TabsTrigger>
                <TabsTrigger value="business" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <User className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Bot className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">AI</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Mail className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Email</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex flex-col items-center justify-center p-3 h-16 text-xs">
                  <Webhook className="h-4 w-4 mb-1" />
                  <span className="truncate w-full text-center">Integracije</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <AccountSettings />
              </TabsContent>

              <TabsContent value="business">
                <BusinessProfileManager />
              </TabsContent>

              <TabsContent value="ai">
                <AISettings />
              </TabsContent>

              <TabsContent value="email">
                <EmailSettings />
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                <JarvisTelegramLink />
                <div className="space-y-6">
                  {isAdmin ? (
                    // Admin vidi sve integracije kao do sad
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Webhook className="h-5 w-5" />
                          Webhook Integracije
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        {/* Make.com Integration */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            Make.com
                          </h3>
                          <MakeIntegration />
                        </div>

                        <div className="border-t pt-8">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-orange-500" />
                            Zapier
                          </h3>
                          <ZapierIntegration />
                        </div>

                        <div className="border-t pt-8">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Webhook className="h-5 w-5 text-green-500" />
                            Content Booster Webhook
                          </h3>
                          <ContentBoosterWebhook />
                        </div>

                        <div className="border-t pt-8">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            Google Calendar
                          </h3>
                          <GoogleCalendarIntegration />
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Obični korisnici vide samo 3 jednostavna webhook polja
                    <SimpleWebhookIntegration />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
