import { useState, useEffect, useRef, useCallback } from 'react';

export const PULL_THRESHOLD = 80; // pixel da scorrere verso il basso per attivare il refresh
const REFRESH_DELAY = 500; // ms di ritardo prima del refresh per mostrare lo spinner

export const usePullToRefresh = () => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isRefreshing = useRef(false); // Per prevenire refresh multipli

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Attiva solo se si è in cima alla pagina e non si sta già ricaricando
    if (window.scrollY === 0 && !isRefreshing.current) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing.current) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0) { // Solo se si scorre verso il basso
      e.preventDefault(); // Impedisce lo scorrimento nativo se si tira giù dall'alto
      setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5)); // Limita la distanza per la visualizzazione
    } else {
      // Se l'utente inizia a scorrere verso l'alto, o muove il dito verso l'alto dopo aver tirato giù, resetta
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (isPulling && pullDistance >= PULL_THRESHOLD && !isRefreshing.current) {
      isRefreshing.current = true;
      // Mostra l'indicatore di caricamento per un breve momento prima di ricaricare
      setTimeout(() => {
        window.location.reload();
      }, REFRESH_DELAY);
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance]);

  useEffect(() => {
    // Usa passive: false per touchstart e touchmove per consentire e.preventDefault()
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isPulling, pullDistance };
};