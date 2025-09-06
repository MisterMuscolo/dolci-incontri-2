import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { MapPin, Tag, User, Mail, BookText, ChevronLeft, CalendarDays, Rocket, Phone, Flag, MessageCircle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CreateTicketDialog } from '@/components/CreateTicketDialog';
import { ReplyToListingDialog } from '@/components/ReplyToListingDialog';
import { WatermarkedImage } from '@/components/WatermarkedImage';

type FullListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  zone: string | null;
  age: number;
  phone: string | null;
  email: string | null;
  created_at: string;
  expires_at: string;
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  contact_preference: 'email' | 'phone' | 'both';
  contact_whatsapp: boolean | null;
  listing_photos: { id: string; url: string; original_url: string | null; is_primary: boolean }[]; // Added original_url
};

const ListingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<FullListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null); // This will now store the original_url for the main view

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *, 
          listing_photos(id, url, original_url, is_primary)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching listing:', error);
        showError('Impossibile caricare i dettagli dell\'annuncio.');
        navigate('/search');
        return;
      } else {
        const sortedPhotos = (data.listing_photos || []).sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return 0;
        });

        const nowUtcTime = Date.now(); 
        const promoStart = data.promotion_start_at ? new Date(data.promotion_start_at).getTime() : null;
        const promoEnd = data.promotion_end_at ? new Date(data.promotion_end_at).getTime() : null;

        const isActivePremium = data.is_premium && promoStart && promoEnd && promoStart <= nowUtcTime && promoEnd >= nowUtcTime;

        let photosToDisplay = sortedPhotos;
        if (!isActivePremium) {
          photosToDisplay = photosToDisplay.slice(0, 1);
        } else {
          photosToDisplay = photosToDisplay.slice(0, 5);
        }

        if (photosToDisplay.length > 0) {
          // For main display, use original_url if available, otherwise fallback to cropped url
          setActivePhoto(photosToDisplay[0].original_url ?? photosToDisplay[0].url);
        } else {
          setActivePhoto(null);
        }
        setListing({ ...data, listing_photos: photosToDisplay } as FullListing);
      }
      setLoading(false);
    };
    fetchListing();
  }, [id, navigate]);

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

  const nowUtcTime = Date.now(); 
  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at).getTime() : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at).getTime() : null;
  const isActivePremium = listing.is_premium && promoStart && promoEnd && promoStart <= nowUtcTime && promoEnd >= nowUtcTime;

  const hasPhotos = listing.listing_photos && listing.listing_photos.length > 0;

  const canContactByEmail = (listing.contact_preference === 'email' || listing.contact_preference === 'both') && !!listing.email;
  const canContactByPhone = (listing.contact_preference === 'phone' || listing.contact_preference === 'both') && !!listing.phone;

  const phoneHref = listing.contact_whatsapp ? `https://wa.me/${listing.phone}` : `tel:${listing.phone}`;
  const phoneButtonClass = listing.contact_whatsapp ? "bg-green-500 hover:bg-green-600" : "bg-rose-500 hover:bg-rose-600";
  const phoneButtonIcon = listing.contact_whatsapp ? <MessageCircle className="h-6 w-6" /> : <Phone className="h-6 w-6" />;
  const phoneButtonText = listing.contact_whatsapp ? 'WhatsApp' : 'Chiama';

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
            {isActivePremium && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-base px-3 py-1 rounded-full font-semibold flex items-center gap-1 w-fit absolute top-4 right-4 z-10">
                <Flame className="h-4 w-4" /> Hot
              </Badge>
            )}
            <CardHeader>
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  {format(new Date(listing.created_at), 'dd MMMM', { locale: it })}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline"><MapPin className="h-4 w-4 mr-1.5" />{listing.city}{listing.zone && ` / ${listing.zone}`}</Badge>
                <Badge variant="outline"><User className="h-4 w-4 mr-1.5" />{listing.age} anni</Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-rose-600">{listing.title}</CardTitle>
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
                        "relative w-24 h-24 flex-shrink-0 rounded-md cursor-pointer",
                        activePhoto === (photo.original_url ?? photo.url) && 'ring-2 ring-rose-500 ring-offset-2 ring-offset-gray-50'
                      )}
                      onClick={() => setActivePhoto(photo.original_url ?? photo.url)}
                    >
                      <WatermarkedImage src={photo.url} alt="Miniatura foto" imageClassName="object-cover bg-gray-200 rounded-md" />
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
            {canContactByPhone && (
              <a
                href={phoneHref}
                target={listing.contact_whatsapp ? "_blank" : "_self"}
                rel={listing.contact_whatsapp ? "noopener noreferrer" : ""}
                className="w-full sm:w-auto"
              >
                <Button className={cn(
                  "w-full text-lg px-8 py-6 rounded-lg shadow-lg flex items-center justify-center gap-2",
                  phoneButtonClass
                )}>
                  {phoneButtonIcon} {phoneButtonText}
                </Button>
              </a>
            )}
            {canContactByEmail && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;