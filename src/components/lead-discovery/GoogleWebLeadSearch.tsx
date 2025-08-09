
import { supabase } from "@/integrations/supabase/client";
import { AnalyzedLead } from "@/services/aiLeadAnalysisService";

interface GoogleWebLeadSearchProps {
  searchQuery: string;
  location: string;
  country: string;
  industry: string;
  setIsSearching: (searching: boolean) => void;
  setDiscoveredLeads: (leads: AnalyzedLead[]) => void;
  toast: any;
}

export const useGoogleWebLeadSearch = ({
  searchQuery,
  location,
  country,
  industry,
  setIsSearching,
  setDiscoveredLeads,
  toast,
}: GoogleWebLeadSearchProps) => {
  const searchWebLeads = async () => {
    if (!location) {
      toast({
        title: "Lokacija potrebna",
        description: "Molimo unesite lokaciju za pretraživanje.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const parts = [
        industry || "",
        searchQuery || "",
        location || "",
        country && country !== "all" ? country : "",
      ].filter(Boolean);

      const q = parts.join(" ").trim();
      console.log("Web Search - Query:", q);

      const { data, error } = await supabase.functions.invoke("google-web-lead-search", {
        body: { q, limit: 10 },
      });

      if (error) {
        console.error("Web search error:", error);
        toast({
          title: "Greška",
          description: error.message || "Dogodila se greška pri web pretraživanju leadova.",
          variant: "destructive",
        });
        setDiscoveredLeads([]);
        return;
      }

      const leads = (data?.leads || []) as any[];
      console.log("Web Search - Leads:", leads.length);

      // Map to AnalyzedLead shape (fill required fields)
      const mapped: AnalyzedLead[] = leads.map((l) => ({
        name: l.name || "Nepoznato",
        address: l.address || "",
        phone: l.phone || "",
        website: l.website || "",
        email: l.email || undefined,
        emailScraped: l.emailScraped || false,
        emailGuessed: l.emailGuessed || false,
        socialProfiles: l.socialProfiles || {},
        emailSource: l.emailSource || undefined,
        rating: l.rating,
        types: Array.isArray(l.types) ? l.types : ["web"],
        place_id: l.place_id || `web:${l.website || Math.random()}`,
        geometry: l.geometry,
        business_status: l.business_status,
        user_ratings_total: l.user_ratings_total,
      }));

      setDiscoveredLeads(mapped);

      const emailsFound = mapped.filter((lead) => lead.email && lead.emailScraped).length;
      const leadsWithoutEmail = mapped.filter((lead) => !lead.email).length;

      toast({
        title: "Pretraživanje završeno",
        description: `Pronađeno ${mapped.length} leadova. ${emailsFound} email adresa pronađeno na webu. ${leadsWithoutEmail} leadova nema dostupnu email adresu.`,
      });
    } catch (e) {
      console.error("Web search exception:", e);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri web pretraživanju leadova.",
        variant: "destructive",
      });
      setDiscoveredLeads([]);
    } finally {
      setIsSearching(false);
    }
  };

  return { searchWebLeads };
};
