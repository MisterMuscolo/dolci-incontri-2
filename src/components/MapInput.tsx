import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast';

// Fix default icon issues with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapInputProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddressText?: string | null;
  initialCity?: string | null; // Used for pre-centering the map
  onLocationChange: (latitude: number | null, longitude: number | null, addressText: string | null) => void;
  disabled?: boolean;
}

const MapEventsHandler: React.FC<{ onMoveEnd: (map: L.Map) => void }> = ({ onMoveEnd }) => {
  const map = useMapEvents({
    moveend: () => {
      onMoveEnd(map);
    },
  });
  return null;
};

export const MapInput: React.FC<MapInputProps> = ({
  initialLatitude,
  initialLongitude,
  initialAddressText,
  initialCity,
  onLocationChange,
  disabled = false,
}) => {
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([41.902782, 12.496366]); // Default to Rome
  const [mapZoom, setMapZoom] = useState(6);
  const [markerPosition, setMarkerPosition] = useState<L.LatLngExpression | null>(null);
  const [addressInput, setAddressInput] = useState(initialAddressText || '');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const isInitialLoad = useRef(true);

  // Effect to set initial map state based on props
  useEffect(() => {
    if (isInitialLoad.current) {
      if (initialLatitude && initialLongitude) {
        setMapCenter([initialLatitude, initialLongitude]);
        setMarkerPosition([initialLatitude, initialLongitude]);
        setMapZoom(13); // Zoom in for specific coordinates
        onLocationChange(initialLatitude, initialLongitude, initialAddressText);
      } else if (initialCity) {
        // Geocode initialCity to set map center
        handleGeocodeAddress(initialCity, true);
      }
      isInitialLoad.current = false;
    }
  }, [initialLatitude, initialLongitude, initialAddressText, initialCity, onLocationChange]);

  // Effect to update address input if initialAddressText changes externally
  useEffect(() => {
    setAddressInput(initialAddressText || '');
  }, [initialAddressText]);

  const handleGeocodeAddress = useCallback(async (address: string, isInitial = false) => {
    if (!address.trim()) return;
    setIsLoading(true);
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}, Italy&format=json&limit=1`;
      const response = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'IncontriDolciApp/1.0 (contact@incontridolci.it)' },
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        setMapCenter([newLat, newLon]);
        setMarkerPosition([newLat, newLon]);
        setMapZoom(13);
        setAddressInput(display_name);
        onLocationChange(newLat, newLon, display_name);
      } else {
        if (!isInitial) showError('Indirizzo non trovato. Prova a essere più specifico.');
        onLocationChange(null, null, null); // Clear location if not found
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      if (!isInitial) showError('Errore durante la ricerca dell\'indirizzo.');
      onLocationChange(null, null, null);
    } finally {
      setIsLoading(false);
    }
  }, [onLocationChange]);

  const handleReverseGeocode = useCallback(async (lat: number, lon: number) => {
    setIsLoading(true);
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const response = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'IncontriDolciApp/1.0 (contact@incontridolci.it)' },
      });
      const data = await response.json();

      if (data && data.display_name) {
        setAddressInput(data.display_name);
        onLocationChange(lat, lon, data.display_name);
      } else {
        showError('Impossibile trovare l\'indirizzo per queste coordinate.');
        onLocationChange(lat, lon, null); // Keep coordinates, but clear address text
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      showError('Errore durante la geocodifica inversa.');
      onLocationChange(lat, lon, null);
    } finally {
      setIsLoading(false);
    }
  }, [onLocationChange]);

  const onMarkerDragEnd = useCallback((event: L.LeafletEvent) => {
    const marker = event.target;
    const position = marker.getLatLng();
    setMarkerPosition(position);
    handleReverseGeocode(position.lat, position.lng);
  }, [handleReverseGeocode]);

  const handleMapMoveEnd = useCallback((map: L.Map) => {
    if (!markerPosition) {
      // If no marker is set, set it to the center of the map after initial load
      const center = map.getCenter();
      setMarkerPosition(center);
      handleReverseGeocode(center.lat, center.lng);
    }
  }, [markerPosition, handleReverseGeocode]);

  const handleClearLocation = () => {
    setMarkerPosition(null);
    setAddressInput('');
    setMapCenter([41.902782, 12.496366]); // Reset to Rome
    setMapZoom(6);
    onLocationChange(null, null, null);
  };

  return (
    <div className={cn("space-y-4", disabled && "opacity-50 pointer-events-none")}>
      <Label htmlFor="address-search">Indirizzo (Via, Civico, Città)</Label>
      <div className="flex gap-2">
        <Input
          id="address-search"
          type="text"
          placeholder="Cerca un indirizzo o trascina il marker"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleGeocodeAddress(addressInput);
            }
          }}
          disabled={isLoading || disabled}
        />
        <Button type="button" onClick={() => handleGeocodeAddress(addressInput)} disabled={isLoading || disabled}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {isLoading && (
        <div className="flex items-center text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Caricamento posizione...
        </div>
      )}

      <div className="relative h-80 w-full rounded-md overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => { mapRef.current = map; }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler onMoveEnd={handleMapMoveEnd} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              eventHandlers={{ dragend: onMarkerDragEnd }}
            >
              <Popup>
                Posizione selezionata: <br />
                Lat: {typeof markerPosition[0] === 'number' ? markerPosition[0].toFixed(4) : ''} <br />
                Lon: {typeof markerPosition[1] === 'number' ? markerPosition[1].toFixed(4) : ''} <br />
                {addressInput && `Indirizzo: ${addressInput}`}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <Button type="button" variant="outline" onClick={handleClearLocation} disabled={disabled}>
        Cancella Posizione
      </Button>
    </div>
  );
};