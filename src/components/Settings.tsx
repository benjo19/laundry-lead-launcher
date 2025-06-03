
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings2, User, Brain, Mail, Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BusinessProfileSettings from './BusinessProfileSettings';
import AISettings from './AISettings';
import EmailSettings from './EmailSettings';
import SocialSettings from './SocialSettings';

const Settings = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Postavke</h2>
          <p className="text-slate-600">Upravljajte vašim korisničkim postavkama i preferencijama</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Povratak na Dashboard
        </Button>
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
