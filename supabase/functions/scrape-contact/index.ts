import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Helper function to scrape social media profiles for emails
async function scrapeSocialProfile(platform: 'linkedin' | 'facebook' | 'instagram', companyName: string, location?: string): Promise<string[]> {
  const emails: string[] = [];
  const searchQuery = `"${companyName}" ${location ? location : ''} site:${platform}.com email OR contact`;
  
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (response.ok) {
      const html = await response.text();
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
      const matches = html.matchAll(emailRegex);
      
      for (const match of matches) {
        const email = match[1].toLowerCase().trim();
        // Filter out platform emails and common non-contact emails
        if (!email.includes(platform) && 
            !email.includes('noreply') &&
            !email.includes('no-reply') &&
            !email.includes('example.com')) {
          emails.push(email);
          if (emails.length >= 2) break; // Max 2 emails per platform
        }
      }
    }
  } catch (error) {
    console.log(`Error scraping ${platform}:`, error.message);
  }
  
  return emails;
}

// Enhanced email validation with confidence scoring
function validateEmail(email: string, website: string, companyName: string): EmailValidationResult {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return { email, isValid: false, source: 'unknown', confidence: 'low' };
  }

  const domain = email.split('@')[1]?.toLowerCase() || '';
  const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
  
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  let source = 'website';

  // Check if email domain matches company website
  if (website) {
    try {
      const websiteDomain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace('www.', '');
      const emailDomainParts = domain.split('.');
      const websiteDomainParts = websiteDomain.split('.');
      
      // Check if main domain matches (e.g., company.com vs company.hr)
      const emailMainDomain = emailDomainParts.slice(-2, -1)[0];
      const websiteMainDomain = websiteDomainParts.slice(-2, -1)[0];
      
      if (emailMainDomain === websiteMainDomain) {
        confidence = 'high';
        source = 'company_website';
      }
    } catch (e) {
      console.log('Error parsing website domain:', e.message);
    }
  }

  // Check for company name in email
  if (companyName) {
    const companyNameClean = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailLocal = email.split('@')[0].toLowerCase();
    const domainClean = domain.replace(/[^a-z0-9]/g, '');
    
    if (domainClean.includes(companyNameClean) || emailLocal.includes(companyNameClean)) {
      confidence = confidence === 'high' ? 'high' : 'medium';
    }
  }

  // Downgrade confidence for free email providers
  if (freeEmailDomains.includes(domain)) {
    confidence = 'low';
    source = 'free_email';
  }

  // Check for generic/non-contact emails
  const nonContactPatterns = ['noreply', 'no-reply', 'donotreply', 'info@', 'admin@', 'webmaster@', 'postmaster@'];
  if (nonContactPatterns.some(pattern => email.includes(pattern))) {
    confidence = 'low';
    source = 'generic';
  }

  return {
    email,
    isValid: true,
    source,
    confidence
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  website: string;
  companyName: string;
  location?: string;
}

interface SocialProfiles {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { website, companyName, location }: ScrapeRequest = await req.json();
    console.log(`🔍 Enhanced scraping for: ${companyName} from ${website}`);

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

        // Extract social profiles (LinkedIn, Facebook, Instagram, Twitter)
        const linkedInMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_]+/i);
        if (linkedInMatch) socialProfiles.linkedin = linkedInMatch[0];

        const facebookMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9\-_.]+/i);
        if (facebookMatch) socialProfiles.facebook = facebookMatch[0];

        const instagramMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9\-_.]+/i);
        if (instagramMatch) socialProfiles.instagram = instagramMatch[0];

        const twitterMatch = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9\-_]+/i);
        if (twitterMatch) socialProfiles.twitter = twitterMatch[0];

        // If we found emails, we can stop early
        if (emails.size > 0) break;
        
      } catch (error) {
        console.log(`Error fetching ${path}:`, error.message);
        continue;
      }
    }

    // Enhanced social media scraping for emails
    if (emails.size === 0 && companyName) {
      console.log('🔍 Searching social media profiles for contact info...');
      
      // Search LinkedIn
      try {
        const linkedInEmails = await scrapeSocialProfile('linkedin', companyName, location);
        linkedInEmails.forEach(email => emails.add(email));
        console.log(`✅ Found ${linkedInEmails.length} emails from LinkedIn`);
      } catch (error) {
        console.log('LinkedIn scrape error:', error.message);
      }

      // Search Facebook
      try {
        const facebookEmails = await scrapeSocialProfile('facebook', companyName, location);
        facebookEmails.forEach(email => emails.add(email));
        console.log(`✅ Found ${facebookEmails.length} emails from Facebook`);
      } catch (error) {
        console.log('Facebook scrape error:', error.message);
      }

      // Search Instagram
      try {
        const instagramEmails = await scrapeSocialProfile('instagram', companyName, location);
        instagramEmails.forEach(email => emails.add(email));
        console.log(`✅ Found ${instagramEmails.length} emails from Instagram`);
      } catch (error) {
        console.log('Instagram scrape error:', error.message);
      }
    }

    // If still no emails, try Google search for company contact
    if (emails.size === 0 && companyName) {
      try {
        console.log(`🔍 Trying web search for: ${companyName} contact email`);
        const searchQuery = `"${companyName}" ${location ? location : ''} contact email -site:linkedin.com -site:facebook.com`;
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
              if (emails.size >= 3) break; // Take up to 3 emails from search
            }
          }
        }
      } catch (error) {
        console.log('Web search failed:', error.message);
      }
    }

    // Validate and score emails
    const validatedEmails: EmailValidationResult[] = Array.from(emails).map(email => {
      const validation = validateEmail(email, website, companyName);
      return validation;
    }).filter(v => v.isValid).sort((a, b) => {
      // Sort by confidence: high > medium > low
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });

    const result = {
      emails: validatedEmails.map(v => v.email),
      validatedEmails,
      socialProfiles,
      success: validatedEmails.length > 0 || Object.keys(socialProfiles).length > 0
    };

    console.log(`✅ Found ${validatedEmails.length} validated emails and ${Object.keys(socialProfiles).length} social profiles`);

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
