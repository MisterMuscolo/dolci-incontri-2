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
  const STADIAMAPS_API_KEY = '7991c8df-df40-4d2e-98b7-5124e7ac4f7b'; 

  if (!STADIAMAPS_API_KEY || STADIAMAPS_API_KEY === 'YOUR_STADIAMAPS_API_KEY') {
    console.warn("Stadiamaps API Key non configurata. La mappa statica non verrà visualizzata correttamente.");
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded-md text-gray-600 text-center p-4">
        Chiave API di Stadiamaps mancante o non configurata.
      </div>
    );
  }

  if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
    console.warn("Coordinate di latitudine o longitudine non valide per la mappa statica.");
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded-md text-gray-600 text-center p-4">
        Coordinate mappa non valide.
      </div>
    );
  }

  // Utilizzo coordinate di esempio da Stadiamaps (New York) per testare la chiave API
  const testLongitude = -73.9796;
  const testLatitude = 40.7654;
  const testZoom = 13;
  const testWidth = 600;
  const testHeight = 400;

  const mapUrl = `https://tiles.stadiamaps.com/styles/osm_bright/static/${testLongitude},${testLatitude},${testZoom}/${testWidth}x${testHeight}.png?api_key=${STADIAMAPS_API_KEY}`;
  
  console.log("Stadiamaps Map URL (using NY example with your key):", mapUrl);

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