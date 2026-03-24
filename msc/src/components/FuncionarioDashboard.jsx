import React, { useState, useEffect } from 'react';
import PatrolMap from './PatrolMap';
import '../styles/FuncionarioDashboard.css';
import ServiceReportes from '../services/ServiceReportes';
import Swal from 'sweetalert2';

function FuncionarioDashboard() {
  const [reportesCount, setReportesCount] = useState(0);
  const [nuevos, setNuevos] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await ServiceReportes.getReportes();
        setReportesCount(data.length);
      } catch(e) {
        console.error(e);
      }
    };
    init();

    const interval = setInterval(async () => {
      try {
        const data = await ServiceReportes.getReportes();
        setReportesCount(prev => {
          if (prev > 0 && data.length > prev) {
            const diferencias = data.length - prev;
            setNuevos(curr => curr + diferencias);
            setRefreshKey(Date.now()); // Recargar mapa
            
            Swal.fire({
              toast: true,
              position: 'top-end',
              iconHtml: '<i class="fa-solid fa-bell fa-shake" style="border: none;"></i>',
              customClass: {
                icon: 'border-0'
              },
              title: '¡Nuevo reporte recibido!',
              text: 'Un ciudadano ha registrado un nuevo incidente.',
              showConfirmButton: false,
              timer: 6000,
              timerProgressBar: true,
              background: '#1e40af',
              color: '#ffffff'
            });
          }
          return Math.max(prev, data.length); // Actualizar solo si crece o se mantiene, para evitar loops raros si se eliminan
        });
      } catch(e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const clearNuevos = () => setNuevos(0);

  return (
    <div className="funcionario-dashboard-page">
      <div className="dashboard-content-premium pt-4">
        <header className="dashboard-header-premium d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center mb-2">
              <span className="badge bg-light text-primary border border-primary-subtle me-2 px-3 py-2 text-uppercase letter-spacing-1">CENTRO DE COMANDO</span>
            </div>
            <h1>Centro Operativo Municipal</h1>
            <p>Control de patrullaje, asignación de unidades e incidentes reportados en tiempo real.</p>
          </div>
          <div className="notification-bell-container" onClick={clearNuevos} style={{cursor: 'pointer'}} title="Marcar leídos">
            <div className="position-relative p-3 bg-dark rounded-circle border border-secondary shadow d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
              <i className={`fa-solid fa-bell fs-4 ${nuevos > 0 ? 'text-warning fa-shake' : 'text-light'}`}></i>
              {nuevos > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm">
                  {nuevos}
                  <span className="visually-hidden">reportes no leídos</span>
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="map-section-wrapper">
          <PatrolMap refreshTrigger={refreshKey} />
        </section>
      </div>
    </div>
  );
}

export default FuncionarioDashboard;
