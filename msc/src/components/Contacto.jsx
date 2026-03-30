import React, { useState } from 'react';
import '../styles/contacto.css';
import ServiceConsultas from '../services/ServiceConsultas';
import Swal from 'sweetalert2';
import axios from 'axios';

function Contacto() {
    const [formData, setFormData] = useState({
        cedula: '',
        nombreCompleto: '',
        correo: '',
        telefono: '',
        tipoConsulta: 'Queja',
        descripcion: ''
    });
    
    const [loadingNombre, setLoadingNombre] = useState(false);

    const handleCedulaBlur = async () => {
        if (!formData.cedula || formData.cedula.length < 9) return;
        
        setLoadingNombre(true);
        try {
            // Utilizamos el API de Hacienda de Costa Rica u otra pasarela pública para obtener el nombre
            // Nota: Aquí se usa una ruta genérica de APIs públicas conocidas para celdas de CR
            const response = await axios.get(`https://api.hacienda.go.cr/fe/ae?identificacion=${formData.cedula}`);
            if (response.data && response.data.nombre) {
                setFormData(prev => ({ ...prev, nombreCompleto: response.data.nombre }));
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'No encontrado',
                    text: 'No se encontraron datos para esta cédula. Por favor ingrese su nombre manualmente.',
                    background: '#1f2937', color: '#fff'
                });
            }
        } catch (error) {
            console.error("Error obteniendo datos de Hacienda", error);
            Swal.fire({
                icon: 'warning',
                title: 'Error de Conexión',
                text: 'No se pudo contactar el API de Hacienda, ingrese su nombre manualmente.',
                background: '#1f2937', color: '#fff'
            });
        }
        setLoadingNombre(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.cedula || !formData.nombreCompleto || !formData.correo || !formData.descripcion) {
            Swal.fire({ icon: 'error', title: 'Campos Incompletos', text: 'Por favor complete todos los datos requeridos.', background: '#1f2937', color: '#fff' });
            return;
        }

        const nuevaConsulta = {
            ...formData,
            fecha: new Date().toISOString(),
            estado: 'Pendiente',
            respuesta: ''
        };

        try {
            await ServiceConsultas.postConsulta(nuevaConsulta);
            Swal.fire({
                icon: 'success',
                title: 'Consulta Enviada',
                text: 'Su consulta ha sido enviada exitosamente. Se le notificará al correo cuando el administrador responda.',
                background: '#1f2937', color: '#fff'
            });
            // Reset form
            setFormData({
                cedula: '',
                nombreCompleto: '',
                correo: '',
                telefono: '',
                tipoConsulta: 'Queja',
                descripcion: ''
            });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar la consulta.', background: '#1f2937', color: '#fff' });
        }
    };

    return (
        <div className="contacto-container">
            <div className="contacto-header">
                <h1 className="contacto-title">Atención Ciudadana</h1>
                <p className="contacto-subtitle">Estamos aquí para escucharle. Contacte con la Municipalidad o Policía Municipal.</p>
            </div>

            <div className="contacto-grid">
                {/* Sección de Info de Contacto */}
                <div className="info-section">
                    <div className="info-card">
                        <div className="info-icon">
                            <i className="fa-solid fa-building-columns"></i>
                        </div>
                        <h3>Municipalidad de Desamparados</h3>
                        <ul className="info-list">
                            <li><i className="fa-solid fa-phone"></i> +506 2243-9300</li>
                            <li><i className="fa-solid fa-envelope"></i> info@desamparados.go.cr</li>
                            <li><i className="fa-solid fa-location-dot"></i> Costado N del Parque Central</li>
                        </ul>
                    </div>

                    <div className="info-card policia-card">
                        <div className="info-icon">
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <h3>Policía Municipal</h3>
                        <ul className="info-list">
                            <li><i className="fa-solid fa-phone"></i> +506 2243-9325</li>
                            <li><i className="fa-solid fa-truck-fast"></i> Unidad de Respuesta Rápida</li>
                        </ul>
                    </div>

                    <div className="social-card">
                        <h3>Nuestras Redes Oficiales</h3>
                        <div className="social-icons">
                            <a href="https://www.facebook.com/MuniDesamparados" target="_blank" rel="noopener noreferrer" className="social-icon facebook text-white fs-4"><i className="fa-brands fa-facebook-f"></i></a>
                            <a href="https://www.instagram.com/munidesampa/?locale=es&hl=en" target="_blank" rel="noopener noreferrer" className="social-icon instagram text-white fs-4"><i className="fa-brands fa-instagram"></i></a>
                            <a href="https://www.youtube.com/channel/UCkaBSMbgBnzEUuowilq8hKQ" target="_blank" rel="noopener noreferrer" className="social-icon youtube text-white fs-4"><i className="fa-brands fa-youtube"></i></a>
                        </div>
                    </div>
                </div>

                {/* Sección del Formulario */}
                <div className="form-section">
                    <form className="contacto-form" onSubmit={handleSubmit}>
                        <h2>Formulario de Consultas</h2>
                        <p className="form-help">Ingrese su consulta, sugerencia o queja. El administrador le dará seguimiento a la brevedad posible.</p>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Cédula de Identidad <span className="req">*</span></label>
                                <input 
                                    type="text" 
                                    name="cedula" 
                                    value={formData.cedula} 
                                    onChange={handleChange}
                                    onBlur={handleCedulaBlur}
                                    placeholder="Ej. 101230456"
                                    className="form-control premium-input"
                                />
                                <small className="text-secondary">Al salir del campo buscaremos su nombre.</small>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre Completo <span className="req">*</span></label>
                                <div className="input-with-loader">
                                    <input 
                                        type="text" 
                                        name="nombreCompleto" 
                                        value={formData.nombreCompleto} 
                                        onChange={handleChange}
                                        placeholder="Nombre Completo"
                                        className="form-control premium-input"
                                    />
                                    {loadingNombre && <span className="spinner-border spinner-border-sm text-info form-loader"></span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-row split-row">
                            <div className="form-group">
                                <label>Correo Electrónico <span className="req">*</span></label>
                                <input 
                                    type="email" 
                                    name="correo" 
                                    value={formData.correo} 
                                    onChange={handleChange}
                                    placeholder="correo@ejemplo.com"
                                    className="form-control premium-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input 
                                    type="text" 
                                    name="telefono" 
                                    value={formData.telefono} 
                                    onChange={handleChange}
                                    placeholder="8888-8888"
                                    className="form-control premium-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tipo de Consulta <span className="req">*</span></label>
                                <select 
                                    name="tipoConsulta" 
                                    value={formData.tipoConsulta} 
                                    onChange={handleChange}
                                    className="form-control premium-input form-select"
                                >
                                    <option value="Queja">Queja</option>
                                    <option value="Consulta">Ayuda con Soporte</option>
                                    <option value="Sugerencia">Sugerencia</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Descripción <span className="req">*</span></label>
                                <textarea 
                                    name="descripcion" 
                                    value={formData.descripcion} 
                                    onChange={handleChange}
                                    rows="4"
                                    className="form-control premium-input"
                                    placeholder="Detalle de su consulta o requerimiento..."
                                ></textarea>
                            </div>
                        </div>

                        <button type="submit" className="btn-submit-contacto">
                            <i className="fa-solid fa-paper-plane"></i> Enviar Consulta
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Contacto;