import React from 'react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CalendarCheck,
  FolderOpen,
  Mail,
  Plug,
  Settings as SettingsIcon,
  LogOut,
  Shield,
  ChevronDown,
  Compass,
  Database,
  Brain,
  TrendingUp,
  BarChart3,
  CreditCard,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const primaryNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'lead-hunter', label: 'Leadovi', icon: Users },
  { id: 'clients', label: 'Klijenti', icon: Briefcase },
  { id: 'offers', label: 'Ponude', icon: FileText },
  { id: 'crm-reminder', label: 'Follow-up', icon: CalendarCheck },
  { id: 'documents', label: 'Dokumenti', icon: FolderOpen },
  { id: 'email-generator', label: 'AI Mail', icon: Mail },
  { id: 'integrations', label: 'Integracije', icon: Plug },
  { id: 'settings', label: 'Postavke', icon: SettingsIcon },
];

const secondaryNav: NavItem[] = [
  { id: 'lead-discovery', label: 'Lead Discovery', icon: Compass },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
  { id: 'ai-chat', label: 'AI Asistent', icon: Brain },
  { id: 'content-booster', label: 'Content Booster', icon: TrendingUp },
  { id: 'analytics', label: 'Analitika', icon: BarChart3 },
  { id: 'subscription', label: 'Pretplata', icon: CreditCard },
];

const Sidebar = ({ activeModule, onModuleChange }: SidebarProps) => {
  const { user, signOut } = useAuthContext();
  const { isAdmin } = useAdminStatus();
  const [moreOpen, setMoreOpen] = React.useState(
    secondaryNav.some((i) => i.id === activeModule)
  );

  const initials = (user?.user_metadata?.full_name || user?.email || 'BR')
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join('');

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeModule === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onModuleChange(item.id)}
        className={cn(
          'group relative w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full transition-all',
            isActive ? 'bg-sidebar-primary' : 'bg-transparent'
          )}
          aria-hidden
        />
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-md bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center">
            <span className="text-sidebar-primary text-sm font-bold tracking-tight">B</span>
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-accent-foreground text-sm font-semibold leading-tight">
              Brentareno CRM
            </p>
            <p className="text-sidebar-foreground/70 text-[11px] leading-tight">
              Prodajni cockpit
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-0.5">
        {primaryNav.map(renderItem)}

        {/* Više / secondary */}
        <div className="pt-4">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <span>Više</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                moreOpen ? 'rotate-180' : ''
              )}
            />
          </button>
          {moreOpen && (
            <div className="mt-1 space-y-0.5">
              {secondaryNav.map(renderItem)}
              {isAdmin &&
                renderItem({ id: 'admin-dashboard', label: 'Admin', icon: Shield })}
            </div>
          )}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md">
          <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
            <span className="text-sidebar-accent-foreground text-xs font-semibold">
              {initials || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-accent-foreground text-sm font-medium truncate">
              {user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split('@')[0]}
            </p>
            <p className="text-sidebar-foreground/60 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Odjavi se</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
