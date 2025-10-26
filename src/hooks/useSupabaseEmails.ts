import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Email {
  id: string;
  user_id: string;
  to_email: string;
  subject: string;
  content: string;
  template?: string;
  status: string;
  open_rate?: string;
  click_rate?: string;
  sent_at?: string;
  created_at: string;
}

export const useSupabaseEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEmails = async () => {
    if (!user) {
      setEmails([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching emails:', error);
        setEmails([]);
      } else {
        setEmails(data || []);
      }
    } catch (error) {
      console.error('Error in fetchEmails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('emails-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { 
    emails, 
    loading, 
    refreshEmails: fetchEmails 
  };
};
