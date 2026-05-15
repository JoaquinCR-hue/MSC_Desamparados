import React from 'react';
import introVideo from '../assets/home_intro_video.mp4';
import '../styles/HomeVideo.css';

/**
 * Componente HomeVideo — Muestra un video de presentación debajo del carrusel.
 * Utiliza estilos premium para integrarse con la estética del sitio.
 */
const HomeVideo = () => {
  return (
    <section className="video-section">
      <h2 className="video-title">Conoce nuestra labor en Desamparados</h2>
      
      <div className="video-wrapper">
        <video 
          className="main-video" 
          controls 
          preload="metadata"
          poster="" // Se puede añadir una imagen de miniatura aquí en el futuro
        >
          <source src={introVideo} type="video/mp4" />
          Tu navegador no soporta la reproducción de videos.
        </video>
      </div>
    </section>
  );
};

export default HomeVideo;
