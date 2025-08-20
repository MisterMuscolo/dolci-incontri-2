import { Button } from "@/components/ui/button";
import { ChevronLeft, Mail, User, MessageSquare, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { useEffect, useState } from "react";

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Inserisci un indirizzo email valido."),
  subject: z.string().optional(),
  message: z.string().min(20, "Il messaggio deve contenere almeno 20 caratteri."),
});

const Contatti = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        form.setValue('email', user.email);
      }
    };
    fetchUserEmail();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading('Invio messaggio in corso...');

    try {
      const { error } = await supabase.functions.invoke('submit-contact-form', {
        body: values,
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

      showSuccess('Messaggio inviato con successo! Ti risponderemo il prima possibile.');
      form.reset({ name: '', email: form.getValues('email'), subject: '', message: '' }); // Keep email if pre-filled
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen flex flex-col items-center">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Contatti</h1>
        </div>

        <Card className="bg-white p-6 rounded-lg shadow-md space-y-4 text-gray-700">
          <CardHeader className="text-center">
            <Mail className="mx-auto h-16 w-16 text-rose-500 mb-4" />
            <CardTitle className="text-2xl font-semibold">Hai bisogno di aiuto?</CardTitle>
            <CardDescription className="text-lg">
              Compila il modulo sottostante per inviarci un messaggio. Il nostro team di assistenza ti risponderà il prima possibile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Il tuo Nome (Opzionale)</FormLabel>
                      <FormControl><Input placeholder="Mario Rossi" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>La tua Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="iltuoindirizzo@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oggetto (Opzionale)</FormLabel>
                      <FormControl><Input placeholder="Richiesta di supporto, Segnalazione, ecc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Messaggio *</FormLabel>
                      <FormControl><Textarea placeholder="Scrivi qui il tuo messaggio..." className="min-h-[120px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                  {isSubmitting ? 'Invio in corso...' : <><Send className="h-5 w-5 mr-2" /> Invia Messaggio</>}
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