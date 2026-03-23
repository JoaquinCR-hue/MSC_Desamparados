import React from 'react';
import Navbar from './Navbar';
import PatrolMap from './PatrolMap';
import '../styles/FuncionarioDashboard.css';

function FuncionarioDashboard() {
  return (
    <div className="funcionario-dashboard-page">
      <div className="dashboard-content-premium">
        <header className="dashboard-header-premium">
          <div className="d-flex align-items-center mb-2">
            <span className="badge bg-primary me-2 px-3 py-2 text-uppercase letter-spacing-1">CENTRO DE COMANDO</span>
          </div>
          <h1>Centro Operativo Municipal</h1>
          <p>Control de patrullaje, asignación de unidades e incidentes reportados en tiempo real.</p>
        </header>

        <section className="map-section-wrapper">
          <PatrolMap />
        </section>
      </div>
    </div>
  );
}

export default FuncionarioDashboard;
