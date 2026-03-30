import React, { useState, useEffect } from 'react';
import ServiceReportes from '../services/ServiceReportes';
import Navbar from './Navbar';
import RiskMapDisplay from './RiskMapDisplay';
import '../styles/MapaRiesgo.css';

const RELEVANT_TYPES = [
  'Asalto', 'Hurto', 'Robo', 'Tacha De Vehículo', 'Robo De Vehículo', 'Homicidio',
  'Balacera', 'Ventas de drogas', 'Persona sospechosa', 'Actividad sospechosa', 'Objeto sospechoso',
  'Femicidio', 'Maltrato a mujer', 'Violencia domestica'
];

const MapRiesgo = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agregatedStats, setAgregatedStats] = useState({});

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        const data = await ServiceReportes.getReportes();

        // Filter reports from the last 7 days AND relevant types
        const hoy = new Date();
        const unaSemanaAtras = new Date();
        unaSemanaAtras.setDate(hoy.getDate() - 7);

        const reportesFiltrados = data.filter(r => {
          if (!r.fecha || !r.tipo) return false;

          const fechaReporte = new Date(r.fecha);
          const esReciente = fechaReporte >= unaSemanaAtras;
          const esRelevante = RELEVANT_TYPES.includes(r.tipo);

          return esReciente && esRelevante;
        });

        // Agregamos por distrito para las estadísticas
        const stats = {};
        reportesFiltrados.forEach(r => {
          const dist = r.distrito;
          if (dist) {
            stats[dist] = (stats[dist] || 0) + 1;
          }
        });

        setReportes(reportesFiltrados);
        setAgregatedStats(stats);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar reportes:", error);
        setLoading(false);
      }
    };

    fetchReportes();
  }, []);

  return (
    <div className="mapa-riesgo-page">
      <Navbar />
      <div className="mapa-riesgo-content">
        <header className="page-header-premium">
          <div className="header-badge">SEGURIDAD CIUDADANA</div>
          <h1>Mapa de Riesgo Comunitario</h1>
          <p>Localización inteligente de incidentes reportados en la última semana.</p>
        </header>

        <div className="alert-banner-v2">
          <div className="alert-content">
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span><strong>Datos Dinámicos:</strong> El mapa se actualiza automáticamente cada 7 días para reflejar la situación actual.</span>
          </div>
        </div>

        {loading ? (
          <div className="premium-loader">
            <div className="pulse-loader"></div>
            <p>Sincronizando con el servidor de seguridad...</p>
          </div>
        ) : (
          <div className="map-view-integrated">
            <RiskMapDisplay reportes={reportes} agregatedStats={agregatedStats} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MapRiesgo;
