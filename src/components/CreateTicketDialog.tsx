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
  senderEmail: z.string().email("L'email non è valida.").min(1, "L'email è obbligatoria."),
  messageContent: z.string().min(20, 'Il messaggio deve contenere almeno 20 caratteri.'),
});

interface CreateTicketDialogProps {
  triggerButton: React.ReactNode; // The button that opens the dialog
  dialogTitle: string;
  dialogDescription: string;
  initialSubject?: string; // This will be used by the edge function to generate the subject
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
      senderEmail: '',
      messageContent: initialMessage,
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user?.email) {
        form.setValue('senderEmail', user.email); // Pre-fill email if authenticated
      }
      setIsLoadingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user?.email) {
        form.setValue('senderEmail', session.user.email);
      } else {
        form.setValue('senderEmail', ''); // Clear email if logged out
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    // Reset message content when dialog opens or initialMessage changes
    form.setValue('messageContent', initialMessage);
  }, [initialMessage, form]);

  const onSubmit = async (values: z.infer<typeof ticketSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading('Invio richiesta in corso...');

    try {
      const { error } = await supabase.functions.invoke('create-ticket', {
        body: {
          listingId: listingId || null,
          senderEmail: values.senderEmail,
          messageContent: values.messageContent,
          initialSubject: initialSubject, // Pass initialSubject for backend to generate full subject
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
      } else if (isAuthenticated) { // Only redirect if authenticated, otherwise stay on current page
        navigate('/my-tickets');
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
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="senderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>La tua Email *</FormLabel>
                    <FormControl><Input type="email" placeholder="La tua email per essere ricontattato" {...field} /></FormControl>
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