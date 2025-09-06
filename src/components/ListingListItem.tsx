import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CalendarDays, Rocket, User, Camera, MapPin, Tag, Flame } from "lucide-react";
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
  expires_at: string;
  is_premium: boolean;
  promotion_mode: string | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  last_bumped_at: string | null;
  listing_photos: { url: string; is_primary: boolean }[];
  age?: number;
  zone?: string | null;
}

interface ListingListItemProps {
  listing: Listing;
  canEdit?: boolean;
  canManagePhotos?: boolean;
  canDelete?: boolean;
  onListingUpdated?: () => void;
  isAdminContext?: boolean;
  allowNonPremiumImage?: boolean;
  isCompact?: boolean; // Nuova prop per la modalità compatta
  dateTypeToDisplay?: 'created_at' | 'expires_at'; // Nuova prop per scegliere la data da visualizzare
}

export const ListingListItem = ({ listing, canEdit = false, canManagePhotos = false, canDelete = false, onListingUpdated, isAdminContext = false, allowNonPremiumImage = true, isCompact = false, dateTypeToDisplay = 'expires_at' }: ListingListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const nowUtcTime = Date.now(); 

  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at) : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at) : null;

  const promoStartTime = promoStart?.getTime(); 
  const promoEndTime = promoEnd?.getTime(); 

  const isActivePremium = listing.is_premium && promoStartTime && promoEndTime && promoStartTime <= nowUtcTime && promoEndTime >= nowUtcTime;
  const isPendingPremium = listing.is_premium && promoStartTime && promoStartTime > nowUtcTime;

  let photosToRender: { url: string; is_primary: boolean }[] = [];
  
  if (listing.listing_photos && listing.listing_photos.length > 0) {
    if (isActivePremium) {
      photosToRender = listing.listing_photos.slice(0, 5);
    } 
    else if (allowNonPremiumImage) { 
      photosToRender = listing.listing_photos.slice(0, 1);
    }
  }

  const hasPhotosToRender = photosToRender.length > 0;

  // Logica per la data da visualizzare basata su dateTypeToDisplay
  let dateToDisplay: Date;
  let prefix: string;
  let currentDateFormat: string; // Nuovo stato per il formato della data

  if (dateTypeToDisplay === 'created_at') {
    dateToDisplay = new Date(listing.created_at);
    if (isCompact) { // Se è in modalità compatta (es. annunci premium in SearchResults)
      prefix = ''; // Nessun prefisso
      currentDateFormat = 'dd MMMM'; // Formato più conciso
    } else {
      prefix = 'Pubblicato il:';
      currentDateFormat = 'dd MMMM yyyy'; // Formato completo
    }
  } else { // Default a 'expires_at'
    dateToDisplay = new Date(listing.expires_at);
    prefix = 'Scade il:';
    currentDateFormat = 'dd MMMM yyyy'; // Formato completo
  }

  const formattedDate = !isNaN(dateToDisplay.getTime()) 
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
      "w-full overflow-hidden transition-shadow hover:shadow-md flex relative", // Always flex-row
      (canEdit || canManagePhotos || canDelete) && isPendingPremium && "border-2 border-blue-400 shadow-lg bg-blue-50"
    )}>
      {hasPhotosToRender && (
        <div className="flex-shrink-0 relative w-24 sm:w-32 h-auto"> {/* Reduced width for image container */}
          <AspectRatio ratio={9 / 16} className="w-full h-full"> {/* 9:16 aspect ratio */}
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
        <div className={cn("p-3 flex flex-col flex-grow", isCompact && "p-2")}> {/* Adjusted padding for compact */}
          <Badge variant="outline" className="w-fit mb-1 text-xs"> {/* Smaller text for badge */}
            <CalendarDays className="h-3 w-3 mr-1" /> {/* Smaller icon */}
            <span>{prefix} {formattedDate}</span>
          </Badge>
          <div className="flex items-center gap-1 mb-1"> {/* Smaller gap */}
            <Badge variant="secondary" className="capitalize text-xs"><Tag className="h-3 w-3 mr-1" />{listing.category.replace(/-/g, ' ')}</Badge> {/* Smaller text for badge */}
          </div>
          <h3 className={cn("text-lg font-semibold mb-1 text-rose-600 line-clamp-2", isCompact && "text-base")}>{listing.title}</h3> {/* Smaller text for title */}
          <p className={cn("text-sm text-gray-600 mb-2 line-clamp-3", isCompact && "text-xs line-clamp-2")}>{listing.description}</p> {/* Smaller text for description */}
          <div className="flex flex-wrap gap-1 mb-1"> {/* Smaller gap */}
            <Badge variant="outline" className="text-xs"> {/* Smaller text for badge */}
              <MapPin className="h-3 w-3 mr-1" /> {listing.city}{listing.zone && ` / ${listing.zone}`}
            </Badge>
          </div>
          {listing.age && (
            <div className="flex flex-wrap gap-1 mb-2"> {/* Smaller gap */}
              <Badge variant="outline" className="text-xs"> {/* Smaller text for badge */}
                <User className="h-3 w-3 mr-1" /> {listing.age} anni
              </Badge>
            </div>
          )}
        </div>
      </Link>
      {(canEdit || canManagePhotos || canDelete) && (
        <div className="flex-shrink-0 flex flex-col justify-center items-center gap-2 p-3 border-l"> {/* Adjusted padding */}
          {canEdit && (
            <Link to={`/edit-listing/${listing.id}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full h-8 px-2 text-xs"> {/* Smaller button */}
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

          {isActivePremium || isPendingPremium ? ( 
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className={cn(
                    "w-full h-8 px-2 text-xs flex items-center gap-1", // Smaller button
                    isActivePremium ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  <Flame className="h-3 w-3" /> {isActivePremium ? 'Hot' : 'In Attesa'}
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
                <Button variant="default" size="sm" className="w-full h-8 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"> {/* Smaller button */}
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
                  className="w-full h-8 px-2 text-xs bg-blue-500 hover:bg-blue-600 text-white" // Smaller button
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
      {!(canEdit || canManagePhotos || canDelete) && isActivePremium && (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5"> {/* Smaller badge */}
          <Flame className="h-3 w-3 mr-0.5" /> Hot
        </Badge>
      )}
    </Card>
  );
};