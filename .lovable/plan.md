# Premium Sales Cockpit Redesign

Visual + UX polish only. Database, Supabase, auth, webhooks, AI generation and CRM logic stay untouched. Every change is in `src/components/**`, `src/pages/**`, `src/index.css`, `tailwind.config.ts`.

## Design language (locked)

- **Palette**: navy sidebar `#0F1B3D` → `#1E3A5F`, app bg `#F4F6FA`, cards `#FFFFFF`, borders `#E4E8EF`, primary blue `#1D4ED8`, text `#0F172A` / muted `#64748B`.
- **Semantic accents** (used sparingly, only where stated): amber `#F59E0B` for hot/urgent, red `#DC2626` for overdue/lost, green `#16A34A` for won/success.
- **Surfaces**: 1px hairline borders, shadow `0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)`, radius `10px` cards / `8px` controls. No gradients except the navy sidebar.
- **Type**: Inter (UI) + Inter Tight (headings/numerics, tabular-nums for KPIs).
- **Density**: compact B2B (row height 44px, card padding 16–20px). No hero illustrations, no emoji, no decorative blocks.

All colors land as HSL tokens in `index.css`; existing semantic tokens (`status-*`, `primary`, `sidebar-*`) get re-tuned — no hardcoded hex in components.

## Phased delivery

```text
Phase A  Tokens + shell      → index.css, tailwind.config.ts, Sidebar, AppHeader
Phase B  Dashboard           → KPI row, Prioritet danas, Ponude, Hot leads, Brze akcije
Phase C  Leadovi             → sales table, badges, filters, mobile cards
Phase D  Ponude (Kanban)     → 6-column pipeline, offer cards
Phase E  Follow-up           → tabs (Danas/Zakašnjelo/Tjedan/Sve), action rows
Phase F  AI Mail             → 2-col layout, agent status, action buttons
Phase G  Klijent profil      → 3-col premium account layout
Phase H  Dokumenti + Integracije + Postavke polish
Phase I  Mobile pass (table→card, sidebar collapse, KPI scroll-snap)
```

## Section-by-section spec

**Sidebar (navy)** — items in this order: Dashboard, Leadovi, Klijenti, Ponude, Follow-up, AI Mail, Dokumenti, Integracije, Postavke. Active item: left 3px blue bar + lighter navy fill. Lucide icons only, 18px. Profile chip pinned bottom.

**Top app header** — breadcrumb + global search + "Brzi unos leada" primary button + active business-profile switcher.

**Dashboard** — 6 KPI cards in one row (wraps to 3×2 on md, scroll-snap on mobile): Današnji follow-upovi, Zakašnjele aktivnosti, Vrući leadovi, Otvorene ponude, Vrijednost pipelinea, Procijenjena marža. Below: 2-col grid — left (Prioritet danas list, Ponude koje stoje table-mini, Zadnje aktivnosti feed); right (Brze akcije card with Dodaj lead / Dodaj ponudu / Dodaj follow-up / Generiraj email, Vrući leadovi list). Funnel becomes a thin strip above the grid.

**Leadovi** — keep current table component, restyle: 44px rows, sticky header, status pill (navy text on tinted bg), priority dot (amber/blue/slate), columns Firma · Kontakt · Grad · Segment · Status · Prioritet · Sljedeći korak · Follow-up · Vrijednost · ▾. Filter bar above table (status multi-select, prioritet, segment, grad, "samo moji"). On <md collapses to card list.

**Ponude** — convert grid → Kanban: Nacrt / Poslano / Pregovori / Leasing / Dobiveno / Izgubljeno. Card shows klijent, vrijednost (bold tabular), marža %, proizvodi (chips, max 3 +N), zadnji kontakt, sljedeća akcija + datum. Drag to move status (uses existing updateOfferStatus).

**Follow-up** — tabs Danas | Zakašnjelo | Ovaj tjedan | Sve. Row: klijent · tip akcije · due (red if overdue) · prioritet · [Označi riješeno] [Generiraj mail]. Empty state per tab.

**AI Mail** — two columns. Left form: lead/klijent select, cilj emaila, segment, dodatne upute, primary "Generiraj email preko Make.com". Right: rendered HTML preview in white card with toolbar Kopiraj · Spremi u bilješke · Regeneriraj · Kreiraj follow-up. Above left column: Make.com agent status card (dot + Povezano/Nije povezano/Greška + zadnje generiranje timestamp). Send Status panel kept, restyled.

**Klijent profil** — 3 columns: left (kontakt + firma + segment + tagovi), center tabs (Bilješke, Potrebe, Proizvodi, Budget, Timeline), right (Sljedeće akcije, Ponude, Dokumenti, "Generiraj AI mail" shortcut).

**Dokumenti** — uniform card grid: ikona po tipu, naziv, brand chip, kategorija, datum; gornji bar: upload + search. No previews larger than 80px thumb.

**Integracije / Postavke** — section cards with hairline divider, status pills, primary action right-aligned. Remove decorative gradients.

## Technical notes

- New tokens: `--surface`, `--surface-elevated`, `--border-subtle`, `--sidebar-bg`, `--sidebar-bg-hover`, `--accent-hot`, `--accent-overdue`, `--accent-won`. Tailwind `theme.extend.colors` mirrors them. Drop `.bg-app-gradient` in favor of flat `bg-background`.
- Reusable primitives added under `src/components/ui/`: `KpiCard`, `SectionCard`, `StatusPill`, `PriorityDot`, `EmptyState`, `ToolbarFilters`. Replace ad-hoc inline styles in existing screens with these.
- Kanban uses `@dnd-kit/core` (already installed) — no new deps expected. Verify before Phase D; if missing, add it.
- Mobile: `useIsMobile` hook drives table→card swap on Leadovi and Ponude.
- No changes to: hooks, edge functions, Supabase schema, webhook payloads, lead-status taxonomy, email generation flow.

## Out of scope

New features, copy beyond requested microcopy, dark-mode rework, marketing pages, onboarding, charts beyond the existing funnel/KPI sparklines.
