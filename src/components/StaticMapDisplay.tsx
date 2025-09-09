"use client";

import React from 'react';

interface StaticMapDisplayProps {
  latitude: number;
  longitude: number;
  addressText?: string | null;
  zoom?: number;
  width?: number;
  height?: number;
}

export const StaticMapDisplay = ({ 
  latitude, 
  longitude, 
  addressText, 
  zoom = 13, 
  width = 600, 
  height = 250 
}: StaticMapDisplayProps) => {
  // Sostituisci 'YOUR_STADIAMAPS_API_KEY' con la tua chiave API di Stadiamaps
  // Puoi ottenere una chiave API gratuita su https://stadiamaps.com/
  const STADIAMAPS_API_KEY = 'YOUR_STADIAMAPS_API_KEY'; 

  if (!STADIAMAPS_API_KEY || STADIAMAPS_API_KEY === 'YOUR_STADIAMAPS_API_KEY') {
    console.warn("Stadiamaps API Key non configurata. La mappa statica non verrà visualizzata correttamente.");
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded-md text-gray-600 text-center p-4">
        Chiave API di Stadiamaps mancante o non configurata.
      </div>
    );
  }

  // Utilizziamo lo stile "alidade_smooth" di Stadiamaps
  // Per i marker, Stadiamaps usa un formato diverso: markers=lonlat:{lon},{lat}|color:{hex_color}|label:{char}
  const mapUrl = `https://tiles.stadiamaps.com/styles/alidade_smooth/static/${longitude},${latitude},${zoom}/${width}x${height}@2x.png?markers=lonlat:${longitude},${latitude}|color:ff0000|label:A&api_key=${STADIAMAPS_API_KEY}`;

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden">
      <img
        src={mapUrl}
        alt={addressText || `Mappa di ${latitude}, ${longitude}`}
        className="w-full h-full object-cover"
      />
      {addressText && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md">
          {addressText}
        </div>
      )}
    </div>
  );
};