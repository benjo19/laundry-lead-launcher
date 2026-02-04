import { supabase } from '@/integrations/supabase/client';
import { DiscoveredLead } from '@/components/lead-discovery/SearchForm';

export interface AILeadAnalysis {
  score: number; // 1-10 rating
  potential: 'Visok' | 'Srednji' | 'Nizak';
  reasoning: string;
  approach: string;
  keyPoints: string[];
  contactTiming: string;
  priority: number;
}

export interface AnalyzedLead extends DiscoveredLead {
  aiAnalysis?: AILeadAnalysis;
}

export class AILeadAnalysisService {
  /**
   * Analyze leads using Lovable AI Gateway via edge function.
   * No user API keys required - uses centralized LOVABLE_API_KEY.
   */
  static async analyzeLeads(leads: DiscoveredLead[]): Promise<AnalyzedLead[]> {
    try {
      if (!leads || leads.length === 0) {
        return [];
      }

      console.log(`Analyzing ${leads.length} leads via ai-lead-analysis edge function`);

      const { data, error } = await supabase.functions.invoke('ai-lead-analysis', {
        body: { leads }
      });

      if (error) {
        console.error('Error calling ai-lead-analysis:', error);
        throw new Error(error.message || 'Failed to analyze leads');
      }

      if (!data?.analyzedLeads) {
        console.warn('No analyzed leads returned');
        return leads;
      }

      return data.analyzedLeads;

    } catch (error) {
      console.error('Error in lead analysis:', error);
      throw error;
    }
  }
}
