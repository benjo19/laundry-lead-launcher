import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Lead } from '@/types';
import { LEAD_STATUS_META, LeadStatus } from '@/lib/leadStatus';
import { TrendingDown, AlertTriangle } from 'lucide-react';

interface SalesFunnelProps {
  leads: Lead[];
  /** Optional: callback when a stage is clicked (e.g. to filter list). */
  onStageClick?: (status: LeadStatus) => void;
  /** Compact horizontal bar variant (used inside KPI rows). */
  variant?: 'full' | 'compact';
  className?: string;
}

// Canonical funnel stages in order (excludes legacy duplicates and lost/rejected).
const FUNNEL_STAGES: LeadStatus[] = [
  'Nova',
  'Kvalificiran',
  'Kontaktiran',
  'Sastanak',
  'Ponuda',
  'Pregovori',
  'Dobiveno',
];

// Map legacy statuses onto canonical funnel stages so the chart counts them too.
const LEGACY_MAP: Partial<Record<string, LeadStatus>> = {
  Zainteresiran: 'Kontaktiran',
};

const stageColorVar = (status: LeadStatus): string => {
  // Tailwind needs literal classes — map status -> bg utility.
  switch (status) {
    case 'Nova': return 'bg-status-new';
    case 'Kvalificiran': return 'bg-status-analysis';
    case 'Kontaktiran': return 'bg-status-contacted';
    case 'Sastanak': return 'bg-status-offer-draft';
    case 'Ponuda': return 'bg-status-offer-sent';
    case 'Pregovori': return 'bg-status-negotiation';
    case 'Dobiveno': return 'bg-status-won';
    default: return 'bg-muted-foreground';
  }
};

const stageTextVar = (status: LeadStatus): string => {
  switch (status) {
    case 'Nova': return 'text-status-new';
    case 'Kvalificiran': return 'text-status-analysis';
    case 'Kontaktiran': return 'text-status-contacted';
    case 'Sastanak': return 'text-status-offer-draft';
    case 'Ponuda': return 'text-status-offer-sent';
    case 'Pregovori': return 'text-status-negotiation';
    case 'Dobiveno': return 'text-status-won';
    default: return 'text-muted-foreground';
  }
};

interface StageRow {
  status: LeadStatus;
  label: string;
  count: number;
  /** Cumulative count at or beyond this stage (used for funnel width). */
  cumulative: number;
  /** Conversion ratio vs. previous stage cumulative (0..1). null for first. */
  conversion: number | null;
  /** Drop-off ratio between previous cumulative and this cumulative. */
  dropoff: number | null;
  bottleneck: boolean;
}

const computeStages = (leads: Lead[]): StageRow[] => {
  // Count per canonical stage.
  const counts: Record<string, number> = {};
  for (const stage of FUNNEL_STAGES) counts[stage] = 0;

  // Count actual stage occurrences AND treat any lead currently at a later
  // stage as having "passed through" earlier ones (for cumulative funnel).
  // Strategy: build a per-stage "current count" first.
  for (const lead of leads) {
    const raw = lead.status as string;
    const mapped = (LEGACY_MAP[raw] ?? raw) as LeadStatus;
    if (FUNNEL_STAGES.includes(mapped)) {
      counts[mapped] = (counts[mapped] ?? 0) + 1;
    }
    // Won is its own bucket; lost/rejected/closed are excluded from the funnel.
  }

  // Cumulative reaches: a lead at stage N has implicitly passed all stages <= N.
  // cumulative[i] = sum of counts[j] for j >= i
  const cumulative: number[] = [];
  let running = 0;
  for (let i = FUNNEL_STAGES.length - 1; i >= 0; i--) {
    running += counts[FUNNEL_STAGES[i]] ?? 0;
    cumulative[i] = running;
  }

  const rows: StageRow[] = FUNNEL_STAGES.map((status, i) => {
    const cum = cumulative[i];
    const prevCum = i === 0 ? null : cumulative[i - 1];
    const conversion = prevCum && prevCum > 0 ? cum / prevCum : null;
    const dropoff = prevCum && prevCum > 0 ? 1 - cum / prevCum : null;
    return {
      status,
      label: LEAD_STATUS_META[status]?.label ?? status,
      count: counts[status] ?? 0,
      cumulative: cum,
      conversion,
      dropoff,
      bottleneck: false,
    };
  });

  // Mark biggest drop-off (>= 50%) as bottleneck.
  let worstIdx = -1;
  let worstDrop = 0.5; // threshold
  rows.forEach((r, i) => {
    if (r.dropoff != null && r.dropoff > worstDrop && (rows[i - 1]?.cumulative ?? 0) >= 3) {
      worstDrop = r.dropoff;
      worstIdx = i;
    }
  });
  if (worstIdx >= 0) rows[worstIdx].bottleneck = true;

  return rows;
};

export const SalesFunnel: React.FC<SalesFunnelProps> = ({
  leads,
  onStageClick,
  variant = 'full',
  className,
}) => {
  const stages = useMemo(() => computeStages(leads), [leads]);
  const maxCum = stages[0]?.cumulative || 1;

  // Overall lead -> won conversion
  const top = stages[0]?.cumulative ?? 0;
  const won = stages[stages.length - 1]?.cumulative ?? 0;
  const overallRate = top > 0 ? (won / top) * 100 : 0;

  if (variant === 'compact') {
    return (
      <div className={cn('surface-card p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pipeline tijek</h3>
            <p className="text-xs text-muted-foreground">
              Konverzija lead → dobiveno:{' '}
              <span className="font-medium text-foreground tabular-nums">
                {overallRate.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-end gap-1 h-20">
          {stages.map((s) => {
            const h = maxCum > 0 ? Math.max((s.cumulative / maxCum) * 100, 4) : 4;
            return (
              <button
                key={s.status}
                type="button"
                onClick={() => onStageClick?.(s.status)}
                title={`${s.label}: ${s.cumulative} (trenutno ${s.count})`}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <span className="text-[10px] tabular-nums text-muted-foreground group-hover:text-foreground">
                  {s.cumulative}
                </span>
                <div
                  className={cn(
                    'w-full rounded-sm transition-opacity opacity-80 group-hover:opacity-100',
                    stageColorVar(s.status),
                    s.bottleneck && 'ring-2 ring-destructive ring-offset-1 ring-offset-background'
                  )}
                  style={{ height: `${h}%` }}
                />
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1.5">
          {stages.map((s) => (
            <span
              key={s.status}
              className="flex-1 text-[9px] text-muted-foreground text-center truncate"
              title={s.label}
            >
              {s.label.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className={cn('surface-card', className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Prodajni lijevak</h2>
          <p className="text-xs text-muted-foreground">
            Prijelazi kroz stadije, konverzija i mjesta gdje zapinje
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Lead → dobiveno
          </p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {overallRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="p-5 space-y-2.5">
        {stages.map((s, i) => {
          const widthPct = maxCum > 0 ? Math.max((s.cumulative / maxCum) * 100, 2) : 2;
          const isFirst = i === 0;
          return (
            <button
              key={s.status}
              type="button"
              onClick={() => onStageClick?.(s.status)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2 w-2 rounded-full', stageColorVar(s.status))} />
                  <span className="font-medium text-foreground truncate">{s.label}</span>
                  {s.bottleneck && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                      <AlertTriangle className="h-3 w-3" />
                      Usko grlo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 tabular-nums shrink-0">
                  {!isFirst && s.conversion != null && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        s.dropoff && s.dropoff > 0.5
                          ? 'text-destructive'
                          : s.dropoff && s.dropoff > 0.3
                            ? 'text-warning'
                            : 'text-success'
                      )}
                    >
                      <TrendingDown className="h-3 w-3" />
                      {(s.conversion * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    sada <span className="text-foreground font-medium">{s.count}</span>
                  </span>
                  <span className="text-foreground font-semibold w-10 text-right">
                    {s.cumulative}
                  </span>
                </div>
              </div>
              <div className="h-7 bg-muted/40 rounded-md overflow-hidden border border-border/50">
                <div
                  className={cn(
                    'h-full rounded-md transition-all duration-500 opacity-90 group-hover:opacity-100',
                    stageColorVar(s.status)
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </button>
          );
        })}

        {top === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            Još nema leadova u pipelineu.
          </p>
        )}
      </div>

      {top > 0 && (
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Ukupno u lijevku:{' '}
            <span className="font-medium text-foreground tabular-nums">{top}</span>
          </span>
          <span className="text-muted-foreground">
            Najveći pad označen je{' '}
            <span className={cn('font-medium', stages.some((s) => s.bottleneck) ? 'text-destructive' : 'text-muted-foreground')}>
              {stages.some((s) => s.bottleneck) ? 'crveno' : '—'}
            </span>
          </span>
        </div>
      )}
    </section>
  );
};

export default SalesFunnel;
