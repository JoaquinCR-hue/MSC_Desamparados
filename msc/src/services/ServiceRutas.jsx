// =====================================================
// ServiceRutas.jsx
// Servicio de cálculo de rutas y análisis de riesgo
// =====================================================

// NOTA: Sustituye YOUR_ORS_API_KEY por tu clave de openrouteservice.org cuando la tengas
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE2ZmRjZDdkMzBjOTRjMzVhYmQ2ZTQ0ZDYyZTk2MTA3IiwiaCI6Im11cm11cjY0In0=';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

/**
 * Calcula la ruta entre dos puntos usando OpenRouteService.
 * Si no hay API key, devuelve una ruta simulada (línea recta).
 * @param {[number, number]} origen  [lat, lng]
 * @param {[number, number]} destino [lat, lng]
 * @returns {object} { coordenadas: [[lat,lng],...], distanciaKm: number, duracionMin: number, simulada: bool }
 */
async function calcularRuta(origen, destino) {
  // Modo simulado si no hay key configurada
  if (!ORS_API_KEY || ORS_API_KEY === 'YOUR_ORS_API_KEY') {
    return _rutaSimulada(origen, destino);
  }

  try {
    const body = {
      coordinates: [
        [origen[1], origen[0]],   // ORS usa [lng, lat]
        [destino[1], destino[0]],
      ],
    };

    const response = await fetch(ORS_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('ORS error ' + response.status);

    const data = await response.json();
    const segment = data.routes[0];
    const distanciaKm = (segment.summary.distance / 1000).toFixed(2);
    const duracionMin = Math.round(segment.summary.duration / 60);

    // Decodificar geometría encoded polyline a [lat, lng][]
    const coords = decodePolyline(segment.geometry);

    return { coordenadas: coords, distanciaKm, duracionMin, simulada: false };
  } catch (error) {
    console.warn('OpenRouteService no disponible, usando ruta simulada:', error);
    return _rutaSimulada(origen, destino);
  }
}

/** Crea una ruta simulada con puntos intermedios entre origen y destino */
function _rutaSimulada(origen, destino) {
  const pasos = 10;
  const coords = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    coords.push([
      origen[0] + (destino[0] - origen[0]) * t,
      origen[1] + (destino[1] - origen[1]) * t,
    ]);
  }
  const dLat = destino[0] - origen[0];
  const dLng = destino[1] - origen[1];
  const distanciaKm = (Math.sqrt(dLat * dLat + dLng * dLng) * 111).toFixed(2);
  const duracionMin = Math.round(distanciaKm * 2);
  return { coordenadas: coords, distanciaKm, duracionMin, simulada: true };
}

/**
 * Calcula qué reportes están dentro de `radioMetros` de cualquier punto de la ruta.
 * @param {[number,number][]} coordenadas  Lista de puntos de la ruta
 * @param {object[]} reportes              Array de reportes del backend
 * @param {number} radioMetros             Radio de búsqueda en metros (default 300)
 */
function analizarRiesgoEnRuta(coordenadas, reportes, radioMetros = 300) {
  const radioGrados = radioMetros / 111000;
  const incidentesCercanos = [];
  const idsAgregados = new Set();

  for (const reporte of reportes) {
    if (!reporte.lat || !reporte.lng) continue;
    if (idsAgregados.has(reporte.id)) continue;

    for (const [rLat, rLng] of coordenadas) {
      const dLat = reporte.lat - rLat;
      const dLng = reporte.lng - rLng;
      const distancia = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distancia <= radioGrados) {
        incidentesCercanos.push({
          ...reporte,
          distanciaMetros: Math.round(distancia * 111000),
        });
        idsAgregados.add(reporte.id);
        break;
      }
    }
  }

  // Calcular nivel de riesgo global
  const total = incidentesCercanos.length;
  let nivelRiesgo, colorRiesgo, iconRiesgo;
  if (total === 0) {
    nivelRiesgo = 'Bajo'; colorRiesgo = '#4CAF50'; iconRiesgo = 'fa-shield-halved';
  } else if (total <= 2) {
    nivelRiesgo = 'Moderado'; colorRiesgo = '#FFD600'; iconRiesgo = 'fa-triangle-exclamation';
  } else if (total <= 5) {
    nivelRiesgo = 'Alto'; colorRiesgo = '#FF9100'; iconRiesgo = 'fa-circle-exclamation';
  } else {
    nivelRiesgo = 'Crítico'; colorRiesgo = '#FF1744'; iconRiesgo = 'fa-skull-crossbones';
  }

  return { incidentesCercanos, nivelRiesgo, colorRiesgo, iconRiesgo, total };
}

/**
 * Genera recomendaciones de seguridad personalizadas según los incidentes cercanos.
 * @param {object[]} incidentesCercanos Lista de reportes cercanos a la ruta
 * @param {string} nivelRiesgo          Nivel calculado: Bajo/Moderado/Alto/Crítico
 */
function generarRecomendaciones(incidentesCercanos, nivelRiesgo) {
  const recomendaciones = [];
  const tipos = incidentesCercanos.map(i => (i.tipo || '').toLowerCase());

  const contiene = (keyword) => tipos.some(t => t.includes(keyword));

  // Recomendaciones por nivel base
  if (nivelRiesgo === 'Bajo') {
    recomendaciones.push({
      icono: 'fa-circle-check',
      color: '#4CAF50',
      texto: 'Ruta con bajo historial de incidentes. Condiciones favorables para el traslado.',
    });
  }

  if (nivelRiesgo === 'Moderado' || nivelRiesgo === 'Alto' || nivelRiesgo === 'Crítico') {
    recomendaciones.push({
      icono: 'fa-clock',
      color: '#FFD600',
      texto: 'Se recomienda realizar el trayecto en horario diurno (6am–6pm) para mayor seguridad.',
    });
    recomendaciones.push({
      icono: 'fa-user-group',
      color: '#FFD600',
      texto: 'Evite transitar solo/a por esta ruta. Prefiera compañía o grupos.',
    });
  }

  if (nivelRiesgo === 'Alto' || nivelRiesgo === 'Crítico') {
    recomendaciones.push({
      icono: 'fa-route',
      color: '#FF9100',
      texto: 'Considere una ruta alternativa para evitar las zonas con mayor concentración de incidentes.',
    });
    recomendaciones.push({
      icono: 'fa-mobile-screen',
      color: '#FF9100',
      texto: 'Mantenga su teléfono cargado y comparta su ubicación en tiempo real con un familiar.',
    });
  }

  if (nivelRiesgo === 'Crítico') {
    recomendaciones.push({
      icono: 'fa-car-side',
      color: '#FF1744',
      texto: 'Zona crítica: se recomienda usar medios de transporte formal (bus, taxi o Uber) en lugar de caminar.',
    });
    recomendaciones.push({
      icono: 'fa-phone',
      color: '#FF1744',
      texto: 'En caso de emergencia, marque el 9-1-1. Lleve anotados los números de emergencia.',
    });
  }

  // Recomendaciones específicas por tipo de incidente
  if (contiene('robo') || contiene('hurto') || contiene('asalto')) {
    recomendaciones.push({
      icono: 'fa-wallet',
      color: '#FF9100',
      texto: 'Historial de robos en la zona: evite mostrar objetos de valor (teléfono, joyería, efectivo).',
    });
  }

  if (contiene('accidente') || contiene('vial') || contiene('colisión') || contiene('atropell')) {
    recomendaciones.push({
      icono: 'fa-car-burst',
      color: '#FF9100',
      texto: 'Zona con accidentes viales registrados: use el cinturón de seguridad y respete los límites de velocidad.',
    });
  }

  if (contiene('violencia') || contiene('agresión') || contiene('pelea')) {
    recomendaciones.push({
      icono: 'fa-person-running',
      color: '#FF1744',
      texto: 'Reportes de violencia en la zona. En caso de sentirse en peligro, aléjese del lugar y busque un sitio público.',
    });
  }

  if (contiene('droga') || contiene('narcot') || contiene('sustancia')) {
    recomendaciones.push({
      icono: 'fa-eye-slash',
      color: '#FF9100',
      texto: 'Área con reportes de actividad relacionada a sustancias. Evite acercarse a grupos desconocidos.',
    });
  }

  // Recomendación universal al final
  recomendaciones.push({
    icono: 'fa-shield',
    color: '#64B5F6',
    texto: 'Siempre informe a alguien de confianza su ruta y hora estimada de llegada.',
  });

  return recomendaciones;
}

// ─── Utilidad: decodificar polyline encoded (formato Google/ORS) ──────────────
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
 * @param {string} texto  Texto ingresado por el usuario
 * @returns {object[]}   Array de sugerencias { label, lat, lng }
 */
async function buscarDireccion(texto) {
  if (!texto || texto.trim().length < 3) return [];

  // ── Intento 1: ORS Geocoding API ─────────────────────────────────────────
  if (ORS_API_KEY && ORS_API_KEY !== 'YOUR_ORS_API_KEY') {
    try {
      const url = new URL('https://api.openrouteservice.org/geocode/search');
      url.searchParams.set('api_key', ORS_API_KEY);
      url.searchParams.set('text', texto);
      url.searchParams.set('boundary.country', 'CR');
      url.searchParams.set('focus.point.lat', '9.892');
      url.searchParams.set('focus.point.lon', '-84.05');
      url.searchParams.set('size', '6');

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        return (data.features || []).map(f => ({
          label: f.properties.label,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }));
      }
    } catch (e) {
      console.warn('ORS geocoding falló, usando Nominatim:', e);
    }
  }

  // ── Respaldo: Nominatim (OpenStreetMap, completamente gratuito) ───────────
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${texto}, Costa Rica`);
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
    return data.map(item => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (e) {
    console.error('Error en geocodificación:', e);
    return [];
  }
}

export default { calcularRuta, analizarRiesgoEnRuta, generarRecomendaciones, buscarDireccion };
