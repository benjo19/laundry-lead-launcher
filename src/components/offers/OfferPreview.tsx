import React, { useRef } from 'react';
import { Offer, OfferItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, X } from 'lucide-react';

interface Props {
  offer: Offer;
  onClose: () => void;
  businessName?: string;
}

const statusColors: Record<string, string> = {
  Nacrt: 'bg-gray-100 text-gray-700',
  Poslana: 'bg-blue-100 text-blue-700',
  Prihvaćena: 'bg-green-100 text-green-700',
  Odbijena: 'bg-red-100 text-red-700',
  Istekla: 'bg-orange-100 text-orange-700',
};

function calcItem(item: OfferItem) {
  const bruto = item.kolicina * item.cijena_bez_pdv;
  const popust = bruto * (item.popust / 100);
  return bruto - popust;
}

const OfferPreview: React.FC<Props> = ({ offer, onClose, businessName }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const items = offer.items || [];
  const subtotal = items.reduce((s, it) => s + calcItem(it), 0);
  const discountAmt = subtotal * ((offer.popust_ukupno || 0) / 100);
  const afterDiscount = subtotal - discountAmt;
  const pdvAmt = afterDiscount * ((offer.pdv_stopa || 25) / 100);
  const total = afterDiscount + pdvAmt;
  const fmt = (n: number) => n.toFixed(2).replace('.', ',');

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open('', '_blank');
    if (!win || !content) return;
    win.document.write(`
      <html><head><title>Ponuda ${offer.broj_ponude}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 0; padding: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e40af; color: #fff; padding: 8px 10px; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:last-child td { border-bottom: none; }
        .totals td { font-weight: 600; }
        .grand-total td { font-size: 15px; background: #f0f4ff; }
        .header { display: flex; justify-content: space-between; margin-bottom: 28px; }
        .section { margin-bottom: 18px; }
        .label { color: #6b7280; font-size: 11px; text-transform: uppercase; }
        @media print { button { display: none; } }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Pregled ponude</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <Printer className="w-4 h-4" /> Ispis / PDF
            </Button>
            <Button onClick={onClose} size="sm" variant="ghost"><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div ref={printRef} className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold text-blue-800">{businessName || 'Vaša Tvrtka'}</div>
              <div className="text-sm text-gray-500 mt-1">Ponuda</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-800">{offer.broj_ponude}</div>
              <div className="text-sm text-gray-500">Datum: {offer.datum_ponude}</div>
              {offer.datum_valjanosti && (
                <div className="text-sm text-gray-500">Vrijedi do: {offer.datum_valjanosti}</div>
              )}
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColors[offer.status]}`}>
                {offer.status}
              </span>
            </div>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-lg p-4">
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Klijent</div>
              <div className="font-semibold text-gray-800">{offer.klijent_ime}</div>
              {offer.klijent_adresa && <div className="text-sm text-gray-600">{offer.klijent_adresa}</div>}
              {offer.klijent_oib && <div className="text-sm text-gray-600">OIB: {offer.klijent_oib}</div>}
              {offer.klijent_email && <div className="text-sm text-gray-600">{offer.klijent_email}</div>}
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Predmet</div>
              <div className="font-semibold text-gray-800">{offer.naslov}</div>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="py-2 px-3 text-left w-8">#</th>
                <th className="py-2 px-3 text-left">Naziv / Opis</th>
                <th className="py-2 px-3 text-center">Kol.</th>
                <th className="py-2 px-3 text-center">Jed.</th>
                <th className="py-2 px-3 text-right">Cijena</th>
                <th className="py-2 px-3 text-right">Pop.%</th>
                <th className="py-2 px-3 text-right">Iznos</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                  <td className="py-2 px-3">
                    <div className="font-medium text-gray-800">{item.naziv}</div>
                    {item.opis && <div className="text-xs text-gray-500">{item.opis}</div>}
                  </td>
                  <td className="py-2 px-3 text-center">{item.kolicina}</td>
                  <td className="py-2 px-3 text-center text-gray-500">{item.jedinica_mjere}</td>
                  <td className="py-2 px-3 text-right">{fmt(item.cijena_bez_pdv)}</td>
                  <td className="py-2 px-3 text-right text-orange-600">{item.popust > 0 ? `${item.popust}%` : '-'}</td>
                  <td className="py-2 px-3 text-right font-medium">{fmt(calcItem(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Neto iznos</span>
                <span className="font-medium">{fmt(subtotal)} {offer.currency}</span>
              </div>
              {(offer.popust_ukupno || 0) > 0 && (
                <div className="flex justify-between py-1 text-orange-600">
                  <span>Popust ({offer.popust_ukupno}%)</span>
                  <span>-{fmt(discountAmt)} {offer.currency}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Osnovica PDV ({offer.pdv_stopa}%)</span>
                <span>{fmt(afterDiscount)} {offer.currency}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">PDV ({offer.pdv_stopa}%)</span>
                <span>{fmt(pdvAmt)} {offer.currency}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-200 font-bold text-base">
                <span className="text-blue-800">UKUPNO</span>
                <span className="text-blue-800">{fmt(total)} {offer.currency}</span>
              </div>
            </div>
          </div>

          {offer.napomena && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase mb-1">Napomena</div>
              <div className="text-sm text-gray-700">{offer.napomena}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferPreview;
