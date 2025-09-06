import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ListChecks } from 'lucide-react';
import { showError } from '@/utils/toast';

export const OverviewStats = () => {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch total users from profiles table
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) {
          throw new Error(usersError.message);
        }
        setTotalUsers(usersCount);

        // Fetch active listings (not expired)
        const { count: listingsCount, error: listingsError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .gt('expires_at', new Date().toISOString());

        if (listingsError) {
          throw new Error(listingsError.message);
        }
        setActiveListings(listingsCount);

      } catch (error: any) {
        console.error("Error fetching overview stats:", error);
        showError("Impossibile caricare le statistiche della piattaforma.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">{totalUsers !== null ? totalUsers : 'N/D'}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Annunci Attivi</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">{activeListings !== null ? activeListings : 'N/D'}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};