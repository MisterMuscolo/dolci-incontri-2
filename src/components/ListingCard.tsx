import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Definiamo un tipo per l'oggetto annuncio per avere un codice più pulito e sicuro
export interface Listing {
  id: string;
  title: string;
  category: string;
  city: string;
  listing_photos: { url: string; is_primary: boolean }[];
}

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  // Troviamo la foto principale tra quelle caricate
  const primaryPhoto = listing.listing_photos.find(p => p.is_primary)?.url || listing.listing_photos[0]?.url;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <AspectRatio ratio={16 / 9}>
          {primaryPhoto ? (
            <img src={primaryPhoto} alt={listing.title} className="rounded-t-lg object-cover w-full h-full" />
          ) : (
            <div className="bg-gray-100 rounded-t-lg flex items-center justify-center h-full">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </AspectRatio>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardTitle className="text-lg mb-2">{listing.title}</CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary">{listing.category.replace(/-/g, ' ')}</Badge>
          <Badge variant="outline">{listing.city}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Modifica
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Elimina
        </Button>
      </CardFooter>
    </Card>
  );
};