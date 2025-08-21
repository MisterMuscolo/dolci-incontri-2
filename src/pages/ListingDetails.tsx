import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { MapPin, Tag, User, Mail, BookText, ChevronLeft, CalendarDays, Rocket, Phone, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CreateTicketDialog } from '@/components/CreateTicketDialog';
import { ReplyToListingDialog } from '@/components/ReplyToListingDialog'; // Importa il nuovo componente
import { WatermarkedImage } from '@/components/WatermarkedImage'; // Importa il nuovo componente

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
  expires_at: string;
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  listing_photos: { id: string; url: string }[];
};

const ListingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<FullListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

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
        const now = new Date();
        const promoStart = data.promotion_start_at ? new Date(data.promotion_start_at) : null;
        const promoEnd = data.promotion_end_at ? new Date(data.promotion_end_at) : null;

        // Determine if the listing is actively premium based on promotion dates
        const isActivePremium = data.is_premium && promoStart && promoEnd && promoStart <= now && promoEnd >= now;

        let photosToDisplay = data.listing_photos || [];
        if (!isActivePremium) {
          photosToDisplay = photosToDisplay.slice(0, 1); // Solo 1 foto per annunci non attivamente premium
        } else {
          photosToDisplay = photosToDisplay.slice(0, 5); // Fino a 5 foto per annunci attivamente premium
        }

        if (photosToDisplay.length > 0) {
          setActivePhoto(photosToDisplay[0].url);
        } else {
          setActivePhoto(null); // Nessuna foto da mostrare
        }
        setListing({ ...data, listing_photos: photosToDisplay } as FullListing); // Aggiorna lo stato con le foto filtrate
      }
      setLoading(false);
    };
    fetchListing();
  }, [id]);

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

  const now = new Date();
  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at) : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at) : null;
  const isActivePremium = listing.is_premium && promoStart && promoEnd && promoStart <= now && promoEnd >= now;

  const hasPhotos = listing.listing_photos && listing.listing_photos.length > 0;

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="relative">
            <CardHeader>
              {/* Spostato il blocco dei tag sopra il titolo */}
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="capitalize"><Tag className="h-4 w-4 mr-1.5" />{listing.category.replace(/-/g, ' ')}</Badge>
                <Badge variant="outline"><MapPin className="h-4 w-4 mr-1.5" />{listing.city}{listing.zone && ` / ${listing.zone}`}</Badge>
                <Badge variant="outline"><User className="h-4 w-4 mr-1.5" />{listing.age} anni</Badge>
                <Badge variant="outline" className="text-xs">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  {format(new Date(listing.created_at), 'dd MMMM', { locale: it })}
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-rose-600">{listing.title}</CardTitle>
              {isActivePremium && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-base px-3 py-1 rounded-full font-semibold flex items-center gap-1 w-fit absolute top-4 right-4">
                  <Rocket className="h-4 w-4" /> In Evidenza
                </Badge>
              )}
            </CardHeader>
          </Card>

          {hasPhotos && (
            <div>
              <AspectRatio ratio={16 / 10} className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                <WatermarkedImage src={activePhoto!} alt={listing.title} imageClassName="object-contain bg-gray-200" />
              </AspectRatio>
              {listing.listing_photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {listing.listing_photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className={cn(
                        "relative w-24 h-24 flex-shrink-0", // Rimosso rounded-md
                        activePhoto === photo.url && 'ring-2 ring-rose-500 ring-offset-2 ring-offset-gray-50'
                      )}
                    >
                      <button 
                        onClick={() => setActivePhoto(photo.url)} 
                        className="w-full h-full overflow-hidden" // Rimosso rounded-md
                      >
                        <WatermarkedImage src={photo.url} alt="Thumbnail" imageClassName="object-contain bg-gray-200" /> {/* Rimosso rounded-md */}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end -mt-4 mb-4">
            <CreateTicketDialog
              triggerButton={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                >
                  <Flag className="h-5 w-5" /> Segnala Annuncio
                </Button>
              }
              dialogTitle="Segnala Annuncio"
              dialogDescription={`Segnala l'annuncio "${listing.title}" se ritieni che violi le nostre linee guida.`}
              initialSubject={`Segnalazione annuncio: ${listing.title}`}
              listingId={listing.id}
              icon={Flag}
              redirectPathOnAuth={`/listing/${listing.id}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><BookText className="h-5 w-5 text-rose-500" /> Descrizione</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-center py-4 gap-4">
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                className="w-full sm:w-auto"
              >
                <Button className="w-full bg-green-500 hover:bg-green-600 text-lg px-8 py-6 rounded-lg shadow-lg flex items-center justify-center gap-2">
                  <Phone className="h-6 w-6" /> {listing.phone}
                </Button>
              </a>
            )}
            <ReplyToListingDialog
              listingId={listing.id}
              listingTitle={listing.title}
              triggerButton={
                <Button
                  className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-lg px-8 py-6 rounded-lg shadow-lg flex items-center justify-center gap-2"
                >
                  <Mail className="h-6 w-6" /> Rispondi
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;