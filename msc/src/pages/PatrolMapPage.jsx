import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import PatrolMap from '../components/PatrolMap';
import PatrolLog from '../components/PatrolLog';
import Footer from '../components/Footer';
import '../styles/OfficerDashboard.css';

/**
 * Página del mapa de patrullaje.
 * Muestra el mapa con posiciones de unidades en tiempo real y la bitácora de patrullaje.
 * Usa un contador compartido para sincronizar actualizaciones entre el mapa y la bitácora.
 */
const PatrolMapPage = () => {
  // Contador que incrementa cada vez que se actualiza una unidad,
  // forzando que tanto el mapa como la bitácora se recarguen en sincronía
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleGlobalUpdate = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="officer-dashboard-page">
      <Navbar />
      <div className="dashboard-content-premium pt-4">
        <header className="dashboard-header-premium d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1>Mapa de Patrullaje</h1>
            <p>Control táctico y monitoreo de las unidades en tiempo real.</p>
          </div>
        </header>

        {/* Mapa interactivo de patrullaje */}
        <section className="map-section-wrapper">
          <PatrolMap refreshTrigger={refreshCounter} onPatrolUpdate={handleGlobalUpdate} />
        </section>

        {/* Bitácora de unidades en servicio */}
        <section className="patrol-log-section-wrapper mt-5 px-3">
          <PatrolLog refreshTrigger={refreshCounter} onGlobalUpdate={handleGlobalUpdate} />
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default PatrolMapPage;
