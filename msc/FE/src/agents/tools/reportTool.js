/**
 * Tool para crear reportes de incidentes
 * Utilizado por Police-IA para registrar incidentes reportados por usuarios
 */

/**
 * Crea un nuevo reporte de incidente
 * @param {Object} params - Datos del reporte
 * @param {string} params.tipo - Tipo de incidente
 * @param {string} params.descripcion - Descripción del incidente
 * @param {number} params.lat - Latitud del incidente
 * @param {number} params.lng - Longitud del incidente
 * @param {number} params.usuarioId - ID del usuario que reporta
 * @returns {Promise<Object>} Resultado del reporte
 */
export const createReport = async ({
  tipo,
  descripcion,
  lat,
  lng,
  usuarioId
}) => {
  // Validación de campos requeridos
  if (!tipo || tipo.trim() === '') {
    return {
      success: false,
      error: 'El tipo de incidente es requerido'
    };
  }

  if (!descripcion || descripcion.trim() === '') {
    return {
      success: false,
      error: 'La descripción del incidente es requerida'
    };
  }

  try {
    const response = await fetch(
      '/api/v1/police-ia/report',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tipo,
          descripcion,
          lat,
          lng,
          usuarioId
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `Error: ${response.status}`
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      reportId: data.reportId,
      mensaje: data.mensaje || 'Reporte creado exitosamente'
    };
  } catch (error) {
    console.error('Error creating report:', error);
    return {
      success: false,
      error: `Error al crear el reporte: ${error.message}`
    };
  }
};
