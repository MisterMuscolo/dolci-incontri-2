import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Coins, Plus, Minus, User } from 'lucide-react'; // Rimossa Search
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from '@/components/ui/badge';

interface UserProfileForCredit {
  id: string;
  email: string;
  credits: number;
  role: string;
  created_at: string;
}

const USERS_PER_PAGE = 10;

export const CreditManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfileForCredit[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfileForCredit[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<UserProfileForCredit[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedUser, setSelectedUser] = useState<UserProfileForCredit | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // For credit adjustment actions

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, credits, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching all user profiles:", error);
      showError("Impossibile caricare i profili utente.");
      setAllUsers([]);
    } else {
      setAllUsers(profiles as UserProfileForCredit[]);
    }
    setLoading(false);
  }, []);

  const applyFiltersAndPagination = useCallback(() => {
    let currentFilteredUsers = allUsers;

    if (searchQuery) {
      currentFilteredUsers = allUsers.filter(user =>
        user.email.toLowerCase().startsWith(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(currentFilteredUsers);
    setTotalPages(Math.ceil(currentFilteredUsers.length / USERS_PER_PAGE));

    const from = (currentPage - 1) * USERS_PER_PAGE;
    const to = from + USERS_PER_PAGE;
    setDisplayedUsers(currentFilteredUsers.slice(from, to));
  }, [allUsers, searchQuery, currentPage]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [applyFiltersAndPagination]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCreditAdjustment = async (type: 'add' | 'subtract') => {
    if (!selectedUser || !creditAmount || isNaN(parseInt(creditAmount))) {
      showError('Seleziona un utente e inserisci un importo valido.');
      return;
    }

    const amount = parseInt(creditAmount);
    const finalAmount = type === 'add' ? amount : -amount;

    setActionLoading(true);
    const toastId = showLoading(`Regolazione crediti in corso...`);

    try {
      const { error } = await supabase.functions.invoke('manage-credits', {
        body: {
          userId: selectedUser.id,
          amount: finalAmount,
          transactionType: `admin_${type}`,
          description: transactionDescription || `Admin ${type === 'add' ? 'addition' : 'subtraction'}`,
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante la regolazione dei crediti.';
        // @ts-ignore
        if (error.context && typeof error.context.body === 'string') {
          try {
            // @ts-ignore
            const errorBody = JSON.parse(error.context.body);
            if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            console.error("Could not parse error response from edge function:", e);
          }
        }
        throw new Error(errorMessage);
      }

      showSuccess('Crediti aggiornati con successo!');
      // Refresh selected user's credits and the overall user list
      await fetchAllUsers(); // Re-fetch all users to update the table
      setSelectedUser(prev => {
        if (prev) {
          const updatedUser = allUsers.find(u => u.id === prev.id);
          return updatedUser || null;
        }
        return null;
      });

      setCreditAmount('');
      setTransactionDescription('');
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Coins className="h-5 w-5 text-rose-500" /> Gestione Crediti Utente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="search-email">Cerca Utente per Email</Label>
          <Input
            id="search-email"
            type="email"
            placeholder="Inizia a digitare l'email dell'utente..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on new search
            }}
            disabled={loading}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Lista Utenti</h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(USERS_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-600">Nessun utente trovato.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead className="text-right">Crediti</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : user.role === 'banned' ? 'destructive' : user.role === 'supporto' ? 'secondary' : 'outline'} className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{user.credits}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                            <User className="h-4 w-4 mr-1" /> Seleziona
                          </Button>
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
        </div>

        {selectedUser && (
          <div className="border rounded-md p-4 space-y-4 bg-gray-50">
            <p className="text-lg font-semibold">Utente Selezionato:</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Crediti Attuali:</strong> <span className="font-bold text-rose-500">{selectedUser.credits}</span></p>

            <div className="space-y-2">
              <Label htmlFor="credit-amount">Importo Crediti</Label>
              <Input
                id="credit-amount"
                type="number"
                placeholder="Es. 10, 50"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                min="1"
                disabled={actionLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-description">Descrizione Transazione (Opzionale)</Label>
              <Textarea
                id="transaction-description"
                placeholder="Motivo della regolazione (es. 'Bonus per attività', 'Rimborso')"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                disabled={actionLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleCreditAdjustment('add')}
                disabled={actionLoading || !creditAmount || parseInt(creditAmount) <= 0}
                className="flex-grow bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" /> Aggiungi Crediti
              </Button>
              <Button
                onClick={() => handleCreditAdjustment('subtract')}
                disabled={actionLoading || !creditAmount || parseInt(creditAmount) <= 0}
                className="flex-grow bg-red-600 hover:bg-red-700"
              >
                <Minus className="h-4 w-4 mr-2" /> Rimuovi Crediti
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSelectedUser(null)} disabled={actionLoading}>
              Deseleziona Utente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};