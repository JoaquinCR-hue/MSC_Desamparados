import React from 'react';
import RiskMap from '../components/RiskMap';
import Footer from '../components/Footer';

/**
 * Página del mapa de riesgo del cantón.
 * Muestra la distribución geográfica de los incidentes reportados.
 */
function RiskMapPage() {
  return (
    <>
      <RiskMap />
      <Footer />
    </>
  );
}

export default RiskMapPage;
