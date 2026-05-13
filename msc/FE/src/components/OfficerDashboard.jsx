import React, { useState, useEffect } from 'react';
import PatrolMap from './PatrolMap';
import ReportService from '../services/ReportService';
import '../styles/OfficerDashboard.css';

/**
 * Componente Principal: OfficerDashboard
 * Centro de mando para funcionarios municipales. Monitorea incidentes y unidades de patrullaje.
 */
function OfficerDashboard() {
  const [reportsCount, setReportsCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    /**
     * Inicializa el contador de reportes al cargar.
     */
    const initializeDashboard = async () => {
      try {
        const data = await ReportService.getReports();
        setReportsCount(data.length);
      } catch (error) {
        console.error("Error al inicializar el dashboard de oficiales:", error);
      }
    };
    initializeDashboard();

    /**
     * Intervalo de refresco cada 5 segundos para detectar nuevos incidentes
     * y disparar una recarga del mapa de patrullaje.
     */
    const pollingInterval = setInterval(async () => {
      try {
        const data = await ReportService.getReports();
        setReportsCount(prevCount => {
          // Si el número de reportes aumentó, forzamos el refresco del mapa
          if (prevCount > 0 && data.length > prevCount) {
            setRefreshKey(Date.now());
          }
          return Math.max(prevCount, data.length);
        });
      } catch (error) {
        console.error("Error en el polling de reportes:", error);
      }
    }, 5000);

    return () => clearInterval(pollingInterval);
  }, []);

  return (
    <div className="officer-dashboard-page">
      <div className="dashboard-content-premium pt-4">
        <header className="dashboard-header-premium d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center mb-2">
              <span className="badge bg-light text-primary border border-primary-subtle me-2 px-3 py-2 text-uppercase letter-spacing-1">
                CENTRO DE COMANDO
              </span>
            </div>
            <h1>Centro Operativo Municipal</h1>
            <p>Control de patrullaje, asignación de unidades e incidentes reportados en tiempo real.</p>
          </div>
        </header>

        {/* Sección del mapa táctico de patrullaje */}
        <section className="map-section-wrapper">
          <PatrolMap refreshTrigger={refreshKey} />
        </section>
      </div>
    </div>
  );
}

export default OfficerDashboard;
