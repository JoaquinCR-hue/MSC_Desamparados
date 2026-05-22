import React, { useState, useEffect, useRef } from 'react';
import ProfileService from '../services/ProfileService';
import Swal from 'sweetalert2';
import '../styles/Perfil.css';

const Perfil = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  // Ahora subimos la imagen al backend (el backend la envía a Cloudinary)

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await ProfileService.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || ''
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar el perfil',
        icon: 'error',
        customClass: { popup: 'premium-swal-popup' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await ProfileService.updateProfile(formData);
      
      // Actualizar los datos del usuario en sessionStorage para reflejar cambios globales
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.fullName = formData.fullName;
        user.email = formData.email;
        sessionStorage.setItem('user', JSON.stringify(user));
      }

      Swal.fire({
        title: 'Éxito',
        text: 'Perfil actualizado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'premium-swal-popup' }
      });
      loadProfile(); // Recargar datos frescos
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo actualizar el perfil',
        icon: 'error',
        customClass: { popup: 'premium-swal-popup' }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación básica
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Debe seleccionar una imagen', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      Swal.fire('Error', 'La imagen es muy grande (máximo 5MB)', 'error');
      return;
    }

    // Usamos la subida vía backend; no es necesario validar credenciales en el cliente

    try {
      setUploading(true);
      // Subir el archivo al backend, que lo sube a Cloudinary y devuelve la URL
      const savedUrl = await ProfileService.uploadProfilePhotoBackend(file);
      
      // Actualizar UI y sessionStorage
      setProfile(prev => ({ ...prev, profilePhoto: savedUrl }));
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.profilePhoto = savedUrl;
        sessionStorage.setItem('user', JSON.stringify(user));
      }

      Swal.fire({
        title: '¡Foto actualizada!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'premium-swal-popup' }
      });
    } catch (error) {
      Swal.fire({
        title: 'Error al subir foto',
        text: error.message,
        icon: 'error',
        customClass: { popup: 'premium-swal-popup' }
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pendiente': return 'status-pendiente';
      case 'En Proceso': return 'status-en-proceso';
      case 'Resuelto': return 'status-resuelto';
      default: return 'status-pendiente';
    }
  };

  if (loading) {
    return (
      <div className="perfil-container text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) return <div className="perfil-container text-center text-danger">Error al cargar el perfil.</div>;

  const isCiudadano = profile.role === 'ciudadano';
  
  const stats = {
    total: profile.reports?.length || 0,
    pendientes: profile.reports?.filter(r => r.estado === 'Pendiente').length || 0,
    resueltos: profile.reports?.filter(r => r.estado === 'Resuelto').length || 0,
  };

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.fullName) + "&background=random";

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>Mi Perfil</h1>
        <p>Gestiona tu información personal y visualiza tu actividad</p>
      </div>

      <div className="perfil-content">
        {/* Lado Izquierdo: Datos Personales */}
        <div className="perfil-card">
          <h2><i className="fa-solid fa-user"></i> Información Personal</h2>
          
          <div className="perfil-avatar-section mb-4">
            <div className="avatar-wrapper">
              <img 
                src={profile.profilePhoto || defaultAvatar} 
                alt="Foto de perfil" 
                className="avatar-img"
              />
              <button 
                className="avatar-upload-btn" 
                onClick={triggerFileInput}
                disabled={uploading}
                title="Cambiar foto de perfil"
              >
                {uploading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-camera"></i>}
              </button>
              <input 
                type="file" 
                className="avatar-input" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            <span className="perfil-role-badge">{profile.role}</span>
          </div>

          <form className="perfil-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input 
                type="text" 
                name="fullName"
                className="form-input-premium" 
                value={formData.fullName} 
                onChange={handleInputChange}
                disabled={!isCiudadano}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                name="email"
                className="form-input-premium" 
                value={formData.email} 
                onChange={handleInputChange}
                disabled={!isCiudadano}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Número de Teléfono</label>
              <input 
                type="tel" 
                name="phone"
                className="form-input-premium" 
                value={formData.phone} 
                onChange={handleInputChange}
                disabled={!isCiudadano}
              />
            </div>
            
            <div className="form-group">
              <label>Cédula (No editable)</label>
              <input 
                type="text" 
                className="form-input-premium" 
                value={profile.nationalId || ''} 
                disabled
              />
            </div>

            {isCiudadano ? (
              <button 
                type="submit" 
                className="btn-premium-save"
                disabled={saving}
              >
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
                ) : (
                  <><i className="fa-solid fa-floppy-disk"></i> Guardar Cambios</>
                )}
              </button>
            ) : (
              <div className="alert alert-info mt-3" style={{ fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-info me-2"></i>
                Como funcionario, no puedes editar tus datos personales desde aquí.
              </div>
            )}
          </form>
        </div>

        {/* Lado Derecho: Reportes (solo para ciudadanos tiene sentido mostrar los suyos, pero dejémoslo para todos por si un funcionario reporta algo como ciudadano) */}
        <div className="perfil-card">
          <h2><i className="fa-solid fa-file-shield"></i> Mis Reportes Realizados</h2>
          
          <div className="perfil-stats">
            <div className="stat-box">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-box" style={{borderColor: 'rgba(245, 158, 11, 0.3)'}}>
              <div className="stat-value" style={{color: '#f59e0b'}}>{stats.pendientes}</div>
              <div className="stat-label">Pendientes</div>
            </div>
            <div className="stat-box" style={{borderColor: 'rgba(16, 185, 129, 0.3)'}}>
              <div className="stat-value" style={{color: '#10b981'}}>{stats.resueltos}</div>
              <div className="stat-label">Resueltos</div>
            </div>
          </div>

          <div className="perfil-reports-list">
            {profile.reports && profile.reports.length > 0 ? (
              profile.reports.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map((report) => (
                <div key={report.id} className="perfil-report-item">
                  <div className="report-item-info">
                    <h4>{report.tipo}</h4>
                    <p>
                      <i className="fa-solid fa-location-dot"></i> {report.distrito}{report.barrio ? `, ${report.barrio}` : ''}
                    </p>
                  </div>
                  <div className="report-item-status">
                    <span className={`status-badge ${getStatusBadgeClass(report.estado)}`}>
                      {report.estado || 'Pendiente'}
                    </span>
                    <span className="report-date">
                      {new Date(report.fecha).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="fa-solid fa-box-open fs-1 mb-3 opacity-50"></i>
                <p>Aún no has realizado ningún reporte.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
