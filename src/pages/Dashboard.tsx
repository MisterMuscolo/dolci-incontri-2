import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">La tua Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">I tuoi annunci</h2>
            <Link to="/new-listing" className="w-full">
              <Button className="w-full">Crea nuovo annuncio</Button>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Portafoglio crediti</h2>
            <p className="text-gray-600 mb-4">Crediti disponibili: 0</p>
            <Link to="/buy-credits" className="w-full">
              <Button className="w-full">Acquista crediti</Button>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Impostazioni account</h2>
            <Link to="/profile-settings" className="w-full">
              <Button variant="outline" className="w-full">Modifica profilo</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;