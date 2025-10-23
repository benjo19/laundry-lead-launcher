// Utilities for safer email extraction and domain matching
const stripWww = (host: string) => host.replace(/^www\./i, '');
const twoPartTLDs = new Set([
  'co.uk','com.au','com.br','com.hr','com.tr','com.cn','com.mx','com.ar','com.pl','com.sg','com.my'
]);
const getDomainRoot = (host: string) => {
  const h = stripWww(host.toLowerCase());
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  const last2 = parts.slice(-2).join('.');
  const last3 = parts.slice(-3).join('.');
  return twoPartTLDs.has(last2) ? last3 : last2;
};
const isFreeEmailDomain = (domain: string) => /(gmail|yahoo|hotmail|outlook|aol|icloud|proton|yandex|zoho|gmx|live|msn)\./i.test(domain);

// Enhanced email scraper with multiple strategies for finding email addresses

// Enhanced email scraper using backend edge function
export const scrapeEmailFromWebsite = async (website: string, companyName: string = ''): Promise<string | null> => {
  if (!website) return null;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://uwtzhkdgprmrmknjrfeb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dHpoa2RncHJtcm1rbmpyZmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MzcxNTksImV4cCI6MjA2NDMxMzE1OX0.uck1u0Q1sDZf2aQXB9yw3FE_n2cIjZEA292YavuIDb0'
    );

    console.log(`🔍 Scraping contact info for: ${companyName || website}`);
    
    const { data, error } = await supabase.functions.invoke('scrape-contact', {
      body: { website, companyName }
    });

    if (error) {
      console.error('Scraping error:', error);
      return null;
    }

    if (data?.emails && data.emails.length > 0) {
      console.log(`✅ Found emails:`, data.emails);
      return data.emails[0]; // Return first email
    }

    return null;
  } catch (error) {
    console.error(`Error scraping email from ${website}:`, error);
    return null;
  }
};


// Enhanced email discovery using backend edge function
export const enhancedEmailDiscovery = async (companyName: string, website: string, location?: string): Promise<{
  emails: string[];
  socialProfiles: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  emailSources: Record<string, string>;
}> => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://uwtzhkdgprmrmknjrfeb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dHpoa2RncHJtcm1rbmpyZmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MzcxNTksImV4cCI6MjA2NDMxMzE1OX0.uck1u0Q1sDZf2aQXB9yw3FE_n2cIjZEA292YavuIDb0'
    );

    console.log(`🔍 Enhanced discovery for: ${companyName}`);
    
    const { data, error } = await supabase.functions.invoke('scrape-contact', {
      body: { website, companyName, location }
    });

    if (error) {
      console.error('Enhanced discovery error:', error);
      return { emails: [], socialProfiles: {}, emailSources: {} };
    }

    const emailSources: Record<string, string> = {};
    if (data?.validatedEmails) {
      data.validatedEmails.forEach((validated: any) => {
        emailSources[validated.email] = validated.source;
      });
    }

    return {
      emails: data?.emails || [],
      socialProfiles: data?.socialProfiles || {},
      emailSources
    };
  } catch (error) {
    console.error('Enhanced discovery error:', error);
    return { emails: [], socialProfiles: {}, emailSources: {} };
  }
};

// Search for emails on social media platforms and directories
const searchSocialMediaEmails = async (companyName: string): Promise<Array<{
  email?: string;
  source: string;
  profileUrl?: string;
}>> => {
  const results: Array<{
    email?: string;
    source: string;
    profileUrl?: string;
  }> = [];
  
  try {
    // Search for LinkedIn profiles
    await searchLinkedInProfiles(companyName, results);
    
    // Search for Facebook pages
    await searchFacebookPages(companyName, results);
    
    // Search Yellow Pages
    await searchYellowPages(companyName, results);
    
  } catch (error) {
    console.error('Error searching for social media emails:', error);
  }
  
  return results;
};

// Search LinkedIn profiles
const searchLinkedInProfiles = async (companyName: string, results: Array<{
  email?: string;
  source: string;
  profileUrl?: string;
}>) => {
  try {
    const searchQuery = `"${companyName}" site:linkedin.com/company`;
    const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`)}`;
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      const searchResults = data.contents;
      
      // Extract LinkedIn company URLs
      const linkedInRegex = /https:\/\/[a-z]{2,3}\.linkedin\.com\/company\/[a-zA-Z0-9\-_]+/g;
      const linkedInMatches = searchResults.match(linkedInRegex) || [];
      
      for (const profileUrl of linkedInMatches.slice(0, 3)) { // Take first 3 results
        results.push({
          source: 'linkedin',
          profileUrl: profileUrl.replace(/^https:\/\/[a-z]{2,3}\./, 'https://www.')
        });
        
        // Try to find email in LinkedIn content
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = searchResults.match(emailRegex) || [];
        
        for (const email of foundEmails) {
          if (!email.includes('linkedin.com') && validateEmailFormat(email)) {
            results.push({
              email: email,
              source: 'linkedin',
              profileUrl: profileUrl.replace(/^https:\/\/[a-z]{2,3}\./, 'https://www.')
            });
            break; // Take only first email per profile
          }
        }
      }
    }
  } catch (error) {
    console.error('Error searching LinkedIn:', error);
  }
};

// Search Facebook pages
const searchFacebookPages = async (companyName: string, results: Array<{
  email?: string;
  source: string;
  profileUrl?: string;
}>) => {
  try {
    const searchQuery = `"${companyName}" site:facebook.com`;
    const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`)}`;
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      const searchResults = data.contents;
      
      // Extract Facebook URLs
      const facebookRegex = /https:\/\/www\.facebook\.com\/[a-zA-Z0-9\-_.]+/g;
      const facebookMatches = searchResults.match(facebookRegex) || [];
      
      for (const profileUrl of facebookMatches.slice(0, 2)) { // Take first 2 results
        results.push({
          source: 'facebook',
          profileUrl: profileUrl
        });
        
        // Try to find email in Facebook content
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = searchResults.match(emailRegex) || [];
        
        for (const email of foundEmails) {
          if (!email.includes('facebook.com') && validateEmailFormat(email)) {
            results.push({
              email: email,
              source: 'facebook',
              profileUrl: profileUrl
            });
            break; // Take only first email per profile
          }
        }
      }
    }
  } catch (error) {
    console.error('Error searching Facebook:', error);
  }
};

// Search Yellow Pages
const searchYellowPages = async (companyName: string, results: Array<{
  email?: string;
  source: string;
  profileUrl?: string;
}>) => {
  try {
    const searchQuery = `"${companyName}" site:yellowpages.com`;
    const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`)}`;
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      const searchResults = data.contents;
      
      // Extract Yellow Pages URLs
      const yellowPagesRegex = /https:\/\/www\.yellowpages\.com\/[a-zA-Z0-9\-_\/]+/g;
      const yellowPagesMatches = searchResults.match(yellowPagesRegex) || [];
      
      for (const profileUrl of yellowPagesMatches.slice(0, 2)) { // Take first 2 results
        results.push({
          source: 'yellowPages',
          profileUrl: profileUrl
        });
        
        // Try to find email in Yellow Pages content
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = searchResults.match(emailRegex) || [];
        
        for (const email of foundEmails) {
          if (!email.includes('yellowpages.com') && validateEmailFormat(email)) {
            results.push({
              email: email,
              source: 'yellowPages',
              profileUrl: profileUrl
            });
            break; // Take only first email per profile
          }
        }
      }
    }
  } catch (error) {
    console.error('Error searching Yellow Pages:', error);
  }
};

// Function to validate if an email address potentially exists (basic check)
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Discover official website from social profiles (Facebook/LinkedIn About)
export const discoverWebsiteFromSocial = async (
  companyName: string
): Promise<{ website: string; source: 'facebook' | 'linkedin' } | null> => {
  const queries = [
    { q: `"${companyName}" site:facebook.com`, src: 'facebook' as const },
    { q: `"${companyName}" site:linkedin.com/company`, src: 'linkedin' as const },
  ];
  const proxy = 'https://api.allorigins.win/get?url=';

  const extractExternalSite = (html: string, exclude: RegExp): string | null => {
    // Find external links not belonging to the social domain
    const linkRegex = /href=["'](https?:\/\/[a-zA-Z0-9._%\-/:?#=&]+)["']/gi;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      if (exclude.test(url)) continue;
      // Filter obvious non-website links (mailto, tel, trackers)
      if (/^mailto:|^tel:/i.test(url)) continue;
      if (/facebook\.com|linkedin\.com|instagram\.com|twitter\.com|maps\.google\.com|goo\.gl|bit\.ly/i.test(url)) continue;
      try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        if (!host) continue;
        if (!seen.has(u.origin)) {
          seen.add(u.origin);
          return u.origin; // return origin as website base
        }
      } catch {}
    }
    return null;
  };

  for (const { q, src } of queries) {
    try {
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(proxy + encodeURIComponent(googleUrl));
      if (!res.ok) continue;
      const data = await res.json();
      const searchHtml: string = data.contents || '';

      // Extract profile URLs
      const profileRegex = src === 'facebook'
        ? /https:\/\/(?:m\.|www\.)facebook\.com\/[a-zA-Z0-9_.\-/%?=]+/g
        : /https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_%]+/g;
      const profiles = (searchHtml.match(profileRegex) || []).slice(0, 2);

      for (const profile of profiles) {
        try {
          const profileUrl = src === 'linkedin' ? profile.replace(/^https:\/\/[a-z]{2,3}\./, 'https://www.') : profile;
          const profRes = await fetch(proxy + encodeURIComponent(profileUrl));
          if (!profRes.ok) continue;
          const profData = await profRes.json();
          const html: string = profData.contents || '';
          const website = extractExternalSite(html, new RegExp(src, 'i'));
          if (website) {
            return { website, source: src };
          }
        } catch {}
      }
    } catch {}
  }
  return null;
};
