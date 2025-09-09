import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { MapPin, User, Mail, BookText, ChevronLeft, CalendarDays, Phone, Flag, MessageCircle, Flame, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CreateTicketDialog } from '@/components/CreateTicketDialog';
import { ReplyToListingDialog } from '@/components/ReplyToListingDialog';
import { WatermarkedImage } from '@/components/WatermarkedImage';
import { Helmet } from 'react-helmet-async';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';
import { StaticMapDisplay } from '@/components/StaticMapDisplay'; // Importa il nuovo componente StaticMapDisplay

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
  expires_at: string | null; // Può essere null se in pausa
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  contact_preference: 'email' | 'phone' | 'both';
  contact_whatsapp: boolean | null;
  listing_photos: { id: string; url: string; original_url: string | null; is_primary: boolean }[];
  is_paused: boolean; // Nuovo campo
  paused_at: string | null; // Nuovo campo
  remaining_expires_at_duration: string | null; // Nuovo campo
  remaining_promotion_duration: string | null; // Nuovo campo
  latitude: number | null; // Aggiunto
  longitude: number | null; // Aggiunto
  address_text: string | null; // Aggiunto
};

const ListingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<FullListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink();

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
        const sortedPhotos = (data.listing_photos || []).sort((a: { is_primary: boolean }, b: { is_primary: boolean }) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return 0;
        });

        const nowUtcTime = Date.now(); 
        const promoStart = data.promotion_start_at ? new Date(data.promotion_start_at).getTime() : null;
        const promoEnd = data.promotion_end_at ? new Date(data.promotion_end_at).getTime() : null;

        const isActivePremium = data.is_premium && promoStart && promoEnd && promoStart <= nowUtcTime && promoEnd >= nowUtcTime && !data.is_paused;

        let photosToDisplay = sortedPhotos;
        if (!isActivePremium) {
          photosToDisplay = photosToDisplay.slice(0, 1);
        } else {
          photosToDisplay = photosToDisplay.slice(0, 5);
        }

        if (photosToDisplay.length > 0) {
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
  const isActivePremium = listing.is_premium && promoStart && promoEnd && promoStart <= nowUtcTime && promoEnd >= nowUtcTime && !listing.is_paused;

  const hasPhotos = listing.listing_photos && listing.listing_photos.length > 0;

  const canContactByEmail = (listing.contact_preference === 'email' || listing.contact_preference === 'both') && !!listing.email && !listing.is_paused;
  const canContactByPhone = (listing.contact_preference === 'phone' || listing.contact_preference === 'both') && !!listing.phone && !listing.is_paused;

  const truncatedTitle = listing.title.length > 25 ? listing.title.substring(0, 25) + '(...)' : listing.title;
  const whatsappMessage = encodeURIComponent(`Ciao, ho visto su Incontri Dolci il tuo annuncio "${truncatedTitle}" e vorrei incontrarti.`);
  const phoneHref = listing.contact_whatsapp ? `https://wa.me/${listing.phone}?text=${whatsappMessage}` : `tel:${listing.phone}`;
  const phoneButtonClass = listing.contact_whatsapp ? "bg-green-500 hover:bg-green-600" : "bg-rose-500 hover:bg-rose-600";
  const phoneButtonIcon = listing.contact_whatsapp ? <MessageCircle className="h-6 w-6" /> : <Phone className="h-6 w-6" />;
  const phoneButtonText = listing.contact_whatsapp ? 'WhatsApp' : 'Chiama';

  return (
    <div className="bg-gray-50">
      <Helmet>
        <title>{listing.title} - Incontri a {listing.city} | IncontriDolci</title>
        <meta name="description" content={`${listing.description.substring(0, 150)}... Annuncio di ${listing.category.replace(/-/g, ' ')} a ${listing.city}. Trova il tuo appuntamento ideale.`} />
        <meta name="keywords" content={`incontri, ${listing.category.replace(/-/g, ' ')}, ${listing.city}, ${listing.zone || ''}, ${listing.age} anni, ${listing.title}, annunci, appuntamenti, relazioni, bakeca incontri`} />
        {hasPhotos && <meta property="og:image" content={listing.listing_photos[0].url} />}
        <meta property="og:title" content={`${listing.title} - Incontri a ${listing.city} | IncontriDolci`} />
        <meta property="og:description" content={`${listing.description.substring(0, 150)}... Annuncio di ${listing.category.replace(/-/g, ' ')} a ${listing.city}. Trova il tuo appuntamento ideale.`} />
        <meta property="og:url" content={`${window.location.origin}/listing/${listing.id}`} />
        <meta property="og:type" content="website" />
        {/* Schema Markup per il servizio */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "${listing.title}",
              "description": "${listing.description.replace(/"/g, '\\"')}",
              "serviceType": "${listing.category.replace(/-/g, ' ')}",
              "areaServed": {
                "@type": "Place",
                "name": "${listing.city}"
              },
              "provider": {
                "@type": "Person",
                "name": "Utente di IncontriDolci",
                ${listing.age ? `"ageRange": "${listing.age}",` : ''}
                ${listing.email ? `"email": "${listing.email}",` : ''}
                ${listing.phone ? `"telephone": "${listing.phone}"` : ''}
              },
              ${hasPhotos ? `"image": "${listing.listing_photos[0].url}",` : ''}
              "url": "${window.location.origin}/listing/${listing.id}"
            }
          `}
        </script>
      </Helmet>
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="relative">
            {isActivePremium && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-base px-3 py-1 rounded-full font-semibold flex items-center gap-1 w-fit absolute top-4 right-4 z-10">
                <Flame className="h-4 w-4" /> Hot
              </Badge>
            )}
            {listing.is_paused && (
              <Badge className="bg-gray-600 text-white text-base px-3 py-1 rounded-full font-semibold flex items-center gap-1 w-fit absolute top-4 right-4 z-10">
                <PauseCircle className="h-4 w-4" /> In Pausa
              </Badge>
            )}
            <CardHeader>
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  {listing.is_paused ? 'In pausa' : format(new Date(listing.created_at), 'dd MMMM', { locale: it })}
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
              {/* Modificata la condizione per mostrare le miniature se ci sono foto */}
              {listing.listing_photos.length > 0 && ( 
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
                      <WatermarkedImage 
                        src={photo.url} 
                        alt="Miniatura foto" 
                        imageClassName="object-cover bg-gray-200 rounded-md" 
                        defaultWatermarkIconSizeClass="h-[9px] w-[9px]" // Icona aumentata del 50%
                        defaultWatermarkTextSizeClass="text-[0.5625rem]" // Testo aumentato del 50%
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center -mt-4 mb-4">
            {/* Nuovo elemento per l'ID dell'annuncio */}
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
              ID Annuncio: <span className="font-semibold text-gray-700">{listing.id.substring(0, 8)}</span>
            </div>
            <CreateTicketDialog
              triggerButton={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  disabled={listing.is_paused} // Disabilita se in pausa
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

          {listing.latitude !== null && listing.longitude !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><MapPin className="h-5 w-5 text-rose-500" /> Posizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">{listing.address_text || 'Posizione fittizia'}</p>
                <div className="w-full h-48 bg-gray-200 rounded-md overflow-hidden">
                  <StaticMapDisplay 
                    latitude={listing.latitude} 
                    longitude={listing.longitude} 
                    addressText={listing.address_text} 
                  />
                </div>
              </CardContent>
            </Card>
          )}

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
            {listing.is_paused && (
              <p className="text-center text-gray-600 text-lg mt-4 col-span-full">
                Questo annuncio è in pausa. I contatti sono disabilitati.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;