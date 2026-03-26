import React, { useState, useEffect } from 'react';
import ServiceConsultas from '../services/ServiceConsultas';
import Swal from 'sweetalert2';
import '../styles/ControlConsultas.css';

function ControlConsultas() {
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConsultas = async () => {
        try {
            const data = await ServiceConsultas.getConsultas();
            // Sort by pending first
            const sortedData = data.sort((a, b) => {
                if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
                if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
                return new Date(b.fecha) - new Date(a.fecha);
            });
            setConsultas(sortedData);
            setLoading(false);
        } catch (error) {
            console.error("Error al obtener consultas", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsultas();
    }, []);

    const handleResponder = async (consulta) => {
        const { value: respuestaText } = await Swal.fire({
            title: 'Responder Consulta',
            input: 'textarea',
            inputLabel: `Enviando respuesta a ${consulta.nombreCompleto} (${consulta.correo})`,
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

        if (respuestaText) {
            try {
                const updatedConsulta = {
                    ...consulta,
                    estado: 'Respondida',
                    respuesta: respuestaText,
                    fechaRespuesta: new Date().toISOString()
                };
                await ServiceConsultas.putConsulta(updatedConsulta, consulta.id);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Enviado',
                    text: 'La respuesta ha sido registrada y enviada al ciudadano.',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    confirmButtonColor: 'var(--primary-color)'
                });
                fetchConsultas();
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
        <div className="control-consultas-container">
            <header className="page-header-premium">
                <h1>Bandeja de Atención Ciudadana</h1>
                <p className="text-secondary">Gestión centralizada de quejas, sugerencias y consultas ciudadanas</p>
            </header>
            
            <div className="info-banner-v2">
                <i className="fa-solid fa-circle-info"></i>
                <p className="mb-0">Administre las comunicaciones entrantes y brinde respuestas oficiales para mejorar la satisfacción comunitaria.</p>
            </div>

            {consultas.length === 0 ? (
                <div className="empty-state">
                    <i className="fa-solid fa-mailbox-empty"></i>
                    <h3>Bandeja Vacía</h3>
                    <p className="text-muted">No hay nuevas consultas que requieran atención en este momento.</p>
                </div>
            ) : (
                <div className="consultas-grid">
                    {consultas.map(consulta => (
                        <div key={consulta.id} className="consulta-card-wrapper">
                            <article className="consulta-card-premium">
                                <header className={`card-premium-header ${consulta.estado === 'Pendiente' ? 'status-pending' : 'status-resolved'}`}>
                                    <span>
                                        <i className={`fa-solid ${consulta.tipoConsulta === 'Queja' ? 'fa-angry' : 'fa-clipboard-question'} me-2`}></i> 
                                        {consulta.tipoConsulta}
                                    </span>
                                    <span className="status-badge">{consulta.estado}</span>
                                </header>

                                <div className="card-premium-body">
                                    <h3 className="citizen-name">{consulta.nombreCompleto}</h3>
                                    <div className="citizen-meta">
                                        <span><i className="fa-solid fa-id-card"></i> {consulta.cedula}</span>
                                        <span><i className="fa-solid fa-envelope"></i> {consulta.correo}</span>
                                        {consulta.telefono && <span><i className="fa-solid fa-phone"></i> {consulta.telefono}</span>}
                                        <span><i className="fa-regular fa-calendar"></i> {new Date(consulta.fecha).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="message-content">
                                        <p className="message-text">"{consulta.descripcion}"</p>
                                    </div>

                                    {consulta.estado === 'Respondida' && consulta.respuesta && (
                                        <div className="response-box">
                                            <div className="response-header">
                                                <i className="fa-solid fa-reply"></i> Respuesta Oficial:
                                            </div>
                                            <p className="message-text mt-2">{consulta.respuesta}</p>
                                            <small className="text-muted d-block mt-2">
                                                <i className="fa-regular fa-clock me-1"></i> Finalizado el {new Date(consulta.fechaRespuesta).toLocaleString()}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                <footer className="card-premium-footer">
                                    {consulta.estado === 'Pendiente' ? (
                                        <button className="btn-premium-respond" onClick={() => handleResponder(consulta)}>
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

export default ControlConsultas;
