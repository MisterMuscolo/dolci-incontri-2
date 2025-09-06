import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, dismissToast, showLoading } from '@/utils/toast';
import { PasswordValidator, isPasswordValid } from '@/components/PasswordValidator';
import { Turnstile } from '@marsidev/react-turnstile'; // Import Turnstile

const loginSchema = z.object({
  email: z.string().email("L'email non è valida."),
  password: z.string().min(1, "La password è obbligatoria."),
});

const registerSchema = z.object({
  email: z.string().email("L'email non è valida."),
  password: z.string()
    .min(8, "La password deve avere almeno 8 caratteri.")
    .refine(isPasswordValid, {
      message: "La password non rispetta i requisiti di sicurezza.",
    }),
  confirmPassword: z.string().min(1, "Conferma la password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono.",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email("L'email non è valida."),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'login';
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const referrerCode = searchParams.get('ref'); // Leggi il codice referral dall'URL

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const verifyTurnstile = async () => {
    // Bypass Turnstile verification in development environment
    if (import.meta.env.DEV) {
      console.log("Turnstile verification bypassed in development mode.");
      return true;
    }

    if (!turnstileToken) {
      setTurnstileError("Per favore, completa la verifica di sicurezza.");
      return false;
    }
    setTurnstileError(null);
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token: turnstileToken },
      });

      if (error || !data.success) {
        throw new Error(error?.message || 'Verifica di sicurezza fallita. Riprova.');
      }
      return true;
    } catch (error: any) {
      setTurnstileError(error.message || 'Errore nella verifica di sicurezza.');
      showError(error.message || 'Errore nella verifica di sicurezza.');
      return false;
    }
  };

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setTurnstileError(null);
    const toastId = showLoading('Accesso in corso...');

    const isHuman = await verifyTurnstile();
    if (!isHuman) {
      dismissToast(toastId);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      dismissToast(toastId);

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          showError('Email non confermata. Controlla la tua casella di posta.');
        } else {
          showError(error.message);
        }
        return;
      }

      showSuccess('Accesso effettuato con successo!');
      navigate(redirectTo);
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    setTurnstileError(null);
    const toastId = showLoading('Registrazione in corso...');

    const isHuman = await verifyTurnstile();
    if (!isHuman) {
      dismissToast(toastId);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            referrer_code: referrerCode, // Passa il codice referral ai metadati di Supabase
          },
        },
      });

      dismissToast(toastId);

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess('Registrazione avvenuta con successo! Controlla la tua email per la conferma.');
      navigate('/registration-success'); // Reindirizza alla pagina di successo
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    setTurnstileError(null);
    const toastId = showLoading('Invio email di reset password...');

    const isHuman = await verifyTurnstile();
    if (!isHuman) {
      dismissToast(toastId);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/change-password`,
      });

      dismissToast(toastId);

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess('Email per il reset della password inviata! Controlla la tua casella di posta.');
      setIsResettingPassword(false); // Torna al form di login
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-white to-sky-100 p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">Benvenuto su IncontriDolci</CardTitle>
          <CardDescription className="text-gray-600">
            Accedi o registrati per trovare il tuo incontro ideale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {isResettingPassword ? (
                <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4 pt-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">Reset Password</h3>
                  <p className="text-sm text-gray-600">Inserisci la tua email per ricevere un link di reset.</p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="La tua email"
                      {...resetPasswordForm.register('email')}
                      disabled={isLoading}
                    />
                    {resetPasswordForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{resetPasswordForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  {!import.meta.env.DEV && ( // Conditionally render Turnstile
                    <div className="flex justify-center py-2">
                      <Turnstile 
                        siteKey="0x4AAAAAABzon3GSbPvU02qY"
                        onSuccess={setTurnstileToken}
                        options={{
                          theme: 'light',
                        }}
                      />
                    </div>
                  )}
                  {turnstileError && (
                    <div className="flex items-center text-red-500 text-sm mt-2">
                      <AlertCircle className="h-4 w-4 mr-1" /> {turnstileError}
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    {isLoading ? 'Invio in corso...' : 'Invia Link Reset'}
                  </Button>
                  <Button variant="link" onClick={() => setIsResettingPassword(false)} className="w-full text-rose-500">
                    Torna al Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="La tua email"
                      {...loginForm.register('email')}
                      disabled={isLoading}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="La tua password"
                      {...loginForm.register('password')}
                      disabled={isLoading}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  {!import.meta.env.DEV && ( // Conditionally render Turnstile
                    <div className="flex justify-center py-2">
                      <Turnstile 
                        siteKey="0x4AAAAAABzon3GSbPvU02qY"
                        onSuccess={setTurnstileToken}
                        options={{
                          theme: 'light',
                        }}
                      />
                    </div>
                  )}
                  {turnstileError && (
                    <div className="flex items-center text-red-500 text-sm mt-2">
                      <AlertCircle className="h-4 w-4 mr-1" /> {turnstileError}
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                    {isLoading ? 'Accesso in corso...' : 'Accedi'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => setIsResettingPassword(true)} 
                    className="p-0 h-auto w-full text-sm text-rose-500 hover:text-rose-600"
                  >
                    Hai dimenticato la password?
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(handleSignUp)} className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="La tua email"
                    {...registerForm.register('email')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Crea una password"
                    {...registerForm.register('password')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                  <PasswordValidator password={registerForm.watch('password')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Conferma Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Conferma la password"
                    {...registerForm.register('confirmPassword')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                {!import.meta.env.DEV && ( // Conditionally render Turnstile
                    <div className="flex justify-center py-2">
                      <Turnstile 
                        siteKey="0x4AAAAAABzon3GSbPvU02qY"
                        onSuccess={setTurnstileToken}
                        options={{
                          theme: 'light',
                        }}
                      />
                    </div>
                  )}
                {turnstileError && (
                  <div className="flex items-center text-red-500 text-sm mt-2">
                    <AlertCircle className="h-4 w-4 mr-1" /> {turnstileError}
                  </div>
                )}
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;