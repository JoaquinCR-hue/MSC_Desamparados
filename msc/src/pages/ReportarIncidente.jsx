import React from 'react';
import Navbar from '../components/Navbar';
import FormularioReporte from '../components/FormularioReporte';
import '../styles/ReportarIncidente.css';

function ReportarIncidente() {
    return (
        <div className="reportar-page-container">
            <Navbar />
            <main className="reportar-main-content">
                <FormularioReporte />
            </main>
        </div>
    );
}

export default ReportarIncidente;
