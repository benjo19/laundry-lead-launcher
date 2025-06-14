
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ContentScheduler from '@/components/content-booster/ContentScheduler';

const Analytics = () => {
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics & Scheduling
          </h2>
          <p className="text-slate-600">Analizirajte rezultate i planirajte sadržaj</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Content Scheduling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="scheduling">
          <ContentScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
