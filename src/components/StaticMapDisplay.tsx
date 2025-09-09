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
  // Sostituisci 'YOUR_MAPQUEST_API_KEY' con la tua chiave API di MapQuest
  const MAPQUEST_API_KEY = 'YOUR_MAPQUEST_API_KEY'; 

  if (!MAPQUEST_API_KEY || MAPQUEST_API_KEY === 'YOUR_MAPQUEST_API_KEY') {
    console.warn("MapQuest API Key non configurata. La mappa statica non verrà visualizzata correttamente.");
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded-md text-gray-600 text-center p-4">
        Chiave API di MapQuest mancante o non configurata.
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

  // URL per MapQuest Static Map API
  // Aggiunge un marker rosso di piccole dimensioni ('marker-sm-red') alle coordinate specificate.
  const mapUrl = `https://www.mapquestapi.com/staticmap/v5/map?key=${MAPQUEST_API_KEY}&center=${latitude},${longitude}&zoom=${zoom}&size=${width},${height}&locations=${latitude},${longitude}|marker-sm-red`;
  
  console.log("MapQuest Static Map URL:", mapUrl);

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