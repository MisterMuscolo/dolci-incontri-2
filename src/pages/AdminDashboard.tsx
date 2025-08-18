import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Gestione Utenti</h2>
            <Button className="w-full mb-2">Visualizza tutti gli utenti</Button>
            <Button variant="outline" className="w-full">Utenti segnalati</Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Gestione Annunci</h2>
            <Button className="w-full mb-2">Annunci segnalati</Button>
            <Button variant="outline" className="w-full">Tutti gli annunci</Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Statistiche</h2>
            <Button className="w-full mb-2">Visualizza statistiche</Button>
            <Button variant="outline" className="w-full">Gestisci crediti</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;