"use client";

import React from 'react';
import { MapPin } from 'lucide-react'; // Import MapPin icon

interface StaticMapDisplayProps {
  latitude: number;
  longitude: number;
  addressText?: string | null;
  city?: string; // Nuovo prop per il nome della città
  zoom?: number; // Mantenuto per coerenza, ma non usato direttamente
  width?: number; // Mantenuto per coerenza, ma non usato direttamente
  height?: number; // Mantenuto per coerenza, ma non usato direttamente
}

export const StaticMapDisplay = ({ 
  latitude, 
  longitude, 
  addressText, 
  city, // Utilizza il prop city
  zoom = 13, 
  width = 600, 
  height = 250 
}: StaticMapDisplayProps) => {

  // Funzione per convertire il nome della città in uno slug per il nome del file
  const slugifyCity = (cityName: string) => {
    return cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const citySlug = city ? slugifyCity(city) : 'default';
  const cityMapImage = `/maps/${citySlug}.png`; // Percorso dell'immagine specifica per la città
  const defaultMapImage = "/maps/default.png"; // Percorso dell'immagine di fallback

  // Se le coordinate non sono valide, mostriamo un messaggio di errore più specifico.
  if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded-md text-gray-600 text-center p-4">
        <MapPin className="h-8 w-8 text-gray-500 mr-2" />
        Coordinate mappa non valide per la visualizzazione.
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full rounded-md overflow-hidden flex flex-col items-center justify-center p-4 text-center"
      style={{
        backgroundColor: '#e0e0e0', // Colore di sfondo di fallback
        minHeight: '150px', // Assicura un'altezza minima
      }}
    >
      <img
        src={cityMapImage} // Tenta di caricare l'immagine specifica della città
        alt={addressText || `Mappa di ${city || 'località sconosciuta'}`}
        onError={(e) => {
          // Se l'immagine specifica della città non viene trovata, usa l'immagine di default
          (e.target as HTMLImageElement).src = defaultMapImage;
          (e.target as HTMLImageElement).onerror = null; // Previene un loop infinito se anche l'immagine di default fallisce
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black opacity-40"></div> {/* Overlay scuro per leggibilità del testo */}
      <div className="relative z-10 text-white">
        <MapPin className="h-10 w-10 mx-auto mb-2 text-rose-300" />
        <p className="text-lg font-semibold mb-1">Posizione dell'annuncio:</p>
        <p className="text-xl font-bold">{addressText || 'Posizione non specificata'}</p>
        <p className="text-sm mt-2">
          Mappa statica generica.
        </p>
      </div>
    </div>
  );
};