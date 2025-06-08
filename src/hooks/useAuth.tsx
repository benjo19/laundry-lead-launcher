
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  console.log('useAuth: Hook initialized');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Setting up auth state listener');
    
    try {
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('useAuth: Auth state changed:', { event, session: !!session });
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      // Get initial session
      console.log('useAuth: Getting initial session');
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('useAuth: Error getting session:', error);
        } else {
          console.log('useAuth: Initial session:', { session: !!session });
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        console.log('useAuth: Cleaning up auth subscription');
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('useAuth: Error setting up auth:', error);
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    console.log('useAuth: Signing out user');
    try {
      await supabase.auth.signOut();
      console.log('useAuth: Sign out successful');
    } catch (error) {
      console.error('useAuth: Error signing out:', error);
    }
  };

  console.log('useAuth: Returning state:', { user: !!user, session: !!session, loading });

  return {
    user,
    session,
    loading,
    signOut
  };
};
