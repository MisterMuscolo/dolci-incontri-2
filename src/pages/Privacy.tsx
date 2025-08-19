import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Privacy Policy</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 text-gray-700">
          <p>
            La presente Privacy Policy descrive come Dolci Incontri raccoglie, utilizza e protegge le tue informazioni personali quando utilizzi il nostro servizio.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">1. Informazioni che Raccogliamo</h2>
          <p>
            Raccogliamo diverse tipologie di informazioni per fornire e migliorare il nostro servizio, tra cui:
            <ul className="list-disc list-inside ml-4">
              <li>**Dati Personali:** Email, età, città, categoria di annuncio, titolo, descrizione, numero di telefono (opzionale), foto.</li>
              <li>**Dati di Utilizzo:** Informazioni su come il servizio viene acceduto e utilizzato (es. pagine visitate, tempo trascorso).</li>
            </ul>
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">2. Come Utilizziamo le Informazioni</h2>
          <p>
            Utilizziamo le informazioni raccolte per vari scopi, tra cui:
            <ul className="list-disc list-inside ml-4">
              <li>Fornire e mantenere il nostro servizio.</li>
              <li>Gestire il tuo account e i tuoi annunci.</li>
              <li>Migliorare, personalizzare ed espandere il nostro servizio.</li>
              <li>Comunicare con te, inclusi aggiornamenti e risposte alle tue richieste.</li>
              <li>Prevenire frodi e garantire la sicurezza del servizio.</li>
            </ul>
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">3. Condivisione delle Informazioni</h2>
          <p>
            Non vendiamo, scambiamo o trasferiamo in altro modo a terzi le tue informazioni personali identificabili senza il tuo consenso, ad eccezione di quanto necessario per fornire il servizio (es. fornitori di servizi di hosting, partner di pagamento).
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">4. Sicurezza dei Dati</h2>
          <p>
            La sicurezza dei tuoi dati è importante per noi, ma ricorda che nessun metodo di trasmissione su Internet o metodo di archiviazione elettronica è sicuro al 100%. Sebbene ci sforziamo di utilizzare mezzi commercialmente accettabili per proteggere i tuoi dati personali, non possiamo garantirne la sicurezza assoluta.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">5. I Tuoi Diritti</h2>
          <p>
            Hai il diritto di accedere, correggere, aggiornare o richiedere la cancellazione delle tue informazioni personali. Puoi farlo accedendo alle impostazioni del tuo account o contattandoci.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">6. Modifiche a Questa Privacy Policy</h2>
          <p>
            Potremmo aggiornare la nostra Privacy Policy di tanto in tanto. Ti informeremo di eventuali modifiche pubblicando la nuova Privacy Policy su questa pagina.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">7. Contatti</h2>
          <p>
            Per qualsiasi domanda sulla presente Privacy Policy, ti preghiamo di contattarci all'indirizzo <a href="mailto:supporto@dolciincontri.com" className="text-rose-500 hover:underline">supporto@dolciincontri.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;