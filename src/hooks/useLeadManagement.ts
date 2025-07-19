
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';

export const useLeadManagement = () => {
  // Safe call to useAuthContext with error boundary
  let user = null;
  try {
    const authContext = useAuthContext();
    user = authContext.user;
  } catch (error) {
    // If AuthContext is not available, user remains null
    console.log('AuthContext not available, using fallback');
  }
  const [localLeads] = useLocalStorage<Lead[]>('leads', []);
  
  // Use Supabase if user is authenticated, otherwise fallback to localStorage
  const supabaseHook = useSupabaseLeads();
  
  if (user) {
    return supabaseHook;
  }
  
  // Fallback to localStorage for non-authenticated users (legacy support)
  return {
    leads: localLeads,
    loading: false,
    error: null,
    addLead: async () => {
      console.log('Please log in to add leads');
      return false;
    },
    updateLeadStatus: async () => {
      console.log('Please log in to update leads');
    },
    deleteLead: async () => {
      console.log('Please log in to delete leads');
    },
    refreshLeads: async () => {
      console.log('Please log in to refresh leads');
    }
  };
};
