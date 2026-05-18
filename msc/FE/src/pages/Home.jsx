import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeCarousel from '../components/HomeCarousel';
import HomeVideo from '../components/HomeVideo';
import HomeWelcome from '../components/HomeWelcome';
import '../styles/HomeWelcome.css';

/**
 * Página principal del sitio (Home).
 * Muestra el carrusel de presentación, video de introducción y contenido de bienvenida.
 */
function Home() {
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

export default Home;
