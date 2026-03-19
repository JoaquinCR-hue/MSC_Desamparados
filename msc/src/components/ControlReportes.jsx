import React, { useState, useEffect } from 'react';
import ServiceReportes from '../services/ServiceReportes';
import '../styles/GestionReportes.css';
import Swal from 'sweetalert2';

const ControlReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  const EXPIRY_TIME = 5 * 24 * 60 * 60 * 1000; // 5 días en milisegundos

  const loadReportes = async () => {
    setLoading(true);
    try {
      const data = await ServiceReportes.getReportes();
      const now = Date.now();
      
      const validReportes = [];
      for (const rep of (data || [])) {
        const reportDate = new Date(rep.fecha).getTime();
        if (now - reportDate > EXPIRY_TIME) {
          await ServiceReportes.deleteReportes(rep.id);
        } else {
          validReportes.push(rep);
        }
      }
      
      setReportes(validReportes);
    } catch (error) {
      console.error("Error al cargar reportes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportes();
  }, []);

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

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar Reporte?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
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

  return (
    <div className="gestion-container">
      <div className="container">
        <div className="gestion-header">
          <div className="gestion-title-wrapper">
            <span className="gestion-subtitle">Seguridad Ciudadana</span>
            <h1 className="gestion-title">Gestión de Reportes</h1>
            <span className="gestion-subtext">Lifespan de 5 días por reporte • Auto-limpieza activa</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Verificando base de datos...</p>
          </div>
        ) : (
          <div className="reportes-grid">
            {reportes.length === 0 ? (
              <div className="no-data">No hay reportes recientes registrados actualmente.</div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>TIPO</th>
                      <th>UBICACIÓN</th>
                      <th>CREADO EL</th>
                      <th>INFORMANTE</th>
                      <th>TIEMPO RESTANTE</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportes.map((rep) => (
                      <tr key={rep.id}>
                        <td><strong>{rep.tipo}</strong></td>
                        <td>
                          <div className="loc-info">
                            <span>{rep.distrito}</span>
                            <small>{rep.barrio}</small>
                          </div>
                        </td>
                        <td>{new Date(rep.fecha).toLocaleString()}</td>
                        <td>{rep.nombre_creador || 'Anónimo'}</td>
                        <td>
                          <span className={`time-badge ${getTimeLeftClass(rep.fecha)}`}>
                            <i className="fa-regular fa-clock"></i> {calculateTimeLeft(rep.fecha)}
                          </span>
                        </td>
                        <td>
                          <button className="btn-action btn-delete" onClick={() => handleDelete(rep.id)} title="Eliminar Manualmente">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlReportes;
