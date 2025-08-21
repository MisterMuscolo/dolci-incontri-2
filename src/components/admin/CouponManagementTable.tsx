import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Tag, CalendarDays, User, Percent, Euro } from 'lucide-react';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  type: 'single_use' | 'reusable';
  discount_type: 'percentage' | 'flat_amount';
  discount_value: number;
  expires_at: string | null;
  applies_to_user_id: string | null;
  created_at: string;
  is_active: boolean;
  max_uses: number | null;
  usage_count: number;
  profiles: { email: string } | null; // For the user it applies to
}

interface UserProfile {
  id: string;
  email: string;
}

const couponSchema = z.object({
  code: z.string().min(3, "Il codice deve avere almeno 3 caratteri."),
  type: z.enum(['single_use', 'reusable'], { required_error: "Il tipo è obbligatorio." }),
  discount_type: z.enum(['percentage', 'flat_amount'], { required_error: "Il tipo di sconto è obbligatorio." }),
  discount_value: z.coerce.number().min(0.01, "Il valore dello sconto deve essere maggiore di 0."),
  expires_at: z.date().nullable().optional(),
  applies_to_user_id: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  max_uses: z.coerce.number().int().min(1, "Il numero massimo di utilizzi deve essere almeno 1.").nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'reusable' && data.max_uses === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Per i coupon riutilizzabili, il numero massimo di utilizzi è obbligatorio.",
      path: ['max_uses'],
    });
  }
  if (data.type === 'single_use' && data.max_uses !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "I coupon monouso non possono avere un numero massimo di utilizzi.",
      path: ['max_uses'],
    });
  }
});

export const CouponManagementTable = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof couponSchema>>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      type: 'single_use',
      discount_type: 'percentage',
      discount_value: 0,
      expires_at: null,
      applies_to_user_id: null,
      is_active: true,
      max_uses: null,
    },
  });

  const fetchCouponsAndUsers = async () => {
    setLoading(true);
    const { data: couponsData, error: couponsError } = await supabase
      .from('coupons')
      .select(`
        *,
        profiles ( email )
      `)
      .order('created_at', { ascending: false });

    if (couponsError) {
      console.error("Error fetching coupons:", couponsError);
      showError("Impossibile caricare i coupon.");
    } else {
      setCoupons(couponsData as Coupon[]);
    }

    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .order('email', { ascending: true });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      showError("Impossibile caricare la lista utenti.");
    } else {
      setUsers(usersData as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCouponsAndUsers();
  }, []);

  const handleOpenDialog = (coupon?: Coupon) => {
    setEditingCoupon(coupon || null);
    if (coupon) {
      form.reset({
        ...coupon,
        expires_at: coupon.expires_at ? new Date(coupon.expires_at) : null,
        discount_value: coupon.discount_value,
        max_uses: coupon.max_uses || null,
      });
    } else {
      form.reset({
        code: '',
        type: 'single_use',
        discount_type: 'percentage',
        discount_value: 0,
        expires_at: null,
        applies_to_user_id: null,
        is_active: true,
        max_uses: null,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof couponSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading(editingCoupon ? 'Aggiornamento coupon...' : 'Creazione coupon...');

    try {
      let error;
      if (editingCoupon) {
        const { error: updateError } = await supabase.functions.invoke('update-coupon', {
          body: { couponId: editingCoupon.id, updates: {
            ...values,
            expires_at: values.expires_at?.toISOString() || null,
            applies_to_user_id: values.applies_to_user_id || null,
            max_uses: values.type === 'reusable' ? values.max_uses : null, // Ensure max_uses is null for single_use
          }},
        });
        error = updateError;
      } else {
        const { error: createError } = await supabase.functions.invoke('create-coupon', {
          body: {
            ...values,
            expires_at: values.expires_at?.toISOString() || null,
            applies_to_user_id: values.applies_to_user_id || null,
            max_uses: values.type === 'reusable' ? values.max_uses : null, // Ensure max_uses is null for single_use
          },
        });
        error = createError;
      }

      dismissToast(toastId);

      if (error) {
        let errorMessage = editingCoupon ? 'Errore durante l\'aggiornamento del coupon.' : 'Errore durante la creazione del coupon.';
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

      showSuccess(editingCoupon ? 'Coupon aggiornato con successo!' : 'Coupon creato con successo!');
      setIsDialogOpen(false);
      fetchCouponsAndUsers();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const toastId = showLoading('Eliminazione coupon...');
    try {
      const { error } = await supabase.functions.invoke('delete-coupon', {
        body: { couponId },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante l\'eliminazione del coupon.';
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

      showSuccess('Coupon eliminato con successo!');
      fetchCouponsAndUsers();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Gestione Coupon</h2>
        <Button onClick={() => handleOpenDialog()} className="bg-rose-500 hover:bg-rose-600">
          <PlusCircle className="h-4 w-4 mr-2" /> Crea Nuovo Coupon
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : coupons.length === 0 ? (
        <p className="text-gray-600">Nessun coupon trovato.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codice</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sconto</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Applica a</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Utilizzi</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell className="capitalize">{coupon.type === 'single_use' ? 'Monouso' : 'Riutilizzabile'}</TableCell>
                  <TableCell>
                    {coupon.discount_value}
                    {coupon.discount_type === 'percentage' ? <Percent className="inline-block h-3 w-3 ml-1" /> : <Euro className="inline-block h-3 w-3 ml-1" />}
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at ? format(new Date(coupon.expires_at), 'dd/MM/yyyy', { locale: it }) : 'Mai'}
                  </TableCell>
                  <TableCell>
                    {coupon.applies_to_user_id ? (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" /> {coupon.profiles?.email || 'Utente Sconosciuto'}
                      </div>
                    ) : (
                      'Tutti'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                      {coupon.is_active ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.type === 'reusable' ? `${coupon.usage_count}${coupon.max_uses ? `/${coupon.max_uses}` : ''}` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Questa azione eliminerà definitivamente il coupon "{coupon.code}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Sì, elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Modifica Coupon' : 'Crea Nuovo Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Modifica i dettagli del coupon esistente.' : 'Genera un nuovo codice coupon per sconti.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Coupon</FormLabel>
                    <FormControl><Input placeholder="Es. SCONTO10" {...field} disabled={editingCoupon ? true : isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleziona tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="single_use">Monouso</SelectItem>
                          <SelectItem value="reusable">Riutilizzabile</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo di Sconto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleziona tipo sconto" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentuale (%)</SelectItem>
                          <SelectItem value="flat_amount">Importo Fisso (€)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valore Sconto</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="Es. 10 o 0.15" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('type') === 'reusable' && (
                <FormField
                  control={form.control}
                  name="max_uses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero Massimo di Utilizzi (per Riutilizzabile)</FormLabel>
                      <FormControl><Input type="number" placeholder="Es. 100" {...field} disabled={isSubmitting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data di Scadenza (Opzionale)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: it })
                            ) : (
                              <span>Seleziona una data</span>
                            )}
                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          locale={it}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applies_to_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applica a Utente Specifico (Opzionale)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "all" ? null : val)} // Handle "all" to set null
                      value={field.value || "all"} // Set default to "all" if field.value is null
                      disabled={isSubmitting}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Tutti gli utenti" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">Tutti gli utenti</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Lascia vuoto per applicare a tutti gli utenti.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Coupon Attivo</FormLabel>
                      <FormDescription>
                        Se deselezionato, il coupon non potrà essere utilizzato.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                {isSubmitting ? (editingCoupon ? 'Aggiornamento...' : 'Creazione...') : (editingCoupon ? 'Salva Modifiche' : 'Crea Coupon')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};