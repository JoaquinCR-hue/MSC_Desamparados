import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmergencyMenuOpen, setIsEmergencyMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const emergencyMenuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (emergencyMenuRef.current && !emergencyMenuRef.current.contains(event.target)) {
        setIsEmergencyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

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

      <div className="nav-links-custom" style={{ display: 'flex', alignItems: 'center' }}>
        <a href="/" className="nav-link-custom">Inicio</a>
        
        <div className="menu-dropdown-container" ref={emergencyMenuRef}>
          <button 
            className="nav-link-custom" 
            style={{ background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', outline: 'none' }}
            onClick={() => setIsEmergencyMenuOpen(!isEmergencyMenuOpen)}
          >
            <i className="fa-solid fa-phone"></i>
            Números de Emergencia
            <i className={`fa-solid fa-chevron-down ${isEmergencyMenuOpen ? 'fa-rotate-180' : ''}`} style={{ transition: 'transform 0.3s ease', fontSize: '0.8rem' }}></i>
          </button>
          
          {isEmergencyMenuOpen && (
            <div className="dropdown-menu-custom" style={{ top: 'calc(100% + 15px)', left: '50%', right: 'auto', transform: 'translateX(-50%)', width: '280px' }}>
              <a href="tel:911" className="dropdown-item">
                <i className="fa-solid fa-phone-volume"></i>
                911 - Emergencias
              </a>
              <a href="tel:128" className="dropdown-item">
                <i className="fa-solid fa-truck-medical"></i>
                128 - Cruz Roja
              </a>
              <a href="tel:117" className="dropdown-item">
                <i className="fa-solid fa-building-shield"></i>
                117 - Fuerza Pública
              </a>
              <a href="tel:118" className="dropdown-item">
                <i className="fa-solid fa-fire-extinguisher"></i>
                118 - Bomberos
              </a>
              <a href="tel:8008000645" className="dropdown-item">
                <i className="fa-solid fa-user-secret"></i>
                800-8000-645 - OIJ
              </a>
              <a href="/emergencias" className="dropdown-item" style={{ borderTop: '1px solid #334155', marginTop: '4px', paddingTop: '10px' }}>
                <i className="fa-solid fa-map-location-dot"></i>
                Mapa Web de Seguridad
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="nav-actions">
        <div className="menu-dropdown-container" ref={menuRef}>
          <button className="menu-button" onClick={toggleMenu}>
            <i className="fa-solid fa-bars menu-icon"></i>
            Menú
          </button>
          
          {isMenuOpen && (
            <div className="dropdown-menu-custom">
              <a href="/login" className="dropdown-item">
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                Iniciar sesión
              </a>
              <a href="/registrarse" className="dropdown-item">
                <i className="fa-solid fa-user-plus"></i>
                Registrarse
              </a>
            </div>
          )}
        </div>

        <button className="report-button" onClick={(e) => {
          e.preventDefault();
          const user = localStorage.getItem('user');
          if (!user) {
            import('sweetalert2').then(Swal => {
              Swal.default.fire({
                title: 'Acceso Denegado',
                text: 'Debes iniciar sesión para reportar un incidente.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ir a Iniciar Sesión',
                cancelButtonText: 'Cancelar'
              }).then((result) => {
                if (result.isConfirmed) {
                  navigate('/login');
                }
              });
            });
          } else {
            navigate('/reportar-incidente');
          }
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" className="btn-icon-white" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          Reportar Incidente
        </button>
      </div>
    </nav>
    </>
  );
};

export default Navbar;
