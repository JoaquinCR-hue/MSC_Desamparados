import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          {/* Logo y marca de la aplicación */}
          <a href="/" className="navbar-brand-custom">
            <div className="logo-container">
              <i className="fa-solid fa-user-shield logo-icon"></i>
            </div>
            <div className="logo-text">
              <span className="logo-main-text">MSC Desamparados</span>
            </div>
          </a>

          {/* Enlace de navegación principal según el rol */}
          <div className="nav-links-custom">
            {(isPublic || isAdmin) && (
              <a href="/emergencies" className="nav-link-custom">
                <i className="fa-solid fa-phone"></i>
                Emergencias
              </a>
            )}

            <a href="/risk-map" className="nav-link-custom">
              <i className="fa-solid fa-map-location-dot"></i>
              Mapa de Riesgo
            </a>

            {(isCitizen || isOfficer || isAdmin) && (
              <a href="/safe-routes" className="nav-link-custom nav-link-safe">
                <i className="fa-solid fa-route"></i>
                Rutas Seguras
              </a>
            )}

            {(isOfficer || isAdmin) && (
              <a href="/patrol-map" className="nav-link-custom">
                <i className="fa-solid fa-shield-halved"></i>
                Mapa Patrullaje
              </a>
            )}
          </div>

          {/* Acciones de la barra de navegación: tema, notificaciones, menú */}
          <div className="nav-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo Día' : 'Modo Noche'}>
              {theme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
            </button>

            {(isOfficer || isAdmin) && <NotificationBell />}

            {/* Menú desplegable de opciones según el rol */}
            <div className="menu-dropdown-container" ref={menuRef}>
              <button className="menu-button" onClick={toggleMenu}>
                <i className="fa-solid fa-bars menu-icon"></i>
                Menú
              </button>

              <div className={`dropdown-menu-custom ${isMenuOpen ? 'show' : ''}`}>
                {isAdmin && (
                  <>
                    <a href="/manage-users" className="dropdown-item">
                      <i className="fa-solid fa-users-gear"></i>G.Usuarios
                    </a>
                    <a href="/manage-consults" className="dropdown-item">
                      <i className="fa-solid fa-headset"></i>G.Consultas
                    </a>
                  </>
                )}

                {(isOfficer || isAdmin) && (
                  <a href="/statistics" className="dropdown-item">
                    <i className="fa-solid fa-chart-line"></i>Estadísticas
                  </a>
                )}

                {(isOfficer || isAdmin) && (
                  <a href="/manage-reports" className="dropdown-item">
                    <i className="fa-solid fa-file-shield"></i>G.Reportes
                  </a>
                )}

                {user && <div className="dropdown-divider"></div>}

                {!user ? (
                  <>
                    <a href="/login" className="dropdown-item">
                      <i className="fa-solid fa-arrow-right-to-bracket"></i>
                      Iniciar sesión
                    </a>
                    <a href="/register" className="dropdown-item">
                      <i className="fa-solid fa-user-plus"></i>
                      Registrarse
                    </a>
                  </>
                ) : (
                  <a href="#" className="dropdown-item" onClick={() => {
                    sessionStorage.removeItem('user');
                    window.location.href = '/';
                  }}>
                    <i className="fa-solid fa-power-off"></i>
                    Cerrar Sesión
                  </a>
                )}
              </div>
            </div>

            {/* Botón para reportar incidente (usuarios autenticados) */}
            {(isCitizen || isOfficer || isAdmin) && (
              <button className="report-button" onClick={() => navigate('/report-incident')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" className="btn-icon-white" />
                  <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                </svg>
                Reportar Incidente
              </button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
