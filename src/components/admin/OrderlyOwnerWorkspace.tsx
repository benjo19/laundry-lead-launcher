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

const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const endOfToday = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };

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
    const active = all.filter((lead) => !['Dobiveno','Izgubljeno','Zatvoren','Odbačen'].includes(lead.status));
    const overdue = active.filter((lead) => lead.next_action_at && new Date(lead.next_action_at) < todayStart)
      .sort((a,b) => new Date(a.next_action_at!).getTime() - new Date(b.next_action_at!).getTime());
    const today = active.filter((lead) => lead.next_action_at && new Date(lead.next_action_at) >= todayStart && new Date(lead.next_action_at) <= todayEnd)
      .sort((a,b) => new Date(a.next_action_at!).getTime() - new Date(b.next_action_at!).getTime());
    const noNextStep = active.filter((lead) => !lead.next_step && !lead.next_action_at);
    const stale = active.filter((lead) => {
      if (!lead.last_contact_at) return false;
      return now.getTime() - new Date(lead.last_contact_at).getTime() > 7 * 24 * 60 * 60 * 1000 && !lead.next_action_at;
    });
    const mine = all.filter((lead) => (lead.assigned_to || lead.user_id) === user?.id).length;
    const partner = all.length - mine;
    const activePipeline = active.length;
    return { total: all.length, mine, partner, activePipeline, overdue, today, noNextStep, stale };
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
    const queue = [
      ...dashboard.overdue.slice(0,5).map((lead) => ({ lead, kind: 'Kasni', tone: 'destructive' as const })),
      ...dashboard.today.slice(0,5).map((lead) => ({ lead, kind: 'Danas', tone: 'secondary' as const })),
    ].slice(0,8);

    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-24 pt-4 sm:px-6 sm:pt-5 md:pb-8">
        <div className="flex items-start justify-between gap-4 pr-12 md:pr-0">
          <div>
            <p className="text-sm font-medium text-muted-foreground">CRM operativni inbox</p>
            <h1 className="text-2xl font-bold tracking-tight">Danas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Što treba napraviti danas i koji leadovi ispadaju iz procesa.</p>
          </div>
          <Button onClick={() => setAddLeadOpen(true)} className="hidden shrink-0 gap-2 sm:flex"><Plus className="h-4 w-4" />Dodaj lead</Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <StatCard label="Kasni" value={loading ? '…' : dashboard.overdue.length} icon={AlertTriangle} />
          <StatCard label="Danas" value={loading ? '…' : dashboard.today.length} icon={CalendarClock} />
          <StatCard label="Bez sljedeće akcije" value={loading ? '…' : dashboard.noNextStep.length} icon={Clock3} />
          <StatCard label="Aktivni pipeline" value={loading ? '…' : dashboard.activePipeline} icon={BarChart3} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <section className="rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><h2 className="font-semibold">Prioritetni follow-upovi</h2><p className="text-sm text-muted-foreground">Prvo kasni, zatim obveze za danas.</p></div>
              <Button variant="outline" size="sm" onClick={() => setActiveModule('follow-up')}>Svi</Button>
            </div>
            <div className="space-y-2">
              {!loading && queue.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nema današnjih ni overdue follow-upova.</div>}
              {queue.map(({ lead, kind, tone }) => (
                <button key={`${kind}-${lead.uuid}`} type="button" onClick={() => setActiveModule('leads')} className="flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left hover:bg-muted/30">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium">{lead.company}</p><Badge variant={tone}>{kind}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{lead.next_step || 'Follow-up'}</p><p className="mt-1 text-xs text-muted-foreground">{lead.interested_in || 'Bez kategorije'}{lead.next_action_at ? ` · ${new Date(lead.next_action_at).toLocaleString('hr-HR')}` : ''}</p></div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
            <h2 className="font-semibold">Rupe u pipelineu</h2>
            <p className="mb-3 text-sm text-muted-foreground">Leadovi koji nemaju jasan sljedeći potez.</p>
            <button type="button" onClick={() => setActiveModule('leads')} className="mb-2 flex w-full items-center justify-between rounded-xl border p-3 text-left"><span><strong>{dashboard.noNextStep.length}</strong><span className="ml-2 text-sm text-muted-foreground">bez sljedeće akcije</span></span><Users className="h-4 w-4 text-muted-foreground" /></button>
            <button type="button" onClick={() => setActiveModule('leads')} className="flex w-full items-center justify-between rounded-xl border p-3 text-left"><span><strong>{dashboard.stale.length}</strong><span className="ml-2 text-sm text-muted-foreground">stari 7+ dana bez follow-upa</span></span><Clock3 className="h-4 w-4 text-muted-foreground" /></button>
          </section>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Svi leadovi" value={dashboard.total} />
            <MiniStat label="Moji" value={dashboard.mine} />
            <MiniStat label="Kod terenaca" value={dashboard.partner} />
            <MiniStat label="Aktivni" value={dashboard.activePipeline} />
          </div>
        </div>
      </div>
    );
  };

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
          <div><p className="text-sm font-semibold">Orderly Owner CRM</p><p className="text-xs text-muted-foreground">Prodaja i terenci</p></div>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => { const Icon = item.icon; const active = activeModule === item.id; return <Button key={item.id} variant={active ? 'secondary' : 'ghost'} size="sm" className="gap-2" onClick={() => setActiveModule(item.id)}><Icon className="h-4 w-4" />{item.label}</Button>; })}
            <Button size="sm" className="ml-2 gap-2" onClick={() => setAddLeadOpen(true)}><Plus className="h-4 w-4" />Dodaj lead</Button>
            <Button size="sm" variant="ghost" className="ml-1 gap-2 text-muted-foreground" onClick={handleSignOut} disabled={signingOut}><LogOut className="h-4 w-4" />{signingOut ? 'Odjava…' : 'Odjava'}</Button>
          </div>
        </div>
      </div>

      <button type="button" onClick={handleSignOut} disabled={signingOut} className="fixed right-3 top-3 z-50 flex items-center gap-2 rounded-xl border bg-background/95 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur md:hidden" aria-label="Odjava"><LogOut className="h-4 w-4" />{signingOut ? 'Odjava…' : 'Odjava'}</button>
      <main>{renderModule()}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {NAV_ITEMS.slice(0,2).map((item) => <MobileNavButton key={item.id} item={item} active={activeModule === item.id} onClick={() => setActiveModule(item.id)} />)}
          <button type="button" onClick={() => setAddLeadOpen(true)} className="mx-auto flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg" aria-label="Dodaj lead"><Plus className="h-6 w-6" /></button>
          {NAV_ITEMS.slice(2).map((item) => <MobileNavButton key={item.id} item={item} active={activeModule === item.id} onClick={() => setActiveModule(item.id)} />)}
        </div>
      </nav>
      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onAddLead={handleAddLead} />
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) => <div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p><Icon className="h-4 w-4 text-muted-foreground" /></div><p className="mt-2 text-2xl font-bold sm:text-3xl">{value}</p></div>;
const MiniStat = ({ label, value }: { label: string; value: number }) => <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
const MobileNavButton = ({ item, active, onClick }: { item: { id: OwnerModule; label: string; icon: React.ComponentType<{ className?: string }> }; active: boolean; onClick: () => void }) => { const Icon = item.icon; return <button type="button" onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}><Icon className="h-5 w-5" /><span>{item.label}</span></button>; };

export default OrderlyOwnerWorkspace;
