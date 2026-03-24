import React from 'react';
import Navbar from '../components/Navbar';
import ControlConsultas from '../components/ControlConsultas';
import Footer from '../components/Footer';

function GestionConsultas() {
    return (
        <div className="page-wrapper bg-dark min-vh-100">
            <Navbar />
            <div className="container mt-4 pt-5 pb-5">
                <ControlConsultas />
            </div>
            <Footer />
        </div>
    );
}

export default GestionConsultas;
