import React from "react"; // Aggiunto per risolvere l'errore di compilazione JSX
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CalendarDays, Rocket, User, Camera, MapPin, Tag } from "lucide-react"; // Importa MapPin e Tag
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
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useState } from "react";
import { ListingPhotoManagerDialog } from "./ListingPhotoManagerDialog";
import { WatermarkedImage } from "./WatermarkedImage"; // Importa il nuovo componente

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
  zone?: string | null; // Aggiunto per chiarezza
}

interface ListingListItemProps {
  listing: Listing;
  canEdit?: boolean;
  canManagePhotos?: boolean;
  canDelete?: boolean;
  showExpiryDate?: boolean;
  onListingUpdated?: () => void;
  isAdminContext?: boolean;
  allowNonPremiumImage?: boolean; // Nuova prop per controllare la visualizzazione delle immagini non premium
}

export const ListingListItem = ({ listing, canEdit = false, canManagePhotos = false, canDelete = false, showExpiryDate = false, onListingUpdated, isAdminContext = false, allowNonPremiumImage = true }: ListingListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Ottieni il timestamp UTC corrente in millisecondi
  const nowUtcTime = Date.now(); 

  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at) : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at) : null;

  // Questi sono già timestamp UTC in millisecondi
  const promoStartTime = promoStart?.getTime(); 
  const promoEndTime = promoEnd?.getTime(); 

  // Confronta i timestamp UTC
  const isActivePremium = listing.is_premium && promoStartTime && promoEndTime && promoStartTime <= nowUtcTime && promoEndTime >= nowUtcTime;
  const isPendingPremium = listing.is_premium && promoStartTime && promoStartTime > nowUtcTime;

  let photosToRender: { url: string; is_primary: boolean }[] = [];
  
  if (listing.listing_photos && listing.listing_photos.length > 0) {
    // Se l'annuncio è attivamente premium, mostra fino a 5 foto
    if (isActivePremium) {
      photosToRender = listing.listing_photos.slice(0, 5);
    } 
    // Se non è attivamente premium, ma è consentita la visualizzazione di immagini non premium (es. in MyListings), mostra 1 foto
    else if (allowNonPremiumImage) { 
      photosToRender = listing.listing_photos.slice(0, 1);
    }
    // Se non è attivamente premium E allowNonPremiumImage è false (come in SearchResults), photosToRender rimane vuoto.
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
    <Card className={cn(
      "w-full overflow-hidden transition-shadow hover:shadow-md flex flex-col md:flex-row relative", 
      (canEdit || canManagePhotos || canDelete) && isPendingPremium && "border-2 border-blue-400 shadow-lg bg-blue-50" 
    )}>
      <div className="flex flex-col sm:flex-row w-full">
        {hasPhotosToRender && (
          <div className="md:w-1/5 lg:w-1/6 flex-shrink-0 relative"> {/* Ridotto da 1/4 e 1/5 */}
            <AspectRatio ratio={3 / 4} className="w-full h-full">
              <Link to={`/listing/${listing.id}`} className="block w-full h-full">
                <WatermarkedImage src={photosToRender[0].url} alt={listing.title} imageClassName="object-cover" />
              </Link>
            </AspectRatio>
            {listing.is_premium && photosToRender.length > 1 && (
              <Badge className="absolute bottom-1 right-1 bg-black/60 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5"> {/* Ridotto padding e gap */}
                <Camera className="h-2.5 w-2.5" /> {photosToRender.length} {/* Ridotto icona */}
              </Badge>
            )}
          </div>
        )}
        <Link to={`/listing/${listing.id}`} className={cn(
          "flex-grow block hover:bg-gray-50/50",
          !hasPhotosToRender && "w-full"
        )}>
          <div className="p-3 flex flex-col flex-grow"> {/* Ridotto da p-4 a p-3 */}
            {/* Data di pubblicazione come Badge */}
            <Badge variant="outline" className="w-fit mb-1 text-xs">
              <CalendarDays className="h-2.5 w-2.5 mr-1" /> {/* Ridotto icona */}
              <span>{prefix} {formattedDate}</span>
            </Badge>
            {/* Categoria */}
            <div className="flex items-center gap-1.5 mb-1.5"> {/* Ridotto gap e mb */}
              <Badge variant="secondary" className="capitalize text-xs"><Tag className="h-3 w-3 mr-1" />{listing.category.replace(/-/g, ' ')}</Badge> {/* Ridotto icona e font */}
            </div>
            {/* Titolo */}
            <h3 className="text-lg font-semibold mb-1.5 text-rose-600 line-clamp-2">{listing.title}</h3> {/* Ridotto da text-xl a text-lg e mb */}
            {/* Descrizione */}
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">{listing.description}</p> {/* Ridotto da text-base a text-sm e mb */}
            {/* Tag di città/zona */}
            <div className="flex flex-wrap gap-1.5 mb-1"> {/* Ridotto gap */}
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-2.5 w-2.5 mr-1" /> {listing.city}{listing.zone && ` / ${listing.zone}`} {/* Ridotto icona e font */}
              </Badge>
            </div>
            {/* Tag età */}
            {listing.age && (
              <div className="flex flex-wrap gap-1.5 mb-2"> {/* Ridotto gap e mb */}
                <Badge variant="outline" className="text-xs">
                  <User className="h-2.5 w-2.5 mr-1" /> {listing.age} anni {/* Ridotto icona e font */}
                </Badge>
              </div>
            )}
          </div>
        </Link>
      </div>
      {(canEdit || canManagePhotos || canDelete) && (
        <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-center items-center gap-1.5 p-3 border-t md:border-t-0 md:border-l"> {/* Ridotto gap e padding */}
          {canEdit && (
            <Link to={`/edit-listing/${listing.id}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full h-8 px-2 text-xs"> {/* Ridotto altezza e padding */}
                <Pencil className="h-3 w-3 md:mr-1.5" /> {/* Ridotto icona */}
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

          {isActivePremium || isPendingPremium ? ( 
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className={cn(
                    "w-full h-8 px-2 text-xs flex items-center gap-0.5", {/* Ridotto altezza, padding e gap */}
                    isActivePremium ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  <Rocket className="h-3 w-3" /> {isActivePremium ? 'In Evidenza' : 'In Attesa'} {/* Ridotto icona */}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Promozione {isActivePremium ? 'Attiva' : 'In Attesa'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {getPromotionPeriodDetails()}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Chiudi</AlertDialogCancel>
                  {!isAdminContext && listing.promotion_mode && ( 
                    <Link to={`/promote-listing/${listing.id}?mode=${listing.promotion_mode}`}>
                      <AlertDialogAction className="bg-rose-500 hover:bg-rose-600">
                        Estendi
                      </AlertDialogAction>
                    </Link>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            !isAdminContext && (
              <Link to={`/promote-listing/${listing.id}`} className="w-full">
                <Button variant="default" size="sm" className="w-full h-8 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"> {/* Ridotto altezza e padding */}
                  <Rocket className="h-3 w-3 md:mr-1.5" /> {/* Ridotto icona */}
                  <span className="hidden md:inline">Promuovi</span>
                </Button>
              </Link>
            )
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full h-8 px-2 text-xs" disabled={isDeleting}> {/* Ridotto altezza e padding */}
                  <Trash2 className="h-3 w-3 md:mr-1.5" /> {/* Ridotto icona */}
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
      {/* Il badge è ora un figlio diretto della Card e posizionato all'interno */}
      {!(canEdit || canManagePhotos || canDelete) && isActivePremium && (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white absolute top-1 right-1 z-20 text-xs px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"> {/* Ridotto padding e gap */}
          <Rocket className="h-2.5 w-2.5 mr-0.5" /> In Evidenza {/* Ridotto icona */}
        </Badge>
      )}
    </Card>
  );
};