import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Emergencias.css';

const Emergencias = () => {
    const categorizedNumbers = [
        {
            title: 'Emergencias Principales',
            icon: 'fa-star-of-life',
            numbers: [
                { number: '911', label: 'Emergencias Unificadas', icon: 'fa-phone-volume' },
                { number: '2250-4972', label: 'Cruz Roja (Desamparados)', icon: 'fa-truck-medical' },
                { number: '2547-3700 / 2259-2304', label: 'Bomberos (Desamparados)', icon: 'fa-fire-extinguisher' },
                { number: '2250-1480', label: 'Policía Municipal (Desamparados)', icon: 'fa-building-shield' }
            ]
        },
        {
            title: 'Seguridad Regional',
            icon: 'fa-shield-halved',
            numbers: [
                { number: '2600-0270', label: 'Fuerza Pública (Delegación Sur)', icon: 'fa-building-shield' },
                { number: '2250-0822', label: 'Fuerza Pública (San Antonio)', icon: 'fa-building-shield' }
            ]
        },
        {
            title: 'Denuncias e Investigación',
            icon: 'fa-magnifying-glass-chart',
            numbers: [
                { number: '800-8000-645', label: 'OIJ (Línea Confidencial)', icon: 'fa-user-secret' },
                { number: '1176', label: 'PCD (Control de Drogas)', icon: 'fa-pills' }
            ]
        },
        {
            title: 'Tránsito y Seguros',
            icon: 'fa-car-burst',
            numbers: [
                { number: '2222-9330', label: 'Policía de Tránsito', icon: 'fa-car-burst' },
                { number: '800-800-8000', label: 'INS (Accidentes Tránsito)', icon: 'fa-shield-heart' }
            ]
        },
        {
            title: 'Apoyo Social y Bienestar',
            icon: 'fa-hands-holding-child',
            numbers: [
                { number: '1147', label: 'PANI (Niñez y Adolescencia)', icon: 'fa-child-reaching' },
                { number: '800-8000-247', label: 'INAMU (Apoyo a Mujeres)', icon: 'fa-venus' },
                { number: '800-000-4627', label: 'IMAS (Ayuda Social)', icon: 'fa-hand-holding-heart' }
            ]
        },
        {
            title: 'Servicios Básicos y Salud',
            icon: 'fa-faucet-drip',
            numbers: [
                { number: '800-732-6783', label: 'AyA (Averías Agua)', icon: 'fa-droplet' },
                { number: '1026', label: 'CNFL (Averías Electricidad)', icon: 'fa-bolt' },
                { number: '2223-1028', label: 'Control de Intoxicaciones', icon: 'fa-skull-crossbones' }
            ]
        }
    ];

    return (
        <div className="emergencias-page">
            <Navbar />
            
            <main className="emergencias-container">
                <header className="emergencias-header">
                    <h1>Líneas de Emergencia</h1>
                    <p>Costa Rica - Acceso rápido a servicios de auxilio y seguridad</p>
                </header>

                <div className="categorized-container">
                    {categorizedNumbers.map((category, catIndex) => (
                        <div key={catIndex} className="category-group">
                            <div className="category-header">
                                <i className={`fa-solid ${category.icon}`}></i>
                                <h2>{category.title}</h2>
                            </div>
                            <div className="numbers-grid">
                                {category.numbers.map((item, index) => {
                                    const numbers = item.number.split(' / ');
                                    return (
                                        <div 
                                            key={index} 
                                            className="emergency-card"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="card-icon">
                                                <i className={`fa-solid ${item.icon}`}></i>
                                            </div>
                                            <div className="card-numbers-wrapper">
                                                {numbers.map((num, idx) => (
                                                    <a 
                                                        key={idx} 
                                                        href={`tel:${num.replace(/-/g, '').trim()}`} 
                                                        className="card-number"
                                                    >
                                                        {num}
                                                    </a>
                                                ))}
                                            </div>
                                            <span className="card-label">{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <section className="map-section">
                    <div className="card-icon" style={{ color: '#3b82f6' }}>
                        <i className="fa-solid fa-map-location-dot"></i>
                    </div>
                    <h2>Mapa Web de Seguridad</h2>
                    <p>
                        Visualiza incidentes reportados en tiempo real y zonas de monitoreo 
                        en el cantón de Desamparados para tu seguridad y la de tu familia.
                    </p>
                    <a href="#" className="btn-map" onClick={(e) => {
                        e.preventDefault();
                        // Aquí podrías redirigir a una sección específica del mapa si existiera
                        alert('Funcionalidad de mapa en desarrollo o integrada en la página principal.');
                    }}>
                        Ver Mapa de Seguridad
                    </a>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Emergencias;
