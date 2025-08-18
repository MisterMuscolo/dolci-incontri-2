import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MapPin } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  city: string;
  photo_url: string | null;
}

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link to={`/listings/${listing.id}`} className="group">
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <AspectRatio ratio={4 / 3}>
          <img
            src={listing.photo_url || '/placeholder.svg'}
            alt={listing.title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        </AspectRatio>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate group-hover:text-rose-600 transition-colors">
            {listing.title}
          </h3>
        </CardContent>
        <CardFooter className="p-4 pt-0">
           <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1.5" />
            <span>{listing.city}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};