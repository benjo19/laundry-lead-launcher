import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const isStorageQuotaError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('exceeded the quota') ||
    message.includes('QuotaExceededError') ||
    message.includes("Failed to execute 'setItem' on 'Storage'");
};

const clearLegacyMarketingCache = () => {
  // This is only browser-side cache from the old Marketing Manager. CRM leads remain in Supabase.
  const largeLegacyKeys = ['discoveredLeads'];
  largeLegacyKeys.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage access errors and let the next login attempt report the real failure.
    }
  });
};

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (active && data.session) navigate('/');
      } catch (error) {
        if (isStorageQuotaError(error)) clearLegacyMarketingCache();
      } finally {
        if (active) setChecking(false);
      }
    };

    const timeout = window.setTimeout(() => {
      if (active) setChecking(false);
    }, 3000);

    checkSession().finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  const signIn = () => supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      let result;
      try {
        result = await signIn();
      } catch (error) {
        if (!isStorageQuotaError(error)) throw error;
        clearLegacyMarketingCache();
        result = await signIn();
      }

      if (result.error) throw result.error;
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Prijava nije uspjela',
        description: error?.message === 'Invalid login credentials'
          ? 'Pogrešan email ili lozinka.'
          : isStorageQuotaError(error)
            ? 'Preglednik nema dovoljno prostora za prijavu. Osvježi stranicu i pokušaj ponovno.'
            : (error?.message || 'Provjeri podatke za prijavu.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-white/10 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-5">
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl">O</div>
          <CardTitle className="text-2xl">Orderly Partner</CardTitle>
          <p className="text-sm text-muted-foreground">Prijava u prodajni CRM</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="username" placeholder="ime@firma.hr" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="h-11 pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="h-11 pl-10 pr-10" required />
                <button type="button" aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Prijavljujem…</> : 'Prijavi se'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">Pristupne podatke dobivaš od administratora.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
