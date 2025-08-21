import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  // Rimosso lo stato isInstalled da qui, poiché il componente padre gestirà la visibilità complessiva

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('beforeinstallprompt fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        showSuccess('IncontriDolci è stato aggiunto alla tua schermata Home!');
        // Non è necessario aggiornare isInstalled qui, il componente padre PWAInstallInstructions si ri-valuterà
      } else {
        showError('Installazione annullata.');
      }
      setDeferredPrompt(null);
    }
  };

  // Se non c'è un prompt disponibile (es. non è Android/Chrome o è già installato), non mostrare il pulsante.
  // Il componente padre PWAInstallInstructions gestirà il controllo complessivo "è installato".
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