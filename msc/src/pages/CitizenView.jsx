import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CitizenDashboard from '../components/CitizenDashboard';

/**
 * Vista principal del ciudadano registrado.
 * Muestra el panel de bienvenida y acceso a reportes.
 */
function CitizenView() {
  return (
    <div>
      <Navbar />
      <div className="container mt-5 pt-5">
        <CitizenDashboard />
      </div>
      <Footer />
    </div>
  );
}

export default CitizenView;
