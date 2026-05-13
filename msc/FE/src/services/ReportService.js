// Servicio de gestión de reportes de incidentes
const BASE_URL = 'http://127.0.0.1:3001/reports';

/**
 * Obtiene todos los reportes registrados y aplica un offset
 * aleatorio a las coordenadas para evitar que los marcadores se sobrepongan en el mapa.
 * @returns {Promise<Array>} Lista de reportes con coordenadas ajustadas
 */
async function getReports() {
  try {
    const serverResponse = await fetch(BASE_URL);
    const reportData = await serverResponse.json();

    // Agrega un pequeño desplazamiento pseudo-aleatorio basado en el ID
    // para evitar que los marcadores se apilen exactamente en el mismo punto
    const reportsWithOffset = reportData.map((report) => {
      if (report.lat && report.lng) {
        const idStr = String(report.id || Math.random());
        let hash = 0;
        for (let i = 0; i < idStr.length; i++) {
          hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
          hash |= 0;
        }
        const offset1 = Math.abs(Math.sin(hash)) * 0.0004 - 0.0002;
        const offset2 = Math.abs(Math.cos(hash)) * 0.0004 - 0.0002;
        return {
          ...report,
          lat: parseFloat(report.lat) + offset1,
          lng: parseFloat(report.lng) + offset2,
        };
      }
      return report;
    });

    return reportsWithOffset;
  } catch (error) {
    console.error('Error al obtener los reportes:', error);
  }
}

/**
 * Crea un nuevo reporte de incidente en el sistema.
 * @param {Object} report - Datos del reporte a crear
 * @returns {Promise<Object>} Reporte creado
 */
async function createReport(report) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    const reportData = await response.json();
    return reportData;
  } catch (error) {
    console.error('Error al crear el reporte:', error);
  }
}

/**
 * Actualiza los datos de un reporte existente.
 * @param {Object} report - Datos actualizados del reporte
 * @param {string|number} id - ID del reporte a actualizar
 * @returns {Promise<Object>} Reporte actualizado
 */
async function updateReport(report, id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    const reportData = await response.json();
    return reportData;
  } catch (error) {
    console.error('Error al actualizar el reporte:', error);
  }
}

/**
 * Elimina un reporte del sistema por su ID.
 * @param {string|number} id - ID del reporte a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function deleteReport(id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    const reportData = await response.json();
    return reportData;
  } catch (error) {
    console.error('Error al eliminar el reporte:', error);
  }
}

export default { getReports, createReport, updateReport, deleteReport };
