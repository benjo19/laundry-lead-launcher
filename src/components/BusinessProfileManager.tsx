import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusinessProfile, BusinessProfile } from '@/hooks/useBusinessProfile';
import { Building2, Plus, Trash2, Star, Save, RotateCcw, Loader2, AlertTriangle, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BusinessDocuments from './BusinessDocuments';

const BusinessProfileManager = () => {
  const { profiles, selectedProfile, isLoading, saveProfile, deleteProfile, setDefaultProfile, setSelectedProfileId } = useBusinessProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BusinessProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const aiGoalOptions = [
    'Generiranje personaliziranih emailova',
    'Kreiranje sadržaja za društvene mreže',
    'Podrška u pronalaženju leadova',
    'Automatizacija CRM komunikacije',
    'Kreiranje marketing materijala',
    'Analiza tržišta i konkurencije'
  ];

  const getEmptyProfile = (): BusinessProfile => ({
    name: '',
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

  const validateForm = (profile: BusinessProfile): string[] => {
    const errors: string[] = [];
    
    if (!profile.name?.trim()) {
      errors.push('Naziv profila je obavezan');
    }
    
    if (!profile.company_name?.trim()) {
      errors.push('Naziv tvrtke je obavezan');
    }
    
    if (!profile.industry?.trim()) {
      errors.push('Industrija je obavezna');
    }
    
    if (!profile.business_description?.trim()) {
      errors.push('Opis poslovanja je obavezan');
    }
    
    if (profile.website && !profile.website.startsWith('http')) {
      errors.push('Website mora počinjati s http:// ili https://');
    }
    
    return errors;
  };

  const handleEdit = (profile: BusinessProfile) => {
    setEditingProfile({ ...profile });
    setIsEditing(true);
    setValidationErrors([]);
  };

  const handleNew = () => {
    setEditingProfile(getEmptyProfile());
    setIsEditing(true);
    setValidationErrors([]);
  };

  const handleSave = async () => {
    if (!editingProfile) return;

    const errors = validateForm(editingProfile);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast({
        title: "Greška u validaciji",
        description: "Molimo ispravite greške prije spremanja.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile(editingProfile);
      setIsEditing(false);
      setEditingProfile(null);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (profileId: string) => {
    setProfileToDelete(profileId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;

    try {
      await deleteProfile(profileToDelete);
      setShowDeleteDialog(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    if (!editingProfile) return;
    
    const currentGoals = Array.isArray(editingProfile.ai_goals) ? editingProfile.ai_goals : [];
    if (checked) {
      setEditingProfile({ ...editingProfile, ai_goals: [...currentGoals, goal] });
    } else {
      setEditingProfile({ ...editingProfile, ai_goals: currentGoals.filter(g => g !== goal) });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Učitava poslovne profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEditing && editingProfile) {
    const safeAiGoals = Array.isArray(editingProfile.ai_goals) ? editingProfile.ai_goals : [];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingProfile.id ? 'Uredi Poslovni Profil' : 'Novi Poslovni Profil'}
            </span>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Odustani
            </Button>
          </CardTitle>
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
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
          <div>
            <Label htmlFor="profile_name">Naziv profila *</Label>
            <Input
              id="profile_name"
              value={editingProfile.name}
              onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
              placeholder="Glavni profil, Sekundarni brend, Projekt X..."
              className={validationErrors.some(e => e.includes('Naziv profila')) ? 'border-red-500' : ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Naziv tvrtke *</Label>
              <Input
                id="company_name"
                value={editingProfile.company_name}
                onChange={(e) => setEditingProfile({ ...editingProfile, company_name: e.target.value })}
                placeholder="Vaša tvrtka d.o.o."
                className={validationErrors.some(e => e.includes('Naziv tvrtke')) ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industrija *</Label>
              <Input
                id="industry"
                value={editingProfile.industry}
                onChange={(e) => setEditingProfile({ ...editingProfile, industry: e.target.value })}
                placeholder="IT, Usluge, Proizvodnja..."
                className={validationErrors.some(e => e.includes('Industrija')) ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="business_description">Opis poslovanja *</Label>
            <Textarea
              id="business_description"
              value={editingProfile.business_description}
              onChange={(e) => setEditingProfile({ ...editingProfile, business_description: e.target.value })}
              placeholder="Kratko opišite čime se vaša tvrtka bavi..."
              rows={3}
              className={validationErrors.some(e => e.includes('Opis poslovanja')) ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="target_audience">Ciljna skupina</Label>
            <Textarea
              id="target_audience"
              value={editingProfile.target_audience}
              onChange={(e) => setEditingProfile({ ...editingProfile, target_audience: e.target.value })}
              placeholder="Opišite vašu ciljnu skupinu klijenata..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="company_values">Vrijednosti tvrtke</Label>
            <Textarea
              id="company_values"
              value={editingProfile.company_values}
              onChange={(e) => setEditingProfile({ ...editingProfile, company_values: e.target.value })}
              placeholder="Ključne vrijednosti i pristup vašeg poslovanja..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ai_tone">Ton AI komunikacije</Label>
              <Select value={editingProfile.ai_tone} onValueChange={(value: any) => setEditingProfile({ ...editingProfile, ai_tone: value })}>
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
                value={editingProfile.location}
                onChange={(e) => setEditingProfile({ ...editingProfile, location: e.target.value })}
                placeholder="Zagreb, Hrvatska"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={editingProfile.website}
              onChange={(e) => setEditingProfile({ ...editingProfile, website: e.target.value })}
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
              value={editingProfile.email_signature}
              onChange={(e) => setEditingProfile({ ...editingProfile, email_signature: e.target.value })}
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
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Odustani
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Poslovni Profili
            </span>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novi Profil
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nemate još niti jedan poslovni profil.</p>
              <p className="text-sm mt-2">Kliknite "Novi Profil" za dodavanje.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <Card key={profile.id} className={selectedProfile?.id === profile.id ? 'border-primary' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{profile.name}</h3>
                          {profile.is_default && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Tvrtka:</strong> {profile.company_name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Industrija:</strong> {profile.industry}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {profile.business_description.substring(0, 100)}
                          {profile.business_description.length > 100 && '...'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProfileId(profile.id!)}
                          disabled={selectedProfile?.id === profile.id}
                        >
                          {selectedProfile?.id === profile.id ? 'Odabran' : 'Odaberi'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(profile)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!profile.is_default && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultProfile(profile.id!)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        {profiles.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(profile.id!)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BusinessDocuments />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrda brisanja</DialogTitle>
            <DialogDescription>
              Jeste li sigurni da želite izbrisati ovaj profil? Ova akcija se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Odustani
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Da, izbriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessProfileManager;
