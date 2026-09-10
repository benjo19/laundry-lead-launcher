import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarClock, CircleDollarSign, Home, LogOut, MapPin, Plus, Users, WalletCards } from 'lucide-react';
import PartnerLeads from '@/components/partner/PartnerLeads';
import CRMReminder from '@/components/CRMReminder';
import AddLeadDialog from '@/components/AddLeadDialog';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { usePartnerEarnings } from '@/hooks/usePartnerEarnings';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type PartnerModule = 'today' | 'leads' | 'follow-up' | 'earnings';

const NAV_ITEMS: Array<{ id: PartnerModule; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'today', label: 'Danas', icon: Home },
  { id: 'leads', label: 'Leadovi', icon: Users },
  { id: 'follow-up', label: 'Follow-up', icon: CalendarClock },
  { id: 'earnings', label: 'Zarada', icon: CircleDollarSign },
];

const eur = (value: number) => new Intl.NumberFormat('hr-HR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
}).format(value);

const PartnerWorkspace = () => {
  const [activeModule, setActiveModule] = useState<PartnerModule>('today');
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { signOut } = useAuthContext();
  const { leads, addLead, loading } = useLeadManagement();
  const { locations, commissions, summary, loading: earningsLoading, error: earningsError } = usePartnerEarnings();

  const handleSignOut = async () => {
    if (signingOut) return;
    try {
      setSigningOut(true);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const stats = useMemo(() => {
    const allLeads = leads ?? [];
    const demo = allLeads.filter((lead) => lead.status === 'Demo').length;
    const paying = allLeads.filter((lead) => lead.status === 'Plaća').length;
    const activePipeline = allLeads.filter((lead) => ['Nova', 'Kontaktiran', 'Demo', 'Trial'].includes(lead.status)).length;

    return { total: allLeads.length, activePipeline, demo, paying };
  }, [leads]);

  const renderToday = () => (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-24 pt-5 sm:px-6 md:pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Orderly partner</p>
          <h1 className="text-2xl font-bold tracking-tight">Danas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sve što ti treba za teren, bez marketing alata i viška menija.</p>
        </div>
        <Button onClick={() => setAddLeadOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Dodaj lead</span>
          <span className="sm:hidden">Lead</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Moji leadovi" value={loading ? '…' : stats.total} icon={Users} />
        <StatCard label="Aktivni pipeline" value={loading ? '…' : stats.activePipeline} icon={BarChart3} />
        <StatCard label="Aktivne lokacije" value={earningsLoading ? '…' : summary.activeLocations} icon={MapPin} />
        <StatCard label="Mjesečna provizija" value={earningsLoading ? '…' : eur(summary.monthlyRecurring)} icon={CircleDollarSign} />
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-3">
          <h2 className="font-semibold">Brze akcije</h2>
          <p className="text-sm text-muted-foreground">Najčešće stvari koje radiš na terenu.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button size="lg" className="h-14 justify-start gap-3" onClick={() => setAddLeadOpen(true)}>
            <Plus className="h-5 w-5" /> Dodaj novi lokal
          </Button>
          <Button size="lg" variant="outline" className="h-14 justify-start gap-3" onClick={() => setActiveModule('leads')}>
            <Users className="h-5 w-5" /> Otvori moje leadove
          </Button>
          <Button size="lg" variant="outline" className="h-14 justify-start gap-3" onClick={() => setActiveModule('follow-up')}>
            <CalendarClock className="h-5 w-5" /> Današnji follow-up
          </Button>
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-24 pt-5 sm:px-6 md:pb-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Orderly partner</p>
        <h1 className="text-2xl font-bold tracking-tight">Moja zarada</h1>
        <p className="mt-1 text-sm text-muted-foreground">Provizija se računa po aktivnoj plaćenoj lokaciji, ne po leadu.</p>
      </div>

      {earningsError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {earningsError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Aktivne lokacije" value={earningsLoading ? '…' : summary.activeLocations} icon={MapPin} />
        <StatCard label="Recurring / mj." value={earningsLoading ? '…' : eur(summary.monthlyRecurring)} icon={CircleDollarSign} />
        <StatCard label="Za isplatu" value={earningsLoading ? '…' : eur(summary.pending)} icon={WalletCards} />
        <StatCard label="Ukupno isplaćeno" value={earningsLoading ? '…' : eur(summary.paid)} icon={CircleDollarSign} />
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-4 py-4 sm:px-5">
          <h2 className="font-semibold">Moje aktivne lokacije</h2>
          <p className="text-sm text-muted-foreground">Svaka aktivna lokacija nosi vlastitu mjesečnu proviziju.</p>
        </div>
        <div className="divide-y">
          {!earningsLoading && locations.filter((location) => location.status === 'active').length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Još nema aktivnih lokacija vezanih uz tvoj račun.
            </div>
          )}
          {locations.filter((location) => location.status === 'active').map((location) => (
            <div key={location.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate font-medium">{location.customer_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {location.location_name}{location.city ? ` · ${location.city}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold">{eur(location.monthly_commission)}</p>
                <p className="text-xs text-muted-foreground">mjesečno</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-4 py-4 sm:px-5">
          <h2 className="font-semibold">Povijest provizija</h2>
          <p className="text-sm text-muted-foreground">Obračuni po mjesecu i status isplate.</p>
        </div>
        <div className="divide-y">
          {!earningsLoading && commissions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Još nema obračunatih provizija.</div>
          )}
          {commissions.slice(0, 12).map((commission) => (
            <div key={commission.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
              <div>
                <p className="font-medium">{new Date(`${commission.period_start}T00:00:00`).toLocaleDateString('hr-HR', { month: 'long', year: 'numeric' })}</p>
                <p className="text-xs text-muted-foreground">{commission.status === 'paid' ? 'Isplaćeno' : commission.status === 'approved' ? 'Odobreno' : commission.status === 'cancelled' ? 'Stornirano' : 'Za isplatu'}</p>
              </div>
              <p className="font-semibold">{eur(commission.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModule = () => {
    if (activeModule === 'today') return renderToday();
    if (activeModule === 'leads') return <PartnerLeads onAddLead={() => setAddLeadOpen(true)} />;
    if (activeModule === 'follow-up') return <CRMReminder />;
    return renderEarnings();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden border-b bg-card md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div>
            <p className="text-sm font-semibold">Orderly Partner CRM</p>
            <p className="text-xs text-muted-foreground">Terenska prodaja</p>
          </div>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <Button key={item.id} variant={active ? 'secondary' : 'ghost'} size="sm" className="gap-2" onClick={() => setActiveModule(item.id)}>
                  <Icon className="h-4 w-4" /> {item.label}
                </Button>
              );
            })}
            <Button size="sm" className="ml-2 gap-2" onClick={() => setAddLeadOpen(true)}>
              <Plus className="h-4 w-4" /> Dodaj lead
            </Button>
            <Button size="sm" variant="ghost" className="ml-1 gap-2 text-muted-foreground" onClick={handleSignOut} disabled={signingOut}>
              <LogOut className="h-4 w-4" /> {signingOut ? 'Odjava…' : 'Odjava'}
            </Button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="fixed right-3 top-3 z-50 flex items-center gap-2 rounded-xl border bg-background/95 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur md:hidden"
        aria-label="Odjava"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? 'Odjava…' : 'Odjava'}
      </button>

      <main>{renderModule()}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {NAV_ITEMS.slice(0, 2).map((item) => <MobileNavButton key={item.id} item={item} active={activeModule === item.id} onClick={() => setActiveModule(item.id)} />)}
          <button type="button" onClick={() => setAddLeadOpen(true)} className="mx-auto flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg" aria-label="Dodaj lead">
            <Plus className="h-6 w-6" />
          </button>
          {NAV_ITEMS.slice(2).map((item) => <MobileNavButton key={item.id} item={item} active={activeModule === item.id} onClick={() => setActiveModule(item.id)} />)}
        </div>
      </nav>

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onAddLead={addLead} />
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) => (
  <div className="rounded-2xl border bg-card p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="mt-3 text-2xl font-bold sm:text-3xl">{value}</p>
  </div>
);

const MobileNavButton = ({ item, active, onClick }: {
  item: { id: PartnerModule; label: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <button type="button" onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </button>
  );
};

export default PartnerWorkspace;
