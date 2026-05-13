import React from 'react';
import '../styles/Footer.css';
import '../styles/Navbar.css';

/**
 * Pie de página global de la aplicación.
 * Contiene información institucional, enlaces rápidos y redes sociales oficiales.
 */
function Footer() {
  return (
    <>
      <footer className="custom-footer">
        <div className="container p-4">
          <div className="row">
            {/* Columna: Descripción institucional */}
            <div className="col-lg-4 col-md-12 mb-4 mb-md-0 text-start">
              <div className="d-flex align-items-center mb-3">
                <div className="footer-logo-container">
                  <i className="fa-solid fa-user-shield footer-logo-icon"></i>
                </div>
                <div className="footer-logo-text ms-3">
                  <span className="footer-logo-main">MSC<br />Desamparados</span>
                </div>
              </div>
              <p className="footer-about-text">
                Somos una organización dedicada a la seguridad ciudadana y colaboración comunitaria en Desamparados. Trabajamos juntos por un cantón más seguro, facilitando el reporte de incidentes y la comunicación con las autoridades locales.
              </p>
            </div>

            {/* Columna: Enlaces rápidos (rutas en inglés) */}
            <div className="col-lg-2 col-md-6 mb-4 mb-md-0 text-start">
              <h5 className="text-uppercase footer-title">Enlaces Rápidos</h5>
              <ul className="list-unstyled mb-0 footer-links">
                <li><a href="/">Inicio</a></li>
                <li><a href="/emergencies">Números de Emergencia</a></li>
                <li><a href="/report-incident">Reportar Incidente</a></li>
                <li><a href="/login">Iniciar Sesión</a></li>
              </ul>
            </div>

            {/* Columna: Información de contacto */}
            <div className="col-lg-3 col-md-6 mb-4 mb-md-0 text-start">
              <a href="/contact" className="btn btn-contact-orange text-uppercase fw-bold mb-3">
                <i className="fa-solid fa-envelope-open-text me-2"></i> Contáctenos
              </a>
              <ul className="list-unstyled footer-links">
                <li><span><i className="fa-solid fa-location-dot me-2"></i> Municipalidad de Desamparados</span></li>
                <li><span><i className="fa-solid fa-envelope me-2"></i> info@mscdesamparados.com</span></li>
                <li><span><i className="fa-solid fa-phone me-2"></i> 911 (Emergencias)</span></li>
              </ul>
            </div>

            {/* Columna: Redes sociales oficiales */}
            <div className="col-lg-3 col-md-6 mb-4 mb-md-0 text-start">
              <div className="social-card">
                <h5 className="text-uppercase footer-title">Nuestras Redes Oficiales</h5>
                <div className="social-icons d-flex gap-3 mt-3">
                  <a href="https://www.facebook.com/MuniDesamparados" target="_blank" rel="noopener noreferrer" className="social-icon facebook">
                    <i className="fa-brands fa-facebook-f"></i>
                  </a>
                  <a href="https://www.instagram.com/munidesampa/?locale=es&hl=en" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                  <a href="https://www.youtube.com/channel/UCkaBSMbgBnzEUuowilq8hKQ" target="_blank" rel="noopener noreferrer" className="social-icon youtube">
                    <i className="fa-brands fa-youtube"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-copyright">
          © {new Date().getFullYear()} MSC Desamparados. Todos los derechos reservados.
        </div>
      </footer>
    </>
  );
}

export default Footer;