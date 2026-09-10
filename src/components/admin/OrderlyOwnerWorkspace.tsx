import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarClock, Clock3, Home, LogOut, Plus, UserRoundSearch, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAssignedLeads } from '@/hooks/useAssignedLeads';
import AddLeadDialog from '@/components/AddLeadDialog';
import OrderlyOwnerCRM from '@/components/admin/OrderlyOwnerCRM';
import AdminPartnerOverview from '@/components/admin/AdminPartnerOverview';
import CRMReminder from '@/components/CRMReminder';

type OwnerModule = 'today' | 'leads' | 'follow-up' | 'partners';

const NAV_ITEMS: Array<{ id: OwnerModule; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'today', label: 'Danas', icon: Home },
  { id: 'leads', label: 'Leadovi', icon: Users },
  { id: 'follow-up', label: 'Follow-up', icon: CalendarClock },
  { id: 'partners', label: 'Terenci', icon: UserRoundSearch },
];

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

const OrderlyOwnerWorkspace: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OwnerModule>('today');
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { signOut, user } = useAuthContext();
  const { leads, loading, refreshLeads, addLead } = useAssignedLeads();

  const dashboard = useMemo(() => {
    const all = leads ?? [];
    const now = new Date();
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const active = all.filter((lead) => !['Dobiveno', 'Izgubljeno', 'Zatvoren', 'Odbačen'].includes(lead.status));
    const overdue = active.filter((lead) => lead.next_action_at && new Date(lead.next_action_at) < todayStart)
      .sort((a, b) => new Date(a.next_action_at!).getTime() - new Date(b.next_action_at!).getTime());
    const today = active.filter((lead) => lead.next_action_at && new Date(lead.next_action_at) >= todayStart && new Date(lead.next_action_at) <= todayEnd)
      .sort((a, b) => new Date(a.next_action_at!).getTime() - new Date(b.next_action_at!).getTime());
    const noNextStep = active.filter((lead) => !lead.next_step && !lead.next_action_at);
    const stale = active.filter((lead) => {
      if (!lead.last_contact_at || lead.next_action_at) return false;
      return now.getTime() - new Date(lead.last_contact_at).getTime() > 7 * 24 * 60 * 60 * 1000;
    });
    const mine = all.filter((lead) => (lead.assigned_to || lead.user_id) === user?.id).length;
    const partner = all.length - mine;
    return { total: all.length, mine, partner, activePipeline: active.length, overdue, today, noNextStep, stale };
  }, [leads, user?.id]);

  const handleSignOut = async () => {
    if (signingOut) return;
    try { setSigningOut(true); await signOut(); } finally { setSigningOut(false); }
  };

  const handleAddLead = async (...args: Parameters<typeof addLead>) => {
    const result = await addLead(...args);
    if (result) { setAddLeadOpen(false); await refreshLeads(); setActiveModule('leads'); }
    return result;
  };

  const renderToday = () => {
    const actionQueue = [
      ...dashboard.overdue.map((lead) => ({ lead, kind: 'Kasni', tone: 'destructive' as const, rank: 0 })),
      ...dashboard.today.map((lead) => ({ lead, kind: 'Danas', tone: 'secondary' as const, rank: 1 })),
      ...dashboard.noNextStep.slice(0, 3).map((lead) => ({ lead, kind: 'Bez akcije', tone: 'outline' as const, rank: 2 })),
      ...dashboard.stale.slice(0, 3).map((lead) => ({ lead, kind: 'Miruje 7+ dana', tone: 'outline' as const, rank: 3 })),
    ].sort((a, b) => a.rank - b.rank).slice(0, 10);

    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-24 pt-4 sm:px-6 sm:pt-5 md:pb-8">
        <div className="flex items-start justify-between gap-4 pr-14 md:pr-0">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Automind CRM</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Danas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Prodajni inbox: prvo obveze i leadovi koji traže reakciju.</p>
          </div>
          <Button onClick={() => setAddLeadOpen(true)} className="hidden shrink-0 gap-2 sm:flex"><Plus className="h-4 w-4" />Dodaj lead</Button>
        </div>

        <section className="rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Za napraviti danas</h2>
              <p className="text-sm text-muted-foreground">Kasni prvo, zatim današnje obveze i leadovi bez sljedećeg poteza.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveModule('follow-up')}>Svi follow-upovi</Button>
          </div>
          <div className="space-y-2">
            {!loading && actionQueue.length === 0 && <div className="rounded-xl border border-dashed p-7 text-center text-sm text-muted-foreground">Nema hitnih obveza. Pipeline je čist za danas.</div>}
            {actionQueue.map(({ lead, kind, tone }) => (
              <button key={`${kind}-${lead.uuid}`} type="button" onClick={() => setActiveModule('leads')} className="group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/30 sm:p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{lead.company}</p>
                    <Badge variant={tone}>{kind}</Badge>
                    {lead.status && <Badge variant="outline">{lead.status}</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{lead.next_step || 'Nema definiranog sljedećeg koraka'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{lead.interested_in || 'Bez kategorije'}{lead.next_action_at ? ` · ${new Date(lead.next_action_at).toLocaleString('hr-HR')}` : ''}</p>
                </div>
                <span className="hidden shrink-0 text-sm font-medium text-primary sm:block">Otvori</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <StatCard label="Kasni" value={loading ? '…' : dashboard.overdue.length} icon={AlertTriangle} emphasis={dashboard.overdue.length > 0 ? 'danger' : 'neutral'} />
          <StatCard label="Danas" value={loading ? '…' : dashboard.today.length} icon={CalendarClock} />
          <StatCard label="Bez sljedeće akcije" value={loading ? '…' : dashboard.noNextStep.length} icon={Clock3} />
          <StatCard label="Aktivni pipeline" value={loading ? '…' : dashboard.activePipeline} icon={BarChart3} />
        </div>

        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-3"><h2 className="font-semibold">Pregled pipelinea</h2><p className="text-sm text-muted-foreground">Kratki operativni pregled bez dodatnog klikanja.</p></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Svi leadovi" value={dashboard.total} />
            <MiniStat label="Moji" value={dashboard.mine} />
            <MiniStat label="Kod terenaca" value={dashboard.partner} />
            <MiniStat label="Miruje 7+ dana" value={dashboard.stale.length} />
          </div>
        </section>
      </div>
    );
  };

  const renderModule = () => {
    if (activeModule === 'today') return renderToday();
    if (activeModule === 'leads') return <OrderlyOwnerCRM />;
    if (activeModule === 'follow-up') return <CRMReminder />;
    return <div className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6 sm:pt-5 md:pb-8"><AdminPartnerOverview /></div>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="hidden border-b bg-card md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div>
            <p className="text-sm font-semibold">Automind CRM</p>
            <p className="text-xs text-muted-foreground">Prodaja · Orderly · AutomindAI · Oprema</p>
          </div>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => { const Icon = item.icon; const active = activeModule === item.id; return <Button key={item.id} variant={active ? 'secondary' : 'ghost'} size="sm" className="gap-2" onClick={() => setActiveModule(item.id)}><Icon className="h-4 w-4" />{item.label}</Button>; })}
            <Button size="sm" className="ml-2 gap-2" onClick={() => setAddLeadOpen(true)}><Plus className="h-4 w-4" />Dodaj lead</Button>
            <Button size="sm" variant="ghost" className="ml-1 gap-2 text-muted-foreground" onClick={handleSignOut} disabled={signingOut}><LogOut className="h-4 w-4" />{signingOut ? 'Odjava…' : 'Odjava'}</Button>
          </div>
        </div>
      </header>

      <button type="button" onClick={handleSignOut} disabled={signingOut} className="fixed right-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full border bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-muted md:hidden" aria-label="Odjava" title="Odjava"><LogOut className="h-4 w-4" /></button>
      <main>{renderModule()}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {NAV_ITEMS.slice(0, 2).map((item) => <MobileNavButton key={item.id} item={item} active={activeModule === item.id} onClick={() => setActiveModule(item.id)} />)}
          <button type="button" onClick={() => setAddLeadOpen(true)} className="mx-auto flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg" aria-label="Dodaj lead"><Plus className="h-6 w-6" /></button>
          {NAV_ITEMS.slice(2).map((item) => <MobileNavButton key={item.id} item={item} active={activeModule === item.id} onClick={() => setActiveModule(item.id)} />)}
        </div>
      </nav>
      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onAddLead={handleAddLead} />
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, emphasis = 'neutral' }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; emphasis?: 'neutral' | 'danger' }) => (
  <div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p><Icon className={`h-4 w-4 ${emphasis === 'danger' ? 'text-destructive' : 'text-muted-foreground'}`} /></div>
    <p className={`mt-2 text-2xl font-bold sm:text-3xl ${emphasis === 'danger' ? 'text-destructive' : ''}`}>{value}</p>
  </div>
);
const MiniStat = ({ label, value }: { label: string; value: number }) => <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
const MobileNavButton = ({ item, active, onClick }: { item: { id: OwnerModule; label: string; icon: React.ComponentType<{ className?: string }> }; active: boolean; onClick: () => void }) => { const Icon = item.icon; return <button type="button" onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}><Icon className="h-5 w-5" /><span>{item.label}</span></button>; };

export default OrderlyOwnerWorkspace;
