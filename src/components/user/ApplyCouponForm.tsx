import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tag, Loader2, Percent, Euro, Coins } from 'lucide-react'; // Importa Coins
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

interface ApplyCouponFormProps {
  onCouponApplied: (discount: { type: 'percentage' | 'flat_amount' | 'credits'; value: number; couponId: string; couponType: 'single_use' | 'reusable'; code: string }) => void; // Aggiunto 'credits' e 'code'
  onCouponRemoved: () => void;
  currentAppliedCoupon?: { type: 'percentage' | 'flat_amount' | 'credits'; value: number; code: string; couponId: string; couponType: 'single_use' | 'reusable' } | null; // Aggiunto 'credits'
}

export const ApplyCouponForm = ({ onCouponApplied, onCouponRemoved, currentAppliedCoupon }: ApplyCouponFormProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showError('Inserisci un codice coupon.');
      return;
    }

    setIsLoading(true);
    const toastId = showLoading('Applicazione coupon...');

    try {
      const { data, error } = await supabase.functions.invoke('apply-coupon', {
        body: { couponCode: couponCode.trim() },
      });

      dismissToast(toastId);

      if (error) {
        console.error("Errore completo da supabase.functions.invoke:", error);
        let displayMessage = 'Errore durante l\'applicazione del coupon.';

        // Se error.context è un oggetto Response e il suo body è un ReadableStream, leggilo
        // @ts-ignore - error.context è l'oggetto Response
        if (error.context && error.context.body instanceof ReadableStream) {
          try {
            // @ts-ignore - Leggi il ReadableStream per ottenere il testo
            const errorText = await error.context.text(); 
            const errorBody = JSON.parse(errorText);
            if (errorBody.error) {
              displayMessage = errorBody.error;
            }
          } catch (e) {
            console.error("Impossibile parsare il corpo della risposta di errore dall'Edge Function (dopo aver letto il ReadableStream):", e);
            displayMessage = error.message || 'Errore sconosciuto dal server.';
          }
        } else if (error.message) {
          displayMessage = error.message;
        }
        
        showError(displayMessage);
        return;
      }

      showSuccess(data.message || 'Coupon applicato con successo!');
      onCouponApplied({
        type: data.discountType,
        value: data.discountValue,
        couponId: data.couponId,
        couponType: data.couponType,
        code: couponCode.trim(),
      });
      setCouponCode('');
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    showSuccess('Coupon rimosso.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Tag className="h-5 w-5 text-rose-500" /> Applica Coupon
        </CardTitle>
        <CardDescription>
          Hai un codice sconto? Inseriscilo qui per applicarlo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentAppliedCoupon ? (
          <div className="border rounded-md p-4 bg-green-50 text-green-800 flex items-center justify-between">
            <div>
              <p className="font-semibold">Coupon applicato: {currentAppliedCoupon.code}</p>
              <p className="text-sm">
                Sconto: {currentAppliedCoupon.type === 'percentage' ? `${currentAppliedCoupon.value}%` : 
                         currentAppliedCoupon.type === 'flat_amount' ? `€${currentAppliedCoupon.value.toFixed(2)}` :
                         `+${currentAppliedCoupon.value} Crediti`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemoveCoupon} disabled={isLoading}>
              Rimuovi
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-grow">
              <Label htmlFor="coupon-code" className="sr-only">Codice Coupon</Label>
              <Input
                id="coupon-code"
                type="text"
                placeholder="Inserisci codice coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button onClick={handleApplyCoupon} disabled={isLoading || !couponCode.trim()} className="bg-rose-500 hover:bg-rose-600 flex-shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Applica'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};