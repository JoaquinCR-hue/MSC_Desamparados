import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ControlUsuarios from '../components/ControlUsuarios';
import '../styles/GestionUsuarios.css';

function GestionUsuarios() {
    return (
        <div className="gestion-page-container">
            <Navbar />
            <div className="gestion-content">
                <ControlUsuarios />
            </div>
            <Footer />
        </div>
    );
}

export default GestionUsuarios;