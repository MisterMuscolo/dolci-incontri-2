import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { italianProvinces } from '@/data/provinces';
import { ImageUploader } from '@/components/ImageUploader'; // Use the updated ImageUploader
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

type ExistingPhoto = { id: string; url: string; is_primary: boolean };

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
  user_id: string; // Added to pass to ImageUploader
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  contact_preference: 'email' | 'phone' | 'both'; // Aggiunto
  listing_photos: ExistingPhoto[];
};

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPrimaryIndex, setNewPrimaryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentListing, setCurrentListing] = useState<FullListing | null>(null); // Store full listing data

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      zone: '',
      email: '',
      phone: '',
      contact_preference: 'both', // Default to 'both'
    }
  });

  const contactPreference = form.watch('contact_preference');

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
    setCurrentListing(listing); // Set the full listing data

    form.reset({
      category: listing.category,
      city: listing.city,
      zone: listing.zone || '',
      age: String(listing.age),
      title: listing.title,
      description: listing.description,
      email: listing.email,
      phone: listing.phone || '',
      contact_preference: listing.contact_preference || 'both', // Set from fetched data
    });

    setExistingPhotos(listing.listing_photos || []);
    setIsLoading(false);
  }, [id, navigate, form]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading('Aggiornamento annuncio in corso...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Devi essere autenticato per modificare un annuncio.');

      // Only send mutable fields to the update operation
      const updateData = {
        title: values.title,
        description: values.description,
        // L'email e il telefono vengono salvati come sono, la preferenza di contatto gestisce la visualizzazione
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        contact_preference: values.contact_preference,
      };

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError?.message || 'Errore nell\'aggiornamento dell\'annuncio.');
      }

      // Handle new photo uploads
      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map(async (file, index) => {
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${user.id}/${id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('listing_photos')
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(`Errore nel caricamento della nuova foto ${index + 1}: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(filePath);
          
          return {
            listing_id: id,
            url: publicUrl,
            is_primary: newPrimaryIndex === index && existingPhotos.length === 0, // Set primary only if no existing photos
          };
        });

        const photoPayloads = await Promise.all(uploadPromises);

        const { error: photosError } = await supabase.from('listing_photos').insert(photoPayloads);

        if (photosError) {
          // Consider rolling back listing update if photo upload fails critically
          throw new Error(photosError.message || 'Errore nel salvataggio delle nuove foto.');
        }
      }

      dismissToast(toastId);
      showSuccess('Annuncio aggiornato con successo!');
      navigate('/my-listings'); // Reindirizza a "I miei annunci"
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
  const isPremiumOrPending = currentListing.is_premium && promoStart && promoEnd && (promoStart <= now || promoEnd >= now); // Check if premium or pending

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
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
                        <FormControl><Input placeholder="Es. Centro Storico" {...field} readOnly className="bg-gray-100 cursor-not-allowed" /></FormControl>
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
                <div>
                  <FormLabel>Fotografie</FormLabel>
                  <p className="text-sm text-gray-500 mb-2">Gestisci le foto del tuo annuncio. Gli annunci gratuiti possono avere 1 foto, gli annunci Premium fino a 5.</p>
                  <ImageUploader
                    listingId={currentListing.id}
                    userId={currentListing.user_id}
                    initialPhotos={existingPhotos}
                    isPremiumOrPending={isPremiumOrPending}
                    onFilesChange={setNewFiles}
                    onPrimaryIndexChange={setNewPrimaryIndex}
                    onExistingPhotosUpdated={setExistingPhotos} // Update existingPhotos state when changes occur
                    hideMainPreview={true} // Aggiunto per nascondere l'anteprima principale
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