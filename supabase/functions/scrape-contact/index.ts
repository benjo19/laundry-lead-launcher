import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  website: string;
  companyName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { website, companyName }: ScrapeRequest = await req.json();
    console.log(`Scraping contact info for: ${companyName} from ${website}`);

    if (!website) {
      return new Response(
        JSON.stringify({ error: "Website URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize URL
    const baseUrl = website.startsWith('http') ? website : `https://${website}`;
    
    // Common contact pages
    const paths = [
      '/',
      '/contact',
      '/contact-us',
      '/kontakt',
      '/about',
      '/about-us',
      '/o-nama',
      '/impressum'
    ];

    const emails = new Set<string>();
    const socialProfiles: Record<string, string> = {};

    // Fetch and parse each page
    for (const path of paths) {
      try {
        const url = new URL(path, baseUrl).toString();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        clearTimeout(timeout);

        if (!response.ok) continue;

        const html = await response.text();
        
        // Extract emails
        const emailRegex = /(?:mailto:)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
        const matches = html.matchAll(emailRegex);
        
        for (const match of matches) {
          const email = match[1].toLowerCase().trim();
          
          // Filter out common non-contact emails
          if (email.includes('noreply') || 
              email.includes('no-reply') ||
              email.includes('example.com') ||
              email.includes('test.com')) {
            continue;
          }
          
          // Prefer company domain emails
          try {
            const emailDomain = email.split('@')[1];
            const siteDomain = new URL(baseUrl).hostname.replace('www.', '');
            
            if (emailDomain.includes(siteDomain.split('.')[0])) {
              emails.add(email);
            } else if (!emailDomain.includes('gmail') && 
                       !emailDomain.includes('yahoo') && 
                       !emailDomain.includes('hotmail')) {
              emails.add(email);
            }
          } catch {
            emails.add(email);
          }
        }

        // Extract social profiles
        const linkedInMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_]+/i);
        if (linkedInMatch) socialProfiles.linkedin = linkedInMatch[0];

        const facebookMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9\-_.]+/i);
        if (facebookMatch) socialProfiles.facebook = facebookMatch[0];

        // If we found emails, we can stop early
        if (emails.size > 0) break;
        
      } catch (error) {
        console.log(`Error fetching ${path}:`, error.message);
        continue;
      }
    }

    // If no emails found, try Google search for company contact
    if (emails.size === 0 && companyName) {
      try {
        console.log(`Trying Google search for: ${companyName} contact email`);
        const searchQuery = `"${companyName}" contact email`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.ok) {
          const html = await response.text();
          const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
          const matches = html.matchAll(emailRegex);
          
          for (const match of matches) {
            const email = match[1].toLowerCase().trim();
            if (!email.includes('google') && 
                !email.includes('noreply') &&
                !email.includes('example.com')) {
              emails.add(email);
              break; // Take first valid email from search
            }
          }
        }
      } catch (error) {
        console.log('Google search failed:', error.message);
      }
    }

    const result = {
      emails: Array.from(emails),
      socialProfiles,
      success: emails.size > 0 || Object.keys(socialProfiles).length > 0
    };

    console.log(`Found ${emails.size} emails and ${Object.keys(socialProfiles).length} social profiles`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in scrape-contact:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
