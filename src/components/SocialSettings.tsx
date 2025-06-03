
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Save, Loader2, Facebook, Linkedin, Instagram } from 'lucide-react';

interface SocialPlatforms {
  facebook: {
    enabled: boolean;
    access_token: string;
    page_id: string;
  };
  linkedin: {
    enabled: boolean;
    access_token: string;
    company_id: string;
  };
  instagram: {
    enabled: boolean;
    access_token: string;
    account_id: string;
  };
}

const SocialSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [platforms, setPlatforms] = useState<SocialPlatforms>({
    facebook: {
      enabled: false,
      access_token: '',
      page_id: ''
    },
    linkedin: {
      enabled: false,
      access_token: '',
      company_id: ''
    },
    instagram: {
      enabled: false,
      access_token: '',
      account_id: ''
    }
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('social_platforms')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.social_platforms && typeof data.social_platforms === 'object' && data.social_platforms !== null) {
        const socialPlatforms = data.social_platforms as Record<string, any>;
        setPlatforms(prev => ({ ...prev, ...socialPlatforms }));
      }
    } catch (error) {
      console.error('Error loading social settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { data: existingRecord } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existingRecord) {
        result = await supabase
          .from('user_settings')
          .update({
            social_platforms: platforms as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            social_platforms: platforms as any,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Postavke spremljene",
        description: "Postavke društvenih mreža su uspješno ažurirane.",
      });
    } catch (error) {
      console.error('Error saving social settings:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja postavki.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePlatform = (platform: keyof SocialPlatforms, field: string, value: any) => {
    setPlatforms(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Društvene Mreže
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="facebook" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facebook" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={platforms.facebook.enabled}
                onCheckedChange={(checked) => updatePlatform('facebook', 'enabled', checked)}
              />
              <Label>Omogući Facebook objave</Label>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="facebook_token">Access Token</Label>
                <Input
                  id="facebook_token"
                  type="password"
                  value={platforms.facebook.access_token}
                  onChange={(e) => updatePlatform('facebook', 'access_token', e.target.value)}
                  placeholder="Vaš Facebook Access Token"
                />
              </div>
              <div>
                <Label htmlFor="facebook_page">Page ID</Label>
                <Input
                  id="facebook_page"
                  value={platforms.facebook.page_id}
                  onChange={(e) => updatePlatform('facebook', 'page_id', e.target.value)}
                  placeholder="ID vaše Facebook stranice"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={platforms.linkedin.enabled}
                onCheckedChange={(checked) => updatePlatform('linkedin', 'enabled', checked)}
              />
              <Label>Omogući LinkedIn objave</Label>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkedin_token">Access Token</Label>
                <Input
                  id="linkedin_token"
                  type="password"
                  value={platforms.linkedin.access_token}
                  onChange={(e) => updatePlatform('linkedin', 'access_token', e.target.value)}
                  placeholder="Vaš LinkedIn Access Token"
                />
              </div>
              <div>
                <Label htmlFor="linkedin_company">Company ID</Label>
                <Input
                  id="linkedin_company"
                  value={platforms.linkedin.company_id}
                  onChange={(e) => updatePlatform('linkedin', 'company_id', e.target.value)}
                  placeholder="ID vaše LinkedIn tvrtke"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="instagram" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={platforms.instagram.enabled}
                onCheckedChange={(checked) => updatePlatform('instagram', 'enabled', checked)}
              />
              <Label>Omogući Instagram objave</Label>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="instagram_token">Access Token</Label>
                <Input
                  id="instagram_token"
                  type="password"
                  value={platforms.instagram.access_token}
                  onChange={(e) => updatePlatform('instagram', 'access_token', e.target.value)}
                  placeholder="Vaš Instagram Access Token"
                />
              </div>
              <div>
                <Label htmlFor="instagram_account">Account ID</Label>
                <Input
                  id="instagram_account"
                  value={platforms.instagram.account_id}
                  onChange={(e) => updatePlatform('instagram', 'account_id', e.target.value)}
                  placeholder="ID vašeg Instagram business računa"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={saveSettings} disabled={isSaving} className="w-full mt-6">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sprema...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Spremi postavke
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialSettings;
