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

// Enhanced email scraper with multiple strategies and proxy services
export const scrapeEmailFromWebsite = async (website: string): Promise<string | null> => {
  if (!website) return null;

  try {
    // Normalize base URL
    const baseUrl = website.startsWith('http') ? website : `https://${website}`;
    const base = new URL(baseUrl);
    const companyRoot = getDomainRoot(base.hostname);

    // Pages that commonly contain contact info (HR/EN variants)
    const candidatePaths = [
      '/',
      '/contact', '/contact/', '/contact-us', '/contact-us/', '/contact.html',
      '/kontakt', '/kontakt/', '/kontakt.html',
      '/about', '/about-us', '/about/', '/about-us/',
      '/o-nama', '/o-nama/', '/impressum', '/impressum/'
    ];

    // Proxies (prefer raw text to avoid JSON parsing issues)
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
    ];

    const foundEmails = new Set<string>();

    // Helper: fetch a URL via proxies and return text content
    const fetchViaProxies = async (url: string): Promise<string | null> => {
      for (const proxy of proxies) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const proxiedUrl = proxy + encodeURIComponent(url);
          const res = await fetch(proxiedUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) continue;

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            const txt = typeof data === 'string' ? data : (data.contents || JSON.stringify(data));
            return String(txt);
          } else {
            const txt = await res.text();
            return txt;
          }
        } catch (e) {
          // try next proxy
          continue;
        }
      }
      return null;
    };

    // Helper: extract and normalize emails from a block of text/html
    const extractEmails = (html: string) => {
      if (!html) return;

      // Replace common obfuscations before matching
      let text = html
        .replace(/\s*\[at\]\s*/gi, '@')
        .replace(/\s*\(at\)\s*/gi, '@')
        .replace(/\s+at\s+/gi, '@')
        .replace(/\s*\[dot\]\s*/gi, '.')
        .replace(/\s*\(dot\)\s*/gi, '.')
        .replace(/\u2022|&bull;/g, '.') // bullets sometimes used instead of dots
        .replace(/\s+/g, ' ');

      const patterns: RegExp[] = [
        /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      ];

      for (const rx of patterns) {
        const matches = text.match(rx) || [];
        for (let m of matches) {
          let email = m;
          if (email.startsWith('mailto:')) email = email.replace('mailto:', '');
          email = email.replace(/<[^>]*>/g, '').trim().toLowerCase();

          const valid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!valid.test(email)) continue;

          // Exclusions: obvious non-contact technical addresses
          const exclude = [
            /noreply/i, /no-reply/i, /donotreply/i, /do-not-reply/i,
            /example\.com/i, /test\.com/i, /postmaster/i, /webmaster/i,
          ];
          if (exclude.some((p) => p.test(email))) continue;

          foundEmails.add(email);
        }
      }
    };

    // Crawl candidate pages (stop early if we already have a good company email)
    for (const path of candidatePaths) {
      const pageUrl = new URL(path, base).toString();
      const html = await fetchViaProxies(pageUrl);
      if (!html) continue;
      extractEmails(html);

      // Early stop if we already have a company-domain role email
      const arr = Array.from(foundEmails);
      const companyMatches = arr.filter((e) => getDomainRoot((e.split('@')[1] || '')) === companyRoot && !isFreeEmailDomain((e.split('@')[1] || '')));
      const roleBest = companyMatches.find((e) => /^(info|contact|office|sales|hello|inquiries|general|support)@/i.test(e));
      if (roleBest) {
        return roleBest;
      }
    }

    if (foundEmails.size === 0) {
      return null;
    }

    const emailsArray = Array.from(foundEmails);

    // 1) Prefer company-domain emails (including subdomains)
    const companyEmails = emailsArray.filter((email) => {
      const domain = (email.split('@')[1] || '').toLowerCase();
      return !isFreeEmailDomain(domain) && getDomainRoot(domain) === companyRoot;
    });

    // Prioritize role-based first
    const rolePriority = (list: string[]) =>
      list.find((e) => /^(info|contact|office|sales|hello|inquiries|general|support)@/i.test(e)) || list[0];

    if (companyEmails.length > 0) {
      const chosen = rolePriority(companyEmails);
      return chosen;
    }

    // 2) Fallback: if company-domain not found, accept emails found on the official site (even free providers)
    // Still prioritize role-based, then first
    const chosen = rolePriority(emailsArray);
    return chosen || null;
  } catch (error) {
    console.error(`Error scraping email from ${website}:`, error);
    return null;
  }
};


// Enhanced email discovery that returns emails with their sources
export const enhancedEmailDiscovery = async (companyName: string, website: string): Promise<{
  emails: string[];
  socialProfiles: {
    linkedin?: string;
    facebook?: string;
    yellowPages?: string;
  };
  emailSources: Record<string, string>; // email -> source mapping
}> => {
  const emails: string[] = [];
  const socialProfiles = {};
  const emailSources: Record<string, string> = {};
  
  // 1. Try scraping from website
  const scrapedEmail = await scrapeEmailFromWebsite(website);
  if (scrapedEmail) {
    emails.push(scrapedEmail);
    emailSources[scrapedEmail] = 'website';
  }
  
  // 2. Try social media and directory lookup
  try {
    const socialResult = await searchSocialMediaEmails(companyName);
    for (const result of socialResult) {
      if (result.email) {
        emails.push(result.email);
        emailSources[result.email] = result.source;
      }
      if (result.profileUrl) {
        (socialProfiles as any)[result.source] = result.profileUrl;
      }
    }
  } catch (error) {
    console.error('Error searching social media:', error);
  }
  
  return {
    emails: [...new Set(emails)],
    socialProfiles,
    emailSources
  };
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
