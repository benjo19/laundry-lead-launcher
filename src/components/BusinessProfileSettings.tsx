
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusinessProfile, BusinessProfile } from '@/hooks/useBusinessProfile';
import { Building2, Target, MessageSquare, Globe, Save, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BusinessProfileSettings = () => {
  const { profile, isLoading, saveProfile } = useBusinessProfile();
  const { toast } = useToast();
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
  
  const [originalData, setOriginalData] = useState<BusinessProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      const profileData = {
        company_name: profile.company_name || '',
        industry: profile.industry || '',
        business_description: profile.business_description || '',
        target_audience: profile.target_audience || '',
        company_values: profile.company_values || '',
        ai_tone: profile.ai_tone || 'professional',
        ai_goals: Array.isArray(profile.ai_goals) ? profile.ai_goals : [],
        email_signature: profile.email_signature || '',
        website: profile.website || '',
        location: profile.location || ''
      };
      setFormData(profileData);
      setOriginalData(profileData);
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

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.company_name.trim()) {
      errors.push('Naziv tvrtke je obavezan');
    }
    
    if (!formData.industry.trim()) {
      errors.push('Industrija je obavezna');
    }
    
    if (!formData.business_description.trim()) {
      errors.push('Opis poslovanja je obavezan');
    }
    
    if (formData.website && !formData.website.startsWith('http')) {
      errors.push('Website mora počinjati s http:// ili https://');
    }
    
    return errors;
  };

  const hasChanges = (): boolean => {
    if (!originalData) return true;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    const currentGoals = Array.isArray(formData.ai_goals) ? formData.ai_goals : [];
    if (checked) {
      setFormData({ ...formData, ai_goals: [...currentGoals, goal] });
    } else {
      setFormData({ ...formData, ai_goals: currentGoals.filter(g => g !== goal) });
    }
  };

  const handleSave = () => {
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast({
        title: "Greška u validaciji",
        description: "Molimo ispravite greške prije spremanja.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "Nema promjena",
        description: "Profil je već ažuran.",
      });
    }
  };

  const confirmSave = async () => {
    setIsSaving(true);
    setShowConfirmDialog(false);
    
    try {
      // Ensure all required fields are present and ai_goals is an array
      const cleanedData = {
        ...formData,
        ai_goals: Array.isArray(formData.ai_goals) ? formData.ai_goals : [],
        company_name: formData.company_name.trim(),
        industry: formData.industry.trim(),
        business_description: formData.business_description.trim()
      };

      console.log('Saving profile data:', cleanedData);
      
      await saveProfile(cleanedData);
      setOriginalData({ ...cleanedData });
      setValidationErrors([]);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja profila. Molimo pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalData) {
      setFormData({ ...originalData });
      setValidationErrors([]);
      toast({
        title: "Forma resetirana",
        description: "Vraćeni su originalni podaci.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Učitava poslovni profil...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeAiGoals = Array.isArray(formData.ai_goals) ? formData.ai_goals : [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Poslovni Profil
          </CardTitle>
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Greške u formi:</span>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Naziv tvrtke *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Vaša tvrtka d.o.o."
                className={validationErrors.some(e => e.includes('Naziv tvrtke')) ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industrija *</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="IT, Usluge, Proizvodnja..."
                className={validationErrors.some(e => e.includes('Industrija')) ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="business_description">Opis poslovanja *</Label>
            <Textarea
              id="business_description"
              value={formData.business_description}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              placeholder="Kratko opišite čime se vaša tvrtka bavi..."
              rows={3}
              className={validationErrors.some(e => e.includes('Opis poslovanja')) ? 'border-red-500' : ''}
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
              className={validationErrors.some(e => e.includes('Website')) ? 'border-red-500' : ''}
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

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sprema...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Spremi profil
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSaving || !hasChanges()}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetiraj
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrdite spremanje</DialogTitle>
            <DialogDescription>
              Jeste li sigurni da želite spremiti promjene u poslovnom profilu?
              Ove informacije će se koristiti za personalizaciju AI odgovora.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Odustani
            </Button>
            <Button onClick={confirmSave}>
              Da, spremi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BusinessProfileSettings;
