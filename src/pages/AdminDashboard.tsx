import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { OverviewStats } from "@/components/admin/OverviewStats";
import { CreditManagement } from "@/components/admin/CreditManagement";
import { AllCreditTransactionsTable } from "@/components/admin/AllCreditTransactionsTable";
import { ReportManagementTable } from "@/components/admin/ReportManagementTable";
import { TicketManagementTable } from "@/components/admin/TicketManagementTable"; // Importa il nuovo componente

interface AdminDashboardProps {
  isAdmin: boolean;
  isCollaborator: boolean;
}

const AdminDashboard = ({ isAdmin, isCollaborator }: AdminDashboardProps) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Amministratore</h1>
        
        <OverviewStats />
        
        {isAdmin && ( // Visibile solo per gli amministratori
          <>
            <CreditManagement />
            <AllCreditTransactionsTable />
          </>
        )}

        {/* ReportManagementTable rimosso */}
        
        <TicketManagementTable /> {/* Visibile per admin e collaboratori */}
        
        <UserManagementTable isAdmin={isAdmin} isCollaborator={isCollaborator} /> {/* Passa i ruoli */}
        
      </div>
    </div>
  );
};

export default AdminDashboard;