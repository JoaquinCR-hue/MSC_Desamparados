import api from './api';

// Servicio de gestión de reportes de incidentes con autenticación JWT mediante cookies

/**
 * Obtiene todos los reportes (Requiere Auth), soporta filtros avanzados y paginación.
 */
async function getReports(params = {}) {
  try {
    const config = typeof params === 'string' ? { url: `/reports${params}` } : { url: '/reports', params: { ...params, t: Date.now() } };
    
    // Si params era un string, añadimos el timestamp manualmente
    if (typeof params === 'string') {
        const separator = config.url.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}t=${Date.now()}`;
    }

    const response = await api.get(config.url, { params: config.params });
    
    const result = response.data;
    const reportData = Array.isArray(result) ? result : (result.data || []);

    const mappedData = reportData.map((report) => {
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

    const hasPagination = typeof params === 'object' && params !== null && (params.page !== undefined || params.limit !== undefined);
    return hasPagination ? { data: mappedData, meta: result.meta } : mappedData;
  } catch (error) {
    console.error('Error al obtener los reportes:', error);
    const hasPagination = typeof params === 'object' && params !== null && (params.page !== undefined || params.limit !== undefined);
    if (!hasPagination) return [];
    throw new Error(error.response?.data?.message || 'Error al obtener reportes');
  }
}

/**
 * Crea un nuevo reporte.
 */
async function createReport(report) {
  try {
    const response = await api.post('/reports', report);
    return response.data.data;
  } catch (error) {
    console.error('Error al crear el reporte:', error);
    throw new Error(error.response?.data?.message || 'Error del servidor al crear reporte');
  }
}

/**
 * Actualiza un reporte.
 */
async function updateReport(report, id) {
  try {
    const response = await api.put(`/reports/${id}`, report);
    return response.data.data;
  } catch (error) {
    console.error('Error al actualizar el reporte:', error);
    throw new Error(error.response?.data?.message || 'Error al actualizar reporte');
  }
}

/**
 * Elimina un reporte.
 */
async function deleteReport(id) {
  try {
    const response = await api.delete(`/reports/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al eliminar el reporte:', error);
    throw new Error(error.response?.data?.message || 'Error al eliminar reporte');
  }
}

/**
 * Sube una imagen de evidencia para un reporte.
 */
async function uploadEvidence(file) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.imageUrl;
  } catch (error) {
    console.error('Error al subir evidencia:', error);
    throw new Error(error.response?.data?.message || 'Error al subir evidencia');
  }
}

export default { getReports, createReport, updateReport, deleteReport, uploadEvidence };
