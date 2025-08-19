import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Ban, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  email: string;
  credits: number;
  role: string;
  created_at: string;
}

export const UserManagementTable = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user profiles:", error);
      showError("Impossibile caricare i profili utente.");
    } else {
      setUsers(profiles as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string, userEmail: string) => {
    setActionLoadingId(userId);
    const toastId = showLoading(`Aggiornamento ruolo per ${userEmail}...`);

    try {
      const { error } = await supabase.functions.invoke('manage-user-role', {
        body: { userId, newRole },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante l\'aggiornamento del ruolo.';
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

      showSuccess(`Ruolo di ${userEmail} aggiornato a "${newRole}" con successo!`);
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Gestione Utenti</h2>
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-600">Nessun utente trovato.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead className="text-right">Crediti</TableHead>
                <TableHead>Data Registrazione</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'banned' ? 'destructive' : 'secondary'} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{user.credits}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Link to={`/admin/users/${user.id}/listings`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Annunci
                      </Button>
                    </Link>
                    {user.role !== 'admin' && ( // Non permettere di bannare/sbloccare gli admin
                      user.role === 'banned' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="secondary" size="sm" disabled={actionLoadingId === user.id}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Sblocca
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Conferma sblocco utente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler sbloccare l'utente "{user.email}"? Questo ripristinerà il suo accesso.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRoleChange(user.id, 'user', user.email)}
                                disabled={actionLoadingId === user.id}
                              >
                                {actionLoadingId === user.id ? 'Sblocco...' : 'Sì, sblocca'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={actionLoadingId === user.id}>
                              <Ban className="h-4 w-4 mr-1" /> Banna
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Conferma ban utente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler bannare l'utente "{user.email}"? Questo limiterà il suo accesso e le sue funzionalità.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRoleChange(user.id, 'banned', user.email)}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={actionLoadingId === user.id}
                              >
                                {actionLoadingId === user.id ? 'Banning...' : 'Sì, banna'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};