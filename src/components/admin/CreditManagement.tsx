import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Coins, Search, Plus, Minus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface UserProfileForCredit {
  id: string;
  email: string;
  credits: number;
}

export const CreditManagement = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfileForCredit | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearchUser = async () => {
    setLoading(true);
    setSelectedUser(null);
    const toastId = showLoading('Ricerca utente...');

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, credits')
        .ilike('email', `%${searchEmail}%`)
        .limit(1); // Assuming unique emails or we only care about the first match

      dismissToast(toastId);

      if (error) {
        throw new Error(error.message);
      }

      if (profiles && profiles.length > 0) {
        setSelectedUser(profiles[0] as UserProfileForCredit);
        showSuccess('Utente trovato!');
      } else {
        showError('Nessun utente trovato con questa email.');
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante la ricerca utente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAdjustment = async (type: 'add' | 'subtract') => {
    if (!selectedUser || !creditAmount || isNaN(parseInt(creditAmount))) {
      showError('Seleziona un utente e inserisci un importo valido.');
      return;
    }

    const amount = parseInt(creditAmount);
    const finalAmount = type === 'add' ? amount : -amount;

    setLoading(true);
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
      // Refresh selected user's credits
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', selectedUser.id)
        .single();

      if (updatedProfile) {
        setSelectedUser(prev => prev ? { ...prev, credits: updatedProfile.credits } : null);
      } else if (fetchError) {
        console.error("Failed to refetch user credits after update:", fetchError);
      }

      setCreditAmount('');
      setTransactionDescription('');
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setLoading(false);
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
          <div className="flex gap-2">
            <Input
              id="search-email"
              type="email"
              placeholder="Inserisci email utente"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleSearchUser} disabled={loading || !searchEmail}>
              <Search className="h-4 w-4 mr-2" /> Cerca
            </Button>
          </div>
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
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-description">Descrizione Transazione (Opzionale)</Label>
              <Textarea
                id="transaction-description"
                placeholder="Motivo della regolazione (es. 'Bonus per attività', 'Rimborso')"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleCreditAdjustment('add')}
                disabled={loading || !creditAmount || parseInt(creditAmount) <= 0}
                className="flex-grow bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" /> Aggiungi Crediti
              </Button>
              <Button
                onClick={() => handleCreditAdjustment('subtract')}
                disabled={loading || !creditAmount || parseInt(creditAmount) <= 0}
                className="flex-grow bg-red-600 hover:bg-red-700"
              >
                <Minus className="h-4 w-4 mr-2" /> Rimuovi Crediti
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};