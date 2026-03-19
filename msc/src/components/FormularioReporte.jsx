import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ServiceReportes from '../services/ServiceReportes';

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

const FormularioReporte = () => {
  const [formData, setFormData] = useState({
    tipo: '',
    descripcion: '',
    distrito: '',
    barrio: '',
    direccion_exacta: '',
    fecha: '',
  });

  const [mapCenter, setMapCenter] = useState([9.9281, -84.0907]); 
  const [mapZoom, setMapZoom] = useState(10);

  const navigate = useNavigate();
  const user = localStorage.getItem('user');
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
      } else {
        setMapCenter([9.9281, -84.0907]);
        setMapZoom(10);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevoReporte = {
      ...formData,
      id_creador: usuarioParseado.id,
      nombre_creador: usuarioParseado.nombre,
      estado: 'Pendiente' 
    };

    try {
      await ServiceReportes.postReportes(nuevoReporte);
      
      Swal.fire({
        title: '¡Reporte Enviado!',
        text: 'Incidente reportado con éxito. Gracias por colaborar con la seguridad local.',
        icon: 'success'
      });

      setFormData({ tipo: '', descripcion: '', distrito: '', barrio: '', direccion_exacta: '', fecha: '' });
      setMapCenter([9.9281, -84.0907]);
      setMapZoom(10);

    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al enviar tu reporte. Intenta nuevamente.',
        icon: 'error'
      });
    }
  };

  const currentDistrito = formData.distrito;
  const showMarker = currentDistrito && distritosData[currentDistrito];

  return (
    <div className="reportar-form-wrapper map-layout">
      <div className="reportar-header">
        <h2>Reportar Incidente o Riesgo</h2>
        <p>Ayúdanos a mantener Desamparados y nuestro país más seguro.</p>
      </div>

      <div className="report-content-grid">
        <form onSubmit={handleSubmit} className="reportar-form compact-form">
          <div className="form-group-custom">
            <label htmlFor="tipo">Tipo de Incidente</label>
            <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
              <option value="">Seleccione una opción</option>
              <option value="Robo o asalto">Robo o asalto</option>
              <option value="Accidente de tránsito">Accidente de tránsito</option>
              <option value="Vandalismo">Vandalismo</option>
              <option value="Actividad sospechosa">Actividad sospechosa</option>
              <option value="Emergencia médica">Emergencia médica</option>
              <option value="Incendio">Incendio</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="form-group-custom">
            <label htmlFor="fecha">Fecha y Hora</label>
            <input type="datetime-local" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group-custom">
              <label htmlFor="distrito">Distrito (Desamparados)</label>
              <select id="distrito" name="distrito" value={formData.distrito} onChange={handleChange} required>
                <option value="">Seleccionar Distrito</option>
                {Object.keys(distritosData).map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group-custom">
              <label htmlFor="barrio">Barrio / Sector</label>
              <select id="barrio" name="barrio" value={formData.barrio} onChange={handleChange} required disabled={!formData.distrito}>
                <option value="">Seleccionar Barrio</option>
                {formData.distrito && distritosData[formData.distrito].barrios.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group-custom">
            <label htmlFor="direccion_exacta">Punto Exacto de Ref.</label>
            <input type="text" id="direccion_exacta" name="direccion_exacta" placeholder="Ej. A la par de la farmacia principal..." value={formData.direccion_exacta} onChange={handleChange} required />
          </div>

          <div className="form-group-custom">
            <label htmlFor="descripcion">Descripción detallada</label>
            <textarea id="descripcion" name="descripcion" rows="3" placeholder="Describe a los sospechosos, los vehículos, etc." value={formData.descripcion} onChange={handleChange} required></textarea>
          </div>

          <button type="submit" className="submit-report-btn">
            <i className="fa-solid fa-paper-plane"></i> Enviar Reporte
          </button>
        </form>

        <div className="map-container-wrapper">
          <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} className="leaflet-map">
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' 
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            
            {showMarker && (
              <CircleMarker 
                center={distritosData[formData.distrito].center} 
                pathOptions={{ color: '#d32f2f', fillColor: '#ef5350', fillOpacity: 0.6, weight: 3 }} 
                radius={35}
              >
                <Popup>
                  <strong>{formData.distrito}</strong>
                  {formData.barrio ? <><br/>Sector: {formData.barrio}</> : null}
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default FormularioReporte;
