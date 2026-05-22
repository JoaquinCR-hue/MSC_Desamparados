import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMapEvents, GeoJSON, ZoomControl, useMap, Polyline, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Form, Modal } from 'react-bootstrap';
import ReportService from '../services/ReportService';
import PoliceService from '../services/PoliceService';
import RouteService from '../services/RouteService';
import UserService from '../services/UserService';
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

const PatrolMap = ({ refreshTrigger, onPatrolUpdate }) => {
  const [mapMode, setMapMode] = useState('night');
  const [reports, setReports] = useState([]);
  const [patrols, setPatrols] = useState([]);
  const [availableOfficers, setAvailableOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para la gestión de rutas
  const [routingSource, setRoutingSource] = useState(null);
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

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
<<<<<<< HEAD

      // Solo los administradores pueden ver la lista de usuarios.
      // Si el usuario es funcionario, esta llamada devolverá 403 y se ignora silenciosamente.
      let dataUsu = [];
      try {
        dataUsu = await UserService.getUsers();
      } catch (userError) {
        // Funcionarios no tienen permiso para listar usuarios — es normal, no es un error de sesión.
        console.info('Lista de usuarios no disponible para este rol.');
      }
=======
>>>>>>> 2f6f554ef7440a1317bc6048266f4d116c4000c9

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
<<<<<<< HEAD

      if (dataUsu && dataUsu.length > 0) {
        setAvailableOfficers(dataUsu.filter(u => u.role === 'admin' || u.role === 'funcionario'));
      }
=======
>>>>>>> 2f6f554ef7440a1317bc6048266f4d116c4000c9
      
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
  };

  const handleClearAllRoutes = () => {
    setActiveRoutes([]);
    setRoutingSource(null);
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
    <div className="patrol-map-wrapper">
      <div className="alert-banner-info mb-3">
        <i className="fa-solid fa-circle-info"></i> <strong>Instrucciones:</strong> Haz clic en el mapa para asignar una nueva patrulla, o en las existentes para editar/retirar.
      </div>

      <div className="patrol-main-layout">
        <div className="patrol-map-col">
          <div className="map-glass-container">
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

            <MapContainer
              center={[9.892, -84.05]}
              zoom={13}
              scrollWheelZoom={true}
              className="functional-map-instance"
              zoomControl={false}
              maxBounds={BOUNDS_RECT}
              maxBoundsViscosity={0.85}
            >
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

        {/* Panel lateral de Misiones Activas */}
        <div className="patrol-sidebar-col">
          <div className="route-info-panel-static cont-temas h-100">
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
                      <div key={route.id} className="route-item" style={{ borderLeftColor: route.color }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="route-panel-details mb-0">
                            <p className="mb-1 text-wrap" style={{ wordBreak: 'break-word' }}>
                              <strong><i className="fa-solid fa-shield-halved"></i> U-{route.unidad}</strong> 
                              <i className="fa-solid fa-arrow-right mx-1 text-muted"></i> 
                              {route.destinoTipo}
                            </p>
                            <div className="d-flex gap-2 mt-2">
                              <span className="badge bg-success opacity-75 fw-normal"><i className="fa-solid fa-clock"></i> {route.duracionMin} m</span>
                              <span className="badge bg-info text-dark opacity-100 fw-normal"><i className="fa-solid fa-ruler-horizontal"></i> {route.distanciaKm} km</span>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => handleClearRoute(route.id)} title="Cancelar Misión">
                            <i className="fa-solid fa-xmark fs-5"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-sm btn-outline-danger mt-3 w-100 mt-auto" onClick={handleClearAllRoutes}>
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
