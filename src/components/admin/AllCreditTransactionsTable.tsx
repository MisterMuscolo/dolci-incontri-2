import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  package_name: string | null;
  created_at: string;
  profiles: { email: string }[] | null; // Corretto: ora è un array di oggetti
}

export const AllCreditTransactionsTable = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching all credit transactions:", error);
      showError("Impossibile caricare la cronologia delle transazioni di credito.");
    } else {
      setTransactions(data as CreditTransaction[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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
      default:
        return type;
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
                    <TableCell className="font-medium">{transaction.profiles?.[0]?.email || 'N/D'}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
};