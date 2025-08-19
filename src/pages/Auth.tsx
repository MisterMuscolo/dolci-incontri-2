import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Importa useNavigate
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { PasswordValidator, isPasswordValid } from '@/components/PasswordValidator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react'; // Importa le icone dell'occhio

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate(); // Inizializza useNavigate
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nuovo stato per la visibilità della password

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login' || tab === 'register') {
      setActiveTab(tab);
    } else {
      setActiveTab('login');
    }
    setIsResettingPassword(false);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
    setIsResettingPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      showError('Credenziali non valide');
    } else {
      showSuccess('Accesso effettuato!');
      navigate('/dashboard'); // Reindirizza alla dashboard dopo il login
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      showError('La password non rispetta i requisiti.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Registrazione completata! Verifica la tua email.');
      navigate('/registration-success'); // Reindirizza alla pagina di successo
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showError('Inserisci il tuo indirizzo email.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Controlla la tua email per il link di recupero.');
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-rose-100 via-white to-sky-100 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Accedi</TabsTrigger>
            <TabsTrigger value="register">Registrati</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            {isResettingPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4 pt-6">
                <h3 className="text-center font-semibold text-gray-700">Recupera la tua password</h3>
                <p className="text-center text-sm text-gray-600">
                  Inserisci la tua email e ti invieremo un link per reimpostare la password.
                </p>
                <div>
                  <Label htmlFor="email-reset">Email</Label>
                  <Input
                    id="email-reset"
                    type="email"
                    placeholder="mario.rossi@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600" 
                  disabled={loading}
                >
                  {loading ? 'Invio in corso...' : 'Invia link di recupero'}
                </Button>
                <p className="text-center text-sm text-gray-600 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResettingPassword(false)}
                    className="font-semibold text-rose-500 hover:text-rose-600 focus:outline-none"
                  >
                    Torna al login
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 pt-6">
                <p className="text-center text-gray-600">Accedi al tuo account per continuare.</p>
                <div>
                  <Label htmlFor="email-login">Email</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="mario.rossi@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"> {/* Modificato qui */}
                    <Label htmlFor="password-login">Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsResettingPassword(true)}
                      className="text-sm font-semibold text-rose-500 hover:text-rose-600 focus:outline-none"
                    >
                      Hai dimenticato la password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password-login"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
                    <Label htmlFor="remember-me">Rimani connesso</Label>
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600" 
                  disabled={loading}
                >
                  {loading ? 'Caricamento...' : 'Accedi'}
                </Button>
                <p className="text-center text-sm text-gray-600 pt-2">
                  Non hai un account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('register')}
                    className="font-semibold text-rose-500 hover:text-rose-600 focus:outline-none"
                  >
                    Registrati
                  </button>
                </p>
              </form>
            )}
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignUp} className="space-y-4 pt-6">
              <p className="text-center text-gray-600">Crea un nuovo account per iniziare la tua avventura.</p>
              <div>
                <Label htmlFor="email-register">Email</Label>
                <Input
                  id="email-register"
                  type="email"
                  placeholder="mario.rossi@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password-register">Password</Label>
                <Input
                  id="password-register"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <PasswordValidator password={password} />
              <Button 
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600" 
                disabled={loading || !isPasswordValid(password)}
              >
                {loading ? 'Caricamento...' : 'Registrati'}
              </Button>
              <p className="text-center text-sm text-gray-600 pt-2">
                Hai già un account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="font-semibold text-rose-500 hover:text-rose-600 focus:outline-none"
                >
                  Accedi
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}