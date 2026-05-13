import React, { useState, useEffect } from 'react';
import ReportService from '../services/ReportService';
import Navbar from './Navbar';
import RiskMapDisplay from './RiskMapDisplay';
import '../styles/RiskMap.css';

// Tipos de incidentes considerados relevantes para el mapa de riesgo de seguridad
const RELEVANT_TYPES = [
  'Asalto', 'Hurto', 'Robo', 'Tacha De Vehículo', 'Robo De Vehículo', 'Homicidio',
  'Balacera', 'Ventas de drogas', 'Persona sospechosa', 'Actividad sospechosa', 'Objeto sospechoso',
  'Femicidio', 'Maltrato a mujer', 'Violencia domestica'
];

// Componente de página para visualizar el mapa de riesgo interactivo
const RiskMap = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aggregatedStats, setAggregatedStats] = useState({});

  useEffect(() => {
    // Carga los reportes y filtra los más recientes para el análisis de riesgo
    const fetchReports = async () => {
      try {
        const data = await ReportService.getReports();

        // Filtra reportes de los últimos 7 días y de tipos relevantes
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        const filteredReports = data.filter(report => {
          if (!report.fecha || !report.tipo) return false;

          const reportDate = new Date(report.fecha);
          const isRecent = reportDate >= oneWeekAgo;
          const isRelevant = RELEVANT_TYPES.includes(report.tipo);

          return isRecent && isRelevant;
        });

        // Agrega estadísticas por distrito para la visualización
        const stats = {};
        filteredReports.forEach(report => {
          const district = report.distrito;
          if (district) {
            stats[district] = (stats[district] || 0) + 1;
          }
        });

        setReports(filteredReports);
        setAggregatedStats(stats);
        setLoading(false);
      } catch (error) {
        console.error("Error loading reports for Risk Map:", error);
        setLoading(false);
      }
    };

    fetchReports();
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
            {/* Renderiza el visualizador del mapa con los datos procesados */}
            <RiskMapDisplay reports={reports} aggregatedStats={aggregatedStats} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskMap;
