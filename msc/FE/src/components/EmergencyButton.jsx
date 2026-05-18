import React, { useState } from 'react';
import ReportService from '../services/ReportService';
import Swal from 'sweetalert2';
import '../styles/Navbar.css';

const EmergencyButton = ({ user }) => {
  const [isSending, setIsSending] = useState(false);

  const handleEmergency = () => {
    if (!user) {
      Swal.fire('Error', 'Debe iniciar sesión para enviar una alerta de emergencia.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Enviar alerta SOS?',
      text: 'Esto enviará tu ubicación actual a las autoridades inmediatamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, enviar SOS',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        sendSOS();
      }
    });
  };

  const sendSOS = () => {
    setIsSending(true);
    
    if (!navigator.geolocation) {
      setIsSending(false);
      Swal.fire('Error', 'Tu navegador no soporta geolocalización.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const emergencyData = {
            tipo: 'EMERGENCIA',
            descripcion: 'Alerta SOS enviada por el usuario.',
            fecha: new Date().toISOString(),
            id_creador: user.id,
            estado: 'Pendiente',
            lat: latitude,
            lng: longitude,
            distrito: 'Desamparados', // Valor por defecto o geocodificado
            barrio: 'Centro',
            direccion_exacta: '🚨 UBICACIÓN GPS RASTREADA EN TIEMPO REAL'
          };

          await ReportService.createReport(emergencyData);
          
          Swal.fire({
            title: '¡SOS Enviado!',
            text: 'Las autoridades han recibido tu alerta y ubicación.',
            icon: 'success',
            confirmButtonColor: '#ff0000',
            timer: 20000,
            timerProgressBar: true
          });
        } catch (error) {
          Swal.fire('Error', 'No se pudo enviar la alerta de emergencia.', 'error');
        } finally {
          setIsSending(false);
        }
      },
      (error) => {
        setIsSending(false);
        Swal.fire('Error de Ubicación', 'No pudimos obtener tu ubicación para enviar el SOS.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button 
      className={`report-button emergency-btn ${isSending ? 'sending' : ''}`} 
      onClick={handleEmergency}
      disabled={isSending}
      style={{ backgroundColor: '#e53935', marginLeft: '10px' }}
      title="Enviar SOS"
    >
      <i className={`fa-solid ${isSending ? 'fa-spinner fa-spin' : 'fa-truck-medical fa-beat-fade'}`}></i>
      {isSending ? ' Enviando...' : ' SOS'}
    </button>
  );
};

export default EmergencyButton;
