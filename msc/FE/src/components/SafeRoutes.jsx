import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import SafeRouteMap from '../components/SafeRouteMap';
import AIRouteAnalysis from '../components/AIRouteAnalysis';
import ReportService from '../services/ReportService';
import RouteService from '../services/RouteService';
import { getUserLocation, watchLocation, stopWatchLocation } from '../services/gpsService';
import { runPoliceIA } from '../agents/policeIAAgent';
import Swal from 'sweetalert2';
import distritosGeo from '../data/distritos.json';
import '../styles/SafeRoutes.css';

// ── Componente: campo de búsqueda de dirección con autocompletado ────────────────
const AddressSearch = ({ placeholder, onSelect, value, colorClass }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // Actualiza el estado local si cambia el valor externo
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Cierra el menú desplegable si se hace clic fuera del componente
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timeoutRef.current);
    if (val.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await RouteService.searchAddress(val);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setIsSearching(false);
    }, 450);
  };

  const handleSelect = (sug) => {
    setQuery(sug.label);
    setSuggestions([]);
    setShowDropdown(false);
    onSelect([sug.lat, sug.lng], sug.label);
  };

  return (
    <div className="address-search-wrapper" ref={wrapperRef}>
      <div className={`address-input-box ${colorClass}`}>
        <i className={`fa-solid ${colorClass === 'green' ? 'fa-location-dot' : 'fa-flag-checkered'} addr-icon`}></i>
        <input
          type="text"
          className="address-input"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          autoComplete="off"
        />
        {isSearching && <i className="fa-solid fa-spinner fa-spin addr-spinner"></i>}
        {query && !isSearching && (
          <button className="addr-clear" onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>
      {showDropdown && (
        <ul className="address-dropdown">
          {suggestions.map((s, i) => (
            <li key={i} className="address-suggestion" onMouseDown={() => handleSelect(s)}>
              <i className="fa-solid fa-map-pin"></i>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Genera las indicaciones giro a giro basadas en las coordenadas de la ruta
const generateNavigationInstructions = (coordinates) => {
  const instructions = [];
  const totalPoints = coordinates.length;
  if (totalPoints === 0) return [];

  // Nombres de calles para simular el trayecto en Desamparados
  const streetNames = [
    'Calle Principal Desamparados',
    'Avenida Central',
    'Calle de la Iglesia',
    'Vía del Comercio',
    'Paso Ancho',
    'Calle Damas',
    'Calle Segura'
  ];

  // Dividir el trayecto en 5 segmentos
  const segmentCount = 5;
  const pointsPerSegment = Math.ceil(totalPoints / segmentCount);

  for (let i = 0; i < totalPoints; i++) {
    const currentSegmentIndex = Math.floor(i / pointsPerSegment);
    const street = streetNames[currentSegmentIndex % streetNames.length];
    const nextStreet = streetNames[(currentSegmentIndex + 1) % streetNames.length];
    
    let text = '';
    let icon = 'fa-arrow-up';
    let voiceText = '';
    let distanceToNext = 0;

    if (i === totalPoints - 1) {
      text = 'Ha llegado a su destino';
      icon = 'fa-flag-checkered';
      voiceText = 'Ha llegado a su destino a salvo.';
      distanceToNext = 0;
    } else {
      const remainingPoints = pointsPerSegment - (i % pointsPerSegment);
      // Simular distancia (cada punto representa ~25 metros)
      distanceToNext = remainingPoints * 25;

      if (remainingPoints <= 2 && currentSegmentIndex < segmentCount - 1) {
        // Giro a punto de ocurrir
        const isRightTurn = currentSegmentIndex % 2 === 0;
        text = `En ${distanceToNext} metros, gire a la ${isRightTurn ? 'derecha' : 'izquierda'} hacia ${nextStreet}`;
        icon = isRightTurn ? 'fa-arrow-turn-up-right' : 'fa-arrow-turn-up-left';
        voiceText = `En ${distanceToNext} metros, gire a la ${isRightTurn ? 'derecha' : 'izquierda'} hacia ${nextStreet}`;
      } else if (i % pointsPerSegment === 0 && currentSegmentIndex > 0) {
        // Giro actual
        const isRightTurn = (currentSegmentIndex - 1) % 2 === 0;
        text = `Gire a la ${isRightTurn ? 'derecha' : 'izquierda'} en ${street}`;
        icon = isRightTurn ? 'fa-arrow-right' : 'fa-arrow-left';
        voiceText = `Gire a la ${isRightTurn ? 'derecha' : 'izquierda'} en ${street}`;
      } else {
        // Siga recto
        text = `Continúe recto por ${street}`;
        icon = 'fa-arrow-up';
        // Solo hablar al inicio del segmento recto
        if (i % pointsPerSegment === 1) {
          voiceText = `Continúe recto por ${street} durante ${distanceToNext} metros`;
        }
      }
    }

    instructions.push({
      text,
      icon,
      voiceText,
      distance: distanceToNext,
      street
    });
  }

  return instructions;
};

// Busca el índice de coordenada más cercano a la ubicación actual del usuario
const findClosestCoordinateIndex = (currentLocation, coordinates) => {
  if (!currentLocation || !coordinates || coordinates.length === 0) return 0;
  let minDistance = Infinity;
  let closestIndex = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const latDiff = coordinates[i][0] - currentLocation[0];
    const lngDiff = coordinates[i][1] - currentLocation[1];
    const distanceSq = latDiff * latDiff + lngDiff * lngDiff;
    if (distanceSq < minDistance) {
      minDistance = distanceSq;
      closestIndex = i;
    }
  }
  return closestIndex;
};

// Algoritmo Ray-Casting para verificar si un punto está dentro de un polígono
const isPointInPolygon = (point, polygon) => {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0], yi = polygon[i][1];
    let xj = polygon[j][0], yj = polygon[j][1];
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Obtiene el nombre del distrito de Desamparados basado en las coordenadas
const getDistrictByLatLng = (lat, lng, distritosGeo) => {
  if (!distritosGeo || !distritosGeo.features) return 'Desamparados';
  const point = [lng, lat];
  
  for (const feature of distritosGeo.features) {
    const geometry = feature.geometry;
    let inside = false;
    
    if (geometry.type === 'Polygon') {
      inside = isPointInPolygon(point, geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
      inside = geometry.coordinates.some(poly => isPointInPolygon(point, poly[0]));
    }
    
    if (inside) {
      return feature.properties.name || 'Desamparados';
    }
  }
  return 'Desamparados';
};

const SafeRoutes = () => {
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Estados de origen y destino
  const [origin, setOrigin] = useState(null); // [lat, lng]
  const [destination, setDestination] = useState(null); // [lat, lng]
  const [originLabel, setOriginLabel] = useState('');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [selectionMode, setSelectionMode] = useState(null); // 'origin' | 'destination' | null
  const [travelMode, setTravelMode] = useState('Auto'); // 'Auto' | 'Motocicleta' | 'Peatón'

  // Estados de cálculo de multirutas
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvisories, setAiAdvisories] = useState(null); // { route_fast, route_safe, route_alt }
  const [gpsLoading, setGpsLoading] = useState(false);

  // Estados de navegación activa
  const [navigationActive, setNavigationActive] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [liveLocationAccuracy, setLiveLocationAccuracy] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [currentStreetName, setCurrentStreetName] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);

  // Estados de voz e indicaciones de navegación
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [navigationInstructions, setNavigationInstructions] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const lastSpokenRef = useRef('');
  
  // Control de GPS preciso y recalculación automática
  const lastRecalculateTimeRef = useRef(0);
  const lastLocationRef = useRef(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState(null);
  const [navigationHeading, setNavigationHeading] = useState(0);

  // Estados para Móvil (UX de navegación)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);

  // Referencias para la animación y geolocalización continua
  const simulationIntervalRef = useRef(null);
  const watchIdRef = useRef(null);
  // Ref para evitar stale closure en el callback GPS: siempre tiene las instrucciones más recientes
  const currentInstructionsRef = useRef([]);

  // ── Cargar reportes recientes del backend ─────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await ReportService.getReports();
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        const recent = (data || []).filter(r => {
          if (!r.fecha) return false;
          return new Date(r.fecha) >= oneWeekAgo;
        });
        setReports(recent);
      } catch (e) {
        console.error('Error cargando reportes:', e);
      } finally {
        setLoadingReports(false);
      }
    };
    loadData();
    return () => {
      clearInterval(simulationIntervalRef.current);
      if (watchIdRef.current) stopWatchLocation(watchIdRef.current);
    };
  }, []);

  // ── Conectarse al GPS para obtener ubicación actual ─────────────────────────────────
  const handleUseGPS = async () => {
    setGpsLoading(true);
    try {
      const location = await getUserLocation();
      setOrigin([location.lat, location.lng]);
      setOriginLabel('Mi ubicación actual (GPS)');
      setSelectionMode(null);
      setAiAdvisories(null);
      setRoutes([]);
      setSelectedRouteId(null);
      Swal.fire({
        icon: 'success',
        title: 'GPS Sincronizado',
        text: 'Se ha fijado tu ubicación actual como el origen.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: '#1a1c22',
        color: '#fff'
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error de GPS',
        text: error.message || 'No se pudo obtener la ubicación del dispositivo.',
        background: '#1a1c22',
        color: '#fff'
      });
    } finally {
      setGpsLoading(false);
    }
  };

  // ── Handlers para selección de puntos ──────────────────────────────────────────────
  const handleSelectOrigin = () => setSelectionMode('origin');
  const handleSelectDestination = () => setSelectionMode('destination');

  const handleOriginChange = useCallback((point, label) => {
    setOrigin(point);
    if (label) setOriginLabel(label);
    setSelectionMode(null);
    setAiAdvisories(null);
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleDestinationChange = useCallback((point, label) => {
    setDestination(point);
    if (label) setDestinationLabel(label);
    setSelectionMode(null);
    setAiAdvisories(null);
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  // Solicitar asesoramiento inteligente de Gemini para las tres rutas
  const requestAIAssessment = async (routesList) => {
    const routeSummary = routesList.map(r => 
      `- ${r.name} (${r.tag}): ${r.durationMin} mins, ${r.distanceKm} km, riesgo ${r.riskLevel} (${r.totalIncidents} incidentes cerca).`
    ).join('\n');

    const userMessage = `Hola Police-IA, he calculado estas 3 opciones de ruta usando el modo de transporte ${travelMode} de A a B. Por favor, analízalas y bríndame un consejo de seguridad corto y específico (de 2 a 3 oraciones) para CADA una de ellas en un formato estructurado donde cada sección comience con [CONSEJO_RAPIDA], [CONSEJO_SEGURA] y [CONSEJO_ALTERNATIVA] respectivamente, así podré mostrarlos de forma independiente en sus pestañas de la interfaz. ¡Sé claro y conciso!
    
    RUTAS CALCULADAS:
    ${routeSummary}`;

    try {
      const response = await runPoliceIA({
        userMessage,
        userLocation: { lat: origin[0], lng: origin[1] },
        userRole: 'ciudadano',
        conversationHistory: []
      });

      const adviceText = response.text;
      
      const adviceObj = {
        route_fast: "No hay asesoramiento específico para esta ruta.",
        route_safe: "No hay asesoramiento específico para esta ruta.",
        route_alt: "No hay asesoramiento específico para esta ruta."
      };

      const fastMatch = adviceText.match(/\[CONSEJO_RAPIDA\]([\s\S]*?)(?=\[CONSEJO_SEGURA\]|\[CONSEJO_ALTERNATIVA\]|$)/i);
      const safeMatch = adviceText.match(/\[CONSEJO_SEGURA\]([\s\S]*?)(?=\[CONSEJO_RAPIDA\]|\[CONSEJO_ALTERNATIVA\]|$)/i);
      const altMatch = adviceText.match(/\[CONSEJO_ALTERNATIVA\]([\s\S]*?)(?=\[CONSEJO_RAPIDA\]|\[CONSEJO_SEGURA\]|$)/i);

      if (fastMatch) adviceObj.route_fast = fastMatch[1].replace(/[:*#\-]/g, '').trim();
      if (safeMatch) adviceObj.route_safe = safeMatch[1].replace(/[:*#\-]/g, '').trim();
      if (altMatch) adviceObj.route_alt = altMatch[1].replace(/[:*#\-]/g, '').trim();

      // Si no coincide el formato, poner toda la respuesta en todas como respaldo
      if (!fastMatch && !safeMatch && !altMatch) {
        adviceObj.route_fast = adviceText;
        adviceObj.route_safe = "El agente de seguridad consolidó las recomendaciones en el panel principal.";
        adviceObj.route_alt = "El agente de seguridad consolidó las recomendaciones en el panel principal.";
      }

      setAiAdvisories(adviceObj);
    } catch (error) {
      console.error("Error al consultar a Gemini:", error);
      setAiAdvisories({
        route_fast: "Asistente Gemini: Evita transitar por sectores solitarios y mantente alerta.",
        route_safe: "Asistente Gemini: Esta ruta rodea los incidentes recientes, es la más recomendada.",
        route_alt: "Asistente Gemini: Transita por calles iluminadas y comunica tu trayecto en tiempo real."
      });
    }
  };

  // ── Calcular 3 rutas alternativas de manera inteligente ──────────────────────────────
  const handleCalculateRoute = async () => {
    if (!origin || !destination) return;
    setMobileSearchOpen(false); // Ocultar búsqueda en móvil al calcular
    setBottomSheetExpanded(true); // Expandir panel inferior para ver resultados
    setIsAnalyzing(true);
    setRoutes([]);
    setSelectedRouteId(null);

    try {
      // Calcular las 3 alternativas con el desvío adaptativo a incidentes en RouteService
      const calculated = await RouteService.calculateAlternativeRoutes(origin, destination, travelMode, reports);
      setRoutes(calculated);
      setSelectedRouteId('route_fast'); // Rápida seleccionada por defecto
      
      // Consultar asincrónicamente al agente Gemini para asesoramiento de rutas
      requestAIAssessment(calculated);
    } catch (e) {
      console.error('Error calculando rutas:', e);
      Swal.fire({
        icon: 'error',
        title: 'Error de Trazado',
        text: 'No se pudo trazar el recorrido. Verifica que los puntos estén en Desamparados.',
        background: '#1a1c22',
        color: '#fff'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Limpiar todos los campos y resultados ──────────────────────────────────────────
  const handleClear = () => {
    setOrigin(null);
    setDestination(null);
    setOriginLabel('');
    setDestinationLabel('');
    setSelectionMode(null);
    setRoutes([]);
    setSelectedRouteId(null);
    setAiAdvisories(null);
    setNavigationActive(false);
    setSimulating(false);
    setLiveLocation(null);
    setLiveLocationAccuracy(null);
    clearInterval(simulationIntervalRef.current);
    if (watchIdRef.current) {
      stopWatchLocation(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Sintetiza voz para las indicaciones de navegación
  const speakInstruction = useCallback((text) => {
    if (!voiceEnabled || !text || text === lastSpokenRef.current) return;
    try {
      lastSpokenRef.current = text;
      window.speechSynthesis.cancel(); // Cancelar cualquier reproducción previa
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CR'; // Idioma español
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Text-to-speech error: ", err);
    }
  }, [voiceEnabled]);

  // Cambiar el estado de la guía de voz (activar/silenciar)
  const handleToggleVoice = () => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);
    if (nextState) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Indicaciones de voz activadas");
        utterance.lang = 'es-CR';
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("TTS toggle voice error: ", err);
      }
    }
  };

  // Reportar un incidente rápido durante la navegación en la ubicación actual
  const handleQuickReport = async () => {
    if (!liveLocation) return;
    
    const { value: formValues } = await Swal.fire({
      title: '🚨 Reportar Incidente de Seguridad',
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <label style="color: #cbd5e1; font-size: 0.85rem; display:block; margin-bottom:4px;">Tipo de Incidente:</label>
          <select id="swal-tipo" class="swal2-input" style="width: 100%; margin: 0 0 12px 0; background:#1e2128; color:white; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; height: 42px;">
            <option value="Robo/Asalto">Robo / Asalto</option>
            <option value="Agresión">Agresión / Violencia</option>
            <option value="Sospechoso">Actividad Sospechosa</option>
            <option value="Accidente">Accidente Vial</option>
            <option value="Vandalismo">Vandalismo</option>
            <option value="Otros">Otros</option>
          </select>
          
          <label style="color: #cbd5e1; font-size: 0.85rem; display:block; margin-bottom:4px;">Barrio / Referencia:</label>
          <input id="swal-barrio" class="swal2-input" placeholder="ej. Frente al parque de Desamparados" style="width: 100%; margin: 0 0 12px 0; background:#1e2128; color:white; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; height: 42px;">
          
          <label style="color: #cbd5e1; font-size: 0.85rem; display:block; margin-bottom:4px;">Descripción Corta:</label>
          <input id="swal-desc" class="swal2-input" placeholder="ej. Presencia de dos sujetos armados" style="width: 100%; margin: 0; background:#1e2128; color:white; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; height: 42px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enviar Alerta',
      cancelButtonText: 'Cancelar',
      background: '#1a1c22',
      color: '#fff',
      confirmButtonColor: '#e07b00',
      preConfirm: () => {
        return {
          tipo: document.getElementById('swal-tipo').value,
          barrio: document.getElementById('swal-barrio').value || 'Reporte GPS',
          descripcion: document.getElementById('swal-desc').value || 'Sin descripción adicional'
        }
      }
    });

    if (formValues) {
      try {
        const districtName = getDistrictByLatLng(liveLocation[0], liveLocation[1], distritosGeo);
        const newReport = {
          tipo: formValues.tipo,
          barrio: formValues.barrio,
          descripcion: formValues.descripcion,
          lat: liveLocation[0],
          lng: liveLocation[1],
          fecha: new Date().toISOString(),
          distrito: districtName
        };
        await ReportService.createReport(newReport);
        
        // Recargar los reportes locales para que aparezcan en el mapa
        const freshReports = await ReportService.getReports();
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        const recent = (freshReports || []).filter(r => {
          if (!r.fecha) return false;
          return new Date(r.fecha) >= oneWeekAgo;
        });
        setReports(recent);

        Swal.fire({
          title: '¡Alerta Registrada!',
          text: `El incidente de tipo ${formValues.tipo} ha sido geolocalizado en ${districtName} y difundido en la red.`,
          icon: 'success',
          background: '#1a1c22',
          color: '#fff',
          confirmButtonColor: '#00C853'
        });
      } catch (err) {
        console.error("Error al guardar reporte rápido: ", err);
        Swal.fire({
          title: 'Error de Red',
          text: 'No se pudo enviar el reporte en este momento.',
          icon: 'error',
          background: '#1a1c22',
          color: '#fff'
        });
      }
    }
  };

  // Calcula el rumbo (bearing) matemático entre dos coordenadas en grados (0-360)
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
              
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  };

  // Recalcula la ruta en segundo plano de forma silenciosa por desvío del usuario
  const recalculateRouteOnDeviate = async (currentLoc) => {
    if (!destination) return;
    try {
      console.log('Recalculando ruta en segundo plano por desvío de coordenadas...');
      
      // Calcular nuevas alternativas de ruta desde la posición actual
      const calculated = await RouteService.calculateAlternativeRoutes(currentLoc, destination, travelMode, reports);
      setRoutes(calculated);
      
      // Intentar mantener seleccionada la misma ruta actual
      const activeId = selectedRouteId || 'route_fast';
      const newSelectedRoute = calculated.find(r => r.id === activeId) || calculated[0];
      
      // Generar nuevas indicaciones para la ruta recalculada
      const generated = generateNavigationInstructions(newSelectedRoute.coordinates);
      setNavigationInstructions(generated);
      currentInstructionsRef.current = generated; // Sincronizar ref para que el callback GPS la vea
      
      // Buscar el punto más cercano en la nueva ruta
      const closestIdx = findClosestCoordinateIndex(currentLoc, newSelectedRoute.coordinates);
      setCurrentStepIndex(closestIdx);
      
      // Actualizar información visual
      setRemainingDistance(parseFloat(newSelectedRoute.distanceKm).toFixed(2));
      setRemainingTime(newSelectedRoute.durationMin);
      
      // Actualizar consejos de IA en background
      requestAIAssessment(calculated);
      
      // Notificación de voz
      if (voiceEnabled) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("Recalculando ruta");
          utterance.lang = 'es-CR';
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Error al recalcular ruta por desvío:', err);
    }
  };

  // ── Navegación Activa y Simulador GPS ────────────────────────────────────────
  const handleStartNavigation = (isSimulated = false) => {
    const selectedRoute = routes.find(r => r.id === selectedRouteId);
    if (!selectedRoute) return;

    // Generar indicaciones y guardarlas
    const generated = generateNavigationInstructions(selectedRoute.coordinates);
    setNavigationInstructions(generated);
    currentInstructionsRef.current = generated; // Actualizar ref para evitar stale closure
    setCurrentStepIndex(0);
    lastSpokenRef.current = '';

    setNavigationActive(true);
    setLiveLocation(selectedRoute.coordinates[0]);
    if (isSimulated) {
      setLiveLocationAccuracy(5); // 5 metros para simulación
    }
    setRemainingTime(selectedRoute.durationMin);
    setRemainingDistance(selectedRoute.distanceKm);

    if (isSimulated) {
      setSimulating(true);
      let step = 0;
      const coords = selectedRoute.coordinates;
      const totalSteps = coords.length;
      
      // Velocidad base según el modo de transporte
      const baseSpeed = travelMode === 'Auto' ? 45 : (travelMode === 'Motocicleta' ? 55 : 5);

      simulationIntervalRef.current = setInterval(() => {
        if (step >= totalSteps - 1) {
          // Destino alcanzado
          clearInterval(simulationIntervalRef.current);
          setSimulating(false);
          setSpeed(0);
          setRemainingTime(0);
          setRemainingDistance('0.00');
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Ha llegado a su destino a salvo.");
            utterance.lang = 'es-CR';
            window.speechSynthesis.speak(utterance);
          } catch (e) {}
          Swal.fire({
            title: '¡Destino Alcanzado!',
            text: 'Has llegado a salvo a tu punto de destino en MSC Desamparados.',
            icon: 'success',
            background: '#1a1c22',
            color: '#fff',
            confirmButtonColor: '#F97316'
          });
          return;
        }

        step++;
        setCurrentStepIndex(step);
        setLiveLocation(coords[step]);

        // Simular velocidad
        const currentSpeed = baseSpeed + Math.floor(Math.random() * 8 - 4);
        setSpeed(Math.max(0, currentSpeed));

        // Cuenta regresiva
        const pctRemaining = 1 - (step / (totalSteps - 1));
        setRemainingDistance((selectedRoute.distanceKm * pctRemaining).toFixed(2));
        setRemainingTime(Math.ceil(selectedRoute.durationMin * pctRemaining));

        // Actualizar instrucción actual
        const currentInst = generated[step];
        if (currentInst) {
          setCurrentStreetName(currentInst.street);
          if (currentInst.voiceText) {
            speakInstruction(currentInst.voiceText);
          }
        }
      }, 950); // Avanzar un punto cada 950ms
    } else {
      // Conectar GPS en vivo en segundo plano
      setSimulating(false);
      setSpeed(0);
      Swal.fire({
        icon: 'info',
        title: 'Navegación GPS Activa',
        text: 'El mapa seguirá tu ubicación física. Transita con seguridad.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        background: '#1a1c22',
        color: '#fff'
      });

      watchIdRef.current = watchLocation((position) => {
        const currentLoc = [position.lat, position.lng];
        setLiveLocation(currentLoc);
        setLiveLocationAccuracy(position.accuracy);
        setGpsErrorMsg(null); // Limpiar cualquier mensaje de error anterior si ya está llegando señal

        // Encontrar punto más cercano en la ruta actual
        const closestIdx = findClosestCoordinateIndex(currentLoc, selectedRoute.coordinates);
        const closestPoint = selectedRoute.coordinates[closestIdx];
        
        // Calcular la distancia al trazado de la ruta activa en metros
        const distanceToRoute = RouteService.getDistanceMeters(currentLoc, closestPoint);

        // Si el usuario se desvía más de 40 metros del trazado, y el GPS es confiable (accuracy < 25m)
        if (distanceToRoute > 40 && position.accuracy < 25) {
          const now = Date.now();
          // Limitar la frecuencia de recalculación a una vez cada 8 segundos para ahorrar batería y red
          if (now - lastRecalculateTimeRef.current > 8000) {
            lastRecalculateTimeRef.current = now;
            recalculateRouteOnDeviate(currentLoc);
            return; // Detener flujo actual y esperar que la recalculación actualice la ruta
          }
        }

        setCurrentStepIndex(closestIdx);

        // Cuenta regresiva según progreso
        const pctRemaining = 1 - (closestIdx / (selectedRoute.coordinates.length - 1 || 1));
        setRemainingDistance((selectedRoute.distanceKm * pctRemaining).toFixed(2));
        setRemainingTime(Math.ceil(selectedRoute.durationMin * pctRemaining));
        
        // Calcular velocidad real en km/h
        let currentSpeed = 0;
        if (position.speed !== null && position.speed !== undefined) {
          currentSpeed = Math.round(position.speed * 3.6); // Convertir m/s a km/h
        } else if (lastLocationRef.current) {
          // De respaldo: velocidad por diferencias de distancia y tiempo
          const distPrev = RouteService.getDistanceMeters(lastLocationRef.current.coords, currentLoc);
          const timeDelta = (Date.now() - lastLocationRef.current.time) / 1000;
          if (timeDelta > 0 && distPrev > 1.5) {
            currentSpeed = Math.round((distPrev / timeDelta) * 3.6);
          }
        }
        setSpeed(Math.max(0, Math.min(130, currentSpeed)));

        // Calcular rumbo/heading de orientación
        if (position.heading !== null && position.heading !== undefined && !isNaN(position.heading)) {
          setNavigationHeading(position.heading);
        } else if (lastLocationRef.current && currentSpeed > 3) {
          // Calcular bearing si se mueve a más de 3 km/h
          const bearing = calculateBearing(
            lastLocationRef.current.coords[0],
            lastLocationRef.current.coords[1],
            currentLoc[0],
            currentLoc[1]
          );
          setNavigationHeading(bearing);
        }

        // Registrar última posición para el siguiente cálculo de rumbo/velocidad
        lastLocationRef.current = { coords: currentLoc, time: Date.now() };

        // Actualizar instrucción actual — usar ref para evitar el stale closure sobre 'generated'
        const currentInst = currentInstructionsRef.current[closestIdx];
        if (currentInst) {
          setCurrentStreetName(currentInst.street);
          if (currentInst.voiceText) {
            speakInstruction(currentInst.voiceText);
          }
        }
      }, (error) => {
        console.warn("GPS Navigation Error:", error);
        setGpsErrorMsg(error.message || "Señal de GPS inestable o desactivada.");
      });
    }
  };

  const handleStopNavigation = () => {
    clearInterval(simulationIntervalRef.current);
    if (watchIdRef.current) {
      stopWatchLocation(watchIdRef.current);
      watchIdRef.current = null;
    }
    try {
      window.speechSynthesis.cancel(); // Cancelar síntesis de voz en curso
    } catch (e) {}
    setNavigationActive(false);
    setSimulating(false);
    setLiveLocation(null);
    setLiveLocationAccuracy(null);
    setSpeed(0);
    lastSpokenRef.current = '';
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="rutas-page">
      <Navbar />

      <div className="rutas-content">
        <header className="rutas-header">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h1>Rutas Inteligentes</h1>
              <p>Comportamiento interactivo: elige trayectos, simula viajes y recibe asesoría de la IA Gemini.</p>
            </div>
            {gpsLoading ? (
              <button className="gps-indicator-btn loading" disabled>
                <i className="fa-solid fa-spinner fa-spin"></i> Localizando...
              </button>
            ) : (
              <button className="gps-indicator-btn" onClick={handleUseGPS} title="Sincronizar mi GPS en tiempo real">
                <i className="fa-solid fa-location-crosshairs"></i> Ubicación GPS
              </button>
            )}
          </div>
        </header>

        {/* Botón Flotante de Búsqueda (Sólo Móvil) */}
        {!navigationActive && !mobileSearchOpen && selectionMode === null && (
          <div className="mobile-search-trigger d-lg-none" onClick={() => setMobileSearchOpen(true)}>
            <div className="search-pill">
              <i className="fa-solid fa-magnifying-glass text-muted"></i>
              <span className="text-secondary fw-bold ms-2">¿A dónde vas?</span>
            </div>
          </div>
        )}

        {/* Barra de búsqueda y selección de modo de viaje */}
        {!navigationActive && selectionMode === null && (
          <div className={`rutas-search-bar glass-nav-bar ${mobileSearchOpen ? 'mobile-open' : 'mobile-closed'}`}>
            {/* Botón para cerrar en móvil */}
            {mobileSearchOpen && (
              <div className="d-flex justify-content-between align-items-center mb-3 d-lg-none">
                <h5 className="m-0 text-white fw-bold">Planificar Viaje</h5>
                <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={() => setMobileSearchOpen(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}
            <div className="search-row">
              <AddressSearch
                placeholder="Buscar dirección de origen…"
                colorClass="green"
                value={originLabel}
                onSelect={(point, label) => handleOriginChange(point, label)}
              />
              <button
                type="button"
                className="ctrl-map-btn green"
                onClick={handleUseGPS}
                title="Usar mi ubicación GPS actual"
                disabled={gpsLoading}
              >
                <i className={`fa-solid ${gpsLoading ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
                <span>GPS</span>
              </button>
              <button
                type="button"
                className={`ctrl-map-btn green ${selectionMode === 'origin' ? 'active' : ''}`}
                onClick={handleSelectOrigin}
                title="Seleccionar en el mapa"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Mapa</span>
              </button>
            </div>

            <div className="search-divider"><i className="fa-solid fa-arrow-down"></i></div>

            <div className="search-row">
              <AddressSearch
                placeholder="Buscar dirección de destino…"
                colorClass="red"
                value={destinationLabel}
                onSelect={(point, label) => handleDestinationChange(point, label)}
              />
              <button
                className={`ctrl-map-btn red ${selectionMode === 'destination' ? 'active' : ''}`}
                onClick={handleSelectDestination}
                title="Seleccionar en el mapa"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Mapa</span>
              </button>
            </div>

            <div className="search-actions d-flex flex-column gap-3">
              <div className="btn-group w-100" role="group">
                <input type="radio" className="btn-check" name="travelMode" id="btnAuto" autoComplete="off" checked={travelMode === 'Auto'} onChange={() => setTravelMode('Auto')} />
                <label className="btn btn-outline-primary" htmlFor="btnAuto"><i className="fa-solid fa-car me-2"></i>Auto</label>

                <input type="radio" className="btn-check" name="travelMode" id="btnMoto" autoComplete="off" checked={travelMode === 'Motocicleta'} onChange={() => setTravelMode('Motocicleta')} />
                <label className="btn btn-outline-primary" htmlFor="btnMoto"><i className="fa-solid fa-motorcycle me-2"></i>Moto</label>

                <input type="radio" className="btn-check" name="travelMode" id="btnPie" autoComplete="off" checked={travelMode === 'Peatón'} onChange={() => setTravelMode('Peatón')} />
                <label className="btn btn-outline-primary" htmlFor="btnPie"><i className="fa-solid fa-person-walking me-2"></i>Caminando</label>
              </div>

              {origin && destination && routes.length === 0 && !isAnalyzing && (
                <button className="ctrl-btn-analizar w-100" onClick={handleCalculateRoute}>
                  <i className="fa-solid fa-magnifying-glass-chart"></i> Calcular Rutas
                </button>
              )}
              {isAnalyzing && (
                <button className="ctrl-btn-analizar w-100" disabled>
                  <i className="fa-solid fa-spinner fa-spin"></i> Trazando Rutas Seguras…
                </button>
              )}
            {routes.length > 0 && (
              <button className="ctrl-btn-analizar w-100 btn-limpiar" onClick={handleClear}>
                <i className="fa-solid fa-trash-can"></i> Limpiar Todo
              </button>
            )}
          </div>

          {/* Accesos rápidos y atajos para móvil para rellenar la pantalla de forma premium */}
          {mobileSearchOpen && (
            <div className="mobile-search-shortcuts mt-4 flex-grow-1 overflow-auto w-100 text-start" style={{ maxHeight: '60vh' }}>
              <h6 className="text-secondary text-uppercase letter-spacing-1 mb-3 fs-7 fw-bold d-flex align-items-center gap-2">
                <i className="fa-solid fa-star text-warning"></i> Destinos Frecuentes
              </h6>
              <div className="shortcuts-row d-flex flex-column gap-2 mb-4">
                <button 
                  type="button"
                  className="shortcut-item btn text-start d-flex align-items-center gap-3 p-3 rounded"
                  onClick={() => {
                    handleUseGPS();
                  }}
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <div className="shortcut-icon-circle green">
                    <i className="fa-solid fa-location-crosshairs"></i>
                  </div>
                  <div>
                    <strong className="text-white d-block fs-6">Mi ubicación en vivo</strong>
                    <small className="text-secondary fs-7">Fijar origen en coordenadas GPS actuales</small>
                  </div>
                </button>

                <button 
                  type="button"
                  className="shortcut-item btn text-start d-flex align-items-center gap-3 p-3 rounded"
                  onClick={() => {
                    handleDestinationChange([9.8988, -84.0699], "Parque Central de Desamparados");
                    Swal.fire({
                      icon: 'success',
                      title: 'Destino Fijado',
                      text: 'Se fijó el Parque de Desamparados como destino.',
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 2000,
                      background: '#1a1c22',
                      color: '#fff'
                    });
                  }}
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <div className="shortcut-icon-circle orange">
                    <i className="fa-solid fa-tree"></i>
                  </div>
                  <div>
                    <strong className="text-white d-block fs-6">Parque de Desamparados</strong>
                    <small className="text-secondary fs-7">Parque Central en el centro cantonal</small>
                  </div>
                </button>

                <button 
                  type="button"
                  className="shortcut-item btn text-start d-flex align-items-center gap-3 p-3 rounded"
                  onClick={() => {
                    handleDestinationChange([9.8924, -84.0535], "Comandancia MSC Desamparados");
                    Swal.fire({
                      icon: 'success',
                      title: 'Destino Fijado',
                      text: 'Se fijó la Comandancia MSC como destino.',
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 2000,
                      background: '#1a1c22',
                      color: '#fff'
                    });
                  }}
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <div className="shortcut-icon-circle blue">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div>
                    <strong className="text-white d-block fs-6">Comandancia MSC</strong>
                    <small className="text-secondary fs-7">Estación Central de la Policía Municipal</small>
                  </div>
                </button>
              </div>

              <h6 className="text-secondary text-uppercase letter-spacing-1 mb-3 fs-7 fw-bold d-flex align-items-center gap-2">
                <i className="fa-solid fa-map text-primary-orange"></i> Sectores / Distritos
              </h6>
              <div className="districts-grid row g-2">
                {[
                  { name: 'Gravilias', coords: [9.8955, -84.0565], icon: 'fa-building-shield' },
                  { name: 'San Juan de Dios', coords: [9.8885, -84.0885], icon: 'fa-church' },
                  { name: 'Los Guido', coords: [9.8680, -84.0410], icon: 'fa-house-medical' },
                  { name: 'San Miguel', coords: [9.8690, -84.0280], icon: 'fa-mountain-sun' },
                  { name: 'San Rafael Abajo', coords: [9.8990, -84.0815], icon: 'fa-house-flag' },
                  { name: 'Patarrá', coords: [9.8820, -84.0190], icon: 'fa-leaf' }
                ].map((dist, idx) => (
                  <div key={idx} className="col-6">
                    <button
                      type="button"
                      className="district-grid-btn btn w-100 text-start p-3 rounded d-flex align-items-center gap-2"
                      onClick={() => {
                        handleDestinationChange(dist.coords, `Distrito: ${dist.name}, Desamparados`);
                        Swal.fire({
                          icon: 'success',
                          title: 'Destino Fijado',
                          text: `Se fijó el distrito de ${dist.name} como destino.`,
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 2000,
                          background: '#1a1c22',
                          color: '#fff'
                        });
                      }}
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                    >
                      <i className={`fa-solid ${dist.icon} text-primary-orange`}></i>
                      <span className="text-light fw-bold fs-7">{dist.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

        {/* Panel superior de navegación activa */}
        {navigationActive && (
          <div className="nav-navigation-header-panel glass-nav-bar">
            {/* Contenedor del ícono de dirección estilo GPS */}
            <div className="gps-direction-container">
              <div className="gps-direction-icon">
                <i className={`fa-solid ${navigationInstructions[currentStepIndex]?.icon || 'fa-arrow-up'} fa-fade`}></i>
              </div>
              <div className="gps-direction-details">
                <span className="gps-distance-text">
                  {navigationInstructions[currentStepIndex]?.distance > 0 
                    ? `${navigationInstructions[currentStepIndex]?.distance} m` 
                    : ''}
                </span>
                <strong className="gps-instruction-text">
                  {navigationInstructions[currentStepIndex]?.text || 'Continúe recto'}
                </strong>
                <span className="gps-street-text">
                  Transitando por: <span className="text-white fw-bold">{currentStreetName || 'Calle Principal'}</span>
                </span>
              </div>
            </div>
            
            {/* Controles de voz y acción */}
            <div className="gps-action-controls d-flex align-items-center gap-3">
              <button 
                className={`btn btn-voice-toggle ${voiceEnabled ? 'voice-active' : 'voice-muted'}`}
                onClick={handleToggleVoice}
                title={voiceEnabled ? "Silenciar guía de voz" : "Activar guía de voz"}
              >
                <i className={`fa-solid ${voiceEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
              </button>
              
              <button className="btn btn-danger btn-nav-abort" onClick={handleStopNavigation}>
                <i className="fa-solid fa-circle-stop"></i> Finalizar Viaje
              </button>
            </div>
          </div>
        )}

        {/* Layout principal: Mapa + Panel de Análisis */}
        <div className="rutas-main-layout">
          <div className="rutas-map-col" style={{ position: 'relative' }}>
            {loadingReports ? (
              <div className="rutas-loader">
                <div className="rutas-pulse"></div>
                <p>Cargando datos de seguridad cantonal…</p>
              </div>
            ) : (
              <>
                {gpsErrorMsg && (
                  <div className="gps-error-banner alert alert-danger position-absolute w-100 text-center fw-bold" style={{ zIndex: 1050, top: '0', left: '0', borderRadius: '0', margin: '0' }}>
                    <i className="fa-solid fa-triangle-exclamation fa-beat me-2"></i>
                    {gpsErrorMsg}
                  </div>
                )}
                <SafeRouteMap
                  origin={origin}
                  destination={destination}
                  onOriginChange={handleOriginChange}
                  onDestinationChange={handleDestinationChange}
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={setSelectedRouteId}
                  liveLocation={liveLocation}
                  liveLocationAccuracy={liveLocationAccuracy}
                  reports={reports}
                  selectionMode={selectionMode}
                  externalHeading={navigationHeading}
                  onOutOfBounds={() => setSelectionMode(null)}
                />

                {/* Velocímetro flotante en la esquina inferior izquierda del mapa */}
                {navigationActive && (
                  <div className="gps-speedometer-overlay">
                    <div className="speedometer-ring">
                      <div className="speedometer-value">{speed}</div>
                      <div className="speedometer-unit">km/h</div>
                    </div>
                  </div>
                )}

                {/* Botón flotante de reporte rápido en la esquina inferior derecha del mapa */}
                {navigationActive && (
                  <button 
                    className="gps-quick-report-btn"
                    onClick={handleQuickReport}
                    title="Reportar peligro de seguridad inmediato"
                  >
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </button>
                )}

                {/* Barra inferior compacta de estadísticas de viaje para celulares */}
                {navigationActive && (
                  <div className="gps-mobile-footer-stats">
                    <div className="stat-box">
                      <span className="stat-label">TIEMPO</span>
                      <strong className="stat-value">{remainingTime} <small>min</small></strong>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box">
                      <span className="stat-label">DISTANCIA</span>
                      <strong className="stat-value">{remainingDistance} <small>km</small></strong>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box">
                      <span className="stat-label">LLEGADA (ETA)</span>
                      <strong className="stat-value">
                        {(() => {
                          const arrivalTime = new Date();
                          arrivalTime.setMinutes(arrivalTime.getMinutes() + remainingTime);
                          return arrivalTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: false });
                        })()}
                      </strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div 
            className={`rutas-ai-col ${bottomSheetExpanded ? 'bottom-sheet-expanded' : 'bottom-sheet-collapsed'}`}
            onClick={() => {
              if (window.innerWidth <= 768 && !bottomSheetExpanded) {
                setBottomSheetExpanded(true);
              }
            }}
          >
            {/* En móvil, un tap en la columna (fuera del panel si se pudiera) o en el propio panel (arriba) lo expande. 
                Añadiremos un botón explícito de collapse en el componente AIRouteAnalysis o vía CSS. */}
            <AIRouteAnalysis
              origin={origin}
              destination={destination}
              analyzing={isAnalyzing}
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              aiAdvisories={aiAdvisories}
              navigationActive={navigationActive}
              simulating={simulating}
              onStartNavigation={handleStartNavigation}
              onStopNavigation={handleStopNavigation}
              selectionMode={selectionMode}
              onSelectOrigin={handleSelectOrigin}
              onSelectDestination={handleSelectDestination}
              onCalculateRoute={handleCalculateRoute}
              onClear={handleClear}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeRoutes;
