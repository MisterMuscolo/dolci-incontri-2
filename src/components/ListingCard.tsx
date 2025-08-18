import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Listing {
  id: string;
  title: string;
  category: string;
  city: string;
  listing_photos: { url: string; is_primary: boolean }[];
}

interface ListingCardProps {
  listing: Listing;
  showControls?: boolean;
}

export const ListingCard = ({ listing, showControls = false }: ListingCardProps) => {
  const primaryPhoto = listing.listing_photos.find(p => p.is_primary)?.url || listing.listing_photos[0]?.url;

  return (
    <Card className="flex flex-col h-full">
      {primaryPhoto && (
        <CardHeader className="p-0">
          <AspectRatio ratio={16 / 9} className="rounded-t-lg overflow-hidden">
            <img src={primaryPhoto} alt={listing.title} className="object-cover w-full h-full" />
          </AspectRatio>
        </CardHeader>
      )}
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-lg mb-2 line-clamp-2">{listing.title}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">{listing.category.replace(/-/g, ' ')}</Badge>
          <Badge variant="outline">{listing.city}</Badge>
        </div>
      </CardContent>
      {showControls && (
        <CardFooter className="flex justify-end gap-2 p-4 pt-0">
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Modifica
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};