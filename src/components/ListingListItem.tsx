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
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { cn } from '@/lib/utils'; // Importa la funzione cn
import { AspectRatio } from '@/components/ui/aspect-ratio'; // Import AspectRatio

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

  // La logica di promozione è stata spostata nella pagina PromoteListingOptions
  // Questo componente ora reindirizza semplicemente a quella pagina.

  return (
    <Card className={cn(
      "w-full overflow-hidden transition-shadow hover:shadow-md flex flex-col md:flex-row relative",
      listing.is_premium && "border-2 border-rose-500 shadow-lg bg-rose-50" 
    )}>
      <div className="flex flex-col sm:flex-row w-full">
        {listing.is_premium && listing.listing_photos.length > 0 ? (
          <div className="sm:w-1/4 lg:w-1/5 flex-shrink-0 relative">
            {/* Use AspectRatio for consistent image display */}
            <AspectRatio ratio={16 / 9} className="w-full h-full"> {/* Adjust ratio as needed */}
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
                className="w-full h-full" // Make carousel fill AspectRatio container
              >
                <CarouselContent className="h-full">
                  {listing.listing_photos.map((photo, index) => (
                    <CarouselItem key={index} className="h-full">
                      <Link to={`/listing/${listing.id}`} className="block w-full h-full">
                        <img src={photo.url} alt={`${listing.title} - ${index + 1}`} className="object-cover w-full h-full" />
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {listing.listing_photos.length > 1 && (
                  <>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                  </>
                )}
              </Carousel>
            </AspectRatio>
          </div>
        ) : (
          // If not premium, show a placeholder or nothing if no primary photo
          primaryPhoto ? (
            <div className="sm:w-1/4 lg:w-1/5 flex-shrink-0 relative">
              <AspectRatio ratio={16 / 9} className="w-full h-full">
                <Link to={`/listing/${listing.id}`} className="block w-full h-full">
                  <img src={primaryPhoto} alt={listing.title} className="object-cover w-full h-full" />
                </Link>
              </AspectRatio>
            </div>
          ) : null
        )}
        {/* This Link wraps the textual content */}
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
      {/* This badge is for when showControls is FALSE (e.g., search results) */}
      {!showControls && listing.is_premium && (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white absolute top-2 right-2 z-20">
          <Rocket className="h-3 w-3 mr-1" /> Premium
        </Badge>
      )}
      {showControls && (
        <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-center items-center gap-2 p-4 border-t md:border-t-0 md:border-l">
           <Link to={`/edit-listing/${listing.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              <Pencil className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Modifica</span>
            </Button>
          </Link>
          {listing.is_premium ? (
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
                  <AlertDialogTitle>Annuncio Premium</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questo annuncio è già Premium. Gli annunci Premium appaiono in cima ai risultati di ricerca e possono avere fino a 5 foto.
                    <br/><br/>
                    Vuoi estendere la sua visibilità o acquistare più crediti?
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
          <Button variant="destructive" size="sm" className="w-full">
            <Trash2 className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Elimina</span>
          </Button>
        </div>
      )}
    </Card>
  );
};