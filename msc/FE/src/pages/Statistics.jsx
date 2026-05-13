import React from 'react';
import Navbar from '../components/Navbar';
import StatsDashboard from '../components/StatsDashboard';
import Footer from '../components/Footer';

/**
 * Página de estadísticas del sistema.
 * Accesible para funcionarios y administradores.
 */
const Statistics = () => {
  return (
    <div className="statistics-page">
      <Navbar />
      <main className="statistics-main">
        <StatsDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default Statistics;
