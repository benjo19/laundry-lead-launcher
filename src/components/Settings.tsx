
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings2, User, Brain, Mail, Share2 } from 'lucide-react';
import BusinessProfileSettings from './BusinessProfileSettings';
import AISettings from './AISettings';

const Settings = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Postavke</h2>
        <p className="text-slate-600">Upravljajte vašim korisničkim postavkama i preferencijama</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Poslovni Profil
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Postavke
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Društvene mreže
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessProfileSettings />
        </TabsContent>

        <TabsContent value="ai">
          <AISettings />
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Postavke
              </CardTitle>
              <CardDescription>
                Konfigurirajte vaše email postavke za slanje emailova
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">Email postavke će biti dostupne uskoro...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Društvene Mreže
              </CardTitle>
              <CardDescription>
                Povežite vaše račune društvenih mreža
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">Postavke društvenih mreža će biti dostupne uskoro...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
