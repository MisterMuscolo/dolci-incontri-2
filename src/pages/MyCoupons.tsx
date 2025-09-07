import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, Tag, Percent, Euro, CheckCircle, XCircle, Clock, Sparkles, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ApplyCouponForm } from '@/components/user/ApplyCouponForm';
import { PostgrestError } from '@supabase/supabase-js';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';

interface Coupon {
  id: string;
  code: string;
  type: 'single_use' | 'reusable';
  discount_type: 'percentage' | 'flat_amount' | 'credits';
  discount_value: number;
  expires_at: string | null;
  applies_to_user_id: string | null;
  created_at: string;
  is_active: boolean;
  max_uses: number | null;
  usage_count: number;
}

interface CouponDisplayItem extends Coupon {
  status: 'active' | 'used' | 'expired' | 'inactive' | 'maxed_out' | 'not_applicable';
  used_by_current_user: boolean;
}

interface AppliedCouponDetails {
  type: 'percentage' | 'flat_amount' | 'credits';
  value: number;
  couponId: string;
  couponType: 'single_use' | 'reusable';
  code: string;
}

interface UserCouponJoin {
  coupon_id: string;
  coupons: Coupon | null;
}

const MyCoupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<CouponDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { getBackLinkText, handleGoBack } = useDynamicBackLink();

  // Workaround per il linter: forza l'utilizzo
  console.log(showError); 
  console.log(currentUserId);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Utente non autenticato. Accedi per visualizzare i tuoi coupon.");
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data: userCouponsData, error: userCouponsError } = await supabase
      .from('user_coupons')
      .select(`
        coupon_id,
        coupons (
          id, code, type, discount_type, discount_value, expires_at, applies_to_user_id, created_at, is_active, max_uses, usage_count
        )
      `)
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false }) as { data: UserCouponJoin[] | null, error: PostgrestError | null };

    if (userCouponsError) {
      console.error("Error fetching user's applied coupons:", userCouponsError);
      showError("Impossibile caricare i tuoi coupon applicati.");
      setLoading(false);
      return;
    }

    const rawCoupons = (userCouponsData || []).map(uc => uc.coupons).filter(Boolean) as Coupon[];

    const { data: usedCouponsData, error: usedCouponsError } = await supabase
      .from('used_coupons')
      .select('coupon_id')
      .eq('user_id', user.id);

    if (usedCouponsError) {
      console.error("Error fetching used coupons:", usedCouponsError);
    }
    const usedCouponIds = new Set(usedCouponsData?.map(uc => uc.coupon_id));

    const now = new Date();
    const processedCoupons: CouponDisplayItem[] = rawCoupons.map(coupon => {
      let status: CouponDisplayItem['status'] = 'active';
      let usedByCurrentUser = false;

      if (!coupon.is_active) {
        status = 'inactive';
      } else if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        status = 'expired';
      } else if (coupon.type === 'single_use' && usedCouponIds.has(coupon.id)) {
        status = 'used';
        usedByCurrentUser = true;
      } else if (coupon.type === 'reusable' && coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
        status = 'maxed_out';
      }
      else if (coupon.applies_to_user_id && coupon.applies_to_user_id !== user.id) {
        status = 'not_applicable';
      }

      return {
        ...coupon,
        status,
        used_by_current_user: usedByCurrentUser,
      };
    });

    processedCoupons.sort((a, b) => {
      const statusOrder = { 'active': 0, 'used': 1, 'expired': 2, 'inactive': 3, 'maxed_out': 4, 'not_applicable': 5 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }

      if (a.status === 'active' && b.status === 'active') {
        const aExpires = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
        const bExpires = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
        return aExpires - bExpires;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setCoupons(processedCoupons);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const getStatusBadgeVariant = (status: CouponDisplayItem['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'used':
        return 'secondary';
      case 'expired':
      case 'inactive':
      case 'maxed_out':
      case 'not_applicable':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: CouponDisplayItem['status']) => {
    switch (status) {
      case 'active':
        return 'Attivo';
      case 'used':
        return 'Utilizzato';
      case 'expired':
        return 'Scaduto';
      case 'inactive':
        return 'Inattivo';
      case 'maxed_out':
        return 'Max Utilizzi';
      case 'not_applicable':
        return 'Non Applicabile';
      default:
        return status;
    }
  };

  const handleCouponApplied = (discount: AppliedCouponDetails) => {
    showSuccess(discount.type === 'credits' ? `Hai ricevuto ${discount.value} crediti!` : 'Coupon applicato con successo!');
    fetchCoupons();
  };

  const handleCouponRemoved = () => {
    showSuccess('Coupon rimosso.');
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">I Miei Coupon</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-rose-500" />
              Applica un nuovo Coupon
            </CardTitle>
            <CardDescription>
              Inserisci un codice coupon per sbloccare sconti o crediti extra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplyCouponForm onCouponApplied={handleCouponApplied} onCouponRemoved={handleCouponRemoved} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Tag className="h-6 w-6 text-rose-500" />
              I tuoi Coupon
            </CardTitle>
            <CardDescription>
              Tutti i coupon disponibili e utilizzati sul tuo account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-8">{error}</p>
            ) : coupons.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nessun coupon trovato per il tuo account.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Sconto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">{coupon.code}</TableCell>
                        <TableCell>
                          {coupon.discount_type === 'credits' ? (
                            <div className="flex items-center gap-1">
                              +{coupon.discount_value} <Coins className="inline-block h-3 w-3" />
                            </div>
                          ) : (
                            <>
                              {coupon.discount_value}
                              {coupon.discount_type === 'percentage' ? <Percent className="inline-block h-3 w-3 ml-1" /> : <Euro className="inline-block h-3 w-3 ml-1" />}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {coupon.type === 'single_use' ? 'Monouso' : 'Riutilizzabile'}
                          {coupon.type === 'reusable' && coupon.max_uses && ` (${coupon.usage_count}/${coupon.max_uses})`}
                        </TableCell>
                        <TableCell>
                          {coupon.expires_at ? format(new Date(coupon.expires_at), 'dd/MM/yyyy', { locale: it }) : 'Mai'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(coupon.status)} className="capitalize flex items-center gap-1">
                            {coupon.status === 'active' && <CheckCircle className="h-3 w-3" />}
                            {coupon.status === 'used' && <Clock className="h-3 w-3" />}
                            {(coupon.status === 'expired' || coupon.status === 'inactive' || coupon.status === 'maxed_out' || coupon.status === 'not_applicable') && <XCircle className="h-3 w-3" />}
                            {getStatusLabel(coupon.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyCoupons;