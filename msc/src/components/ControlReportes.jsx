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
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn-premium-danger',
        cancelButton: 'btn-premium-secondary',
        popup: 'premium-swal-popup'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ServiceReportes.deleteReportes(id);
          loadReportes();
          Swal.fire({
            title: 'Eliminado',
            text: 'El reporte ha sido borrado.',
            icon: 'success',
            customClass: { popup: 'premium-swal-popup' }
          });
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar el reporte',
            icon: 'error',
            customClass: { popup: 'premium-swal-popup' }
          });
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
      <header className="page-header-premium">
        <h1>Gestión de Reportes</h1>
        <p className="text-secondary">Historial detallado de incidentes comunitarios registrados en el nodo central</p>
      </header>

      <section className="filters-section">
        <div className="filter-group">
          <label>Búsqueda</label>
          <input 
            type="text" 
            placeholder="Buscar por tipo o barrio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Categoría</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Todas las categorías</option>
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
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-secondary">Sincronizando base de datos central...</p>
        </div>
      ) : (
        <div className="table-container-premium">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Incidente</th>
                  <th>Ubicación</th>
                  <th>Fecha</th>
                  <th>Vigencia</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">No se encontraron reportes con los criterios seleccionados.</td>
                  </tr>
                ) : (
                  filteredReportes.map((rep) => (
                    <tr key={rep.id}>
                      <td><span className="fw-bold">{rep.tipo}</span></td>
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
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReport(null)} aria-label="Cerrar modal">
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
