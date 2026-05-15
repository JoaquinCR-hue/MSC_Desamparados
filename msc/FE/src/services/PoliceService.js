// Servicio de gestión de unidades de patrullaje policial
const BASE_URL = 'http://127.0.0.1:3000/api/v1/patrols';

/**
 * Obtiene todas las unidades de patrullaje registradas.
 * @returns {Promise<Array>} Lista de unidades de patrulla
 */
async function getPatrols() {
  try {
    const serverResponse = await fetch(BASE_URL);
    const patrolData = await serverResponse.json();
    return patrolData;
  } catch (error) {
    console.error('Error al obtener las unidades de patrullaje:', error);
  }
}

/**
 * Registra una nueva unidad de patrullaje en el sistema.
 * @param {Object} patrol - Datos de la nueva unidad
 * @returns {Promise<Object>} Unidad creada
 */
async function createPatrol(patrol) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patrol),
    });
    const patrolData = await response.json();
    return patrolData;
  } catch (error) {
    console.error('Error al registrar la unidad de patrullaje:', error);
  }
}

/**
 * Actualiza los datos de una unidad de patrullaje existente.
 * @param {Object} patrol - Datos actualizados de la unidad
 * @param {string|number} id - ID de la unidad a actualizar
 * @returns {Promise<Object>} Unidad actualizada
 */
async function updatePatrol(patrol, id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patrol),
    });
    const patrolData = await response.json();
    return patrolData;
  } catch (error) {
    console.error('Error al actualizar la unidad de patrullaje:', error);
  }
}

/**
 * Elimina (retira) una unidad de patrullaje del sistema.
 * @param {string|number} id - ID de la unidad a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function deletePatrol(id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    const patrolData = await response.json();
    return patrolData;
  } catch (error) {
    console.error('Error al retirar la unidad de patrullaje:', error);
  }
}

export default { getPatrols, createPatrol, updatePatrol, deletePatrol };
