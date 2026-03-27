import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import SafeRouteMap from '../components/SafeRouteMap';
import AIRouteAnalysis from '../components/AIRouteAnalysis';
import ServiceReportes from '../services/ServiceReportes';
import ServiceRutas from '../services/ServiceRutas';
import '../styles/RutasSeguras.css';

// ── Componente: campo de búsqueda de dirección con autocomplete ────────────────
const AddressSearch = ({ placeholder, onSelect, value, colorClass }) => {
  const [query,       setQuery]       = useState(value || '');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando,    setBuscando]    = useState(false);
  const [mostrar,     setMostrar]     = useState(false);
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // Actualiza el campo si el valor externo cambia (ej. al limpiar)
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Cierra el dropdown si se hace click fuera
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setMostrar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timeoutRef.current);
    if (val.length < 3) { setSugerencias([]); setMostrar(false); return; }
    timeoutRef.current = setTimeout(async () => {
      setBuscando(true);
      const resultados = await ServiceRutas.buscarDireccion(val);
      setSugerencias(resultados);
      setMostrar(resultados.length > 0);
      setBuscando(false);
    }, 450);
  };

  const handleSelect = (sug) => {
    setQuery(sug.label);
    setSugerencias([]);
    setMostrar(false);
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
          onFocus={() => sugerencias.length > 0 && setMostrar(true)}
          autoComplete="off"
        />
        {buscando && <i className="fa-solid fa-spinner fa-spin addr-spinner"></i>}
        {query && !buscando && (
          <button className="addr-clear" onClick={() => { setQuery(''); setSugerencias([]); setMostrar(false); }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>
      {mostrar && (
        <ul className="address-dropdown">
          {sugerencias.map((s, i) => (
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

const RutSeguras = () => {
  const [reportes, setReportes]             = useState([]);
  const [loadingReportes, setLoadingReportes] = useState(true);

  const [origen,  setOrigen]  = useState(null);   // [lat, lng]
  const [destino, setDestino] = useState(null);   // [lat, lng]
  const [origenLabel,  setOrigenLabel]  = useState('');
  const [destinoLabel, setDestinoLabel] = useState('');
  const [modoSeleccion, setModoSeleccion] = useState(null); // 'origen' | 'destino' | null
  const [modoViaje, setModoViaje] = useState('Auto'); // 'Auto' | 'Motocicleta' | 'Peatón'

  const [rutaCoordenadas, setRutaCoordenadas] = useState(null);
  const [rutaColor,       setRutaColor]       = useState('#4CAF50');
  const [infoRuta,        setInfoRuta]        = useState(null);

  const [analizando,        setAnalizando]        = useState(false);
  const [resultadoAnalisis, setResultadoAnalisis] = useState(null);
  const [recomendaciones,   setRecomendaciones]   = useState([]);

  // ── Cargar reportes del backend ─────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await ServiceReportes.getReportes();
        const hoy = new Date();
        const unaSemanaAtras = new Date();
        unaSemanaAtras.setDate(hoy.getDate() - 7);
        const recientes = (data || []).filter(r => {
          if (!r.fecha) return false;
          return new Date(r.fecha) >= unaSemanaAtras;
        });
        setReportes(recientes);
      } catch (e) {
        console.error('Error cargando reportes:', e);
      } finally {
        setLoadingReportes(false);
      }
    };
    cargar();
  }, []);

  // ── Selección de puntos ─────────────────────────────────────────────────
  const handleSeleccionarOrigen  = () => setModoSeleccion('origen');
  const handleSeleccionarDestino = () => setModoSeleccion('destino');

  const handleOrigenChange = useCallback((punto, label) => {
    setOrigen(punto);
    if (label) setOrigenLabel(label);
    setModoSeleccion(null);
    setResultadoAnalisis(null);
    setRutaCoordenadas(null);
    setInfoRuta(null);
  }, []);

  const handleDestinoChange = useCallback((punto, label) => {
    setDestino(punto);
    if (label) setDestinoLabel(label);
    setModoSeleccion(null);
    setResultadoAnalisis(null);
    setRutaCoordenadas(null);
    setInfoRuta(null);
  }, []);

  // ── Calcular ruta y analizar ────────────────────────────────────────────
  const handleCalcularRuta = async () => {
    if (!origen || !destino) return;
    setAnalizando(true);

    try {
      // 1. Calcular ruta (con el modo de viaje seleccionado)
      const ruta = await ServiceRutas.calcularRuta(origen, destino, false, modoViaje);
      setRutaCoordenadas(ruta.coordenadas);
      setInfoRuta({ distanciaKm: ruta.distanciaKm, duracionMin: ruta.duracionMin, simulada: ruta.simulada });

      // 2. Analizar riesgo
      const analisis = ServiceRutas.analizarRiesgoEnRuta(ruta.coordenadas, reportes, 350);

      // 3. Color de la polilínea según riesgo
      setRutaColor(analisis.colorRiesgo);

      // 4. Generar recomendaciones
      const recs = ServiceRutas.generarRecomendaciones(analisis.incidentesCercanos, analisis.nivelRiesgo);

      setResultadoAnalisis(analisis);
      setRecomendaciones(recs);
    } catch (e) {
      console.error('Error calculando ruta:', e);
    } finally {
      setAnalizando(false);
    }
  };

  // ── Limpiar todo ────────────────────────────────────────────────────────
  const handleLimpiar = () => {
    setOrigen(null);
    setDestino(null);
    setOrigenLabel('');
    setDestinoLabel('');
    setModoSeleccion(null);
    setRutaCoordenadas(null);
    setRutaColor('#4CAF50');
    setInfoRuta(null);
    setResultadoAnalisis(null);
    setRecomendaciones([]);
  };

  return (
    <div className="rutas-page">
      <Navbar />

      <div className="rutas-content">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="rutas-header">
         
          <h1>Rutas Seguras</h1>
          <p>Analiza la seguridad de tu trayecto con base en incidentes ciudadanos reales.</p>
        </header>

        {/* ── Barra de búsqueda de dirección + botones ──────────────────── */}
        <div className="rutas-search-bar">
          {/* Origen */}
          <div className="search-row">
            <AddressSearch
              placeholder="Buscar dirección de origen…"
              colorClass="green"
              value={origenLabel}
              onSelect={(punto, label) => handleOrigenChange(punto, label)}
            />
            <button
              className={`ctrl-map-btn green ${modoSeleccion === 'origen' ? 'active' : ''}`}
              onClick={handleSeleccionarOrigen}
              title="Seleccionar en el mapa"
            >
              <i className="fa-solid fa-map-location-dot"></i>
              <span>Mapa</span>
            </button>
          </div>

          <div className="search-divider"><i className="fa-solid fa-arrow-down"></i></div>

          {/* Destino */}
          <div className="search-row">
            <AddressSearch
              placeholder="Buscar dirección de destino…"
              colorClass="red"
              value={destinoLabel}
              onSelect={(punto, label) => handleDestinoChange(punto, label)}
            />
            <button
              className={`ctrl-map-btn red ${modoSeleccion === 'destino' ? 'active' : ''}`}
              onClick={handleSeleccionarDestino}
              title="Seleccionar en el mapa"
            >
              <i className="fa-solid fa-map-location-dot"></i>
              <span>Mapa</span>
            </button>
          </div>

          {/* Acciones */}
          <div className="search-actions d-flex flex-column gap-3">
            <div className="btn-group w-100" role="group">
              <input type="radio" className="btn-check" name="modoViaje" id="btnAuto" autoComplete="off" checked={modoViaje === 'Auto'} onChange={(e) => setModoViaje('Auto')} />
              <label className="btn btn-outline-primary" htmlFor="btnAuto"><i className="fa-solid fa-car me-2"></i>Auto</label>

              <input type="radio" className="btn-check" name="modoViaje" id="btnMoto" autoComplete="off" checked={modoViaje === 'Motocicleta'} onChange={(e) => setModoViaje('Motocicleta')} />
              <label className="btn btn-outline-primary" htmlFor="btnMoto"><i className="fa-solid fa-motorcycle me-2"></i>Moto</label>

              <input type="radio" className="btn-check" name="modoViaje" id="btnPie" autoComplete="off" checked={modoViaje === 'Peatón'} onChange={(e) => setModoViaje('Peatón')} />
              <label className="btn btn-outline-primary" htmlFor="btnPie"><i className="fa-solid fa-person-walking me-2"></i>A Pie</label>
            </div>

            {origen && destino && !resultadoAnalisis && !analizando && (
              <button className="ctrl-btn-analizar w-100" onClick={handleCalcularRuta}>
                <i className="fa-solid fa-magnifying-glass-chart"></i> Analizar Ruta
              </button>
            )}
            {analizando && (
              <button className="ctrl-btn-analizar w-100" disabled>
                <i className="fa-solid fa-spinner fa-spin"></i> Analizando…
              </button>
            )}
            {resultadoAnalisis && (
              <button className="ctrl-btn-analizar w-100 btn-limpiar" onClick={handleLimpiar}>
                <i className="fa-solid fa-trash-can"></i> Limpiar Ruta
              </button>
            )}
          </div>
        </div>

        {/* ── Layout principal: mapa + panel IA ─────────────────────────── */}
        <div className="rutas-main-layout">
          {/* Mapa */}
          <div className="rutas-map-col">
            {loadingReportes ? (
              <div className="rutas-loader">
                <div className="rutas-pulse"></div>
                <p>Cargando datos de seguridad…</p>
              </div>
            ) : (
              <SafeRouteMap
                origen={origen}
                destino={destino}
                onOrigenChange={handleOrigenChange}
                onDestinoChange={handleDestinoChange}
                rutaCoordenadas={rutaCoordenadas}
                rutaColor={rutaColor}
                reportes={reportes}
                modoSeleccion={modoSeleccion}
              />
            )}
          </div>

          {/* Panel IA */}
          <div className="rutas-ai-col">
            <AIRouteAnalysis
              origen={origen}
              destino={destino}
              analizando={analizando}
              resultadoAnalisis={resultadoAnalisis}
              recomendaciones={recomendaciones}
              modoSeleccion={modoSeleccion}
              onSeleccionarOrigen={handleSeleccionarOrigen}
              onSeleccionarDestino={handleSeleccionarDestino}
              onCalcularRuta={handleCalcularRuta}
              onLimpiar={handleLimpiar}
              infoRuta={infoRuta}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RutSeguras;