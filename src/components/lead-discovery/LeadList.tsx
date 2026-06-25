
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import LeadCard from './LeadCard';
import { Search, Brain, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeadListProps {
  discoveredLeads: AnalyzedLead[];
  onAddLead: (lead: AnalyzedLead) => void;
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadList = ({ discoveredLeads, onAddLead, onNavigateToEmailGenerator }: LeadListProps) => {
  if (discoveredLeads.length === 0) {
    return null;
  }

  const analyzedCount = discoveredLeads.filter(lead => lead.aiAnalysis).length;
  const averageScore = analyzedCount > 0 
    ? discoveredLeads
        .filter(lead => lead.aiAnalysis)
        .reduce((sum, lead) => sum + (lead.aiAnalysis?.score || 0), 0) / analyzedCount
    : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
          <span className="flex items-center">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 shrink-0" />
            <span className="truncate">Pronađeni Leadovi ({discoveredLeads.length})</span>
          </span>
          {analyzedCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700 font-medium">
                AI Analizirano: {analyzedCount}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-blue-700 font-medium">
                Avg Score: {averageScore.toFixed(1)}/10
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          {discoveredLeads.map((lead) => (
            <LeadCard 
              key={lead.place_id} 
              lead={lead} 
              onAddLead={onAddLead}
              onNavigateToEmailGenerator={onNavigateToEmailGenerator}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadList;
