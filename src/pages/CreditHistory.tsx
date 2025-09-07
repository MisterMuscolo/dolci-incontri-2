import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet, History, ChevronLeft } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"; // Importa i componenti di paginazione
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  package_name: string | null;
  created_at: string;
}

const TRANSACTIONS_PER_PAGE = 10; // Definisci il numero di transazioni per pagina

const CreditHistory = () => {
  console.log("CreditHistory component is rendering."); // Aggiunto per il debug
  const navigate = useNavigate();
  const [currentCredits, setCurrentCredits] = useState<number | null>(0); // Initialize with 0
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Stato per la pagina corrente
  const [totalPages, setTotalPages] = useState(0); // Stato per il numero totale di pagine
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink(); // Usa handleNavigateBack

  const fetchCreditData = useCallback(async () => {
    setLoading(true);
    setError(null); // Reset error state at the beginning of fetch
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Utente non autenticato.");
      setLoading(false);
      return;
    }

    // Fetch current credits
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Errore nel recupero dei crediti:", profileError);
      // Do NOT set a general error for the component here, just ensure credits are 0
      setCurrentCredits(0); 
    } else if (profileData) {
      setCurrentCredits(profileData.credits);
    }

    // Fetch transactions with pagination
    const { count, error: countError } = await supabase
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error("Errore nel conteggio delle transazioni:", countError.message, countError.details);
      setError("Impossibile caricare la cronologia delle transazioni.");
      setLoading(false);
      return;
    }

    if (count !== null) {
      setTotalPages(Math.ceil(count / TRANSACTIONS_PER_PAGE));
    }

    const from = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
    const to = from + TRANSACTIONS_PER_PAGE - 1;

    const { data: transactionsData, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to); // Applica la paginazione

    if (transactionsError) {
      console.error("Errore nel recupero delle transazioni:", transactionsError);
      setError("Impossibile caricare la cronologia delle transazioni."); // Set error for transactions
    } else if (transactionsData) {
      setTransactions(transactionsData as CreditTransaction[]);
    }
    setLoading(false);
  }, [currentPage]); // Aggiungi currentPage come dipendenza

  useEffect(() => {
    fetchCreditData();
  }, [fetchCreditData]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Acquisto';
      case 'listing_creation':
        return 'Creazione Annuncio';
      case 'premium_upgrade':
        return 'Upgrade Premium';
      case 'coupon_credit_add': // Nuovo tipo di transazione
        return 'Coupon Crediti';
      case 'referral_bonus': // Nuovo tipo di transazione
        return 'Bonus Referral';
      default:
        return type;
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Portafoglio Crediti</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Wallet className="h-6 w-6 text-rose-500" />
              Saldo Attuale
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display current credits, always defaulting to 0 if null */}
            <p className="text-4xl font-bold text-gray-800">
              {currentCredits !== null ? currentCredits : 0} <span className="text-rose-500">crediti</span>
            </p>
            <Link to="/buy-credits" className="mt-4 inline-block">
              <Button className="bg-rose-500 hover:bg-rose-600">Acquista più crediti</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <History className="h-6 w-6 text-rose-500" />
              Cronologia Transazioni
            </CardTitle>
            <CardDescription>Le tue ultime transazioni di credito.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : error ? ( // Only show error if there was a problem fetching transactions
              <p className="text-red-500 text-center py-8">{error}</p>
            ) : transactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nessuna transazione di credito trovata.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Pacchetto</TableHead>
                        <TableHead className="text-right">Importo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</TableCell>
                          <TableCell>{getTransactionTypeLabel(transaction.type)}</TableCell>
                          <TableCell>{transaction.package_name || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <Pagination className="pt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditHistory;