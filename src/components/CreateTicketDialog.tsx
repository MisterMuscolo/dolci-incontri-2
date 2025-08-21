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
import { Flag, Mail, LogIn, UserPlus, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';

const ticketSchema = z.object({
  subject: z.string().min(10, 'L\'oggetto deve contenere almeno 10 caratteri.').max(100, 'L\'oggetto non può superare i 100 caratteri.'),
  messageContent: z.string().min(20, 'Il messaggio deve contenere almeno 20 caratteri.'),
});

interface CreateTicketDialogProps {
  triggerButton: React.ReactNode; // The button that opens the dialog
  dialogTitle: string;
  dialogDescription: string;
  initialSubject?: string;
  initialMessage?: string;
  listingId?: string; // Optional for listing reports
  icon: React.ElementType; // Icon for the dialog title
  redirectPathOnAuth?: string; // Path to redirect to after login/register if coming from this dialog
  onTicketCreated?: () => void; // Callback after successful ticket creation
}

export const CreateTicketDialog = ({
  triggerButton,
  dialogTitle,
  dialogDescription,
  initialSubject = '',
  initialMessage = '',
  listingId,
  icon: Icon,
  redirectPathOnAuth,
  onTicketCreated,
}: CreateTicketDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: initialSubject,
      messageContent: initialMessage,
    },
  });

  useEffect(() => {
    form.reset({
      subject: initialSubject,
      messageContent: initialMessage,
    });
  }, [initialSubject, initialMessage, form]);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoadingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: z.infer<typeof ticketSchema>) => {
    if (!isAuthenticated) {
      showError('Devi essere autenticato per inviare una richiesta.');
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading('Invio richiesta in corso...');

    try {
      const { error } = await supabase.functions.invoke('create-ticket', {
        body: {
          listingId: listingId || null,
          subject: values.subject,
          messageContent: values.messageContent,
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Impossibile inviare la richiesta. Riprova più tardi.';
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

      showSuccess('Richiesta inviata con successo! Puoi visualizzare lo stato nella sezione "I miei ticket".');
      form.reset();
      setIsOpen(false);
      if (onTicketCreated) {
        onTicketCreated();
      } else {
        navigate('/my-tickets'); // Default redirect after ticket creation
      }
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
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-rose-500" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
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
              Per inviare una richiesta, devi prima accedere al tuo account o registrarti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={`/auth?tab=login${redirectPathOnAuth ? `&redirect=${encodeURIComponent(redirectPathOnAuth)}` : ''}`}>
                <Button className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600">
                  <LogIn className="h-5 w-5 mr-2" /> Accedi
                </Button>
              </Link>
              <Link to={`/auth?tab=register${redirectPathOnAuth ? `&redirect=${encodeURIComponent(redirectPathOnAuth)}` : ''}`}>
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
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oggetto *</FormLabel>
                    <FormControl><Input placeholder="Es. Problema con il login, Segnalazione annuncio" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="messageContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Messaggio *</FormLabel>
                    <FormControl><Textarea placeholder="Descrivi dettagliatamente la tua richiesta..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                <Mail className="h-4 w-4 mr-2" /> {isSubmitting ? 'Invio in corso...' : 'Invia Messaggio'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};