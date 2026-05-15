// Servicio de gestión de reportes de incidentes con autenticación JWT
const BASE_URL = 'http://127.0.0.1:3000/api/v1/reports';

const getAuthHeaders = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.token}`
  };
};

/**
 * Obtiene todos los reportes (Requiere Auth).
 */
async function getReports() {
  try {
    const response = await fetch(BASE_URL, { headers: getAuthHeaders() });
    const result = await response.json();
    const reportData = result.data || [];

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
      headers: getAuthHeaders(),
      body: JSON.stringify(report),
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al crear el reporte:', error);
  }
}

/**
 * Actualiza un reporte.
 */
async function updateReport(report, id) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(report),
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
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error al eliminar el reporte:', error);
  }
}

export default { getReports, createReport, updateReport, deleteReport };
