import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CalendarDays, User, Camera, MapPin, Tag, Flame, PauseCircle, PlayCircle } from "lucide-react"; // Aggiunte PauseCircle, PlayCircle
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
import { WatermarkedImage } from "./WatermarkedImage";

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  created_at: string;
  expires_at: string | null; // Può essere null se in pausa
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  last_bumped_at: string | null;
  listing_photos: { url: string; original_url: string | null; is_primary: boolean }[];
  age?: number;
  zone?: string | null;
  is_paused: boolean; // Nuovo campo
  paused_at: string | null; // Nuovo campo
  remaining_expires_at_duration: string | null; // Nuovo campo
  remaining_promotion_duration: string | null; // Nuovo campo
}

interface ListingListItemProps {
  listing: Listing;
  canEdit?: boolean;
  canManagePhotos?: boolean;
  canDelete?: boolean;
  canPauseResume?: boolean; // Nuovo prop
  onListingUpdated?: () => void;
  isAdminContext?: boolean;
  allowNonPremiumImage?: boolean;
  isCompact?: boolean;
  dateTypeToDisplay?: 'created_at' | 'expires_at';
}

export const ListingListItem = ({ listing, canEdit = false, canManagePhotos = false, canDelete = false, canPauseResume = false, onListingUpdated, isAdminContext = false, allowNonPremiumImage = true, isCompact = false, dateTypeToDisplay = 'expires_at' }: ListingListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausingResuming, setIsPausingResuming] = useState(false);

  const nowUtcTime = Date.now(); 

  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at) : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at) : null;

  const promoStartTime = promoStart?.getTime(); 
  const promoEndTime = promoEnd?.getTime(); 

  const isActivePremium = listing.is_premium && promoStartTime && promoEndTime && promoStartTime <= nowUtcTime && promoEndTime >= nowUtcTime && !listing.is_paused;
  const isPendingPremium = listing.is_premium && promoStartTime && promoStartTime > nowUtcTime && !listing.is_paused;

  let photosToRender: { url: string; original_url: string | null; is_primary: boolean }[] = [];
  
  if (listing.listing_photos && listing.listing_photos.length > 0) {
    if (isActivePremium) {
      photosToRender = listing.listing_photos.slice(0, 5);
    } 
    else if (allowNonPremiumImage) { 
      photosToRender = listing.listing_photos.slice(0, 1);
    }
  }

  const hasPhotosToRender = photosToRender.length > 0;

  let dateToDisplay: Date | null = null;
  let prefix: string;
  let currentDateFormat: string;

  if (dateTypeToDisplay === 'created_at') {
    dateToDisplay = new Date(listing.created_at);
    if (isCompact) {
      prefix = '';
      currentDateFormat = 'dd MMMM';
    } else {
      prefix = 'Pubblicato il:';
      currentDateFormat = 'dd MMMM yyyy';
    }
  } else {
    if (listing.expires_at) {
      dateToDisplay = new Date(listing.expires_at);
    }
    prefix = 'Scade il:';
    currentDateFormat = 'dd MMMM yyyy';
  }

  const formattedDate = dateToDisplay && !isNaN(dateToDisplay.getTime()) 
    ? format(dateToDisplay, currentDateFormat, { locale: it }) 
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
      // Fetch all photos associated with the listing to delete both cropped and original
      const { data: listingPhotos, error: fetchPhotosError } = await supabase
        .from('listing_photos')
        .select('url, original_url')
        .eq('listing_id', listing.id);

      if (fetchPhotosError) {
        console.warn(`Could not fetch photos for listing ${listing.id}:`, fetchPhotosError.message);
      } else if (listingPhotos && listingPhotos.length > 0) {
        const filePathsToDelete: string[] = [];
        listingPhotos.forEach(photo => {
          const croppedUrlParts = photo.url.split('/');
          const croppedFilename = croppedUrlParts[croppedUrlParts.length - 1];
          filePathsToDelete.push(`${listing.user_id}/${listing.id}/${croppedFilename}`);

          if (photo.original_url) {
            const originalUrlParts = photo.original_url.split('/');
            const originalFilename = originalUrlParts[originalUrlParts.length - 1];
            filePathsToDelete.push(`${listing.user_id}/${listing.id}/${originalFilename}`);
          }
        });

        const { error: deletePhotoError } = await supabase.storage
          .from('listing_photos')
          .remove(filePathsToDelete);

        if (deletePhotoError) {
          console.warn(`Could not delete photos for listing ${listing.id} (title: ${listing.title}) from storage: ${deletePhotoError.message}`);
        }
      }

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

  const handlePauseResumeListing = async (action: 'pause' | 'resume') => {
    setIsPausingResuming(true);
    const toastId = showLoading(action === 'pause' ? 'Mettendo in pausa annuncio...' : 'Riprendendo annuncio...');

    try {
      const { error } = await supabase.functions.invoke('pause-resume-listing', {
        body: { listingId: listing.id, action },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = `Errore durante la ${action === 'pause' ? 'pausa' : 'ripresa'} dell'annuncio.`;
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
        throw new Error(errorMessage);
      }

      showSuccess(`Annuncio ${action === 'pause' ? 'messo in pausa' : 'ripreso'} con successo!`);
      if (onListingUpdated) {
        onListingUpdated();
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsPausingResuming(false);
    }
  };

  return (
    <Card className={cn(
      "w-full overflow-hidden transition-shadow hover:shadow-md flex relative",
      (canEdit || canManagePhotos || canDelete || canPauseResume) && isPendingPremium && "border-2 border-blue-400 shadow-lg bg-blue-50",
      listing.is_paused && "border-2 border-gray-400 bg-gray-100 opacity-70" // Stile per annuncio in pausa
    )}>
      {hasPhotosToRender && (
        <div className="flex-shrink-0 relative w-32 sm:w-44 h-auto">
          <AspectRatio ratio={4 / 5} className="w-full h-full">
            <Link to={`/listing/${listing.id}`} className="block w-full h-full">
              <WatermarkedImage src={photosToRender[0].url} alt={listing.title} imageClassName="object-cover" />
            </Link>
          </AspectRatio>
          {listing.is_premium && photosToRender.length > 1 && (
            <Badge className="absolute bottom-1 right-1 bg-black/60 text-white px-2 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Camera className="h-3 w-3" /> {photosToRender.length}
            </Badge>
          )}
        </div>
      )}
      <Link to={`/listing/${listing.id}`} className={cn(
        "flex-grow block hover:bg-gray-50/50",
        !hasPhotosToRender && "w-full"
      )}>
        <div className={cn("p-3 flex flex-col flex-grow", isCompact && "p-2")}>
          <Badge variant="outline" className="w-fit mb-1 text-xs">
            <CalendarDays className="h-3 w-3 mr-1" />
            <span>{prefix} {formattedDate}</span>
          </Badge>
          <div className="flex items-center gap-1 mb-1">
            <Badge variant="secondary" className="capitalize text-xs"><Tag className="h-3 w-3 mr-1" />{listing.category.replace(/-/g, ' ')}</Badge>
          </div>
          <h3 className="text-lg font-semibold mb-1 text-rose-600 line-clamp-2">{listing.title}</h3>
          <p className={cn("text-sm text-gray-600 mb-2 line-clamp-3", isCompact && "text-xs line-clamp-2")}>{listing.description}</p>
          <div className="flex flex-wrap gap-1 mb-1">
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" /> {listing.city}{listing.zone && ` / ${listing.zone}`}
            </Badge>
          </div>
          {listing.age && (
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" /> {listing.age} anni
              </Badge>
            </div>
          )}
        </div>
      </Link>
      {(canEdit || canManagePhotos || canDelete || canPauseResume) && (
        <div className="flex-shrink-0 flex flex-col justify-center items-center gap-2 p-3 border-l">
          {canEdit && (
            <Link to={`/edit-listing/${listing.id}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full h-8 px-2 text-xs">
                <Pencil className="h-3 w-3 md:mr-1" />
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

          {canPauseResume && (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full h-8 px-2 text-xs",
                listing.is_paused ? "border-green-500 text-green-600 hover:bg-green-50" : "border-gray-500 text-gray-600 hover:bg-gray-50"
              )}
              onClick={() => handlePauseResumeListing(listing.is_paused ? 'resume' : 'pause')}
              disabled={isPausingResuming}
            >
              {isPausingResuming ? (
                <span className="flex items-center"><PlayCircle className="h-3 w-3 mr-1 animate-spin" /> Caricamento...</span>
              ) : listing.is_paused ? (
                <span className="flex items-center"><PlayCircle className="h-3 w-3 mr-1" /> Riprendi</span>
              ) : (
                <span className="flex items-center"><PauseCircle className="h-3 w-3 mr-1" /> Pausa</span>
              )}
            </Button>
          )}

          {isActivePremium || isPendingPremium ? ( 
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className={cn(
                    "w-full h-8 px-2 text-xs flex items-center gap-1",
                    isActivePremium ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-500 hover:bg-blue-600"
                  )}
                  disabled={listing.is_paused} // Disabilita se in pausa
                >
                  <Flame className="h-3 w-3" /> {isActivePremium ? 'Hot' : 'In Attesa'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Promozione {isActivePremium ? 'Attiva' : 'In Attesa'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {listing.is_paused ? (
                      <p className="text-red-500">L'annuncio è in pausa. La promozione non è attiva.</p>
                    ) : (
                      getPromotionPeriodDetails()
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Chiudi</AlertDialogCancel>
                  {!isAdminContext && listing.promotion_mode && !listing.is_paused && ( 
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
            !isAdminContext && !listing.is_paused && ( // Non mostrare "Promuovi" se in pausa
              <Link to={`/promote-listing/${listing.id}`} className="w-full">
                <Button variant="default" size="sm" className="w-full h-8 px-2 text-xs bg-green-500 hover:bg-green-600 text-white">
                  <Flame className="h-3 w-3 md:mr-1" />
                  <span className="hidden md:inline">Promuovi</span>
                </Button>
              </Link>
            )
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full h-8 px-2 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3 md:mr-1" />
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
      {!(canEdit || canManagePhotos || canDelete || canPauseResume) && isActivePremium && (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5">
          <Flame className="h-3 w-3 mr-0.5" /> Hot
        </Badge>
      )}
      {listing.is_paused && (
        <Badge className="bg-gray-600 text-white absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5">
          <PauseCircle className="h-3 w-3 mr-0.5" /> In Pausa
        </Badge>
      )}
    </Card>
  );
};