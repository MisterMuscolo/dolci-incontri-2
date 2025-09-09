import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { OverviewStats } from "@/components/admin/OverviewStats";
import { CreditManagement } from "@/components/admin/CreditManagement";
import { AllCreditTransactionsTable } from "@/components/admin/AllCreditTransactionsTable";
import { CouponManagementTable } from "@/components/admin/CouponManagementTable";
import { TicketManagementTable } from "@/components/admin/TicketManagementTable"; // Importazione aggiunta
// Rimosso l'import di Button e MapPin in quanto non più necessari
// Rimosso l'import di supabase, showSuccess, showError, showLoading, dismissToast in quanto non più necessari

interface AdminDashboardProps {
  isAdmin: boolean;
  isSupporto: boolean;
}

const AdminDashboard = ({ isAdmin, isSupporto }: AdminDashboardProps) => {
  // Rimosso la funzione handleGeocodeAllListings in quanto non più necessaria
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Amministratore</h1>
        
        <OverviewStats />
        
        {isAdmin && (
          <>
            {/* Rimosso il div con il pulsante Geocodifica */}
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