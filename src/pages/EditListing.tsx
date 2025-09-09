import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ChevronLeft, MapPin } from 'lucide-react';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
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
  // Rimosso i campi per la mappa
});

type ExistingPhoto = { id: string; url: string; original_url: string | null; is_primary: boolean };

type FullListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  zone: string | null;
  age: number;
  phone: string | null;
  email: string;
  user_id: string;
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  contact_preference: 'email' | 'phone' | 'both';
  contact_whatsapp: boolean | null;
  listing_photos: ExistingPhoto[];
  latitude: number | null; // Rimosso
  longitude: number | null; // Rimosso
  address_text: string | null; // Rimosso
};

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newFilesToUpload, setNewFilesToUpload] = useState<NewFilePair[]>([]);
  const [newPrimaryIndex, setNewPrimaryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentListing, setCurrentListing] = useState<FullListing | null>(null);
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink();

  // Rimosso lo stato per la checkbox della mappa

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      zone: '',
      email: '',
      phone: '',
      contact_preference: 'both',
      contact_whatsapp: false,
      // Rimosso i valori di default per la mappa
    }
  });

  const contactPreference = form.watch('contact_preference');
  const phoneValue = form.watch('phone');
  // Rimosso selectedCity e selectedZone

  // Rimosso generateFictitiousLocation

  const fetchListingData = useCallback(async () => {
    if (!id) {
      navigate('/dashboard');
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*, listing_photos(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching listing:', error);
      showError('Impossibile caricare i dettagli dell\'annuncio.');
      navigate('/dashboard');
      return;
    }

    const listing = data as FullListing;
    setCurrentListing(listing);

    form.reset({
      category: listing.category,
      city: listing.city,
      zone: listing.zone || '',
      age: String(listing.age),
      title: listing.title,
      description: listing.description,
      email: listing.email,
      phone: listing.phone || '',
      contact_preference: listing.contact_preference || 'both',
      contact_whatsapp: listing.contact_whatsapp || false,
      // Rimosso i campi per la mappa
    });

    // Rimosso il pre-check della checkbox della mappa

    setExistingPhotos(listing.listing_photos || []);
    setIsLoading(false);
  }, [id, navigate, form]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  // Rimosso useEffect per la logica della mappa

  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading('Aggiornamento annuncio in corso...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Devi essere autenticato per modificare un annuncio.');

      const formattedPhone = formatPhoneNumber(values.phone);

      const updateData = {
        title: values.title,
        description: values.description,
        email: values.email?.trim() || null,
        phone: formattedPhone,
        contact_preference: values.contact_preference,
        contact_whatsapp: values.contact_whatsapp,
        zone: values.zone,
        // Rimosso i campi per la mappa
      };

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError?.message || 'Errore nell\'aggiornamento dell\'annuncio.');
      }

      if (newFilesToUpload.length > 0) {
        const photoUploadPromises = newFilesToUpload.map(async (filePair, index) => {
          // Upload original file
          const originalFileExtension = filePair.original.name.split('.').pop();
          const originalFileName = `${crypto.randomUUID()}.${originalFileExtension}`;
          const originalFilePath = `${user.id}/${id}/original_${originalFileName}`;
          
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
          const croppedFilePath = `${user.id}/${id}/cropped_${croppedFileName}`;
          
          const { error: croppedUploadError } = await supabase.storage
            .from('listing_photos')
            .upload(croppedFilePath, filePair.cropped);

          if (croppedUploadError) {
            throw new Error(`Errore nel caricamento della foto ritagliata ${index + 1}: ${croppedUploadError.message}`);
          }
          const { data: { publicUrl: croppedPublicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(croppedFilePath);
          
          return {
            listing_id: id,
            url: croppedPublicUrl,
            original_url: originalPublicUrl,
            is_primary: newPrimaryIndex === index && existingPhotos.length === 0,
          };
        });

        const photoPayloads = await Promise.all(photoUploadPromises);

        const { error: photosError } = await supabase.from('listing_photos').insert(photoPayloads);

        if (photosError) {
          throw new Error(photosError.message || 'Errore nel salvataggio delle nuove foto.');
        }
      }

      dismissToast(toastId);
      showSuccess('Annuncio aggiornato con successo!');
      navigate('/my-listings');
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto durante l\'aggiornamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !currentListing) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-10 w-1/2" />
          <Card>
            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const now = new Date();
  const promoStart = currentListing.promotion_start_at ? new Date(currentListing.promotion_start_at) : null;
  const promoEnd = currentListing.promotion_end_at ? new Date(currentListing.promotion_end_at) : null;
  const isPremiumOrPending = !!(currentListing.is_premium && promoStart && promoEnd && (promoStart <= now || promoEnd >= now));

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Modifica annuncio</h1>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                          <FormControl>
                            <SelectTrigger className="bg-gray-100 cursor-not-allowed"><SelectValue placeholder="Seleziona una categoria" /></SelectTrigger>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                          <FormControl>
                            <SelectTrigger className="bg-gray-100 cursor-not-allowed"><SelectValue placeholder="Seleziona una città" /></SelectTrigger>
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
                        <FormControl><Input type="number" placeholder="La tua età" {...field} readOnly className="bg-gray-100 cursor-not-allowed" /></FormControl>
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
                            disabled={!phoneValue || isSubmitting}
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

                {/* Rimosso la sezione per la mappa */}

                <div>
                  <FormLabel>Fotografie</FormLabel>
                  <p className="text-sm text-gray-500 mb-2">Carica fino a 5 foto per il tuo annuncio. Se l'annuncio non è Premium, verrà mostrata solo la prima foto.</p>
                  <ImageUploader
                    listingId={currentListing.id}
                    userId={currentListing.user_id}
                    initialPhotos={existingPhotos}
                    isPremiumOrPending={isPremiumOrPending}
                    onFilesChange={setNewFilesToUpload}
                    onPrimaryIndexChange={setNewPrimaryIndex}
                    onExistingPhotosUpdated={setExistingPhotos}
                    hideMainPreview={false}
                  />
                </div>
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                  {isSubmitting ? 'Aggiornamento in corso...' : 'Salva Modifiche'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditListing;