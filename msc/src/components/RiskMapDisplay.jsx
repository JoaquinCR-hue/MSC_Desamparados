import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/RiskMapDisplay.css';

const RiskMapDisplay = ({ reportes, agregatedStats }) => {
  
  const getColor = (count) => {
    if (count <= 2) return "#4CAF50"; // Green
    if (count <= 5) return "#FFD600"; // Yellow
    if (count <= 6) return "#FF9100"; // Orange
    return "#FF1744"; // Red
  };

  const getBorderColor = (count) => {
    if (count <= 2) return "#2E7D32";
    if (count <= 5) return "#F9A825";
    if (count <= 6) return "#EF6C00";
    return "#C62828";
  };

  return (
    <div className="risk-map-display-wrapper">
      <div className="map-section">
        <MapContainer 
          center={[9.892, -84.05]} 
          zoom={13} 
          scrollWheelZoom={true} 
          className="map-instance"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {reportes.map(reporte => {
            if (!reporte.lat || !reporte.lng) return null;

            const countInDistrict = agregatedStats[reporte.distrito] || 1;
            const color = getColor(countInDistrict);
            const borderColor = getBorderColor(countInDistrict);

            return (
              <CircleMarker
                key={reporte.id}
                center={[reporte.lat, reporte.lng]}
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
                    <span className="popup-type">{reporte.tipo}</span>
                    <span className="popup-date">
                      {new Date(reporte.fecha).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="popup-info">
                    <span className="info-dist">{reporte.distrito}</span>
                    <p className="info-desc">{reportes.descripcion || "Incidente reportado por ciudadano."}</p>
                    <div className="info-loc">
                      <i className="fa-solid fa-location-crosshairs"></i> {reporte.barrio}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

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
            {Object.keys(agregatedStats).length > 0 ? (
              Object.entries(agregatedStats)
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
