import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import '../styles/ReportarIncidente.css';

const ReportarIncidente = () => {
  const [formData, setFormData] = useState({
    tipo: '',
    descripcion: '',
    ubicacion: '',
    fecha: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'Debes iniciar sesión para reportar un incidente.',
        icon: 'warning',
        confirmButtonText: 'Ir a Iniciar Sesión',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending data or save it
    alert('Incidente reportado con éxito. Gracias por colaborar.');
    setFormData({ tipo: '', descripcion: '', ubicacion: '', fecha: '' });
  };

  return (
    <div className="reportar-page-container">
      <Navbar />
      
      <main className="reportar-main-content">
        <div className="reportar-form-wrapper">
          <div className="reportar-header">
            <h2>Reportar Incidente</h2>
            <p>Ayúdanos a mantener la comunidad segura reportando incidentes o emergencias.</p>
          </div>

          <form onSubmit={handleSubmit} className="reportar-form">
            <div className="form-group-custom">
              <label htmlFor="tipo">Tipo de Incidente</label>
              <select 
                id="tipo" 
                name="tipo" 
                value={formData.tipo} 
                onChange={handleChange} 
                required
              >
                <option value="">Seleccione una opción</option>
                <option value="Robo o asalto">Robo o asalto</option>
                <option value="Accidente de tránsito">Accidente de tránsito</option>
                <option value="Vandalismo">Vandalismo</option>
                <option value="Actividad sospechosa">Actividad sospechosa</option>
                <option value="Emergencia médica">Emergencia médica</option>
                <option value="Incendio">Incendio</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group-custom">
              <label htmlFor="fecha">Fecha y Hora</label>
              <input 
                type="datetime-local" 
                id="fecha" 
                name="fecha" 
                value={formData.fecha} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group-custom">
              <label htmlFor="ubicacion">Ubicación / Dirección exacta</label>
              <input 
                type="text" 
                id="ubicacion" 
                name="ubicacion" 
                placeholder="Ej. Frente al parque central de Desamparados"
                value={formData.ubicacion} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group-custom">
              <label htmlFor="descripcion">Descripción detallada</label>
              <textarea 
                id="descripcion" 
                name="descripcion" 
                rows="5" 
                placeholder="Describa lo que sucedió con la mayor cantidad de detalles posible..."
                value={formData.descripcion} 
                onChange={handleChange} 
                required 
              ></textarea>
            </div>

            <button type="submit" className="submit-report-btn">
              <i className="fa-solid fa-paper-plane"></i> Enviar Reporte
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ReportarIncidente;
