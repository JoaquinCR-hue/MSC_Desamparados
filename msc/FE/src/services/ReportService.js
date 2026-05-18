// Servicio de gestión de reportes de incidentes con autenticación JWT mediante cookies
const BASE_URL = '/api/v1/reports';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

/**
 * Obtiene todos los reportes (Requiere Auth), soporta filtros avanzados.
 */
async function getReports(queryParams = '') {
  try {
    const separator = queryParams.includes('?') ? '&' : '?';
    const url = queryParams ? `${BASE_URL}${queryParams}${separator}t=${Date.now()}` : `${BASE_URL}?t=${Date.now()}`;
    const response = await fetch(url, { 
      headers: getHeaders(),
      credentials: 'include' 
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudieron obtener los reportes`);
    }

    const result = await response.json();
    const reportData = Array.isArray(result) ? result : (result.data || []);

    return reportData.map((report) => {
      if (report.lat && report.lng) {
        const idStr = String(report.id);
        let hash = 0;
        for (let i = 0; i < idStr.length; i++) hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
        const offset1 = Math.abs(Math.sin(hash)) * 0.0004 - 0.0002;
        const offset2 = Math.abs(Math.cos(hash)) * 0.0004 - 0.0002;
        return { ...report, lat: parseFloat(report.lat) + offset1, lng: parseFloat(report.lng) + offset2 };
      }
      return report;
    });
  } catch (error) {
    console.error('Error al obtener los reportes:', error);
    return [];
  }
}

/**
 * Crea un nuevo reporte.
 */
async function createReport(report) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(report),
      credentials: 'include'
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Error del servidor al crear reporte');
    }
    return result.data;
  } catch (error) {
    console.error('Error al crear el reporte:', error);
    throw error;
  }
}

/**
 * Actualiza un reporte.
 */
async function updateReport(report, id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(report),
      credentials: 'include'
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al actualizar el reporte:', error);
  }
}

/**
 * Elimina un reporte.
 */
async function deleteReport(id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al eliminar el reporte:', error);
  }
}

export default { getReports, createReport, updateReport, deleteReport };
