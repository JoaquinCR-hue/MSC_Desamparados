import React from 'react';
import Carousel from 'react-bootstrap/Carousel';
import '../styles/HomeCarousel.css';

// Componente de carrusel informativo para la página de inicio
function HomeCarousel() {
  return (
    <Carousel>
      <Carousel.Item>
        <img src="../src/Img/mapa_desamparados_generado.png" alt="First slide" className="d-block w-100 carousel-img" />
        <Carousel.Caption>
          <h3>Mapa de Incidencias</h3>
          <p>
            Monitoreo en tiempo real de zonas de atención prioritaria en Desamparados.
          </p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img src="../src/Img/carrucel_2_hiq.png" alt="Second slide" className="d-block w-100 carousel-img" />
        <Carousel.Caption>
          <h3>Gestión Municipal</h3>
          <p>Implementando tecnología para un Desamparados más seguro e inteligente.</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img src="../src/Img/carrucel_1.jpg" alt="Third slide" className="d-block w-100 carousel-img" />
        <Carousel.Caption>
          <h3>Emergencias Policiales</h3>
          <p>Atención inmediata y patrullaje preventivo en el cantón.</p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
}

export default HomeCarousel;
