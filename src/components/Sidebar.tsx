
import React from 'react';
import { Search, Mail, Users, FileText, BarChart3, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const modules = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'lead-hunter', name: 'Lead Hunter', icon: Search },
  { id: 'lead-discovery', name: 'Lead Discovery', icon: MapPin },
  { id: 'email-generator', name: 'Email Generator', icon: Mail },
  { id: 'crm-reminder', name: 'CRM Podsjetnik', icon: Calendar },
  { id: 'content-booster', name: 'Content Booster', icon: FileText },
  { id: 'analytics', name: 'Tracking & Analiza', icon: BarChart3 },
];

const Sidebar = ({ activeModule, onModuleChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-blue-400">Marketing Agent</h1>
        <p className="text-sm text-slate-400 mt-1">B2B SaaS za praonce rublja</p>
      </div>
      
      <nav className="mt-8">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={cn(
                "w-full flex items-center px-6 py-3 text-left transition-colors hover:bg-slate-800",
                activeModule === module.id && "bg-blue-600 border-r-2 border-blue-400"
              )}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span>{module.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
