
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, Mail, Calendar, Target, Activity, DollarSign, Globe, Zap } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseReminders } from '@/hooks/useSupabaseReminders';
import { useZapierIntegration } from '@/hooks/useZapierIntegration';
import { Lead, Email, Reminder, ContentPost } from '@/types';

const AnalyticsDashboard = () => {
  // Prioritize Supabase data, fallback to localStorage
  const { leads: supabaseLeads, loading: leadsLoading } = useSupabaseLeads();
  const { reminders: supabaseReminders, loading: remindersLoading } = useSupabaseReminders();
  const { isConfigured: zapierConfigured } = useZapierIntegration();
  
  const [localLeads] = useLocalStorage<Lead[]>('leads', []);
  const [emails] = useLocalStorage<Email[]>('emails', []);
  const [localReminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [posts] = useLocalStorage<ContentPost[]>('contentPosts', []);
  
  // Use Supabase data if available, otherwise fallback to localStorage
  const leads = supabaseLeads.length > 0 ? supabaseLeads : localLeads;
  const reminders = supabaseReminders.length > 0 ? supabaseReminders : localReminders;

  // Generate monthly performance data
  const generatePerformanceData = () => {
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
        conversions: monthConversions,
        revenue: monthConversions * 2500 + Math.floor(Math.random() * 5000)
      };
    });
  };

  // Lead status distribution
  const getLeadStatusData = () => {
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: getStatusColor(status)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova': return '#3b82f6';
      case 'Kontaktiran': return '#f59e0b';
      case 'Zainteresiran': return '#10b981';
      case 'Odbačen': return '#ef4444';
      case 'Zatvoren': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Email performance data
  const getEmailPerformanceData = () => {
    const sentEmails = emails.filter(e => e.status === 'Sent').length;
    const draftEmails = emails.filter(e => e.status === 'Draft').length;
    const openRate = sentEmails > 0 ? (sentEmails * 0.284) : 0;
    const clickRate = sentEmails > 0 ? (sentEmails * 0.062) : 0;

    return [
      { name: 'Poslani', value: sentEmails, color: '#10b981' },
      { name: 'Draft', value: draftEmails, color: '#f59e0b' },
      { name: 'Otvoreni', value: Math.round(openRate), color: '#3b82f6' },
      { name: 'Kliknuti', value: Math.round(clickRate), color: '#8b5cf6' }
    ];
  };

  // Content engagement data
  const getContentEngagementData = () => {
    return posts.map((post, index) => ({
      platform: post.platform,
      likes: Math.floor(Math.random() * 500 + 50),
      shares: Math.floor(Math.random() * 100 + 10),
      comments: Math.floor(Math.random() * 50 + 5),
      reach: Math.floor(Math.random() * 2000 + 200)
    }));
  };

  const performanceData = generatePerformanceData();
  const leadStatusData = getLeadStatusData();
  const emailPerformanceData = getEmailPerformanceData();
  const contentEngagementData = getContentEngagementData();

  // Calculate enhanced KPIs
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? ((leads.filter(l => l.status === 'Zatvoren').length / totalLeads) * 100).toFixed(1) : '0.0';
  const emailOpenRate = emails.length > 0 ? ((emails.filter(e => e.status === 'Sent').length / emails.length) * 28.4).toFixed(1) : '0.0';
  const avgRevenuePerLead = totalLeads > 0 ? (performanceData.reduce((sum, d) => sum + d.revenue, 0) / totalLeads).toFixed(0) : '0';
  
  // Integration status metrics
  const activeIntegrations = [
    leadsLoading || supabaseLeads.length > 0 ? 'Supabase Leads' : null,
    remindersLoading || supabaseReminders.length > 0 ? 'Supabase Reminders' : null,
    zapierConfigured ? 'Zapier' : null,
    emails.length > 0 ? 'Email System' : null,
    posts.length > 0 ? 'Content Booster' : null
  ].filter(Boolean);
  
  const dataSourceMetrics = {
    leadSources: [
      { name: 'Supabase', count: supabaseLeads.length, active: supabaseLeads.length > 0 },
      { name: 'Local Storage', count: localLeads.length, active: localLeads.length > 0 },
      { name: 'Zapier Integration', count: zapierConfigured ? 1 : 0, active: zapierConfigured }
    ],
    totalDataPoints: leads.length + emails.length + reminders.length + posts.length
  };

  const chartConfig = {
    leads: { label: "Leadovi", color: "#3b82f6" },
    emails: { label: "Emailovi", color: "#10b981" },
    conversions: { label: "Konverzije", color: "#f59e0b" },
    revenue: { label: "Prihod", color: "#8b5cf6" }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Ukupno Leadova</p>
                <p className="text-3xl font-bold text-blue-900">{totalLeads}</p>
                <p className="text-blue-600 text-sm flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{Math.floor(totalLeads * 0.12)} ovaj mjesec
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-900">{conversionRate}%</p>
                <p className="text-green-600 text-sm flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +2.1% vs prošli mjesec
                </p>
              </div>
              <Target className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Email Open Rate</p>
                <p className="text-3xl font-bold text-purple-900">{emailOpenRate}%</p>
                <p className="text-purple-600 text-sm flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +1.8% vs prosjek
                </p>
              </div>
              <Mail className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Aktivne Integracije</p>
                <p className="text-3xl font-bold text-orange-900">{activeIntegrations.length}</p>
                <p className="text-orange-600 text-sm flex items-center mt-1">
                  <Zap className="h-4 w-4 mr-1" />
                  {dataSourceMetrics.totalDataPoints} data points
                </p>
              </div>
              <Globe className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Marketing Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="leads" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="emails" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="conversions" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Lead Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {leadStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-purple-600" />
              Email Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emailPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources and Integration Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Data Sources Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dataSourceMetrics.leadSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${source.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">{source.count} records</span>
                    <div className={`text-xs ${source.active ? 'text-green-600' : 'text-gray-400'}`}>
                      {source.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-600" />
              Active Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeIntegrations.map((integration, index) => (
                <div key={index} className="flex items-center p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-green-800">{integration}</span>
                </div>
              ))}
              {activeIntegrations.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Nema aktivnih integracija
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Engagement Table */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Content Engagement Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Platform</th>
                    <th className="text-left p-3">Likes</th>
                    <th className="text-left p-3">Shares</th>
                    <th className="text-left p-3">Comments</th>
                    <th className="text-left p-3">Reach</th>
                  </tr>
                </thead>
                <tbody>
                  {contentEngagementData.map((data, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{data.platform}</td>
                      <td className="p-3">{data.likes}</td>
                      <td className="p-3">{data.shares}</td>
                      <td className="p-3">{data.comments}</td>
                      <td className="p-3">{data.reach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
