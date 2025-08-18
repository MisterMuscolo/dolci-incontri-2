import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login' || tab === 'register') {
      setActiveTab(tab);
    } else {
      setActiveTab('login');
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      showError('Credenziali non valide');
    } else {
      showSuccess('Accesso effettuato!');
      window.location.href = '/dashboard';
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Registrazione completata! Verifica la tua email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-white to-sky-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Accedi</TabsTrigger>
            <TabsTrigger value="register">Registrati</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <div className="space-y-4 pt-6">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button 
                className="w-full bg-rose-500 hover:bg-rose-600" 
                onClick={handleLogin}
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
            </div>
          </TabsContent>
          
          <TabsContent value="register">
            <div className="space-y-4 pt-6">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button 
                className="w-full bg-rose-500 hover:bg-rose-600" 
                onClick={handleSignUp}
                disabled={loading}
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}