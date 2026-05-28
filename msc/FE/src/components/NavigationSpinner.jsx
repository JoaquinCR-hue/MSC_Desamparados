import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/NavigationSpinner.css';

/**
 * Componente que muestra una pantalla de carga premium con desenfoque de fondo (glassmorphism)
 * y una animación moderna cada vez que el usuario cambia de página/ruta.
 */
const NavigationSpinner = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Activar pantalla de carga al cambiar de ruta
    setIsLoading(true);
    setIsFadingOut(false);

    // Mantener la carga visible por un tiempo corto para evitar parpadeos bruscos
    // y asegurar una experiencia suave y premium.
    const displayTimer = setTimeout(() => {
      setIsFadingOut(true);
      
      // Esperar a que termine la animación CSS de fade-out (300ms) para desmontar
      const fadeTimer = setTimeout(() => {
        setIsLoading(false);
        setIsFadingOut(false);
      }, 300);

      return () => clearTimeout(fadeTimer);
    }, 550); // Mostrar durante 550ms

    return () => {
      clearTimeout(displayTimer);
    };
  }, [location.pathname, location.search]);

  if (!isLoading) return null;

  return (
    <div className={`page-loader-overlay ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
      <div className="spinner-wrapper">
        <div className="spinner-ring-outer"></div>
        <div className="spinner-ring-inner"></div>
        <div className="spinner-logo">
          <i className="fa-solid fa-user-shield logo-pulse-icon"></i>
        </div>
        <div className="spinner-text-container">
          <span className="spinner-text">MSC Desamparados</span>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationSpinner;
