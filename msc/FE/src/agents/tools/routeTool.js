/**
 * Tool para calcular rutas seguras
 * Utilizado por Police-IA para generar rutas alternativas según nivel de riesgo
 */

import { getNearbyIncidents, calculateRiskLevel } from './incidentsTool.js';

/**
 * Mapea modo de transporte a perfil de OSRM
 * @param {string} transport - Modo de transporte: "auto", "moto", "a_pie"
 * @returns {string} Perfil OSRM: "driving" o "foot"
 */
const getOSRMProfile = (transport) => {
  const profile = transport === 'a_pie' ? 'foot' : 'driving';
  return profile;
};

/**
 * Obtiene una ruta desde OSRM (Open Source Routing Machine)
 * @param {number} lat1 - Latitud inicial
 * @param {number} lng1 - Longitud inicial
 * @param {number} lat2 - Latitud final
 * @param {number} lng2 - Longitud final
 * @param {string} profile - Perfil OSRM ("driving" o "foot")
 * @param {Array} waypoints - Array adicional de waypoints [lat,lng]
 * @returns {Promise<Object>} Ruta con distancia, duración y coordenadas
 */
const getOSRMRoute = async (lat1, lng1, lat2, lng2, profile = 'driving', waypoints = []) => {
  try {
    // Construir URL con waypoints si existen
    let coordinatesStr = `${lng1},${lat1};${lng2},${lat2}`;
    
    if (waypoints.length > 0) {
      coordinatesStr = `${lng1},${lat1}`;
      waypoints.forEach(wp => {
        coordinatesStr += `;${wp[1]},${wp[0]}`;
      });
      coordinatesStr += `;${lng2},${lat2}`;
    }

    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinatesStr}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    
    return {
      distancia_km: Math.round((route.distance / 1000) * 100) / 100,
      duracion_min: Math.round(route.duration / 60),
      coordenadas_ruta: route.geometry.coordinates,
      pasos: route.steps || []
    };
  } catch (error) {
    console.error('Error getting OSRM route:', error);
    return null;
  }
};

/**
 * Obtiene puntos intermedios de una ruta
 * @param {Array} coordinates - Array de coordenadas [lng, lat]
 * @param {number} numPoints - Cantidad de puntos intermedios a retornar
 * @returns {Array} Array de puntos intermedios [lat, lng]
 */
const getIntermediatePoints = (coordinates, numPoints = 3) => {
  if (coordinates.length < 2) return [];

  const points = [];
  const step = Math.floor(coordinates.length / (numPoints + 1));
  
  for (let i = 1; i <= numPoints; i++) {
    const idx = i * step;
    if (idx < coordinates.length) {
      // Invertir lng,lat a lat,lng
      points.push([coordinates[idx][1], coordinates[idx][0]]);
    }
  }

  return points;
};

/**
 * Calcula punto desviado para ruta alternativa
 * @param {number} lat - Latitud del punto de riesgo
 * @param {number} lng - Longitud del punto de riesgo
 * @param {number} offsetMeters - Distancia en metros a desviarse (default: 150)
 * @returns {Object} Coordenadas desviadas {lat, lng}
 */
const getDeviatedWaypoint = (lat, lng, offsetMeters = 150) => {
  // Aproximación simple: 1 grado ≈ 111 km
  const latOffset = offsetMeters / 111000;
  const lngOffset = offsetMeters / (111000 * Math.cos(lat * Math.PI / 180));
  
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset
  };
};

/**
 * Calcula ruta segura desde origen a destino
 * @param {Object} params - Parámetros de la ruta
 * @param {number} params.origin_lat - Latitud de origen
 * @param {number} params.origin_lng - Longitud de origen
 * @param {number} params.dest_lat - Latitud de destino
 * @param {number} params.dest_lng - Longitud de destino
 * @param {string} params.transport - Modo de transporte: "auto", "moto", "a_pie"
 * @returns {Promise<Object>} Objeto con ruta segura y análisis de riesgo
 */
export const calculateSafeRoute = async ({
  origin_lat,
  origin_lng,
  dest_lat,
  dest_lng,
  transport = 'auto'
}) => {
  try {
    const profile = getOSRMProfile(transport);
    
    // Obtener ruta inicial
    const initialRoute = await getOSRMRoute(
      origin_lat,
      origin_lng,
      dest_lat,
      dest_lng,
      profile
    );

    if (!initialRoute) {
      return {
        success: false,
        error: 'No se pudo calcular la ruta'
      };
    }

    // Obtener puntos intermedios para análisis de riesgo
    const intermediatePoints = getIntermediatePoints(initialRoute.coordenadas_ruta, 3);
    
    let maxRiskLevel = 'bajo';
    let highRiskPoint = null;

    // Evaluar riesgo en puntos intermedios
    for (const point of intermediatePoints) {
      const incidents = await getNearbyIncidents({
        lat: point[0],
        lng: point[1],
        radius_meters: 300
      });

      const riskLevel = calculateRiskLevel(incidents);
      
      if (riskLevel === 'alto') {
        maxRiskLevel = 'alto';
        highRiskPoint = point;
        break; // Detener en el primer punto de alto riesgo
      } else if (riskLevel === 'moderado') {
        maxRiskLevel = 'moderado';
      }
    }

    // Si hay riesgo alto, calcular ruta alternativa
    let es_alternativa = false;
    let routeToReturn = initialRoute;
    let advertencia = '';

    if (maxRiskLevel === 'alto' && highRiskPoint) {
      es_alternativa = true;
      advertencia = '⚠️ Se detectó alto riesgo en la ruta inicial. Se calculó una ruta alternativa más segura.';
      
      // Generar waypoint desviado
      const waypoint = getDeviatedWaypoint(highRiskPoint[0], highRiskPoint[1], 150);
      
      const alternativeRoute = await getOSRMRoute(
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        profile,
        [[waypoint.lat, waypoint.lng]]
      );

      if (alternativeRoute) {
        routeToReturn = alternativeRoute;
      }
    } else if (maxRiskLevel === 'moderado') {
      advertencia = '⚠️ Se detectó riesgo moderado en la zona. Mantente alerta y utiliza rutas iluminadas.';
    }

    return {
      success: true,
      distancia_km: routeToReturn.distancia_km,
      duracion_min: routeToReturn.duracion_min,
      coordenadas_ruta: routeToReturn.coordenadas_ruta,
      pasos: routeToReturn.pasos,
      nivel_riesgo: maxRiskLevel,
      advertencia: advertencia || '✓ Ruta segura calculada exitosamente.',
      es_alternativa: es_alternativa
    };
  } catch (error) {
    console.error('Error calculating safe route:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
