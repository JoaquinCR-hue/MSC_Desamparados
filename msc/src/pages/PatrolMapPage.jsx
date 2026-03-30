import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import PatrolMap from '../components/PatrolMap';
import BitacoraPatrullaje from '../components/BitacoraPatrullaje';
import Footer from '../components/Footer';
import '../styles/FuncionarioDashboard.css';

const PatrolMapPage = () => {
  const [refreshGlobal, setRefreshGlobal] = useState(0);

  const handleGlobalUpdate = () => {
    setRefreshGlobal(prev => prev + 1);
  };
  return (
    <div className="funcionario-dashboard-page">
      <Navbar />
      <div className="dashboard-content-premium pt-4">
        <header className="dashboard-header-premium d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1>Mapa de Patrullaje</h1>
            <p>Control táctico y monitoreo de las unidades en tiempo real.</p>
          </div>
        </header>

        <section className="map-section-wrapper">
          <PatrolMap refreshTrigger={refreshGlobal} onPatrolUpdate={handleGlobalUpdate} />
        </section>

        <section className="bitacora-section-wrapper mt-5 px-3">
          <BitacoraPatrullaje refreshTrigger={refreshGlobal} onGlobalUpdate={handleGlobalUpdate} />
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default PatrolMapPage;
