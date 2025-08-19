import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { MapPin, Tag, User, Mail, BookText, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const replySchema = z.object({
  message: z.string().min(10, 'Il messaggio deve contenere almeno 10 caratteri.'),
  fromEmail: z.string().email('Inserisci un indirizzo email valido.'),
});

type FullListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  zone: string | null;
  age: number;
  phone: string | null;
  created_at: string;
  listing_photos: { id: string; url: string }[];
};

const ListingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<FullListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '', fromEmail: '' },
  });

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*, listing_photos(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching listing:', error);
      } else {
        setListing(data as FullListing);
        if (data.listing_photos && data.listing_photos.length > 0) {
          setActivePhoto(data.listing_photos[0].url);
        }
      }
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  const onSubmit = async (values: z.infer<typeof replySchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading('Invio del messaggio...');

    const { error } = await supabase.functions.invoke('send-reply', {
      body: {
        listingId: id,
        ...values,
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
      showError(errorMessage);
    } else {
      showSuccess('Messaggio inviato con successo!');
      form.reset();
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-1/2 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="w-full aspect-video" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div className="text-center py-20">Annuncio non trovato.</div>;
  }

  const hasPhotos = listing.listing_photos && listing.listing_photos.length > 0;

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Dettagli Annuncio</h1>
        </div>
        <div className={cn("grid grid-cols-1 gap-8", hasPhotos && "lg:grid-cols-5")}>
          {hasPhotos && (
            <div className="lg:col-span-3">
              <AspectRatio ratio={16 / 10} className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img src={activePhoto!} alt={listing.title} className="w-full h-full object-cover" />
              </AspectRatio>
              {listing.listing_photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {listing.listing_photos.map((photo) => (
                    <button key={photo.id} onClick={() => setActivePhoto(photo.url)} className={cn("w-24 h-24 rounded-md overflow-hidden flex-shrink-0 ring-offset-2 ring-offset-gray-50", activePhoto === photo.url && 'ring-2 ring-rose-500')}>
                      <img src={photo.url} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={cn("space-y-6", hasPhotos ? "lg:col-span-2" : "lg:col-span-5")}>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-gray-800">{listing.title}</CardTitle>
                <div className="flex flex-wrap gap-2 pt-4">
                  <Badge variant="secondary" className="capitalize"><Tag className="h-4 w-4 mr-1.5" />{listing.category.replace(/-/g, ' ')}</Badge>
                  <Badge variant="outline"><MapPin className="h-4 w-4 mr-1.5" />{listing.city}{listing.zone && `, ${listing.zone}`}</Badge>
                  <Badge variant="outline"><User className="h-4 w-4 mr-1.5" />{listing.age} anni</Badge>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><BookText className="h-5 w-5 text-rose-500" /> Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-rose-500" /> Rispondi all'annuncio</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>La tua Email</FormLabel>
                          <FormControl><Input type="email" placeholder="iltuoindirizzo@email.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Messaggio</FormLabel>
                          <FormControl><Textarea placeholder="Scrivi qui il tuo messaggio..." className="min-h-[100px]" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                      {isSubmitting ? 'Invio in corso...' : 'Invia Messaggio'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;