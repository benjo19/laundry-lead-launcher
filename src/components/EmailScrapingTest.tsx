import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { scrapeEmailFromWebsite, enhancedEmailDiscovery } from '@/utils/emailScraper';

export const EmailScrapingTest = () => {
  const [website, setWebsite] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    scrapedEmail: string | null;
    enhancedEmails: string[];
    socialProfiles: Record<string, string>;
    emailSources: Record<string, string>;
    logs: string[];
  } | null>(null);
  const { toast } = useToast();

  const testScraping = async () => {
    if (!website.trim()) {
      toast({
        title: "Greška",
        description: "Molim unesite URL web stranice",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResults(null);
    const logs: string[] = [];
    
    // Override console.log to capture logs
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      console.log(`=== TESTING EMAIL SCRAPING FOR: ${website} ===`);
      
      // Test basic email scraping
      console.log('1. Testing basic email scraping...');
      const scrapedEmail = await scrapeEmailFromWebsite(website);
      console.log('Scraped email result:', scrapedEmail);
      
      // Test enhanced email discovery if company name is provided
      let enhancedResult = { emails: [], socialProfiles: {}, emailSources: {} };
      if (companyName.trim()) {
        console.log('2. Testing enhanced email discovery...');
        try {
          enhancedResult = await enhancedEmailDiscovery(companyName, website);
          console.log('Enhanced emails result:', enhancedResult);
        } catch (error) {
          console.log('Enhanced email discovery failed:', error);
        }
      } else {
        console.log('2. Skipping enhanced discovery (no company name provided)');
      }
      
      setResults({
        scrapedEmail,
        enhancedEmails: enhancedResult.emails,
        socialProfiles: enhancedResult.socialProfiles,
        emailSources: enhancedResult.emailSources,
        logs: [...logs]
      });
      
      if (scrapedEmail || enhancedResult.emails.length > 0) {
        toast({
          title: "Test uspješan",
          description: `Pronađen${scrapedEmail ? '' : 'i'} ${scrapedEmail ? '1 email' : `${enhancedResult.emails.length} emailova`}`,
        });
      } else {
        toast({
          title: "Nema rezultata",
          description: "Nisu pronađeni emailovi na ovoj stranici",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Greška",
        description: `Greška pri scraping: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        variant: "destructive",
      });
    } finally {
      // Restore original console.log
      console.log = originalLog;
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test Email Scraping Funkcionalnosti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="website" className="text-sm font-medium">
            URL web stranice *
          </label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            type="url"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium">
            Naziv kompanije (opcionalno)
          </label>
          <Input
            id="company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Naziv kompanije za enhanced search"
          />
        </div>
        
        <Button 
          onClick={testScraping} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testiram...' : 'Testiraj Email Scraping'}
        </Button>
        
        {results && (
          <div className="space-y-4 mt-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Rezultati:</h3>
              
              <div className="space-y-2">
                <div>
                  <strong>Osnovni scraping:</strong> 
                  <span className={results.scrapedEmail ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                    {results.scrapedEmail || 'Nije pronađen email'}
                  </span>
                </div>
                
                {companyName && (
                  <div>
                    <strong>Enhanced discovery:</strong>
                    {results.enhancedEmails.length > 0 ? (
                      <div className="ml-4">
                        <ul className="list-disc list-inside text-green-600">
                          {results.enhancedEmails.map((email, index) => (
                            <li key={index}>
                              {email} 
                              {results.emailSources[email] && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({results.emailSources[email]})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        
                        {Object.keys(results.socialProfiles).length > 0 && (
                          <div className="mt-2">
                            <strong className="text-sm">Pronađeni profili:</strong>
                            <ul className="list-disc list-inside text-blue-600 text-sm">
                              {Object.entries(results.socialProfiles).map(([platform, url]) => (
                                <li key={platform}>
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {platform}: {url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-600 ml-2">Nisu pronađeni dodatni emailovi</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Debug Logovi:</h3>
              <div className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-64 font-mono">
                {results.logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Preporučene stranice za test:</strong></p>
          <ul className="list-disc list-inside ml-4">
            <li>https://example.com (test stranica)</li>
            <li>https://github.com (poznata stranica)</li>
            <li>https://stackoverflow.com (poznata stranica)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};