import axios from 'axios';

const BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Importante para enviar/recibir cookies en cada petición
});

// Interceptor de respuesta para manejar errores globales (ej: 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Solo expulsar si el token expiró o no existe (401)
      // Un 403 significa que el usuario SÍ está autenticado, pero no tiene permiso
      sessionStorage.removeItem('user');
      // Redirigir al login si no estamos ya en él
      if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
