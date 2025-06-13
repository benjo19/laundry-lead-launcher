
// Enhanced email scraper with multiple strategies for finding email addresses

export const scrapeEmailFromWebsite = async (website: string): Promise<string | null> => {
  if (!website) return null;
  
  try {
    // Clean up the website URL
    const cleanUrl = website.startsWith('http') ? website : `https://${website}`;
    
    // Use a CORS proxy to fetch the website content
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const response = await fetch(proxyUrl + encodeURIComponent(cleanUrl));
    
    if (!response.ok) {
      console.log(`Failed to fetch website: ${cleanUrl}`);
      return null;
    }
    
    const data = await response.json();
    const htmlContent = data.contents;
    
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

// Function to validate if an email address potentially exists (basic check)
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};
