// Servicio de gestión de consultas ciudadanas — usa axios para mayor consistencia
import axios from 'axios';

// URL base del endpoint de consultas
const CONSULTS_URL = '/api/v1/consults';

// Configurar Axios para enviar cookies por defecto
axios.defaults.withCredentials = true;

const ConsultService = {
  /**
   * Obtiene todas las consultas registradas en el sistema, con soporte para filtros.
   * @param {string} queryParams - Parámetros de búsqueda opcionales
   * @returns {Promise<Array>} Lista de consultas
   */
  getConsults: async (queryParams = '') => {
    try {
      const response = await axios.get(`${CONSULTS_URL}${queryParams}`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error al obtener las consultas:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva consulta ciudadana.
   * @param {Object} consult - Datos de la consulta a registrar
   * @returns {Promise<Object>} Consulta creada
   */
  createConsult: async (consult) => {
    try {
      const response = await axios.post(CONSULTS_URL, consult);
      return response.data.data;
    } catch (error) {
      console.error('Error al publicar la consulta:', error);
      throw error;
    }
  },

  /**
   * Actualiza una consulta existente (ej. para registrar una respuesta oficial).
   * @param {Object} consult - Datos actualizados de la consulta
   * @param {string|number} id - ID de la consulta a actualizar
   * @returns {Promise<Object>} Consulta actualizada
   */
  updateConsult: async (consult, id) => {
    try {
      const response = await axios.put(`${CONSULTS_URL}/${id}`, consult);
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar la consulta:', error);
      throw error;
    }
  },
};

export default ConsultService;
