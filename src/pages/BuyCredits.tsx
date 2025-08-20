import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Skeleton } from '@/components/ui/skeleton';

interface CreditPackage {
  id: string; // This will now be the Stripe Price ID
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

// Pacchetti di crediti hardcoded
const hardcodedCreditPackages: CreditPackage[] = [
  {
    id: "price_1RuxX009Cz6joKQcplKPQDd0",
    name: "Pacchetto Mini",
    credits: 50,
    price: 5.00,
    description: "50 crediti per provare il servizio.",
    features: ["50 crediti"],
    recommended: false,
  },
  {
    id: "price_1RuxXu09Cz6joKQcVmLS7nIF",
    name: "Pacchetto Base",
    credits: 150,
    price: 12.00,
    originalPrice: 15.00,
    description: "150 crediti con un piccolo sconto.",
    features: ["150 crediti", "Risparmia 20%"],
    recommended: true,
  },
  {
    id: "price_1RuxYY09Cz6joKQc2UTL0eAD",
    name: "Pacchetto Popolare",
    credits: 300,
    price: 20.00,
    originalPrice: 30.00,
    description: "300 crediti per un uso prolungato.",
    features: ["300 crediti", "Risparmia 33%"],
    recommended: false,
  },
  {
    id: "price_1RuxZ709Cz6joKQceGEihLfq",
    name: "Pacchetto Avanzato",
    credits: 500,
    price: 30.00,
    originalPrice: 50.00,
    description: "500 crediti per la massima libertà.",
    features: ["500 crediti", "Risparmia 40%", "Il miglior valore!"],
    recommended: false,
  },
  {
    id: "price_1RuxZa09Cz6joKQcZspW2M3A",
    name: "Pacchetto Pro",
    credits: 750,
    price: 40.00,
    originalPrice: 70.00,
    description: "750 crediti per utenti esperti.",
    features: ["750 crediti", "Risparmia 43%", "Per professionisti!"],
    recommended: false,
  },
  {
    id: "price_1Ruxa609Cz6joKQcimcXs8IO",
    name: "Pacchetto Dominatore",
    credits: 1000,
    price: 50.00,
    originalPrice: 100.00,
    description: "1000 crediti per dominare la piattaforma.",
    features: ["1000 crediti", "Risparmia 50%", "Il massimo!"],
    recommended: false,
  },
];

// Load Stripe outside of a component render to avoid recreating it
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ selectedPackage, onPurchaseSuccess }: { selectedPackage: CreditPackage | null; onPurchaseSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPackage) {
      return;
    }

    setIsLoading(true);
    const toastId = showLoading(`Elaborazione pagamento per ${selectedPackage.name}...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Devi essere autenticato per completare l\'acquisto.');
      }

      // Confirm the payment on the client side
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/credit-history`, // Redirect to credit history on success
        },
        redirect: 'if_required', // Handle redirect manually if needed
      });

      if (confirmError) {
        if (confirmError.type === "card_error" || confirmError.type === "validation_error") {
          setMessage(confirmError.message || "Errore nella carta o nei dati di pagamento.");
          showError(confirmError.message || "Errore nella carta o nei dati di pagamento.");
        } else {
          setMessage("Si è verificato un errore imprevisto.");
          showError("Si è verificato un errore imprevisto.");
        }
        dismissToast(toastId);
        setIsLoading(false);
        return;
      }

      // If payment is successful (no redirect, or redirect handled by Stripe and returned to this page)
      // Call the finalize-credit-purchase Edge Function
      const { error: finalizeError } = await supabase.functions.invoke('finalize-credit-purchase', {
        body: {
          userId: user.id,
          amount: selectedPackage.credits,
          packageName: selectedPackage.name,
        },
      });

      dismissToast(toastId);

      if (finalizeError) {
        let errorMessage = 'Errore durante l\'aggiornamento dei crediti dopo il pagamento.';
        // @ts-ignore
        if (finalizeError.context && typeof finalizeError.context.body === 'string') {
          try {
            // @ts-ignore
            const errorBody = JSON.parse(finalizeError.context.body);
            if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            console.error("Could not parse error response from edge function:", e);
          }
        }
        throw new Error(errorMessage);
      }

      showSuccess(`Hai acquistato ${selectedPackage.credits} crediti con successo!`);
      onPurchaseSuccess(); // Notify parent component to navigate
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto durante l\'acquisto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full bg-rose-500 hover:bg-rose-600">
        <span id="button-text">
          {isLoading ? "Elaborazione..." : `Paga €${selectedPackage?.price.toFixed(2)}`}
        </span>
      </Button>
      {message && <div id="payment-message" className="text-red-500 text-sm mt-4">{message}</div>}
    </form>
  );
};

const BuyCredits = () => {
  const navigate = useNavigate();
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingPaymentIntent, setLoadingPaymentIntent] = useState(false);
  // Ora i pacchetti di crediti sono hardcoded
  const creditPackages = hardcodedCreditPackages; 

  const fetchCurrentCredits = useCallback(async () => {
    setLoadingCredits(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCurrentCredits(0);
      setLoadingCredits(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Errore nel recupero dei crediti:", profileError);
      setCurrentCredits(0);
    } else if (profileData) {
      setCurrentCredits(profileData.credits);
    }
    setLoadingCredits(false);
  }, []);

  useEffect(() => {
    fetchCurrentCredits();
    // Rimosso il fetching dei pacchetti da Edge Function
  }, [fetchCurrentCredits]);

  const handlePackageSelect = async (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setClientSecret(null); // Reset client secret
    setLoadingPaymentIntent(true);
    const toastId = showLoading(`Preparazione pagamento per ${pkg.name}...`);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { packageId: pkg.id }, // Pass Stripe Price ID
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore nella preparazione del pagamento.';
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

      setClientSecret(data.clientSecret);
      showSuccess('Pagamento pronto!');
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
      setSelectedPackage(null); // Clear selected package on error
    } finally {
      setLoadingPaymentIntent(false);
    }
  };

  const handlePurchaseSuccess = () => {
    navigate('/credit-history');
  };

  const appearance: StripeElementsOptions['appearance'] = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#E54A70', // Rose-500
      colorText: '#333',
      colorBackground: '#fff',
      colorDanger: '#ef4444', // Red-500
      fontFamily: 'Arial, sans-serif',
    },
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

        <Card className="bg-white shadow-md mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              Saldo Attuale
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCredits ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-4xl font-bold text-gray-800">
                {currentCredits !== null ? currentCredits : 0} <span className="text-rose-500">crediti</span>
              </p>
            )}
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-6">Scegli il tuo pacchetto:</h2>
        {creditPackages.length === 0 ? (
          <p className="text-center text-gray-600">Nessun pacchetto di crediti disponibile. Riprova più tardi.</p>
        ) : (
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
                  <div className="flex flex-col text-left flex-grow">
                    <CardTitle className="text-lg font-bold text-rose-600">{pkg.name}</CardTitle>
                    <p className="text-xl font-extrabold text-gray-900">
                      {pkg.credits} <span className="text-gray-900">Crediti</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end text-right mx-4">
                    {pkg.originalPrice && discountPercentage ? (
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

                  <Button
                    className="bg-rose-500 hover:bg-rose-600 text-sm py-2 px-4 flex-shrink-0"
                    onClick={() => handlePackageSelect(pkg)}
                    disabled={loadingPaymentIntent || selectedPackage?.id === pkg.id}
                  >
                    {selectedPackage?.id === pkg.id && loadingPaymentIntent ? 'Caricamento...' : 'Seleziona'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {selectedPackage && clientSecret && (
          <Card className="mt-8 p-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Completa il tuo acquisto</CardTitle>
              <CardDescription>Stai acquistando: <span className="font-semibold">{selectedPackage.name} ({selectedPackage.credits} crediti)</span> per <span className="font-semibold">€{selectedPackage.price.toFixed(2)}</span></CardDescription>
            </CardHeader>
            <CardContent>
              <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
                <CheckoutForm selectedPackage={selectedPackage} onPurchaseSuccess={handlePurchaseSuccess} />
              </Elements>
            </CardContent>
          </Card>
        )}

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