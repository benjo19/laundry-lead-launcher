import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAISettings } from '@/hooks/useAISettings';
import { Plus, Search, Loader2, Globe } from 'lucide-react';
import { Lead } from '@/types';

interface WebResult {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
  favicon?: string | null;
  provider: 'google_cse' | 'serpapi';
}

interface WebSearchTabProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => Promise<boolean>;
}

const WebSearchTab: React.FC<WebSearchTabProps> = ({ onAddLead }) => {
  const { toast } = useToast();
  const { aiSettings } = useAISettings();

  const defaultProvider = aiSettings?.search_provider || 'google_cse';
  const [q, setQ] = useState('');
  const [site, setSite] = useState('');
  const [num, setNum] = useState(10);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<WebResult[]>([]);
  const [providerUsed, setProviderUsed] = useState<'google_cse' | 'serpapi'>(defaultProvider);

  const baseUrl = useMemo(
    () => `https://uwtzhkdgprmrmknjrfeb.supabase.co/functions/v1/search-web`,
    []
  );

  const runSearch = async () => {
    if (!q.trim()) {
      toast({ title: 'Greška', description: 'Unesite upit (q).', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), num: String(num), page: String(page), provider: defaultProvider });
      if (site.trim()) params.set('site', site.trim());
      const url = `${baseUrl}?${params.toString()}`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.details || data?.error || 'Neuspješan upit');
      }
      const items = (data.results || []) as WebResult[];
      setResults(items);
      setProviderUsed(data.provider || defaultProvider);
      toast({ title: 'Uspjeh', description: `Pronađeno ${items.length} rezultata.` });
    } catch (e: any) {
      console.error('WebSearch error:', e);
      toast({ title: 'Greška', description: e.message || 'Dogodila se greška.', variant: 'destructive' });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLead = async (item: WebResult) => {
    const newLead: Omit<Lead, 'id' | 'dateAdded'> = {
      company: item.title,
      location: '',
      employees: '10-50',
      phone: '',
      email: '',
      website: item.link,
      status: 'Nova',
      potential: 'Srednji',
      industry: '',
      notes: `Dodano iz Web pretrage (${providerUsed}). Izvor: ${item.displayLink || item.link}`,
      country: '',
    };
    try {
      const ok = await onAddLead(newLead);
      if (ok) {
        toast({ title: 'Lead dodan', description: `${item.title} je spremljen.` });
      } else {
        toast({ title: 'Greška', description: 'Lead nije spremljen.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Greška', description: e.message || 'Dogodila se greška.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> Web Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Upit (q)</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="npr. restaurant Pula" />
          </div>
          <div>
            <label className="text-sm font-medium">Site filter (opcionalno)</label>
            <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="npr. example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Num</label>
              <Input type="number" min={1} max={10} value={num} onChange={(e) => setNum(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium">Stranica</label>
              <Input type="number" min={1} max={50} value={page} onChange={(e) => setPage(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="flex">
          <Button onClick={runSearch} disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {isLoading ? 'Pretraživanje...' : 'Pretraži'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-slate-600">Prikaz: {results.length} rezultata</div>
            {results.map((r, idx) => (
              <div key={idx} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <a href={r.link} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                      {r.title}
                    </a>
                    <Badge variant="secondary" className="text-xs uppercase">{r.provider}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{r.displayLink || r.link}</div>
                  {r.snippet && <div className="text-sm text-slate-700 mt-1">{r.snippet}</div>}
                </div>
                <div>
                  <Button size="sm" onClick={() => handleAddLead(r)}>
                    <Plus className="h-4 w-4 mr-1" /> Dodaj kao lead
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebSearchTab;
