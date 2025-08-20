import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Contatti = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Contatti</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 text-gray-700">
          <p>
            Per qualsiasi domanda, supporto o segnalazione, non esitare a contattarci.
            Siamo qui per aiutarti!
          </p>
          <p>
            Puoi inviarci un'email direttamente al nostro indirizzo di supporto:
            <br />
            <a href="mailto:support@incontridolci.com" className="text-rose-500 hover:underline font-semibold">
              support@incontridolci.com
            </a>
          </p>
          <p>
            Cercheremo di rispondere a tutte le richieste il prima possibile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contatti;