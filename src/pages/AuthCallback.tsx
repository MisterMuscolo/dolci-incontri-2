import { useEffect } from 'react';
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
        // Fetch user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error("AuthCallback: Error fetching profile role:", profileError);
          showError("Errore nel recupero del ruolo utente.");
          navigate('/auth?tab=login'); // Fallback to login if role can't be fetched
          return;
        }

        const userRole = profile.role;
        const originalRedirectTo = searchParams.get('redirect');

        if (userRole === 'admin' || userRole === 'supporto') {
          navigate('/admin');
        } else if (userRole === 'banned') {
          navigate('/banned');
        } else if (originalRedirectTo) {
          navigate(originalRedirectTo);
        } else {
          navigate('/dashboard');
        }
      } else {
        console.warn("AuthCallback: No session found after callback. Redirecting to login.");
        navigate('/auth?tab=login');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return <LoadingScreen />;
};

export default AuthCallback;