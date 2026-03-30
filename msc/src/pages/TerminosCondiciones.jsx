import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TerminosContent from '../components/TerminosContent';
import '../styles/Terminos.css';

function TerminosCondiciones() {
  return (
    <div className="terminos-page-container">
      <Navbar />
      <TerminosContent />
      <Footer />
    </div>
  );
}

export default TerminosCondiciones;
