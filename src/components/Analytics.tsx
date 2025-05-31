
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Mail, Calendar, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Analytics = () => {
  const leadData = [
    { month: 'Sij', leads: 45, emails: 120, conversions: 8 },
    { month: 'Velj', leads: 52, emails: 145, conversions: 12 },
    { month: 'Ožu', leads: 48, emails: 134, conversions: 9 },
    { month: 'Tra', leads: 61, emails: 167, conversions: 15 },
    { month: 'Svi', leads: 58, emails: 156, conversions: 13 },
    { month: 'Lip', leads: 67, emails: 189, conversions: 18 },
  ];

  const platformData = [
    { platform: 'LinkedIn', reach: 2400, engagement: 180 },
    { platform: 'Facebook', reach: 1800, engagement: 145 },
    { platform: 'Instagram', reach: 1200, engagement: 98 },
    { platform: 'Email', reach: 3200, engagement: 420 },
  ];

  const metrics = [
    { title: 'Ukupan doseg', value: '8,600', change: '+15%', icon: Users, color: 'text-blue-600' },
    { title: 'Email open rate', value: '28.4%', change: '+2.1%', icon: Mail, color: 'text-green-600' },
    { title: 'Lead conversion', value: '4.2%', change: '+0.8%', icon: Target, color: 'text-purple-600' },
    { title: 'Aktivni podsjetnici', value: '23', change: '+5', icon: Calendar, color: 'text-orange-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Tracking & Analiza</h2>
          <p className="text-slate-600">Pratite rezultate Vaših marketing aktivnosti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                <p className="text-xs text-green-600 font-medium">
                  {metric.change} od prošlog mjeseca
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
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Leadovi i Conversioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} name="Leadovi" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} name="Conversioni" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Engagement po Platformama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reach" fill="#8b5cf6" name="Doseg" />
                <Bar dataKey="engagement" fill="#06b6d4" name="Engagement" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detaljni Izvještaj</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Lead Sources</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">LinkedIn pretraživanje</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Referali</span>
                  <span className="font-medium">28%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Direktan kontakt</span>
                  <span className="font-medium">27%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Email Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Uspješna dostava</span>
                  <span className="font-medium">98.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Open rate</span>
                  <span className="font-medium">28.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Click rate</span>
                  <span className="font-medium">6.2%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Top Performing Content</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Savjeti za praone</span>
                  <span className="font-medium">342 likes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Studija slučaja</span>
                  <span className="font-medium">267 likes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Novosti industrije</span>
                  <span className="font-medium">198 likes</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
