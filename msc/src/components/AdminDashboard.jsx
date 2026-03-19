import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Panel de Administración <span className="admin-badge">ADMIN</span></h1>
        <p>Centro de Control MSC Desamparados</p>
      </div>
      
      <div className="admin-grid">
        <div className="admin-card" onClick={() => navigate('/gestion-usuarios')}>
          <div className="card-icon"><i className="fa-solid fa-users-gear"></i></div>
          <div className="card-info">
            <h3>Gestión de Usuarios</h3>
            <p>Control de ciudadanos y personal administrativo del sistema.</p>
          </div>
          <div className="card-arrow"><i className="fa-solid fa-chevron-right"></i></div>
        </div>

        <div className="admin-card" onClick={() => navigate('/gestion-reportes')}>
          <div className="card-icon"><i className="fa-solid fa-file-invoice"></i></div>
          <div className="card-info">
            <h3>Reportes del Sistema</h3>
            <p>Revisión y seguimiento de incidencias reportadas por ciudadanos.</p>
          </div>
          <div className="card-arrow"><i className="fa-solid fa-chevron-right"></i></div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard;
