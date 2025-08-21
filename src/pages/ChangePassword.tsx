import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { PasswordValidator, isPasswordValid } from '@/components/PasswordValidator';
import { ChevronLeft, KeyRound } from 'lucide-react';

const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, "La vecchia password è obbligatoria."),
  newPassword: z.string()
    .min(8, "La nuova password deve avere almeno 8 caratteri.")
    .refine(isPasswordValid, {
      message: "La nuova password non rispetta i requisiti di sicurezza.",
    }),
  confirmNewPassword: z.string().min(1, "Conferma la nuova password."),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Le nuove password non corrispondono.",
  path: ["confirmNewPassword"],
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: "La nuova password non può essere uguale alla vecchia.",
  path: ["newPassword"],
});

const ChangePassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordChangeSchema>) => {
    setIsLoading(true);
    const toastId = showLoading('Aggiornamento password in corso...');

    try {
      // First, re-authenticate the user with their old password
      // This is a security measure to ensure the user is who they say they are
      const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !currentUser) {
        throw new Error('Utente non autenticato. Effettua nuovamente il login.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email!, // Assuming email is always present for authenticated users
        password: values.oldPassword,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('La vecchia password non è corretta.');
        }
        throw new Error(signInError.message);
      }

      // If re-authentication is successful, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      dismissToast(toastId);
      showSuccess('Password aggiornata con successo!');
      form.reset(); // Clear the form
      navigate('/profile-settings'); // Navigate back to profile settings
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Cambia Password</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <KeyRound className="h-6 w-6 text-rose-500" />
              Aggiorna la tua password
            </CardTitle>
            <CardDescription>
              Inserisci la tua vecchia password e la nuova password per aggiornare le credenziali del tuo account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vecchia Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Inserisci la tua vecchia password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuova Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Inserisci la nuova password" {...field} /></FormControl>
                      <FormMessage />
                      <PasswordValidator password={field.value} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conferma Nuova Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Conferma la nuova password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
                  {isLoading ? 'Aggiornamento in corso...' : 'Aggiorna Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;