import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

// Definisci l'interfaccia per BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPWAButton = () => {
  // Tipizza deferredPrompt con la nuova interfaccia
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Assicurati che l'evento sia del tipo corretto prima di salvarlo
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
      const { outcome } = await deferredPrompt.userChoice; // Non è più necessario il cast 'as any'
      console.log(`User response to the install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        showSuccess('IncontriDolci è stato aggiunto alla tua schermata Home!');
      } else {
        showError('Installazione annullata.');
      }
      setDeferredPrompt(null);
    }
  };

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