import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Badge } from '@/components/ui/badge'; // Importa Badge

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // This is the discounted price
  originalPrice?: number; // Original price for discount calculation
  description: string;
  features: string[]; // Keeping this for data structure, but not rendering
  recommended?: boolean; // Nuovo campo per indicare se è consigliato
}

const creditPackages: CreditPackage[] = [
  {
    id: 'mini',
    name: 'Mini',
    credits: 20,
    price: 4.99,
    description: 'Ideale per un piccolo inizio.',
    features: ['20 crediti'],
  },
  {
    id: 'base',
    name: 'Base',
    credits: 50,
    price: 11.99, // Aggiornato
    description: 'Ideale per iniziare a esplorare.',
    features: ['50 crediti'],
  },
  {
    id: 'popolare',
    name: 'Popolare',
    credits: 110,
    price: 24.99, // Aggiornato
    originalPrice: (110 / 50) * 11.99, // Ricalcolato
    description: 'Più crediti per più opportunità.',
    features: ['110 crediti'],
    recommended: true, // Questo è il pacchetto consigliato
  },
  {
    id: 'avanzato',
    name: 'Avanzato',
    credits: 240,
    price: 49.99, // Aggiornato
    originalPrice: (240 / 50) * 11.99, // Ricalcolato
    description: 'Per chi cerca il meglio.',
    features: ['240 crediti', 'Supporto prioritario'],
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 99.99, // Aggiornato
    originalPrice: (500 / 50) * 11.99, // Ricalcolato
    description: 'Massima visibilità e interazioni.',
    features: ['500 crediti', 'Annunci in evidenza'],
  },
  {
    id: 'dominatore',
    name: 'Dominatore',
    credits: 1200,
    price: 199.99, // Aggiornato
    originalPrice: (1200 / 50) * 11.99, // Ricalcolato
    description: 'Il pacchetto definitivo per i più attivi.',
    features: ['1200 crediti', 'Tutti i vantaggi premium'],
  },
];

const BuyCredits = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (pkg: CreditPackage) => {
    setIsProcessing(true);
    const toastId = showLoading(`Acquisto ${pkg.name} in corso...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Devi essere autenticato per acquistare crediti.');
      }

      const { error } = await supabase.functions.invoke('manage-credits', {
        body: {
          userId: user.id,
          amount: pkg.credits,
          transactionType: 'purchase',
          description: pkg.name,
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante l\'acquisto dei crediti.';
        // @ts-ignore
        if (error.context && typeof error.context.body === 'string') {
          try {
            // @ts-ignore
            const errorBody = JSON.parse(error.context.body);
            if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            console.error("Could not parse error response from edge function:", e);
          }
        }
        throw new Error(errorMessage);
      }

      showSuccess(`Hai acquistato ${pkg.credits} crediti con successo!`);
      navigate('/credit-history'); // Reindirizza alla cronologia crediti
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto durante l\'acquisto.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Acquista Crediti</h1>
        </div>
        <p className="text-lg text-gray-600 mb-10 text-center">
          Scegli il pacchetto di crediti più adatto alle tue esigenze e sblocca tutte le funzionalità!
        </p>

        <div className="flex flex-col gap-6 mb-10">
          {creditPackages.map((pkg) => {
            const discountPercentage = pkg.originalPrice && pkg.originalPrice > pkg.price
              ? ((1 - pkg.price / pkg.originalPrice) * 100).toFixed(0)
              : null;

            return (
              <Card 
                key={pkg.id} 
                className={`w-full flex items-center justify-between p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 relative ${pkg.recommended ? 'border-2 border-rose-500' : ''}`}
              >
                {pkg.recommended && (
                  <Badge className="absolute -top-3 left-4 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                    Consigliato
                  </Badge>
                )}
                {/* Left section: Name and Credits */}
                <div className="flex flex-col text-left flex-grow">
                  <CardTitle className="text-lg font-bold text-rose-600">{pkg.name}</CardTitle>
                  <p className="text-xl font-extrabold text-gray-900">
                    {pkg.credits} <span className="text-gray-900">Crediti</span>
                  </p>
                </div>

                {/* Middle section: Prices and Savings */}
                <div className="flex flex-col items-end text-right mx-4">
                  {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
                    <>
                      <p className="text-sm text-gray-500 line-through">€{pkg.originalPrice.toFixed(2)}</p>
                      <p className="text-xl font-bold text-gray-900">€{pkg.price.toFixed(2)}</p>
                      <p className="text-xs text-green-600 font-semibold">
                        Risparmi {discountPercentage}%
                      </p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">€{pkg.price.toFixed(2)}</p>
                  )}
                </div>

                {/* Right section: Buy Button */}
                <Button
                  className="bg-rose-500 hover:bg-rose-600 text-sm py-2 px-4 flex-shrink-0"
                  onClick={() => handlePurchase(pkg)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Acquisto in corso...' : 'Acquista'}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link to="/dashboard">
            <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
              Torna alla Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyCredits;