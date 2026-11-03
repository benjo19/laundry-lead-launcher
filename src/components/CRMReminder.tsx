import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { Reminder, ReminderFormData, EMPTY_REMINDER_FORM } from '@/types';
import { useReminders } from '@/hooks/useReminders';
import { useMakeIntegration } from '@/hooks/useMakeIntegration';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import CRMCalendar, { PROJECTS, EVENT_TYPE_LABEL } from './crm/CRMCalendar';
import GoogleCalendarConnectCard from './crm/GoogleCalendarConnectCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExportButton from './ExportButton';
import ReminderFilters from './crm/ReminderFilters';
import ReminderForm from './crm/ReminderForm';
import ReminderList from './crm/ReminderList';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import DensityToggle from '@/components/ui/density-toggle';
import { useDensity } from '@/hooks/useDensity';
import { Button } from '@/components/ui/button';


const localDate = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const CRMReminder = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tab, setTab] = useState<'calendar' | 'list'>('calendar');
  const { triggerWebhook } = useMakeIntegration();
  const { toast } = useToast();
  const { density } = useDensity();
  const compact = density === 'compact';
  const [newReminder, setNewReminder] = useState<ReminderFormData>(EMPTY_REMINDER_FORM);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [saving, setSaving] = useState(false);
  const { leads } = useLeadManagement();
  const { reminders, loading, error, createReminder, updateReminderStatus, deleteReminder, postponeReminder, refreshReminders, updateReminder } = useReminders();
  const gcal = useGoogleCalendar();
  const pulledRef = useRef(false);

  useEffect(() => {
    if (!gcal.isConnected || pulledRef.current) return;
    pulledRef.current = true;
    gcal.pullChanges().then(res => {
      if (res.ok && res.data && (res.data.updated || res.data.cancelled)) {
        toast({ title: 'Promjene iz Google kalendara', description: `Ažurirano: ${res.data.updated}, otkazano: ${res.data.cancelled}` });
      }
      refreshReminders();
    });
  }, [gcal.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredReminders = useMemo(() => reminders.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter)
    && (priorityFilter === 'all' || r.priority === priorityFilter)
    && (projectFilter === 'all' || (projectFilter === 'none' ? !r.project : r.project === projectFilter))
    && (typeFilter === 'all' || (r.eventType || 'follow_up') === typeFilter)
  ), [reminders, statusFilter, priorityFilter, projectFilter, typeFilter]);

  const today = localDate();
  const sevenDays = new Date(); sevenDays.setDate(sevenDays.getDate() + 7);
  const weekEnd = localDate(sevenDays);
  const stats = useMemo(() => ({
    overdue: reminders.filter(r => r.status === 'Aktivan' && r.date && r.date < today).length,
    today: reminders.filter(r => r.status === 'Aktivan' && r.date === today).length,
    week: reminders.filter(r => r.status === 'Aktivan' && r.date >= today && r.date <= weekEnd).length,
    completed: reminders.filter(r => r.status === 'Završen').length,
  }), [reminders, today, weekEnd]);

  /** Sync one saved reminder; reports only the real Google result. */
  const sync = async (r: Reminder | null, op: 'upsert' | 'cancel') => {
    if (!r?.uuid) return false;
    if (!gcal.isConnected) return false;
    const res = await gcal.syncReminder(r.uuid, op);
    await refreshReminders();
    if (res.ok) {
      toast({ title: op === 'cancel' ? 'Otkazano u Google kalendaru' : 'Sinkronizirano s Google kalendarom', description: `"${r.title}"` });
      return true;
    }
    toast({ title: 'Google sinkronizacija nije uspjela', description: `${res.error} — termin je spremljen u CRM; pokušaj ponovno.`, variant: 'destructive' });
    if (res.reconnectRequired) gcal.refreshStatus();
    return false;
  };

  const handleCreateReminder = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await createReminder(newReminder);
      if (!saved) return;
      setNewReminder(EMPTY_REMINDER_FORM);
      triggerWebhook('reminder_created', { title: saved.title, company: saved.company, priority: saved.priority, date: saved.date, time: saved.time }).catch(() => undefined);
      await sync(saved, 'upsert');
    } finally { setSaving(false); }
  };

  const handleUpdateReminderStatus = async (id: number, status: Reminder['status']) => {
    const updated = await updateReminderStatus(id, status);
    if (updated && status === 'Završen') {
      triggerWebhook('reminder_completed', { id: updated.id, title: updated.title, company: updated.company, completed_at: new Date().toISOString() }).catch(() => undefined);
    }
    if (updated && status === 'Aktivan' && updated.calendarEventId) await sync(updated, 'upsert');
  };

  const handlePostpone = async (id: number) => {
    const updated = await postponeReminder(id);
    if (updated?.calendarEventId) await sync(updated, 'upsert');
  };

  const handleCancel = async (r: Reminder) => {
    const updated = await updateReminderStatus(r.id, 'Otkazan');
    if (updated?.calendarEventId) await sync(updated, 'cancel');
  };

  const handleDelete = async (id: number) => {
    const r = reminders.find(x => x.id === id);
    if (!r) return;
    if (r.calendarEventId && r.syncStatus !== 'cancelled') {
      if (gcal.isConnected) {
        if (!(await sync(r, 'cancel'))) return; // keep the CRM record if Google still has the event
      } else if (!window.confirm('Termin postoji u Google kalendaru, a kalendar nije povezan. Obrisati samo iz CRM-a?')) return;
    }
    await deleteReminder(id);
  };

  const handleEditReminder = (r: Reminder) => {
    setEditingReminder(r);
    setNewReminder({ title: r.title, description: r.description, date: r.date, time: r.time, priority: r.priority, company: r.company, companyInputMode: r.leadUuid ? 'select' : 'manual', eventType: r.eventType || 'follow_up', project: r.project || '', durationMinutes: r.durationMinutes || 60, leadUuid: r.leadUuid });
  };

  const resetForm = () => { setEditingReminder(null); setNewReminder(EMPTY_REMINDER_FORM); };

  const handleUpdateReminder = async () => {
    if (!editingReminder || saving) return;
    setSaving(true);
    try {
      const updated = await updateReminder(editingReminder.id, newReminder);
      if (!updated) return;
      resetForm();
      if (updated.status !== 'Otkazan') await sync(updated, 'upsert');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="mx-auto w-full max-w-7xl px-3 py-10 sm:px-6"><LoadingSpinner size="lg" text="Učitavam follow-upove..." className="py-12" /></div>;
  if (error) return <div className="mx-auto w-full max-w-7xl px-3 py-10 sm:px-6"><ErrorMessage message={`Greška: ${error}`} onRetry={refreshReminders} /></div>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-3 pb-24 pt-4 sm:px-6 sm:pt-5 md:pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="pr-12 sm:pr-0">
          <p className="text-sm font-medium text-muted-foreground">Automind CRM</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Follow-up</h1>
          <p className="mt-1 text-sm text-muted-foreground">Prodajne obveze, podsjetnici i sljedeći koraci na jednom mjestu.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshReminders} className="gap-2"><RefreshCw className="h-4 w-4" />Osvježi</Button>
          <DensityToggle />
          <ExportButton data={filteredReminders} filename="crm-follow-up" type="reminders" leads={leads} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard label="Kasni" value={stats.overdue} icon={AlertCircle} tone={stats.overdue ? 'danger' : 'neutral'} />
        <StatCard label="Danas" value={stats.today} icon={CalendarClock} tone={stats.today ? 'warning' : 'neutral'} />
        <StatCard label="Ovaj tjedan" value={stats.week} icon={Clock3} />
        <StatCard label="Završeno" value={stats.completed} icon={CheckCircle2} tone="success" />
      </div>

      <GoogleCalendarConnectCard status={gcal.status} checking={gcal.checking}
        onConnect={gcal.connect} onDisconnect={gcal.disconnect}
        onPull={async () => { const r = await gcal.pullChanges(); if (!r.ok || !r.data) throw new Error(r.error); await refreshReminders(); toast({ title: 'Google promjene povučene', description: `Provjereno: ${r.data.checked}, ažurirano: ${r.data.updated}, otkazano: ${r.data.cancelled}` }); }} />

      <Card>
        <CardContent className="p-3 sm:p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <ReminderFilters statusFilter={statusFilter} priorityFilter={priorityFilter} onStatusFilterChange={setStatusFilter} onPriorityFilterChange={setPriorityFilter} />
            <Select value={projectFilter} onValueChange={setProjectFilter}><SelectTrigger className="h-10 lg:w-44" aria-label="Projekt"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Svi projekti</SelectItem>{PROJECTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}<SelectItem value="none">Bez projekta</SelectItem></SelectContent></Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="h-10 lg:w-40" aria-label="Vrsta"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Sve vrste</SelectItem>{Object.entries(EVENT_TYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2"><div><h2 className="font-semibold">Termini</h2><p className="text-sm text-muted-foreground">{filteredReminders.length} prikazano</p></div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'calendar' | 'list')}><TabsList><TabsTrigger value="calendar">Kalendar</TabsTrigger><TabsTrigger value="list">Popis</TabsTrigger></TabsList></Tabs></div>
          {tab === 'calendar'
            ? <CRMCalendar reminders={filteredReminders} onSelect={handleEditReminder} onCreateAt={(date, time) => { resetForm(); setNewReminder({ ...EMPTY_REMINDER_FORM, date, time: time || '' }); }} />
            : <ReminderList reminders={filteredReminders} onUpdateStatus={handleUpdateReminderStatus} onPostpone={handlePostpone} onDelete={handleDelete} onEdit={handleEditReminder} onRetrySync={(r) => sync(r, r.status === 'Otkazan' ? 'cancel' : 'upsert')} onCancel={handleCancel} compact={compact} />}
        </section>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">{editingReminder ? 'Uredi termin' : 'Novi termin'}</CardTitle></CardHeader>
            <CardContent>
              <ReminderForm newReminder={newReminder} setNewReminder={setNewReminder} leads={leads} onCreateReminder={editingReminder ? handleUpdateReminder : handleCreateReminder} editingReminder={editingReminder} onCancelEdit={resetForm} />
              {saving && <p className="mt-2 text-xs text-muted-foreground">Spremam…</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, tone = 'neutral' }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone?: 'neutral' | 'danger' | 'warning' | 'success' }) => {
  const toneClass = tone === 'danger' ? 'text-destructive' : tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground';
  return <Card><CardContent className="p-3 sm:p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p><Icon className={`h-4 w-4 ${toneClass}`} /></div><p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p></CardContent></Card>;
};

export default CRMReminder;
