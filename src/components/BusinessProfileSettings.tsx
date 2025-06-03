
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBusinessProfile, BusinessProfile } from '@/hooks/useBusinessProfile';
import { Building2, Target, MessageSquare, Globe } from 'lucide-react';

const BusinessProfileSettings = () => {
  const { profile, isLoading, saveProfile } = useBusinessProfile();
  const [formData, setFormData] = useState<BusinessProfile>({
    company_name: '',
    industry: '',
    business_description: '',
    target_audience: '',
    company_values: '',
    ai_tone: 'professional',
    ai_goals: [],
    email_signature: '',
    website: '',
    location: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        ...profile,
        ai_goals: Array.isArray(profile.ai_goals) ? profile.ai_goals : []
      });
    }
  }, [profile]);

  const aiGoalOptions = [
    'Generiranje personaliziranih emailova',
    'Kreiranje sadržaja za društvene mreže', 
    'Podrška u pronalaženju leadova',
    'Automatizacija CRM komunikacije',
    'Kreiranje marketing materijala',
    'Analiza tržišta i konkurencije'
  ];

  const handleGoalChange = (goal: string, checked: boolean) => {
    const currentGoals = Array.isArray(formData.ai_goals) ? formData.ai_goals : [];
    if (checked) {
      setFormData({ ...formData, ai_goals: [...currentGoals, goal] });
    } else {
      setFormData({ ...formData, ai_goals: currentGoals.filter(g => g !== goal) });
    }
  };

  const handleSave = () => {
    saveProfile(formData);
  };

  if (isLoading) {
    return <div>Učitava...</div>;
  }

  const safeAiGoals = Array.isArray(formData.ai_goals) ? formData.ai_goals : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Poslovni Profil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Naziv tvrtke</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Vaša tvrtka d.o.o."
            />
          </div>
          <div>
            <Label htmlFor="industry">Industrija</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="IT, Usluge, Proizvodnja..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="business_description">Opis poslovanja</Label>
          <Textarea
            id="business_description"
            value={formData.business_description}
            onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
            placeholder="Kratko opišite čime se vaša tvrtka bavi..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="target_audience">Ciljna skupina</Label>
          <Textarea
            id="target_audience"
            value={formData.target_audience}
            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            placeholder="Opišite vašu ciljnu skupinu klijenata..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="company_values">Vrijednosti tvrtke</Label>
          <Textarea
            id="company_values"
            value={formData.company_values}
            onChange={(e) => setFormData({ ...formData, company_values: e.target.value })}
            placeholder="Ključne vrijednosti i pristup vašeg poslovanja..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ai_tone">Ton AI komunikacije</Label>
            <Select value={formData.ai_tone} onValueChange={(value: any) => setFormData({ ...formData, ai_tone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profesionalni</SelectItem>
                <SelectItem value="friendly">Prijateljski</SelectItem>
                <SelectItem value="casual">Opušteni</SelectItem>
                <SelectItem value="authoritative">Autoritativan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Lokacija</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Zagreb, Hrvatska"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://www.vaša-tvrtka.hr"
          />
        </div>

        <div>
          <Label>Ciljevi AI asistenta</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {aiGoalOptions.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox
                  id={goal}
                  checked={safeAiGoals.includes(goal)}
                  onCheckedChange={(checked) => handleGoalChange(goal, checked as boolean)}
                />
                <Label htmlFor={goal} className="text-sm">{goal}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="email_signature">Email potpis</Label>
          <Textarea
            id="email_signature"
            value={formData.email_signature}
            onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
            placeholder="Vaš standardni email potpis..."
            rows={3}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Spremi poslovni profil
        </Button>
      </CardContent>
    </Card>
  );
};

export default BusinessProfileSettings;
