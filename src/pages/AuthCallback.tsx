import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { showError } from '@/utils/toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("AuthCallback: Error getting session:", error);
        showError("Errore durante l'autenticazione. Riprova.");
        navigate('/auth?tab=login'); // Reindirizza alla pagina di login in caso di errore
        return;
      }

      if (session) {
        // Se c'è una sessione, l'utente è autenticato.
        // Controlla se c'è un parametro 'redirect' nell'URL per sapere dove andare.
        const redirectTo = searchParams.get('redirect');
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          // Reindirizzamento predefinito se non specificato (es. dashboard)
          navigate('/dashboard'); 
        }
      } else {
        // Nessuna sessione, potrebbe essere un errore o un link non valido
        console.warn("AuthCallback: No session found after callback. Redirecting to login.");
        navigate('/auth?tab=login');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return <LoadingScreen />;
};

export default AuthCallback;