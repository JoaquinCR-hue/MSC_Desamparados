import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);
  const user = localStorage.getItem('user');

  return (
    <>
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
        <a href="/" className="nav-link-custom">Inicio</a>
        
        <a href="/emergencias" className="nav-link-custom">
          <i className="fa-solid fa-phone"></i>
          Números de Emergencia
        </a>

        <a href="/gestion-usuarios" className="nav-link-custom">
          <i className="fa-solid fa-users-gear"></i>
          Gestión Usuarios
        </a>

        <a href="/estadisticas" className="nav-link-custom">
          <i className="fa-solid fa-chart-line"></i>
          Estadísticas
        </a>
      </div>

      <div className="nav-actions">
        <div className="menu-dropdown-container" ref={menuRef}>
          <button className="menu-button" onClick={toggleMenu}>
            <i className="fa-solid fa-bars menu-icon"></i>
            Menú
          </button>
          
          <div className={`dropdown-menu-custom ${isMenuOpen ? 'show' : ''}`}>
            {!user ? (
              <>
                <a href="/login" className="dropdown-item">
                  <i className="fa-solid fa-arrow-right-to-bracket"></i>
                  Iniciar sesión
                </a>
                <a href="/registrarse" className="dropdown-item">
                  <i className="fa-solid fa-user-plus"></i>
                  Registrarse
                </a>
              </>
            ) : (
              <a href="#" className="dropdown-item" onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/';
              }}>
                <i className="fa-solid fa-power-off"></i>
                Cerrar Sesión
              </a>
            )}
          </div>
        </div>

        {user && (
          <button className="report-button" onClick={() => navigate('/reportar-incidente')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" className="btn-icon-white" />
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
            </svg>
            Reportar Incidente
          </button>
        )}
      </div>
    </nav>
    </>
  );
};

export default Navbar;
