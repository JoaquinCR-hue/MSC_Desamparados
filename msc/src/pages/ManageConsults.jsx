import React from 'react';
import Navbar from '../components/Navbar';
import ConsultManager from '../components/ConsultManager';
import Footer from '../components/Footer';

/**
 * Página de gestión de consultas ciudadanas.
 * Solo accesible para administradores (controlado por RoleRoute en Routing).
 */
function ManageConsults() {
  return (
    <div className="gestion-consultas-page-wrapper min-vh-100" style={{ backgroundColor: 'var(--bg-main)' }}>
      <Navbar />
      <div className="container mt-4 pt-5 pb-5">
        <ConsultManager />
      </div>
      <Footer />
    </div>
  );
}

export default ManageConsults;
