import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom'; // Importa Link
import { Button } from '@/components/ui/button'; // Importa Button
import { Eye } from 'lucide-react'; // Importa l'icona Eye

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

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      // Fetch profiles from the public.profiles table
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

    fetchUsers();
  }, []);

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
                <TableHead className="text-right">Azioni</TableHead> {/* Nuova colonna */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{user.credits}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/users/${user.id}/listings`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Visualizza Annunci
                      </Button>
                    </Link>
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