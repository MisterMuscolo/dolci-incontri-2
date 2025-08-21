import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not defined in environment variables.');
  // In un'applicazione reale, potresti voler mostrare un errore all'utente o bloccare l'app.
  // Per ora, logghiamo l'errore e procediamo, ma le chiamate a Supabase falliranno.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);