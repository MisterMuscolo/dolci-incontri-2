import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { italianProvinces } from '@/data/provinces';
import { ImageUploader, NewFilePair } from '@/components/ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { ChevronLeft } from 'lucide-react';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';

const listingSchema = z.object({
  category: z.string({ required_error: 'La categoria è obbligatoria.' }),
  city: z.string({ required_error: 'La città è obbligatoria.' }),
  zone: z.string().optional(),
  age: z.string()
    .min(1, "L'età è obbligatoria.")
    .refine((val) => !isNaN(parseInt(val, 10)), { message: "L'età deve essere un numero." })
    .refine((val) => parseInt(val, 10) >= 18, { message: "Devi avere almeno 18 anni." }),
  title: z.string().min(15, 'Il titolo deve avere almeno 15 caratteri e includere dettagli importanti.'),
  description: z.string().min(50, 'La descrizione deve avere almeno 50 caratteri e includere dettagli rilevanti.'),
  email: z.string().email("L'email non è valida.").optional(),
  phone: z.string().optional(),
  contact_preference: z.enum(['email', 'phone', 'both'], { required_error: 'La preferenza di contatto è obbligatoria.' }),
  contact_whatsapp: z.boolean().optional().default(false),
});

const NewListing = () => {
  const navigate = useNavigate();
  const [filesToUpload, setFilesToUpload] = useState<NewFilePair[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink();

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      zone: '',
      email: '',
      phone: '',
      contact_preference: 'both',
      contact_whatsapp: false,
    }
  });

  const contactPreference = form.watch('contact_preference');
  const phoneValue = form.watch('phone');

  useEffect(() => {
    const fetchUserEmailAndId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        form.setValue('email', user.email);
        setCurrentUserId(user.id);
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

      const { age, phone, ...restOfValues } = values;
      const formattedPhone = formatPhoneNumber(phone);

      const { data: newListing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          category: restOfValues.category,
          city: restOfValues.city,
          zone: restOfValues.zone,
          age: parseInt(age, 10),
          title: restOfValues.title,
          description: restOfValues.description,
          email: restOfValues.email?.trim() || null,
          phone: formattedPhone,
          contact_preference: restOfValues.contact_preference,
          contact_whatsapp: restOfValues.contact_whatsapp,
          last_bumped_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (listingError || !newListing) {
        throw new Error(listingError?.message || 'Errore nella creazione dell\'annuncio.');
      }

      const listingId = newListing.id;

      if (filesToUpload.length > 0) {
        const photoUploadPromises = filesToUpload.map(async (filePair, index) => {
          // Upload original file
          const originalFileExtension = filePair.original.name.split('.').pop();
          const originalFileName = `${crypto.randomUUID()}.${originalFileExtension}`;
          const originalFilePath = `${user.id}/${listingId}/original_${originalFileName}`;
          
          const { error: originalUploadError } = await supabase.storage
            .from('listing_photos')
            .upload(originalFilePath, filePair.original);

          if (originalUploadError) {
            throw new Error(`Errore nel caricamento della foto originale ${index + 1}: ${originalUploadError.message}`);
          }
          const { data: { publicUrl: originalPublicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(originalFilePath);

          // Upload cropped file
          const croppedFileExtension = filePair.cropped.name.split('.').pop();
          const croppedFileName = `${crypto.randomUUID()}.${croppedFileExtension}`;
          const croppedFilePath = `${user.id}/${listingId}/cropped_${croppedFileName}`;
          
          const { error: croppedUploadError } = await supabase.storage
            .from('listing_photos')
            .upload(croppedFilePath, filePair.cropped);

          if (croppedUploadError) {
            throw new Error(`Errore nel caricamento della foto ritagliata ${index + 1}: ${croppedUploadError.message}`);
          }
          const { data: { publicUrl: croppedPublicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(croppedFilePath);
          
          return {
            listing_id: listingId,
            url: croppedPublicUrl,
            original_url: originalPublicUrl,
            is_primary: index === primaryIndex,
          };
        });

        const photoPayloads = await Promise.all(photoUploadPromises);

        const { error: photosError } = await supabase.from('listing_photos').insert(photoPayloads);

        if (photosError) {
          await supabase.from('listings').delete().eq('id', listingId);
          throw new Error(photosError.message || 'Errore nel salvataggio delle foto.');
        }
      }

      dismissToast(toastId);
      showSuccess('Annuncio pubblicato con successo!');
      navigate(`/promote-listing/${listingId}`);
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
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
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
                        <FormControl><Input placeholder="Es. Centro, Parioli, Fuorigrotta" {...field} /></FormControl>
                        <FormDescription>Aggiungi una zona specifica per aiutare gli altri utenti a trovarti più facilmente.</FormDescription>
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
                      <FormControl><Input placeholder="Es. Donna affascinante cerca uomo a Milano per serate speciali" {...field} /></FormControl>
                      <FormDescription>Un titolo chiaro e dettagliato attira più attenzione. Includi la tua città e cosa cerchi.</FormDescription>
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
                        <FormControl><Textarea placeholder="Descrivi dettagliatamente cosa cerchi, i tuoi interessi e la tua personalità. Più dettagli fornisci, più facile sarà trovare la persona giusta." className="min-h-[120px]" {...field} /></FormControl>
                        <FormDescription>Una descrizione completa e sincera aiuta a trovare la persona giusta e rende il tuo annuncio più interessante.</FormDescription>
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
                            readOnly
                            className={cn(
                              "bg-gray-100 cursor-not-allowed",
                              (contactPreference === 'phone') && "opacity-50"
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
                            readOnly={contactPreference === 'email'}
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
                            disabled={!phoneValue || isLoading}
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
                    listingId={undefined}
                    userId={currentUserId ?? undefined}
                    initialPhotos={[]}
                    isPremiumOrPending={true}
                    onFilesChange={setFilesToUpload}
                    onPrimaryIndexChange={setPrimaryIndex}
                    onExistingPhotosUpdated={() => {}}
                    hideMainPreview={false}
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