import React from 'react';
import Navbar from '../components/Navbar';
import ControlConsultas from '../components/ControlConsultas';
import Footer from '../components/Footer';

function GestionConsultas() {
    return (
        <div className="gestion-consultas-page-wrapper min-vh-100" style={{ backgroundColor: 'var(--bg-main)' }}>
            <Navbar />
            <div className="container mt-4 pt-5 pb-5">
                <ControlConsultas />
            </div>
            <Footer />
        </div>
    );
}

export default GestionConsultas;
