"use client";

import { MapPin } from 'lucide-react';

interface StaticMapDisplayProps {
  latitude: number;
  longitude: number;
  addressText?: string | null;
  zoom?: number;
  width?: number;
  height?: number;
}

export const StaticMapDisplay = ({ latitude, longitude, addressText, zoom = 13, width = 600, height = 250 }: StaticMapDisplayProps) => {
  // If coordinates are invalid, display a specific error message.
  if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded-md text-gray-600 text-center p-4">
        <MapPin className="h-8 w-8 text-gray-500 mr-2" />
        Coordinate mappa non valide per la visualizzazione.
      </div>
    );
  }

  const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`;

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden">
      <img
        src={mapImageUrl}
        alt={addressText || "Mappa della località"}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
        <MapPin className="h-10 w-10 mx-auto mb-2 text-rose-300" />
        <p className="text-lg font-semibold mb-1">Posizione dell'annuncio:</p>
        <p className="text-xl font-bold">{addressText || 'Posizione non specificata'}</p>
        <p className="text-sm mt-2">
          Per visualizzare la mappa, è necessaria una chiave API di Google Maps.
        </p>
      </div>
    </div>
  );
};