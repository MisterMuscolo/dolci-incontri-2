import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, Share } from 'lucide-react'; // Rimosso MoreVertical, non più necessario qui
import { InstallPWAButton } from './InstallPWAButton'; // Importa il nuovo componente

type OSType = 'iOS' | 'Android' | 'Other';

const getOS = (): OSType => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'iOS';
  }
  return 'Other';
};

export const PWAInstallInstructions = () => {
  const [os, setOs] = useState<OSType>('Other');

  useEffect(() => {
    setOs(getOS());
  }, []);

  if (os === 'Other') {
    return null; // Non mostrare le istruzioni se non è un dispositivo mobile riconosciuto
  }

  return (
    <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 mt-8 text-left">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-gray-700">
          <Info className="h-6 w-6 text-rose-500" />
          Installa IncontriDolci sul tuo telefono!
        </CardTitle>
        <CardDescription className="text-gray-600">
          Aggiungi la nostra app alla schermata Home per un accesso rapido e un'esperienza a schermo intero.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {os === 'Android' && (
          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-4">Per Android:</h3>
            <InstallPWAButton />
            <p className="text-sm text-gray-500 mt-4">
              *Le Progressive Web App (PWA) si installano direttamente dal browser, non dal Play Store.
            </p>
          </div>
        )}
        {os === 'iOS' && (
          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-2 flex items-center gap-2">
              <Share className="h-5 w-5 text-gray-600" /> Per iOS (Safari):
            </h3>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>Apri il browser Safari e visita questo sito.</li>
              <li>Tocca l'icona "Condividi" (<Share className="inline-block h-4 w-4 align-middle" /> il quadrato con la freccia che punta verso l'alto) nella barra inferiore.</li>
              <li>Scorri verso il basso e seleziona "Aggiungi alla schermata Home".</li>
              <li>Tocca "Aggiungi" nell'angolo in alto a destra.</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};