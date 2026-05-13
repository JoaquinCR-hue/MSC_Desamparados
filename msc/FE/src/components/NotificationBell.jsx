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
    const fetchCurrent = async () => {
      try {
        const data = await ReportService.getReports();
        const sortedData = [...data].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        setRecentReports(sortedData.slice(0, 5));
        setReportesCount(data.length);
      } catch (e) {
        console.error(e);
      }
    };

    fetchCurrent();

    const interval = setInterval(async () => {
      try {
        const data = await ReportService.getReports();
        setReportesCount(prev => {
          if (prev > 0 && data.length > prev) {
            const diferencias = data.length - prev;
            
            const sortedData = [...data].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
            const nuevosReportes = sortedData.slice(0, diferencias);
            
            setRecentReports(curr => {
                const combined = [...nuevosReportes, ...curr];
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                return unique.slice(0, 5);
            });
            
            setUnreadCount(curr => curr + diferencias);
            
            Swal.fire({
              toast: true,
              position: 'top-end',
              iconHtml: '<i class="fa-solid fa-bell fa-shake" style="border: none;"></i>',
              customClass: { icon: 'border-0' },
              title: '¡Nuevo reporte recibido!',
              text: 'Un ciudadano ha registrado un nuevo incidente.',
              showConfirmButton: false,
              timer: 6000,
              timerProgressBar: true,
              background: 'var(--primary-color)',
              color: '#ffffff'
            });
          }
          return Math.max(prev, data.length);
        });
      } catch(e) {
        console.error(e);
      }
    }, 5000);

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
    navigate('/manage-reports');
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
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h6>Notificaciones</h6>
            <span className="notifications-count-text">Nuevos: {unreadCount}</span>
          </div>
          
          <div className="notifications-list">
            {recentReports.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No hay reportes recientes.
              </div>
            ) : (
              recentReports.map(reporte => (
                <div 
                  key={reporte.id} 
                  className="notification-item"
                  onClick={() => handleReportClick(reporte)}
                >
                  <div className="notification-item-header">
                    <strong className="notification-item-type">
                      <i className="fa-solid fa-triangle-exclamation"></i> {reporte.tipo}
                    </strong>
                    <span className="notification-item-date">
                      {new Date(reporte.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="notification-item-desc">
                    {reporte.descripcion || 'Sin descripción'}
                  </div>
                  <div className="notification-item-loc">
                    <i className="fa-solid fa-location-dot"></i> {reporte.distrito}, {reporte.barrio}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div 
            className="notifications-footer"
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
