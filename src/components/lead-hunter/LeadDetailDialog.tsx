import React, { useState } from 'react';
import { Lead } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Globe, Users, Building2, Calendar, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (leadId: number, newStatus: Lead['status']) => void;
  onUpdateNotes: (leadId: number, notes: string) => Promise<void>;
  onEmailClick: (email: string, company: string) => void;
}

const LeadDetailDialog = ({
  lead,
  open,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  onEmailClick
}: LeadDetailDialogProps) => {
  const [notes, setNotes] = useState(lead?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
    }
  }, [lead]);

  if (!lead) return null;

  const handleSaveNotes = async () => {
    if (notes === lead.notes) {
      toast({
        title: "Nema promjena",
        description: "Bilješke nisu promijenjene.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateNotes(lead.id, notes);
      toast({
        title: "Bilješke spremljene",
        description: "Bilješke su uspješno ažurirane i sinkronizirane s CRM-om.",
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće spremiti bilješke.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const extractCity = (location: string) => {
    if (!location) return 'Nepoznato';
    const parts = location.split(',').map(p => p.trim());
    return parts.length > 1 ? parts[parts.length - 2] : parts[0];
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'Visok': return 'bg-green-100 text-green-800 border-green-300';
      case 'Srednji': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Nizak': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Kontaktiran': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Zainteresiran': return 'bg-green-100 text-green-800 border-green-300';
      case 'Odbačen': return 'bg-red-100 text-red-800 border-red-300';
      case 'Zatvoren': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Building2 className="h-6 w-6 text-primary" />
            {lead.company}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Potential Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={`text-sm border ${getStatusColor(lead.status)}`}>
              {lead.status}
            </Badge>
            <Badge className={`text-sm border ${getPotentialColor(lead.potential)}`}>
              Potencijal: {lead.potential}
            </Badge>
            {lead.industry && (
              <Badge variant="outline" className="text-sm">
                {lead.industry}
              </Badge>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">Kontakt informacije</h3>
              
              {lead.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm break-all">{lead.email}</p>
                  </div>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                    <p className="text-sm">{lead.phone}</p>
                  </div>
                </div>
              )}

              {lead.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <a 
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {lead.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">Detalji tvrtke</h3>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Lokacija</p>
                  <p className="text-sm">{extractCity(lead.location)}</p>
                </div>
              </div>

              {lead.employees && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Broj zaposlenika</p>
                    <p className="text-sm">{lead.employees}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Dodano</p>
                  <p className="text-sm">{new Date(lead.dateAdded).toLocaleDateString('hr-HR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Ažuriraj status</label>
            <Select 
              value={lead.status} 
              onValueChange={(value: Lead['status']) => onUpdateStatus(lead.id, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${opt.dotClass}`} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bilješke (automatski se sinkroniziraju s CRM-om)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodajte bilješke o ovom lead-u..."
              className="min-h-32 resize-none"
            />
            <Button
              onClick={handleSaveNotes}
              disabled={isSaving || notes === lead.notes}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Spremanje...' : 'Spremi bilješke'}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => onEmailClick(lead.email, lead.company)}
              disabled={!lead.email}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Pošalji email
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Zatvori
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
