import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CalendarDays, Rocket, User } from "lucide-react";
import { format, differenceInDays } from 'date-fns';
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
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useState } from "react";
import { ListingPhotoManagerDialog } from "./ListingPhotoManagerDialog";

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  created_at: string;
  expires_at: string;
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  last_bumped_at: string | null;
  listing_photos: { url: string; is_primary: boolean }[];
  age?: number;
}

interface ListingListItemProps {
  listing: Listing;
  canEdit?: boolean;
  canManagePhotos?: boolean;
  canDelete?: boolean;
  showExpiryDate?: boolean;
  onListingUpdated?: () => void;
  isAdminContext?: boolean;
}

export const ListingListItem = ({ listing, canEdit = false, canManagePhotos = false, canDelete = false, showExpiryDate = false, onListingUpdated, isAdminContext = false }: ListingListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const now = new Date();
  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at) : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at) : null;

  const isActivePremium = listing.is_premium && promoStart && promoEnd && promoStart <= now && promoEnd >= now;
  const isPendingPremium = listing.is_premium && promoStart && promoStart > now;

  let photosToRender: { url: string; is_primary: boolean }[] = [];
  
  // Solo gli annunci Premium attivi con foto mostrano le immagini
  if (isActivePremium && listing.listing_photos && listing.listing_photos.length > 0) {
    photosToRender = listing.listing_photos.slice(0, 5); // Premium gets up to 5 photos
  }

  const hasPhotosToRender = photosToRender.length > 0;

  const dateToDisplay = showExpiryDate ? new Date(listing.expires_at) : new Date(listing.created_at);
  const prefix = showExpiryDate ? 'Scade il:' : '';
  const dateFormat = showExpiryDate ? 'dd MMMM yyyy' : 'dd MMMM';

  const formattedDate = !isNaN(dateToDisplay.getTime()) 
    ? format(dateToDisplay, dateFormat, { locale: it }) 
    : 'N/D';

  const getPromotionDetailsText = (mode: string | null) => {
    if (mode === 'day') {
        return 'Il tuo annuncio sarà in evidenza durante il giorno, con 1 risalita immediata. Apparirà in cima ai risultati di ricerca e potrà avere fino a 5 foto.';
    } else if (mode === 'night') {
        return 'Il tuo annuncio avrà massima visibilità durante le ore notturne, con 5 risalite più frequenti durante il periodo. Apparirà in cima ai risultati di ricerca e potrà avere fino a 5 foto.';
    }
    return 'Gli annunci in Evidenza appaiono in cima ai risultati di ricerca e possono avere fino a 5 foto.';
  };

  const getPromotionPeriodDetails = () => {
    if (!listing.promotion_start_at || !listing.promotion_end_at) return '';

    const start = new Date(listing.promotion_start_at);
    const end = new Date(listing.promotion_end_at);
    const durationInDays = differenceInDays(end, start);

    const formattedStart = format(start, 'dd/MM/yyyy HH:mm', { locale: it });
    const formattedEnd = format(end, 'dd/MM/yyyy HH:mm', { locale: it });

    const promotionTypeLabel = listing.promotion_mode === 'day' ? 'Modalità Giorno' : 'Modalità Notte';

    return (
      <>
        <p className="text-base font-semibold text-gray-800 mb-2">
          Pacchetto: <span className="capitalize">{promotionTypeLabel}</span>
        </p>
        <p className="text-sm text-gray-600">
          Durata: <span className="font-medium">{durationInDays} {durationInDays === 1 ? 'giorno' : 'giorni'}</span>
        </p>
        <p className="text-sm text-gray-600">
          Inizio: <span className="font-medium">{formattedStart}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Fine: <span className="font-medium">{formattedEnd}</span>
        </p>
        <p className="text-sm text-gray-700">
          {getPromotionDetailsText(listing.promotion_mode)}
        </p>
      </>
    );
  };

  const handleDeleteListing = async () => {
    setIsDeleting(true);
    const toastId = showLoading('Eliminazione annuncio in corso...');

    try {
      // Delete associated photos from storage first
      const { data: photos, error: photoListError } = await supabase.storage
        .from('listing_photos')
        .list(`${listing.id}/`);

      if (photoListError) {
        console.warn(`Could not list photos for listing ${listing.id}:`, photoListError.message);
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
        onListingUpdated();
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'eliminazione dell\'annuncio.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative"> {/* Nuovo contenitore relativo */}
      <Card className={cn(
        "w-full overflow-hidden transition-shadow hover:shadow-md flex flex-col md:flex-row", // Rimosso 'relative' da qui
        (canEdit || canManagePhotos || canDelete) && isPendingPremium && "border-2 border-blue-400 shadow-lg bg-blue-50" 
      )}>
        <div className="flex flex-col sm:flex-row w-full">
          {hasPhotosToRender && ( // Mostra il blocco immagine solo se ci sono foto da renderizzare
            <div className="md:w-2/5 lg:w-1/3 flex-shrink-0 relative"> {/* Modificato qui */}
              <AspectRatio ratio={16 / 9} className="w-full h-full">
                {photosToRender.length > 1 ? (
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
                      {photosToRender.map((photo, index) => (
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
                    <img src={photosToRender[0].url} alt={listing.title} className="object-cover w-full h-full" />
                  </Link>
                )}
              </AspectRatio>
            </div>
          )}
          <Link to={`/listing/${listing.id}`} className={cn(
            "flex-grow block hover:bg-gray-50/50",
            !hasPhotosToRender && "w-full" // Se non ci sono foto, il link occupa tutta la larghezza disponibile
          )}>
            <div className="p-4 flex flex-col flex-grow">
              {/* Data e Categoria spostate sopra il titolo */}
              <div className="flex items-center gap-2 mb-1"> {/* Usa gap-2 per spaziatura tra gli elementi */}
                <div className="flex items-center text-xs text-gray-500"> {/* Testo più piccolo per la data */}
                  <CalendarDays className="h-3 w-3 mr-1" /> {/* Icona più piccola */}
                  <span>{prefix} {formattedDate}</span>
                </div>
                <Badge variant="secondary" className="capitalize text-xs">{listing.category.replace(/-/g, ' ')}</Badge> {/* Assicurati che il badge sia anche text-xs */}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-rose-600 line-clamp-2">{listing.title}</h3>
              <p className="text-base text-gray-600 mb-3 line-clamp-3">{listing.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline">{listing.city}</Badge>
                {listing.age && (
                  <Badge variant="outline">
                    <User className="h-3 w-3 mr-1" /> {listing.age} anni
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        </div>
        {(canEdit || canManagePhotos || canDelete) && (
          <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-center items-center gap-2 p-4 border-t md:border-t-0 md:border-l">
            {canEdit && (
              <Link to={`/edit-listing/${listing.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  <Pencil className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Modifica</span>
                </Button>
              </Link>
            )}
            {canManagePhotos && (
              <ListingPhotoManagerDialog 
                listingId={listing.id} 
                listingTitle={listing.title} 
                userId={listing.user_id}
                onPhotosUpdated={onListingUpdated || (() => {})}
              />
            )}

            {/* Mostra i dettagli In Evidenza/In Attesa ma nasconde i pulsanti di acquisto/promozione se isAdminContext */}
            {isActivePremium ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1"
                  >
                    <Rocket className="h-4 w-4" /> In Evidenza
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuncio In Evidenza Attivo</AlertDialogTitle>
                    <AlertDialogDescription>
                      {getPromotionPeriodDetails()}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Chiudi</AlertDialogCancel>
                    {!isAdminContext && ( // Nascondi il pulsante "Acquista Crediti" se isAdminContext
                      <Link to="/buy-credits">
                        <AlertDialogAction className="bg-rose-500 hover:bg-rose-600">
                          Acquista Crediti
                        </AlertDialogAction>
                      </Link>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : isPendingPremium ? (
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
                    {!isAdminContext && ( // Nascondi il pulsante "Acquista Crediti" se isAdminContext
                      <Link to="/buy-credits">
                        <AlertDialogAction className="bg-rose-500 hover:bg-rose-600">
                          Acquista Crediti
                        </AlertDialogAction>
                      </Link>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              !isAdminContext && ( // Nascondi il pulsante "Promuovi" se isAdminContext
                <Link to={`/promote-listing/${listing.id}`} className="w-full">
                  <Button variant="default" size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white">
                    <Rocket className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Promuovi</span>
                  </Button>
                </Link>
              )
            )}
            {canDelete && (
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
            )}
          </div>
        )}
      </Card>
      {!(canEdit || canManagePhotos || canDelete) && isActivePremium && (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white absolute -top-2 right-0 z-20 text-xs px-2 py-0.5 rounded-full font-semibold">
          <Rocket className="h-3 w-3 mr-1" /> In Evidenza
        </Badge>
      )}
    </div>
  );
};