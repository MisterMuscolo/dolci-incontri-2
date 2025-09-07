import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

// Rimosso routeNames in quanto non più necessario per il testo dinamico

export const useDynamicBackLink = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Mantenuto per coerenza, anche se non direttamente usato per il testo

  // La funzione getPreviousPath non è più necessaria per determinare il testo,
  // ma la manteniamo se in futuro volessimo ripristinare una logica più complessa.
  // Per ora, non viene utilizzata per il testo del link.
  const getPreviousPath = useCallback(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return '/'; 
    }

    // Default: go up one level in the path
    if (pathSegments.length > 0) {
      return '/' + pathSegments.slice(0, pathSegments.length - 1).join('/');
    }
    
    return '/'; 
  }, [location.pathname]);

  // backPath non è più usato per il testo, ma può essere utile per altri scopi
  const backPath = getPreviousPath(); 

  const getBackLinkText = useCallback(() => {
    return 'Indietro'; // Restituisce sempre "Indietro"
  }, []);

  const handleNavigateBack = useCallback(() => {
    navigate(-1); // Naviga semplicemente indietro nella cronologia del browser
  }, [navigate]);

  return { getBackLinkText, handleNavigateBack, backPath };
};