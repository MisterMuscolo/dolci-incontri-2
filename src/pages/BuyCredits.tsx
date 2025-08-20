import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'; // Importa i componenti Dialog

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

const hardcodedCreditPackages: CreditPackage[] = [
  {
    id: "price_1RyIB10BGBtuYZR68bk2mj93",
    name: "Pacchetto Mini",
    credits: 20,
    price: 4.99,
    description: "20 crediti per provare il servizio.",
    features: ["20 crediti"],
    recommended: false,
  },
  {
    id: "price_1RyIBc0BGBtuYZR6ohwCZ8yT",
    name: "Pacchetto Base",
    credits: 50,
    price: 11.99,
    description: "50 crediti per le tue prime interazioni.",
        features: ["50 crediti"],
    recommended: false,
  },
  {
    id: "price_1RyIEU0BGBtuYZR6YPyxH78e",
    name: "Pacchetto Popolare",
    credits: 110,
    price: 24.99,
    originalPrice: 26.38,
    description: "110 crediti con un piccolo sconto.",
    features: ["110 crediti", "Risparmia 5%"],
    recommended: true,
  },
  {
    id: "price_1RyIEv0BGBtuYZR6D2Pz0eqS",
    name: "Pacchetto Avanzato",
    credits: 240,
    price: 49.99,
    originalPrice: 57.55,
    description: "240 crediti per un uso prolungato.",
    features: ["240 crediti", "Risparmia 13%"],
    recommended: false,
  },
  {
    id: "price_1RyIFm0BGBtuYZR6HEUJfkKm",
    name: "Pacchetto Pro",
    credits: 500,
    price: 99.99,
    originalPrice: 119.90,
    description: "500 crediti per utenti esperti.",
    features: ["500 crediti", "Risparmia 17%", "Per professionisti!"],
    recommended: false,
  },
  {
    id: "price_1RyIGV0BGBtuYZR6AdWmCp1o",
    name: "Pacchetto Dominatore",
    credits: 1200,
    price: 199.99,
    originalPrice: 287.76,
    description: "1200 crediti per dominare la piattaforma.",
    features: ["1200 crediti", "Risparmia 31%", "Il massimo!"],
    recommended: false,
  },
];

const stripePromise = loadStripe("pk_live_51RtvDm0BGBtuYZR6M3gRknP73OQDQ94YWI2yrqC1dWVM7mPd6aYMArTfcSjsOXJRNY2SHn0b0ShxnaQkBJs6HXUL00FEOsjI6C");

const CheckoutForm = ({ selectedPackage, onPurchaseSuccess }: { selectedPackage: CreditPackage | null; onPurchaseSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  useEffect(() => {
    console.log("CheckoutForm: selectedPackage changed or clientSecret/elements/stripe updated. selectedPackage:", selectedPackage?.id, "isPaymentElementReady:", isPaymentElementReady);
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!isPaymentElementReady && selectedPackage && elements && stripe) {
      timeoutId = setTimeout(() => {
        setMessage("Il modulo di pagamento sta impiegando troppo tempo per caricarsi. Controlla la tua connessione internet o prova a disabilitare estensioni del browser (es. ad-blocker).");
        showError("Il modulo di pagamento sta impiegando troppo tempo per caricarsi. Controlla la tua connessione internet o prova a disabilitare estensioni del browser (es. ad-blocker).");
      }, 15000);
    }
    return () => clearTimeout(timeoutId);
  }, [isPaymentElementReady, selectedPackage, elements, stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPackage) {
      console.error("Stripe, Elements, or selectedPackage not available.");
      return;
    }

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement || !isPaymentElementReady) {
      setMessage("Errore: Il modulo di pagamento non è ancora pronto. Attendi un momento e riprova.");
      showError("Errore: Il modulo di pagamento non è ancora pronto. Attendi un momento e riprova.");
      console.error("PaymentElement not ready or not found.");
      return;
    }

    setIsLoading(true);
    const toastId = showLoading(`Elaborazione pagamento per ${selectedPackage.name}...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Devi essere autenticato per completare l\'acquisto.');
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements: elements, // Corrected: Pass the entire elements object
        confirmParams: {
          return_url: `${window.location.origin}/credit-history`,
        },
        // Removed: 'redirect: 'if_required'' as it's not a valid option for confirmPayment
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
        if (finalizeError.context && typeof finalizeError.context.body === 'string') {
          try {
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
      onPurchaseSuccess();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto durante l\'acquisto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      {!isPaymentElementReady && (
        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="ml-2 text-gray-600">Caricamento modulo di pagamento...</p>
        </div>
      )}
      <div> 
        <PaymentElement id="payment-element" onReady={() => {
          console.log("Stripe PaymentElement is ready!");
          setIsPaymentElementReady(true);
        }} />
      </div>
      <Button disabled={isLoading || !isPaymentElementReady} id="submit" className="w-full bg-rose-500 hover:bg-rose-600">
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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false); // Nuovo stato per il dialog
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
  }, [fetchCurrentCredits]);

  const handlePackageSelect = async (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setClientSecret(null); // Reset client secret
    setLoadingPaymentIntent(true);
    const toastId = showLoading(`Preparazione pagamento per ${pkg.name}...`);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { packageId: pkg.id },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore nella preparazione del pagamento.';
        if (error.context && typeof error.context.body === 'string') {
          try {
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
      console.log("Client Secret ricevuto:", data.clientSecret);
      showSuccess('Pagamento pronto!');
      setIsPaymentDialogOpen(true); // Apri il dialog dopo aver ricevuto il client secret
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
      setSelectedPackage(null);
    } finally {
      setLoadingPaymentIntent(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setIsPaymentDialogOpen(false); // Chiudi il dialog
    navigate('/credit-history');
  };

  const appearance: StripeElementsOptions['appearance'] = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#E54A70',
      colorText: '#333',
      colorBackground: '#fff',
      colorDanger: '#ef4444',
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

        {/* Il Dialog per il pagamento */}
        <Dialog 
          open={isPaymentDialogOpen} 
          onOpenChange={(open) => {
            setIsPaymentDialogOpen(open);
            if (!open) { // Se il dialog si sta chiudendo
              setSelectedPackage(null); // Resetta il pacchetto selezionato
              setClientSecret(null); // Resetta il client secret
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">Completa il tuo acquisto</DialogTitle>
              {selectedPackage && (
                <DialogDescription>
                  Stai acquistando: <span className="font-semibold">{selectedPackage.name} ({selectedPackage.credits} crediti)</span> per <span className="font-semibold">€{selectedPackage.price.toFixed(2)}</span>
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="py-4">
              {selectedPackage && clientSecret ? (
                <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
                  <CheckoutForm selectedPackage={selectedPackage} onPurchaseSuccess={handlePurchaseSuccess} />
                </Elements>
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="h-10 w-10 animate-spin text-rose-500 mb-4" />
                  <p className="text-gray-600">Preparazione del modulo di pagamento...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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