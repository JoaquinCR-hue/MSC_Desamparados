import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ServiceReportes from '../services/ServiceReportes';
import VoiceInput from './shared/VoiceInput';
import desamparadosGeo from '../data/desamparados.json';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BOUNDS_DESAMPARADOS = {
  minLat: 9.70,
  maxLat: 9.98,
  minLng: -84.18,
  maxLng: -83.92,
};

// Algoritmo Ray-Casting para saber si un punto está dentro de un polígono
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
const dentroDeDesamparados = (lat, lng) => {
  if (!desamparadosGeo || !desamparadosGeo.features || !desamparadosGeo.features[0]) return true;
  const geometry = desamparadosGeo.features[0].geometry;
  const point = [lng, lat]; // GeoJSON usa [lng, lat]
  
  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => isPointInPolygon(point, poly[0]));
  }
  return false;
};

const BOUNDS_RECT = [
  [BOUNDS_DESAMPARADOS.minLat, BOUNDS_DESAMPARADOS.minLng],
  [BOUNDS_DESAMPARADOS.maxLat, BOUNDS_DESAMPARADOS.maxLng],
];

const distritosData = {
  "Desamparados": { center: [9.8989, -84.0664], barrios: ["Centro", "Calle Fallas", "Contadores", "Cucubres", "Dorado", "Lomas", "Metrópoli"] },
  "San Miguel": { center: [9.8763, -84.0620], barrios: ["Centro", "Capitán", "Valle", "Loto", "San Martín", "Higuito"] },
  "San Juan de Dios": { center: [9.8828, -84.0850], barrios: ["Centro", "Ita", "Novedades", "Roble"] },
  "San Rafael Arriba": { center: [9.8783, -84.0736], barrios: ["Centro", "Huaso", "Maiquetía"] },
  "San Antonio": { center: [9.8972, -84.0494], barrios: ["Centro", "Palo Grande", "Plaza", "Río"] },
  "Frailes": { center: [9.7709, -84.0531], barrios: ["Centro", "Santa Elena", "San Cristóbal Norte"] },
  "Patarrá": { center: [9.8819, -84.0322], barrios: ["Centro", "Guatuso", "Liceo", "Fátima"] },
  "San Cristóbal": { center: [9.7915, -83.9934], barrios: ["Cristóbal Norte", "Cristóbal Sur", "San Antonio"] },
  "Rosario": { center: [9.7845, -84.0203], barrios: ["Centro", "Quebrada"] },
  "Damas": { center: [9.8911, -84.0503], barrios: ["Centro", "Dos Cercas", "San Juan"] },
  "San Rafael Abajo": { center: [9.8967, -84.0811], barrios: ["Centro", "Mónaco", "Valencia", "San José"] },
  "Gravilias": { center: [9.8922, -84.0644], barrios: ["Centro", "Porvenir", "Clínica", "Asunción"] },
  "Los Guido": { center: [9.8661, -84.0558], barrios: ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5"] }
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      if (!dentroDeDesamparados(e.latlng.lat, e.latlng.lng)) {
        Swal.fire({
          icon: 'warning',
          title: 'Fuera de Límites',
          text: 'Por favor, ubique el reporte dentro del cantón de Desamparados (zona permitida).'
        });
        return;
      }
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const FormularioReporte = () => {
  const [formData, setFormData] = useState({
    tipo: '',
    descripcion: '',
    distrito: '',
    barrio: '',
    direccion_exacta: '',
    fecha: '',
  });

  const [location, setLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.892, -84.05]); 
  const [mapZoom, setMapZoom] = useState(12);

  const navigate = useNavigate();
  const user = sessionStorage.getItem('user');
  const usuarioParseado = user ? JSON.parse(user) : null;

  useEffect(() => {
    if (!user) {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'Debes iniciar sesión o registrarte para reportar un incidente.',
        icon: 'warning',
        confirmButtonText: 'Iniciar Sesión',
        showCancelButton: true,
        cancelButtonText: 'Volver al Inicio',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        } else {
          navigate('/');
        }
      });
    }
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "distrito") {
      setFormData({
        ...formData,
        [name]: value,
        barrio: "" 
      });
      if (value && distritosData[value]) {
        setMapCenter(distritosData[value].center);
        setMapZoom(14);
        setLocation(distritosData[value].center); // Default to center if not clicked
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleVoiceResult = (field, text) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]} ${text}` : text
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      Swal.fire({
        title: 'Ubicación Requerida',
        text: 'Por favor, marca el lugar exacto en el mapa.',
        icon: 'info'
      });
      return;
    }

    const nuevoReporte = {
      ...formData,
      id_creador: usuarioParseado.id,
      nombre_creador: usuarioParseado.nombre,
      estado: 'Pendiente',
      lat: location[0],
      lng: location[1]
    };

    try {
      await ServiceReportes.postReportes(nuevoReporte);
      
      Swal.fire({
        title: '¡Reporte Enviado!',
        text: 'Incidente reportado con éxito. Gracias por colaborar con la seguridad local.',
        icon: 'success'
      });

      setFormData({ tipo: '', descripcion: '', distrito: '', barrio: '', direccion_exacta: '', fecha: '' });
      setLocation(null);
      setMapCenter([9.892, -84.05]);
      setMapZoom(12);

    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al enviar tu reporte. Intenta nuevamente.',
        icon: 'error'
      });
    }
  };

  return (
    <div className="reportar-form-wrapper map-layout">
      <div className="reportar-header">
        <h2>Reportar Incidente o Riesgo</h2>
        <p>Marca el lugar exacto del incidente en el mapa para una mejor respuesta.</p>
      </div>

      <div className="report-content-grid">
        <form onSubmit={handleSubmit} className="reportar-form compact-form">
          <div className="form-group-custom">
            <label htmlFor="tipo" title="Tipo de Incidente">Tipo de Incidente</label>
            <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
              <option value="">Seleccione una opción</option>
              
              <optgroup label="Delitos Relevantes">
                <option value="Asalto">Asalto</option>
                <option value="Hurto">Hurto</option>
                <option value="Robo">Robo</option>
                <option value="Tacha De Vehículo">Tacha De Vehículo</option>
                <option value="Robo De Vehículo">Robo De Vehículo</option>
                <option value="Homicidio">Homicidio</option>
              </optgroup>

              <optgroup label="Violencia y Género">
                <option value="Femicidio">Femicidio</option>
                <option value="Maltrato a mujer">Maltrato a mujer</option>
                <option value="Violencia domestica">Violencia domestica</option>
                <option value="Maltrato animal">Maltrato animal</option>
              </optgroup>

              <optgroup label="Seguridad Pública">
                <option value="Balacera">Balacera</option>
                <option value="Ventas de drogas">Ventas de drogas</option>
                <option value="Persona sospechosa">Persona sospechosa</option>
                <option value="Actividad sospechosa">Actividad sospechosa</option>
                <option value="Objeto sospechoso">Objeto sospechoso</option>
              </optgroup>

              <optgroup label="Siniestros y Otros">
                <option value="Accidente de tránsito">Accidente de tránsito</option>
                <option value="Incendio">Incendio</option>
                <option value="Emergencia médica">Emergencia médica</option>
                <option value="Vandalismo">Vandalismo</option>
                <option value="Otro">Otro</option>
              </optgroup>
            </select>
          </div>

          <div className="form-group-custom">
            <label htmlFor="fecha" title="Fecha y Hora">Fecha y Hora</label>
            <input type="datetime-local" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group-custom">
              <label htmlFor="distrito" title="Distrito">Distrito</label>
              <select id="distrito" name="distrito" value={formData.distrito} onChange={handleChange} required>
                <option value="">Seleccionar Distrito</option>
                {Object.keys(distritosData).map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group-custom">
              <label htmlFor="barrio" title="Barrio / Sector">Barrio / Sector</label>
              <select id="barrio" name="barrio" value={formData.barrio} onChange={handleChange} required disabled={!formData.distrito}>
                <option value="">Seleccionar Barrio</option>
                {formData.distrito && distritosData[formData.distrito].barrios.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group-custom">
            <label htmlFor="direccion_exacta" title="Punto Exacto de Referencia">Punto Exacto de Ref.</label>
            <div className="form-input-with-voice">
              <input 
                type="text" 
                id="direccion_exacta" 
                name="direccion_exacta" 
                placeholder="Ej. A la par de la farmacia principal..." 
                value={formData.direccion_exacta} 
                onChange={handleChange} 
                required 
              />
              <div className="voice-input-container">
                <VoiceInput onResult={(text) => handleVoiceResult('direccion_exacta', text)} />
              </div>
            </div>
          </div>

          <div className="form-group-custom">
            <label htmlFor="descripcion" title="Descripción detallada">Descripción detallada</label>
            <div className="form-input-with-voice">
              <textarea 
                id="descripcion" 
                name="descripcion" 
                rows="3" 
                placeholder="Describe a los sospechosos, los vehículos, etc." 
                data-no-tts-placeholder="true"
                value={formData.descripcion} 
                onChange={handleChange} 
                required
              ></textarea>
              <div className="voice-input-container">
                <VoiceInput onResult={(text) => handleVoiceResult('descripcion', text)} />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-report-btn">
            <i className="fa-solid fa-paper-plane"></i> Enviar Reporte
          </button>
        </form>

        <div className="map-container-wrapper">
          <div className="map-instruccion">
            <i className="fa-solid fa-hand-pointer"></i> Haz clic en el mapa para marcar el punto exacto
          </div>
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            scrollWheelZoom={true} 
            className="leaflet-map"
            maxBounds={BOUNDS_RECT}
            maxBoundsViscosity={0.85}
          >
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' 
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <LocationPicker position={location} setPosition={setLocation} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default FormularioReporte;
