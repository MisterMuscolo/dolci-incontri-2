import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Mail, LogIn, UserPlus, Loader2 } from 'lucide-react'; // Aggiunto Loader2
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link

const reportSchema = z.object({
  reportMessage: z.string().min(20, 'Il messaggio di segnalazione deve contenere almeno 20 caratteri.'),
});

interface ReportListingDialogProps {
  listingId: string;
  listingTitle: string;
  buttonSize?: "default" | "sm" | "lg" | "icon" | null | undefined;
}

export const ReportListingDialog = ({ listingId, listingTitle, buttonSize = "default" }: ReportListingDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Stato per l'autenticazione
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Stato per il caricamento dello stato di autenticazione
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportMessage: '',
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoadingAuth(false);
    };
    checkAuth();

    // Ascolta i cambiamenti dello stato di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: z.infer<typeof reportSchema>) => {
    if (!isAuthenticated) {
      showError('Devi essere autenticato per segnalare un annuncio.');
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading('Invio segnalazione in corso...');

    try {
      const { error } = await supabase.functions.invoke('create-ticket', {
        body: {
          listingId: listingId,
          subject: `Segnalazione annuncio: ${listingTitle}`,
          messageContent: values.reportMessage,
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Impossibile inviare la segnalazione. Riprova più tardi.';
        // @ts-ignore
        if (error.context && typeof error.context.body === 'string') {
          try {
            // @ts-ignore
            const errorBody = JSON.parse(error.context.body);
            if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            console.error("Could not parse error response from edge function:", e);
          }
        }
        throw new Error(errorMessage);
      }

      showSuccess('Segnalazione inviata con successo! Puoi visualizzare lo stato nella sezione "I miei ticket".');
      form.reset();
      setIsOpen(false); // Chiudi il dialog dopo l'invio
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={buttonSize}
          className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
          disabled={isLoadingAuth} // Disabilita il pulsante mentre controlla lo stato di autenticazione
        >
          <Flag className="h-5 w-5" /> Segnala Annuncio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-red-500" /> Segnala Annuncio</DialogTitle>
          <DialogDescription>
            Segnala l'annuncio "{listingTitle}" se ritieni che violi le nostre linee guida.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingAuth ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-4" />
            <p className="text-gray-600">Verifica stato autenticazione...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-4 space-y-6">
            <Mail className="mx-auto h-20 w-20 text-rose-500" />
            <h2 className="text-2xl font-bold text-gray-800">Accedi o Registrati</h2>
            <p className="text-lg text-gray-600">
              Per inviare una segnalazione, devi prima accedere al tuo account o registrarti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={`/auth?tab=login&redirect=/listing/${listingId}`}>
                <Button className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600">
                  <LogIn className="h-5 w-5 mr-2" /> Accedi
                </Button>
              </Link>
              <Link to={`/auth?tab=register&redirect=/listing/${listingId}`}>
                <Button variant="outline" className="w-full sm:w-auto border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                  <UserPlus className="h-5 w-5 mr-2" /> Registrati
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="reportMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo della segnalazione</FormLabel>
                    <FormControl><Textarea placeholder="Descrivi il motivo della segnalazione..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={isSubmitting}>
                {isSubmitting ? 'Invio in corso...' : 'Invia Segnalazione'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};