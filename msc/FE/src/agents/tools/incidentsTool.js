/**
 * Tool para obtener incidentes cercanos a una ubicación
 * Utilizado por Police-IA para analizar zonas de riesgo
 */

/**
 * Obtiene incidentes cercanos a una coordenada GPS
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} params.lat - Latitud del punto de referencia
 * @param {number} params.lng - Longitud del punto de referencia
 * @param {number} params.radius_meters - Radio de búsqueda en metros (default: 500)
 * @returns {Promise<Array>} Array de incidentes cercanos
 */
export const getNearbyIncidents = async ({ lat, lng, radius_meters = 500 }) => {
  try {
    const response = await fetch(
      `/api/v1/police-ia/incidents-nearby?lat=${lat}&lng=${lng}&radius=${radius_meters}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      console.error(`Error obtaining nearby incidents: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching nearby incidents:', error);
    return [];
  }
};

/**
 * Calcula el nivel de riesgo basado en incidentes cercanos
 * @param {Array} incidents - Array de incidentes
 * @returns {string} Nivel de riesgo: "bajo", "moderado" o "alto"
 */
export const calculateRiskLevel = (incidents) => {
  if (!incidents || incidents.length === 0) {
    return 'bajo';
  }

  // Contabilizar por tipo de incidente
  let highSeverityCount = 0;
  let moderateSeverityCount = 0;

  incidents.forEach(incident => {
    // Tipos de alto riesgo
    if (incident.tipo && (
      incident.tipo.toLowerCase().includes('robo') ||
      incident.tipo.toLowerCase().includes('asalto') ||
      incident.tipo.toLowerCase().includes('violencia') ||
      incident.tipo.toLowerCase().includes('homicidio') ||
      incident.tipo.toLowerCase().includes('sos') ||
      incident.tipo.toLowerCase().includes('emergencia')
    )) {
      highSeverityCount++;
    } else if (incident.tipo && (
      incident.tipo.toLowerCase().includes('vandalism') ||
      incident.tipo.toLowerCase().includes('disturbio') ||
      incident.tipo.toLowerCase().includes('hurto')
    )) {
      moderateSeverityCount++;
    }
  });

  // Lógica de evaluación
  if (highSeverityCount >= 2 || incidents.length >= 5) {
    return 'alto';
  } else if (highSeverityCount === 1 || moderateSeverityCount >= 2) {
    return 'moderado';
  }

  return 'bajo';
};
