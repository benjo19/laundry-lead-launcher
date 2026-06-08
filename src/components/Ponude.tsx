import React, { useState } from 'react';
import { useOffers } from '@/hooks/useOffers';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { Offer, OfferItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus, Eye, Edit2, Trash2, FileText, Search,
  TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import OfferForm from './offers/OfferForm';
import OfferPreview from './offers/OfferPreview';
import LoadingSpinner from '@/components/ui/loading-spinner';

type Mode = 'list' | 'new' | 'edit';

const statusBadge: Record<string, { color: string; icon: React.ReactNode }> = {
  Nacrt:       { color: 'bg-gray-100 text-gray-700 border-gray-200',   icon: <FileText className="w-3 h-3" /> },
  Poslana:     { color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Clock className="w-3 h-3" /> },
  Prihvaćena:  { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  Odbijena:    { color: 'bg-red-100 text-red-700 border-red-200',      icon: <XCircle className="w-3 h-3" /> },
  Istekla:     { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <AlertCircle className="w-3 h-3" /> },
};

function calcTotal(offer: Offer) {
  const items = offer.items || [];
  const sub = items.reduce((s, it) => {
    const bruto = it.kolicina * it.cijena_bez_pdv;
    return s + (bruto - bruto * (it.popust / 100));
  }, 0);
  const afterDisc = sub - sub * ((offer.popust_ukupno || 0) / 100);
  return afterDisc + afterDisc * ((offer.pdv_stopa || 25) / 100);
}

const Ponude: React.FC = () => {
  const { offers, loading, createOffer, updateOffer, deleteOffer, generateBrojPonude } = useOffers();
  const { leads } = useLeadManagement();

  const [mode, setMode] = useState<Mode>('list');
  const [editTarget, setEditTarget] = useState<Offer | null>(null);
  const [previewOffer, setPreviewOffer] = useState<Offer | null>(null);
  const [newBroj, setNewBroj] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleNew = async () => {
    const br = await generateBrojPonude();
    setNewBroj(br);
    setEditTarget(null);
    setMode('new');
  };

  const handleEdit = (offer: Offer) => {
    setEditTarget(offer);
    setMode('edit');
  };

  const handleSave = async (
    offerData: Omit<Offer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'>,
    items: Omit<OfferItem, 'id' | 'offer_id'>[]
  ) => {
    if (mode === 'new') {
      await createOffer(offerData, items);
    } else if (editTarget) {
      await updateOffer(editTarget.id, offerData, items);
    }
    setMode('list');
    setEditTarget(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigurno želiš obrisati ovu ponudu?')) return;
    await deleteOffer(id);
  };

  const handlePreviewFromForm = (
    offerData: Omit<Offer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'>,
    items: Omit<OfferItem, 'id' | 'offer_id'>[]
  ) => {
    const fake: Offer = {
      ...offerData,
      id: 'preview',
      user_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: items.map((it, i) => ({ ...it, id: `p${i}`, offer_id: 'preview' })),
    };
    setPreviewOffer(fake);
  };

  const filtered = offers.filter(o => {
    const matchSearch = !search ||
      o.klijent_ime.toLowerCase().includes(search.toLowerCase()) ||
      o.broj_ponude.toLowerCase().includes(search.toLowerCase()) ||
      o.naslov.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = offers.filter(o => o.status === 'Prihvaćena').reduce((s, o) => s + calcTotal(o), 0);
  const pendingCount = offers.filter(o => o.status === 'Poslana').length;

  const leadOptions = leads.map(l => ({ id: String(l.id), company: l.company }));

  if (loading) {
    return <div className="p-6"><LoadingSpinner size="lg" text="Učitavanje ponuda..." className="py-16" /></div>;
  }

  if (mode === 'new' || mode === 'edit') {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setMode('list'); setEditTarget(null); }}>← Natrag</Button>
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'new' ? 'Nova ponuda' : `Uredi ponudu ${editTarget?.broj_ponude}`}
          </h2>
        </div>
        <OfferForm
          initial={editTarget || undefined}
          brojPonude={newBroj}
          leads={leadOptions}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setEditTarget(null); }}
          onPreview={handlePreviewFromForm}
        />
        {previewOffer && (
          <OfferPreview offer={previewOffer} onClose={() => setPreviewOffer(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Ponude</h2>
          <p className="text-gray-500 text-sm mt-1">Upravljanje ponudama i predračunima</p>
        </div>
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nova ponuda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-0.5">Ukupno ponuda</p>
            <div className="text-2xl font-bold text-blue-700">{offers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-0.5">Na čekanju</p>
            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-0.5">Prihvaćene</p>
            <div className="text-2xl font-bold text-green-700">{offers.filter(o => o.status === 'Prihvaćena').length}</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-0.5">Vrijednost (prihv.)</p>
            <div className="text-lg font-bold text-purple-700">{totalValue.toFixed(0)} EUR</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Pretraži ponude..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            {['Nacrt','Poslana','Prihvaćena','Odbijena','Istekla'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nema ponuda</p>
          <p className="text-sm mt-1">Kliknite "Nova ponuda" za kreiranje prve ponude</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(offer => {
            const total = calcTotal(offer);
            const sb = statusBadge[offer.status] || statusBadge.Nacrt;
            return (
              <Card key={offer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900">{offer.broj_ponude}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sb.color}`}>
                            {sb.icon} {offer.status}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 truncate">{offer.naslov}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {offer.klijent_ime} · {offer.datum_ponude}
                          {offer.datum_valjanosti && ` · Vrijedi do ${offer.datum_valjanosti}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">{total.toFixed(2)} {offer.currency}</div>
                        <div className="text-xs text-gray-400">{(offer.items || []).length} stavki</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => setPreviewOffer(offer)}
                          title="Pregled"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-green-600"
                          onClick={() => handleEdit(offer)}
                          title="Uredi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(offer.id)}
                          title="Obriši"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {previewOffer && (
        <OfferPreview offer={previewOffer} onClose={() => setPreviewOffer(null)} />
      )}
    </div>
  );
};

export default Ponude;
