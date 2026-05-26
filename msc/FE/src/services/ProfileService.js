import api from './api';

// Servicio de gestión del perfil de usuario y subida de imágenes

/**
 * Obtiene el perfil del usuario autenticado actual.
 */
async function getProfile() {
  try {
    const response = await api.get('/profile');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener el perfil');
  }
}

/**
 * Actualiza los datos del perfil (solo ciudadanos).
 */
async function updateProfile(data) {
  try {
    const response = await api.put('/profile', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al actualizar el perfil');
  }
}

/**
 * Guarda la URL de la foto de perfil en el backend.
 */
async function updateProfilePhoto(photoUrl) {
  try {
    const response = await api.put('/profile/photo', { profilePhoto: photoUrl });
    return response.data.photoUrl;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al actualizar la foto de perfil');
  }
}

/**
 * Sube una imagen directamente a Cloudinary sin pasar por nuestro backend.
 * @param {File} file - El archivo de imagen a subir
 * @param {string} cloudName - El nombre de la nube de Cloudinary
 * @param {string} uploadPreset - El upload preset sin firma (unsigned) de Cloudinary
 * @returns {Promise<string>} - La URL segura (https) de la imagen subida
 */
async function uploadToCloudinary(file, cloudName, uploadPreset) {
  if (!cloudName || !uploadPreset) {
    throw new Error('Faltan credenciales de Cloudinary (cloud_name o upload_preset)');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al subir la imagen a Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    throw new Error(`Error en la subida a Cloudinary: ${error.message}`);
  }
}

/**
 * Sube la imagen al backend, que a su vez la sube a Cloudinary y actualiza el perfil.
 * @param {File} file
 * @returns {Promise<string>} - URL de la imagen subida
 */
async function uploadProfilePhotoBackend(file) {
  if (!file) throw new Error('Archivo no proporcionado');
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await api.post('/profile/photo/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.photoUrl;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al subir la foto al backend');
  }
}

/**
 * Cambia la contraseña del usuario.
 */
async function changePassword(currentPassword, newPassword) {
  try {
    const response = await api.put('/profile/password', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al cambiar la contraseña');
  }
}

export default {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  uploadToCloudinary,
  uploadProfilePhotoBackend,
  changePassword
};

