import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { OverviewStats } from "@/components/admin/OverviewStats";
import { CreditManagement } from "@/components/admin/CreditManagement";
import { AllCreditTransactionsTable } from "@/components/admin/AllCreditTransactionsTable";
import { CouponManagementTable } from "@/components/admin/CouponManagementTable";
import { TicketManagementTable } from "@/components/admin/TicketManagementTable"; // Importazione aggiunta
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface AdminDashboardProps {
  isAdmin: boolean;
  isSupporto: boolean;
}

const AdminDashboard = ({ isAdmin, isSupporto }: AdminDashboardProps) => {
  const handleGeocodeAllListings = async () => {
    const toastId = showLoading('Avvio geocodifica annunci esistenti...');
    try {
      const { data, error } = await supabase.functions.invoke('update-listing-geocodes');
      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante la geocodifica degli annunci.';
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

      showSuccess(data.message || 'Geocodifica annunci completata con successo!');
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto durante la geocodifica.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Amministratore</h1>
        
        <OverviewStats />
        
        {isAdmin && (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={handleGeocodeAllListings} className="bg-blue-500 hover:bg-blue-600">
                <MapPin className="h-4 w-4 mr-2" /> Geocodifica Annunci Esistenti
              </Button>
            </div>
            <CreditManagement />
            <AllCreditTransactionsTable />
            <CouponManagementTable />
          </>
        )}
        
        <TicketManagementTable />
        
        <UserManagementTable isAdmin={isAdmin} isSupporto={isSupporto} />
        
      </div>
    </div>
  );
};

export default AdminDashboard;