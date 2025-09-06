import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"; // Importa i componenti di paginazione

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  package_name: string | null;
  created_at: string;
  profiles: { email: string }[] | null; // Keep this for the initial fetch
  userEmail?: string; // Add a field to store fetched email
}

// Nuova interfaccia per il tipo di dato restituito dalla query Supabase
interface CreditTransactionWithProfile extends CreditTransaction {
  profiles: { email: string }[] | null;
}

const TRANSACTIONS_PER_PAGE = 10; // Definisci il numero di transazioni per pagina

export const AllCreditTransactionsTable = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // Stato per la pagina corrente
  const [totalPages, setTotalPages] = useState(0); // Stato per il numero totale di pagine

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    // 1. Conta il numero totale di transazioni per la paginazione
    const { count, error: countError } = await supabase
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error counting all credit transactions:", countError.message, countError.details);
      showError("Impossibile contare le transazioni di credito.");
      setLoading(false);
      return;
    }

    if (count !== null) {
      setTotalPages(Math.ceil(count / TRANSACTIONS_PER_PAGE));
    }

    // Calcola il range per la query
    const from = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
    const to = from + TRANSACTIONS_PER_PAGE - 1;

    // 2. Recupera le transazioni per la pagina corrente
    const { data, error } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        amount,
        type,
        package_name,
        created_at,
        profiles ( email )
      `)
      .order('created_at', { ascending: false })
      .range(from, to); // Applica la paginazione

    if (error) {
      console.error("Error fetching all credit transactions:", error);
      showError("Impossibile caricare la cronologia delle transazioni di credito.");
      setTransactions([]); // Ensure transactions are cleared on error
    } else {
      // Post-process data to ensure email is displayed
      const processedTransactions: CreditTransaction[] = await Promise.all(
        (data as CreditTransactionWithProfile[] || []).map(async (transaction) => {
          if (transaction.profiles?.[0]?.email) {
            return { ...transaction, userEmail: transaction.profiles[0].email };
          } else if (transaction.user_id) {
            // If nested select failed, try fetching profile directly
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', transaction.user_id)
              .single();

            if (profileData) {
              return { ...transaction, userEmail: profileData.email };
            } else if (profileError) {
              console.warn(`Failed to fetch email for user_id ${transaction.user_id}:`, profileError.message);
            }
          }
          return { ...transaction, userEmail: 'N/D' }; // Fallback
        })
      );
      setTransactions(processedTransactions);
    }
    setLoading(false);
  }, [currentPage]); // Aggiungi currentPage come dipendenza

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Acquisto';
      case 'listing_creation':
        return 'Creazione Annuncio';
      case 'premium_upgrade':
        return 'Upgrade Premium';
      case 'admin_add':
        return 'Aggiunta Admin';
      case 'admin_subtract':
        return 'Sottrazione Admin';
      case 'coupon_credit_add':
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <History className="h-5 w-5 text-rose-500" /> Cronologia Transazioni Crediti (Tutti gli Utenti)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-gray-600">Nessuna transazione di credito trovata.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Utente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Dettagli</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</TableCell>
                      <TableCell className="font-medium">{transaction.userEmail || 'N/D'}</TableCell>
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
  );
};