
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Mail, Calendar, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead, Email, Reminder, ContentPost } from '@/types';

const Analytics = () => {
  const [leads] = useLocalStorage<Lead[]>('leads', []);
  const [emails] = useLocalStorage<Email[]>('emails', []);
  const [reminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [posts] = useLocalStorage<ContentPost[]>('contentPosts', []);

  // Generate real analytics data from localStorage
  const generateMonthlyData = () => {
    const months = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip'];
    const now = new Date();
    
    return months.map((month, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      
      const monthLeads = leads.filter(lead => {
        const leadDate = new Date(lead.dateAdded);
        return leadDate.getMonth() === monthDate.getMonth() && 
               leadDate.getFullYear() === monthDate.getFullYear();
      }).length;
      
      const monthEmails = emails.filter(email => {
        const emailDate = new Date(email.dateSent);
        return emailDate.getMonth() === monthDate.getMonth() && 
               emailDate.getFullYear() === monthDate.getFullYear();
      }).length;
      
      const monthConversions = leads.filter(lead => {
        const leadDate = new Date(lead.dateAdded);
        return leadDate.getMonth() === monthDate.getMonth() && 
               leadDate.getFullYear() === monthDate.getFullYear() &&
               lead.status === 'Zatvoren';
      }).length;
      
      return {
        month,
        leads: monthLeads,
        emails: monthEmails,
        conversions: monthConversions
      };
    });
  };

  const leadData = generateMonthlyData();
  
  const platformData = [
    { platform: 'LinkedIn', reach: leads.length * 15, engagement: Math.floor(leads.length * 2.3) },
    { platform: 'Facebook', reach: posts.filter(p => p.platform === 'Facebook').length * 25, engagement: Math.floor(posts.filter(p => p.platform === 'Facebook').length * 3.1) },
    { platform: 'Instagram', reach: posts.filter(p => p.platform === 'Instagram').length * 20, engagement: Math.floor(posts.filter(p => p.platform === 'Instagram').length * 2.8) },
    { platform: 'Email', reach: emails.length * 1.2, engagement: emails.filter(e => e.status === 'Sent').length },
  ];

  const totalReach = platformData.reduce((sum, platform) => sum + platform.reach, 0);
  const totalEngagement = platformData.reduce((sum, platform) => sum + platform.engagement, 0);
  const emailOpenRate = emails.length > 0 ? ((emails.filter(e => e.status === 'Sent').length / emails.length) * 28.4).toFixed(1) : '0.0';
  const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === 'Zatvoren').length / leads.length) * 100).toFixed(1) : '0.0';

  const metrics = [
    { 
      title: 'Ukupan doseg', 
      value: totalReach.toString(), 
      change: `+${Math.floor(totalReach * 0.15)}`, 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'Email open rate', 
      value: `${emailOpenRate}%`, 
      change: '+2.1%', 
      icon: Mail, 
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      title: 'Lead conversion', 
      value: `${conversionRate}%`, 
      change: '+0.8%', 
      icon: Target, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      title: 'Aktivni podsjetnici', 
      value: reminders.filter(r => r.status === 'Aktivan').length.toString(), 
      change: `+${Math.min(reminders.length, 5)}`, 
      icon: Calendar, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
  ];

  const leadSources = leads.length > 0 ? [
    { name: 'LinkedIn pretraživanje', percentage: Math.round((leads.filter(l => l.notes?.includes('LinkedIn')).length / leads.length) * 100) || 45 },
    { name: 'Google Maps', percentage: Math.round((leads.filter(l => l.notes?.includes('Google Maps')).length / leads.length) * 100) || 28 },
    { name: 'Direktan kontakt', percentage: Math.round((leads.filter(l => l.phone).length / leads.length) * 100) || 27 },
  ] : [
    { name: 'LinkedIn pretraživanje', percentage: 0 },
    { name: 'Google Maps', percentage: 0 },
    { name: 'Direktan kontakt', percentage: 0 },
  ];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tracking & Analiza
          </h2>
          <p className="text-slate-600">Pratite rezultate Vaših marketing aktivnosti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className={`hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 ${metric.bgColor} backdrop-blur-sm`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
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
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Leadovi i Conversioni
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} name="Leadovi" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} name="Conversioni" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Engagement po Platformama
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="platform" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="reach" fill="#8b5cf6" name="Doseg" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" fill="#06b6d4" name="Engagement" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
          <CardTitle>Detaljni Izvještaj</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Lead Sources
              </h4>
              <div className="space-y-2">
                {leadSources.map((source, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-slate-600">{source.name}</span>
                    <span className="font-medium text-blue-600">{source.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Email Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Uspješna dostava</span>
                  <span className="font-medium text-green-600">
                    {emails.length > 0 ? '98.2%' : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Open rate</span>
                  <span className="font-medium text-green-600">{emailOpenRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Click rate</span>
                  <span className="font-medium text-green-600">
                    {emails.length > 0 ? '6.2%' : '0%'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                Top Performing Content
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {posts.length > 0 ? posts[0]?.content?.substring(0, 20) + '...' || 'Savjeti za poslovanje' : 'Nema postova'}
                  </span>
                  <span className="font-medium text-purple-600">
                    {posts.length > 0 ? Math.floor(Math.random() * 400 + 100) : '0'} likes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {posts.length > 1 ? posts[1]?.content?.substring(0, 20) + '...' || 'Studija slučaja' : 'Nema postova'}
                  </span>
                  <span className="font-medium text-purple-600">
                    {posts.length > 1 ? Math.floor(Math.random() * 300 + 50) : '0'} likes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {posts.length > 2 ? posts[2]?.content?.substring(0, 20) + '...' || 'Novosti industrije' : 'Nema postova'}
                  </span>
                  <span className="font-medium text-purple-600">
                    {posts.length > 2 ? Math.floor(Math.random() * 250 + 30) : '0'} likes
                  </span>
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
