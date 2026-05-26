import React from 'react';
import policeIAImage from '../agents/ChatGPT Image 23 may 2026, 09_16_36.png';
import '../styles/SafeRoutes.css';

/**
 * AIRouteAnalysis – Panel lateral de análisis de seguridad asistido.
 * Proporciona pestañas tipo Waze para seleccionar rutas, asesoramiento
 * personalizado de Gemini, y controles de navegación en vivo/simulada.
 */
const AIRouteAnalysis = ({
  origin,
  destination,
  analyzing,
  routes = [],
  selectedRouteId = null,
  onSelectRoute,
  aiAdvisories = null,
  navigationActive = false,
  simulating = false,
  onStartNavigation,
  onStopNavigation,
  selectionMode,
  onSelectOrigin,
  onSelectDestination,
  onCalculateRoute,
  onClear,
}) => {

  // ── Estado Inicial: Sin puntos seleccionados ───────────────────────────────
  if (!origin && !destination && selectionMode === null) {
    return (
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-badge">
            <i className="fa-solid fa-robot"></i> Asistente de Seguridad Vial
          </div>
          <h2>Planificador de Rutas Waze</h2>
          <p className="ai-subtitle">Selecciona tu origen y destino en Desamparados para analizar y asesorarte con la IA.</p>
        </div>

        <div className="step-cards">
          <button className="step-card step-origen" onClick={onSelectOrigin}>
            <div className="step-icon-wrap green">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div className="step-info">
              <span className="step-label">Paso 1</span>
              <span className="step-title">Marcar Origen</span>
              <span className="step-desc">Busca una dirección o haz clic en el mapa</span>
            </div>
            <i className="fa-solid fa-chevron-right step-arrow"></i>
          </button>

          <button className="step-card step-destino" onClick={onSelectDestination} disabled={!origin}>
            <div className={`step-icon-wrap ${origin ? 'red' : 'gray'}`}>
              <i className="fa-solid fa-flag-checkered"></i>
            </div>
            <div className="step-info">
              <span className="step-label">Paso 2</span>
              <span className="step-title">Marcar Destino</span>
              <span className="step-desc">{origin ? 'Busca una dirección o haz clic en el mapa' : 'Primero marca el origen'}</span>
            </div>
            <i className="fa-solid fa-chevron-right step-arrow"></i>
          </button>
        </div>

        <div className="ai-tip">
          <i className="fa-solid fa-lightbulb"></i>
          <span>Puedes presionar el botón "Ubicación GPS" en la esquina superior derecha para centrar tu ubicación real.</span>
        </div>
      </aside>
    );
  }

  // ── Estado: Selección Activa en el Mapa ────────────────────────────────────
  if (selectionMode !== null) {
    return (
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-badge selecting">
            <i className="fa-solid fa-crosshairs"></i> Modo Selección Activo
          </div>
          <h2>{selectionMode === 'origin' ? '📍 Seleccionando Origen' : '🏁 Seleccionando Destino'}</h2>
          <p className="ai-subtitle">
            {selectionMode === 'origin'
              ? 'Haz clic en el mapa en tu punto de partida (A).'
              : 'Haz clic en el mapa en tu punto de llegada (B).'}
          </p>
        </div>
        <div className="map-ping-animation">
          <div className="ping-circle"></div>
          <i className="fa-solid fa-location-crosshairs ping-icon"></i>
        </div>
        <button className="btn-cancelar" onClick={onClear}>
          <i className="fa-solid fa-xmark"></i> Cancelar
        </button>
      </aside>
    );
  }

  // ── Estado: Puntos marcados, listo para procesar ───────────────────────────
  if (origin && destination && routes.length === 0 && !analyzing) {
    return (
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-badge ready">
            <i className="fa-solid fa-circle-check"></i> Puntos Listos
          </div>
          <h2>Ruta Configurada</h2>
        </div>

        <div className="puntos-resumen">
          <div className="punto-item">
            <div className="punto-dot green"></div>
            <div>
              <span className="punto-label">Origen (A)</span>
              <span className="punto-coords">{origin[0].toFixed(4)}, {origin[1].toFixed(4)}</span>
            </div>
          </div>
          <div className="puntos-linea"></div>
          <div className="punto-item">
            <div className="punto-dot red"></div>
            <div>
              <span className="punto-label">Destino (B)</span>
              <span className="punto-coords">{destination[0].toFixed(4)}, {destination[1].toFixed(4)}</span>
            </div>
          </div>
        </div>

        <button className="btn-analizar" onClick={onCalculateRoute}>
          <i className="fa-solid fa-magnifying-glass-chart"></i>
          Calcular y Analizar Seguridad
        </button>
        <button className="btn-cancelar" onClick={onClear}>
          <i className="fa-solid fa-rotate-left"></i> Nueva Consulta
        </button>
      </aside>
    );
  }

  // ── Estado: Analizando ruta e incidentes ───────────────────────────────────
  if (analyzing) {
    return (
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-badge analyzing">
            <i className="fa-solid fa-spinner fa-spin"></i> Analizando…
          </div>
          <h2>Procesando Rutas Waze</h2>
        </div>
        <div className="analyzing-steps">
          {[
            { ico: 'fa-route', text: 'Trazando 3 rutas alternativas…' },
            { ico: 'fa-database', text: 'Analizando reportes de delincuencia…' },
            { ico: 'fa-brain', text: 'Conectando con Gemini AI Agent…' },
          ].map((step, index) => (
            <div key={index} className="analyzing-step" style={{ animationDelay: `${index * 0.3}s` }}>
              <i className={`fa-solid ${step.ico}`}></i>
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // ── Estado: Rutas Calculadas (Visualización y Navegación) ─────────────────
  if (routes.length > 0) {
    const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
    const { riskLevel, riskColor, riskIcon, nearbyIncidents = [], totalIncidents = 0 } = selectedRoute;

    // Obtener el consejo de la IA para la ruta seleccionada actual
    const currentAdvice = aiAdvisories ? aiAdvisories[selectedRouteId] : null;

    return (
      <aside className="ai-panel resultado">
        {/* Selector de Rutas Estilo Waze */}
        {!navigationActive && (
          <div className="waze-route-selector mb-4">
            <h4 className="text-white fs-6 mb-3"><i className="fa-solid fa-layer-group"></i> Selecciona una ruta:</h4>
            <div className="waze-route-cards-container d-flex flex-column gap-2">
              {routes.map(r => {
                const active = r.id === selectedRouteId;
                return (
                  <button
                    key={r.id}
                    className={`waze-route-card ${active ? 'active' : ''}`}
                    onClick={() => onSelectRoute(r.id)}
                    style={{ borderLeftColor: r.riskColor }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="route-name">{r.name}</span>
                      <span className="route-tag badge" style={{ backgroundColor: `${r.riskColor}25`, color: r.riskColor }}>
                        {r.tag}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center text-muted">
                      <div className="route-stats">
                        <strong className="text-white">{r.durationMin} min</strong>
                        <span className="mx-2">•</span>
                        <span>{r.distanceKm} km</span>
                      </div>
                      <span className="route-risk" style={{ color: r.riskColor }}>
                        <i className={`fa-solid ${r.riskIcon}`}></i> Riesgo {r.riskLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumen de la Ruta Seleccionada */}
        <div className="selected-route-header-wrap p-3 mb-3 rounded border border-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <h3 className="fs-5 text-white mb-2">{selectedRoute.name} <small className="text-muted">({selectedRoute.tag})</small></h3>
          <div className="d-flex gap-3 mb-3">
            <div className="badge bg-secondary px-3 py-2"><i className="fa-solid fa-ruler"></i> {selectedRoute.distanceKm} km</div>
            <div className="badge bg-primary px-3 py-2"><i className="fa-solid fa-clock"></i> ~{selectedRoute.durationMin} min</div>
            <div className="badge px-3 py-2" style={{ backgroundColor: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}55` }}>
              <i className={`fa-solid ${riskIcon}`}></i> Riesgo {riskLevel}
            </div>
          </div>

          {/* Indicador de Nivel de Riesgo */}
          <div className="riesgo-badge mb-0" style={{ '--riesgo-color': riskColor }}>
            <i className={`fa-solid ${riskIcon}`}></i>
            <div>
              <span className="riesgo-nivel">Seguridad: {riskLevel}</span>
              <span className="riesgo-sub">{totalIncidents} incidente{totalIncidents !== 1 ? 's' : ''} cerca de la vía</span>
            </div>
          </div>
        </div>

        {/* Asesoramiento Personalizado de Gemini AI */}
        <div className="ai-route-advisory-card mb-3 p-3 rounded" style={{
          backgroundColor: 'rgba(249, 115, 22, 0.05)',
          borderLeft: '4px solid #F97316',
          boxShadow: '0 4px 12px rgba(249,115,22,0.05)'
        }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img 
                src={policeIAImage} 
                alt="Police-IA" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <strong className="text-primary-orange text-uppercase letter-spacing-1 fs-6">Soy su asesor Police-IA</strong>
          </div>
          
          {currentAdvice ? (
            <p className="text-light mb-0 fs-6 lh-base" style={{ fontStyle: 'italic' }}>
              "{currentAdvice}"
            </p>
          ) : (
            <div className="d-flex align-items-center gap-2 text-muted">
              <i className="fa-solid fa-spinner fa-spin text-primary-orange"></i>
              <span>Police-IA redactando asesoría de seguridad vial...</span>
            </div>
          )}
        </div>

        {/* Botones de Navegación Tipo Waze */}
        {!navigationActive ? (
          <div className="waze-action-navigation-buttons d-flex flex-column gap-2 mb-3">
            <button className="btn btn-success w-100 fw-bold py-2 fs-6 d-flex align-items-center justify-content-center gap-2"
              onClick={() => onStartNavigation(false)}
              style={{ backgroundColor: '#00C853', borderColor: '#00C853' }}
            >
              <i className="fa-solid fa-location-arrow"></i> Iniciar Navegación GPS
            </button>
            <button className="btn btn-outline-info w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2"
              onClick={() => onStartNavigation(true)}
            >
              <i className="fa-solid fa-play"></i> Simular Recorrido (Waze Demo)
            </button>
          </div>
        ) : (
          <div className="active-nav-panel-alert p-3 rounded text-center mb-3" style={{ backgroundColor: 'rgba(0,200,83,0.1)', border: '1px dashed #00C853' }}>
            {simulating ? (
              <span className="badge bg-success fa-fade mb-2"><i className="fa-solid fa-truck-moving"></i> Simulando Movimiento Waze</span>
            ) : (
              <span className="badge bg-info mb-2"><i className="fa-solid fa-satellite-dish"></i> GPS en Vivo Conectado</span>
            )}
            <p className="text-light mb-2"><small>El mapa está actualizando tu marcador y las estadísticas en tiempo real.</small></p>
            <button className="btn btn-danger btn-sm w-100" onClick={onStopNavigation}>
              <i className="fa-solid fa-circle-stop"></i> Finalizar Viaje
            </button>
          </div>
        )}

        {/* Lista de incidentes específicos detectados */}
        {!navigationActive && nearbyIncidents.length > 0 && (
          <div className="incidentes-section mb-3">
            <h4><i className="fa-solid fa-triangle-exclamation text-danger"></i> Incidentes en esta ruta ({nearbyIncidents.length})</h4>
            <div className="incidentes-scroll" style={{ maxHeight: '140px' }}>
              {nearbyIncidents.map((incident, index) => (
                <div key={index} className="incidente-card">
                  <div className="incidente-tipo text-danger">{incident.tipo || 'Incidente'}</div>
                  <div className="incidente-meta">
                    <span><i className="fa-solid fa-location-pin"></i> {incident.barrio || incident.distrito}</span>
                    <span><i className="fa-solid fa-arrows-left-right"></i> ~{incident.distanceMeters}m de la ruta</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!navigationActive && (
          <button className="btn-cancelar w-100" onClick={onClear}>
            <i className="fa-solid fa-rotate-left"></i> Cambiar Puntos (A/B)
          </button>
        )}
      </aside>
    );
  }

  return null;
};

export default AIRouteAnalysis;

