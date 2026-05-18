// Servicio de gestión de usuarios y autenticación — operaciones contra el backend Node.js
const BASE_URL = '/api/v1';

/**
 * Inicia sesión de un usuario y obtiene el token JWT en cookie.
 */
async function login(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include'
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error al iniciar sesión');
  return result.data;
}

/**
 * Registra un nuevo usuario en el sistema y obtiene cookie.
 */
async function register(userData) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include'
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error al registrarse');
  return result.data;
}

/**
 * Cierra la sesión (Limpia la cookie en el backend)
 */
async function logout() {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  const result = await response.json();
  return result;
}

/**
 * Verifica si el token (cookie) sigue siendo válido.
 */
async function checkStatus() {
  const response = await fetch(`${BASE_URL}/auth/check-status`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Sesión expirada');
  return result;
}

/**
 * Obtiene la lista completa de usuarios (Solo Admin), soporta filtros avanzados.
 */
async function getUsers(queryParams = '') {
  const response = await fetch(`${BASE_URL}/users${queryParams}`, {
    credentials: 'include'
  });
  const result = await response.json();
  return result.data;
}

/**
 * Crea un nuevo usuario (Solo Admin).
 */
async function createUser(userData) {
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include'
  });
  const result = await response.json();
  return result.data;
}

/**
 * Actualiza un usuario (Solo Admin).
 */
async function updateUser(userData, id) {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include'
  });
  const result = await response.json();
  return result.data;
}

/**
 * Elimina un usuario (Solo Admin).
 */
async function deleteUser(id) {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const result = await response.json();
  return result.data;
}

export default { 
  login, 
  register, 
  logout,
  checkStatus, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
};
