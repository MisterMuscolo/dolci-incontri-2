"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; // Importa Leaflet per risolvere il problema dell'icona predefinita

interface MapDisplayProps {
  latitude: number;
  longitude: number;
  addressText?: string | null;
  zoom?: number;
}

export const MapDisplay = ({ latitude, longitude, addressText, zoom = 13 }: MapDisplayProps) => {
  // Non renderizzare lato server per evitare errori con l'oggetto window
  if (typeof window === 'undefined') {
    return null;
  }

  // Sposta la configurazione dell'icona predefinita all'interno di useEffect
  // per assicurarsi che venga eseguita solo nel contesto del browser.
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []); // Esegui solo una volta al montaggio del componente

  const position: [number, number] = [latitude, longitude];

  return (
    <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} className="h-full w-full rounded-md">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        {addressText && <Popup>{addressText}</Popup>}
      </Marker>
    </MapContainer>
  );
};