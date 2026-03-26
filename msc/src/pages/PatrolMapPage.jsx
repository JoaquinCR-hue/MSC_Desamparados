import React from 'react';
import Navbar from '../components/Navbar';
import PatrolMap from '../components/PatrolMap';
import Footer from '../components/Footer';
import '../styles/FuncionarioDashboard.css';

const PatrolMapPage = () => {
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
          <PatrolMap />
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default PatrolMapPage;
