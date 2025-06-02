
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lead-hunter', label: 'Lead Hunter', icon: Search },
    { id: 'lead-discovery', label: 'Lead Discovery', icon: Compass },
    { id: 'email-generator', label: 'Email Generator', icon: Mail },
    { id: 'crm-reminder', label: 'CRM Podsjetnici', icon: Calendar },
    { id: 'content-booster', label: 'Content Booster', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Marketing Agent</h1>
        <p className="text-sm text-slate-600 mt-1">AI asistent za marketing</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeModule === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeModule === item.id 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "text-slate-700 hover:bg-slate-100"
              )}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center space-x-3 p-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-700 hover:bg-slate-100"
          onClick={() => onModuleChange('settings')}
        >
          <Settings className="h-4 w-4 mr-3" />
          Postavke
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Odjava
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
