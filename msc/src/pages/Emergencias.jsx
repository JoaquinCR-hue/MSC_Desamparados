import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DirectorioEmergencias from '../components/DirectorioEmergencias';
import '../styles/Emergencias.css';

function Emergencias() {
    return (
        <div className="emergencias-container">
            <Navbar />
            <div className="emergencias-content">
                <DirectorioEmergencias />
            </div>
            <Footer />
        </div>
    );
}

export default Emergencias;