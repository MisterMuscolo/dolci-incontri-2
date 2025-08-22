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

  const now = new Date(); // Ora locale del client
  const nowTime = now.getTime(); // Timestamp in millisecondi dell'ora locale del client

  const promoStart = listing.promotion_start_at ? new Date(listing.promotion_start_at) : null;
  const promoEnd = listing.promotion_end_at ? new Date(listing.promotion_end_at) : null;

  const promoStartTime = promoStart?.getTime(); // Timestamp in millisecondi (UTC)
  const promoEndTime = promoEnd?.getTime(); // Timestamp in millisecondi (UTC)

  // Confronta i timestamp per determinare lo stato della promozione
  const isActivePremium = listing.is_premium && promoStartTime && promoEndTime && promoStartTime <= nowTime && promoEndTime >= nowTime;
  const isPendingPremium = listing.is_premium && promoStartTime && promoStartTime > nowTime;

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
          <div className="md:w-1/4 lg:w-1/5 flex-shrink-0 relative">
            <AspectRatio ratio={3 / 4} className="w-full h-full">
              <Link to={`/listing/${listing.id}`} className="block w-full h-full">
                <WatermarkedImage src={photosToRender[0].url} alt={listing.title} imageClassName="object-cover" />
              </Link>
            </AspectRatio>
            {listing.is_premium && photosToRender.length > 1 && (
              <Badge className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Camera className="h-3 w-3" /> {photosToRender.length}
              </Badge>
            )}
          </div>
        )}
        <Link to={`/listing/${listing.id}`} className={cn(
          "flex-grow block hover:bg-gray-50/50",
          !hasPhotosToRender && "w-full"
        )}>
          <div className="p-4 flex flex-col flex-grow">
            {/* Data di pubblicazione come Badge */}
            <Badge variant="outline" className="w-fit mb-1 text-xs">
              <CalendarDays className="h-3 w-3 mr-1" />
              <span>{prefix} {formattedDate}</span>
            </Badge>
            {/* Categoria */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize"><Tag className="h-4 w-4 mr-1.5" />{listing.category.replace(/-/g, ' ')}</Badge>
            </div>
            {/* Titolo */}
            <h3 className="text-xl font-semibold mb-2 text-rose-600 line-clamp-2">{listing.title}</h3>
            {/* Descrizione */}
            <p className="text-base text-gray-600 mb-3 line-clamp-3">{listing.description}</p>
            {/* Tag di città/zona */}
            <div className="flex flex-wrap gap-2 mb-1">
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" /> {listing.city}{listing.zone && ` / ${listing.zone}`}
              </Badge>
            </div>
            {/* Tag età */}
            {listing.age && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" /> {listing.age} anni
                </Badge>
              </div>
            )}
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

          {isActivePremium || isPendingPremium ? ( 
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className={cn(
                    "w-full text-white flex items-center gap-1",
                    isActivePremium ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  <Rocket className="h-4 w-4" /> {isActivePremium ? 'In Evidenza' : 'In Attesa'}
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
      {/* Il badge è ora un figlio diretto della Card e posizionato all'interno */}
      {!(canEdit || canManagePhotos || canDelete) && isActivePremium && (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white absolute top-2 right-2 z-20 text-xs px-2 py-0.5 rounded-full font-semibold">
          <Rocket className="h-3 w-3 mr-1" /> In Evidenza
        </Badge>
      )}
    </Card>
  );
};