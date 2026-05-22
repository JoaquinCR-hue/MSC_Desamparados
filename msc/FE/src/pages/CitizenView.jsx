import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeCarousel from '../components/HomeCarousel';
import HomeVideo from '../components/HomeVideo';
import HomeWelcome from '../components/HomeWelcome';
import '../styles/HomeWelcome.css';

/**
 * Vista principal del ciudadano registrado.
 * Muestra el carrusel, video informativo y contenido de bienvenida,
 * igual que la Home pública pero con acceso autenticado.
 */
function CitizenView() {
  return (
    <div className="home-container">
      <Navbar />
      <div className="carousel-container">
        <HomeCarousel />
      </div>
      <HomeVideo />
      <div className="content-wrapper">
        <HomeWelcome />
      </div>
      <Footer />
    </div>
  );
}

export default CitizenView;
