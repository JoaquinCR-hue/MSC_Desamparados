import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceReportes from '../services/ServiceReportes';
import Swal from 'sweetalert2';

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
        const data = await ServiceReportes.getReportes();
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
        const data = await ServiceReportes.getReportes();
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
              background: '#1e40af',
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
    navigate('/gestion-reportes');
  };

  return (
    <div className="notification-bell-container" ref={bellRef} style={{ position: 'relative', marginLeft: '15px' }}>
      <button 
        onClick={handleToggle}
        style={{ 
          background: 'transparent', border: 'none', cursor: 'pointer', 
          color: '#ffffff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)'
        }}
        title="Notificaciones"
      >
        <i className={`fa-solid fa-bell fs-5 ${unreadCount > 0 ? 'text-warning fa-shake' : ''}`}></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem', transform: 'translate(-30%, 30%)' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown" style={{
          position: 'absolute', top: '50px', right: '-10px', 
          width: '320px', backgroundColor: '#1f2937', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden',
          border: '1px solid #374151'
        }}>
          <div style={{ padding: '12px 15px', backgroundColor: '#111827', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h6 style={{ margin: 0, color: '#f3f4f6', fontSize: '0.95rem', fontWeight: 'bold' }}>Notificaciones</h6>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Nuevos: {unreadCount}</span>
          </div>
          
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {recentReports.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                No hay reportes recientes.
              </div>
            ) : (
              recentReports.map(reporte => (
                <div 
                  key={reporte.id} 
                  onClick={() => handleReportClick(reporte)}
                  style={{ 
                    padding: '12px 15px', borderBottom: '1px solid #374151', cursor: 'pointer',
                    transition: 'background 0.2s', backgroundColor: '#1f2937',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#ef4444', fontSize: '0.85rem' }}><i className="fa-solid fa-triangle-exclamation"></i> {reporte.tipo}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(reporte.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ color: '#d1d5db', fontSize: '0.85rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {reporte.descripcion || 'Sin descripción'}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    <i className="fa-solid fa-location-dot"></i> {reporte.distrito}, {reporte.barrio}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div 
            onClick={() => { setIsOpen(false); navigate('/gestion-reportes'); }}
            style={{ 
              padding: '10px', textAlign: 'center', backgroundColor: '#111827', cursor: 'pointer',
              color: '#3b82f6', fontSize: '0.85rem', fontWeight: 'bold', borderTop: '1px solid #374151'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
          >
            Ver todos los reportes
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
