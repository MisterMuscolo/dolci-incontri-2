import { Button } from "@/components/ui/button";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">La tua Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">I tuoi annunci</h2>
            <Button className="w-full">Crea nuovo annuncio</Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Portafoglio crediti</h2>
            <p className="text-gray-600 mb-4">Crediti disponibili: 0</p>
            <Button className="w-full">Acquista crediti</Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Impostazioni account</h2>
            <Button variant="outline" className="w-full">Modifica profilo</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;