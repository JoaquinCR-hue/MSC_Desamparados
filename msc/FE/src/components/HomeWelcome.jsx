import React from 'react';
import '../styles/HomeWelcome.css';

// Componente informativo de bienvenida y valores institucionales para la página de inicio
function HomeWelcome() {
    return (
        <div className="home-container">
            <section className="about-section">
                <div className="content-container">
                    <h2 className="section-title">Sobre Nosotros</h2>
                    <p className="section-text">
                        Somos una organización comprometida con la seguridad y el bienestar de los ciudadanos de Desamparados. 
                        Trabajamos día a día para brindar soluciones efectivas e innovadoras que mejoren la calidad de vida de nuestra comunidad.
                    </p>
                </div>
            </section>

            <section className="history-section">
                <div className="content-container">
                    <h2 className="section-title text-center">Nuestra Historia</h2>
                    <div className="history-content">
                        <div className="history-text">
                            <p className="section-text">
                                Desde nuestra fundación, la Policía Municipal de Desamparados ha evolucionado para adaptarse a los retos cambiantes de nuestra sociedad. Lo que comenzó como un pequeño grupo de vigilancia ciudadana, se ha transformado en un cuerpo de seguridad altamente capacitado y tecnológico.
                            </p>
                            <p className="section-text">
                                A lo largo de los años, hemos implementado sistemas de monitoreo avanzados, programas preventivos en escuelas y comunidades, y estrechado vínculos de confianza con los vecinos para construir un cantón más seguro, próspero y en paz.
                            </p>
                        </div>
                        <div className="history-image-placeholder">
                            <div className="image-overlay">
                                <i className="fa-solid fa-clock-rotate-left"></i>
                                <span>Años de Servicio y Dedicación</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mission-vision-wrapper">
                <section className="card-section mission">
                    <div className="card-icon">🎯</div>
                    <h2 className="card-title">Misión</h2>
                    <p className="card-text">
                        Proteger y servir a la comunidad de Desamparados mediante un enfoque preventivo y proactivo, 
                        fomentando la participación ciudadana y garantizando entornos seguros para el desarrollo de cada individuo.
                    </p>
                </section>

                <section className="card-section vision">
                    <div className="card-icon">👁️</div>
                    <h2 className="card-title">Visión</h2>
                    <p className="card-text">
                        Ser el modelo de excelencia en seguridad municipal a nivel nacional, reconocidos por nuestra 
                        integridad, innovación tecnológica y el fuerte vínculo de confianza con nuestros ciudadanos.
                    </p>
                </section>
            </div>

            <section className="values-section">
                <h2 className="section-title text-center">Valores Diferenciadores</h2>
                <div className="values-grid">
                    <div className="value-item">
                        <div className="value-icon">🤝</div>
                        <h3 className="value-title">Compromiso</h3>
                        <p className="value-text">Dedicación total hacia el bienestar de nuestra comunidad.</p>
                    </div>
                    <div className="value-item">
                        <div className="value-icon">⚖️</div>
                        <h3 className="value-title">Integridad</h3>
                        <p className="value-text">Actuamos con transparencia, ética y honestidad en cada acción.</p>
                    </div>
                    <div className="value-item">
                        <div className="value-icon">🚀</div>
                        <h3 className="value-title">Innovación</h3>
                        <p className="value-text">Implementamos las mejores tecnologías y estrategias de seguridad.</p>
                    </div>
                    <div className="value-item">
                        <div className="value-icon">🛡️</div>
                        <h3 className="value-title">Proximidad</h3>
                        <p className="value-text">Cercanía y empatía con las necesidades reales de los ciudadanos.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomeWelcome;
