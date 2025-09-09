import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapPin, Heart, User, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WatermarkedImage } from './WatermarkedImage';
import { Button } from '@/components/ui/button'; // Importa il componente Button

// Fix default icon issues with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export interface MapListing {
  id: string;
  title: string;
  category: string;
  city: string;
  zone: string | null;
  age: number;
  latitude: number;
  longitude: number;
  is_premium: boolean;
  listing_photos: { url: string; is_primary: boolean }[];
}

interface ListingMapProps {
  listings: MapListing[];
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapMove?: (bounds: L.LatLngBounds) => void;
}

const MapEventsHandler: React.FC<{ onMapMove: (bounds: L.LatLngBounds) => void }> = ({ onMapMove }) => {
  const map = useMapEvents({
    moveend: () => {
      onMapMove(map.getBounds());
    },
    zoomend: () => {
      onMapMove(map.getBounds());
    },
  });
  return null;
};

export const ListingMap: React.FC<ListingMapProps> = ({
  listings,
  initialCenter = [41.902782, 12.496366], // Center of Italy (Rome)
  initialZoom = 6,
  onMapMove,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState<number>(initialZoom);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (listings.length > 0) {
      // If there are listings, try to center the map on the first one or a calculated center
      const validListings = listings.filter(l => l.latitude && l.longitude);
      if (validListings.length > 0) {
        const avgLat = validListings.reduce((sum, l) => sum + l.latitude, 0) / validListings.length;
        const avgLon = validListings.reduce((sum, l) => sum + l.longitude, 0) / validListings.length;
        setMapCenter([avgLat, avgLon]);
        setMapZoom(8); // Zoom in a bit when listings are present
      }
    } else {
      setMapCenter(initialCenter);
      setMapZoom(initialZoom);
    }
  }, [listings, initialCenter, initialZoom]);

  const getCategoryLabel = (value: string) => {
    switch (value) {
      case 'donna-cerca-uomo': return '👩‍❤️‍👨 Donna cerca Uomo';
      case 'uomo-cerca-donna': return '👨‍❤️‍👩 Uomo cerca Donna';
      case 'coppie': return '👩‍❤️‍💋‍👨 Coppie';
      case 'uomo-cerca-uomo': return '👨‍❤️‍👨 Uomo cerca Uomo';
      case 'donna-cerca-donna': return '👩‍❤️‍👩 Donna cerca Donna';
      default: return value;
    }
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '8px' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMapMove && <MapEventsHandler onMapMove={onMapMove} />}
      {listings.map((listing) => (
        listing.latitude && listing.longitude && (
          <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
            <Popup>
              <Link to={`/listing/${listing.id}`} className="block w-64">
                <div className="flex flex-col space-y-2">
                  {listing.listing_photos && listing.listing_photos.length > 0 && (
                    <div className="w-full h-32 overflow-hidden rounded-md">
                      <WatermarkedImage
                        src={listing.listing_photos.find(p => p.is_primary)?.url || listing.listing_photos[0].url}
                        alt={listing.title}
                        imageClassName="object-cover w-full h-full"
                        defaultWatermarkIconSizeClass="h-4 w-4"
                        defaultWatermarkTextSizeClass="text-xs"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-rose-600 line-clamp-2">{listing.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="capitalize text-xs">
                      <Heart className="h-3 w-3 mr-1" /> {getCategoryLabel(listing.category).split(' ')[1]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" /> {listing.city}{listing.zone && ` / ${listing.zone}`}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-3 mr-1" /> {listing.age} anni
                    </Badge>
                  </div>
                  <Button size="sm" className="w-full bg-rose-500 hover:bg-rose-600 mt-2">
                    Vedi Dettagli
                  </Button>
                </div>
              </Link>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
};