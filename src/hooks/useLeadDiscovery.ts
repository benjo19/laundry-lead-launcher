import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types';
import { DiscoveredLead } from '@/components/lead-discovery/SearchForm';
import { scrapeEmailFromWebsite } from '@/utils/emailScraper';
import { useAISettings } from '@/hooks/useAISettings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AILeadAnalysisService, AnalyzedLead } from '@/services/aiLeadAnalysisService';

export const useLeadDiscovery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { aiSettings, saveAISettings, isAIConfigured } = useAISettings();
  
  // Load saved form data from localStorage
  const [savedFormData, setSavedFormData] = useLocalStorage('leadDiscoveryForm', {
    searchQuery: '',
    location: '',
    industry: 'laundry',
    tempApiKey: ''
  });

  const [searchQuery, setSearchQuery] = useState(savedFormData.searchQuery || '');
  const [location, setLocation] = useState(savedFormData.location || '');
  const [industry, setIndustry] = useState(savedFormData.industry || 'laundry');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useLocalStorage<AnalyzedLead[]>('discoveredLeads', []);
  const [tempApiKey, setTempApiKey] = useState(savedFormData.tempApiKey || '');
  const [savedGoogleMapsApiKey, setSavedGoogleMapsApiKey] = useState('');

  // Save form data to localStorage whenever fields change
  useEffect(() => {
    setSavedFormData({
      searchQuery,
      location,
      industry,
      tempApiKey
    });
  }, [searchQuery, location, industry, tempApiKey, setSavedFormData]);

  useEffect(() => {
    if (user) {
      loadGoogleMapsApiKey();
    }
  }, [user, aiSettings]);

  const loadGoogleMapsApiKey = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('ai_settings')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (settings?.ai_settings) {
        const currentAiSettings = settings.ai_settings as any;
        if (currentAiSettings.google_maps_api_key) {
          setSavedGoogleMapsApiKey(currentAiSettings.google_maps_api_key);
          setTempApiKey(currentAiSettings.google_maps_api_key);
        }
      }
    } catch (error) {
      console.error('Error loading Google Maps API key:', error);
    }
  };

  const saveGoogleMapsApiKey = async (apiKey: string) => {
    if (!user || !aiSettings) return;

    try {
      const updatedSettings = {
        ...aiSettings,
        google_maps_api_key: apiKey
      };

      await saveAISettings(updatedSettings);
      setSavedGoogleMapsApiKey(apiKey);
      
      toast({
        title: "API ključ spremljen",
        description: "Google Maps API ključ je uspješno spremljen u AI postavke.",
      });
    } catch (error) {
      console.error('Error saving Google Maps API key:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja API ključa.",
        variant: "destructive",
      });
    }
  };

  const getPlaceDetails = async (placeId: string, apiKey: string) => {
    console.log(`Fetching details for place ID: ${placeId}`);
    
    try {
      const fields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,business_status,opening_hours';
      const directUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
      
      let response;
      try {
        // Try direct call first
        response = await fetch(directUrl);
        console.log(`Direct details API response status: ${response.status}`);
      } catch (corsError) {
        console.log('Direct details API failed, trying proxy...');
        // Fallback to proxy
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const proxiedUrl = proxyUrl + encodeURIComponent(directUrl);
        response = await fetch(proxiedUrl);
        console.log(`Proxy details API response status: ${response.status}`);
      }
      
      if (!response.ok) {
        console.error(`Details API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`Details API status: ${data.status}`);
      
      if (data.status === 'OK' && data.result) {
        console.log(`Successfully fetched details for: ${data.result.name}`);
        return data.result;
      } else {
        console.error(`Details API failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
        return null;
      }
      
    } catch (error) {
      console.error(`Error fetching place details for ${placeId}:`, error);
      return null;
    }
  };

  const analyzeWithAI = async (leads: AnalyzedLead[]) => {
    if (!isAIConfigured()) {
      toast({
        title: "AI nije konfiguriran",
        description: "Molimo postavite AI ključ u Settings prije korištenja AI analize.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Greška",
        description: "Morate biti prijavljeni za AI analizu.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Starting AI analysis for leads...');
      const analyzedLeads = await AILeadAnalysisService.analyzeLeads(leads, user.id);
      
      setDiscoveredLeads(analyzedLeads);
      
      const analyzedCount = analyzedLeads.filter(lead => lead.aiAnalysis).length;
      const averageScore = analyzedCount > 0 
        ? analyzedLeads
            .filter(lead => lead.aiAnalysis)
            .reduce((sum, lead) => sum + (lead.aiAnalysis?.score || 0), 0) / analyzedCount
        : 0;

      toast({
        title: "AI analiza završena",
        description: `Analizirano ${analyzedCount} leadova. Prosječni score: ${averageScore.toFixed(1)}/10`,
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "Greška AI analize",
        description: error instanceof Error ? error.message : "Dogodila se greška prilikom AI analize.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    // State
    searchQuery,
    setSearchQuery,
    location,
    setLocation,
    industry,
    setIndustry,
    isSearching,
    setIsSearching,
    isAnalyzing,
    discoveredLeads,
    setDiscoveredLeads,
    tempApiKey,
    setTempApiKey,
    savedGoogleMapsApiKey,
    
    // Functions
    loadGoogleMapsApiKey,
    saveGoogleMapsApiKey,
    getPlaceDetails,
    analyzeWithAI,
    
    // Other hooks
    toast,
    isAIConfigured
  };
};
