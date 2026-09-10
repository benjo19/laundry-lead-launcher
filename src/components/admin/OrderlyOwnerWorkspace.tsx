import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarClock, Home, LogOut, Plus, UserRoundSearch, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAssignedLeads } from '@/hooks/useAssignedLeads';
import AddLeadDialog from '@/components/AddLeadDialog';
import OrderlyOwnerCRM from '@/components/admin/OrderlyOwnerCRM';
import AdminPartnerOverview from '@/components/admin/AdminPartnerOverview';
import CRMReminder from '@/components/CRMReminder';
import { useLeadManagement } from '@/hooks/useLeadManagement';

type OwnerModule = 'today' | 'leads' | 'follow-up' | 'partners';

const NAV_ITEMS: Array<{ id: OwnerModule; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'today', label: 'Danas', icon: Home },
  { id: 'leads', label: 'Leadovi', icon: Users },
  { id: 'follow-up', label: 'Follow-up', icon: CalendarClock },
  { id: 'partners', label: 'Terenci', icon: UserRoundSearch },
];

const OrderlyOwnerWorkspace: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OwnerModule>('today');
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { signOut, user } = useAuthContext();
  const { leads, loading, refreshLeads } = useAssignedLeads();
  const { addLead } = useLeadManagement();

  const stats = useMemo(() => {
    const all = leads ?? [];
    const mine = all.filter((lead: any) => (lead.assigned_to || lead.user_id) === user?.id).length;
    const partner = all.length - mine;
    const activePipeline = all.filter((lead: any) => ['Nova', 'Kontaktiran', 'Demo', 'Trial'].includes(lead.status || 'Nova')).length;
    return { total: all.length, mine, partner, activePipeline };
  }, [leads, user?.id]);

  const handleSignOut = async () => {
    if (signingOut) return;
    try {
      setSigningOut(true);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const handleAddLead = async (...args: Parameters<typeof addLead>) => {
    const result = await addLead(...args);
    if (result) {
      setAddLeadOpen(false);
      await refreshLeads();
    }
    return result;
  };

  const renderToday = () => (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-24 pt-5 sm:px-6 md:pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Orderly owner</p>
          <h1 className="text-2xl font-bold tracking-tight">Danas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tvoj Orderly prodajni pregled. Bez alata za praonice i bez marketing modula.</p>
        </div>
        <Button onClick={() => setAddLeadOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Dodaj lead</span>
          <span className="sm:hidden">Lead</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Svi leadovi" value={loading ? '…' : stats.total} icon={Users} />
        <StatCard label="Moji leadovi" value={loading ? '…' : stats.mine} icon={Users} />
        <StatCard label="Od terenaca" value={loading ? '…' : stats.partner} icon={UserRoundSearch} />
        <StatCard label="Aktivni pipeline" value={loading ? '…' : stats.activePipeline} icon={BarChart3} />
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-3">
          <h2 className="font-semibold">Brze akcije</h2>
          <p className="text-sm text-muted-foreground">Isti način rada kao kod terenaca, samo s owner pregledom.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button size="lg" className="h-14 justify-start gap-3" onClick={() => setAddLeadOpen(true)}>
            <Plus className="h-5 w-5" /> Dodaj novi lokal
          </Button>
          <Button size="lg" variant="outline" className="h-14 justify-start gap-3" onClick={() => setActiveModule('leads')}>
            <Users className="h-5 w-5" /> Otvori sve leadove
          </Button>
          <Button size="lg" variant="outline" className="h-14 justify-start gap-3" onClick={() => setActiveModule('partners')}>
            <UserRoundSearch className="h-5 w-5" /> Otvori terence
          </Button>
        </div>
      </div>
    </div>
  );

  const renderModule = () => {
    if (activeModule === 'today') return renderToday();
    if (activeModule === 'leads') return <OrderlyOwnerCRM />;
    if (activeModule === 'follow-up') return <CRMReminder />;
    return <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 sm:px-6 md:pb-8"><AdminPartnerOverview /></div>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden border-b bg-card md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div>
            <p className="text-sm font-semibold">Orderly Owner CRM</p>
            <p className="text-xs text-muted-foreground">Prodaja i terenci</p>
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

      <button type="button" onClick={handleSignOut} disabled={signingOut} className="fixed right-3 top-3 z-50 flex items-center gap-2 rounded-xl border bg-background/95 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur md:hidden" aria-label="Odjava">
        <LogOut className="h-4 w-4" /> {signingOut ? 'Odjava…' : 'Odjava'}
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

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onAddLead={handleAddLead} />
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

const MobileNavButton = ({ item, active, onClick }: { item: { id: OwnerModule; label: string; icon: React.ComponentType<{ className?: string }> }; active: boolean; onClick: () => void }) => {
  const Icon = item.icon;
  return (
    <button type="button" onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </button>
  );
};

export default OrderlyOwnerWorkspace;
