import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmergencyDirectory from '../components/EmergencyDirectory';
import '../styles/Emergencies.css';

/**
 * EmergenciesPage - Directorio de números y servicios de emergencia.
 */
function EmergenciesPage() {
    return (
        <div className="emergencies-container">
            <Navbar />
            <div className="emergencies-content">
                <EmergencyDirectory />
            </div>
            <Footer />
        </div>
    );
}

export default EmergenciesPage;