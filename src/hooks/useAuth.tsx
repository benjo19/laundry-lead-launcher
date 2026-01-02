
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setError('Authentication timeout - please refresh the page');
      }
    }, 10000); // 10 second timeout

    // Helper to check if error is an invalid token error
    const isInvalidTokenError = (errorMessage: string | undefined) => {
      if (!errorMessage) return false;
      return errorMessage.includes('Invalid token') || 
             errorMessage.includes('Signature') ||
             errorMessage.includes('invalid') ||
             errorMessage.includes('JWT');
    };

    // Helper to clear invalid session
    const clearInvalidSession = async () => {
      console.log('useAuth: Clearing invalid session...');
      localStorage.removeItem('sb-uwtzhkdgprmrmknjrfeb-auth-token');
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('useAuth: Error during signOut:', e);
      }
    };
    
    try {
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;
          
          clearTimeout(timeoutId);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);
        }
      );

      // Get initial session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        if (error) {
          // Check if it's an invalid token error
          if (isInvalidTokenError(error.message)) {
            console.log('useAuth: Invalid token detected, clearing session...');
            clearInvalidSession();
            setError('Sesija je istekla. Molimo prijavite se ponovo.');
          } else {
            setError(error.message);
          }
        }
        clearTimeout(timeoutId);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((err) => {
        if (!mounted) return;
        
        console.error('useAuth: Exception getting session:', err);
        
        // Check if it's an invalid token error
        if (isInvalidTokenError(err?.message)) {
          console.log('useAuth: Invalid token exception, clearing session...');
          clearInvalidSession();
          setError('Sesija je istekla. Molimo prijavite se ponovo.');
        } else {
          setError('Failed to initialize authentication');
        }
        
        clearTimeout(timeoutId);
        setLoading(false);
      });

      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } catch (error: any) {
      console.error('useAuth: Error setting up auth:', error);
      clearTimeout(timeoutId);
      if (mounted) {
        // Check if it's an invalid token error
        if (isInvalidTokenError(error?.message)) {
          clearInvalidSession();
          setError('Sesija je istekla. Molimo prijavite se ponovo.');
        } else {
          setError('Failed to set up authentication');
        }
        setLoading(false);
      }
    }
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('useAuth: Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  return {
    user,
    session,
    loading,
    error,
    signOut
  };
};
