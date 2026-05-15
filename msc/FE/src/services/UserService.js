// Servicio de gestión de usuarios y autenticación — operaciones contra el backend Node.js
const BASE_URL = 'http://127.0.0.1:3000/api/v1';

/**
 * Inicia sesión de un usuario y obtiene el token JWT.
 */
async function login(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error al iniciar sesión');
  return result.data;
}

/**
 * Registra un nuevo usuario en el sistema.
 */
async function register(userData) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error al registrarse');
  return result.data;
}

/**
 * Verifica si el token sigue siendo válido.
 */
async function checkStatus(token) {
  const response = await fetch(`${BASE_URL}/auth/check-status`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Sesión expirada');
  return result;
}

/**
 * Obtiene la lista completa de usuarios (Solo Admin).
 */
async function getUsers() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const response = await fetch(`${BASE_URL}/users`, {
    headers: { 'Authorization': `Bearer ${user?.token}` }
  });
  const result = await response.json();
  return result.data;
}

/**
 * Crea un nuevo usuario (Solo Admin).
 */
async function createUser(userData) {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user?.token}`
    },
    body: JSON.stringify(userData),
  });
  const result = await response.json();
  return result.data;
}

/**
 * Actualiza un usuario (Solo Admin).
 */
async function updateUser(userData, id) {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user?.token}`
    },
    body: JSON.stringify(userData),
  });
  const result = await response.json();
  return result.data;
}

/**
 * Elimina un usuario (Solo Admin).
 */
async function deleteUser(id) {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${user?.token}` }
  });
  const result = await response.json();
  return result.data;
}

export default { 
  login, 
  register, 
  checkStatus, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
};
