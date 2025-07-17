
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


// Enhanced email discovery that only returns scraped emails
export const enhancedEmailDiscovery = async (companyName: string, website: string): Promise<string[]> => {
  const emails: string[] = [];
  
  // 1. Try scraping from website
  const scrapedEmail = await scrapeEmailFromWebsite(website);
  if (scrapedEmail) {
    emails.push(scrapedEmail);
  }
  
  // 2. Try social media and directory lookup
  try {
    const socialEmails = await searchSocialMediaEmails(companyName);
    emails.push(...socialEmails);
  } catch (error) {
    console.error('Error searching social media:', error);
  }
  
  // Remove duplicates and return only found emails
  return [...new Set(emails)];
};

// Search for emails on social media platforms and directories
const searchSocialMediaEmails = async (companyName: string): Promise<string[]> => {
  const emails: string[] = [];
  
  try {
    // Search Google for company contact information
    const searchQuery = `"${companyName}" contact email site:linkedin.com OR site:facebook.com OR site:yellowpages.com`;
    const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`)}`;
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      const searchResults = data.contents;
      
      // Extract emails from search results
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = searchResults.match(emailRegex) || [];
      
      emails.push(...foundEmails.filter(email => 
        !email.includes('google.com') && 
        !email.includes('facebook.com') &&
        !email.includes('linkedin.com')
      ));
    }
  } catch (error) {
    console.error('Error searching for social media emails:', error);
  }
  
  return emails;
};

// Function to validate if an email address potentially exists (basic check)
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};
