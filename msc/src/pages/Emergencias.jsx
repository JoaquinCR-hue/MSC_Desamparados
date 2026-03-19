import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Emergencias.css';

const Emergencias = () => {
    const [filter, setFilter] = React.useState('TODOS');

    const mainEmergency = {
        number: '9-1-1',
        title: '9-1-1 EMERGENCIAS',
        label: 'Línea única para reporte de crímenes en progreso, accidentes graves, incendios o riesgo inminente de vida.',
        icon: 'fa-star-of-life'
    };

    const categories = [
        {
            id: 'URGENTE',
            title: 'Emergencias Principales',
            icon: 'fa-star-of-life',
            numbers: [
                { number: '2250-4972', label: 'Cruz Roja', subtitle: 'Emergencias Médicas', icon: 'fa-truck-medical', description: 'Primeros auxilios, traslados en ambulancia y rescate en accidentes.' },
                { number: '2547-3700 / 2259-2304', label: 'Bomberos', subtitle: 'Prevención de Incendios', icon: 'fa-fire-extinguisher', description: 'Fugas de gas, cortocircuitos, incendios estructurales y rescate animal.' },
                { number: '2250-1480', label: 'Policía Municipal', subtitle: 'Seguridad Local', icon: 'fa-building-shield', description: 'Vigilancia y prevención en el cantón de Desamparados.' }
            ]
        },
        {
            id: 'URGENTE',
            title: 'Seguridad Regional',
            icon: 'fa-shield-halved',
            numbers: [
                { number: '2600-0270', label: 'Fuerza Pública', subtitle: 'Delegación Sur', icon: 'fa-building-shield', description: 'Seguridad ciudadana y prevención en la zona sur.' },
                { number: '2250-0822', label: 'Fuerza Pública', subtitle: 'San Antonio', icon: 'fa-building-shield', description: 'Delegación local para el distrito de San Antonio.' }
            ]
        },
        {
            id: 'URGENTE',
            title: 'Denuncias e Investigación',
            icon: 'fa-magnifying-glass-chart',
            numbers: [
                { number: '800-8000-645', label: 'OIJ', subtitle: 'Línea Confidencial', icon: 'fa-user-secret', description: 'Denuncias confidenciales para narcóticos, homicidios y crímenes.' },
                { number: '1176', label: 'PCD', subtitle: 'Control de Drogas', icon: 'fa-pills', description: 'Reportes sobre venta y tráfico de sustancias ilícitas.' }
            ]
        },
        {
            id: 'SOCIAL',
            title: 'Apoyo Social y Bienestar',
            icon: 'fa-hands-holding-child',
            numbers: [
                { number: '1147', label: 'PANI', subtitle: 'Protección de la Niñez', icon: 'fa-child-reaching', description: 'Reporte de maltrato infantil, abandono o riesgo para menores.' },
                { number: '800-8000-247', label: 'INAMU', subtitle: 'Apoyo a Mujeres', icon: 'fa-venus', description: 'Orientación técnica y legal para víctimas de violencia de género.' },
                { number: '800-000-4627', label: 'IMAS', subtitle: 'Ayuda Social', icon: 'fa-hand-holding-heart', description: 'Subsidios y programas de ayuda para personas de escasos recursos.' }
            ]
        },
        {
            id: 'SOCIAL',
            title: 'Tránsito y Seguros',
            icon: 'fa-car-burst',
            numbers: [
                { number: '2222-9330', label: 'Tránsito', subtitle: 'Emergencias Viales', icon: 'fa-traffic-light', description: 'Reporte de colisiones, bloqueos o emergencias en carretera.' },
                { number: '800-800-8000', label: 'INS', subtitle: 'Soporte Seguros', icon: 'fa-file-shield', description: 'Reporte de accidentes y reclamaciones de seguros (Instituto Nacional de Seguros).' }
            ]
        },
        {
            id: 'SOCIAL',
            title: 'Servicios Básicos y Salud',
            icon: 'fa-faucet-drip',
            numbers: [
                { number: '800-732-6783', label: 'AyA', subtitle: 'Averías Agua', icon: 'fa-droplet', description: 'Reporte de fugas, cortes de servicio o problemas con el suministro.' },
                { number: '1026', label: 'CNFL', subtitle: 'Averías Electricidad', icon: 'fa-bolt', description: 'Asistencia técnica por fallas en el fluido eléctrico o alumbrado.' },
                { number: '2223-1028', label: 'Intoxicaciones', subtitle: 'Centro Nacional', icon: 'fa-skull-crossbones', description: 'Atención especializada en casos de envenenamiento o químicos.' }
            ]
        }
    ];

    const filteredNumbers = filter === 'TODOS' 
        ? categories.flatMap(cat => cat.numbers)
        : categories.filter(cat => cat.id === filter).flatMap(cat => cat.numbers);

    return (
        <div className="emergencias-dashboard">
            <Navbar />
            
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <nav className="sidebar-nav">
                        <a href="/" className="sidebar-item">
                            <i className="fa-solid fa-house"></i>
                            <span>Inicio</span>
                        </a>
                        <a href="/emergencias" className="sidebar-item active">
                            <i className="fa-solid fa-address-book"></i>
                            <span>Directorio</span>
                        </a>
                        <a href="#" className="sidebar-item">
                            <i className="fa-solid fa-map-location-dot"></i>
                            <span>Mapa de Riesgo</span>
                        </a>
                    </nav>

                    <div className="sidebar-status-card">
                        <div className="status-header">
                            <span className="status-dot"></span>
                            <span className="status-text">SISTEMA ACTIVO</span>
                        </div>
                        <p>Desamparados, CR</p>
                        <strong>Estado: Vigilancia 24/7</strong>
                    </div>
                </aside>

                <main className="dashboard-content">
                    <header className="content-header">
                        <div className="header-title">
                            <h1>Directorio de Emergencias</h1>
                            <p>Acceso rápido a los servicios de respuesta inmediata en el cantón de Desamparados.</p>
                        </div>
                        <div className="header-filters">
                            <button 
                                className={`filter-btn ${filter === 'TODOS' ? 'active' : ''}`}
                                onClick={() => setFilter('TODOS')}
                            >
                                TODOS
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'URGENTE' ? 'active' : ''}`}
                                onClick={() => setFilter('URGENTE')}
                            >
                                URGENTE
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'SOCIAL' ? 'active' : ''}`}
                                onClick={() => setFilter('SOCIAL')}
                            >
                                SOCIAL
                            </button>
                        </div>
                    </header>

                    <section className="featured-emergency">
                        <div className="featured-card">
                            <div className="featured-icon">
                                <i className={`fa-solid ${mainEmergency.icon}`}></i>
                            </div>
                            <div className="featured-info">
                                <h2>{mainEmergency.title}</h2>
                                <p>{mainEmergency.label}</p>
                            </div>
                            <div className="featured-number-action">
                                <span className="featured-number-display">{mainEmergency.number}</span>
                                <a href={`tel:${mainEmergency.number.replace(/\D/g, '')}`} className="btn-call-now">
                                    <i className="fa-solid fa-phone"></i>
                                    LLAMAR AHORA
                                </a>
                            </div>
                        </div>
                    </section>

                    <section className="directory-grid">
                        {filteredNumbers.map((item, index) => (
                            <div key={index} className="directory-card">
                                <div className="card-top">
                                    <div className="card-icon-container">
                                        <i className={`fa-solid ${item.icon}`}></i>
                                    </div>
                                    <div className="card-titles">
                                        <h3>{item.label}</h3>
                                        <span>{item.subtitle}</span>
                                    </div>
                                    <span className="card-number-top">
                                        {item.label === 'Bomberos' ? item.number.replace(/-/g, ' - ') : item.number}
                                    </span>
                                </div>
                                <p className="card-description">{item.description}</p>
                                <div className="card-actions-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {item.number.split(' / ').map((num, idx) => (
                                        <a key={idx} href={`tel:${num.replace(/\D/g, '')}`} className="btn-card-action">
                                            <i className="fa-solid fa-phone-flip text-xs"></i>
                                            {item.label === 'Bomberos' ? `Marcar ${num.replace(/-/g, ' - ')}` : `Llamar ${item.label}`}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>

                    <footer className="dashboard-footer-info">
                        <div className="footer-info-content">
                            <h3>Manténgase Informado</h3>
                            <p>
                                Este directorio es mantenido por la Red de Seguridad Comunitaria de Desamparados. 
                                En caso de duda, siempre marque al 9-1-1 como primera opción.
                            </p>
                            <div className="footer-actions">
                                <a href="#"><i className="fa-solid fa-download"></i> Descargar PDF</a>
                                <a href="#"><i className="fa-solid fa-share-nodes"></i> Compartir</a>
                            </div>
                        </div>
                        <div className="footer-map-preview">
                            <img src="https://via.placeholder.com/300x150?text=Mapa+Desamparados" alt="Mapa" />
                            <div className="map-marker">
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default Emergencias;
