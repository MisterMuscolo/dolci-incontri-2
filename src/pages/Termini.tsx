import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';
import { Link } from 'react-router-dom'; // Importa Link

const Termini = () => {
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink(); // Usa handleNavigateBack

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Termini e Condizioni d'Uso</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 text-gray-700">
          <p>
            Le presenti Condizioni d'Uso sono aggiornate a {new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}. Le nostre Condizioni d'Uso sono oggetto di periodico aggiornamento; suggeriamo pertanto agli utenti, come definiti di seguito, di verificare eventuali modifiche intervenute dall'ultima volta che abbiano utilizzato il servizio offerto attraverso il sito IncontriDolci.it (di seguito rispettivamente il "Servizio” e il “Sito").
          </p>
          <p>
            Gli utenti del Sito (collettivamente “Utenti”) comprendono gli Utenti Inserzionisti (coloro che creano e pubblicano annunci e profili) e gli Utenti Visitatori (coloro che accedono ai contenuti e contattano gli inserzionisti).
          </p>
          <p>
            Gli Utenti sono informati che la prosecuzione della navigazione nel Sito implica l’accettazione delle Condizioni d'Uso vigenti al momento della visita del Sito e che, se non si desidera essere vincolati dalle Condizioni d'Uso, è necessario chiudere il Sito e cessare di utilizzare il Servizio.
          </p>
          <p>
            Il nostro utilizzo dei dati personali degli Utenti è regolato dalla nostra <a href="/privacy" className="text-rose-500 hover:underline">Informativa Privacy</a>, che definisce anche il nostro utilizzo dei cookie e di tecnologie simili.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">1. Destinatari del Servizio e Garanzie</h2>
          <p>
            Questo Sito è destinato esclusivamente a persone adulte (maggiori di 18 anni); utilizzando il Sito si garantisce di essere maggiori di 18 anni e, nel caso degli Utenti Inserzionisti, di non offrire attraverso il Sito servizi che contravvengono alle leggi vigenti nella propria giurisdizione. Qualsiasi falsa dichiarazione di essere maggiorenne da parte di un Utente di età inferiore ai 18 anni o qualsiasi elusione delle misure di verifica dell'età da noi messe in atto costituisce violazione delle presenti Condizioni d'Uso.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">2. Contenuti e Moderazione</h2>
          <p>
            Non esercitiamo alcun controllo editoriale né effettuiamo alcuna verifica preventiva sugli annunci inseriti o sui profili creati sul Sito. Tuttavia, ci riserviamo il diritto di eliminare gli annunci o i profili che, a nostra assoluta discrezione:
            <ul className="list-disc list-inside ml-4">
              <li>Violino le presenti Condizioni d'Uso, la Politica d'Uso Accettabile o le Linee Guida.</li>
              <li>Contengano malware o qualsiasi altro materiale che rischi di interferire o compromettere il corretto funzionamento del Sito; o</li>
              <li>Riteniamo, a nostra assoluta discrezione, che siano pregiudizievoli per la corretta fornitura del Servizio o per la reputazione di IncontriDolci; o</li>
              <li>Riteniamo che siano o possano essere in violazione di qualsiasi legge o regolamento penale applicabile e vincolante per noi; o</li>
              <li>Costituiscano o possano costituire molestie o forme di bullismo nei confronti di qualsiasi altro Utente o di terzi; o</li>
              <li>Siano intimidatori, offensivi o discriminatori; o</li>
              <li>A nostro insindacabile giudizio abbiano cagionato o siano ragionevolmente idonei a cagionare un pregiudizio alla Società, o comunque a danneggiarne la reputazione.</li>
            </ul>
          </p>
          <p>
            Abbiamo istituito un sistema di segnalazione tramite ticket di assistenza che consente agli Utenti di segnalarci gli annunci che ritengono in contrasto con le presenti Condizioni d'Uso, in particolare quelli che, a loro avviso, a) includono contenuti di minorenni; b) non sono stati pubblicati da o con il consenso del soggetto ivi riprodotto; o c) sono altrimenti illegali. Esamineremo tutte le segnalazioni e potremo, a seconda dei casi, o accogliere il reclamo e rimuovere l'annuncio, o richiedere all’Utente Inserzionista che ha inserito l'annuncio di fornire materiale aggiuntivo che permetta di verificare la sua età o il suo diritto di inserire l'annuncio, oppure respingere il reclamo.
          </p>
          <p>
            Le sezioni "Politica d’Uso Accettabile" e "Linee Guida" illustrano in modo più dettagliato quale materiale venga considerato in contrasto con le presenti Condizioni d'Uso, sebbene spetti agli Utenti, in ogni caso, determinare autonomamente le leggi applicabili ai contenuti da loro inseriti nel Sito e la conformità di tali contenuti alle Condizioni d'Uso.
          </p>
          <p>
            Ci riserviamo il diritto di bannare gli Utenti in caso di gravi o ripetute violazioni delle presenti Condizioni d'Uso. In caso di rimozione di un annuncio o di interdizione dell’accesso al Sito a un Utente, non saremo in alcun caso responsabili di eventuali perdite, pretese, danni o spese di qualsiasi tipo derivanti da tale rimozione o interdizione e non sarà previsto alcun rimborso di eventuali somme a noi corrisposte.
          </p>
          <p>
            Con il caricamento di un annuncio sul Sito, l’Utente Inserzionista ci autorizza a trattare i suoi dati personali (anche particolari) allo scopo di pubblicare tale annuncio sul Sito.
          </p>
          <p>
            È severamente vietato utilizzare questo sito Web in qualsiasi modo che promuova o faciliti la tratta di esseri umani, il traffico sessuale o l’abuso fisico. Qualora venissero individuati contenuti che contengano indicatori di tratta di esseri umani o di traffico sessuale, sospenderemo immediatamente l’account e collaboreremo con le forze dell’ordine per assistere nell’identificazione degli autori.
          </p>
          <p>
            Sulle immagini caricate, il nostro logo sarà aggiunto come watermark.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">3. Obblighi e Condotte dell’Utente</h2>
          <p>
            Il Servizio è un servizio per adulti e, utilizzando il Servizio, gli Utenti dichiarano e garantiscono di avere almeno 18 anni. Qualsiasi falsa dichiarazione di essere maggiorenne da parte di un Utente di età inferiore ai 18 anni o qualsiasi elusione delle misure di verifica dell'età da noi messe in atto costituisce violazione delle presenti Condizioni d'Uso.
          </p>
          <p>
            Come chiarito sopra, gli Utenti Visitatori devono essere consapevoli che non esercitiamo un controllo preventivo sul contenuto degli annunci online inseriti dagli Utenti Inserzionisti. Il Sito non è un intermediario o un agente degli Utenti e non è in alcun modo responsabile di eventuali rischi, pretese o responsabilità derivanti da una successiva fornitura di servizi o altro rapporto o contatto tra uno o più Utenti Inserzionisti e uno o più Utenti Visitatori.
          </p>
          <p>
            Utilizzando il Servizio, gli Utenti si assumono la piena ed esclusiva responsabilità del proprio comportamento nei confronti del Sito e di terzi, ivi compresi gli altri Utenti.
          </p>
          <p>
            Non siamo responsabili e non garantiamo la veridicità dei contenuti degli annunci inseriti dagli Utenti Inserzionisti, né il buon esito delle trattative tra gli Utenti Inserzionisti e gli Utenti Visitatori.
          </p>
          <p>
            Gli Utenti si impegnano a non utilizzare il Servizio fornito dal Sito in modo improprio o contrario alle disposizioni di legge, nonché alle regole deontologiche e di buona condotta dei servizi di rete (netiquette). Gli Utenti, in particolare, si impegnano a non trasmettere attraverso il Sito materiale di natura offensiva, ingiuriosa, discriminatoria, diffamatoria, pedofila, volgare, blasfema o che sia in qualche modo contrario ai principi dell'ordine pubblico.
          </p>
          <p>
            Gli Utenti Inserzionisti sono responsabili dell'osservanza di tutte le leggi applicabili in relazione al contenuto dei loro annunci. In particolare, gli Utenti Inserzionisti non devono pubblicizzare servizi che sarebbe illegale fornire all'interno della loro giurisdizione e non devono includere alcun materiale che contravvenga alle norme penali applicabili.
          </p>
          <p>
            Gli Utenti Inserzionisti garantiscono di essere i soggetti interessati ai sensi della disciplina privacy o di avere il consenso esplicito e informato di tutte le persone i cui dati personali sono inclusi in qualsiasi annuncio da loro inserito e che non utilizzeranno nei loro annunci alcun materiale in violazione del diritto d’autore o di altri diritti di proprietà intellettuale di terzi senza l’autorizzazione di questi ultimi.
          </p>
          <p>
            L'inserimento di annunci che sembrano provenire da qualcuno o che includono i dati di qualcuno che non ha acconsentito all'inserimento di tali annunci costituisce una grave violazione delle presenti Condizioni d’Uso e può comportare la chiusura del profilo e il divieto di accesso al Sito da parte degli Utenti Inserzionisti responsabili.
          </p>
          <p>
            Gli Utenti Inserzionisti sono resi edotti del fatto che, nel momento in cui includono un indirizzo e-mail e/o un numero telefonico negli annunci pubblicati sul Sito, la Società non ha alcun controllo sul materiale che possa essere inviato direttamente a quell'indirizzo e-mail o numero telefonico, sia da altri Utenti, sia da terzi.
          </p>
          <p>
            Non è consentito pubblicare annunci in cui si offrano denaro o servizi in cambio di una prestazione sessuale. Non è consentito pubblicare contenuti e/o Annunci relativi a vendita di farmaci, droghe, armi e/o strumenti atti ad offendere. Non è consentito pubblicare annunci non pertinenti con la tematica del sito. Non è consentito pubblicare annunci in lingua straniera o comunque differente dall'italiano ufficiale.
          </p>
          <p>
            Non è consentito alcun materiale che raffiguri o promuova il suicidio o l'autolesionismo. Non è consentito alcun materiale qualificabile come “pornografia estrema”, quale, a titolo esemplificativo ma non esaustivo, materiale che raffiguri atti che sembrano essere non consensuali, atti che coinvolgono animali o cadaveri, atti che sembrano mettere in pericolo la vita di una persona o atti che provocano, o possono provocare, gravi lesioni all'ano, ai seni o ai genitali di una persona. Non è consentito alcun annuncio che contenga, senza il consenso di ciascun soggetto coinvolto, materiale erotico realizzato in occasioni private ("revenge porn"). Non è consentito alcun materiale che raffiguri, promuova, induca o offra attività sessuali con minori o che comunque promuova o incoraggi la pedofilia ("materiale pedopornografico").
          </p>
          <p>
            Non è consentito alcun materiale che ritragga o sembri ritrarre terzi che non hanno acconsentito a tale uso o pubblicazione.
          </p>
          <p>
            Inserendo annunci o creando profili, gli Utenti Inserzionisti certificano di avere piena facoltà di legge per farlo e dichiarano e garantiscono che il materiale caricato appartiene a persone maggiorenni che hanno prestato un consenso libero e informato alla pubblicazione sul Sito per finalità di adult dating e che non sono state in alcun modo costrette o forzate a partecipare.
          </p>
          <p>
            Non è consentito pubblicare contenuti calunniosi e/o diffamatori.
          </p>
          <p>
            Gli Utenti Inserzionisti non possono caricare, inviare, mostrare o pubblicare materiale che costituisca incitamento all'odio, che sia discriminatorio, intimidatorio o molesto, o che incoraggi o promuova la violenza o che costituisca un reato ai sensi delle norme in tema di sfruttamento sessuale dei minori, terrorismo, razzismo o xenofobia e di qualsiasi altra norma. A tal fine, per “incitamento all’odio” si intende il materiale diretto a un gruppo o a un individuo sulla base della sua razza, etnia, origine nazionale, stato di immigrazione, classe sociale, religione, sesso, identità o espressione di genere, orientamento sessuale, età, disabilità o qualsiasi altra caratteristica personale protetta e che ha lo scopo o l'effetto di incitare alla discriminazione, all'odio, alla paura o alla violenza contro tale gruppo o individuo. Di seguito sono riportati alcuni esempi non esaustivi di comportamenti o materiali considerati intimidatori o molesti:
            <ul className="list-disc list-inside ml-4">
              <li>materiali che sono o sembrano essere rivolti a un individuo specifico o a un gruppo di individui e sono offensivi, dispregiativi o molesti;</li>
              <li>sono utilizzati o sembrano essere destinati a essere utilizzati per estorcere denaro o altri benefici in cambio della rimozione dei materiali stessi;</li>
              <li>includano contenuti sessuali indesiderati o un linguaggio indesiderato che oggettivizzi sessualmente un altro Utente o chiunque altro in modo non consensuale;</li>
              <li>diffondono o sono volti a diffondere online informazioni personali e private (come ad es. nome e cognome, indirizzo, numero di telefono etc.) o altri dati riguardanti una persona (doxing), o altrimenti identifichino un Utente o un qualsiasi terzo, o includano materiale che potrebbe essere utilizzato per tali scopi, come dettagli del datore di lavoro, numeri di telefono, dettagli finanziari, informazioni sulla posizione, nomi, documenti di identità, indirizzi e-mail, credenziali di accesso o qualsiasi altra informazione di identificazione personale senza l'esplicito consenso scritto di tale persona.</li>
            </ul>
          </p>
          <p>
            Gli Utenti non possono utilizzare il Sito per promuovere il commercio illegale, schemi Ponzi o marketing piramidale, né assumere condotte ingannevoli, o che possano indurre in errore altri Utenti o che suggeriscano che, contrariamente al vero, una persona o un'organizzazione promuovano quell’Utente o i suoi contenuti o che quell’Utente agisce in qualità di testimonial o rappresentante di una persona o di un'organizzazione.
          </p>
          <p>
            L’inserimento in qualsiasi annuncio o profilo di materiale pedopornografico, compresi tutti gli accessi e i metadati, sarà immediatamente segnalato alle Autorità competenti. Ci riserviamo inoltre il diritto di segnalare il materiale che contravvenga alle nostre regole sulla pornografia estrema o sul revenge porn.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">4. Servizi a Pagamento e Crediti</h2>
          <p>
            Pubblicando un annuncio sul Sito (che prevede la creazione di un profilo online), ogni Utente Inserzionista ci autorizza a promuoverlo a nostra discrezione per garantirgli una maggiore visibilità nonché a gestire il Servizio in modo da favorirne la massima efficacia nei mercati geografici rilevanti. Creando un profilo online o inserendo un annuncio sul Sito, l’Utente Inserzionista conferma di essere maggiorenne nella sua giurisdizione di riferimento, di essere la persona identificata nel profilo e di non essere stato costretto in alcun modo a offrire servizi.
          </p>
          <p>
            Gli Utenti Inserzionisti sono resi edotti del fatto che accettiamo il pagamento del Servizio a Pagamento tramite il nostro fornitore di servizi di pagamento, i cui termini e condizioni regolano le transazioni con gli Utenti Inserzionisti. Non siamo responsabili per gli atti, le omissioni o le inadempienze del fornitore di servizi di pagamento. In caso di violazione dei predetti termini e condizioni, ci riserviamo il diritto di rimuovere l'annuncio senza alcun rimborso, di cancellare qualsiasi profilo collegato e di vietare agli Utenti Inserzionisti la creazione di futuri profili o l'inserimento di futuri annunci.
          </p>
          <p>
            IncontriDolci non interferisce nella negoziazione tra gli Utenti.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">5. Limitazioni di Responsabilità</h2>
          <p>
            Nulla di quanto contenuto nelle presenti Condizioni d'Uso vale a limitare o escludere la responsabilità di un soggetto per morte o lesioni personali causate dalla negligenza di tale soggetto o di qualsiasi persona di cui esso è responsabile, o per frode, o qualsiasi altra responsabilità che non può essere esclusa o limitata per legge.
          </p>
          <p>
            IncontriDolci e le società ad essa collegate, nonché i rispettivi dirigenti, dipendenti, funzionari o direttori non accettano alcuna responsabilità per:
            <ul className="list-disc list-inside ml-4">
              <li>Qualsiasi perdita o danno nella misura in cui derivi da circostanze al di fuori del loro ragionevole controllo.</li>
              <li>Qualsiasi perdita o danno causato da interruzione o mancata disponibilità del Sito o del Servizio.</li>
              <li>Qualsiasi perdita diretta o indiretta di profitti, affari, reputazione, risparmi attesi o fatturato.</li>
              <li>Qualsiasi perdita o danneggiamento di dati.</li>
              <li>Qualsiasi danno indiretto, punitivo, legale o comunque non risarcibile sulla base della legge applicabile; anche qualora siano stati avvisati della possibilità di tali danni.</li>
            </ul>
          </p>
          <p>
            La responsabilità di IncontriDolci e delle società ad essa collegate, nonché dei rispettivi dirigenti, dipendenti, funzionari o direttori nei confronti dell’Utente per qualsiasi altra perdita o danno, derivante da contratto, fatto illecito, violazione di obblighi di legge o comunque derivante da o relativa al Sito e/o al Servizio, sarà limitato, nel caso di Servizi a Pagamento, a un importo equivalente al maggiore importo tra le somme pagate dall’Utente nei dodici mesi immediatamente precedenti l'evento che ha dato origine al reclamo o € 500 e, nel caso di qualsiasi altro Servizio, a € 150.
          </p>
          <p>
            Ciascuna delle disposizioni di cui sopra è separata e indipendente dalle altre e l'accertamento della nullità o dell'inapplicabilità di una delle predette disposizioni non pregiudica l'applicabilità delle altre, che rimarranno in vigore a tutti gli effetti.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">6. Politica di Rimborso</h2>
          <p>
            Salvo i casi in cui il rimborso sia espressamente previsto dalla legge, non rimborsiamo agli Utenti Inserzionisti le somme pagate per i Servizi a Pagamento. Possiamo eccezionalmente e a nostra esclusiva discrezione offrire dei crediti (fruibili esclusivamente sul Sito) di importo pari alle somme pagate e non utilizzate, da usare per futuri Servizi a Pagamento. L’Utente Inserzionista non avrà diritto ad alcun rimborso o credito in caso di violazione degli obblighi previsti dai presenti Termini e Condizioni.
          </p>
          <p>
            Ci riserviamo il diritto di intervenire sul Sito o di apportarvi modifiche o cambiamenti (ad es. nel design, nelle funzioni e/o nei contenuti) senza preavviso, o di limitare l'accesso degli Utenti Inserzionisti al Sito per motivi di manutenzione o tecnici o di altro tipo senza preavviso e per il periodo di tempo necessario. In tali casi, nessun Utente ha diritto di richiedere un risarcimento o un rimborso per tali modifiche, cambiamenti o mancata disponibilità.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">7. Legge Applicabile e Foro Competente</h2>
          <p>
            Le presenti Condizioni d'Uso sono regolate dalla legge italiana e sono soggette alla giurisdizione esclusiva dei tribunali italiani (foro del consumatore).
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">8. Contatti</h2>
          <p>
            Per qualsiasi domanda o segnalazione sui presenti Termini, ti preghiamo di contattarci tramite il nostro sistema di ticket di assistenza, accessibile dalla sezione "Assistenza" nel footer del sito o dalla tua dashboard.
          </p>
          <div className="text-center mt-8">
            <Link to="/">
              <Button variant="outline">Torna alla Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Termini;