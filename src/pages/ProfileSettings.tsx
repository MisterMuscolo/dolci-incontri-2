import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { User, AlertTriangle, ChevronLeft } from 'lucide-react';

const ProfileSettings = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      } else {
        navigate('/auth');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    const toastId = showLoading('Eliminazione account in corso...');

    try {
      const { error } = await supabase.functions.invoke('delete-user');

      if (error) {
        throw new Error(error.message);
      }

      await supabase.auth.signOut();
      dismissToast(toastId);
      showSuccess('Il tuo account è stato eliminato con successo.');
      navigate('/');

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Impossibile eliminare l\'account.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userEmail) {
    return <div className="flex justify-center items-center min-h-screen">Caricamento...</div>;
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Impostazioni Profilo</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Account</CardTitle>
            <CardDescription>Queste sono le tue informazioni di base.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 p-3 rounded-full">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg font-semibold text-gray-800">{userEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Zona Pericolosa</CardTitle>
            </div>
            <CardDescription>
              L'azione seguente non può essere annullata. Procedi con cautela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Elimina il tuo account</p>
                <p className="text-sm text-gray-600">
                  Tutti i tuoi dati, inclusi gli annunci, verranno eliminati definitivamente.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading}>
                    Elimina Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione non può essere annullata. Questo eliminerà permanentemente
                      il tuo account e rimuoverà i tuoi dati dai nostri server.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Eliminazione...' : 'Sì, elimina account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;