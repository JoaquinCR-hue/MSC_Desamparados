import React, { useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup,
  Polyline, Marker, Rectangle, useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/RutasSeguras.css';

// ── Límites del cantón de Desamparados ───────────────────────────────────────
const BOUNDS_DESAMPARADOS = {
  minLat: 9.82,
  maxLat: 9.98,
  minLng: -84.18,
  maxLng: -83.92,
};

const dentroDeDesamparados = (lat, lng) =>
  lat >= BOUNDS_DESAMPARADOS.minLat &&
  lat <= BOUNDS_DESAMPARADOS.maxLat &&
  lng >= BOUNDS_DESAMPARADOS.minLng &&
  lng <= BOUNDS_DESAMPARADOS.maxLng;

// Rectángulo de límite para visualizar en el mapa
const BOUNDS_RECT = [
  [BOUNDS_DESAMPARADOS.minLat, BOUNDS_DESAMPARADOS.minLng],
  [BOUNDS_DESAMPARADOS.maxLat, BOUNDS_DESAMPARADOS.maxLng],
];

// ── Capas de mapa: nocturno y diurno ─────────────────────────────────────────
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

// ── Íconos personalizados para marcadores A y B ───────────────────────────────
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

const iconOrigen = makeIcon('A', '#00C853');
const iconDestino = makeIcon('B', '#FF1744');

// ── Capturar clics en el mapa ─────────────────────────────────────────────────
const MapClickHandler = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

// ============================================================================
const SafeRouteMap = ({
  origen,
  destino,
  onOrigenChange,
  onDestinoChange,
  rutaCoordenadas,
  rutaColor,
  reportes,
  modoSeleccion,
  onFueraLimite,
}) => {
  const [mapMode, setMapMode] = useState('night'); // 'night' | 'day'
  const [alertaFuera, setAlertaFuera] = useState(false);

  const getColorIncidente = (count) => {
    if (count <= 2) return '#4CAF50';
    if (count <= 5) return '#FFD600';
    if (count <= 6) return '#FF9100';
    return '#FF1744';
  };

  const handleClick = useCallback((latlng) => {
    const { lat, lng } = latlng;

    // Validar que esté dentro del cantón
    if (!dentroDeDesamparados(lat, lng)) {
      setAlertaFuera(true);
      setTimeout(() => setAlertaFuera(false), 3000);
      if (onFueraLimite) onFueraLimite();
      return;
    }

    const punto = [lat, lng];
    if (modoSeleccion === 'origen') {
      onOrigenChange(punto);
    } else if (modoSeleccion === 'destino') {
      onDestinoChange(punto);
    }
  }, [modoSeleccion, onOrigenChange, onDestinoChange, onFueraLimite]);

  const cursorClass = modoSeleccion ? 'map-cursor-crosshair' : '';
  const tileLayer = TILE_LAYERS[mapMode];

  return (
    <>
      <div className="map-mode-toggle cont-temas">
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
      <div className={`safe-route-map-wrapper ${cursorClass}`}>

        {/* ── Hint de selección ─────────────────────────────────────────── */}
        {modoSeleccion && (
          <div className="map-selection-hint">
            <i className={`fa-solid ${modoSeleccion === 'origen' ? 'fa-location-dot' : 'fa-flag-checkered'}`}></i>
            Haz clic en el mapa para marcar el {modoSeleccion === 'origen' ? 'ORIGEN (A)' : 'DESTINO (B)'}
          </div>
        )}

        {/* ── Alerta: fuera de Desamparados ────────────────────────────── */}
        {alertaFuera && (
          <div className="map-out-of-bounds-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            El punto está fuera del cantón de Desamparados
          </div>
        )}

        {/* ── Toggle día/noche ─────────────────────────────────────────── */}


        <MapContainer
          center={[9.892, -84.05]}
          zoom={13}
          scrollWheelZoom={true}
          className="safe-map-instance"
          maxBounds={BOUNDS_RECT}
          maxBoundsViscosity={0.85}
        >
          <TileLayer url={tileLayer.url} attribution={ATTR} />

          <MapClickHandler onClick={handleClick} />

          {/* Borde del cantón */}
          <Rectangle
            bounds={BOUNDS_RECT}
            pathOptions={{
              color: '#00C853',
              weight: 2,
              opacity: 0.5,
              fillOpacity: 0,
              dashArray: '8 6',
            }}
          />

          {/* Incidentes existentes del backend */}
          {reportes.map(reporte => {
            if (!reporte.lat || !reporte.lng) return null;
            return (
              <CircleMarker
                key={reporte.id}
                center={[reporte.lat, reporte.lng]}
                pathOptions={{
                  color: 'rgba(255,255,255,0.3)',
                  fillColor: getColorIncidente(1),
                  fillOpacity: 0.35,
                  weight: 1,
                }}
                radius={9}
              >
                <Popup className="premium-popup">
                  <div className="popup-banner">
                    <span className="popup-type">{reporte.tipo}</span>
                    <span className="popup-date">
                      {reporte.fecha ? new Date(reporte.fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                  <div className="popup-info">
                    <span className="info-dist">{reporte.distrito}</span>
                    <div className="info-loc">
                      <i className="fa-solid fa-location-crosshairs"></i> {reporte.barrio}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Polilínea de la ruta calculada */}
          {rutaCoordenadas && rutaCoordenadas.length > 1 && (
            <>
              <Polyline
                positions={rutaCoordenadas}
                pathOptions={{ color: 'rgba(0,0,0,0.4)', weight: 10, opacity: 1 }}
              />
              <Polyline
                positions={rutaCoordenadas}
                pathOptions={{ color: rutaColor, weight: 5, opacity: 0.95 }}
              />
            </>
          )}

          {/* Marcador A – Origen */}
          {origen && (
            <Marker position={origen} icon={iconOrigen}>
              <Popup><strong>📍 Origen</strong><br />{origen[0].toFixed(5)}, {origen[1].toFixed(5)}</Popup>
            </Marker>
          )}

          {/* Marcador B – Destino */}
          {destino && (
            <Marker position={destino} icon={iconDestino}>
              <Popup><strong>🏁 Destino</strong><br />{destino[0].toFixed(5)}, {destino[1].toFixed(5)}</Popup>
            </Marker>
          )}
        </MapContainer>


      </div>
    </>
  );
};

export default SafeRouteMap;
