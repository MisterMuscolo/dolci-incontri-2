import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Termini = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Termini e Condizioni d'Uso</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 text-gray-700">
          <p>
            Benvenuto su IncontriDolci. Utilizzando il nostro sito web, accetti di rispettare i seguenti termini e condizioni d'uso. Ti preghiamo di leggerli attentamente.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">1. Accettazione dei Termini</h2>
          <p>
            Accedendo o utilizzando il servizio, l'utente accetta di essere vincolato da questi Termini. Se non si accetta una parte qualsiasi dei termini, non è possibile accedere al servizio.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">2. Modifiche ai Termini</h2>
          <p>
            Ci riserviamo il diritto, a nostra esclusiva discrezione, di modificare o sostituire questi Termini in qualsiasi momento. Se una revisione è sostanziale, cercheremo di fornire un preavviso di almeno 30 giorni prima che i nuovi termini entrino in vigore.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">3. Contenuto dell'Utente</h2>
          <p>
            Sei responsabile per il contenuto che pubblichi sul servizio, inclusi testi, immagini e qualsiasi altro materiale. Garantisci di avere i diritti necessari per pubblicare tale contenuto e che non viola i diritti di terzi.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">4. Condotta Proibita</h2>
          <p>
            È vietato utilizzare il servizio per scopi illegali o non autorizzati. Non devi molestare, abusare, insultare, danneggiare, diffamare, calunniare, denigrare, intimidire o discriminare in base a sesso, orientamento sessuale, religione, etnia, razza, età, origine nazionale o disabilità.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">5. Limitazione di Responsabilità</h2>
          <p>
            In nessun caso IncontriDolci, i suoi direttori, dipendenti, partner, agenti, fornitori o affiliati, saranno responsabili per eventuali danni indiretti, incidentali, speciali, consequenziali o punitivi, inclusi, senza limitazione, perdita di profitti, dati, uso, avviamento o altre perdite intangibili, derivanti da (i) l'accesso o l'uso o l'impossibilità di accedere o utilizzare il servizio; (ii) qualsiasi condotta o contenuto di terzi sul servizio; (iii) qualsiasi contenuto ottenuto dal servizio; e (iv) accesso, uso o alterazione non autorizzati delle tue trasmissioni o contenuti, sia basato su garanzia, contratto, illecito civile (inclusa negligenza) o qualsiasi altra teoria legale, sia che siamo stati informati o meno della possibilità di tali danni, e anche se un rimedio qui stabilito si rivela aver fallito il suo scopo essenziale.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">6. Legge Applicabile</h2>
          <p>
            Questi Termini saranno regolati e interpretati in conformità con le leggi italiane, senza riguardo alle sue disposizioni sul conflitto di leggi.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">7. Contatti</h2>
          <p>
            Per qualsiasi domanda sui presenti Termini, ti preghiamo di contattarci all'indirizzo <a href="mailto:support@incontridolci.com" className="text-rose-500 hover:underline">support@incontridolci.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Termini;