import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CalendarDays, Rocket, User } from "lucide-react";
import { format, differenceInDays } from 'date-fns'; // Importa differenceInDays
import { it } from 'date-fns/locale';
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { cn } from '@/lib/utils'; // Importa la funzione cn
import { AspectRatio } from '@/components/ui/aspect-ratio'; // Import AspectRatio
import { useState } from "react"; // Importa useState

export interface Listing {
  id: string;
  title: string;
  category: string;
  city: string;
  created_at: string;
  expires_at: string;
  is_premium: boolean;
  promotion_mode: string | null; // 'day', 'night', 'none'
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  last_bumped_at: string | null; // Aggiunto per l'ordinamento
  listing_photos: { url: string; is_primary: boolean }[];
  description?: string;
  age?: number;
}

interface ListingListItemProps {
  listing: Listing;
  showControls?: boolean;
  showExpiryDate?: boolean;
  onListingUpdated?: () => void;
}

export const ListingListItem = ({ listing, showControls = false, showExpiryDate = false, onListingUpdated }: ListingListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false); // Stato per gestire il caricamento dell'eliminazione

  const now = new Date();
  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at) : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at) : null;

  // Determina se l'annuncio è attivamente premium in questo momento
  const isActivePremium = listing.is_premium && promoStart && promoEnd && promoStart <= now && promoEnd >= now;
  // Determina se l'annuncio è premium ma in attesa di attivazione
  const isPendingPremium = listing.is_premium && promoStart && promoStart > now;

  // Determine photos to display:
  // If actively premium, show up to 5 photos.
  // If not actively premium, but showControls is true (My Listings/Admin), show only the primary/first photo.
  // If not actively premium AND showControls is false (public search), photosForDisplay remains empty.
  let photosForDisplay: { url: string; is_primary: boolean }[] = [];
  const primaryPhoto = listing.listing_photos.find(p => p.is_primary) || listing.listing_photos[0];

  if (isActivePremium) {
    photosForDisplay = listing.listing_photos.slice(0, 5);
  } else if (showControls) {
    if (primaryPhoto) {
      photosForDisplay = [primaryPhoto];
    }
  }

  const hasPhotos = photosForDisplay.length > 0;
  const currentActivePhotoUrl = hasPhotos ? photosForDisplay[0].url : null; // For single image display or carousel initial

  const dateToDisplay = showExpiryDate ? new Date(listing.expires_at) : new Date(listing.created_at);
  const prefix = showExpiryDate ? 'Scade il:' : '';
  const dateFormat = showExpiryDate ? 'dd MMMM yyyy' : 'dd MMMM';

  const formattedDate = !isNaN(dateToDisplay.getTime()) 
    ? format(dateToDisplay, dateFormat, { locale: it }) 
    : 'N/D';

  const getPromotionDetails = (mode: string | null) => {
    if (mode === 'day') {
        return 'Il tuo annuncio sarà in evidenza durante il giorno, con 1 risalita immediata. Apparirà in cima ai risultati di ricerca e potrà avere fino a 5 foto.';
    } else if (mode === 'night') {
        return 'Il tuo annuncio avrà massima visibilità durante le ore notturne, con 5 risalite più frequenti durante il periodo. Apparirà in cima ai risultati di ricerca e potrà avere fino a 5 foto.';
    }
    return 'Gli annunci Premium appaiono in cima ai risultati di ricerca e possono avere fino a 5 foto.';
  };

  const handleDeleteListing = async () => {
    setIsDeleting(true);
    const toastId = showLoading('Eliminazione annuncio in corso...');

    try {
      // Delete associated photos from storage first
      const { data: photos, error: photoListError } = await supabase.storage
        .from('listing_photos')
        .list(`${listing.id}/`); // List files in the listing's folder

      if (photoListError) {
        console.warn(`Could not list photos for listing ${listing.id}:`, photoListError.message);
        // Don't throw, as listing itself can still be deleted, but log the issue
      } else if (photos && photos.length > 0) {
        const filePaths = photos.map(file => `${listing.id}/${file.name}`);
        const { error: deletePhotoError } = await supabase.storage
          .from('listing_photos')
          .remove(filePaths);

        if (deletePhotoError) {
          console.warn(`Could not delete photos for listing ${listing.id}:`, deletePhotoError.message);
        }
      }

      // Then delete the listing from the database
      const { error: listingDeleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (listingDeleteError) {
        throw new Error(listingDeleteError.message);
      }

      dismissToast(toastId);
      showSuccess('Annuncio eliminato con successo!');
      if (onListingUpdated) {
        onListingUpdated(); // Refresh the list in the parent component
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'eliminazione dell\'annuncio.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPromotionPeriodDetails = () => {
    if (!listing.promotion_start_at || !listing.promotion_end_at) return '';

    const start = new Date(listing.promotion_start_at);
    const end = new Date(listing.promotion_end_at);
    const durationInDays = differenceInDays(end, start); // Calcola la differenza in giorni

    const formattedStart = format(start, 'dd/MM/yyyy HH:mm', { locale: it });
    const formattedEnd = format(end, 'dd/MM/yyyy HH:mm', { locale: it });

    const promotionTypeLabel = listing.promotion_mode === 'day' ? 'Modalità Giorno' : 'Modalità Notte';

    return (
      <>
        <p className="text-base font-semibold text-gray-800 mb-2">
          Pacchetto: <span className="capitalize">{promotionTypeLabel}</span>
        </p>
        <p className="text-sm text-gray-600">
          Durata: <span className="font-medium">{durationInDays} giorni</span>
        </p>
        <p className="text-sm text-gray-600">
          Inizio: <span className="font-medium">{formattedStart}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Fine: <span className="font-medium">{formattedEnd}</span>
        </p>
        <p className="text-sm text-gray-700">
          {getPromotionDetails(listing.promotion_mode)}
        </p>
      </>
    );
  };

  return (
    <Card className={cn(
      "w-full overflow-hidden transition-shadow hover:shadow-md flex flex-col md:flex-row relative",
      isActivePremium && "border-2 border-rose-500 shadow-lg bg-rose-50",
      // Apply blue border/background only if showControls is true (My Listings/Admin) AND it's pending premium
      showControls && isPendingPremium && "border-2 border-blue-400 shadow-lg bg-blue-50" 
    )}>
      <div className="flex flex-col sm:flex-row w-full">
        {hasPhotos ? ( // Use hasPhotos for conditional rendering
          <div className="sm:w-1/4 lg:w-1/5 flex-shrink-0 relative">
            <AspectRatio ratio={16 / 9} className="w-full h-full">
              {photosForDisplay.length > 1 ? (
                <Carousel
                  plugins={[
                    Autoplay({
                      delay: 3000,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                  opts={{
                    loop: true,
                  }}
                  className="w-full h-full"
                >
                  <CarouselContent className="h-full">
                    {photosForDisplay.map((photo, index) => (
                      <CarouselItem key={index} className="h-full">
                        <Link to={`/listing/${listing.id}`} className="block w-full h-full">
                          <img src={photo.url} alt={`${listing.title} - ${index + 1}`} className="object-cover w-full h-full" />
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                </Carousel>
              ) : (
                <Link to={`/listing/${listing.id}`} className="block w-full h-full">
                  <img src={currentActivePhotoUrl!} alt={listing.title} className="object-cover w-full h-full" />
                </Link>
              )}
            </AspectRatio>
          </div>
        ) : null}
        <Link to={`/listing/${listing.id}`} className="flex-grow block hover:bg-gray-50/50">
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-2">{listing.title}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="capitalize">{listing.category.replace(/-/g, ' ')}</Badge>
              <Badge variant="outline">{listing.city}</Badge>
              {listing.age && (
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" /> {listing.age} anni
                </Badge>
              )}
            </div>
            <div className="mt-auto flex items-center text-xs text-gray-500">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span>{prefix} {formattedDate}</span>
            </div>
          </div>
        </Link>
      </div>
      {/* Badge for Premium status in search results (when showControls is false) */}
      {!showControls && isActivePremium && (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white absolute top-2 right-2 z-20">
          <Rocket className="h-3 w-3 mr-1" /> Premium
        </Badge>
      )}
      {/* Controls section (only rendered if showControls is true) */}
      {showControls && (
        <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-center items-center gap-2 p-4 border-t md:border-t-0 md:border-l">
           <Link to={`/edit-listing/${listing.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              <Pencil className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Modifica</span>
            </Button>
          </Link>
          {isActivePremium ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1"
                >
                  <Rocket className="h-4 w-4" /> Premium
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuncio Premium Attivo</AlertDialogTitle>
                  <AlertDialogDescription>
                    {getPromotionPeriodDetails()}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Chiudi</AlertDialogCancel>
                  <Link to="/buy-credits">
                    <AlertDialogAction className="bg-rose-500 hover:bg-rose-600">
                      Acquista Crediti
                    </AlertDialogAction>
                  </Link>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : isPendingPremium ? ( // Nuovo stato per promozione in attesa
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1"
                >
                  <Rocket className="h-4 w-4" /> In Attesa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Promozione in Attesa</AlertDialogTitle>
                  <AlertDialogDescription>
                    {getPromotionPeriodDetails()}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Chiudi</AlertDialogCancel>
                  <Link to="/buy-credits">
                    <AlertDialogAction className="bg-rose-500 hover:bg-rose-600">
                      Acquista Crediti
                    </AlertDialogAction>
                  </Link>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Link to={`/promote-listing/${listing.id}`} className="w-full">
              <Button variant="default" size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white">
                <Rocket className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Promuovi</span>
              </Button>
            </Link>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Elimina</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione eliminerà definitivamente l'annuncio "{listing.title}" e tutte le sue foto.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteListing}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Eliminazione...' : 'Sì, elimina'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
};