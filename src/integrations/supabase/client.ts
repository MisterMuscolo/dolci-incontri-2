import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bpfhentkvaelbphqlfot.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZmhlbnRrdmFlbGJwaHFsZm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjU4NTAsImV4cCI6MjA3MTEwMTg1MH0.AhXWW0HzHdkLJJS6hkL3LGrrZ_HFQVwseux0ZR6NORM';

export const supabase = createClient(supabaseUrl, supabaseKey);