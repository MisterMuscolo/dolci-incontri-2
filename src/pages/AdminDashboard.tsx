import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { OverviewStats } from "@/components/admin/OverviewStats";
import { CreditManagement } from "@/components/admin/CreditManagement";
import { AllCreditTransactionsTable } from "@/components/admin/AllCreditTransactionsTable";
import { TicketManagementTable } from "@/components/admin/TicketManagementTable";
import { CouponManagementTable } from "@/components/admin/CouponManagementTable"; // Importa il nuovo componente

interface AdminDashboardProps {
  isAdmin: boolean;
  isSupporto: boolean;
}

const AdminDashboard = ({ isAdmin, isSupporto }: AdminDashboardProps) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Amministratore</h1>
        
        <OverviewStats />
        
        {isAdmin && (
          <>
            <CreditManagement />
            <AllCreditTransactionsTable />
            <CouponManagementTable /> {/* Aggiunto il componente di gestione coupon */}
          </>
        )}
        
        <TicketManagementTable />
        
        <UserManagementTable isAdmin={isAdmin} isSupporto={isSupporto} />
        
      </div>
    </div>
  );
};

export default AdminDashboard;