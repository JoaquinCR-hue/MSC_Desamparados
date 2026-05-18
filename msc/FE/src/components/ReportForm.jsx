import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportService from '../services/ReportService';
import VoiceInput from './shared/VoiceInput';
import desamparadosGeo from '../data/desamparados.json';
import distritosGeo from '../data/distritos.json';

// Corrección para el icono predeterminado de Leaflet en React
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

// Verificación estricta de coordenadas contra el GeoJSON de Desamparados
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

// Normaliza cadenas para comparación (quita tildes y caracteres especiales)
const normalizeString = (str) => {
  if (!str) return "";
  return str.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/gi, '')
            .toLowerCase()
            .trim();
};

// Obtiene el nombre del distrito basado en las coordenadas proporcionadas
const getDistrictByLatLng = (lat, lng) => {
  if (!distritosGeo || !distritosGeo.features) return null;
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
      const detectedName = feature.properties.name;
      const normalizedDetected = normalizeString(detectedName);
      
      // Buscar el nombre original en nuestras llaves de districtsData
      const originalName = Object.keys(districtsData).find(key => 
        normalizeString(key) === normalizedDetected || 
        normalizedDetected.includes(normalizeString(key)) ||
        normalizeString(key).includes(normalizedDetected)
      );
      
      return originalName || detectedName;
    }
  }
  return null;
};

const BOUNDS_RECT = [
  [BOUNDS_DESAMPARADOS.minLat, BOUNDS_DESAMPARADOS.minLng],
  [BOUNDS_DESAMPARADOS.maxLat, BOUNDS_DESAMPARADOS.maxLng],
];

const districtsData = {
  "Desamparados": { center: [9.8967, -84.0706], barrios: ["Centro", "Calle Fallas", "Contadores", "Cucubres", "Dorado", "Lomas", "Metrópoli"] },
  "San Miguel": { center: [9.8475, -84.0481], barrios: ["Centro", "Capitán", "Valle", "Loto", "San Martín", "Higuito"] },
  "San Juan de Dios": { center: [9.8828, -84.0850], barrios: ["Centro", "Ita", "Novedades", "Roble"] },
  "San Rafael Arriba": { center: [9.8725, -84.0715], barrios: ["Centro", "Huaso", "Maiquetía"] },
  "San Antonio": { center: [9.8989, -84.0469], barrios: ["Centro", "Palo Grande", "Plaza", "Río"] },
  "Frailes": { center: [9.7547, -84.0692], barrios: ["Centro", "Santa Elena", "San Cristóbal Norte"] },
  "Patarrá": { center: [9.8636, -84.0247], barrios: ["Centro", "Guatuso", "Liceo", "Fátima"] },
  "San Cristóbal": { center: [9.7491, -83.9914], barrios: ["Cristóbal Norte", "Cristóbal Sur", "San Antonio"] },
  "Rosario": { center: [9.7975, -84.0872], barrios: ["Centro", "Quebrada"] },
  "Damas": { center: [9.8889, -84.0453], barrios: ["Centro", "Dos Cercas", "San Juan"] },
  "San Rafael Abajo": { center: [9.8944, -84.0836], barrios: ["Centro", "Mónaco", "Valencia", "San José"] },
  "Gravilias": { center: [9.8861, -84.0575], barrios: ["Centro", "Porvenir", "Clínica", "Asunción"] },
  "Los Guido": { center: [9.8703, -84.0483], barrios: ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5"] }
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const LocationPicker = ({ position, setPosition, onDistrictDetected }) => {
  useMapEvents({
    click(e) {
      if (!withinDesamparados(e.latlng.lat, e.latlng.lng)) {
        Swal.fire({
          icon: 'warning',
          title: 'Fuera de Límites',
          text: 'Por favor, ubique el reporte dentro del cantón de Desamparados (zona permitida).'
        });
        return;
      }
      
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPosition([lat, lng]);
      
      const districtName = getDistrictByLatLng(lat, lng);
      if (districtName) {
        onDistrictDetected(districtName);
      }
    },
  });
  return position ? <Marker position={position} /> : null;
};

const ReportForm = () => {
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
  const parsedUser = user ? JSON.parse(user) : null;

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
      if (value && districtsData[value]) {
        setMapCenter(districtsData[value].center);
        setMapZoom(14);
        setLocation(districtsData[value].center); // Valor por defecto si no se hace clic
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

  const handleDistrictDetectedFromMap = (districtName) => {
    setFormData(prev => ({
      ...prev,
      distrito: districtName,
      barrio: prev.distrito === districtName ? prev.barrio : ""
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

    const newReport = {
      ...formData,
      id_creador: parsedUser.id,
      nombre_creador: parsedUser.nombre,
      estado: 'Pendiente',
      lat: location[0],
      lng: location[1]
    };

    try {
      await ReportService.createReport(newReport);
      
      Swal.fire({
        title: '¡Reporte Enviado!',
        text: 'Incidente reportado con éxito. Gracias por colaborar con la seguridad local.',
        icon: 'success',
        confirmButtonColor: '#ff8800',
        timer: 20000,
        timerProgressBar: true
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
    <div className="report-form-wrapper map-layout">
      <div className="report-header">
        <h2>Reportar Incidente o Riesgo</h2>
        <p>Marca el lugar exacto del incidente en el mapa para una mejor respuesta.</p>
      </div>

      <div className="report-content-grid">
        <form onSubmit={handleSubmit} className="report-form compact-form">
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
                {Object.keys(districtsData).map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group-custom">
              <label htmlFor="barrio" title="Barrio / Sector">Barrio / Sector</label>
              <select id="barrio" name="barrio" value={formData.barrio} onChange={handleChange} required disabled={!formData.distrito}>
                <option value="">Seleccionar Barrio</option>
                {formData.distrito && districtsData[formData.distrito].barrios.map(b => (
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
            {/* GeoJSON del cantón y distritos */}
            <GeoJSON 
              data={desamparadosGeo} 
              pathOptions={{ color: '#00FFFF', weight: 4, fillOpacity: 0.0, opacity: 0.8 }} 
            />
            <GeoJSON 
              data={distritosGeo} 
              pathOptions={{ color: '#000000', weight: 1.5, dashArray: '5, 5', fillOpacity: 0.05, opacity: 0.6 }} 
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <LocationPicker 
              position={location} 
              setPosition={setLocation} 
              onDistrictDetected={handleDistrictDetectedFromMap}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
