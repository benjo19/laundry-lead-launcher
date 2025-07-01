
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mail, Calendar, TrendingUp, Target, MessageSquare } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead, Email, Reminder, ContentPost } from '@/types';

interface DashboardProps {
  onNavigateToModule?: (module: string) => void;
}

const Dashboard = ({ onNavigateToModule }: DashboardProps) => {
  const [leads] = useLocalStorage<Lead[]>('leads', []);
  const [emails] = useLocalStorage<Email[]>('emails', []);
  const [reminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [posts] = useLocalStorage<ContentPost[]>('contentPosts', []);

  // Calculate real statistics
  const totalLeads = leads.length;
  const sentEmails = emails.filter(e => e.status === 'Sent').length;
  const activeReminders = reminders.filter(r => r.status === 'Aktivan').length;
  const publishedPosts = posts.filter(p => p.status === 'Published').length;

  // Calculate changes (mock data for demo)
  const leadChange = totalLeads > 0 ? `+${Math.round(totalLeads * 0.12)}` : '+0';
  const emailChange = sentEmails > 0 ? `+${Math.round(sentEmails * 0.08)}` : '+0';
  const reminderChange = activeReminders > 0 ? `+${Math.min(activeReminders, 3)}` : '+0';

  const stats = [
    { 
      title: 'Ukupno Leadova', 
      value: totalLeads.toString(), 
      change: leadChange, 
      icon: Users, 
      color: 'text-blue-600',
      module: 'lead-hunter'
    },
    { 
      title: 'Poslani Emailovi', 
      value: sentEmails.toString(), 
      change: emailChange, 
      icon: Mail, 
      color: 'text-green-600',
      module: 'email-generator'
    },
    { 
      title: 'Aktivni Podsjetnici', 
      value: activeReminders.toString(), 
      change: reminderChange, 
      icon: Calendar, 
      color: 'text-orange-600',
      module: 'crm-reminder'
    },
    { 
      title: 'Objavljeni Postovi', 
      value: publishedPosts.toString(), 
      change: `+${publishedPosts}`, 
      icon: TrendingUp, 
      color: 'text-purple-600',
      module: 'content-booster'
    },
  ];

  // Recent activity from real data
  const recentActivity = [
    ...leads.slice(0, 2).map(lead => ({
      action: 'Novi lead dodan',
      company: lead.company,
      time: getTimeAgo(lead.dateAdded)
    })),
    ...emails.slice(0, 2).map(email => ({
      action: email.status === 'Sent' ? 'Email poslan' : 'Email draft kreiran',
      company: email.to.split('@')[0],
      time: getTimeAgo(email.dateSent)
    })),
    ...reminders.slice(0, 1).map(reminder => ({
      action: 'Podsjetnik kreiran',
      company: reminder.company,
      time: getTimeAgo(reminder.date)
    })),
    ...posts.slice(0, 1).map(post => ({
      action: `${post.platform} post ${post.status === 'Published' ? 'objavljen' : 'zakazan'}`,
      company: 'AutoContent',
      time: getTimeAgo(post.date)
    }))
  ].slice(0, 4);

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Danas';
    if (diffDays === 1) return '1 dan';
    if (diffDays < 7) return `${diffDays} dana`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tjedana`;
    return `${Math.floor(diffDays / 30)} mjeseca`;
  }

  const conversionRate = totalLeads > 0 ? ((sentEmails / totalLeads) * 100).toFixed(1) : '0.0';

  const handleStatClick = (module: string) => {
    if (onNavigateToModule) {
      onNavigateToModule(module);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Pregled aktivnosti Marketing Agent sustava</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleStatClick(stat.module)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-green-600 font-medium">
                  {stat.change} od prošlog tjedna
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              Nedavne Aktivnosti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{activity.action}</p>
                      <p className="text-sm text-slate-600">{activity.company}</p>
                    </div>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500">
                  Nema nedavnih aktivnosti. Počnite dodavanjem leadova!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Ključni Pokazatelji
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Conversion rate</span>
                <span className="font-bold text-green-600">{conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Aktivni leadovi</span>
                <span className="font-bold text-blue-600">{leads.filter(l => l.status !== 'Odbačen').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Email drafts</span>
                <span className="font-bold text-yellow-600">{emails.filter(e => e.status === 'Draft').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Zakazani postovi</span>
                <span className="font-bold text-purple-600">{posts.filter(p => p.status === 'Scheduled').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Završeni podsjetnici</span>
                <span className="font-bold text-green-600">{reminders.filter(r => r.status === 'Završen').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
