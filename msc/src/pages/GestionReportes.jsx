import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ControlReportes from '../components/ControlReportes';
import '../styles/GestionReportes.css';

const GestionReportes = () => {
  return (
    <div className="gestion-reportes-page">
      <Navbar />
      <main className="gestion-reportes-main">
        <ControlReportes />
      </main>
      <Footer />
    </div>
  );
};

export default GestionReportes;
