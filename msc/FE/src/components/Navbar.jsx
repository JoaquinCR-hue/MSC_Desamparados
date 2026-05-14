import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import '../styles/Navbar.css';

/**
 * Barra de navegación principal de la aplicación.
 * Muestra diferentes enlaces según el rol del usuario autenticado.
 * Gestiona el menú desplegable, el modo oscuro/claro y el cierre de sesión.
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  /**
   * Alterna entre el tema oscuro y el tema claro,
   * persistiendo la preferencia en localStorage.
   */
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Aplica el atributo data-theme al documento cuando cambia el tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Cierra el menú desplegable al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    // Usamos 'click' en lugar de 'mousedown' para mejor compatibilidad móvil
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuRef]);

  /**
   * Obtiene el usuario autenticado desde sessionStorage.
   * @returns {Object|null} Datos del usuario o null si no hay sesión
   */
  const getUser = () => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  };

  const user = getUser();
  const isPublic = !user;
  const isCitizen = user && user.role === 'ciudadano';
  const isOfficer = user && user.role === 'funcionario';
  const isAdmin = user && user.role === 'admin';

  return (
    <>
      <div className="navbar-container">
        <nav className="custom-navbar">
          {/* Brand Logo and Name */}
          <Link to="/" className="navbar-brand-custom">
            <div className="logo-container">
              <i className="fa-solid fa-user-shield logo-icon"></i>
            </div>
            <div className="logo-text">
              <span className="logo-main-text">MSC Desamparados</span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Hidden on Mobile) */}
          <div className="nav-links-custom desktop-only">
            {(isPublic || isAdmin) && (
              <Link to="/emergencies" className="nav-link-custom">
                <i className="fa-solid fa-phone"></i>
                Emergencias
              </Link>
            )}

            <Link to="/risk-map" className="nav-link-custom">
              <i className="fa-solid fa-map-location-dot"></i>
              Mapa de Riesgo
            </Link>

            {(isCitizen || isOfficer || isAdmin) && (
              <Link to="/safe-routes" className="nav-link-custom nav-link-safe">
                <i className="fa-solid fa-route"></i>
                Rutas Seguras
              </Link>
            )}

            {(isOfficer || isAdmin) && (
              <Link to="/patrol-map" className="nav-link-custom">
                <i className="fa-solid fa-shield-halved"></i>
                Mapa Patrullaje
              </Link>
            )}
          </div>

          {/* Navigation Actions: Theme, Notifications, Menu, Report */}
          <div className="nav-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo Día' : 'Modo Noche'}>
              {theme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
            </button>

            {(isOfficer || isAdmin) && <NotificationBell />}

            {/* Dropdown Menu */}
            <div className="menu-dropdown-container" ref={menuRef}>
              <button className="menu-button" onClick={toggleMenu}>
                <i className="fa-solid fa-bars menu-icon"></i>
                <span className="menu-text">Menú</span>
              </button>

              <div className={`dropdown-menu-custom ${isMenuOpen ? 'show' : ''}`}>
                {/* Mobile-only links (Moved from main nav) */}
                <div className="mobile-only-links">
                  {(isPublic || isAdmin) && (
                    <Link to="/emergencies" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-phone"></i>Emergencias
                    </Link>
                  )}
                  <Link to="/risk-map" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <i className="fa-solid fa-map-location-dot"></i>Mapa de Riesgo
                  </Link>
                  {(isCitizen || isOfficer || isAdmin) && (
                    <Link to="/safe-routes" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-route"></i>Rutas Seguras
                    </Link>
                  )}
                  {(isOfficer || isAdmin) && (
                    <Link to="/patrol-map" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-shield-halved"></i>Mapa Patrullaje
                    </Link>
                  )}
                  <Link to="/report-incident" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <i className="fa-solid fa-circle-exclamation"></i>Reportar Incidente
                  </Link>
                  <div className="dropdown-divider"></div>
                </div>

                {/* Management and System Links */}
                {isAdmin && (
                  <>
                    <Link to="/manage-users" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-users-gear"></i>G.Usuarios
                    </Link>
                    <Link to="/manage-consults" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-headset"></i>G.Consultas
                    </Link>
                  </>
                )}

                {(isOfficer || isAdmin) && (
                  <Link to="/statistics" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <i className="fa-solid fa-chart-line"></i>Estadísticas
                  </Link>
                )}

                {(isOfficer || isAdmin) && (
                  <Link to="/manage-reports" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <i className="fa-solid fa-file-shield"></i>G.Reportes
                  </Link>
                )}

                {user && <div className="dropdown-divider"></div>}

                {!user ? (
                  <>
                    <Link to="/login" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-arrow-right-to-bracket"></i>
                      Iniciar Sesión
                    </Link>
                    <Link to="/register" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-user-plus"></i>
                      Registrarse
                    </Link>
                  </>
                ) : (
                  <button className="dropdown-item logout-btn" onClick={() => {
                    sessionStorage.removeItem('user');
                    window.location.href = '/';
                  }}>
                    <i className="fa-solid fa-power-off"></i>
                    Cerrar Sesión
                  </button>
                )}
              </div>
            </div>

            {/* Report Incident Button with Custom SVG Siren */}
            <Link to="/report-incident" className="report-button" title="Reportar Incidente">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="siren-svg-icon"
              >
                <path d="M12 7V3M5 12H2M22 12h-3M16.24 7.76l1.42-1.42M6.34 17.66l1.42-1.42M17.66 17.66l-1.42-1.42M7.76 7.76L6.34 6.34M12 12a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <span className="report-text">Reportar Incidente</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
