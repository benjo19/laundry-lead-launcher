
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
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
  User
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const Sidebar = ({ activeModule, onModuleChange }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'lead-hunter', label: t('lead_hunter'), icon: Search },
    { id: 'lead-discovery', label: t('lead_discovery'), icon: Compass },
    { id: 'email-generator', label: t('email_generator'), icon: Mail },
    { id: 'crm-reminder', label: t('crm_reminder'), icon: Calendar },
    { id: 'content-booster', label: t('content_booster'), icon: TrendingUp },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{t('marketing_agent')}</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 truncate">{t('ai_assistant')}</p>
          </div>
          <div className="ml-2 shrink-0">
            <LanguageToggle />
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeModule === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-sm sm:text-base p-2 sm:p-3 h-auto",
                activeModule === item.id 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "text-slate-700 hover:bg-slate-100"
              )}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="h-4 w-4 mr-2 sm:mr-3 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center space-x-2 sm:space-x-3 p-2 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-700 hover:bg-slate-100 text-sm p-2 sm:p-3 h-auto"
          onClick={handleSettingsClick}
        >
          <Settings className="h-4 w-4 mr-2 sm:mr-3 shrink-0" />
          <span className="truncate">{t('settings')}</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 text-sm p-2 sm:p-3 h-auto"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2 sm:mr-3 shrink-0" />
          <span className="truncate">{t('logout')}</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
