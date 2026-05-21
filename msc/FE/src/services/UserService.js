import api from './api';

// Servicio de gestión de usuarios y autenticación — operaciones contra el backend Node.js

/**
 * Inicia sesión de un usuario y obtiene el token JWT en cookie.
 */
async function login(credentials) {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
  }
}

/**
 * Registra un nuevo usuario en el sistema y obtiene cookie.
 */
async function register(userData) {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al registrarse');
  }
}

/**
 * Cierra la sesión (Limpia la cookie en el backend)
 */
async function logout() {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al cerrar sesión');
  }
}

/**
 * Verifica si el token (cookie) sigue siendo válido.
 */
async function checkStatus() {
  try {
    const response = await api.get('/auth/check-status');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Sesión expirada');
  }
}

/**
 * Obtiene la lista completa de usuarios (Solo Admin), soporta filtros avanzados y paginación.
 * @param {Object} params - Objeto con parámetros (ej: { search, role, page, limit })
 */
async function getUsers(params = {}) {
  try {
    // Si params es un string (código legado), lo pasamos tal cual, de lo contrario usamos objeto
    const config = typeof params === 'string' ? { url: `/users${params}` } : { url: '/users', params };
    const response = await api.get(config.url, { params: config.params });
    const result = response.data;
    const userData = Array.isArray(result) ? result : (result.data || []);

    const hasPagination = typeof params === 'object' && params !== null && (params.page !== undefined || params.limit !== undefined);
    return hasPagination ? result : userData;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
  }
}

/**
 * Crea un nuevo usuario (Solo Admin).
 */
async function createUser(userData) {
  try {
    const response = await api.post('/users', userData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al crear usuario');
  }
}

/**
 * Actualiza un usuario (Solo Admin).
 */
async function updateUser(userData, id) {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
  }
}

/**
 * Elimina un usuario (Solo Admin).
 */
async function deleteUser(id) {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al eliminar usuario');
  }
}

/**
 * Solicita la recuperación de contraseña.
 */
async function recoverPassword(email) {
  try {
    const response = await api.post('/auth/recover-password', { email });
    return response.data.newPassword;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al recuperar contraseña');
  }
}

export default { 
  login, 
  register, 
  logout,
  checkStatus, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  recoverPassword
};
