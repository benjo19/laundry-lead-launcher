import React, { useState, useEffect } from 'react';
import { Offer, OfferItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X, Eye } from 'lucide-react';

type ItemDraft = Omit<OfferItem, 'id' | 'offer_id'>;

interface Props {
  initial?: Offer;
  brojPonude: string;
  leads?: { id: string; company: string }[];
  onSave: (
    offer: Omit<Offer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'>,
    items: ItemDraft[]
  ) => Promise<void>;
  onCancel: () => void;
  onPreview?: (
    offer: Omit<Offer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'>,
    items: ItemDraft[]
  ) => void;
}

const emptyItem = (): ItemDraft => ({
  redni_broj: 1,
  naziv: '',
  opis: '',
  kolicina: 1,
  jedinica_mjere: 'kom',
  cijena_bez_pdv: 0,
  popust: 0,
});

const OfferForm: React.FC<Props> = ({ initial, brojPonude, leads = [], onSave, onCancel, onPreview }) => {
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    broj_ponude: initial?.broj_ponude || brojPonude,
    naslov: initial?.naslov || '',
    klijent_ime: initial?.klijent_ime || '',
    klijent_email: initial?.klijent_email || '',
    klijent_adresa: initial?.klijent_adresa || '',
    klijent_oib: initial?.klijent_oib || '',
    lead_id: initial?.lead_id || '',
    status: (initial?.status || 'Nacrt') as Offer['status'],
    datum_ponude: initial?.datum_ponude || today,
    datum_valjanosti: initial?.datum_valjanosti || in30,
    napomena: initial?.napomena || '',
    popust_ukupno: initial?.popust_ukupno ?? 0,
    pdv_stopa: initial?.pdv_stopa ?? 25,
    currency: initial?.currency || 'EUR',
  });

  const [items, setItems] = useState<ItemDraft[]>(
    initial?.items?.map(it => ({
      redni_broj: it.redni_broj,
      naziv: it.naziv,
      opis: it.opis || '',
      kolicina: it.kolicina,
      jedinica_mjere: it.jedinica_mjere,
      cijena_bez_pdv: it.cijena_bez_pdv,
      popust: it.popust,
    })) || [emptyItem()]
  );

  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const addItem = () => setItems(prev => [...prev, { ...emptyItem(), redni_broj: prev.length + 1 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, k: keyof ItemDraft, v: string | number) =>
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));

  const calcItem = (it: ItemDraft) => {
    const bruto = it.kolicina * it.cijena_bez_pdv;
    return bruto - bruto * (it.popust / 100);
  };
  const subtotal = items.reduce((s, it) => s + calcItem(it), 0);
  const discountAmt = subtotal * (form.popust_ukupno / 100);
  const afterDiscount = subtotal - discountAmt;
  const pdvAmt = afterDiscount * (form.pdv_stopa / 100);
  const total = afterDiscount + pdvAmt;
  const fmt = (n: number) => n.toFixed(2);

  const buildPayload = () => ({
    ...form,
    lead_id: form.lead_id || undefined,
    popust_ukupno: Number(form.popust_ukupno),
    pdv_stopa: Number(form.pdv_stopa),
  });

  const buildItems = () => items.map((it, idx) => ({ ...it, redni_broj: idx + 1 }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(buildPayload(), buildItems());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Broj ponude</Label>
          <Input value={form.broj_ponude} onChange={e => setField('broj_ponude', e.target.value)} />
        </div>
        <div>
          <Label>Datum ponude</Label>
          <Input type="date" value={form.datum_ponude} onChange={e => setField('datum_ponude', e.target.value)} />
        </div>
        <div>
          <Label>Vrijedi do</Label>
          <Input type="date" value={form.datum_valjanosti} onChange={e => setField('datum_valjanosti', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Predmet / Naslov ponude *</Label>
          <Input placeholder="npr. Ponuda za pranje rublja" value={form.naslov} onChange={e => setField('naslov', e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setField('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Nacrt','Poslana','Prihvaćena','Odbijena','Istekla'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Podaci klijenta</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.length > 0 && (
            <div className="md:col-span-2">
              <Label>Poveži s leadom (opcionalno)</Label>
              <Select value={form.lead_id || 'none'} onValueChange={v => {
                const lead = leads.find(l => l.id === v);
                setField('lead_id', v === 'none' ? '' : v);
                if (lead) setField('klijent_ime', lead.company);
              }}>
                <SelectTrigger><SelectValue placeholder="Odaberi lead..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Bez linka —</SelectItem>
                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.company}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Ime klijenta / Tvrtke *</Label>
            <Input value={form.klijent_ime} onChange={e => setField('klijent_ime', e.target.value)} />
          </div>
          <div>
            <Label>Email klijenta</Label>
            <Input type="email" value={form.klijent_email} onChange={e => setField('klijent_email', e.target.value)} />
          </div>
          <div>
            <Label>Adresa</Label>
            <Input value={form.klijent_adresa} onChange={e => setField('klijent_adresa', e.target.value)} />
          </div>
          <div>
            <Label>OIB</Label>
            <Input value={form.klijent_oib} onChange={e => setField('klijent_oib', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Stavke ponude</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1.5">
            <Plus className="w-4 h-4" /> Dodaj stavku
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium uppercase px-1">
            <div className="col-span-3">Naziv</div>
            <div className="col-span-2">Opis</div>
            <div className="col-span-1">Kol.</div>
            <div className="col-span-1">Jed.</div>
            <div className="col-span-2">Cijena (bez PDV)</div>
            <div className="col-span-1">Pop.%</div>
            <div className="col-span-1 text-right">Iznos</div>
            <div className="col-span-1"></div>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-12 md:col-span-3">
                <Input placeholder="Naziv usluge/robe" value={item.naziv} onChange={e => updateItem(i, 'naziv', e.target.value)} />
              </div>
              <div className="col-span-12 md:col-span-2">
                <Input placeholder="Opis" value={item.opis} onChange={e => updateItem(i, 'opis', e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Input type="number" min="0" step="0.01" value={item.kolicina} onChange={e => updateItem(i, 'kolicina', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Input placeholder="kom" value={item.jedinica_mjere} onChange={e => updateItem(i, 'jedinica_mjere', e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={item.cijena_bez_pdv} onChange={e => updateItem(i, 'cijena_bez_pdv', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Input type="number" min="0" max="100" step="0.5" placeholder="0" value={item.popust} onChange={e => updateItem(i, 'popust', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-4 md:col-span-1 flex items-center justify-end">
                <span className="text-sm font-medium text-gray-700">{fmt(calcItem(item))}</span>
              </div>
              <div className="col-span-4 md:col-span-1 flex justify-end">
                <Button type="button" size="icon" variant="ghost" className="text-red-400 hover:text-red-600 h-9 w-9" onClick={() => removeItem(i)} disabled={items.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals + notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Napomena</Label>
            <Textarea rows={4} placeholder="Uvjeti plaćanja, rok isporuke..." value={form.napomena} onChange={e => setField('napomena', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valuta</Label>
              <Select value={form.currency} onValueChange={v => setField('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['EUR','HRK','USD','GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>PDV stopa (%)</Label>
              <Input type="number" min="0" max="100" value={form.pdv_stopa} onChange={e => setField('pdv_stopa', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Ukupni popust (%)</Label>
              <Input type="number" min="0" max="100" value={form.popust_ukupno} onChange={e => setField('popust_ukupno', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm self-start">
          <div className="flex justify-between">
            <span className="text-gray-500">Neto iznos</span>
            <span className="font-medium">{fmt(subtotal)} {form.currency}</span>
          </div>
          {form.popust_ukupno > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Popust ({form.popust_ukupno}%)</span>
              <span>-{fmt(discountAmt)} {form.currency}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Osnovica PDV</span>
            <span>{fmt(afterDiscount)} {form.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">PDV ({form.pdv_stopa}%)</span>
            <span>{fmt(pdvAmt)} {form.currency}</span>
          </div>
          <div className="flex justify-between pt-2 border-t font-bold text-lg text-blue-800">
            <span>UKUPNO</span>
            <span>{fmt(total)} {form.currency}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="gap-1.5">
          <X className="w-4 h-4" /> Odustani
        </Button>
        {onPreview && (
          <Button type="button" variant="outline" onClick={() => onPreview(buildPayload(), buildItems())} className="gap-1.5">
            <Eye className="w-4 h-4" /> Pregled
          </Button>
        )}
        <Button type="button" onClick={handleSave} disabled={saving || !form.naslov || !form.klijent_ime} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="w-4 h-4" /> {saving ? 'Spremanje...' : 'Spremi ponudu'}
        </Button>
      </div>
    </div>
  );
};

export default OfferForm;
