import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { italianProvinces } from '@/data/provinces';
import { ImageUploader, NewFilePair } from '@/components/ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { ChevronLeft, CheckIcon, X, Globe, Palette, Ruler, Eye, Handshake, Clock, Home, Euro, Sparkles, ChevronDown } from 'lucide-react'; // Aggiunte icone per i nuovi filtri
import { cn, formatPhoneNumber } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';

// Definizioni delle opzioni per i nuovi campi
const meetingTypeOptions = [
  { id: 'cena', label: 'Cena' },
  { id: 'aperitivo', label: 'Aperitivo' },
  { id: 'relax', label: 'Relax' },
  { id: 'massaggio', label: 'Massaggio' },
  { id: 'viaggio', label: 'Viaggio' },
  { id: 'altro', 'label': 'Altro' },
];

const availabilityForOptions = [
  { id: 'mattina', label: 'Mattina' },
  { id: 'pomeriggio', label: 'Pomeriggio' },
  { id: 'sera', label: 'Sera' },
  { id: 'notte', label: 'Notte' },
  { id: 'weekend', label: 'Weekend' },
];

const meetingLocationOptions = [
  { id: 'mio-domicilio', label: 'Mio domicilio' },
  { id: 'tuo-domicilio', label: 'Tuo domicilio' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'esterno', label: 'Esterno' },
  { id: 'online', label: 'Online' },
];

const offeredServicesOptions = [
  { id: '69', label: '69' },
  { id: 'baci-profondi', label: 'Baci profondi (FK)' },
  { id: 'bacio-leggero', label: 'Bacio leggero' },
  { id: 'due-ragazze', label: 'Due ragazze' },
  { id: 'girlfriend-experience', label: 'Girlfriend experience (GFE)' },
  { id: 'massaggio-professionale', label: 'Massaggio Professionale' },
  { id: 'massaggio-prostatico', label: 'Massaggio Prostatico' },
  { id: 'massaggio-sensuale-con-corpo', label: 'Massaggio sensuale con corpo' },
  { id: 'massaggio-tantrico', label: 'Massaggio Tantrico' },
  { id: 'masturbazione-con-mano', label: 'Masturbazione con mano (HJ)' },
  { id: 'orale-coperto-con-condom', label: 'Orale coperto con Condom' },
  { id: 'orale-scoperto', label: 'Orale scoperto (BBJ)' },
  { id: 'orgasmo-multiplo', label: 'Orgasmo multiplo' },
  { id: 'porn-star-experience', label: 'Porn Star Experience (PSE)' },
  { id: 'rapporto-anale', label: 'Rapporto anale' },
  { id: 'rapporto-sessuale', label: 'Rapporto sessuale' },
  { id: 'rimming', label: 'Rimming' },
  { id: 'sesso-orale', label: 'Sesso orale (DATY)' },
  { id: 'venuta-in-bocca', label: 'Venuta in bocca (CIM)' },
  { id: 'venuta-su-seno', label: 'Venuta su seno (COB)' },
  { id: 'altro', label: 'Altro' },
];

const ethnicities = [
  { value: 'africana', label: 'Africana' },
  { value: 'indiana', label: 'Indiana' },
  { value: 'asiatica', label: 'Asiatica' },
  { value: 'araba', label: 'Araba' },
  { value: 'latina', label: 'Latina' },
  { value: 'caucasica', label: 'Caucasica' },
  { value: 'italiana', label: 'Italiana' },
  { value: 'mista', label: 'Mista' },
  { value: 'altro', label: 'Altro' },
];

const nationalities = [
  { value: 'italiana', label: 'Italiana' },
  { value: 'rumena', label: 'Rumena' },
  { value: 'brasiliana', label: 'Brasiliana' },
  { value: 'spagnola', label: 'Spagnola' },
  { value: 'francese', label: 'Francese' },
  { value: 'tedesca', label: 'Tedesca' },
  { value: 'russa', label: 'Russa' },
  { value: 'ucraina', label: 'Ucraina' },
  { value: 'colombiana', label: 'Colombiana' },
  { value: 'venezuelana', label: 'Venezuelana' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'cubana', label: 'Cubana' },
  { value: 'dominicana', label: 'Dominicana' },
  { value: 'cinese', label: 'Cinese' },
  { value: 'filippina', label: 'Filippina' },
  { value: 'indonesiana', label: 'Indonesiana' },
  { value: 'thailandese', label: 'Thailandese' },
  { value: 'nigeriana', label: 'Nigeriana' },
  { value: 'egiziana', label: 'Egiziana' },
  { value: 'marocchina', label: 'Marocchina' },
  { value: 'albanese', label: 'Albanese' },
  { value: 'polacca', label: 'Polacca' },
  { value: 'britannica', label: 'Britannica' },
  { value: 'americana', label: 'Americana' },
    { value: 'canadese', label: 'Canadese' },
    { value: 'australiana', label: 'Australiana' },
    { value: 'altro', label: 'Altro' },
  ];

const breastTypes = [
    { value: 'naturale', label: 'Naturale' },
    { value: 'rifatto', label: 'Rifatto' },
    { value: 'piccolo', label: 'Piccolo' },
    { value: 'medio', label: 'Medio' },
    { value: 'grande', label: 'Grande' },
  ];

const hairColors = [
    { value: 'biondi', label: 'Biondi' },
    { value: 'castani', label: 'Castani' },
    { value: 'neri', label: 'Neri' },
    { value: 'rossi', label: 'Rossi' },
    { value: 'grigi', label: 'Grigi' },
    { value: 'colorati', label: 'Colorati' },
  ];

const bodyTypes = [
    { value: 'snella', label: 'Snella' },
    { value: 'atletica', label: 'Atletica' },
    { value: 'curvy', label: 'Curvy' },
    { value: 'robusta', label: 'Robusta' },
    { value: 'media', label: 'Media' },
  ];

const eyeColors = [
    { value: 'azzurri', label: 'Azzurri' },
    { value: 'marroni', label: 'Marroni' },
    { value: 'verdi', label: 'Verdi' },
    { value: 'neri', label: 'Neri' },
    { value: 'grigi', label: 'Grigi' },
    { value: 'misti', label: 'Misti' },
  ];

const listingSchema = z.object({
  category: z.string({ required_error: 'La categoria è obbligatoria.' }),
  city: z.string({ required_error: 'La città è obbligatoria.' }),
  zone: z.string().optional(),
  age: z.string()
    .min(1, "L'età è obbligatoria.")
    .refine((val) => !isNaN(parseInt(val, 10)), { message: "L'età deve essere un numero." })
    .refine((val) => parseInt(val, 10) >= 18, { message: "Devi avere almeno 18 anni." }),
  title: z.string().min(15, 'Il titolo deve avere almeno 15 caratteri e includere dettagli importanti.'),
  description: z.string().min(50, 'La descrizione deve avere almeno 50 caratteri e includere dettagli rilevanti.'),
  email: z.string().email("L'email non è valida.").optional(),
  phone: z.string().optional(),
  contact_preference: z.enum(['email', 'phone', 'both'], { required_error: 'La preferenza di contatto è obbligatoria.' }),
  contact_whatsapp: z.boolean().optional().default(false),
  // Nuovi campi per i dettagli personali
  ethnicity: z.array(z.string()).optional().default([]),
  nationality: z.array(z.string()).optional().default([]),
  breast_type: z.array(z.string()).optional().default([]),
  hair_color: z.array(z.string()).optional().default([]),
  body_type: z.array(z.string()).optional().default([]),
  eye_color: z.array(z.string()).optional().default([]),
  // Nuovi campi per tipologia di incontro, disponibilità, luogo e tariffa oraria
  meeting_type: z.array(z.string()).optional().default([]),
  availability_for: z.array(z.string()).optional().default([]),
  meeting_location: z.array(z.string()).optional().default([]),
  hourly_rate: z.coerce.number().min(0, "La tariffa oraria non può essere negativa.").optional().nullable(),
  // Nuovo campo per i servizi offerti
  offered_services: z.array(z.string()).optional().default([]),
});

const NewListing = () => {
  const navigate = useNavigate();
  const [filesToUpload, setFilesToUpload] = useState<NewFilePair[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink();

  // Stati per i popover dei filtri personali
  const [isEthnicityPopoverOpen, setIsEthnicityPopoverOpen] = useState(false);
  const [isNationalityPopoverOpen, setIsNationalityPopoverOpen] = useState(false);
  const [isBreastTypePopoverOpen, setIsBreastTypePopoverOpen] = useState(false);
  const [isHairColorPopoverOpen, setIsHairColorPopoverOpen] = useState(false);
  const [isBodyTypePopoverOpen, setIsBodyTypePopoverOpen] = useState(false);
  const [isEyeColorPopoverOpen, setIsEyeColorPopoverOpen] = useState(false);

  // Stati per i popover dei filtri incontro
  const [isMeetingTypePopoverOpen, setIsMeetingTypePopoverOpen] = useState(false);
  const [isAvailabilityForPopoverOpen, setIsAvailabilityForPopoverOpen] = useState(false);
  const [isMeetingLocationPopoverOpen, setIsMeetingLocationPopoverOpen] = useState(false);

  // Stato per il popover dei servizi offerti
  const [isOfferedServicesPopoverOpen, setIsOfferedServicesPopoverOpen] = useState(false);


  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      zone: '',
      email: '',
      phone: '',
      contact_preference: 'both',
      contact_whatsapp: false,
      ethnicity: [],
      nationality: [],
      breast_type: [],
      hair_color: [],
      body_type: [],
      eye_color: [],
      meeting_type: [],
      availability_for: [],
      meeting_location: [],
      hourly_rate: null,
      offered_services: [], // Default per il nuovo campo
    }
  });

  const contactPreference = form.watch('contact_preference');
  const phoneValue = form.watch('phone');

  useEffect(() => {
    const fetchUserEmailAndId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        form.setValue('email', user.email);
        setCurrentUserId(user.id);
      }
    };
    fetchUserEmailAndId();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    setIsLoading(true);
    const toastId = showLoading('Pubblicazione annuncio in corso...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Devi essere autenticato per creare un annuncio.');

      const { age, phone, ...restOfValues } = values;
      const formattedPhone = formatPhoneNumber(phone);

      const { data: newListing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          category: restOfValues.category,
          city: restOfValues.city,
          zone: restOfValues.zone,
          age: parseInt(age, 10),
          title: restOfValues.title,
          description: restOfValues.description,
          email: restOfValues.email?.trim() || null,
          phone: formattedPhone,
          contact_preference: restOfValues.contact_preference,
          contact_whatsapp: restOfValues.contact_whatsapp,
          last_bumped_at: new Date().toISOString(),
          // Nuovi campi
          ethnicity: restOfValues.ethnicity,
          nationality: restOfValues.nationality,
          breast_type: restOfValues.breast_type,
          hair_color: restOfValues.hair_color,
          body_type: restOfValues.body_type,
          eye_color: restOfValues.eye_color,
          meeting_type: restOfValues.meeting_type,
          availability_for: restOfValues.availability_for,
          meeting_location: restOfValues.meeting_location,
          hourly_rate: restOfValues.hourly_rate,
          offered_services: restOfValues.offered_services, // Inserisci il nuovo campo
        })
        .select('id')
        .single();

      if (listingError || !newListing) {
        throw new Error(listingError?.message || 'Errore nella creazione dell\'annuncio.');
      }

      const listingId = newListing.id;

      if (filesToUpload.length > 0) {
        const photoUploadPromises = filesToUpload.map(async (filePair, index) => {
          // Upload original file
          const originalFileExtension = filePair.original.name.split('.').pop();
          const originalFileName = `${crypto.randomUUID()}.${originalFileExtension}`;
          const originalFilePath = `${user.id}/${listingId}/original_${originalFileName}`;
          
          const { error: originalUploadError } = await supabase.storage
            .from('listing_photos')
            .upload(originalFilePath, filePair.original);

          if (originalUploadError) {
            throw new Error(`Errore nel caricamento della foto originale ${index + 1}: ${originalUploadError.message}`);
          }
          const { data: { publicUrl: originalPublicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(originalFilePath);

          // Upload cropped file
          const croppedFileExtension = filePair.cropped.name.split('.').pop();
          const croppedFileName = `${crypto.randomUUID()}.${croppedFileExtension}`;
          const croppedFilePath = `${user.id}/${listingId}/cropped_${croppedFileName}`;
          
          const { error: croppedUploadError } = await supabase.storage
            .from('listing_photos')
            .upload(croppedFilePath, filePair.cropped);

          if (croppedUploadError) {
            throw new Error(`Errore nel caricamento della foto ritagliata ${index + 1}: ${croppedUploadError.message}`);
          }
          const { data: { publicUrl: croppedPublicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(croppedFilePath);
          
          return {
            listing_id: listingId,
            url: croppedPublicUrl,
            original_url: originalPublicUrl,
            is_primary: index === primaryIndex,
          };
        });

        const photoPayloads = await Promise.all(photoUploadPromises);

        const { error: photosError } = await supabase.from('listing_photos').insert(photoPayloads);

        if (photosError) {
          await supabase.from('listings').delete().eq('id', listingId);
          throw new Error(photosError.message || 'Errore nel salvataggio delle foto.');
        }
      }

      dismissToast(toastId);
      showSuccess('Annuncio pubblicato con successo!');
      navigate(`/promote-listing/${listingId}`);
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiSelectChange = (
    _currentSelection: string[], // Renamed to _currentSelection to suppress TS6133
    onChange: (...event: any[]) => void,
    itemId: string,
    checked: boolean
  ) => {
    const newSelection = checked
      ? [..._currentSelection, itemId]
      : _currentSelection.filter(id => id !== itemId);
    onChange(newSelection);
  };

  const getSelectedLabel = (selectedItems: string[], options: { value: string; label: string }[]) => {
    if (selectedItems.length === 0) return "Seleziona...";
    if (selectedItems.length === 1) return options.find(o => o.value === selectedItems[0])?.label || "Seleziona...";
    return `${selectedItems.length} selezionati`;
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Crea un nuovo annuncio</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Dettagli annuncio</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <p className="text-sm text-gray-500 -mb-4">I campi contrassegnati con * sono obbligatori.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleziona una categoria" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="donna-cerca-uomo">👩‍❤️‍👨 Donna cerca Uomo</SelectItem>
                            <SelectItem value="donna-cerca-donna">👩‍❤️‍👩 Donna cerca Donna</SelectItem>
                            <SelectItem value="uomo-cerca-donna">👨‍❤️‍👩 Uomo cerca Donna</SelectItem>
                            <SelectItem value="uomo-cerca-uomo">👨‍❤️‍👨 Uomo cerca Uomo</SelectItem>
                            <SelectItem value="coppie">👩‍❤️‍💋‍👨 Coppie</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Città *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleziona una città" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {italianProvinces.map((p) => <SelectItem key={p.value} value={p.label}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona (Opzionale)</FormLabel>
                        <FormControl><Input placeholder="Es. Centro, Parioli, Fuorigrotta" {...field} /></FormControl>
                        <FormDescription>Aggiungi una zona specifica per aiutare gli altri utenti a trovarti più facilmente.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Età *</FormLabel>
                        <FormControl><Input type="number" placeholder="La tua età" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo *</FormLabel>
                      <FormControl><Input placeholder="Es. Donna affascinante cerca uomo a Milano per serate speciali" {...field} /></FormControl>
                      <FormDescription>Un titolo chiaro e dettagliato attira più attenzione. Includi la tua città e cosa cerchi.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione *</FormLabel>
                        <FormControl><Textarea placeholder="Descrivi dettagliatamente cosa cerchi, i tuoi interessi e la tua personalità. Più dettagli fornisci, più facile sarà trovare la persona giusta." className="min-h-[120px]" {...field} /></FormControl>
                        <FormDescription>Una descrizione completa e sincera aiuta a trovare la persona giusta e rende il tuo annuncio più interessante.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                {/* Nuova sezione Dettagli Personali */}
                <h2 className="text-xl font-bold text-gray-800 pt-4">Dettagli Personali</h2>
                <p className="text-sm text-gray-500 -mt-4">Questi dettagli saranno visibili pubblicamente solo per gli annunci Premium.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="ethnicity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4" /> Origine (Opzionale)</FormLabel>
                        <Popover open={isEthnicityPopoverOpen} onOpenChange={setIsEthnicityPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isEthnicityPopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, ethnicities)}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca origine..." />
                              <CommandEmpty>Nessuna origine trovata.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {ethnicities.map((option) => {
                                    const isSelected = field.value.includes(option.value);
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.value, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.value, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4" /> Nazionalità (Opzionale)</FormLabel>
                        <Popover open={isNationalityPopoverOpen} onOpenChange={setIsNationalityPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isNationalityPopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, nationalities)}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca nazionalità..." />
                              <CommandEmpty>Nessuna nazionalità trovata.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {nationalities.map((option) => {
                                    const isSelected = field.value.includes(option.value);
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.value, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.value, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="breast_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Ruler className="h-4 w-4" /> Tipo di Seno (Opzionale)</FormLabel>
                        <Popover open={isBreastTypePopoverOpen} onOpenChange={setIsBreastTypePopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isBreastTypePopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, breastTypes)}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca tipo di seno..." />
                              <CommandEmpty>Nessun tipo di seno trovato.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {breastTypes.map((option) => {
                                    const isSelected = field.value.includes(option.value);
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.value, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.value, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hair_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Palette className="h-4 w-4" /> Colore Capelli (Opzionale)</FormLabel>
                        <Popover open={isHairColorPopoverOpen} onOpenChange={setIsHairColorPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isHairColorPopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, hairColors)}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca colore capelli..." />
                              <CommandEmpty>Nessun colore capelli trovato.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {hairColors.map((option) => {
                                    const isSelected = field.value.includes(option.value);
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.value, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.value, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="body_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Ruler className="h-4 w-4" /> Corporatura (Opzionale)</FormLabel>
                        <Popover open={isBodyTypePopoverOpen} onOpenChange={setIsBodyTypePopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isBodyTypePopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, bodyTypes)}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca corporatura..." />
                              <CommandEmpty>Nessuna corporatura trovata.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {bodyTypes.map((option) => {
                                    const isSelected = field.value.includes(option.value);
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.value, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.value, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="eye_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Eye className="h-4 w-4" /> Colore Occhi (Opzionale)</FormLabel>
                        <Popover open={isEyeColorPopoverOpen} onOpenChange={setIsEyeColorPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isEyeColorPopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, eyeColors)}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca colore occhi..." />
                              <CommandEmpty>Nessun colore occhi trovato.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {eyeColors.map((option) => {
                                    const isSelected = field.value.includes(option.value);
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.value, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.value, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Nuovi campi per tipologia di incontro, disponibilità, luogo e tariffa oraria */}
                <h2 className="text-xl font-bold text-gray-800 pt-4">Dettagli Incontro</h2>
                <p className="text-sm text-gray-500 -mt-4">Questi dettagli saranno visibili pubblicamente solo per gli annunci Premium.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="meeting_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Handshake className="h-4 w-4" /> Tipologia di Incontro (Opzionale)</FormLabel>
                        <Popover open={isMeetingTypePopoverOpen} onOpenChange={setIsMeetingTypePopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isMeetingTypePopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Handshake className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, meetingTypeOptions.map(o => ({ value: o.id, label: o.label })))}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca tipologia..." />
                              <CommandEmpty>Nessuna tipologia trovata.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {meetingTypeOptions.map((option) => {
                                    const isSelected = field.value.includes(option.id);
                                    return (
                                      <CommandItem
                                        key={option.id}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.id, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.id, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability_for"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" /> Disponibilità per (Opzionale)</FormLabel>
                        <Popover open={isAvailabilityForPopoverOpen} onOpenChange={setIsAvailabilityForPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isAvailabilityForPopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, availabilityForOptions.map(o => ({ value: o.id, label: o.label })))}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca disponibilità..." />
                              <CommandEmpty>Nessuna disponibilità trovata.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {availabilityForOptions.map((option) => {
                                    const isSelected = field.value.includes(option.id);
                                    return (
                                      <CommandItem
                                        key={option.id}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.id, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.id, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meeting_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Home className="h-4 w-4" /> Luogo Incontro (Opzionale)</FormLabel>
                        <Popover open={isMeetingLocationPopoverOpen} onOpenChange={setIsMeetingLocationPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isMeetingLocationPopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, meetingLocationOptions.map(o => ({ value: o.id, label: o.label })))}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca luogo..." />
                              <CommandEmpty>Nessun luogo trovato.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {meetingLocationOptions.map((option) => {
                                    const isSelected = field.value.includes(option.id);
                                    return (
                                      <CommandItem
                                        key={option.id}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.id, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.id, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Euro className="h-4 w-4" /> Tariffa Oraria (Opzionale)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input 
                              type="number" 
                              placeholder="Es. 50" 
                              {...field} 
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Inserisci la tua tariffa oraria in Euro.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Nuovo campo per i servizi offerti */}
                  <FormField
                    control={form.control}
                    name="offered_services"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Quali servizi offri? (Opzionale)</FormLabel>
                        <Popover open={isOfferedServicesPopoverOpen} onOpenChange={setIsOfferedServicesPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isOfferedServicesPopoverOpen}
                                className="w-full justify-between pl-10 relative"
                              >
                                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                {getSelectedLabel(field.value, offeredServicesOptions.map(o => ({ value: o.id, label: o.label })))}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca servizio..." />
                              <CommandEmpty>Nessun servizio trovato.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-60 overflow-y-auto">
                                  {offeredServicesOptions.map((option) => {
                                    const isSelected = field.value.includes(option.id);
                                    return (
                                      <CommandItem
                                        key={option.id}
                                        value={option.label}
                                        onSelect={() => handleMultiSelectChange(field.value, field.onChange, option.id, !isSelected)}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleMultiSelectChange(field.value, field.onChange, option.id, checked as boolean)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                        <CheckIcon
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                              {field.value.length > 0 && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-center text-red-500 hover:text-red-600"
                                      onClick={() => field.onChange([])}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contact_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Come vuoi essere contattato? *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleziona preferenza di contatto" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Solo Email</SelectItem>
                          <SelectItem value="phone">Solo Telefono</SelectItem>
                          <SelectItem value="both">Email e Telefono</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email {contactPreference === 'email' || contactPreference === 'both' ? '*' : '(Opzionale)'}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            readOnly
                            className={cn(
                              "bg-gray-100 cursor-not-allowed",
                              (contactPreference === 'phone') && "opacity-50"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono {contactPreference === 'phone' || contactPreference === 'both' ? '*' : '(Opzionale)'}</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="Il tuo numero di telefono" 
                            {...field} 
                            readOnly={contactPreference === 'email'}
                            className={cn(
                              (contactPreference === 'email') && "bg-gray-100 cursor-not-allowed opacity-50"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(contactPreference === 'phone' || contactPreference === 'both') && phoneValue && (
                  <FormField
                    control={form.control}
                    name="contact_whatsapp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!phoneValue || isLoading}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Contatto WhatsApp</FormLabel>
                          <FormDescription>
                            Se selezionato, il pulsante del telefono avvierà una chat WhatsApp.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <div>
                  <FormLabel>Fotografie</FormLabel>
                  <p className="text-sm text-gray-500 mb-2">Carica fino a 5 foto per il tuo annuncio. Se l'annuncio non è Premium, verrà mostrata solo la prima foto.</p>
                  <ImageUploader
                    listingId={undefined}
                    userId={currentUserId ?? undefined}
                    initialPhotos={[]}
                    isPremiumOrPending={true}
                    onFilesChange={setFilesToUpload}
                    onPrimaryIndexChange={setPrimaryIndex}
                    onExistingPhotosUpdated={() => {}}
                    hideMainPreview={false}
                  />
                </div>
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
                  {isLoading ? 'Pubblicazione in corso...' : 'Pubblica Annuncio'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewListing;