import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMapEvents, GeoJSON, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Form, Modal } from 'react-bootstrap';
import ServiceReportes from '../services/ServiceReportes';
import ServicePolicia from '../services/ServicePolicia';
import Swal from 'sweetalert2';
import '../styles/PatrolMap.css';
import desamparadosGeo from '../data/desamparados.json';
import distritosGeo from '../data/distritos.json';

// CSS para los íconos de patrullas
const patrolIconHtml = `
  <div style="background-color: #1E3A8A; color: white; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid #60A5FA; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 16px;">
    <i class="fa-solid fa-shield-halved"></i>
  </div>
`;

const patrolIcon = L.divIcon({
  html: patrolIconHtml,
  className: 'custom-patrol-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const TILE_LAYERS = {
  night: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  day: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
};

// Componente para manejar clics en el mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

const PatrolMap = ({ refreshTrigger }) => {
  const [mapMode, setMapMode] = useState('night');
  const [reportes, setReportes] = useState([]);
  const [patrullas, setPatrullas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [currentLatlng, setCurrentLatlng] = useState(null);
  const [editingPatrol, setEditingPatrol] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre_oficiales: '',
    unidad: '',
    estado: 'Activa',
    zona: 'Centro'
  });

  const fetchDatos = async () => {
    try {
      const dataRep = await ServiceReportes.getReportes();
      const dataPol = await ServicePolicia.getPolicias();

      const hoy = new Date();
      const unaSemanaAtras = new Date();
      unaSemanaAtras.setDate(hoy.getDate() - 7);

      const reportesFiltrados = dataRep.filter(r => {
        if (!r.fecha) return false;
        const fechaReporte = new Date(r.fecha);
        return fechaReporte >= unaSemanaAtras;
      });

      setReportes(reportesFiltrados);
      setPatrullas(dataPol || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [refreshTrigger]);

  const handleMapClick = (latlng) => {
    setCurrentLatlng(latlng);
    setEditingPatrol(null);
    setFormData({ nombre_oficiales: '', unidad: '', estado: 'Activa', zona: 'Centro' });
    setShowModal(true);
  };

  const handleEditClick = (patrulla) => {
    setEditingPatrol(patrulla);
    setFormData({
      nombre_oficiales: patrulla.nombre_oficiales,
      unidad: patrulla.unidad,
      estado: patrulla.estado,
      zona: patrulla.zona || 'Centro'
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
      await ServicePolicia.deletePolicias(id);
      Swal.fire({
        title: 'Eliminada',
        text: 'La patrulla ha sido retirada del mapa.',
        icon: 'success',
        background: '#1f2937',
        color: '#fff'
      });
      fetchDatos();
    }
  };

  const handleSavePatrol = async () => {
    if (!formData.nombre_oficiales || !formData.unidad) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Completa todos los campos obligatorios', background: '#1f2937', color: '#fff' });
      return;
    }

    const newPatrol = {
      ...formData,
      lat: editingPatrol ? editingPatrol.lat : currentLatlng.lat,
      lng: editingPatrol ? editingPatrol.lng : currentLatlng.lng
    };

    if (editingPatrol) {
      await ServicePolicia.putPolicias(newPatrol, editingPatrol.id);
      Swal.fire({ icon: 'success', title: 'Actualizada', text: 'Datos de la patrulla actualizados.', timer: 1500, showConfirmButton: false, background: '#1f2937', color: '#fff' });
    } else {
      await ServicePolicia.postPolicias({ ...newPatrol, id: Date.now().toString() });
      Swal.fire({ icon: 'success', title: 'Patrulla Asignada', text: 'La patrulla ha sido desplegada en el mapa.', timer: 1500, showConfirmButton: false, background: '#1f2937', color: '#fff' });
    }

    setShowModal(false);
    fetchDatos();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="premium-loader text-center my-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-light">Sincronizando red de patrullaje...</p>
      </div>
    );
  }

  return (
    <div className="patrol-map-wrapper">
      <div className="alert-banner-info mb-3">
        <i className="fa-solid fa-circle-info"></i> <strong>Instrucciones:</strong> Haz clic en el mapa para asignar una nueva patrulla, o en las existentes para editar/retirar.
      </div>

      <div className="map-glass-container">
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
          className="functional-map-instance"
          zoomControl={false}
        >
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

          {/* Render Reportes */}
          {reportes.map(reporte => {
            if (!reporte.lat || !reporte.lng) return null;
            return (
              <CircleMarker
                key={reporte.id}
                center={[reporte.lat, reporte.lng]}
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
                    <span className="popup-type"><i className="fa-solid fa-triangle-exclamation"></i> {reporte.tipo}</span>
                  </div>
                  <div className="popup-info">
                    <span className="info-dist fw-bold">{reporte.distrito}</span>
                    <p className="info-desc mt-2 mb-1 text-light">{reporte.descripcion}</p>
                    {reporte.anonimo ? (
                      <p className="text-warning mb-1"><small><i className="fa-solid fa-user-secret"></i> Reporte Anónimo</small></p>
                    ) : (
                      <p className="text-info mb-1"><small><i className="fa-solid fa-user"></i> Autor: {reporte.nombre_creador || 'Ciudadano'}</small></p>
                    )}
                    <small className="text-secondary">{new Date(reporte.fecha).toLocaleString()}</small>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Render Patrullas */}
          {patrullas.map(patrulla => {
            if (!patrulla.lat || !patrulla.lng) return null;
            return (
              <Marker
                key={patrulla.id}
                position={[patrulla.lat, patrulla.lng]}
                icon={patrolIcon}
              >
                <Popup className="premium-popup patrol-popup">
                  <div className={`popup-banner ${patrulla.estado === 'Activa' ? 'bg-primary' : 'bg-secondary'}`}>
                    <span className="popup-type"><i className="fa-solid fa-truck-fast"></i> Unidad: {patrulla.unidad}</span>
                  </div>
                  <div className="popup-info text-center mt-2">
                    <p className="mb-1 text-light"><strong>Oficiales:</strong> {patrulla.nombre_oficiales}</p>
                    <p className="mb-2 text-light"><strong>Estado:</strong> <span className={`badge ${patrulla.estado === 'Activa' ? 'bg-success' : 'bg-warning'}`}>{patrulla.estado}</span></p>

                    <div className="d-flex justify-content-center gap-2 mt-3">
                      <Button variant="outline-info" size="sm" onClick={() => handleEditClick(patrulla)}>
                        <i className="fa-solid fa-pen"></i> Editar
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(patrulla.id)}>
                        <i className="fa-solid fa-trash"></i> Retirar
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="premium-modal">
        <Modal.Header closeButton className="border-secondary bg-dark text-light">
          <Modal.Title>{editingPatrol ? 'Editar Unidad Asignada' : 'Desplegar Nueva Unidad'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Número de unidad <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                className="bg-transparent text-light border-secondary"
                placeholder="Ej. Unidad 15 o U-15"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombres de Oficiales a Cargo <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nombre_oficiales"
                value={formData.nombre_oficiales}
                onChange={handleChange}
                className="bg-transparent text-light border-secondary"
                placeholder="Ej. Oficial Ramírez, Oficial Salas"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zona/Distrito de Operación</Form.Label>
              <Form.Control
                type="text"
                name="zona"
                value={formData.zona}
                onChange={handleChange}
                className="bg-transparent text-light border-secondary"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Estado Operativo</Form.Label>
              <Form.Select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="bg-dark text-light border-secondary"
              >
                <option value="Activa">Activa / Patrullando</option>
                <option value="Inactiva">Inactiva / En Estación</option>
                <option value="En Incidente">En atención de Incidente</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-secondary bg-dark">
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
