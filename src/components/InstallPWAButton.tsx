import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previene che il browser mostri il suo prompt di installazione predefinito
      e.preventDefault();
      // Salva l'evento in modo da poterlo attivare in seguito
      setDeferredPrompt(e);
      console.log('beforeinstallprompt fired');
    };

    // Controlla se l'app è già installata (modalità standalone)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Mostra il prompt di installazione
      deferredPrompt.prompt();
      // Attendi la scelta dell'utente
      const { outcome } = await (deferredPrompt as any).userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        showSuccess('IncontriDolci è stato aggiunto alla tua schermata Home!');
        setIsInstalled(true); // Aggiorna lo stato a installato
      } else {
        showError('Installazione annullata.');
      }
      // Resetta il prompt dopo che è stato gestito
      setDeferredPrompt(null);
    }
  };

  // Se l'app è già installata, mostra un messaggio
  if (isInstalled) {
    return (
      <p className="text-center text-green-600 font-medium">
        IncontriDolci è già installato sul tuo dispositivo!
      </p>
    );
  }

  // Se non c'è un prompt disponibile (es. non è Android/Chrome o già installato), non mostrare il pulsante
  if (!deferredPrompt) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      className="w-full bg-rose-500 hover:bg-rose-600 text-white text-lg py-6 flex items-center justify-center gap-2"
    >
      <Download className="h-6 w-6" /> Installa l'app (Android)
    </Button>
  );
};