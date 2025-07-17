
// Enhanced email scraper with multiple strategies for finding email addresses

// Enhanced email scraper with multiple strategies and proxy services
export const scrapeEmailFromWebsite = async (website: string): Promise<string | null> => {
  if (!website) return null;
  
  try {
    // Clean up the website URL
    const cleanUrl = website.startsWith('http') ? website : `https://${website}`;
    
    // Try multiple proxy services for better success rate
    const proxyServices = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
    ];
    
    let htmlContent = null;
    
    for (const proxyUrl of proxyServices) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(proxyUrl + encodeURIComponent(cleanUrl), {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          htmlContent = data.contents || data;
          break;
        }
      } catch (error) {
        console.log(`Failed with proxy ${proxyUrl}:`, error);
        continue;
      }
    }
    
    if (!htmlContent) {
      console.log(`All proxy services failed for: ${cleanUrl}`);
      return null;
    }
    
    if (!htmlContent) return null;
    
    // Email regex patterns (enhanced)
    const emailPatterns = [
      // Standard email pattern
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      // Email in mailto links
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      // Email with [at] or (at) instead of @
      /[a-zA-Z0-9._%+-]+\s*\[at\]\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /[a-zA-Z0-9._%+-]+\s*\(at\)\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      // Email with " at " or " AT " instead of @
      /[a-zA-Z0-9._%+-]+\s+at\s+[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
      // Email with [dot] or (dot) instead of .
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\s*\[dot\]\s*[a-zA-Z]{2,}/gi,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\s*\(dot\)\s*[a-zA-Z]{2,}/gi,
    ];
    
    const foundEmails = new Set<string>();
    
    // Search for emails using different patterns
    emailPatterns.forEach(pattern => {
      const matches = htmlContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          let email = match;
          
          // Clean up the email
          if (email.includes('mailto:')) {
            email = email.replace('mailto:', '');
          }
          
          // Replace [at] and (at) with @
          email = email.replace(/\s*\[at\]\s*/gi, '@');
          email = email.replace(/\s*\(at\)\s*/gi, '@');
          email = email.replace(/\s+at\s+/gi, '@');
          
          // Replace [dot] and (dot) with .
          email = email.replace(/\s*\[dot\]\s*/gi, '.');
          email = email.replace(/\s*\(dot\)\s*/gi, '.');
          
          // Remove any HTML tags
          email = email.replace(/<[^>]*>/g, '');
          
          // Remove extra spaces
          email = email.replace(/\s+/g, '');
          
          // Validate email format
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (emailRegex.test(email.trim())) {
            // Filter out common non-business emails
            const excludePatterns = [
              /noreply/i,
              /no-reply/i,
              /donotreply/i,
              /do-not-reply/i,
              /example\.com/i,
              /test\.com/i,
              /placeholder/i,
              /sample/i,
              /webmaster/i,
              /admin@/i,
              /postmaster/i,
              /newsletter/i,
              /marketing@/i,
            ];
            
            const isExcluded = excludePatterns.some(pattern => pattern.test(email));
            if (!isExcluded) {
              foundEmails.add(email.trim().toLowerCase());
            }
          }
        });
      }
    });
    
    // Return the first valid email found, preferring contact-related emails
    const emailsArray = Array.from(foundEmails);
    
    // Prioritize contact-related emails
    const priorityEmail = emailsArray.find(email => 
      /^(info|contact|office|sales|hello|inquiries|general)@/i.test(email)
    );
    
    if (priorityEmail) {
      console.log(`Found priority email: ${priorityEmail} from ${cleanUrl}`);
      return priorityEmail;
    }
    
    if (emailsArray.length > 0) {
      console.log(`Found email: ${emailsArray[0]} from ${cleanUrl}`);
      return emailsArray[0];
    }
    
    console.log(`No email found on ${cleanUrl}`);
    return null;
    
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
