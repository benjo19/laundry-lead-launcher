
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Auth: Component mounted, checking user session');
    
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth: Error checking session:', error);
          setAuthError(`Session check failed: ${error.message}`);
        } else if (session) {
          console.log('Auth: User already authenticated, redirecting');
          navigate('/');
        } else {
          console.log('Auth: No active session, showing auth form');
        }
      } catch (error) {
        console.error('Auth: Exception during auth check:', error);
        setAuthError('Failed to check authentication status');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth: Timeout reached during auth check');
      setIsCheckingAuth(false);
      setAuthError('Authentication check timed out');
    }, 8000);

    checkUser().finally(() => clearTimeout(timeoutId));

    return () => clearTimeout(timeoutId);
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({
        title: "Greška",
        description: "Sva polja su obavezna.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Greška pri registraciji",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registracija uspješna",
          description: "Provjerite email za potvrdu računa.",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Greška",
        description: "Dogodila se neočekivana greška.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Greška",
        description: "Email i lozinka su obavezni.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Save remember me preference in localStorage
      if (rememberMe) {
        localStorage.setItem('supabase.auth.remember', 'true');
      } else {
        localStorage.removeItem('supabase.auth.remember');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Greška pri prijavi",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Uspješna prijava",
          description: rememberMe 
            ? "Dobrodošli u Marketing Agent! Ostanete prijavljeni." 
            : "Dobrodošli u Marketing Agent!",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Signin error:', error);
      toast({
        title: "Greška",
        description: "Dogodila se neočekivana greška.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Greška",
        description: "Unesite email adresu.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email poslan",
          description: "Provjerite email za link za resetovanje lozinke.",
        });
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Greška",
        description: "Dogodila se neočekivana greška.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('Google sign-in clicked');
    setGoogleLoading(true);
    
    try {
      console.log('Attempting Google OAuth with Supabase...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      console.log('OAuth response:', { data, error });

      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: "Greška pri Google prijavi",
          description: error.message,
          variant: "destructive",
        });
        setGoogleLoading(false);
      } else {
        console.log('OAuth successful, redirecting...');
        // User will be redirected to Google, then back to our app
      }
      // If successful, user will be redirected, so we don't set loading to false
    } catch (error) {
      console.error('Google signin exception:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri Google prijavi.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-slate-600">Provjera prijave...</p>
            {authError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{authError}</span>
                </div>
                <Button
                  onClick={() => {
                    setAuthError(null);
                    setIsCheckingAuth(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                >
                  Nastavi bez provjere
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      <Card className="w-full max-w-[340px] sm:max-w-md mx-auto shadow-lg border border-border/20">
        <CardHeader className="text-center space-y-2 pb-4">
          <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
            Marketing Agent
          </CardTitle>
          <p className="text-xs sm:text-sm md:text-base text-slate-600">
            Vaš AI asistent za marketing
          </p>
          {authError && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{authError}</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6">
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              variant="outline"
              className="w-full h-10 sm:h-11 text-xs sm:text-sm font-medium border-gray-300 hover:bg-gray-50 touch-manipulation"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Povezivanje...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Nastavi sa Google računom
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ili</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-9 sm:h-10">
              <TabsTrigger value="signin" className="text-xs sm:text-sm">
                Prijava
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm">
                Registracija
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signin-email" className="text-xs sm:text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="vas-email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm touch-manipulation"
                      required
                      disabled={loading || googleLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signin-password" className="text-xs sm:text-sm font-medium">
                    Lozinka
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Unesite lozinku"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm touch-manipulation"
                      required
                     disabled={loading || googleLoading}
                    />
                  </div>
                </div>
                
                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading || googleLoading}
                  />
                  <Label 
                    htmlFor="remember-me" 
                    className="text-xs sm:text-sm cursor-pointer"
                  >
                    Ostani prijavljen
                  </Label>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs p-0 h-auto"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Zaboravili ste lozinku?
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-9 sm:h-11 text-xs sm:text-sm font-medium touch-manipulation" 
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Prijavljivanje...
                    </>
                  ) : (
                    <>
                      Prijavite se
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-fullname" className="text-xs sm:text-sm font-medium">
                    Ime i prezime
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder="Vaše ime i prezime"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm touch-manipulation"
                      required
                      disabled={loading || googleLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-email" className="text-xs sm:text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="vas-email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm touch-manipulation"
                      required
                      disabled={loading || googleLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium">
                    Lozinka
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimalno 6 karaktera"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm touch-manipulation"
                      required
                      minLength={6}
                      disabled={loading || googleLoading}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-9 sm:h-11 text-xs sm:text-sm font-medium touch-manipulation" 
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registriranje...
                    </>
                  ) : (
                    <>
                      Registrirajte se
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-lg">Resetovanje lozinke</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email adresa</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Unesite vašu email adresu"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={resetLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    disabled={resetLoading}
                  >
                    Otkaži
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Šalje...
                      </>
                    ) : (
                      'Pošalji'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Auth;
