// Servicio de gestión de unidades de patrullaje policial con JWT mediante cookies
const BASE_URL = '/api/v1/patrols';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

/**
 * Obtiene todas las unidades de patrullaje (Requiere Auth).
 */
async function getPatrols() {
  try {
    const response = await fetch(BASE_URL, { 
      headers: getHeaders(),
      credentials: 'include'
    });
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error al obtener las unidades de patrullaje:', error);
    return [];
  }
}

/**
 * Registra una nueva unidad.
 */
async function createPatrol(patrol) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patrol),
      credentials: 'include'
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al registrar la unidad de patrullaje:', error);
  }
}

/**
 * Actualiza una unidad.
 */
async function updatePatrol(patrol, id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(patrol),
      credentials: 'include'
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al actualizar la unidad de patrullaje:', error);
  }
}

/**
 * Elimina una unidad.
 */
async function deletePatrol(id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al retirar la unidad de patrullaje:', error);
  }
}

export default { getPatrols, createPatrol, updatePatrol, deletePatrol };
