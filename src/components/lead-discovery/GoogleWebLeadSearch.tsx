
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

      // Minimal localization: map Croatia to hr
      const countryLc = (country || '').toLowerCase();
      const gl = countryLc.includes('hrvatska') || countryLc.includes('croatia') || countryLc === 'hr' ? 'hr' : undefined;
      const lr = gl ? `lang_${gl}` : undefined;

      const { data, error } = await supabase.functions.invoke("google-web-lead-search", {
        body: { q, limit: 10, gl, lr },
      });

      if (error) {
        console.error("Web search error:", error);
        const status = (error as any)?.status || (error as any)?.context?.status;
        let description = (error as any)?.context?.details || error.message || "Dogodila se greška pri web pretraživanju leadova.";
        
        // Detailed error messages
        if (status === 404 || /404|not found/i.test(description)) {
          description = "Google Custom Search Engine (CSE): Search Engine nije pronađen.\n\n" +
            "Mogući razlozi:\n" +
            "• CX (Search Engine ID) je neispravan ili ne postoji\n" +
            "• Search Engine je izbrisan iz Google CSE konzole\n\n" +
            "Provjerite: https://programmablesearchengine.google.com/";
        } else if (status === 403 || /403|forbidden|permission/i.test(description)) {
          description = "Google Custom Search Engine (CSE): Pristup zabranjen.\n\n" +
            "Mogući razlozi:\n" +
            "• Custom Search JSON API nije omogućen u Google Cloud Console\n" +
            "• API ključ nema dopuštenja za Custom Search API\n" +
            "• Billing nije postavljen\n\n" +
            "Provjerite: Google Cloud Console → APIs & Services → Custom Search API";
        } else if (status === 400 || /400|bad request/i.test(description)) {
          description = "Google Custom Search Engine (CSE): Neispravan zahtjev.\n\n" +
            "Mogući razlozi:\n" +
            "• API ključ je neispravan ili istekao\n" +
            "• CX (Search Engine ID) nije pravilan\n\n" +
            "Provjerite da su oba parametra točno kopirani.";
        } else if (status === 429 || /429|quota|limit/i.test(description)) {
          description = "Google Custom Search Engine (CSE): Prekoračen limit.\n\n" +
            "Dostigli ste dnevni limit od 100 besplatnih pretraga.\n" +
            "Provjerite: Google Cloud Console → APIs & Services → Quotas";
        }
        
        toast({ title: "Greška", description, variant: "destructive" });
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
