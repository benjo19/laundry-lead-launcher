
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mail, Calendar, TrendingUp, Target, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { title: 'Ukupno Leadova', value: '1,247', change: '+12%', icon: Users, color: 'text-blue-600' },
    { title: 'Poslani Emailovi', value: '3,452', change: '+8%', icon: Mail, color: 'text-green-600' },
    { title: 'Aktivni Podsjetnici', value: '23', change: '+3', icon: Calendar, color: 'text-orange-600' },
    { title: 'Conversion Rate', value: '4.2%', change: '+0.3%', icon: TrendingUp, color: 'text-purple-600' },
  ];

  const recentActivity = [
    { action: 'Novi lead dodan', company: 'Praonica Split', time: '5 min' },
    { action: 'Email poslan', company: 'Čistoća Zagreb', time: '15 min' },
    { action: 'Podsjetnik kreiran', company: 'Bijelo rublje d.o.o.', time: '1h' },
    { action: 'LinkedIn post objavljen', company: 'AutoContent', time: '2h' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Pregled aktivnosti Marketing Agent sustava</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Target className="h-4 w-4 mr-2" />
          Nova Kampanja
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-600">{activity.company}</p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Mjesečni Rezultati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Leadovi generirani</span>
                <span className="font-bold text-slate-900">347</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Email open rate</span>
                <span className="font-bold text-green-600">28.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Click-through rate</span>
                <span className="font-bold text-blue-600">6.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Novi klijenti</span>
                <span className="font-bold text-purple-600">14</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
