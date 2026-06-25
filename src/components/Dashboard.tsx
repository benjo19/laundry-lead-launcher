import React, { useEffect, useMemo, useState } from 'react';
import {
  Phone,
  AlertTriangle,
  Flame,
  FileText,
  Wallet,
  Percent,
  UserPlus,
  FilePlus,
  CalendarPlus,
  Sparkles,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { useReminders } from '@/hooks/useReminders';
import { Lead, Reminder } from '@/types';
import SalesFunnel from '@/components/SalesFunnel';
import DensityToggle from '@/components/ui/density-toggle';
import { useDensity } from '@/hooks/useDensity';

interface DashboardProps {
  onNavigateToModule?: (module: string) => void;
}

type OfferRow = {
  id: string;
  broj_ponude: string;
  klijent_ime: string;
  status: string;
  datum_ponude: string;
  datum_valjanosti: string | null;
  currency: string | null;
  popust_ukupno: number | null;
  pdv_stopa: number | null;
};

type OfferItemRow = {
  offer_id: string;
  kolicina: number;
  cijena_bez_pdv: number;
  popust: number | null;
};

const EUR = new Intl.NumberFormat('hr-HR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const isToday = (d: Date) => {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
};

const isBeforeToday = (d: Date) => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d.getTime() < t.getTime();
};

const relativeDay = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Danas';
  if (diff === 1) return 'Sutra';
  if (diff === -1) return 'Jučer';
  if (diff > 1) return `Za ${diff} dana`;
  return `Kasni ${Math.abs(diff)} d`;
};

const Kpi = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  onClick,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
  compact?: boolean;
}) => {
  const toneRing: Record<string, string> = {
    neutral: 'bg-muted text-muted-foreground',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'surface-card text-left hover:border-foreground/20 hover:shadow-lg transition-all group',
        compact ? 'p-2.5' : 'p-4'
      )}
    >
      <div className={cn('flex items-start justify-between', compact ? 'gap-2' : 'gap-3')}>
        <p className="section-title">{label}</p>
        <span
          className={cn(
            'rounded-md flex items-center justify-center',
            compact ? 'h-6 w-6' : 'h-8 w-8',
            toneRing[tone]
          )}
        >
          <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </span>
      </div>
      <div className={cn('flex items-baseline gap-2', compact ? 'mt-1.5' : 'mt-3')}>
        <span
          className={cn(
            'font-semibold tabular-nums tracking-tight text-foreground',
            compact ? 'text-xl' : 'text-3xl'
          )}
        >
          {value}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </button>
  );
};

const PriorityBadge = ({ p }: { p: Lead['potential'] }) => {
  const map = {
    Visok: { label: 'Vruće', cls: 'bg-priority-hot/10 text-priority-hot border-priority-hot/20' },
    Srednji: { label: 'Toplo', cls: 'bg-priority-warm/10 text-priority-warm border-priority-warm/20' },
    Nizak: { label: 'Hladno', cls: 'bg-priority-cold/10 text-priority-cold border-priority-cold/20' },
  } as const;
  const cfg = map[p] ?? map.Srednji;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium',
        cfg.cls
      )}
    >
      <span className="status-dot bg-current" />
      {cfg.label}
    </span>
  );
};

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-card hover:bg-accent hover:border-foreground/20 transition-colors text-left"
  >
    <span className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
      <Icon className="h-4 w-4" />
    </span>
    <span className="text-sm font-medium text-foreground flex-1">{label}</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </button>
);

const Dashboard = ({ onNavigateToModule }: DashboardProps) => {
  const { user } = useAuthContext();
  const { leads } = useLeadManagement();
  const { reminders } = useReminders();
  const { density } = useDensity();
  const compact = density === 'compact';
  const rowPy = compact ? 'py-1.5' : 'py-3';
  const rowPx = compact ? 'px-3' : 'px-5';

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [offerItems, setOfferItems] = useState<OfferItemRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: o } = await supabase
        .from('offers')
        .select('id, broj_ponude, klijent_ime, status, datum_ponude, datum_valjanosti, currency, popust_ukupno, pdv_stopa')
        .eq('user_id', user.id);
      if (cancelled) return;
      const list = (o ?? []) as OfferRow[];
      setOffers(list);
      if (list.length > 0) {
        const { data: items } = await supabase
          .from('offer_items')
          .select('offer_id, kolicina, cijena_bez_pdv, popust')
          .in('offer_id', list.map((x) => x.id));
        if (!cancelled) setOfferItems((items ?? []) as OfferItemRow[]);
      } else {
        setOfferItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const today = new Date();

  const todayReminders = useMemo(
    () =>
      (reminders ?? []).filter(
        (r: Reminder) => r.status === 'Aktivan' && r.date && isToday(new Date(r.date))
      ),
    [reminders]
  );

  const overdueReminders = useMemo(
    () =>
      (reminders ?? []).filter(
        (r: Reminder) => r.status === 'Aktivan' && r.date && isBeforeToday(new Date(r.date))
      ),
    [reminders]
  );

  const hotLeads = useMemo(
    () => (leads ?? []).filter((l: Lead) => l.potential === 'Visok' && l.status !== 'Odbačen'),
    [leads]
  );

  const offerTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const it of offerItems) {
      const line = (Number(it.kolicina) || 0) * (Number(it.cijena_bez_pdv) || 0) * (1 - (Number(it.popust) || 0) / 100);
      totals.set(it.offer_id, (totals.get(it.offer_id) || 0) + line);
    }
    return totals;
  }, [offerItems]);

  const closedStatuses = new Set(['Dobiveno', 'Izgubljeno', 'won', 'lost']);
  const openOffers = useMemo(
    () => offers.filter((o) => !closedStatuses.has(o.status)),
    [offers]
  );

  const pipelineValue = useMemo(
    () => openOffers.reduce((sum, o) => sum + (offerTotals.get(o.id) ?? 0), 0),
    [openOffers, offerTotals]
  );
  // Estimated margin — fixed at 22% until real margin data lands.
  const estimatedMargin = pipelineValue * 0.22;

  const overdueOffers = useMemo(() => {
    return openOffers.filter((o) => {
      if (!o.datum_valjanosti) return false;
      const d = new Date(o.datum_valjanosti);
      return isBeforeToday(d);
    });
  }, [openOffers]);

  // Priority today: build a unified action list
  const priorityToday = useMemo(() => {
    const items: Array<{
      key: string;
      title: string;
      sub: string;
      meta: string;
      tone: 'warning' | 'danger' | 'neutral';
      onClick: () => void;
    }> = [];

    for (const r of overdueReminders.slice(0, 5)) {
      items.push({
        key: `rem-${r.id}`,
        title: r.company || r.title,
        sub: r.description || r.title || 'Zakašnjeli follow-up',
        meta: relativeDay(r.date),
        tone: 'danger',
        onClick: () => onNavigateToModule?.('crm-reminder'),
      });
    }
    for (const r of todayReminders.slice(0, 5)) {
      items.push({
        key: `rem-t-${r.id}`,
        title: r.company || r.title,
        sub: r.description || r.title || 'Follow-up danas',
        meta: 'Danas',
        tone: 'warning',
        onClick: () => onNavigateToModule?.('crm-reminder'),
      });
    }
    for (const l of hotLeads.slice(0, 5)) {
      items.push({
        key: `lead-${l.id}`,
        title: l.company,
        sub: [l.city || l.location, l.industry].filter(Boolean).join(' · ') || 'Hot lead',
        meta: 'Vruće',
        tone: 'warning',
        onClick: () => onNavigateToModule?.('lead-hunter'),
      });
    }
    return items.slice(0, 8);
  }, [overdueReminders, todayReminders, hotLeads, onNavigateToModule]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Koga danas zovem, što stoji i gdje je novac.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DensityToggle />
          <div className="text-xs text-muted-foreground tabular-nums">
            {today.toLocaleDateString('hr-HR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </header>

      {/* Layout: KPIs + main left, sidebar right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi
              label="Današnji follow-upovi"
              value={todayReminders.length.toString()}
              icon={Phone}
              tone="warning"
              onClick={() => onNavigateToModule?.("crm-reminder")}
              compact={compact}
            />
            <Kpi
              label="Zakašnjele aktivnosti"
              value={overdueReminders.length.toString()}
              icon={AlertTriangle}
              tone="danger"
              onClick={() => onNavigateToModule?.("crm-reminder")}
              compact={compact}
            />
            <Kpi
              label="Hot leadovi"
              value={hotLeads.length.toString()}
              icon={Flame}
              tone="warning"
              onClick={() => onNavigateToModule?.("lead-hunter")}
              compact={compact}
            />
            <Kpi
              label="Otvorene ponude"
              value={openOffers.length.toString()}
              icon={FileText}
              tone="neutral"
              onClick={() => onNavigateToModule?.("offers")}
              compact={compact}
            />
            <Kpi
              label="Vrijednost pipelinea"
              value={EUR.format(pipelineValue)}
              icon={Wallet}
              tone="neutral"
              onClick={() => onNavigateToModule?.("offers")}
              compact={compact}
            />
            <Kpi
              label="Procijenjena marža"
              value={EUR.format(estimatedMargin)}
              hint="~22%"
              icon={Percent}
              tone="success"
              onClick={() => onNavigateToModule?.("offers")}
              compact={compact}
            />
          </div>

          {/* Sales funnel snapshot */}
          <SalesFunnel
            leads={leads}
            variant="compact"
            onStageClick={() => onNavigateToModule?.('lead-hunter')}
          />



          {/* Prioritet danas */}
          <section className="surface-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Prioritet danas</h2>
                <p className="text-xs text-muted-foreground">Sljedeći najbolji korak po klijentu</p>
              </div>
              <button
                onClick={() => onNavigateToModule?.("crm-reminder")}
                className="text-xs font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                Sve aktivnosti <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="divide-y divide-border">
              {priorityToday.length === 0 ? (
                <li className="px-5 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Sve čisto. Dobar dan da se otvore nove ponude.
                  </p>
                </li>
              ) : (
                priorityToday.map((it) => (
                  <li key={it.key}>
                    <button
                      onClick={it.onClick}
                      className={cn(
                        'w-full flex items-center gap-3 hover:bg-muted/50 transition-colors text-left',
                        rowPx,
                        rowPy
                      )}
                    >
                      <span
                        className={cn(
                          'h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                          it.tone === 'danger' && 'bg-destructive/10 text-destructive',
                          it.tone === 'warning' && 'bg-warning/10 text-warning',
                          it.tone === 'neutral' && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {(it.title || '?').slice(0, 2).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{it.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{it.sub}</p>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium tabular-nums shrink-0',
                          it.tone === 'danger' && 'text-destructive',
                          it.tone === 'warning' && 'text-warning',
                          it.tone === 'neutral' && 'text-muted-foreground'
                        )}
                      >
                        {it.meta}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Zakašnjele ponude + Hot leadovi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="surface-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Ponude koje stoje</h3>
                  <p className="text-xs text-muted-foreground">Istekla valjanost ili bez pokreta</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {overdueOffers.length}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {overdueOffers.slice(0, 5).map((o) => (
                  <li
                    key={o.id}
                    className={cn(
                      'flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer',
                      rowPx,
                      rowPy
                    )}
                    onClick={() => onNavigateToModule?.("offers")}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {o.klijent_ime}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{o.broj_ponude}</p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                      {EUR.format(offerTotals.get(o.id) ?? 0)}
                    </span>
                  </li>
                ))}
                {overdueOffers.length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Nema zaglavljenih ponuda.
                  </li>
                )}
              </ul>
            </section>

            <section className="surface-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Hot leadovi</h3>
                  <p className="text-xs text-muted-foreground">Visok potencijal, treba kontakt</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {hotLeads.length}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {hotLeads.slice(0, 5).map((l) => (
                  <li
                    key={l.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onNavigateToModule?.("lead-hunter")}
                  >
                    <span className="h-8 w-8 rounded-full bg-priority-hot/10 text-priority-hot text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {(l.company || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{l.company}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[l.city || l.location, l.industry].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <PriorityBadge p={l.potential} />
                  </li>
                ))}
                {hotLeads.length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Još nema hot leadova.
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>

        {/* Right sidebar widgets */}
        <aside className="space-y-4">
          <section className="surface-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Brze akcije</h3>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <QuickAction
                icon={UserPlus}
                label="Dodaj lead"
                onClick={() => onNavigateToModule?.("lead-hunter")}
              />
              <QuickAction
                icon={FilePlus}
                label="Dodaj ponudu"
                onClick={() => onNavigateToModule?.("offers")}
              />
              <QuickAction
                icon={CalendarPlus}
                label="Dodaj follow-up"
                onClick={() => onNavigateToModule?.("crm-reminder")}
              />
              <QuickAction
                icon={Sparkles}
                label="Generiraj prodajni mail"
                onClick={() => onNavigateToModule?.('email-generator')}
              />
            </div>
          </section>

          <section className="surface-card">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Nadolazeći podsjetnici</h3>
            </div>
            <ul className="divide-y divide-border">
              {(reminders ?? [])
                .filter((r: Reminder) => r.status === 'Aktivan' && r.date)
                .sort(
                  (a: Reminder, b: Reminder) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .slice(0, 4)
                .map((r: Reminder) => {
                  const overdue = isBeforeToday(new Date(r.date));
                  return (
                    <li key={r.id} className="px-4 py-3 flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-1 h-2 w-2 rounded-full shrink-0',
                          overdue ? 'bg-destructive' : 'bg-warning'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {r.company || r.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.description || r.title}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-[11px] tabular-nums shrink-0',
                          overdue ? 'text-destructive' : 'text-muted-foreground'
                        )}
                      >
                        {relativeDay(r.date)}
                      </span>
                    </li>
                  );
                })}
              {(reminders ?? []).filter((r: Reminder) => r.status === 'Aktivan').length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Nema aktivnih podsjetnika.
                </li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
