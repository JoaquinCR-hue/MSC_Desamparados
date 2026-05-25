import React, { useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup,
  Polyline, Marker, Rectangle, useMapEvents, GeoJSON, ZoomControl, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/SafeRoutes.css';
import desamparadosGeo from '../data/desamparados.json';
import distritosGeo from '../data/distritos.json';

/**
 * Límites geográficos del cantón de Desamparados para restringir el mapa.
 */
const BOUNDS_DESAMPARADOS = {
  minLat: 9.70, // Incluye zonas del sur como Frailes
  maxLat: 9.98,
  minLng: -84.18,
  maxLng: -83.92,
};

/**
 * Valida si un punto geográfico está dentro de los límites de Desamparados.
 * @param {number} lat - Latitud.
 * @param {number} lng - Longitud.
 * @returns {boolean} True si está dentro.
 */
const isInsideDesamparados = (lat, lng) =>
  lat >= BOUNDS_DESAMPARADOS.minLat &&
  lat <= BOUNDS_DESAMPARADOS.maxLat &&
  lng >= BOUNDS_DESAMPARADOS.minLng &&
  lng <= BOUNDS_DESAMPARADOS.maxLng;

// Rectángulo de límites para visualizar en el mapa (maxBounds)
const BOUNDS_RECT = [
  [BOUNDS_DESAMPARADOS.minLat, BOUNDS_DESAMPARADOS.minLng],
  [BOUNDS_DESAMPARADOS.maxLat, BOUNDS_DESAMPARADOS.maxLng],
];

/**
 * Configuración de capas de mapa (Modo Noche y Día).
 */
const TILE_LAYERS = {
  night: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    label: 'Nocturno',
    icon: 'fa-moon',
  },
  day: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    label: 'Diurno',
    icon: 'fa-sun',
  },
};
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Crea un ícono personalizado con una letra para los puntos de origen (A) y destino (B).
 */
const makeIcon = (letter, color) => L.divIcon({
  className: '',
  html: `
    <div style="
      background: ${color};
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-weight: 900; font-size: 14px;">${letter}</span>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const originIcon = makeIcon('A', '#00C853');
const destinationIcon = makeIcon('B', '#FF1744');

const liveIcon = L.divIcon({
  className: 'waze-live-icon-wrapper',
  html: `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div class="gps-pulse" style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(0, 191, 255, 0.4);
        box-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
      "></div>
      <div style="
        position: relative;
        background: #00B0FF;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0, 176, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <i class="fa-solid fa-location-arrow" style="transform: rotate(-45deg); font-size: 10px;"></i>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

/**
 * Sub-componente para capturar clics del usuario en el mapa.
 */
const MapClickHandler = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

/**
 * Sub-componente para forzar el refresco de Leaflet al cargar.
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
 * Componente del mapa de rutas seguras.
 * Visualiza el origen, destino, las rutas trazadas y la ubicación en vivo.
 */
const SafeRouteMap = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  routes = [],
  selectedRouteId = null,
  onSelectRoute,
  liveLocation = null,
  reports = [],
  selectionMode = null,
  onOutOfBounds,
}) => {
  const [mapMode, setMapMode] = useState('night'); // 'night' | 'day'
  const [outOfBoundsAlert, setOutOfBoundsAlert] = useState(false);

  /**
   * Determina el color del incidente según la gravedad.
   */
  const getIncidentColor = (count) => {
    if (count <= 2) return '#4CAF50';
    if (count <= 5) return '#FFD600';
    if (count <= 6) return '#FF9100';
    return '#FF1744';
  };

  /**
   * Maneja el clic en el mapa para asignar origen o destino según el modo.
   */
  const handleClick = useCallback((latlng) => {
    const { lat, lng } = latlng;

    // Validar que el punto seleccionado esté dentro del cantón
    if (!isInsideDesamparados(lat, lng)) {
      setOutOfBoundsAlert(true);
      setTimeout(() => setOutOfBoundsAlert(false), 3000);
      if (onOutOfBounds) onOutOfBounds();
      return;
    }

    const point = [lat, lng];
    if (selectionMode === 'origin') {
      onOriginChange(point);
    } else if (selectionMode === 'destination') {
      onDestinationChange(point);
    }
  }, [selectionMode, onOriginChange, onDestinationChange, onOutOfBounds]);

  const cursorClass = selectionMode ? 'map-cursor-crosshair' : '';
  const tileLayer = TILE_LAYERS[mapMode];

  return (
    <>
      <div className={`safe-route-map-wrapper ${cursorClass}`}>
        {/* Toggle de Modo Día/Noche */}
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

        {/* Indicador visual de qué punto se está seleccionando */}
        {selectionMode && (
          <div className="map-selection-hint">
            <i className={`fa-solid ${selectionMode === 'origin' ? 'fa-location-dot' : 'fa-flag-checkered'}`}></i>
            Haz clic en el mapa para marcar el {selectionMode === 'origin' ? 'ORIGEN (A)' : 'DESTINO (B)'}
          </div>
        )}

        {/* Alerta de punto fuera de límites */}
        {outOfBoundsAlert && (
          <div className="map-out-of-bounds-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            El punto está fuera del cantón de Desamparados
          </div>
        )}

        <MapContainer
          center={[9.892, -84.05]}
          zoom={13}
          scrollWheelZoom={true}
          className="safe-map-instance"
          maxBounds={BOUNDS_RECT}
          maxBoundsViscosity={0.85}
          zoomControl={false}
        >
          <MapRefresher />
          <ZoomControl position="bottomright" />
          <TileLayer url={tileLayer.url} attribution={ATTR} />

          {/* GeoJSON del cantón y distritos */}
          <GeoJSON 
            data={desamparadosGeo} 
            pathOptions={{ color: '#00FFFF', weight: 4, fillOpacity: 0.0, opacity: 0.8 }} 
          />
          <GeoJSON 
            data={distritosGeo} 
            pathOptions={{ color: mapMode === 'day' ? '#000000' : '#FFFFFF', weight: 1.5, dashArray: '5, 5', fillOpacity: 0.05, opacity: 0.6 }} 
          />
          <MapClickHandler onClick={handleClick} />

          {/* Visualización de incidentes históricos recientes */}
          {reports.map(report => {
            if (!report.lat || !report.lng) return null;
            return (
              <CircleMarker
                key={report.id}
                center={[report.lat, report.lng]}
                pathOptions={{
                  color: 'rgba(255,255,255,0.3)',
                  fillColor: getIncidentColor(1),
                  fillOpacity: 0.35,
                  weight: 1,
                }}
                radius={9}
              >
                <Popup className="premium-popup">
                  <div className="popup-banner">
                    <span className="popup-type">{report.tipo}</span>
                    <span className="popup-date">
                      {report.fecha ? new Date(report.fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                  <div className="popup-info">
                    <span className="info-dist">{report.distrito}</span>
                    <div className="info-loc">
                      <i className="fa-solid fa-location-crosshairs"></i> {report.barrio}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Dibujo de las múltiples rutas calculadas */}
          {routes.map(route => {
            const isSelected = route.id === selectedRouteId;
            return (
              <React.Fragment key={route.id}>
                {/* Contorno interactivo */}
                <Polyline
                  positions={route.coordinates}
                  pathOptions={{
                    color: isSelected ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)',
                    weight: isSelected ? 12 : 8,
                    opacity: isSelected ? 0.95 : 0.4
                  }}
                  eventHandlers={{
                    click: () => onSelectRoute && onSelectRoute(route.id)
                  }}
                />
                {/* Línea principal */}
                <Polyline
                  positions={route.coordinates}
                  pathOptions={{
                    color: isSelected ? route.riskColor : '#78909c',
                    weight: isSelected ? 6 : 4,
                    opacity: isSelected ? 0.95 : 0.6,
                    dashArray: isSelected ? null : '6, 12'
                  }}
                  eventHandlers={{
                    click: () => onSelectRoute && onSelectRoute(route.id)
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Marcador de Ubicación en Vivo (GPS Waze-style) */}
          {liveLocation && (
            <Marker position={liveLocation} icon={liveIcon}>
              <Popup><strong>📍 Mi ubicación actual</strong><br />Navegación GPS Waze activa</Popup>
            </Marker>
          )}

          {/* Marcador del Punto A (Origen) */}
          {origin && (
            <Marker position={origin} icon={originIcon}>
              <Popup><strong>📍 Origen</strong><br />{origin[0].toFixed(5)}, {origin[1].toFixed(5)}</Popup>
            </Marker>
          )}

          {/* Marcador del Punto B (Destino) */}
          {destination && (
            <Marker position={destination} icon={destinationIcon}>
              <Popup><strong>🏁 Destino</strong><br />{destination[0].toFixed(5)}, {destination[1].toFixed(5)}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </>
  );
};

export default SafeRouteMap;

