import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import EmergencyButton from './EmergencyButton';
import UserService from '../services/UserService';
import Swal from 'sweetalert2';
import '../styles/Navbar.css';

/**
 * Barra de navegación principal con monitoreo de inactividad y seguridad JWT.
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Temporizadores para inactividad
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);

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

  /**
   * Lógica de Cierre de Sesión por Inactividad
   */
  const handleAutoLogout = async () => {
    try {
      await UserService.logout();
    } catch (err) {
      console.error('Error al cerrar sesión auto:', err);
    }
    sessionStorage.removeItem('user');
    Swal.fire({
      title: 'Sesión Cerrada',
      text: 'Por seguridad de inactividad se ha cerrado la sesión, vuelve a iniciar sesión.',
      icon: 'info',
      confirmButtonText: 'Entendido',
      background: 'var(--bg-main)',
      color: 'var(--text-main)'
    }).then(() => {
      window.location.href = '/login';
    });
  };

  /**
   * Muestra la alerta de advertencia tras 3 minutos de inactividad.
   */
  const showInactivityWarning = () => {
    Swal.fire({
      title: '¿Sigues ahí?',
      text: 'Tu sesión está a punto de expirar por inactividad.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, seguir aquí',
      cancelButtonText: 'Cerrar sesión ahora',
      timer: 60000, // 1 minuto para responder
      timerProgressBar: true,
      background: 'var(--bg-main)',
      color: 'var(--text-main)'
    }).then((result) => {
      if (result.isConfirmed) {
        // El usuario sigue activo, reiniciamos los timers
        resetInactivityTimers();
      } else if (result.dismiss === Swal.DismissReason.timer || result.isDismissed) {
        // Se acabó el tiempo o el usuario decidió salir
        handleAutoLogout();
      }
    });
  };

  /**
   * Reinicia los temporizadores de inactividad.
   */
  const resetInactivityTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    if (user) {
      // 3 minutos para la advertencia (180,000 ms)
      warningTimerRef.current = setTimeout(showInactivityWarning, 180000);
    }
  };

  // Monitorear actividad del usuario
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      // Solo reiniciamos si no hay una alerta de Swal abierta
      if (!Swal.isVisible()) {
        resetInactivityTimers();
      }
    };

    events.forEach(event => document.addEventListener(event, handleUserActivity));
    resetInactivityTimers(); // Iniciar timers al cargar

    return () => {
      events.forEach(event => document.removeEventListener(event, handleUserActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [user]);

  // Verificación de validez de la sesión
  useEffect(() => {
    if (!user) return;

    const checkTokenStatus = async () => {
      try {
        await UserService.checkStatus();
      } catch (error) {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        handleAutoLogout();
      }
    };

    const interval = setInterval(checkTokenStatus, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [user]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef]);

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    try {
      await UserService.logout();
    } catch (err) {
      console.error('Error al cerrar sesión en el servidor:', err);
    }
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

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
                  <>
                    <Link to="/statistics" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-chart-line"></i>Estadísticas
                    </Link>
                    <Link to="/manage-reports" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <i className="fa-solid fa-file-shield"></i>G.Reportes
                    </Link>
                  </>
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
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <i className="fa-solid fa-power-off"></i>
                    Cerrar Sesión
                  </button>
                )}
              </div>
            </div>

            {(isCitizen || isOfficer || isAdmin) && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                <EmergencyButton user={user} />
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
