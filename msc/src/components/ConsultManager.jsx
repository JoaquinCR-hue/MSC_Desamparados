import React, { useState, useEffect } from 'react';
import ConsultService from '../services/ConsultService';
import Swal from 'sweetalert2';
import '../styles/ConsultManager.css';

// Componente para la gestión centralizada de consultas ciudadanas (bandeja de entrada)
function ConsultManager() {
    const [consults, setConsults] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConsults = async () => {
        try {
            const data = await ConsultService.getConsults();
            // Ordenar por estado: 'Pendiente' primero, luego por fecha descendente
            const sortedData = data.sort((a, b) => {
                if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
                if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
                return new Date(b.fecha) - new Date(a.fecha);
            });
            setConsults(sortedData);
            setLoading(false);
        } catch (error) {
            console.error("Error al obtener consultas", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsults();
    }, []);

    // Función para registrar una respuesta oficial a una consulta
    const handleRespond = async (consult) => {
        const { value: responseText } = await Swal.fire({
            title: 'Responder Consulta',
            input: 'textarea',
            inputLabel: `Enviando respuesta a ${consult.nombreCompleto} (${consult.correo})`,
            inputPlaceholder: 'Escriba la respuesta detallada de la municipalidad...',
            inputAttributes: {
                'aria-label': 'Respuesta'
            },
            showCancelButton: true,
            confirmButtonText: 'Enviar Respuesta',
            cancelButtonText: 'Cancelar',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            confirmButtonColor: 'var(--primary-color)'
        });

        if (responseText) {
            try {
                const updatedConsult = {
                    ...consult,
                    estado: 'Respondida',
                    respuesta: responseText,
                    fechaRespuesta: new Date().toISOString()
                };
                await ConsultService.updateConsult(updatedConsult, consult.id);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Enviado',
                    text: 'La respuesta ha sido registrada y enviada al ciudadano.',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    confirmButtonColor: 'var(--primary-color)'
                });
                fetchConsults();
            } catch (error) {
                Swal.fire('Error', 'No se pudo guardar la respuesta.', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center text-white my-5">
                <div className="spinner-border text-info mb-3" role="status"></div>
                <h4>Cargando bandeja de consultas...</h4>
            </div>
        );
    }

    return (
        <div className="consult-manager-container">
            <header className="page-header-premium">
                <h1>Bandeja de Atención Ciudadana</h1>
                <p className="text-secondary">Gestión centralizada de quejas, sugerencias y consultas ciudadanas</p>
            </header>
            
            <div className="info-banner-v2">
                <i className="fa-solid fa-circle-info"></i>
                <p className="mb-0">Administre las comunicaciones entrantes y brinde respuestas oficiales para mejorar la satisfacción comunitaria.</p>
            </div>

            {consults.length === 0 ? (
                <div className="empty-state">
                    <i className="fa-solid fa-mailbox-empty"></i>
                    <h3>Bandeja Vacía</h3>
                    <p className="text-muted">No hay nuevas consultas que requieran atención en este momento.</p>
                </div>
            ) : (
                <div className="consults-grid">
                    {consults.map(consult => (
                        <div key={consult.id} className="consult-card-wrapper">
                            <article className="consult-card-premium">
                                <header className={`card-premium-header ${consult.estado === 'Pendiente' ? 'status-pending' : 'status-resolved'}`}>
                                    <span>
                                        <i className={`fa-solid ${consult.tipoConsulta === 'Queja' ? 'fa-angry' : 'fa-clipboard-question'} me-2`}></i> 
                                        {consult.tipoConsulta}
                                    </span>
                                    <span className="status-badge">{consult.estado}</span>
                                </header>

                                <div className="card-premium-body">
                                    <h3 className="citizen-name">{consult.nombreCompleto}</h3>
                                    <div className="citizen-meta">
                                        <span><i className="fa-solid fa-id-card"></i> {consult.cedula}</span>
                                        <span><i className="fa-solid fa-envelope"></i> {consult.correo}</span>
                                        {consult.telefono && <span><i className="fa-solid fa-phone"></i> {consult.telefono}</span>}
                                        <span><i className="fa-regular fa-calendar"></i> {new Date(consult.fecha).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="message-content">
                                        <p className="message-text">"{consult.descripcion}"</p>
                                    </div>

                                    {consult.estado === 'Respondida' && consult.respuesta && (
                                        <div className="response-box">
                                            <div className="response-header">
                                                <i className="fa-solid fa-reply"></i> Respuesta Oficial:
                                            </div>
                                            <p className="message-text mt-2">{consult.respuesta}</p>
                                            <small className="text-muted d-block mt-2">
                                                <i className="fa-regular fa-clock me-1"></i> Finalizado el {new Date(consult.fechaRespuesta).toLocaleString()}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                <footer className="card-premium-footer">
                                    {consult.estado === 'Pendiente' ? (
                                        <button className="btn-premium-respond" onClick={() => handleRespond(consult)}>
                                            <i className="fa-solid fa-reply"></i> Dar Respuesta
                                        </button>
                                    ) : (
                                        <div className="btn-premium-disabled">
                                            <i className="fa-solid fa-check-double me-2"></i> Atendido Correctamente
                                        </div>
                                    )}
                                </footer>
                            </article>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ConsultManager;
