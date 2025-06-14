
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  console.log('useAuth: Hook initialized');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useAuth: Setting up auth state listener');
    
    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('useAuth: Timeout reached, stopping loading');
      setLoading(false);
      setError('Authentication timeout - please refresh the page');
    }, 10000); // 10 second timeout
    
    try {
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('useAuth: Auth state changed:', { event, session: !!session });
          clearTimeout(timeoutId);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);
        }
      );

      // Get initial session
      console.log('useAuth: Getting initial session');
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('useAuth: Error getting session:', error);
          setError(error.message);
        } else {
          console.log('useAuth: Initial session:', { session: !!session });
        }
        clearTimeout(timeoutId);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((err) => {
        console.error('useAuth: Exception getting session:', err);
        clearTimeout(timeoutId);
        setError('Failed to initialize authentication');
        setLoading(false);
      });

      return () => {
        console.log('useAuth: Cleaning up auth subscription');
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('useAuth: Error setting up auth:', error);
      clearTimeout(timeoutId);
      setError('Failed to set up authentication');
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
      setError('Failed to sign out');
    }
  };

  console.log('useAuth: Returning state:', { user: !!user, session: !!session, loading, error });

  return {
    user,
    session,
    loading,
    error,
    signOut
  };
};
