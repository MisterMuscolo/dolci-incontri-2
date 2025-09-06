import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugifyFilename(filename: string): string {
  return filename
    .normalize("NFD") // Normalizza i caratteri accentati (es. "à" -> "a")
    .replace(/[\u0300-\u036f]/g, "") // Rimuove i diacritici
    .toLowerCase() // Converti in minuscolo
    .trim() // Rimuovi spazi bianchi all'inizio e alla fine
    .replace(/\s+/g, '-') // Sostituisci gli spazi con trattini
    .replace(/[^a-z0-9-.]/g, '') // Rimuovi tutti i caratteri non alfanumerici, trattini o punti
    .replace(/--+/g, '-') // Sostituisci trattini multipli con un singolo trattino
    .replace(/^-+/, '') // Rimuovi trattini all'inizio
    .replace(/-+$/, ''); // Rimuovi trattini alla fine
}

export function formatPhoneNumber(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) {
    return null;
  }
  const cleanedNumber = phoneNumber.replace(/\s/g, ''); // Rimuove tutti gli spazi
  if (!cleanedNumber) {
    return null;
  }
  // Controlla se il numero inizia già con un prefisso internazionale (es. +39, 0039)
  if (cleanedNumber.startsWith('+') || cleanedNumber.startsWith('00')) {
    return cleanedNumber;
  }
  // Altrimenti, aggiungi il prefisso +39
  return `+39${cleanedNumber}`;
}