import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Settings, LayoutGrid, Ticket, PlusCircle, MessageSquare, Tag } from "lucide-react"; // Importa Tag
import { CreateTicketDialog } from "@/components/CreateTicketDialog";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalListingsCount, setTotalListingsCount] = useState(0);
  const [currentCredits, setCurrentCredits] = useState<number | null>(0);
  const [totalCreditsSpent, setTotalCreditsSpent] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch listings count
      const { count: listingsCount, error: countError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      if (countError) {
        console.error("Errore nel conteggio degli annunci:", countError);
      } else if (listingsCount !== null) {
        setTotalListingsCount(listingsCount);
      }

      // Fetch current credits from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Errore nel recupero dei crediti:", profileError);
        setCurrentCredits(0);
      } else if (profileData) {
        setCurrentCredits(profileData.credits);
      }

      // Fetch credit transactions to calculate total spent
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', user.id);

      if (transactionsError) {
        console.error("Errore nel recupero delle transazioni per i crediti utilizzati:", transactionsError);
        setTotalCreditsSpent(0);
      } else if (transactionsData) {
        const spent = transactionsData
          .filter(t => t.amount < 0) // Solo transazioni negative (spese)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0); // Somma i valori assoluti
        setTotalCreditsSpent(spent);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">La Mia Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">Gestisci i tuoi annunci, crediti e impostazioni del tuo account.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="w-full transition-shadow hover:shadow-lg bg-white hover:bg-gray-50">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-4">
                <div className="bg-rose-100 p-4 rounded-md flex items-center justify-center">
                  <LayoutGrid className="h-10 w-10 text-rose-500" />
                </div>
                <span className="text-gray-800">I Miei Annunci</span>
              </CardTitle>
              <CardDescription className="ml-[88px]">Visualizza e gestisci i tuoi annunci.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-3/4" />
              ) : (
                <p className="text-gray-600 text-xl">
                  Hai <span className="font-bold text-rose-500">{totalListingsCount}</span> annunci attivi
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                <Link to="/my-listings">
                  <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                    <LayoutGrid className="h-4 w-4 mr-2" /> Visualizza i miei annunci
                  </Button>
                </Link>
                <Link to="/new-listing">
                  <Button className="bg-rose-500 hover:bg-rose-600">
                    <PlusCircle className="h-4 w-4 mr-2" /> Crea nuovo annuncio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full transition-shadow hover:shadow-lg bg-white hover:bg-gray-50">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-4">
                <div className="bg-rose-100 p-4 rounded-md flex items-center justify-center">
                  <Wallet className="h-10 w-10 text-rose-500" />
                </div>
                <span>Crediti</span>
              </CardTitle>
              <CardDescription className="ml-[88px]">Acquista e gestisci i tuoi crediti.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-6" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-600 text-lg">
                    Disponibili: <span className="font-bold text-rose-500">{currentCredits !== null ? currentCredits : 0}</span>
                  </p>
                  <p className="text-gray-600 text-lg">
                    Utilizzati: <span className="font-bold text-gray-800">{totalCreditsSpent}</span>
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                <Link to="/credit-history">
                  <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                    <MessageSquare className="h-4 w-4 mr-2" /> Visualizza cronologia crediti
                  </Button>
                </Link>
                <Link to="/buy-credits">
                  <Button className="bg-rose-500 hover:bg-rose-600">Acquista crediti</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Nuova Card per I Miei Coupon */}
          <Card className="w-full transition-shadow hover:shadow-lg bg-white hover:bg-gray-50">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-4">
                <div className="bg-rose-100 p-4 rounded-md flex items-center justify-center">
                  <Tag className="h-10 w-10 text-rose-500" />
                </div>
                <span>I Miei Coupon</span>
              </CardTitle>
              <CardDescription className="ml-[88px]">Visualizza e gestisci i tuoi codici sconto.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/my-coupons">
                <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600 mt-4">
                  <Tag className="h-4 w-4 mr-2" /> Gestisci i miei coupon
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="w-full transition-shadow hover:shadow-lg bg-white hover:bg-gray-50">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-4">
                <div className="bg-rose-100 p-4 rounded-md flex items-center justify-center">
                  <Ticket className="h-10 w-10 text-rose-500" />
                </div>
                <span>I Miei Ticket</span>
              </CardTitle>
              <CardDescription className="ml-[88px]">Visualizza e gestisci le tue richieste di supporto.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mt-4">
                <Link to="/my-tickets">
                  <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                    <MessageSquare className="h-4 w-4 mr-2" /> Visualizza i miei ticket
                  </Button>
                </Link>
                <CreateTicketDialog
                  triggerButton={
                    <Button className="bg-rose-500 hover:bg-rose-600">
                      <PlusCircle className="h-4 w-4 mr-2" /> Apri un nuovo ticket
                    </Button>
                  }
                  dialogTitle="Apri un nuovo Ticket"
                  dialogDescription="Compila il modulo sottostante per inviare una richiesta di supporto o una domanda."
                  icon={Ticket}
                  initialSubject="Nuovo ticket di supporto"
                  redirectPathOnAuth="/dashboard"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="w-full transition-shadow hover:shadow-lg bg-white hover:bg-gray-50">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-4">
                <div className="bg-rose-100 p-4 rounded-md flex items-center justify-center">
                  <Settings className="h-10 w-10 text-rose-500" />
                </div>
                <span>Impostazioni</span>
              </CardTitle>
              <CardDescription className="ml-[88px]">Gestisci le impostazioni del tuo account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/profile-settings">
                <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600 mt-4">
                  <Settings className="h-4 w-4 mr-2" /> Gestisci impostazioni
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;