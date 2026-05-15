import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
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
  const handleAutoLogout = () => {
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
      // Solo reiniciamos si no hay una alerta de Swal abierta (opcional, pero recomendado)
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

  // Verificación de validez del Token (opcional pero complementaria)
  useEffect(() => {
    if (!user || !user.token) return;

    const checkTokenStatus = async () => {
      try {
        await UserService.checkStatus(user.token);
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

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <>
      <div className="navbar-container">
        <nav className="custom-navbar">
          <a href="/" className="navbar-brand-custom">
            <div className="logo-container">
              <i className="fa-solid fa-user-shield logo-icon"></i>
            </div>
            <div className="logo-text">
              <span className="logo-main-text">MSC Desamparados</span>
            </div>
          </a>

          <div className="nav-links-custom">
            {(isPublic || isAdmin) && (
              <a href="/emergencies" className="nav-link-custom">
                <i className="fa-solid fa-phone"></i> Emergencias
              </a>
            )}

            <a href="/risk-map" className="nav-link-custom">
              <i className="fa-solid fa-map-location-dot"></i> Mapa de Riesgo
            </a>

            {(isCitizen || isOfficer || isAdmin) && (
              <a href="/safe-routes" className="nav-link-custom nav-link-safe">
                <i className="fa-solid fa-route"></i> Rutas Seguras
              </a>
            )}

            {(isOfficer || isAdmin) && (
              <a href="/patrol-map" className="nav-link-custom">
                <i className="fa-solid fa-shield-halved"></i> Mapa Patrullaje
              </a>
            )}
          </div>

          <div className="nav-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo Día' : 'Modo Noche'}>
              {theme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
            </button>

            {(isOfficer || isAdmin) && <NotificationBell />}

            <div className="menu-dropdown-container" ref={menuRef}>
              <button className="menu-button" onClick={toggleMenu}>
                <i className="fa-solid fa-bars menu-icon"></i> Menú
              </button>

              <div className={`dropdown-menu-custom ${isMenuOpen ? 'show' : ''}`}>
                {isAdmin && (
                  <>
                    <a href="/manage-users" className="dropdown-item">
                      <i className="fa-solid fa-users-gear"></i> G.Usuarios
                    </a>
                    <a href="/manage-consults" className="dropdown-item">
                      <i className="fa-solid fa-headset"></i> G.Consultas
                    </a>
                  </>
                )}

                {(isOfficer || isAdmin) && (
                  <>
                    <a href="/statistics" className="dropdown-item">
                      <i className="fa-solid fa-chart-line"></i> Estadísticas
                    </a>
                    <a href="/manage-reports" className="dropdown-item">
                      <i className="fa-solid fa-file-shield"></i> G.Reportes
                    </a>
                  </>
                )}

                {user && <div className="dropdown-divider"></div>}

                {!user ? (
                  <>
                    <a href="/login" className="dropdown-item">
                      <i className="fa-solid fa-arrow-right-to-bracket"></i> Iniciar sesión
                    </a>
                    <a href="/register" className="dropdown-item">
                      <i className="fa-solid fa-user-plus"></i> Registrarse
                    </a>
                  </>
                ) : (
                  <a href="#" className="dropdown-item" onClick={handleLogout}>
                    <i className="fa-solid fa-power-off"></i> Cerrar Sesión
                  </a>
                )}
              </div>
            </div>

            {(isCitizen || isOfficer || isAdmin) && (
              <button className="report-button" onClick={() => navigate('/report-incident')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" className="btn-icon-white" />
                  <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                </svg>
                Reportar
              </button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
