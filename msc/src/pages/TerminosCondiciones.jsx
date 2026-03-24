import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TerminosContent from '../components/TerminosContent';

function TerminosCondiciones() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#121212', color: '#ffffff' }}>
      <Navbar />
      <TerminosContent />
      <Footer />
    </div>
  );
}

export default TerminosCondiciones;
