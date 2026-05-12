import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/RiskMapDisplay.css';
import desamparadosGeo from '../data/desamparados.json';
import distritosGeo from '../data/distritos.json';

/**
 * Capas base para el mapa (Día/Noche).
 */
const TILE_LAYERS = {
  night: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  day: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
};

/**
 * Componente auxiliar para refrescar el tamaño del mapa al cargar.
 * Soluciona problemas de renderizado de Leaflet en contenedores dinámicos.
 */
const MapRefresher = () => {
  const map = useMap();
  React.useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

/**
 * Componente que muestra el mapa de calor/riesgo con marcadores circulares.
 * @param {Array} reports - Lista de incidentes a mostrar.
 * @param {Object} aggregatedStats - Estadísticas de conteo por distrito.
 */
const RiskMapDisplay = ({ reports, aggregatedStats }) => {
  const [mapMode, setMapMode] = React.useState('night');
  
  /**
   * Determina el color del marcador según la cantidad de incidentes en el distrito.
   * @param {number} count - Cantidad de reportes.
   * @returns {string} Código de color Hexadecimal.
   */
  const getColor = (count) => {
    if (count <= 2) return "#4CAF50"; // Verde (Bajo)
    if (count <= 5) return "#FFD600"; // Amarillo (Medio)
    if (count <= 6) return "#FF9100"; // Naranja (Alto)
    return "#FF1744"; // Rojo (Crítico)
  };

  /**
   * Determina el color del borde del marcador.
   */
  const getBorderColor = (count) => {
    if (count <= 2) return "#2E7D32";
    if (count <= 5) return "#F9A825";
    if (count <= 6) return "#EF6C00";
    return "#C62828";
  };

  return (
    <div className="risk-map-display-wrapper">
      <div className="map-section">
        {/* Selector de modo del mapa (Día/Noche) */}
        <div className="map-mode-toggle cont-temas" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, background: 'rgba(26, 28, 34, 0.9)', padding: '5px', borderRadius: '10px' }}>
          <button
            className={`boton-n map-mode-btn ${mapMode === 'night' ? 'active' : ''}`}
            onClick={() => setMapMode('night')}
            title="Modo nocturno"
          >
            <i className="fa-solid fa-moon"></i>
            <span>Noche</span>
          </button>
          <button
            className={`map-mode-btn ${mapMode === 'day' ? 'active' : ''}`}
            onClick={() => setMapMode('day')}
            title="Modo diurno"
          >
            <i className="fa-solid fa-sun"></i>
            <span>Día</span>
          </button>
        </div>

        <MapContainer 
          center={[9.892, -84.05]} 
          zoom={13} 
          scrollWheelZoom={true} 
          className="map-instance"
          zoomControl={false}
        >
          <MapRefresher />
          <ZoomControl position="bottomright" />
          <TileLayer
            url={TILE_LAYERS[mapMode].url}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {/* Límites geográficos del cantón y distritos */}
          <GeoJSON 
            data={desamparadosGeo} 
            pathOptions={{ color: '#00FFFF', weight: 4, fillOpacity: 0.0, opacity: 0.8 }} 
          />
          <GeoJSON 
            data={distritosGeo} 
            pathOptions={{ color: mapMode === 'day' ? '#000000' : '#FFFFFF', weight: 1.5, dashArray: '5, 5', fillOpacity: 0.05, opacity: 0.6 }} 
          />
          
          {/* Renderizado de incidentes como marcadores circulares */}
          {reports.map(report => {
            if (!report.lat || !report.lng) return null;

            const countInDistrict = aggregatedStats[report.distrito] || 1;
            const color = getColor(countInDistrict);
            const borderColor = getBorderColor(countInDistrict);

            return (
              <CircleMarker
                key={report.id}
                center={[report.lat, report.lng]}
                pathOptions={{
                  color: borderColor,
                  fillColor: color,
                  fillOpacity: 0.8,
                  weight: 2,
                }}
                radius={12}
              >
                <Popup className="premium-popup">
                  <div className="popup-banner">
                    <span className="popup-type">{report.tipo}</span>
                    <span className="popup-date">
                      {new Date(report.fecha).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="popup-info">
                    <span className="info-dist">{report.distrito}</span>
                    <p className="info-desc">{report.descripcion || "Incidente reportado por ciudadano."}</p>
                    <div className="info-loc">
                      <i className="fa-solid fa-location-crosshairs"></i> {report.barrio}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Barra lateral con leyenda y estadísticas por distrito */}
      <aside className="sidebar-section">
        <div className="legend-container">
          <h3><i className="fa-solid fa-layer-group"></i> Escala de Riesgo</h3>
          
          <div className="legend-item-v2">
            <div className="status-dot dot-green"></div>
            <div className="legend-label">
              <span className="label-title">Incidencia Baja</span>
              <span className="label-desc">1-2 reportes registrados</span>
            </div>
          </div>

          <div className="legend-item-v2">
            <div className="status-dot dot-yellow"></div>
            <div className="legend-label">
              <span className="label-title">Incidencia Media</span>
              <span className="label-desc">3-5 reportes registrados</span>
            </div>
          </div>

          <div className="legend-item-v2">
            <div className="status-dot dot-orange"></div>
            <div className="legend-label">
              <span className="label-title">Incidencia Alta</span>
              <span className="label-desc">5-6 reportes registrados</span>
            </div>
          </div>

          <div className="legend-item-v2">
            <div className="status-dot dot-red"></div>
            <div className="legend-label">
              <span className="label-title">Riesgo Crítico</span>
              <span className="label-desc">7+ reportes en la zona</span>
            </div>
          </div>
        </div>

        <div className="ranking-container">
          <h3><i className="fa-solid fa-chart-line"></i> Estadísticas</h3>
          <div className="stats-scroll">
            {Object.keys(aggregatedStats).length > 0 ? (
              Object.entries(aggregatedStats)
                .sort((a, b) => b[1] - a[1])
                .map(([dist, count]) => (
                  <div key={dist} className="stat-card-v2">
                    <div className="stat-header-v2">
                      <span className="dist-name-v2">{dist}</span>
                      <span className="count-badge-v2">{count}</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${Math.min((count / 10) * 100, 100)}%`,
                          backgroundColor: getColor(count)
                        }}
                      ></div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="empty-stats">
                <p>No hay datos esta semana.</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default RiskMapDisplay;

