"use client";

import React from 'react';
import { MapPin } from 'lucide-react'; // Import MapPin icon

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
  zoom = 13, // Mantenuto per coerenza, ma non usato direttamente
  width = 600, // Mantenuto per coerenza, ma non usato direttamente
  height = 250 // Mantenuto per coerenza, ma non usato direttamente
}: StaticMapDisplayProps) => {
  // Poiché le API di mappe statiche veramente gratuite con marker e senza carta di credito per uso non-locale sono difficili da trovare,
  // forniremo un segnaposto visivo con il testo dell'indirizzo.
  // Questo evita chiavi API, costi e requisiti di carta di credito.

  // Un'immagine di sfondo generica per dare l'idea di una mappa.
  // Potrebbe essere un'icona stilizzata di mappa o un pattern.
  // Per ora, useremo un'immagine generica di OpenStreetMap.
  const genericMapBackground = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Openstreetmap_logo.svg/1200px-Openstreetmap_logo.svg.png"; 

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
        backgroundImage: `url(${genericMapBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#e0e0e0', // Colore di sfondo di fallback
        minHeight: '150px', // Assicura un'altezza minima
      }}
    >
      <div className="absolute inset-0 bg-black opacity-40"></div> {/* Overlay scuro per leggibilità del testo */}
      <div className="relative z-10 text-white">
        <MapPin className="h-10 w-10 mx-auto mb-2 text-rose-300" />
        <p className="text-lg font-semibold mb-1">Posizione dell'annuncio:</p>
        <p className="text-xl font-bold">{addressText || 'Posizione non specificata'}</p>
        <p className="text-sm mt-2">
          Mappa dinamica non disponibile senza chiave API a pagamento.
        </p>
      </div>
    </div>
  );
};