import React from 'react';
import OfficerDashboard from '../components/OfficerDashboard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * OfficerDashboardPage - Vista principal del funcionario/administrador.
 * Muestra el dashboard de control de patrullaje y operaciones.
 */
function OfficerDashboardPage() {
  return (
    <div className="officer-dashboard-page-container">
      <Navbar />
      <OfficerDashboard />
      <Footer />
    </div>
  );
}

export default OfficerDashboardPage;
