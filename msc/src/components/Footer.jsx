import React from 'react'
import '../styles/Footer.css'
import '../styles/Navbar.css'
 
function Footer() {
    return (
        <>
       
        <footer className="custom-footer">
          <div className="container p-4">
            <div className="row">
              {/*Grid column: About Us */}
              <div className="col-lg-4 col-md-12 mb-4 mb-md-0 text-start">
                <div className="d-flex align-items-center mb-3">
                  <div className="footer-logo-container">
                    <i className="fa-solid fa-user-shield footer-logo-icon"></i>
                  </div>
                  <div className="footer-logo-text ms-3">
                    <span className="footer-logo-main">MSC<br/>Desamparados</span>
                  </div>
                </div>
                <p className="footer-about-text">
                  Somos una organización dedicada a la seguridad ciudadana y colaboración comunitaria en Desamparados. Trabajamos juntos por un cantón más seguro, facilitando el reporte de incidentes y la comunicación con las autoridades locales.
                </p>
              </div>

              {/*Grid column: Links */}
              <div className="col-lg-4 col-md-6 mb-4 mb-md-0 text-start">
                <h5 className="text-uppercase footer-title">Enlaces Rápidos</h5>
                <ul className="list-unstyled mb-0 footer-links">
                  <li>
                    <a href="/">Inicio</a>
                  </li>
                  <li>
                    <a href="/emergencias">Números de Emergencia</a>
                  </li>
                  <li>
                    <a href="/reportar-incidente">Reportar Incidente</a>
                  </li>
                  <li>
                    <a href="/login">Iniciar Sesión</a>
                  </li>
                </ul>
              </div>

              {/*Grid column: Contact */}
              <div className="col-lg-4 col-md-6 mb-4 mb-md-0 text-start">
                <a href="/contactenos" className="btn btn-info text-dark text-uppercase fw-bold mb-3">
                  <i className="fa-solid fa-envelope-open-text me-2"></i> Contáctenos
                </a>
                <ul className="list-unstyled footer-links">
                  <li>
                    <span><i className="fa-solid fa-location-dot me-2"></i> Municipalidad de Desamparados</span>
                  </li>
                  <li>
                    <span><i className="fa-solid fa-envelope me-2"></i> info@mscdesamparados.com</span>
                  </li>
                  <li>
                    <span><i className="fa-solid fa-phone me-2"></i> 911 (Emergencias)</span>
                  </li>
                </ul>
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