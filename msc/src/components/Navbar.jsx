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
        
        <a href="/emergencias" className="nav-link-custom" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-phone"></i>
          Números de Emergencia
        </a>
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
