import React from 'react';
import SafeRoutes from '../components/SafeRoutes';
import Footer from '../components/Footer';

/**
 * Página de rutas seguras.
 * Permite al usuario calcular rutas con análisis de riesgo basado en incidentes reportados.
 */
function SafeRoutesPage() {
  return (
    <>
      <SafeRoutes />
      <Footer />
    </>
  );
}

export default SafeRoutesPage;
