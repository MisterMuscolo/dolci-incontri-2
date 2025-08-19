import { Button } from "@/components/ui/button";
import { ChevronLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Contatti = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen flex flex-col items-center">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Contatti</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 text-gray-700 text-center">
          <Mail className="mx-auto h-16 w-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-semibold">Hai bisogno di aiuto?</h2>
          <p className="text-lg">
            Per qualsiasi domanda, supporto o segnalazione, non esitare a contattarci.
            Il nostro team di assistenza è qui per aiutarti.
          </p>
          <p className="text-xl font-bold text-gray-800">
            Scrivici a:
          </p>
          <a 
            href="mailto:supporto@dolciincontri.com" 
            className="text-rose-500 hover:underline text-xl font-semibold"
          >
            supporto@dolciincontri.com
          </a>
          <p className="text-sm text-gray-500 mt-4">
            Risponderemo il prima possibile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contatti;