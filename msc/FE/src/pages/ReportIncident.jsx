import React from 'react';
import Navbar from '../components/Navbar';
import ReportForm from '../components/ReportForm';
import '../styles/ReportForm.css';

/**
 * Página para reportar un incidente o riesgo en el mapa.
 * El formulario valida que el usuario tenga sesión activa antes de permitir el acceso.
 */
function ReportIncident() {
  return (
    <div className="report-page-container">
      <Navbar />
      <main className="report-main-content">
        <ReportForm />
      </main>
    </div>
  );
}

export default ReportIncident;
