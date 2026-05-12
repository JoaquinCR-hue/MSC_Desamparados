import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeCarousel from '../components/HomeCarousel';
import HomeWelcome from '../components/HomeWelcome';
import '../styles/HomeWelcome.css';

/**
 * Página principal del sitio (Home).
 * Muestra el carrusel de presentación y el contenido de bienvenida.
 */
function Home() {
  return (
    <div className="home-container">
      <Navbar />
      <div className="carousel-container">
        <HomeCarousel />
        <HomeWelcome />
      </div>
      <Footer />
    </div>
  );
}

export default Home;
