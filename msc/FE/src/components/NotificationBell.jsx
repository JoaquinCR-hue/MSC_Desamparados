import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportService from '../services/ReportService';
import Swal from 'sweetalert2';
import '../styles/NotificationBell.css';

const NotificationBell = () => {
  const [reportesCount, setReportesCount] = useState(0);
  const [recentReports, setRecentReports] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const prevCountRef = useRef(-1); // Esta es la línea que faltaba
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkNewReports = async () => {
      try {
        const data = await ReportService.getReports();
        if (!Array.isArray(data)) return;

        const currentCount = data.length;
        
        // Cargar siempre los reportes actuales para que no desaparezcan al refrescar
        setRecentReports(data);

        // Si es la primera carga, solo inicializamos
        if (prevCountRef.current === -1) {
          prevCountRef.current = currentCount;
          return;
        }

        // Si hay nuevos reportes
        if (currentCount > prevCountRef.current) {
          const diferencias = currentCount - prevCountRef.current;
          
          // Obtener los nuevos reportes ordenados por fecha
          const sortedData = [...data].sort((a, b) => {
            const d1 = a.fecha ? new Date(a.fecha).getTime() : 0;
            const d2 = b.fecha ? new Date(b.fecha).getTime() : 0;
            return d2 - d1;
          });

          const nuevosReportes = sortedData.slice(0, diferencias);
          const isEmergency = nuevosReportes.some(r => {
            const tipo = (r.tipo || '').toUpperCase();
            const desc = (r.descripcion || '').toUpperCase();
            return Boolean(r.isEmergency) || tipo.includes('SOS') || desc.includes('SOS') || tipo === 'EMERGENCIA';
          });

          // Sonido o vibración visual
          setUnreadCount(curr => curr + diferencias);
          
          // Actualizar lista desplegable con todos los reportes actuales
          setRecentReports(data);

          // Mostrar Toast Impactante
          Swal.fire({
            toast: true,
            position: 'top-end',
            iconHtml: `<i class="fa-solid fa-bell fa-beat" style="color: white; border: none;"></i>`,
            showConfirmButton: false,
            timer: 20000, // 20 segundos: el tiempo ideal solicitado
            timerProgressBar: true,
            title: isEmergency ? '¡NUEVO SOS REPORTADO!' : '¡NUEVO INCIDENTE REPORTADO!',
            text: isEmergency ? 'Se ha reportado una emergencia inmediata' : 'Se ha registrado una nueva incidencia ciudadana',
            background: isEmergency ? '#ff0000' : '#ff8800', // Rojo SOS vs Naranja Incidente
            color: '#fff',
            customClass: {
              popup: 'sos-toast-popup'
            }
          });
        }

        prevCountRef.current = currentCount;
      } catch (error) {
        console.error('Error polling reports:', error);
      }
    };

    // Carga inicial e intervalo
    checkNewReports();
    const interval = setInterval(checkNewReports, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const handleReportClick = (reporte) => {
    setIsOpen(false);
    navigate('/manage-reports', { state: { openReportId: reporte.id } });
  };

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button 
        className="notification-bell-btn"
        onClick={handleToggle}
        title="Notificaciones"
      >
        <i className={`fa-solid fa-bell fs-5 ${unreadCount > 0 ? 'text-warning fa-shake' : ''}`}></i>
        {unreadCount > 0 && (
          <span className="notification-badge" style={{ backgroundColor: recentReports.some(r => r.isEmergency) ? '#ff0000' : '#ff8800' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown-v2">
          <div className="notifications-header-v2">
            <h6>Notificaciones</h6>
            <span className="notifications-count-text">Pendientes: {unreadCount}</span>
          </div>
          
          <div className="notifications-list">
            {recentReports.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No hay reportes recientes.
              </div>
            ) : (
              recentReports.map(reporte => {
                const isEmg = Boolean(reporte.isEmergency);
                const itemColor = isEmg ? '#ff0000' : '#ff8800'; // Rojo puro y Naranja puro
                
                return (
                  <div 
                    key={reporte.id} 
                    className="notification-item-v2"
                    data-emergency={isEmg}
                    onClick={() => handleReportClick(reporte)}
                    style={{ 
                      borderLeft: `10px solid ${itemColor}`,
                      background: isEmg ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 136, 0, 0.05)',
                      marginBottom: '5px'
                    }}
                  >
                    <div className="notification-item-header">
                      <strong 
                        className="notification-item-type"
                        style={{ color: itemColor, fontWeight: '900', textTransform: 'uppercase' }}
                      >
                        <i className={`fa-solid ${isEmg ? 'fa-circle-exclamation fa-beat' : 'fa-triangle-exclamation'}`}></i> {reporte.tipo}
                      </strong>
                      <span className="notification-item-date">
                        {new Date(reporte.fecha).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="notification-item-desc" style={{ color: 'white' }}>
                      {reporte.descripcion || 'Sin descripción'}
                    </div>
                    <div className="notification-item-loc">
                      <i className="fa-solid fa-location-dot" style={{ color: itemColor }}></i> {reporte.distrito}, {reporte.barrio}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div 
            className="notifications-footer-v2"
            onClick={() => { setIsOpen(false); navigate('/manage-reports'); }}
          >
            Ver todos los reportes
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
