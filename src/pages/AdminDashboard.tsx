import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { OverviewStats } from "@/components/admin/OverviewStats";
import { CreditManagement } from "@/components/admin/CreditManagement";
import { AllCreditTransactionsTable } from "@/components/admin/AllCreditTransactionsTable";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Amministratore</h1>
        
        <OverviewStats />
        
        <CreditManagement />

        <AllCreditTransactionsTable />

        <UserManagementTable />
        
        {/* La sezione ListingManagementTable è stata rimossa come richiesto */}
      </div>
    </div>
  );
};

export default AdminDashboard;