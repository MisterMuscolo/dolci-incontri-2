import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';

const newTicketSchema = z.object({
  subject: z.string().min(10, 'L\'oggetto deve contenere almeno 10 caratteri.').max(100, 'L\'oggetto non può superare i 100 caratteri.'),
  messageContent: z.string().min(20, 'Il messaggio deve contenere almeno 20 caratteri.'),
});

const Contatti = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof newTicketSchema>>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: {
      subject: '',
      messageContent: '',
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Devi essere autenticato per aprire un ticket.');
        navigate('/auth?tab=login');
      }
    };
    checkAuth();
  }, [navigate]);

  const onSubmit = async (values: z.infer<typeof newTicketSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading('Invio ticket in corso...');

    try {
      const { error } = await supabase.functions.invoke('create-ticket', {
        body: {
          subject: values.subject,
          messageContent: values.messageContent,
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Impossibile inviare il ticket. Riprova più tardi.';
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

      showSuccess('Ticket aperto con successo! Puoi visualizzare lo stato nella sezione "I miei ticket".');
      form.reset();
      navigate('/my-tickets'); // Reindirizza alla lista dei ticket
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Apri un nuovo Ticket</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Mail className="h-6 w-6 text-rose-500" />
              Contattaci
            </CardTitle>
            <CardDescription>
              Compila il modulo sottostante per inviare una richiesta di supporto o una domanda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormControl><Textarea placeholder="Descrivi dettagliatamente la tua richiesta..." className="min-h-[120px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" /> {isSubmitting ? 'Invio in corso...' : 'Invia Ticket'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contatti;