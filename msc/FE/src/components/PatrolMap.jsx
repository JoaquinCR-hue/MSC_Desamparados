import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMapEvents, GeoJSON, ZoomControl, useMap, Polyline, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Form, Modal } from 'react-bootstrap';
import ReportService from '../services/ReportService';
import PoliceService from '../services/PoliceService';
import RouteService from '../services/RouteService';
import UserService from '../services/UserService';
import { getUserLocation, watchLocation, stopWatchLocation } from '../services/gpsService';
import Swal from 'sweetalert2';
import '../styles/PatrolMap.css';
import desamparadosGeo from '../data/desamparados.json';
import distritosGeo from '../data/distritos.json';

// Función para generar iconos dinámicos según el tipo de unidad
const getPatrolIcon = (type) => {
  const isMoto = type === 'Motocicleta';
  const iconClass = isMoto ? 'fa-motorcycle' : 'fa-truck-fast';
  
  return L.divIcon({
    html: `
      <div style="background-color: var(--primary-color); color: white; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid var(--bg-main); box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 16px;">
        <i class="fa-solid ${iconClass}"></i>
      </div>
    `,
    className: 'custom-patrol-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const BOUNDS_DESAMPARADOS = {
  minLat: 9.70,
  maxLat: 9.98,
  minLng: -84.18,
  maxLng: -83.92,
};

// Algoritmo Ray-Casting para verificar si un punto está dentro de un polígono
const isPointInPolygon = (point, polygon) => {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0], yi = polygon[i][1];
    let xj = polygon[j][0], yj = polygon[j][1];
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Verificación estricta contra el GeoJSON de Desamparados
const withinDesamparados = (lat, lng) => {
  if (!desamparadosGeo || !desamparadosGeo.features || !desamparadosGeo.features[0]) return true;
  const geometry = desamparadosGeo.features[0].geometry;
  const point = [lng, lat]; // GeoJSON usa formato [lng, lat]
  
  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => isPointInPolygon(point, poly[0]));
  }
  return false;
};

// Obtiene el nombre del distrito basado en las coordenadas proporcionadas
const getDistrictByLatLng = (lat, lng) => {
  if (!distritosGeo || !distritosGeo.features) return 'Desamparados';
  const point = [lng, lat];
  
  for (const feature of distritosGeo.features) {
    const geometry = feature.geometry;
    let inside = false;
    
    if (geometry.type === 'Polygon') {
      inside = isPointInPolygon(point, geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
      inside = geometry.coordinates.some(poly => isPointInPolygon(point, poly[0]));
    }
    
    if (inside) {
      return feature.properties.name || 'Desamparados';
    }
  }
  return 'Desamparados';
};

const BOUNDS_RECT = [
  [BOUNDS_DESAMPARADOS.minLat, BOUNDS_DESAMPARADOS.minLng],
  [BOUNDS_DESAMPARADOS.maxLat, BOUNDS_DESAMPARADOS.maxLng],
];

const TILE_LAYERS = {
  night: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  day: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
};

// Componente para manejar eventos de clic en el mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (!withinDesamparados(e.latlng.lat, e.latlng.lng)) {
        Swal.fire({
          icon: 'warning',
          title: 'Fuera de Límites',
          text: 'La patrulla debe ubicarse dentro del cantón de Desamparados.',
          background: '#1f2937', color: '#fff'
        });
        return;
      }
      onMapClick(e.latlng);
    }
  });
  return null;
}

// Asegura que el mapa se renderice correctamente tras cambios de tamaño
function MapRefresher() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * Sub-componente para controlar la vista del mapa y centrar/inclinar al navegar.
 */
const MapViewController = ({ activePatrol, navigationMode }) => {
  const map = useMap();

  useEffect(() => {
    if (activePatrol) {
      // Centrar directamente en la patrulla activa sin desfase 3D
      map.setView([activePatrol.lat, activePatrol.lng], 15, { animate: true });
    }
  }, [activePatrol, map]);

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
 * Calcula el rumbo (bearing) matemático entre dos coordenadas en grados (0-360).
 */
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
            
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

const PatrolMap = ({ refreshTrigger, onPatrolUpdate }) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [mapUnlocked, setMapUnlocked] = useState(false);
  const [mapMode, setMapMode] = useState('night');

  // Estados para la experiencia móvil de navegación
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [reports, setReports] = useState([]);
  const [patrols, setPatrols] = useState([]);
  const [availableOfficers, setAvailableOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para la gestión de rutas
  const [routingSource, setRoutingSource] = useState(null);
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);

  // Estados de navegación y orientación
  const [navigationMode, setNavigationMode] = useState(false);
  const [compassActive, setCompassActive] = useState(false);
  const [heading, setHeading] = useState(0);
  const [simulatingPatrolId, setSimulatingPatrolId] = useState(null);
  const [trackingPatrolId, setTrackingPatrolId] = useState(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState(null);
  
  const simulationRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastRecalculateTimeRef = useRef(0);
  const lastLocationRef = useRef(null);

  const handleOrientation = useCallback((e) => {
    // Si no está corriendo una simulación, usar sensores móviles
    if (!emergencyActive) {
      let compass = e.webkitCompassHeading || e.alpha;
      if (compass !== null && compass !== undefined) {
        let headingVal = e.webkitCompassHeading;
        if (headingVal === undefined || headingVal === null) {
          headingVal = e.alpha ? 360 - e.alpha : 0;
        }
        setHeading(headingVal);
      }
    }
  }, [emergencyActive]);

  useEffect(() => {
    if (compassActive) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (!emergencyActive) setHeading(0);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [compassActive, handleOrientation, emergencyActive]);

  // Limpiar simulación y GPS al desmontar
  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
      if (watchIdRef.current) stopWatchLocation(watchIdRef.current);
    };
  }, []);

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
            setNavigationMode(true);
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
        setNavigationMode(true);
        setCompassActive(true);
      }
    }
  };

  const resetCompass = () => {
    setCompassActive(false);
    setNavigationMode(false);
    if (!emergencyActive) setHeading(0);
  };

  // Desplegar patrulla en ubicación GPS real
  const handleDeployMyGPS = async () => {
    try {
      const location = await getUserLocation();
      const point = { lat: location.lat, lng: location.lng };
      handleMapClick(point);
      Swal.fire({
        icon: 'success',
        title: 'GPS Sincronizado',
        text: 'Despliegue operativo configurado en tus coordenadas actuales.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: '#1f2937', color: '#fff'
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error de GPS',
        text: 'No se pudo obtener la ubicación GPS de tu dispositivo.',
        background: '#1f2937', color: '#fff'
      });
    }
  };

  // Simular recorrido de emergencia en ruta más corta
  const handleSimulateEmergency = (route) => {
    const patrol = patrols.find(p => p.id === route.patrolId);
    if (!patrol) return;

    Swal.fire({
      icon: 'success',
      title: '🚨 Código Rojo Activado',
      text: `Unidad ${patrol.unidad} en ruta de emergencia hacia ${route.destinoTipo}. Navegación GPS activa por ruta más corta.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      background: '#7f1d1d',
      color: '#fff'
    });

    setSimulatingPatrolId(patrol.id);
    setNavigationMode(true);
    setEmergencyActive(true);

    let step = 0;
    const coords = route.coordenadas;
    const totalSteps = coords.length;

    if (simulationRef.current) clearInterval(simulationRef.current);

    simulationRef.current = setInterval(async () => {
      if (step >= totalSteps - 1) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
        setEmergencyActive(false);
        setSimulatingPatrolId(null);
        setHeading(0);

        const finalLat = coords[totalSteps - 1][0];
        const finalLng = coords[totalSteps - 1][1];
        
        const updatedPatrol = {
          ...patrol,
          lat: finalLat,
          lng: finalLng,
          estado: 'En Incidente',
          zona: getDistrictByLatLng(finalLat, finalLng)
        };

        await PoliceService.updatePatrol(updatedPatrol, patrol.id);
        await ReportService.updateReport({ estado: 'En Proceso' }, route.incidentId);

        Swal.fire({
          icon: 'success',
          title: '🚨 ¡Llegada a Escena!',
          text: `La unidad ${patrol.unidad} ha arribado al incidente de tipo ${route.destinoTipo}. El sector se encuentra bajo resguardo operativo.`,
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#00C853'
        });

        handleClearRoute(route.id);
        fetchData();
        if (onPatrolUpdate) onPatrolUpdate();
        return;
      }

      step++;
      const currentLat = coords[step][0];
      const currentLng = coords[step][1];

      // Calcular rumbo (bearing) hacia el siguiente punto de la ruta
      if (step < totalSteps - 1) {
        const nextLat = coords[step + 1][0];
        const nextLng = coords[step + 1][1];
        const bearing = calculateBearing(currentLat, currentLng, nextLat, nextLng);
        setHeading(bearing);
      }

      // Mover patrulla localmente
      setPatrols(prevPatrols => prevPatrols.map(p => {
        if (p.id === patrol.id) {
          return { ...p, lat: currentLat, lng: currentLng, estado: 'En Incidente' };
        }
        return p;
      }));

      // Actualizar stats de ruta activa en la barra lateral
      setActiveRoutes(prevRoutes => prevRoutes.map(r => {
        if (r.id === route.id) {
          const pctRemaining = 1 - (step / (totalSteps - 1));
          return {
            ...r,
            distanciaKm: (route.distanciaKm * pctRemaining).toFixed(2),
            duracionMin: Math.ceil(route.duracionMin * pctRemaining)
          };
        }
        return r;
      }));

    }, 450); // Avanzar rápido
  };

  // Iniciar navegación GPS real para misión de emergencia (Oficial en vivo)
  const handleStartEmergencyGPS = (route) => {
    const patrol = patrols.find(p => p.id === route.patrolId);
    if (!patrol) return;

    Swal.fire({
      icon: 'success',
      title: '🚨 Código Rojo Activado',
      text: `Unidad ${patrol.unidad} en ruta de emergencia física hacia ${route.destinoTipo}. GPS en vivo activo.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      background: '#7f1d1d',
      color: '#fff'
    });

    setTrackingPatrolId(patrol.id);
    setNavigationMode(true);
    setEmergencyActive(true);
    setGpsErrorMsg(null);

    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setSimulatingPatrolId(null);

    if (watchIdRef.current) {
      stopWatchLocation(watchIdRef.current);
    }

    watchIdRef.current = watchLocation(async (position) => {
      const currentLoc = [position.lat, position.lng];
      setGpsErrorMsg(null);

      // Buscar ruta activa
      const currentRoute = activeRoutes.find(r => r.id === route.id);
      if (!currentRoute) return;

      const coords = currentRoute.coordenadas;
      const totalPoints = coords.length;
      if (totalPoints === 0) return;

      // 1. Detección de desvío (> 40 metros)
      let minDistance = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < totalPoints; i++) {
        const dist = RouteService.getDistanceMeters(currentLoc, coords[i]);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      // Si se desvía más de 40 metros de la ruta trazada y la precisión es buena (< 25 metros)
      if (minDistance > 40 && position.accuracy < 25) {
        const now = Date.now();
        if (now - lastRecalculateTimeRef.current > 8000) {
          lastRecalculateTimeRef.current = now;
          console.log(`Oficial desviado por ${Math.round(minDistance)}m. Recalculando ruta más rápida en background...`);
          
          try {
            const incident = reports.find(r => r.id === route.incidentId);
            if (incident) {
              const recalculated = await RouteService.calculateRoute(
                currentLoc,
                [incident.lat, incident.lng],
                true,
                patrol.tipo_unidad
              );

              // Actualizar coordenadas de ruta
              setActiveRoutes(prev => prev.map(r => {
                if (r.id === route.id) {
                  return {
                    ...r,
                    coordenadas: recalculated.coordinates,
                    distanciaKm: recalculated.distanceKm,
                    duracionMin: recalculated.durationMin,
                    simulada: recalculated.simulated
                  };
                }
                return r;
              }));

              Swal.fire({
                icon: 'info',
                title: 'Ruta Recalculada',
                text: `Trazando una nueva ruta más rápida hacia el incidente para U-${patrol.unidad}.`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                background: '#1f2937',
                color: '#fff'
              });
            }
          } catch (err) {
            console.warn('Error recalculando ruta de emergencia:', err);
          }
          return;
        }
      }

      // 2. Mover patrulla localmente y en el backend
      setPatrols(prevPatrols => prevPatrols.map(p => {
        if (p.id === patrol.id) {
          return {
            ...p,
            lat: position.lat,
            lng: position.lng,
            estado: 'En Incidente',
            zona: getDistrictByLatLng(position.lat, position.lng)
          };
        }
        return p;
      }));

      try {
        const updatedPatrol = {
          ...patrol,
          lat: position.lat,
          lng: position.lng,
          estado: 'En Incidente',
          zona: getDistrictByLatLng(position.lat, position.lng)
        };
        await PoliceService.updatePatrol(updatedPatrol, patrol.id);
      } catch (err) {
        console.warn('Error syncing live patrol GPS:', err);
      }

      // 3. Orientar brújula/bearing según rumbo nativo o desplazamiento
      let headingVal = 0;
      if (position.heading !== null && position.heading !== undefined && !isNaN(position.heading)) {
        headingVal = position.heading;
      } else if (lastLocationRef.current) {
        let speedKmh = 0;
        if (position.speed !== null && position.speed !== undefined) {
          speedKmh = position.speed * 3.6;
        } else {
          const distPrev = RouteService.getDistanceMeters(lastLocationRef.current.coords, currentLoc);
          const timeDelta = (Date.now() - lastLocationRef.current.time) / 1000;
          if (timeDelta > 0 && distPrev > 1.5) {
            speedKmh = (distPrev / timeDelta) * 3.6;
          }
        }

        if (speedKmh > 3) {
          headingVal = calculateBearing(
            lastLocationRef.current.coords[0],
            lastLocationRef.current.coords[1],
            position.lat,
            position.lng
          );
        } else {
          headingVal = heading; // Mantener rumbo anterior
        }
      }
      setHeading(headingVal);

      lastLocationRef.current = { coords: currentLoc, time: Date.now() };

      // 4. Actualizar ETA y distancia
      const pctRemaining = 1 - (closestIdx / (totalPoints - 1 || 1));
      setActiveRoutes(prevRoutes => prevRoutes.map(r => {
        if (r.id === route.id) {
          return {
            ...r,
            distanciaKm: (currentRoute.distanciaKm * pctRemaining).toFixed(2),
            duracionMin: Math.ceil(currentRoute.duracionMin * pctRemaining)
          };
        }
        return r;
      }));

      // 5. Llegada a escena (< 20 metros)
      const destPoint = coords[totalPoints - 1];
      const distToDest = RouteService.getDistanceMeters(currentLoc, destPoint);

      if (distToDest < 20) {
        if (watchIdRef.current) {
          stopWatchLocation(watchIdRef.current);
          watchIdRef.current = null;
        }
        setEmergencyActive(false);
        setTrackingPatrolId(null);
        setHeading(0);

        try {
          const finalLat = destPoint[0];
          const finalLng = destPoint[1];
          const updatedPatrol = {
            ...patrol,
            lat: finalLat,
            lng: finalLng,
            estado: 'En Incidente',
            zona: getDistrictByLatLng(finalLat, finalLng)
          };

          await PoliceService.updatePatrol(updatedPatrol, patrol.id);
          await ReportService.updateReport({ estado: 'En Proceso' }, route.incidentId);
        } catch (err) {
          console.warn(err);
        }

        Swal.fire({
          icon: 'success',
          title: '🚨 ¡Llegada a Escena!',
          text: `La unidad U-${patrol.unidad} ha arribado al incidente de emergencia. Sector bajo resguardo operativo.`,
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#00C853'
        });

        handleClearRoute(route.id);
        fetchData();
        if (onPatrolUpdate) onPatrolUpdate();
      }

    }, (error) => {
      console.warn("GPS Patrol Error:", error);
      setGpsErrorMsg(error.message || "Señal de GPS inestable o permisos desactivados.");
    });
  };

  // Estados para el control de modales
  const [showModal, setShowModal] = useState(false);
  const [currentLatlng, setCurrentLatlng] = useState(null);
  const [editingPatrol, setEditingPatrol] = useState(null);

  // Estado para el formulario de patrullas
  const [formData, setFormData] = useState({
    nombre_oficiales: '',
    unidad: '',
    estado: 'Activa',
    zona: 'Desamparados',
    tipo_unidad: 'Patrulla',
    horaInicio: '',
    horaFin: ''
  });

  // Función para obtener todos los datos necesarios del backend
  const fetchData = async () => {
    try {
      const dataRep = await ReportService.getReports();
      const dataPol = await PoliceService.getPatrols();

      // Solo los administradores pueden ver la lista de usuarios.
      // Si el usuario es funcionario, esta llamada devolverá 403 y se ignora silenciosamente.
      let dataUsu = [];
      try {
        dataUsu = await UserService.getUsers();
      } catch (userError) {
        // Funcionarios no tienen permiso para listar usuarios — es normal, no es un error de sesión.
        console.info('Lista de usuarios no disponible para este rol.');
      }

      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);

      // Filtrar reportes para mostrar solo los de la última semana
      const filteredReports = dataRep.filter(r => {
        if (!r.fecha) return false;
        const reportDate = new Date(r.fecha);
        return reportDate >= oneWeekAgo;
      });

      const validPatrols = dataPol || [];
      
      setReports(filteredReports);
      setPatrols(validPatrols);

      // Los funcionarios disponibles se cargan de forma separada en fetchOfficers()
      // para no bloquear el mapa si el servicio de usuarios falla.
      
      // Limpiar rutas huérfanas si la patrulla o el incidente han sido eliminados
      setActiveRoutes(prev => prev.filter(route => 
        validPatrols.some(p => p.id === route.patrolId) && 
        filteredReports.some(r => r.id === route.incidentId)
      ));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setLoading(false);
    }
  };

  // Función separada para cargar funcionarios disponibles (no bloquea el mapa si falla)
  const fetchOfficers = async () => {
    try {
      const dataUsu = await UserService.getUsers();
      const lista = Array.isArray(dataUsu) ? dataUsu : (dataUsu?.data || []);
      setAvailableOfficers(lista.filter(u => u.role === 'admin' || u.role === 'funcionario'));
    } catch (error) {
      console.warn('No se pudo cargar la lista de funcionarios:', error.message);
      setAvailableOfficers([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOfficers();
  }, [refreshTrigger]);

  const handleMapClick = (latlng) => {
    setCurrentLatlng(latlng);
    setEditingPatrol(null);
    const autoDistrict = getDistrictByLatLng(latlng.lat, latlng.lng);
    setFormData({ nombre_oficiales: '', unidad: '', estado: 'Activa', zona: autoDistrict, tipo_unidad: 'Patrulla', horaInicio: '', horaFin: '' });
    setShowModal(true);
  };

  const handleEditClick = (patrol) => {
    setEditingPatrol(patrol);
    const scheduleStr = patrol.horario || '';
    const [hStart, hEnd] = scheduleStr.includes(' - ') ? scheduleStr.split(' - ') : ['', ''];

    setFormData({
      nombre_oficiales: patrol.nombre_oficiales,
      unidad: patrol.unidad,
      estado: patrol.estado,
      zona: patrol.zona || 'Desamparados',
      tipo_unidad: patrol.tipo_unidad || 'Patrulla',
      horaInicio: hStart,
      horaFin: hEnd
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar patrulla?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#fff'
    });

    if (result.isConfirmed) {
      await PoliceService.deletePatrol(id);
      Swal.fire({
        title: 'Eliminada',
        text: 'La patrulla ha sido retirada del mapa.',
        icon: 'success',
        background: '#1f2937',
        color: '#fff'
      });
      fetchData();
      if (onPatrolUpdate) onPatrolUpdate();
    }
  };

  const handleOfficialToggle = (name) => {
    let currentOfficers = (formData.nombre_oficiales || '').split(',').map(n => n.trim()).filter(n => n);
    if (currentOfficers.includes(name)) {
      currentOfficers = currentOfficers.filter(n => n !== name);
    } else {
      currentOfficers.push(name);
    }
    setFormData({ ...formData, nombre_oficiales: currentOfficers.join(', ') });
  };

  const handleSavePatrol = async () => {
    if (!formData.nombre_oficiales || !formData.unidad) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Completa todos los campos obligatorios', background: '#1f2937', color: '#fff' });
      return;
    }

    const newPatrolData = {
      ...formData,
      lat: editingPatrol ? editingPatrol.lat : currentLatlng.lat,
      lng: editingPatrol ? editingPatrol.lng : currentLatlng.lng
    };

    const finalSchedule = `${formData.horaInicio} - ${formData.horaFin}`;

    if (editingPatrol) {
      const updatedPatrol = {
        ...editingPatrol,
        ...formData,
        horario: finalSchedule
      };
      delete updatedPatrol.horaInicio;
      delete updatedPatrol.horaFin;
      
      await PoliceService.updatePatrol(updatedPatrol, editingPatrol.id);
      Swal.fire({ icon: 'success', title: 'Actualizada', text: 'Datos de la patrulla actualizados.', timer: 1500, showConfirmButton: false, background: '#1f2937', color: '#fff' });
    } else {
      await PoliceService.createPatrol({ ...newPatrolData, horario: finalSchedule, id: Date.now().toString() });
      Swal.fire({ icon: 'success', title: 'Patrulla Asignada', text: 'La patrulla ha sido desplegada en el mapa.', timer: 1500, showConfirmButton: false, background: '#1f2937', color: '#fff' });
    }

    setShowModal(false);
    fetchData();
    if (onPatrolUpdate) onPatrolUpdate();
  };

  const handleStartRouting = (patrol) => {
    setRoutingSource(patrol);
    Swal.fire({
      icon: 'info',
      title: 'Modo Misión',
      text: `Unidad ${patrol.unidad} seleccionada. Haz clic en un incidente para trazar la ruta.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      background: '#1f2937', color: '#fff'
    });
  };

  const ROUTE_COLORS = ['#00C853', '#00B0FF', '#FFD600', '#AA00FF', '#FF3D00', '#FF4081', '#00E5FF'];

  const handleCalculateRoute = async (report) => {
    if (!routingSource) return;
    setIsCalculatingRoute(true);
    try {
      const origin = [routingSource.lat, routingSource.lng];
      const destination = [report.lat, report.lng];
      
      // Se indica emergencia (true) para priorizar la ruta más corta
      const route = await RouteService.calculateRoute(
        origin,
        destination,
        true,
        routingSource.tipo_unidad
      );
      
      // Cambiar estado del reporte a "En Proceso"
      if (report.estado === 'Pendiente' || !report.estado) {
        await ReportService.updateReport({ estado: 'En Proceso' }, report.id);
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, estado: 'En Proceso' } : r));
      }

      const newRoute = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        patrolId: routingSource.id,
        incidentId: report.id,
        unidad: routingSource.unidad,
        destinoTipo: report.tipo,
        color: ROUTE_COLORS[activeRoutes.length % ROUTE_COLORS.length],
        // Mapear propiedades del RouteService (inglés) → nombres esperados (español)
        coordenadas: route.coordinates,
        distanciaKm: route.distanceKm,
        duracionMin: route.durationMin,
        simulada: route.simulated
      };
      
      setActiveRoutes(prev => [...prev, newRoute]);
      setRoutingSource(null); 
      
    } catch (error) {
      console.error("Error al calcular ruta:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Ruta',
        text: 'Nuestros radares no pudieron encontrar una ruta terrestre, tal vez la zona no sea accesible.',
        background: '#1f2937', color: '#fff'
      });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleClearRoute = (id) => {
    setActiveRoutes(prev => prev.filter(r => r.id !== id));
    if (emergencyActive) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      simulationRef.current = null;
      if (watchIdRef.current) {
        stopWatchLocation(watchIdRef.current);
        watchIdRef.current = null;
      }
      setEmergencyActive(false);
      setSimulatingPatrolId(null);
      setTrackingPatrolId(null);
      setHeading(0);
    }
  };

  const handleClearAllRoutes = () => {
    setActiveRoutes([]);
    setRoutingSource(null);
    if (emergencyActive) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      simulationRef.current = null;
      if (watchIdRef.current) {
        stopWatchLocation(watchIdRef.current);
        watchIdRef.current = null;
      }
      setEmergencyActive(false);
      setSimulatingPatrolId(null);
      setTrackingPatrolId(null);
      setHeading(0);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="premium-loader text-center my-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Sincronizando red de patrullaje...</p>
      </div>
    );
  }

  return (
    <div className={`patrol-map-wrapper ${emergencyActive ? 'emergency-siren-flashing' : ''}`}>
      {emergencyActive && (
        <div className="visual-siren-alert-bar" style={{
          background: 'linear-gradient(90deg, #dc2626, #2563eb)',
          color: 'white',
          textAlign: 'center',
          padding: '8px',
          fontWeight: 'bold',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '14px',
          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)'
        }}>
          <i className="fa-solid fa-lightbulb fa-beat me-2"></i> 🚨 MISIÓN DE EMERGENCIA EN CURSO - CÓDIGO ROJO 🚨
        </div>
      )}
      <div className="alert-banner-info mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <i className="fa-solid fa-circle-info"></i> <strong>Instrucciones:</strong> Haz clic en el mapa para asignar una patrulla, o usa tu ubicación actual para desplegarte.
        </div>
        <Button variant="primary" size="sm" onClick={handleDeployMyGPS} className="d-flex align-items-center gap-2" style={{ background: '#F97316', borderColor: '#F97316', fontWeight: 'bold' }}>
          <i className="fa-solid fa-location-arrow"></i> Desplegar en mi GPS
        </Button>
      </div>

      <div className="patrol-main-layout">
        <div className="patrol-map-col">
          <div className="map-glass-container" style={{ position: 'relative' }}>
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
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
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

            {gpsErrorMsg && (
              <div className="gps-error-banner alert alert-danger position-absolute w-100 text-center fw-bold" style={{ zIndex: 1050, top: '0', left: '0', borderRadius: '0', margin: '0' }}>
                <i className="fa-solid fa-triangle-exclamation fa-beat me-2"></i>
                {gpsErrorMsg}
              </div>
            )}

            <div className={`nav-perspective-container ${navigationMode ? 'nav-active' : ''}`} style={{ width: '100%', height: '100%', '--map-rotation': `${-heading}deg` }}>
              <MapContainer
                center={[9.892, -84.05]}
                zoom={13}
                scrollWheelZoom={true}
                className="functional-map-instance"
                dragging={true}
                touchZoom={true}
                doubleClickZoom={true}
                zoomControl={true}
                maxBounds={BOUNDS_RECT}
                maxBoundsViscosity={0.85}
              >
                <MapViewController activePatrol={patrols.find(p => p.id === simulatingPatrolId || p.id === trackingPatrolId)} navigationMode={navigationMode} />
                <MapRefresher />
                <ZoomControl position="bottomright" />
                <TileLayer
                  url={TILE_LAYERS[mapMode].url}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
              <GeoJSON
                data={desamparadosGeo}
                pathOptions={{ color: '#00FFFF', weight: 4, fillOpacity: 0.0, opacity: 0.8 }}
              />
              <GeoJSON
                data={distritosGeo}
                pathOptions={{ color: mapMode === 'day' ? '#000000' : '#FFFFFF', weight: 1.5, dashArray: '5, 5', fillOpacity: 0.05, opacity: 0.6 }}
              />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Renderizado de Reportes */}
              {reports.map(report => {
                if (!report.lat || !report.lng) return null;
                return (
                  <CircleMarker
                    key={report.id}
                    center={[report.lat, report.lng]}
                    pathOptions={{
                      color: "#FF1744",
                      fillColor: "#FF5252",
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                    radius={8}
                  >
                    <Popup className="premium-popup dark-popup">
                      <div className="popup-banner bg-danger">
                        <span className="popup-type"><i className="fa-solid fa-triangle-exclamation"></i> {report.tipo}</span>
                      </div>
                      <div className="popup-info">
                        <span className="info-dist fw-bold">{report.distrito}</span>
                        <p className="info-desc mt-2 mb-1">{report.descripcion}</p>
                        {report.anonimo ? (
                          <p className="text-warning mb-1"><small><i className="fa-solid fa-user-secret"></i> Reporte Anónimo</small></p>
                        ) : (
                          <p className="text-info mb-1"><small><i className="fa-solid fa-user"></i> Autor: {report.nombre_creador || 'Ciudadano'}</small></p>
                        )}
                        <small className="text-secondary">{new Date(report.fecha).toLocaleString()}</small>
                        
                        {routingSource && (
                          <div className="mt-3">
                            <Button 
                              variant="success" 
                              size="sm" 
                              onClick={() => handleCalculateRoute(report)}
                              disabled={isCalculatingRoute}
                              className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                            >
                              {isCalculatingRoute ? (
                                <><i className="fa-solid fa-spinner fa-spin"></i> Trazando...</>
                              ) : (
                                <><i className="fa-solid fa-location-crosshairs"></i> Asignar a {routingSource.unidad}</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* Renderizado de Patrullas */}
              {patrols.map(patrol => {
                if (!patrol.lat || !patrol.lng) return null;
                return (
                  <Marker
                    key={patrol.id}
                    position={[patrol.lat, patrol.lng]}
                    icon={getPatrolIcon(patrol.tipo_unidad)}
                    draggable={true}
                    eventHandlers={{
                      dragend: async (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        
                        // Validar límites del cantón
                        if (!withinDesamparados(position.lat, position.lng)) {
                           marker.setLatLng([patrol.lat, patrol.lng]); 
                           Swal.fire({
                             icon: 'warning',
                             title: 'Fuera de Límites',
                             text: 'Las unidades no pueden abandonar el cantón de Desamparados.',
                             background: '#1f2937', color: '#fff'
                           });
                           return;
                        }

                        const newZone = getDistrictByLatLng(position.lat, position.lng);
                        
                        const updatedPatrol = {
                          ...patrol,
                          lat: position.lat,
                          lng: position.lng,
                          zona: newZone
                        };
                        
                        await PoliceService.updatePatrol(updatedPatrol, patrol.id);
                        fetchData();
                        if (onPatrolUpdate) onPatrolUpdate();
                        
                        Swal.fire({
                          icon: 'success',
                          title: 'Unidad Trasladada',
                          text: `U-${patrol.unidad} ha sido movida a ${newZone}`,
                          toast: true,
                          position: 'bottom-end',
                          showConfirmButton: false,
                          timer: 3000,
                          background: '#1f2937', color: '#fff'
                        });
                      }
                    }}
                  >
                    <Popup className="premium-popup patrol-popup">
                      <div className={`popup-banner ${patrol.estado === 'Activa' ? 'bg-primary' : 'bg-secondary'}`}>
                        <span className="popup-type">
                          <i className={`fa-solid ${patrol.tipo_unidad === 'Motocicleta' ? 'fa-motorcycle' : 'fa-truck-fast'}`}></i> Unidad: {patrol.unidad}
                        </span>
                      </div>
                      <div className="popup-info text-center mt-2">
                        <p className="mb-1"><strong>Oficiales:</strong> {patrol.nombre_oficiales}</p>
                        <p className="mb-1"><strong>Horario:</strong> <i className="fa-regular fa-clock"></i> {patrol.horario || 'N/A'}</p>
                        <p className="mb-2"><strong>Estado:</strong> <span className={`badge ${patrol.estado === 'Activa' ? 'bg-success' : 'bg-warning'}`}>{patrol.estado}</span></p>

                        <div className="d-flex justify-content-center gap-2 mt-3">
                          <Button variant="outline-success" size="sm" onClick={() => handleStartRouting(patrol)}>
                            <i className="fa-solid fa-route"></i> Trazar Ruta
                          </Button>
                          <Button variant="outline-info" size="sm" onClick={() => handleEditClick(patrol)}>
                            <i className="fa-solid fa-pen"></i> Editar
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(patrol.id)}>
                            <i className="fa-solid fa-trash"></i> Retirar
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Renderizado de Rutas Activas */}
              {activeRoutes.map(route => {
                if (!route.coordenadas || route.coordenadas.length === 0) return null;
                return (
                  <LayerGroup key={route.id}>
                    <Polyline
                      positions={route.coordenadas}
                      pathOptions={{ color: 'rgba(0,0,0,0.5)', weight: 10, opacity: 1 }}
                    />
                    <Polyline
                      positions={route.coordenadas}
                      pathOptions={{ color: route.color, weight: 5, opacity: 0.9, dashArray: '10, 10' }}
                    />
                  </LayerGroup>
                );
              })}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Panel lateral de Misiones Activas */}
        <div 
          className={`patrol-sidebar-col ${bottomSheetExpanded ? 'bottom-sheet-expanded' : 'bottom-sheet-collapsed'}`}
          onClick={() => {
            if (window.innerWidth <= 768 && !bottomSheetExpanded) {
              setBottomSheetExpanded(true);
            }
          }}
        >
          <div className="route-info-panel-static cont-temas h-100 position-relative">
            {/* Handle para móvil */}
            {window.innerWidth <= 768 && bottomSheetExpanded && (
              <button 
                className="btn btn-sm text-secondary position-absolute top-0 end-0 m-2 d-lg-none" 
                onClick={(e) => { e.stopPropagation(); setBottomSheetExpanded(false); }}
                style={{ zIndex: 1050 }}
              >
                <i className="fa-solid fa-chevron-down fs-5"></i>
              </button>
            )}
            <div className="route-info-content h-100 d-flex flex-column">
              <h5 className="route-panel-title"><i className="fa-solid fa-route"></i> Misiones Activas ({activeRoutes.length})</h5>
              
              {activeRoutes.length === 0 ? (
                <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted opacity-75 mt-4" style={{ textAlign: 'center' }}>
                  <i className="fa-solid fa-shield-cat fs-1 mb-3"></i>
                  <p className="mb-1"><strong>Sin Misiones Activas</strong></p>
                  <small>Seleccione una unidad en el mapa y pulse "Trazar Ruta" para iniciar una misión.</small>
                </div>
              ) : (
                <>
                  <div className="route-list flex-grow-1">
                    {activeRoutes.map(route => (
                      <div key={route.id} className="route-item" style={{ borderLeftColor: route.color, paddingBottom: '12px' }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="route-panel-details mb-0 w-100">
                            <p className="mb-1 text-wrap" style={{ wordBreak: 'break-word' }}>
                              <strong><i className="fa-solid fa-shield-halved"></i> U-{route.unidad}</strong> 
                              <i className="fa-solid fa-arrow-right mx-1 text-muted"></i> 
                              {route.destinoTipo}
                            </p>
                            <div className="d-flex gap-2 mt-2">
                              <span className="badge bg-success opacity-75 fw-normal"><i className="fa-solid fa-clock"></i> {route.duracionMin} m</span>
                              <span className="badge bg-info text-dark opacity-100 fw-normal"><i className="fa-solid fa-ruler-horizontal"></i> {route.distanciaKm} km</span>
                            </div>
                            <div className="d-flex gap-2 mt-2">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="py-1 flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1"
                                onClick={() => handleSimulateEmergency(route)}
                                style={{ fontSize: '10px', borderRadius: '4px' }}
                              >
                                <i className="fa-solid fa-play"></i> Simular
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                className="py-1 flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1 btn-emergencia-sim"
                                onClick={() => handleStartEmergencyGPS(route)}
                                style={{ fontSize: '10px', background: '#dc2626', border: 'none', borderRadius: '4px' }}
                              >
                                <i className="fa-solid fa-location-arrow"></i> GPS Real
                              </Button>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => handleClearRoute(route.id)} title="Cancelar Misión">
                            <i className="fa-solid fa-xmark fs-5"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-sm btn-outline-danger mt-3 w-100" onClick={handleClearAllRoutes}>
                    <i className="fa-solid fa-trash-can"></i> Abortar Todas
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="premium-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editingPatrol ? 'Editar Unidad Asignada' : 'Desplegar Nueva Unidad'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSavePatrol}>
            <Form.Group className="mb-3">
              <Form.Label className="text-main fw-bold">Identificador de Unidad <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                className="bg-main text-main border-secondary"
                placeholder="Ej. Unidad 15 o U-15"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-main fw-bold">Seleccionar Oficiales Registrados</Form.Label>
              <div className="officials-selection-grid p-3 border border-secondary rounded overflow-auto mb-2" style={{ maxHeight: '150px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                {availableOfficers.length > 0 ? (
                  <div className="row">
                    {availableOfficers.map(func => (
                      <div key={func.id} className="col-md-6 mb-2">
                        <Form.Check 
                          type="checkbox"
                          id={`func-${func.id}`}
                          label={func.nombre}
                          checked={(formData.nombre_oficiales || '').split(',').map(n => n.trim()).includes(func.nombre)}
                          onChange={() => handleOfficialToggle(func.nombre)}
                          className="text-main premium-check"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <small className="text-muted"><i className="fa-solid fa-user-slash"></i> No hay funcionarios registrados.</small>
                  </div>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-main fw-bold">Nombres de Oficiales a Cargo <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nombre_oficiales"
                value={formData.nombre_oficiales}
                onChange={handleChange}
                className="bg-main text-main border-secondary"
                placeholder="Ej. Oficial Ramírez, Oficial Salas"
              />
              <Form.Text className="text-muted">
                Puede seleccionar arriba o escribir nombres manualmente (separados por coma).
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-main fw-bold">Tipo de Unidad <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="tipo_unidad"
                value={formData.tipo_unidad}
                onChange={handleChange}
                className="bg-main text-main border-secondary"
              >
                <option value="Patrulla">🚗 Patrulla (Automóvil)</option>
                <option value="Motocicleta">🏍️ Motocicleta</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-main fw-bold">Horario de Turno (Militar) <span className="text-danger">*</span></Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="time"
                  name="horaInicio"
                  value={formData.horaInicio}
                  onChange={handleChange}
                  className="bg-main text-main border-secondary"
                  required
                />
                <span className="text-main fw-bold">-</span>
                <Form.Control
                  type="time"
                  name="horaFin"
                  value={formData.horaFin}
                  onChange={handleChange}
                  className="bg-main text-main border-secondary"
                  required
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-main fw-bold">Zona / Distrito <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="zona"
                value={formData.zona}
                onChange={handleChange}
                className="bg-main text-main border-secondary"
              >
                <option value="Desamparados">Desamparados (1)</option>
                <option value="San Miguel">San Miguel (2)</option>
                <option value="San Juan de Dios">San Juan de Dios (3)</option>
                <option value="San Rafael Arriba">San Rafael Arriba (4)</option>
                <option value="San Antonio">San Antonio (5)</option>
                <option value="Frailes">Frailes (6)</option>
                <option value="Patarrá">Patarrá (7)</option>
                <option value="San Cristóbal">San Cristóbal (8)</option>
                <option value="Rosario">Rosario (9)</option>
                <option value="Damas">Damas (10)</option>
                <option value="San Rafael Abajo">San Rafael Abajo (11)</option>
                <option value="Gravilias">Gravilias (12)</option>
                <option value="Los Guido">Los Guido (13)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-main fw-bold">Estado Operativo</Form.Label>
              <Form.Select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="bg-main text-main border-secondary"
              >
                <option value="Activa">🟢 Activa (Patrullando)</option>
                <option value="Inactiva">🟡 Inactiva (En Estación)</option>
                <option value="En Incidente">🔴 En atención de Incidente</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSavePatrol}>
            {editingPatrol ? 'Guardar Cambios' : 'Desplegar Patrulla'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PatrolMap;
