// =====================================================
// RouteService.js
// Servicio de cálculo de rutas y análisis de riesgo
// =====================================================

// NOTA: Sustituye la API key por tu clave de openrouteservice.org cuando la tengas
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE2ZmRjZDdkMzBjOTRjMzVhYmQ2ZTQ0ZDYyZTk2MTA3IiwiaCI6Im11cm11cjY0In0=';

/**
 * Calcula la ruta entre dos puntos usando OpenRouteService.
 * Si no hay API key, devuelve una ruta simulada (línea recta).
 * @param {[number, number]} origin   [lat, lng]
 * @param {[number, number]} destination [lat, lng]
 * @param {boolean} isEmergency       Si es true, prioriza la distancia más corta
 * @param {string} mode               Modo de transporte: 'Auto', 'Peatón', 'Motocicleta'
 */
async function calculateRoute(origin, destination, isEmergency = false, mode = 'Auto') {
  // Modo simulado si no hay API key configurada
  if (!ORS_API_KEY || ORS_API_KEY === 'YOUR_ORS_API_KEY') {
    return _simulatedRoute(origin, destination);
  }

  try {
    let profile = 'driving-car';
    let durationMultiplier = 1.0;

    // Seleccionar el perfil de transporte según el modo
    if (mode === 'Peatón') {
      profile = 'foot-walking';
    } else if (mode === 'Motocicleta') {
      profile = 'driving-car';
      durationMultiplier = 0.70; // La moto evade el tráfico (~30% más rápido)
    }

    // Las patrullas con sirena tienen prioridad de emergencia (15% más rápido)
    if (isEmergency) {
      durationMultiplier *= 0.85;
    }

    const url = `https://api.openrouteservice.org/v2/directions/${profile}`;

    const body = {
      coordinates: [
        [origin[1], origin[0]],      // ORS usa formato [lng, lat]
        [destination[1], destination[0]],
      ],
    };

    // Si es emergencia (patrullas), buscar la ruta más corta (callejones/atajos)
    if (isEmergency) {
      body.preference = 'shortest';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: ORS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('ORS error ' + response.status);

    const data = await response.json();
    const segment = data.routes[0];
    const distanceKm = (segment.summary.distance / 1000).toFixed(2);
    // Aplicar multiplicador realista según el modo de transporte
    const durationMin = Math.round((segment.summary.duration / 60) * durationMultiplier);

    // Decodificar la geometría encoded polyline a coordenadas [lat, lng][]
    const coordinates = decodePolyline(segment.geometry);

    return { coordinates, distanceKm, durationMin, simulated: false };
  } catch (error) {
    console.warn('OpenRouteService no disponible, usando ruta simulada:', error);
    return _simulatedRoute(origin, destination);
  }
}

/**
 * Genera una ruta simulada con puntos intermedios entre origen y destino.
 * Se usa como respaldo cuando la API externa no está disponible.
 */
function _simulatedRoute(origin, destination) {
  const steps = 10;
  const coordinates = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    coordinates.push([
      origin[0] + (destination[0] - origin[0]) * t,
      origin[1] + (destination[1] - origin[1]) * t,
    ]);
  }
  const dLat = destination[0] - origin[0];
  const dLng = destination[1] - origin[1];
  const distanceKm = (Math.sqrt(dLat * dLat + dLng * dLng) * 111).toFixed(2);
  const durationMin = Math.round(distanceKm * 2);
  return { coordinates, distanceKm, durationMin, simulated: true };
}

/**
 * Calcula qué reportes están dentro del radio de búsqueda de cualquier punto de la ruta.
 * @param {[number,number][]} coordinates  Lista de puntos de la ruta
 * @param {object[]} reports               Array de reportes del backend
 * @param {number} radiusMeters            Radio de búsqueda en metros (default 300)
 */
function analyzeRouteRisk(coordinates, reports, radiusMeters = 300) {
  const radiusDegrees = radiusMeters / 111000;
  const nearbyIncidents = [];
  const addedIds = new Set();

  for (const report of reports) {
    if (!report.lat || !report.lng) continue;
    if (addedIds.has(report.id)) continue;

    for (const [rLat, rLng] of coordinates) {
      const dLat = report.lat - rLat;
      const dLng = report.lng - rLng;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distance <= radiusDegrees) {
        nearbyIncidents.push({
          ...report,
          distanceMeters: Math.round(distance * 111000),
        });
        addedIds.add(report.id);
        break;
      }
    }
  }

  // Calcular el nivel de riesgo global según la cantidad de incidentes cercanos
  const total = nearbyIncidents.length;
  let riskLevel, riskColor, riskIcon;
  if (total === 0) {
    riskLevel = 'Bajo'; riskColor = '#4CAF50'; riskIcon = 'fa-shield-halved';
  } else if (total <= 2) {
    riskLevel = 'Moderado'; riskColor = '#FFD600'; riskIcon = 'fa-triangle-exclamation';
  } else if (total <= 5) {
    riskLevel = 'Alto'; riskColor = '#FF9100'; riskIcon = 'fa-circle-exclamation';
  } else {
    riskLevel = 'Crítico'; riskColor = '#FF1744'; riskIcon = 'fa-skull-crossbones';
  }

  return { nearbyIncidents, riskLevel, riskColor, riskIcon, total };
}

/**
 * Genera recomendaciones de seguridad personalizadas según los incidentes cercanos.
 * @param {object[]} nearbyIncidents Lista de reportes cercanos a la ruta
 * @param {string} riskLevel         Nivel calculado: Bajo/Moderado/Alto/Crítico
 */
function generateRecommendations(nearbyIncidents, riskLevel) {
  const recommendations = [];
  const types = nearbyIncidents.map((i) => (i.tipo || '').toLowerCase());

  const contains = (keyword) => types.some((t) => t.includes(keyword));

  // Recomendaciones base según el nivel de riesgo general
  if (riskLevel === 'Bajo') {
    recommendations.push({ icono: 'fa-circle-check', color: '#4CAF50', texto: 'Ruta con bajo historial de incidentes. Condiciones favorables para el traslado.' });
  }

  if (riskLevel === 'Moderado' || riskLevel === 'Alto' || riskLevel === 'Crítico') {
    recommendations.push({ icono: 'fa-clock', color: '#FFD600', texto: 'Se recomienda realizar el trayecto en horario diurno (6am–6pm) para mayor seguridad.' });
    recommendations.push({ icono: 'fa-user-group', color: '#FFD600', texto: 'Evite transitar solo/a por esta ruta. Prefiera compañía o grupos.' });
  }

  if (riskLevel === 'Alto' || riskLevel === 'Crítico') {
    recommendations.push({ icono: 'fa-route', color: '#FF9100', texto: 'Considere una ruta alternativa para evitar las zonas con mayor concentración de incidentes.' });
    recommendations.push({ icono: 'fa-mobile-screen', color: '#FF9100', texto: 'Mantenga su teléfono cargado y comparta su ubicación en tiempo real con un familiar.' });
  }

  if (riskLevel === 'Crítico') {
    recommendations.push({ icono: 'fa-car-side', color: '#FF1744', texto: 'Zona crítica: se recomienda usar medios de transporte formal (bus, taxi o Uber) en lugar de caminar.' });
    recommendations.push({ icono: 'fa-phone', color: '#FF1744', texto: 'En caso de emergencia, marque el 9-1-1. Lleve anotados los números de emergencia.' });
  }

  // Recomendaciones específicas por tipo de incidente detectado
  if (contains('robo') || contains('hurto') || contains('asalto')) {
    recommendations.push({ icono: 'fa-wallet', color: '#FF9100', texto: 'Historial de robos en la zona: evite mostrar objetos de valor (teléfono, joyería, efectivo).' });
  }
  if (contains('accidente') || contains('vial') || contains('colisión') || contains('atropell')) {
    recommendations.push({ icono: 'fa-car-burst', color: '#FF9100', texto: 'Zona con accidentes viales registrados: use el cinturón de seguridad y respete los límites de velocidad.' });
  }
  if (contains('violencia') || contains('agresión') || contains('pelea')) {
    recommendations.push({ icono: 'fa-person-running', color: '#FF1744', texto: 'Reportes de violencia en la zona. En caso de sentirse en peligro, aléjese del lugar y busque un sitio público.' });
  }
  if (contains('droga') || contains('narcot') || contains('sustancia')) {
    recommendations.push({ icono: 'fa-eye-slash', color: '#FF9100', texto: 'Área con reportes de actividad relacionada a sustancias. Evite acercarse a grupos desconocidos.' });
  }

  // Recomendación universal al final
  recommendations.push({ icono: 'fa-shield', color: '#64B5F6', texto: 'Siempre informe a alguien de confianza su ruta y hora estimada de llegada.' });

  return recommendations;
}

/**
 * Calcula 3 rutas alternativas entre origen y destino, analizando el riesgo de cada una.
 * @param {[number, number]} origin
 * @param {[number, number]} destination
 * @param {string} mode
 * @param {object[]} reports
 */
async function calculateAlternativeRoutes(origin, destination, mode = 'Auto', reports = []) {
  // 1. Obtener la ruta base (Rápida)
  const baseRoute = await calculateRoute(origin, destination, false, mode);
  
  // Generar coordenadas alternativas usando curvas
  const coordsBase = baseRoute.coordinates;
  const numPoints = coordsBase.length;
  
  if (numPoints < 2) {
    throw new Error('No se pudieron obtener suficientes puntos de ruta.');
  }

  // Encontrar el vector perpendicular de Origen a Destino
  const latStart = origin[0];
  const lngStart = origin[1];
  const latEnd = destination[0];
  const lngEnd = destination[1];
  
  const dLat = latEnd - latStart;
  const dLng = lngEnd - lngStart;
  
  // Vector perpendicular normalizado [perpLat, perpLng]
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 0.001;
  const perpLat = -dLng / len;
  const perpLng = dLat / len;

  // Calcular el centroide de los reportes en la zona general
  let avgReportLat = 0;
  let avgReportLng = 0;
  let reportsInArea = 0;
  
  for (const rep of reports) {
    if (!rep.lat || !rep.lng) continue;
    const distToStart = Math.sqrt((rep.lat - latStart)**2 + (rep.lng - lngStart)**2);
    if (distToStart < 0.08) { // Filtramos reportes a menos de ~8km de la zona
      avgReportLat += rep.lat;
      avgReportLng += rep.lng;
      reportsInArea++;
    }
  }

  let curveDirection = 1; // 1 = izquierda, -1 = derecha de la trayectoria
  if (reportsInArea > 0) {
    avgReportLat /= reportsInArea;
    avgReportLng /= reportsInArea;
    
    // Punto medio del trayecto
    const midLat = (latStart + latEnd) / 2;
    const midLng = (lngStart + lngEnd) / 2;
    
    // Determinar si los incidentes están predominantemente en el lado positivo o negativo del perpendicular
    const side = (avgReportLat - midLat) * perpLat + (avgReportLng - midLng) * perpLng;
    if (side > 0) {
      // Los incidentes están en el lado positivo, curveamos hacia el lado negativo
      curveDirection = -1;
    } else {
      curveDirection = 1;
    }
  }

  // Generar Ruta 1: Rápida (Directa) - Usar coords base
  const coordsFast = coordsBase.map(p => [...p]);
  
  // Generar Ruta 2: Segura (Desvío en sentido contrario a los crímenes)
  // Usamos una desviación en arco senoidal
  const offsetSafe = curveDirection * 0.006 * (mode === 'Peatón' ? 0.65 : 1); // Desviación en grados
  const coordsSafe = coordsBase.map((p, idx) => {
    const factor = Math.sin((Math.PI * idx) / (numPoints - 1));
    return [
      p[0] + perpLat * offsetSafe * factor,
      p[1] + perpLng * offsetSafe * factor
    ];
  });

  // Generar Ruta 3: Alternativa (Desvío en el sentido opuesto al desvío seguro)
  const offsetAlt = -curveDirection * 0.008 * (mode === 'Peatón' ? 0.65 : 1); // Desviación mayor
  const coordsAlt = coordsBase.map((p, idx) => {
    const factor = Math.sin((Math.PI * idx) / (numPoints - 1));
    return [
      p[0] + perpLat * offsetAlt * factor,
      p[1] + perpLng * offsetAlt * factor
    ];
  });

  // Analizar riesgos para cada una
  const riskFast = analyzeRouteRisk(coordsFast, reports, 250);
  const riskSafe = analyzeRouteRisk(coordsSafe, reports, 250);
  const riskAlt = analyzeRouteRisk(coordsAlt, reports, 250);

  // Crear los objetos de ruta
  const distBase = parseFloat(baseRoute.distanceKm);
  const timeBase = parseInt(baseRoute.durationMin);

  return [
    {
      id: 'route_fast',
      name: 'Ruta Rápida',
      tag: 'Más Directa',
      coordinates: coordsFast,
      distanceKm: distBase.toFixed(2),
      durationMin: timeBase,
      riskLevel: riskFast.riskLevel,
      riskColor: riskFast.riskColor,
      riskIcon: riskFast.riskIcon,
      totalIncidents: riskFast.total,
      nearbyIncidents: riskFast.nearbyIncidents,
      simulated: baseRoute.simulated
    },
    {
      id: 'route_safe',
      name: 'Ruta Segura',
      tag: 'Mayor Seguridad',
      coordinates: coordsSafe,
      distanceKm: (distBase * 1.15).toFixed(2),
      durationMin: Math.round(timeBase * 1.2),
      riskLevel: riskSafe.riskLevel,
      riskColor: riskSafe.riskColor,
      riskIcon: riskSafe.riskIcon,
      totalIncidents: riskSafe.total,
      nearbyIncidents: riskSafe.nearbyIncidents,
      simulated: baseRoute.simulated
    },
    {
      id: 'route_alt',
      name: 'Ruta Alternativa',
      tag: 'Avenidas Principales',
      coordinates: coordsAlt,
      distanceKm: (distBase * 1.28).toFixed(2),
      durationMin: Math.round(timeBase * 1.3),
      riskLevel: riskAlt.riskLevel,
      riskColor: riskAlt.riskColor,
      riskIcon: riskAlt.riskIcon,
      totalIncidents: riskAlt.total,
      nearbyIncidents: riskAlt.nearbyIncidents,
      simulated: baseRoute.simulated
    }
  ];
}

// ─── Utilidad: decodifica polyline en formato Google/ORS a coordenadas ─────────
function decodePolyline(encoded) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

/**
 * Busca sugerencias de dirección usando ORS Geocoding (Pelias).
 * Si falla, usa Nominatim (OpenStreetMap) como respaldo gratuito.
 * @param {string} text  Texto ingresado por el usuario
 * @returns {object[]}   Array de sugerencias { label, lat, lng }
 */
async function searchAddress(text) {
  if (!text || text.trim().length < 3) return [];

  // ── Intento 1: ORS Geocoding API ─────────────────────────────────────────
  if (ORS_API_KEY && ORS_API_KEY !== 'YOUR_ORS_API_KEY') {
    try {
      const url = new URL('https://api.openrouteservice.org/geocode/search');
      url.searchParams.set('api_key', ORS_API_KEY);
      url.searchParams.set('text', text);
      url.searchParams.set('boundary.country', 'CR');
      url.searchParams.set('focus.point.lat', '9.892');
      url.searchParams.set('focus.point.lon', '-84.05');
      url.searchParams.set('size', '6');

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        return (data.features || []).map((f) => ({
          label: f.properties.label,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }));
      }
    } catch (e) {
      console.warn('ORS geocoding falló, usando Nominatim como respaldo:', e);
    }
  }

  // ── Respaldo: Nominatim (OpenStreetMap, completamente gratuito) ───────────
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${text}, Costa Rica`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('countrycodes', 'cr');
    url.searchParams.set('viewbox', '-84.2,9.7,-83.9,10.1');
    url.searchParams.set('bounded', '0');

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'es', 'User-Agent': 'MSC-Desamparados-App' },
    });
    if (!res.ok) throw new Error('Nominatim error ' + res.status);
    const data = await res.json();
    return data.map((item) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (e) {
    console.error('Error en geocodificación:', e);
    return [];
  }
}

/**
 * Calcula la distancia en metros entre dos puntos geográficos usando la fórmula de Haversine.
 * @param {[number, number]} p1 Coordenada 1 [lat, lng]
 * @param {[number, number]} p2 Coordenada 2 [lat, lng]
 * @returns {number} Distancia en metros
 */
function getDistanceMeters(p1, p2) {
  if (!p1 || !p2) return 0;
  const R = 6371000; // Radio de la Tierra en metros
  const phi1 = p1[0] * Math.PI / 180;
  const phi2 = p2[0] * Math.PI / 180;
  const deltaPhi = (p2[0] - p1[0]) * Math.PI / 180;
  const deltaLambda = (p2[1] - p1[1]) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default { calculateRoute, calculateAlternativeRoutes, analyzeRouteRisk, generateRecommendations, searchAddress, getDistanceMeters };
