import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CalendarDays, Rocket, User } from "lucide-react";
import { format } from 'date-fns';
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

export interface Listing {
  id: string;
  title: string;
  category: string;
  city: string;
  created_at: string;
  expires_at: string;
  is_premium: boolean;
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
  const primaryPhoto = listing.listing_photos.find(p => p.is_primary)?.url || listing.listing_photos[0]?.url;

  const dateToDisplay = showExpiryDate ? new Date(listing.expires_at) : new Date(listing.created_at);
  const prefix = showExpiryDate ? 'Scade il:' : '';
  const dateFormat = showExpiryDate ? 'dd MMMM yyyy' : 'dd MMMM';

  const formattedDate = !isNaN(dateToDisplay.getTime()) 
    ? format(dateToDisplay, dateFormat, { locale: it }) 
    : 'N/D';

  const handlePromoteListing = async (listingId: string) => {
    const toastId = showLoading('Promozione annuncio in corso...');
    try {
      const { error } = await supabase.functions.invoke('promote-listing', {
        body: { listingId },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante la promozione dell\'annuncio.';
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

      showSuccess('Annuncio promosso a premium con successo!');
      onListingUpdated?.(); // Trigger refresh
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    }
  };

  return (
    <Card className="w-full overflow-hidden transition-shadow hover:shadow-md flex flex-col md:flex-row">
      <Link to={`/listing/${listing.id}`} className="flex-grow block hover:bg-gray-50/50">
        <div className="flex flex-col sm:flex-row">
          {primaryPhoto && listing.is_premium && ( // Mostra la foto solo se l'annuncio è premium
            <div className="sm:w-1/4 lg:w-1/5 flex-shrink-0">
              <img src={primaryPhoto} alt={listing.title} className="object-cover w-full h-48 sm:h-full" />
            </div>
          )}
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
              {listing.is_premium && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Rocket className="h-3 w-3 mr-1" /> Premium
                </Badge>
              )}
            </div>
            <div className="mt-auto flex items-center text-xs text-gray-500">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span>{prefix} {formattedDate}</span>
            </div>
          </div>
        </div>
      </Link>
      {showControls && (
        <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-center items-center gap-2 p-4 border-t md:border-t-0 md:border-l">
           <Link to={`/edit-listing/${listing.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              <Pencil className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Modifica</span>
            </Button>
          </Link>
          {!listing.is_premium && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white">
                  <Rocket className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Promuovi</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Promuovi Annuncio a Premium</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler promuovere questo annuncio a Premium? Ti costerà 20 crediti.
                    Gli annunci Premium appaiono in cima ai risultati di ricerca e possono avere fino a 5 foto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handlePromoteListing(listing.id)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Sì, Promuovi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="destructive" size="sm" className="w-full">
            <Trash2 className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Elimina</span>
          </Button>
        </div>
      )}
    </Card>
  );
};