import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Ban, CheckCircle, Flag, XCircle } from 'lucide-react'; // Aggiunte Flag e XCircle
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Report {
  id: string;
  listing_id: string;
  reporter_email: string;
  report_message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
  listings: { title: string } | null; // Modificato per essere un singolo oggetto listing o null
}

export const ReportManagementTable = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        listing_id,
        reporter_email,
        report_message,
        status,
        created_at,
        reviewed_at,
        reviewer_id,
        listings ( title )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      showError("Impossibile caricare le segnalazioni.");
    } else {
      setReports(data as Report[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateReportStatus = async (reportId: string, newStatus: 'reviewed' | 'resolved') => {
    setActionLoadingId(reportId);
    const toastId = showLoading(`Aggiornamento stato segnalazione...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utente non autenticato.');
      }

      const { error } = await supabase
        .from('reports')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewer_id: user.id,
        })
        .eq('id', reportId);

      dismissToast(toastId);

      if (error) {
        throw new Error(error.message);
      }

      showSuccess(`Segnalazione aggiornata a "${newStatus}" con successo!`);
      fetchReports(); // Refresh the list
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'aggiornamento dello stato della segnalazione.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'reviewed':
        return 'secondary';
      case 'resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Flag className="h-5 w-5 text-red-500" /> Gestione Segnalazioni
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : reports.length === 0 ? (
          <p className="text-gray-600">Nessuna segnalazione trovata.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Annuncio Segnalato</TableHead>
                  <TableHead>Segnalatore</TableHead>
                  <TableHead>Messaggio</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</TableCell>
                    <TableCell className="font-medium">
                      {report.listings?.title || 'Annuncio Sconosciuto'}
                      {report.listing_id && (
                        <Link to={`/listing/${report.listing_id}`} className="ml-2 text-blue-500 hover:underline">
                          <Eye className="h-4 w-4 inline-block" />
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>{report.reporter_email}</TableCell>
                    <TableCell className="max-w-xs truncate">{report.report_message}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(report.status)} className="capitalize">
                        {report.status === 'pending' ? 'In Sospeso' : report.status === 'reviewed' ? 'Revisionato' : 'Risolto'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {report.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                          disabled={actionLoadingId === report.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Revisionato
                        </Button>
                      )}
                      {(report.status === 'pending' || report.status === 'reviewed') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                          disabled={actionLoadingId === report.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Risolto
                        </Button>
                      )}
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