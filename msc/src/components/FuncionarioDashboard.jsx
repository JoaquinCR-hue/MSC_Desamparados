import React, { useState, useEffect } from 'react';
import PatrolMap from './PatrolMap';
import '../styles/FuncionarioDashboard.css';
import ServiceReportes from '../services/ServiceReportes';

function FuncionarioDashboard() {
  const [reportesCount, setReportesCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await ServiceReportes.getReportes();
        setReportesCount(data.length);
      } catch(e) {
        console.error(e);
      }
    };
    init();

    const interval = setInterval(async () => {
      try {
        const data = await ServiceReportes.getReportes();
        setReportesCount(prev => {
          if (prev > 0 && data.length > prev) {
            setRefreshKey(Date.now()); // Recargar mapa
          }
          return Math.max(prev, data.length);
        });
      } catch(e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="funcionario-dashboard-page">
      <div className="dashboard-content-premium pt-4">
        <header className="dashboard-header-premium d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center mb-2">
              <span className="badge bg-light text-primary border border-primary-subtle me-2 px-3 py-2 text-uppercase letter-spacing-1">CENTRO DE COMANDO</span>
            </div>
            <h1>Centro Operativo Municipal</h1>
            <p>Control de patrullaje, asignación de unidades e incidentes reportados en tiempo real.</p>
          </div>
        </header>

        <section className="map-section-wrapper">
          <PatrolMap refreshTrigger={refreshKey} />
        </section>
      </div>
    </div>
  );
}

export default FuncionarioDashboard;
