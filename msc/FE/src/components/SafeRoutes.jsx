import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import SafeRouteMap from '../components/SafeRouteMap';
import AIRouteAnalysis from '../components/AIRouteAnalysis';
import ReportService from '../services/ReportService';
import RouteService from '../services/RouteService';
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

  const [origin, setOrigin] = useState(null); // [lat, lng]
  const [destination, setDestination] = useState(null); // [lat, lng]
  const [originLabel, setOriginLabel] = useState('');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [selectionMode, setSelectionMode] = useState(null); // 'origin' | 'destination' | null
  const [travelMode, setTravelMode] = useState('Auto'); // 'Auto' | 'Motocicleta' | 'Peatón'

  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeColor, setRouteColor] = useState('#4CAF50');
  const [routeInfo, setRouteInfo] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

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
  }, []);

  // ── Handlers para selección de puntos ──────────────────────────────────────────────
  const handleSelectOrigin = () => setSelectionMode('origin');
  const handleSelectDestination = () => setSelectionMode('destination');

  const handleOriginChange = useCallback((point, label) => {
    setOrigin(point);
    if (label) setOriginLabel(label);
    setSelectionMode(null);
    setAnalysisResult(null);
    setRouteCoordinates(null);
    setRouteInfo(null);
  }, []);

  const handleDestinationChange = useCallback((point, label) => {
    setDestination(point);
    if (label) setDestinationLabel(label);
    setSelectionMode(null);
    setAnalysisResult(null);
    setRouteCoordinates(null);
    setRouteInfo(null);
  }, []);

  // ── Calcular ruta y realizar análisis de seguridad ──────────────────────────────
  const handleCalculateRoute = async () => {
    if (!origin || !destination) return;
    setIsAnalyzing(true);

    try {
      // 1. Calcular ruta mediante el servicio
      const route = await RouteService.calculateRoute(origin, destination, false, travelMode);
      setRouteCoordinates(route.coordinates);
      setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, simulated: route.simulated });

      // 2. Analizar riesgos en la ruta calculada
      const analysis = RouteService.analyzeRouteRisk(route.coordinates, reports, 350);

      // 3. Definir color de la ruta según el nivel de riesgo
      setRouteColor(analysis.riskColor);

      // 4. Generar recomendaciones de seguridad
      const recs = RouteService.generateRecommendations(analysis.nearbyIncidents, analysis.riskLevel);

      setAnalysisResult(analysis);
      setRecommendations(recs);
    } catch (e) {
      console.error('Error calculando ruta:', e);
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
    setRouteCoordinates(null);
    setRouteColor('#4CAF50');
    setRouteInfo(null);
    setAnalysisResult(null);
    setRecommendations([]);
  };

  return (
    <div className="rutas-page">
      <Navbar />

      <div className="rutas-content">
        <header className="rutas-header">
          <h1>Rutas Seguras</h1>
          <p>Analiza la seguridad de tu trayecto con base en incidentes ciudadanos reales.</p>
        </header>

        {/* Barra de búsqueda y selección de modo de viaje */}
        <div className="rutas-search-bar">
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

            {origin && destination && !analysisResult && !isAnalyzing && (
              <button className="ctrl-btn-analizar w-100" onClick={handleCalculateRoute}>
                <i className="fa-solid fa-magnifying-glass-chart"></i> Analizar Ruta
              </button>
            )}
            {isAnalyzing && (
              <button className="ctrl-btn-analizar w-100" disabled>
                <i className="fa-solid fa-spinner fa-spin"></i> Analizando…
              </button>
            )}
            {analysisResult && (
              <button className="ctrl-btn-analizar w-100 btn-limpiar" onClick={handleClear}>
                <i className="fa-solid fa-trash-can"></i> Limpiar Ruta
              </button>
            )}
          </div>
        </div>

        {/* Layout principal: Mapa + Panel de Análisis */}
        <div className="rutas-main-layout">
          <div className="rutas-map-col">
            {loadingReports ? (
              <div className="rutas-loader">
                <div className="rutas-pulse"></div>
                <p>Cargando datos de seguridad…</p>
              </div>
            ) : (
              <SafeRouteMap
                origin={origin}
                destination={destination}
                onOriginChange={handleOriginChange}
                onDestinationChange={handleDestinationChange}
                routeCoordinates={routeCoordinates}
                routeColor={routeColor}
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
              analysisResult={analysisResult}
              recommendations={recommendations}
              selectionMode={selectionMode}
              onSelectOrigin={handleSelectOrigin}
              onSelectDestination={handleSelectDestination}
              onCalculateRoute={handleCalculateRoute}
              onClear={handleClear}
              routeInfo={routeInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeRoutes;
