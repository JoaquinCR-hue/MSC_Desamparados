import React from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
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
        <a href="/emergencias" className="nav-link-custom">Emergencias</a>
      </div>

      <button className="report-button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" className="btn-icon-white" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
        Reportar Incidente
      </button>
    </nav>
  );
};

export default Navbar;
