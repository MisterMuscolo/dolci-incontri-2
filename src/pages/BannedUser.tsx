import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BannedUser = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth'; // Reindirizza alla pagina di login dopo il logout
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center bg-white rounded-lg shadow-xl p-8 max-w-md w-full space-y-6">
        <Ban className="mx-auto h-20 w-20 text-red-500" />
        <h1 className="text-3xl font-bold text-gray-800">Accesso Negato</h1>
        <p className="text-lg text-gray-600">
          Il tuo account è stato sospeso. Se ritieni che ci sia un errore, contatta il supporto.
        </p>
        <Button 
          onClick={handleSignOut} 
          className="w-full bg-rose-500 hover:bg-rose-600"
        >
          Esci
        </Button>
        <p className="text-sm text-gray-500 mt-4">
          Per assistenza, contatta <a href="mailto:support@incontridolci.com" className="text-rose-500 hover:underline">support@incontridolci.com</a>
        </p>
      </div>
    </div>
  );
};

export default BannedUser;