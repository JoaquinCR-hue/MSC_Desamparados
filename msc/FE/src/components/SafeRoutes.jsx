import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import SafeRouteMap from '../components/SafeRouteMap';
import AIRouteAnalysis from '../components/AIRouteAnalysis';
import ReportService from '../services/ReportService';
import RouteService from '../services/RouteService';
import { getUserLocation, watchLocation, stopWatchLocation } from '../services/gpsService';
import { runPoliceIA } from '../agents/policeIAAgent';
import Swal from 'sweetalert2';
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

  // Estados de cálculo de multirutas (Waze-style)
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvisories, setAiAdvisories] = useState(null); // { route_fast, route_safe, route_alt }
  const [gpsLoading, setGpsLoading] = useState(false);

  // Estados de navegación activa
  const [navigationActive, setNavigationActive] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState('0.00');
  const [currentStreetName, setCurrentStreetName] = useState('Calle Principal');

  // Referencias para la animación y geolocalización continua
  const simulationIntervalRef = useRef(null);
  const watchIdRef = useRef(null);

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
    setIsAnalyzing(true);
    setAiAdvisories(null);

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
    clearInterval(simulationIntervalRef.current);
    if (watchIdRef.current) {
      stopWatchLocation(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // ── Navegación Activa y Simulador Tipo Waze ────────────────────────────────────────
  const handleStartNavigation = (isSimulated = false) => {
    const selectedRoute = routes.find(r => r.id === selectedRouteId);
    if (!selectedRoute) return;

    setNavigationActive(true);
    setLiveLocation(selectedRoute.coordinates[0]);
    setRemainingTime(selectedRoute.durationMin);
    setRemainingDistance(selectedRoute.distanceKm);

    if (isSimulated) {
      setSimulating(true);
      let step = 0;
      const coords = selectedRoute.coordinates;
      const totalSteps = coords.length;
      
      // Velocidad mock según transporte
      const baseSpeed = travelMode === 'Auto' ? 45 : (travelMode === 'Motocicleta' ? 55 : 5);

      simulationIntervalRef.current = setInterval(() => {
        if (step >= totalSteps - 1) {
          // Destino alcanzado
          clearInterval(simulationIntervalRef.current);
          setSimulating(false);
          setSpeed(0);
          setRemainingTime(0);
          setRemainingDistance('0.00');
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
        setLiveLocation(coords[step]);

        // Simular velocímetro activo
        const currentSpeed = baseSpeed + Math.floor(Math.random() * 8 - 4);
        setSpeed(Math.max(0, currentSpeed));

        // Cuenta regresiva
        const pctRemaining = 1 - (step / (totalSteps - 1));
        setRemainingDistance((selectedRoute.distanceKm * pctRemaining).toFixed(2));
        setRemainingTime(Math.ceil(selectedRoute.durationMin * pctRemaining));

        // Simular nombres de calles de Desamparados conforme avanza
        const streets = ['Calle Principal', 'Avenida Central', 'Calle de la Iglesia', 'Vía del Comercio', 'Paso Ancho', 'Paso de la Patrulla', 'Calle Segura'];
        const streetIndex = Math.floor((step / totalSteps) * streets.length);
        setCurrentStreetName(streets[Math.min(streetIndex, streets.length - 1)]);
      }, 800); // Avanzar un punto cada 800ms
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
        setLiveLocation([position.lat, position.lng]);
        // Mock de velocidad desde la API GPS
        setSpeed(position.accuracy < 30 ? 30 : 0);
      });
    }
  };

  const handleStopNavigation = () => {
    clearInterval(simulationIntervalRef.current);
    if (watchIdRef.current) {
      stopWatchLocation(watchIdRef.current);
      watchIdRef.current = null;
    }
    setNavigationActive(false);
    setSimulating(false);
    setLiveLocation(null);
    setSpeed(0);
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
              <p>Comportamiento interactivo Waze: elige trayectos, simula viajes y recibe asesoría de la IA Gemini.</p>
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

        {/* Barra de búsqueda y selección de modo de viaje */}
        {!navigationActive && (
          <div className="rutas-search-bar glass-waze-bar">
            <div className="search-row">
              <AddressSearch
                placeholder="Buscar dirección de origen…"
                colorClass="green"
                value={originLabel}
                onSelect={(point, label) => handleOriginChange(point, label)}
              />
              <button
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
                <label className="btn btn-outline-primary" htmlFor="btnPie"><i className="fa-solid fa-person-walking me-2"></i>A Pie</label>
              </div>

              {origin && destination && routes.length === 0 && !isAnalyzing && (
                <button className="ctrl-btn-analizar w-100" onClick={handleCalculateRoute}>
                  <i className="fa-solid fa-magnifying-glass-chart"></i> Calcular Rutas
                </button>
              )}
              {isAnalyzing && (
                <button className="ctrl-btn-analizar w-100" disabled>
                  <i className="fa-solid fa-spinner fa-spin"></i> Trazando Rutas Waze…
                </button>
              )}
              {routes.length > 0 && (
                <button className="ctrl-btn-analizar w-100 btn-limpiar" onClick={handleClear}>
                  <i className="fa-solid fa-trash-can"></i> Limpiar Todo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Panel superior de navegación Waze Activa */}
        {navigationActive && (
          <div className="waze-navigation-header-panel">
            <div className="waze-nav-icon"><i className="fa-solid fa-location-arrow fa-beat"></i></div>
            <div className="waze-nav-street">
              <span className="text-secondary text-uppercase fs-6 d-block">Transitanto por</span>
              <strong className="fs-4 text-white">{currentStreetName}</strong>
            </div>
            <div className="waze-nav-stats d-flex gap-4">
              <div className="waze-nav-stat">
                <span className="label">TIEMPO</span>
                <span className="value">{remainingTime} <small>MIN</small></span>
              </div>
              <div className="waze-nav-stat">
                <span className="label">DISTANCIA</span>
                <span className="value">{remainingDistance} <small>KM</small></span>
              </div>
              <div className="waze-nav-stat highlight-speed">
                <span className="label">VELOCIDAD</span>
                <span className="value">{speed} <small>KM/H</small></span>
              </div>
            </div>
            <button className="btn btn-danger btn-waze-abort" onClick={handleStopNavigation}>
              <i className="fa-solid fa-circle-stop"></i> Finalizar
            </button>
          </div>
        )}

        {/* Layout principal: Mapa + Panel de Análisis */}
        <div className="rutas-main-layout">
          <div className="rutas-map-col">
            {loadingReports ? (
              <div className="rutas-loader">
                <div className="rutas-pulse"></div>
                <p>Cargando datos de seguridad cantonal…</p>
              </div>
            ) : (
              <SafeRouteMap
                origin={origin}
                destination={destination}
                onOriginChange={handleOriginChange}
                onDestinationChange={handleDestinationChange}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                liveLocation={liveLocation}
                reports={reports}
                selectionMode={selectionMode}
              />
            )}
          </div>

          <div className="rutas-ai-col">
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
