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
import { Mail, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';

const replySchema = z.object({
  senderEmail: z.string().email("L'email non è valida.").min(1, "L'email è obbligatoria."),
  messageContent: z.string().min(20, 'Il messaggio deve contenere almeno 20 caratteri.'),
});

interface ReplyToListingDialogProps {
  triggerButton: React.ReactNode;
  listingId: string;
  listingTitle: string;
}

export const ReplyToListingDialog = ({
  triggerButton,
  listingId,
  listingTitle,
}: ReplyToListingDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      senderEmail: '',
      messageContent: '',
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        form.setValue('senderEmail', user.email); // Pre-fill email if authenticated
      }
      setIsLoadingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        form.setValue('senderEmail', session.user.email);
      } else {
        form.setValue('senderEmail', ''); // Clear email if logged out
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof replySchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading('Invio messaggio...');

    try {
      const { error } = await supabase.functions.invoke('send-listing-reply-email', {
        body: {
          listingId: listingId,
          senderEmail: values.senderEmail,
          messageContent: values.messageContent,
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Impossibile inviare il messaggio. Riprova più tardi.';
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

      showSuccess('Messaggio inviato con successo all\'autore dell\'annuncio!');
      form.reset();
      setIsOpen(false);
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
            <Mail className="h-5 w-5 text-rose-500" /> Contatta l'autore dell'annuncio
          </DialogTitle>
          <DialogDescription>
            Invia un messaggio privato all'autore dell'annuncio "{listingTitle}".
            La tua email sarà visibile all'autore per la risposta.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingAuth ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-4" />
            <p className="text-gray-600">Caricamento...</p>
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
                    <FormControl><Textarea placeholder="Scrivi qui il tuo messaggio..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" /> {isSubmitting ? 'Invio in corso...' : 'Invia Messaggio'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};