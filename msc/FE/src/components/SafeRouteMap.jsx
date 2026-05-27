import React, { useState, useCallback, useEffect } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup,
  Polyline, Marker, Rectangle, useMapEvents, GeoJSON, ZoomControl, useMap, Circle
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/SafeRoutes.css';
import Swal from 'sweetalert2';
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
  className: 'gps-live-icon-wrapper',
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
    let resizeTimer = null;
    const doInvalidate = (animate = false) => {
      try {
        // animating sometimes helps on mobile when chrome/ui chrome changes
        map.invalidateSize(animate);
      } catch (err) {
        // no-op but keep debugging info
        // console.warn('Map invalidate error', err);
      }
    };

    // initial delayed invalidate (give layout a moment)
    const timer = setTimeout(() => {
      // debug
      // console.debug('MapRefresher: initial invalidate');
      doInvalidate(true);
    }, 600);

    // debounce handler for window resize/orientation changes
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => doInvalidate(true), 250);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Also observe the wrapper element size changes
    let ro;
    try {
      const el = document.querySelector('.safe-route-map-wrapper');
      if (el && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => doInvalidate(false));
        ro.observe(el);
      }
    } catch (e) {
      // ignore
    }

    return () => {
      clearTimeout(timer);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (ro) ro.disconnect();
    };
  }, [map]);

  return null;
};

// Diagnostic control rendered inside MapContainer when `?debug_map=true` is present
const MapDebugControls = () => {
  const map = useMap();
  const params = new URLSearchParams(window.location.search);
  const debug = params.get('debug_map') === 'true';
  if (!debug) return null;

  const handleForce = () => {
    try {
      console.info('MapDebugControls: forcing invalidateSize()');
      map.invalidateSize(true);
    } catch (e) {
      console.error('MapDebugControls error', e);
    }
  };

  return (
    <div style={{ position: 'absolute', zIndex: 4000, right: 12, bottom: 12 }}>
      <button
        onClick={handleForce}
        style={{ padding: '8px 10px', borderRadius: 8, background: '#00C853', color: '#fff', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}
      >Forzar map.invalidateSize()</button>
    </div>
  );
};

/**
 * Sub-componente para controlar la vista del mapa y centrar al navegar.
 * Solo autocentra en la ubicación en vivo cuando el modo navegación está activo.
 */
const MapViewController = ({ liveLocation, origin, destination, navigationMode }) => {
  const map = useMap();

  useEffect(() => {
    // Solo seguir automáticamente al usuario cuando el modo navegación está activado
    if (navigationMode && liveLocation) {
      map.setView([liveLocation[0], liveLocation[1]], Math.max(map.getZoom(), 16), { animate: true, duration: 0.8 });
    }
  }, [liveLocation, navigationMode, map]);

  useEffect(() => {
    // Centrar en el origen solo cuando se establece por primera vez (sin navegación activa)
    if (!navigationMode && origin && !liveLocation) {
      map.setView([origin[0], origin[1]], 15, { animate: true });
    }
  }, [origin, map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Forzar a Leaflet a recalcular el tamaño cuando cambia el modo de navegación
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [navigationMode, map]);

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
  externalHeading = null, // Rumbo externo provisto por el GPS real del dispositivo
  liveLocationAccuracy = null, // Precisión de geolocalización en metros
}) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [mapUnlocked, setMapUnlocked] = useState(false);
  const [mapMode, setMapMode] = useState('night'); // 'night' | 'day'
  const [outOfBoundsAlert, setOutOfBoundsAlert] = useState(false);

  // Estados de navegación y orientación
  const [navigationMode, setNavigationMode] = useState(false);
  const [compassActive, setCompassActive] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState(0); // Rumbo del sensor del dispositivo

  // El rumbo efectivo: si el GPS provee rumbo externo de movimiento real, lo usamos;
  // de lo contrario usamos el sensor de orientación del dispositivo
  const heading = (externalHeading !== null && externalHeading !== 0) ? externalHeading : deviceHeading;

  const handleOrientation = useCallback((e) => {
    // Solo usar el sensor de orientación si no hay rumbo GPS externo
    if (externalHeading) return;
    let compass = e.webkitCompassHeading || e.alpha;
    if (compass !== null && compass !== undefined) {
      let headingVal = e.webkitCompassHeading;
      if (headingVal === undefined || headingVal === null) {
        headingVal = e.alpha ? 360 - e.alpha : 0;
      }
      setDeviceHeading(headingVal);
    }
  }, [externalHeading]);

  useEffect(() => {
    if (compassActive) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      window.removeEventListener('deviceorientation', handleOrientation);
      setDeviceHeading(0);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [compassActive, handleOrientation]);

  const toggleCompass = async () => {
    if (compassActive) {
      setCompassActive(false);
    } else {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        try {
          const response = await DeviceOrientationEvent.requestPermission();
          if (response === 'granted') {
            setNavigationMode(true); // Auto-activar modo navegación si se activa brújula
            setCompassActive(true);
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Permiso Denegado',
              text: 'Se requiere acceso a los sensores para activar la brújula.',
              background: '#1f2937',
              color: '#fff'
            });
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setNavigationMode(true); // Auto-activar modo navegación si se activa brújula
        setCompassActive(true);
      }
    }
  };

  const resetCompass = () => {
    setCompassActive(false);
    setDeviceHeading(0);
  };

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
      <div className={`safe-route-map-wrapper ${cursorClass}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
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

        {/* Controles de Vista y Brújula */}
        <div className="nav-controls-container" style={{ position: 'absolute', top: '70px', right: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className={`nav-control-btn ${navigationMode ? 'active' : ''}`}
            onClick={() => setNavigationMode(!navigationMode)}
            title="Modo Navegación (Autocentrar)"
            style={{
              background: navigationMode ? 'var(--primary-color)' : 'rgba(26, 28, 34, 0.9)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              fontSize: '16px',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-location-crosshairs"></i>
          </button>
          <button
            type="button"
            className={`nav-control-btn ${compassActive ? 'active' : ''}`}
            onClick={toggleCompass}
            title="Brújula / Giroscopio"
            style={{
              background: compassActive ? '#00C853' : 'rgba(26, 28, 34, 0.9)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              fontSize: '16px',
              transition: 'all 0.2s'
            }}
          >
            <i className={`fa-solid ${compassActive ? 'fa-compass fa-spin-pulse' : 'fa-compass'}`}></i>
          </button>
        </div>

        {/* Brújula Flotante */}
        <div
          className="nav-compass-widget"
          onClick={resetCompass}
          title="Hacer clic para reorientar al Norte"
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(26, 28, 34, 0.75)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ position: 'absolute', top: '2px', fontSize: '9px', fontWeight: 'bold', color: '#ff4444' }}>N</span>
            <span style={{ position: 'absolute', right: '4px', fontSize: '8px', color: '#94a3b8' }}>E</span>
            <span style={{ position: 'absolute', bottom: '2px', fontSize: '8px', color: '#94a3b8' }}>S</span>
            <span style={{ position: 'absolute', left: '4px', fontSize: '8px', color: '#94a3b8' }}>O</span>
            
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '20px solid #ff4444',
                position: 'absolute',
                transform: `rotate(${-heading}deg)`,
                transformOrigin: '50% 100%',
                top: '10px',
                transition: 'transform 0.1s ease-out'
              }}
            />
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '20px solid #94a3b8',
                position: 'absolute',
                transform: `rotate(${-heading}deg)`,
                transformOrigin: '50% 0%',
                bottom: '10px',
                transition: 'transform 0.1s ease-out'
              }}
            />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ffffff',
              zIndex: 2,
              boxShadow: '0 0 4px rgba(0,0,0,0.5)'
            }} />
          </div>
        </div>

        <div className={`nav-perspective-container ${navigationMode ? 'nav-active' : ''}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, '--map-rotation': `${-heading}deg` }}>
          <MapContainer
            center={[9.892, -84.05]}
            zoom={13}
            scrollWheelZoom={true}
            className="safe-map-instance"
            style={{ width: '100%', height: '100%' }}
            maxBounds={BOUNDS_RECT}
            maxBoundsViscosity={0.85}
            dragging={true}
            touchZoom={true}
            doubleClickZoom={true}
            zoomControl={true}
          >
            <MapViewController liveLocation={liveLocation} origin={origin} destination={destination} navigationMode={navigationMode} />
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

            {/* Círculo de Precisión del GPS (Accuracy Ring) */}
            {liveLocation && liveLocationAccuracy && (
              <Circle
                center={liveLocation}
                radius={liveLocationAccuracy}
                pathOptions={{
                  color: '#00B0FF',
                  fillColor: '#00B0FF',
                  fillOpacity: 0.15,
                  weight: 1,
                  dashArray: '5, 5'
                }}
              />
            )}

            {/* Marcador de Ubicación en Vivo */}
            {liveLocation && (
              <Marker position={liveLocation} icon={liveIcon}>
                <Popup><strong>📍 Mi ubicación actual</strong><br />Navegación GPS activa</Popup>
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
            
            {/* Debug controls (only when ?debug_map=true) */}
            <MapDebugControls />
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default SafeRouteMap;

