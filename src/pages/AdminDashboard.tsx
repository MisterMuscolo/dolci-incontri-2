import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { ListingManagementTable } from "@/components/admin/ListingManagementTable";
import { OverviewStats } from "@/components/admin/OverviewStats";
import { CreditManagement } from "@/components/admin/CreditManagement"; // Importa il nuovo componente
import { AllCreditTransactionsTable } from "@/components/admin/AllCreditTransactionsTable"; // Importa il nuovo componente

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Amministratore</h1>
        
        <OverviewStats />
        
        <CreditManagement /> {/* Aggiungi il componente di gestione crediti qui */}

        <AllCreditTransactionsTable /> {/* Aggiungi il componente della cronologia transazioni qui */}

        <UserManagementTable />
        
        <ListingManagementTable />
        
        {/* Puoi aggiungere altre sezioni qui in futuro, ad esempio per le statistiche o la gestione dei crediti */}
        {/*
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Statistiche</h2>
          <Button className="w-full mb-2">Visualizza statistiche</Button>
          <Button variant="outline" className="w-full">Gestisci crediti</Button>
        </div>
        */}
      </div>
    </div>
  );
};

export default AdminDashboard;