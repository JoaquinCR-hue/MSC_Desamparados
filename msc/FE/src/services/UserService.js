// Servicio de gestión de usuarios — operaciones CRUD contra el backend
const BASE_URL = 'http://127.0.0.1:3000/api/v1/users';

/**
 * Obtiene la lista completa de usuarios registrados en el sistema.
 * @returns {Promise<Array>} Lista de usuarios
 */
async function getUsers() {
  try {
    const serverResponse = await fetch(BASE_URL);
    const result = await serverResponse.json();
    return result.data;
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
  }
}

/**
 * Crea un nuevo usuario en el sistema.
 * @param {Object} user - Datos del nuevo usuario
 * @returns {Promise<Object>} Usuario creado
 */
async function createUser(user) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al crear el usuario:', error);
  }
}

/**
 * Actualiza los datos de un usuario existente.
 * @param {Object} user - Datos actualizados del usuario
 * @param {string|number} id - ID del usuario a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
async function updateUser(user, id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
  }
}

/**
 * Elimina un usuario del sistema por su ID.
 * @param {string|number} id - ID del usuario a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function deleteUser(id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
  }
}

/**
 * Actualiza parcialmente los datos de un usuario (ej. recuperación de contraseña).
 * @param {string|number} id - ID del usuario
 * @param {Object} updatedData - Campos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
async function recoverPassword(id, updatedData) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT', // Changed PATCH to PUT since our controllers don't have PATCH explicitly mapped by default, or we can use PUT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error('No se pudo actualizar el usuario');
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error en recoverPassword:', error);
    throw error;
  }
}

export default { getUsers, createUser, updateUser, deleteUser, recoverPassword };
