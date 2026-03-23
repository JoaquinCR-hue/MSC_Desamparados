import React from 'react';
import Navbar from '../components/Navbar';
import VisualizacionEstadisticas from '../components/VisualizacionEstadisticas';
import Footer from '../components/Footer';

const Estadisticas = () => {
    return (
        <div className="estadisticas-page">
            <Navbar />
            <main className="estadisticas-main">
                <VisualizacionEstadisticas />
            </main>
            <Footer />
        </div>
    );
};

export default Estadisticas;
