
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { 
  LayoutDashboard, 
  Search, 
  Compass, 
  Mail, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Settings,
  LogOut,
  User,
  Database,
  Brain,
  TestTube,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const Sidebar = ({ activeModule, onModuleChange }: SidebarProps) => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'lead-hunter', label: t('lead_hunter'), icon: Search },
    { id: 'lead-discovery', label: t('lead_discovery'), icon: Compass },
    { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
    { id: 'ai-chat', label: 'AI Asistent', icon: Brain },
    { id: 'email-scraping-test', label: 'Email Scraping Test', icon: TestTube },
    { id: 'email-generator', label: t('email_generator'), icon: Mail },
    { id: 'crm-reminder', label: 'CRM Datoteke', icon: Calendar },
    { id: 'content-booster', label: t('content_booster'), icon: TrendingUp },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full shadow-elegant">
      <div className="p-4 sm:p-6 border-b border-border bg-gradient-primary">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-primary-foreground truncate">{t('marketing_agent')}</h1>
            <p className="text-xs sm:text-sm text-primary-foreground/80 mt-1 truncate">{t('ai_assistant')}</p>
          </div>
          <div className="ml-2 shrink-0">
            <LanguageToggle />
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "premium" : "ghost"}
              className={cn(
                "w-full justify-start text-sm font-medium p-3 h-12 rounded-lg transition-all duration-200",
                isActive 
                  ? "shadow-elegant scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent-hover hover:scale-102"
              )}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="h-5 w-5 mr-3 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3 bg-muted/30">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-card shadow-sm">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent-hover text-sm p-3 h-11 rounded-lg transition-all duration-200"
          onClick={handleSettingsClick}
        >
          <Settings className="h-4 w-4 mr-3 shrink-0" />
          <span className="truncate">{t('settings')}</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 text-sm p-3 h-11 rounded-lg transition-all duration-200"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3 shrink-0" />
          <span className="truncate">{t('logout')}</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
