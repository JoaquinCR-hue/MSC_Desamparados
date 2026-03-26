import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import ServiceReportes from '../services/ServiceReportes';
import '../styles/GestionReportes.css';
import Swal from 'sweetalert2';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ControlReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // States for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const canDelete = user && (user.role === 'admin' || user.role === 'funcionario');

  const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

  const loadReportes = async () => {
    setLoading(true);
    try {
      const data = await ServiceReportes.getReportes();
      const now = Date.now();
      
      const validReportes = [];
      const toDelete = [];

      for (const rep of (data || [])) {
        const reportDate = new Date(rep.fecha).getTime();
        if (now - reportDate > EXPIRY_TIME) {
          toDelete.push(rep.id);
        } else {
          validReportes.push(rep);
        }
      }
      
      // Auto-cleanup expired reports
      for (const id of toDelete) {
        await ServiceReportes.deleteReportes(id);
      }
      
      setReportes(validReportes);
    } catch (error) {
      console.error("Error loading reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportes();
  }, []);

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar Reporte?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ServiceReportes.deleteReportes(id);
          loadReportes();
          Swal.fire('Eliminado', 'El reporte ha sido borrado.', 'success');
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar el reporte', 'error');
        }
      }
    });
  };

  const calculateTimeLeft = (dateStr) => {
    const expiresAt = new Date(dateStr).getTime() + EXPIRY_TIME;
    const timeLeft = expiresAt - Date.now();
    if (timeLeft <= 0) return "Expirando...";
    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h restantes`;
  };

  const getTimeLeftClass = (dateStr) => {
    const expiresAt = new Date(dateStr).getTime() + EXPIRY_TIME;
    const timeLeft = expiresAt - Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (timeLeft < oneDay) return 'time-critical';
    if (timeLeft < oneDay * 2) return 'time-warning';
    return 'time-ok';
  };

  // Filter logic
  const filteredReportes = reportes.filter(rep => {
    const matchesSearch = (rep.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (rep.barrio || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || rep.tipo === filterType;
    const matchesDistrict = filterDistrict === 'all' || rep.distrito === filterDistrict;
    return matchesSearch && matchesType && matchesDistrict;
  });

  const uniqueTypes = [...new Set(reportes.map(r => r.tipo))];
  const uniqueDistricts = [...new Set(reportes.map(r => r.distrito))];

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <div className="gestion-title-wrapper">
          <span className="gestion-subtitle">Sistema de Vigilancia</span>
          <h1 className="gestion-title">Gestión de Reportes</h1>
          <p className="gestion-subtext">Historial detallado de incidentes comunitarios recientes.</p>
        </div>
      </header>

      <section className="filters-section">
        <div className="filter-group">
          <label>Búsqueda</label>
          <input 
            type="text" 
            placeholder="Tipo o barrio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Tipo de Incidente</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Todos los tipos</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Distrito</label>
          <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)}>
            <option value="all">Todos los distritos</option>
            {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>INCIDENTE</th>
                <th>UBICACIÓN</th>
                <th>FECHA</th>
                <th>VIGENCIA</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No se encontraron reportes con los criterios seleccionados.</td>
                </tr>
              ) : (
                filteredReportes.map((rep) => (
                  <tr key={rep.id}>
                    <td><strong>{rep.tipo}</strong></td>
                    <td>
                      <div className="loc-info">
                        <strong>{rep.distrito}</strong>
                        <small>{rep.barrio}</small>
                      </div>
                    </td>
                    <td>{new Date(rep.fecha).toLocaleDateString()}</td>
                    <td>
                      <span className={`time-badge ${getTimeLeftClass(rep.fecha)}`}>
                        <i className="fa-regular fa-clock"></i> {calculateTimeLeft(rep.fecha)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-action btn-view" 
                        onClick={() => setSelectedReport(rep)}
                        title="Ver detalles"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      {canDelete && (
                        <button 
                          className="btn-action btn-delete" 
                          onClick={() => handleDelete(rep.id)}
                          title="Eliminar reporte"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReport(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="modal-body-premium">
              <div className="modal-map-side">
                <MapContainer 
                  center={[selectedReport.lat || 9.892, selectedReport.lng || -84.05]} 
                  zoom={15} 
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                  />
                  {selectedReport.lat && (
                    <Marker position={[selectedReport.lat, selectedReport.lng]}>
                      <Popup>{selectedReport.tipo}</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              <div className="modal-info-side">
                <span className="modal-badge">{selectedReport.tipo}</span>
                <h2 className="modal-title">{selectedReport.distrito}</h2>
                <div className="modal-description">
                  {selectedReport.descripcion || "Sin descripción adicional proporcionada por el usuario."}
                </div>
                <div className="modal-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Fecha del Suceso</span>
                    <span className="detail-value">{new Date(selectedReport.fecha).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Barrio/Punto</span>
                    <span className="detail-value">{selectedReport.barrio}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Dirección Exacta</span>
                    <span className="detail-value">{selectedReport.direccion_exacta || "No especificada"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reportado por</span>
                    <span className="detail-value">{selectedReport.nombre_creador || "Anónimo"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ID de Reporte</span>
                    <span className="detail-value">#{selectedReport.id.toString().slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlReportes;
