import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReportManager from '../components/ReportManager';
import '../styles/ReportManager.css';

/**
 * Página de gestión de reportes de incidentes.
 * Accesible para funcionarios y administradores.
 */
const ManageReports = () => {
  return (
    <div className="gestion-reportes-page">
      <Navbar />
      <main className="gestion-reportes-main">
        <ReportManager />
      </main>
      <Footer />
    </div>
  );
};

export default ManageReports;
