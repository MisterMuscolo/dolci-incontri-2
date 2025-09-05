import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'; // Importato FormDescription
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { italianProvinces } from '@/data/provinces';
import { ImageUploader } from '@/components/ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import { Checkbox } from '@/components/ui/checkbox'; // Importato Checkbox

const listingSchema = z.object({
  category: z.string({ required_error: 'La categoria è obbligatoria.' }),
  city: z.string({ required_error: 'La città è obbligatoria.' }),
  zone: z.string().optional(),
  age: z.string()
    .min(1, "L'età è obbligatoria.")
    .refine((val) => !isNaN(parseInt(val, 10)), { message: "L'età deve essere un numero." })
    .refine((val) => parseInt(val, 10) >= 18, { message: "Devi avere almeno 18 anni." }),
  title: z.string().min(5, 'Il titolo deve avere almeno 5 caratteri.').max(100, 'Il titolo non può superare i 100 caratteri.'),
  description: z.string().min(20, 'La descrizione deve avere almeno 20 caratteri.'),
  email: z.string().email("L'email non è valida.").optional(), // Reso opzionale qui, la validazione condizionale è nel refine
  phone: z.string().optional(),
  contact_preference: z.enum(['email', 'phone', 'both'], { required_error: 'La preferenza di contatto è obbligatoria.' }),
  contact_whatsapp: z.boolean().optional().default(false), // Nuovo campo per WhatsApp
}).superRefine((data, ctx) => {
  if (data.contact_preference === 'email' || data.contact_preference === 'both') {
    if (!data.email || data.email.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'email è obbligatoria per la preferenza di contatto selezionata.",
        path: ['email'],
      });
    }
  }
  if (data.contact_preference === 'phone' || data.contact_preference === 'both') {
    if (!data.phone || data.phone.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il numero di telefono è obbligatorio per la preferenza di contatto selezionata.",
        path: ['phone'],
      });
    }
  }
});

const NewListing = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Stato per l'ID utente

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      zone: '',
      email: '',
      phone: '',
      contact_preference: 'both', // Default to 'both'
      contact_whatsapp: false, // Default for WhatsApp
    }
  });

  const contactPreference = form.watch('contact_preference');
  const phoneValue = form.watch('phone'); // Watch phone value to enable/disable WhatsApp checkbox

  useEffect(() => {
    const fetchUserEmailAndId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        form.setValue('email', user.email);
        setCurrentUserId(user.id); // Imposta l'ID utente
      }
    };
    fetchUserEmailAndId();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    setIsLoading(true);
    const toastId = showLoading('Pubblicazione annuncio in corso...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Devi essere autenticato per creare un annuncio.');

      const { age, ...restOfValues } = values;
      const submissionData = {
        ...restOfValues,
        age: parseInt(age, 10),
        user_id: user.id,
        last_bumped_at: new Date().toISOString(), // Aggiunto per far apparire i nuovi annunci in cima
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        contact_whatsapp: values.contact_whatsapp, // Salva la preferenza WhatsApp
      };

      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .insert(submissionData)
        .select('id')
        .single();

      if (listingError || !listingData) {
        throw new Error(listingError?.message || 'Errore nella creazione dell\'annuncio.');
      }

      const listingId = listingData.id;

      if (files.length > 0) {
        const uploadPromises = files.map(async (file, index) => {
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${user.id}/${listingId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('listing_photos')
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(`Errore nel caricamento della foto ${index + 1}: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(filePath);
          
          return {
            listing_id: listingId,
            url: publicUrl,
            is_primary: index === primaryIndex,
          };
        });

        const photoPayloads = await Promise.all(uploadPromises);

        const { error: photosError } = await supabase.from('listing_photos').insert(photoPayloads);

        if (photosError) {
          await supabase.from('listings').delete().eq('id', listingId);
          throw new Error(photosError.message || 'Errore nel salvataggio delle foto.');
        }
      }

      dismissToast(toastId);
      showSuccess('Annuncio pubblicato con successo!');
      navigate(`/listing-post-creation/${listingId}`); // Reindirizza alla nuova pagina
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Crea un nuovo annuncio</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Dettagli annuncio</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <p className="text-sm text-gray-500 -mb-4">I campi contrassegnati con * sono obbligatori.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleziona una categoria" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="donna-cerca-uomo">👩‍❤️‍👨 Donna cerca Uomo</SelectItem>
                            <SelectItem value="uomo-cerca-donna">👨‍❤️‍👩 Uomo cerca Donna</SelectItem>
                            <SelectItem value="coppie">👩‍❤️‍💋‍👨 Coppie</SelectItem>
                            <SelectItem value="uomo-cerca-uomo">👨‍❤️‍👨 Uomo cerca Uomo</SelectItem>
                            <SelectItem value="donna-cerca-donna">👩‍❤️‍👩 Donna cerca Donna</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Città *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleziona una città" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {italianProvinces.map((p) => <SelectItem key={p.value} value={p.label}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona (Opzionale)</FormLabel>
                        <FormControl><Input placeholder="Es. Centro Storico" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Età *</FormLabel>
                        <FormControl><Input type="number" placeholder="La tua età" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo *</FormLabel>
                      <FormControl><Input placeholder="Es. Incontro speciale a Roma" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione *</FormLabel>
                        <FormControl><Textarea placeholder="Descrivi cosa cerchi..." className="min-h-[120px]" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                <FormField
                  control={form.control}
                  name="contact_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Come vuoi essere contattato? *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleziona preferenza di contatto" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Solo Email</SelectItem>
                          <SelectItem value="phone">Solo Telefono</SelectItem>
                          <SelectItem value="both">Email e Telefono</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email {contactPreference === 'email' || contactPreference === 'both' ? '*' : '(Opzionale)'}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            readOnly // Email is always read-only
                            className={cn(
                              "bg-gray-100 cursor-not-allowed",
                              (contactPreference === 'phone') && "opacity-50" // Visually dim if not preferred
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono {contactPreference === 'phone' || contactPreference === 'both' ? '*' : '(Opzionale)'}</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="Il tuo numero di telefono" 
                            {...field} 
                            readOnly={contactPreference === 'email'} // Readonly if only email is preferred
                            className={cn(
                              (contactPreference === 'email') && "bg-gray-100 cursor-not-allowed opacity-50"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(contactPreference === 'phone' || contactPreference === 'both') && phoneValue && (
                  <FormField
                    control={form.control}
                    name="contact_whatsapp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!phoneValue || isLoading} // Disabilita se il telefono non è inserito
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Contatto WhatsApp</FormLabel>
                          <FormDescription>
                            Se selezionato, il pulsante del telefono avvierà una chat WhatsApp.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <div>
                  <FormLabel>Fotografie</FormLabel>
                  <p className="text-sm text-gray-500 mb-2">Carica fino a 5 foto per il tuo annuncio. Se l'annuncio non è Premium, verrà mostrata solo la prima foto.</p>
                  <ImageUploader
                    listingId={undefined} // Non disponibile per un nuovo annuncio
                    userId={currentUserId ?? undefined} // Passa l'ID utente se disponibile
                    initialPhotos={[]} // Nessuna foto iniziale per un nuovo annuncio
                    isPremiumOrPending={true} // Permetti 5 foto fin da subito
                    onFilesChange={setFiles}
                    onPrimaryIndexChange={setPrimaryIndex}
                    onExistingPhotosUpdated={() => {}} // Non fa nulla per un nuovo annuncio
                    hideMainPreview={false} // Mostra l'anteprima principale
                  />
                </div>
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
                  {isLoading ? 'Pubblicazione in corso...' : 'Pubblica Annuncio'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewListing;