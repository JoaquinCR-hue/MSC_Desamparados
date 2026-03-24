import React, { useState, useEffect } from 'react';
import ServiceConsultas from '../services/ServiceConsultas';
import Swal from 'sweetalert2';

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
            background: '#1f2937', color: '#fff'
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
                    background: '#1f2937', color: '#fff'
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
        <div className="control-consultas-container text-white">
            <h2 className="mb-4 text-info border-bottom border-info pb-2"><i className="fa-solid fa-envelopes-bulk"></i> Bandeja de Atención Ciudadana</h2>
            
            <div className="alert alert-dark border-secondary text-light">
                <i className="fa-solid fa-circle-info text-info"></i> Aquí puede visualizar las quejas, sugerencias y consultas de los ciudadanos y darles una respuesta oficial.
            </div>

            {consultas.length === 0 ? (
                <div className="alert alert-secondary text-center">No hay consultas registradas en el sistema.</div>
            ) : (
                <div className="row">
                    {consultas.map(consulta => (
                        <div key={consulta.id} className="col-12 mb-4">
                            <div className={`card bg-dark border-${consulta.estado === 'Pendiente' ? 'warning' : 'success'} shadow-lg h-100`}>
                                <div className={`card-header text-dark fw-bold d-flex justify-content-between align-items-center bg-${consulta.estado === 'Pendiente' ? 'warning' : 'success'}`}>
                                    <span>
                                        <i className={`fa-solid ${consulta.tipoConsulta === 'Queja' ? 'fa-angry' : 'fa-clipboard-question'}`}></i> {consulta.tipoConsulta}
                                    </span>
                                    <span className="badge bg-dark border text-light">{consulta.estado}</span>
                                </div>
                                <div className="card-body text-light">
                                    <h5 className="card-title text-info">{consulta.nombreCompleto}</h5>
                                    <h6 className="card-subtitle mb-3 text-secondary"><i className="fa-solid fa-id-card"></i> {consulta.cedula} | <i className="fa-solid fa-envelope"></i> {consulta.correo} | <i className="fa-solid fa-phone"></i> {consulta.telefono || 'N/A'}</h6>
                                    
                                    <div className="p-3 bg-secondary bg-opacity-25 rounded mb-3">
                                        <p className="mb-0 text-white">"{consulta.descripcion}"</p>
                                    </div>
                                    <small className="text-muted d-block mb-3"><i className="fa-regular fa-calendar"></i> Recibida: {new Date(consulta.fecha).toLocaleString()}</small>

                                    {consulta.estado === 'Respondida' && consulta.respuesta && (
                                        <div className="p-3 bg-success bg-opacity-25 border border-success rounded">
                                            <strong><i className="fa-solid fa-reply"></i> Su Respuesta Oficial:</strong>
                                            <p className="mb-1 mt-2">{consulta.respuesta}</p>
                                            <small className="text-muted"><i className="fa-regular fa-clock"></i> Respondido el: {new Date(consulta.fechaRespuesta).toLocaleString()}</small>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer border-secondary bg-dark text-end">
                                    {consulta.estado === 'Pendiente' ? (
                                        <button className="btn btn-outline-info" onClick={() => handleResponder(consulta)}>
                                            <i className="fa-solid fa-reply"></i> Dar Respuesta
                                        </button>
                                    ) : (
                                        <button className="btn btn-outline-success disabled">
                                            <i className="fa-solid fa-check-double"></i> Atendido
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ControlConsultas;
