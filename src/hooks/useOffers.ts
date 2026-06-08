import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Offer, OfferItem } from '@/types';

export const useOffers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('offers')
        .select('*, items:offer_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) { setError(err.message); return; }
      setOffers((data as Offer[]) || []);
    } catch {
      setError('Greška pri dohvaćanju ponuda');
    } finally {
      setLoading(false);
    }
  };

  const generateBrojPonude = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id || '');
    const n = ((count || 0) + 1).toString().padStart(3, '0');
    return `PON-${year}-${n}`;
  };

  const createOffer = async (
    offer: Omit<Offer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'>,
    items: Omit<OfferItem, 'id' | 'offer_id'>[]
  ): Promise<Offer | null> => {
    if (!user) return null;
    try {
      const { data: offerData, error: offerErr } = await supabase
        .from('offers')
        .insert({ ...offer, user_id: user.id })
        .select()
        .single();
      if (offerErr || !offerData) {
        toast({ title: 'Greška', description: offerErr?.message, variant: 'destructive' });
        return null;
      }
      if (items.length > 0) {
        const { error: itemsErr } = await supabase
          .from('offer_items')
          .insert(items.map(it => ({ ...it, offer_id: offerData.id })));
        if (itemsErr) {
          toast({ title: 'Greška stavki', description: itemsErr.message, variant: 'destructive' });
        }
      }
      await fetchOffers();
      toast({ title: 'Ponuda kreirana', description: `Ponuda ${offer.broj_ponude} je uspješno kreirana.` });
      return offerData as Offer;
    } catch {
      toast({ title: 'Greška', description: 'Greška pri kreiranju ponude.', variant: 'destructive' });
      return null;
    }
  };

  const updateOffer = async (
    id: string,
    offer: Partial<Omit<Offer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'>>,
    items?: Omit<OfferItem, 'id' | 'offer_id'>[]
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error: offerErr } = await supabase
        .from('offers')
        .update({ ...offer, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (offerErr) {
        toast({ title: 'Greška', description: offerErr.message, variant: 'destructive' });
        return false;
      }
      if (items !== undefined) {
        await supabase.from('offer_items').delete().eq('offer_id', id);
        if (items.length > 0) {
          await supabase.from('offer_items').insert(items.map(it => ({ ...it, offer_id: id })));
        }
      }
      await fetchOffers();
      toast({ title: 'Ponuda ažurirana', description: 'Ponuda je uspješno ažurirana.' });
      return true;
    } catch {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju ponude.', variant: 'destructive' });
      return false;
    }
  };

  const deleteOffer = async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error: err } = await supabase
        .from('offers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (err) {
        toast({ title: 'Greška', description: err.message, variant: 'destructive' });
        return false;
      }
      await fetchOffers();
      toast({ title: 'Ponuda obrisana', description: 'Ponuda je uspješno obrisana.' });
      return true;
    } catch {
      return false;
    }
  };

  const updateStatus = async (id: string, status: Offer['status']): Promise<boolean> => {
    return updateOffer(id, { status });
  };

  useEffect(() => { fetchOffers(); }, [user]);

  return { offers, loading, error, fetchOffers, createOffer, updateOffer, deleteOffer, updateStatus, generateBrojPonude };
};
