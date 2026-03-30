import React from 'react';
import '../styles/RutasSeguras.css';

// ============================================================================
// AIRouteAnalysis – Panel lateral de análisis de seguridad
// ============================================================================
const AIRouteAnalysis = ({
  origen,
  destino,
  analizando,
  resultadoAnalisis,
  recomendaciones,
  modoSeleccion,
  onSeleccionarOrigen,
  onSeleccionarDestino,
  onCalcularRuta,
  onLimpiar,
  infoRuta,
}) => {

  // ── Estado: sin puntos ─────────────────────────────────────────────────────
  if (!origen && !destino && modoSeleccion === null) {
    return (
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-badge">
            <i className="fa-solid fa-robot"></i> Asistente de Seguridad Vial
          </div>
          <h2>Planificador de Rutas Seguras</h2>
          <p className="ai-subtitle">Selecciona tu origen y destino para analizar la seguridad del recorrido.</p>
        </div>

        <div className="step-cards">
          <button className="step-card step-origen" onClick={onSeleccionarOrigen}>
            <div className="step-icon-wrap green">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div className="step-info">
              <span className="step-label">Paso 1</span>
              <span className="step-title">Marcar Origen</span>
              <span className="step-desc">Haz clic aquí y luego selecciona en el mapa</span>
            </div>
            <i className="fa-solid fa-chevron-right step-arrow"></i>
          </button>

          <button className="step-card step-destino" onClick={onSeleccionarDestino} disabled={!origen}>
            <div className={`step-icon-wrap ${origen ? 'red' : 'gray'}`}>
              <i className="fa-solid fa-flag-checkered"></i>
            </div>
            <div className="step-info">
              <span className="step-label">Paso 2</span>
              <span className="step-title">Marcar Destino</span>
              <span className="step-desc">{origen ? 'Haz clic aquí y luego selecciona en el mapa' : 'Primero marca el origen'}</span>
            </div>
            <i className="fa-solid fa-chevron-right step-arrow"></i>
          </button>
        </div>

        <div className="ai-tip">
          <i className="fa-solid fa-lightbulb"></i>
          <span>Los incidentes visibles en el mapa son reportes ciudadanos reales de los últimos 7 días.</span>
        </div>
      </aside>
    );
  }

  // ── Estado: seleccionando punto ────────────────────────────────────────────
  if (modoSeleccion !== null) {
    return (
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-badge selecting">
            <i className="fa-solid fa-crosshairs"></i> Modo Selección Activo
          </div>
          <h2>{modoSeleccion === 'origen' ? '📍 Seleccionando Origen' : '🏁 Seleccionando Destino'}</h2>
          <p className="ai-subtitle">
            {modoSeleccion === 'origen'
              ? 'Haz clic en el mapa en tu punto de partida (A).'
              : 'Haz clic en el mapa en tu punto de llegada (B).'}
          </p>
        </div>
        <div className="map-ping-animation">
          <div className="ping-circle"></div>
          <i className="fa-solid fa-location-crosshairs ping-icon"></i>
        </div>
        <button className="btn-cancelar" onClick={onLimpiar}>
          <i className="fa-solid fa-xmark"></i> Cancelar
        </button>
      </aside>
    );
  }

  // ── Estado: puntos marcados, listo para calcular ───────────────────────────
  if (origen && destino && !resultadoAnalisis && !analizando) {
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
              <span className="punto-coords">{origen[0].toFixed(4)}, {origen[1].toFixed(4)}</span>
            </div>
          </div>
          <div className="puntos-linea"></div>
          <div className="punto-item">
            <div className="punto-dot red"></div>
            <div>
              <span className="punto-label">Destino (B)</span>
              <span className="punto-coords">{destino[0].toFixed(4)}, {destino[1].toFixed(4)}</span>
            </div>
          </div>
        </div>

        <button className="btn-analizar" onClick={onCalcularRuta}>
          <i className="fa-solid fa-magnifying-glass-chart"></i>
          Analizar Seguridad de la Ruta
        </button>
        <button className="btn-cancelar" onClick={onLimpiar}>
          <i className="fa-solid fa-rotate-left"></i> Nueva Consulta
        </button>
      </aside>
    );
  }

  // ── Estado: analizando ─────────────────────────────────────────────────────
  if (analizando) {
    return (
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-badge analyzing">
            <i className="fa-solid fa-spinner fa-spin"></i> Analizando…
          </div>
          <h2>Procesando Ruta</h2>
        </div>
        <div className="analyzing-steps">
          {[
            { ico: 'fa-road', text: 'Calculando trayecto…' },
            { ico: 'fa-database', text: 'Consultando incidentes…' },
            { ico: 'fa-brain', text: 'Generando análisis de seguridad…' },
          ].map((s, i) => (
            <div key={i} className="analyzing-step" style={{ animationDelay: `${i * 0.3}s` }}>
              <i className={`fa-solid ${s.ico}`}></i>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // ── Estado: resultado del análisis ────────────────────────────────────────
  if (resultadoAnalisis) {
    const { nivelRiesgo, colorRiesgo, iconRiesgo, incidentesCercanos, total } = resultadoAnalisis;
    return (
      <aside className="ai-panel resultado">
        <div className="ai-panel-header">
          <div className="ai-badge" style={{ background: `${colorRiesgo}22`, color: colorRiesgo, borderColor: `${colorRiesgo}44` }}>
            <i className={`fa-solid ${iconRiesgo}`}></i> Análisis Completado
          </div>
          <h2>Resultado del Análisis</h2>
        </div>

        {/* Info de la ruta */}
        {infoRuta && (
          <div className="ruta-info-chips">
            <div className="chip"><i className="fa-solid fa-ruler"></i> {infoRuta.distanciaKm} km</div>
            <div className="chip"><i className="fa-solid fa-clock"></i> ~{infoRuta.duracionMin} min</div>
            {infoRuta.simulada && <div className="chip chip-warn"><i className="fa-solid fa-triangle-exclamation"></i> Ruta aproximada</div>}
          </div>
        )}

        {/* Badge nivel riesgo */}
        <div className="riesgo-badge" style={{ '--riesgo-color': colorRiesgo }}>
          <i className={`fa-solid ${iconRiesgo}`}></i>
          <div>
            <span className="riesgo-nivel">{nivelRiesgo}</span>
            <span className="riesgo-sub">{total} incidente{total !== 1 ? 's' : ''} cerca del trayecto</span>
          </div>
        </div>

        {/* Incidentes detectados */}
        {incidentesCercanos.length > 0 && (
          <div className="incidentes-section">
            <h4><i className="fa-solid fa-triangle-exclamation"></i> Incidentes Detectados</h4>
            <div className="incidentes-scroll">
              {incidentesCercanos.map((inc, i) => (
                <div key={i} className="incidente-card">
                  <div className="incidente-tipo">{inc.tipo || 'Incidente'}</div>
                  <div className="incidente-meta">
                    <span><i className="fa-solid fa-location-pin"></i> {inc.barrio || inc.distrito}</span>
                    <span><i className="fa-solid fa-arrows-left-right"></i> ~{inc.distanciaMetros}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        <div className="recomendaciones-section">
          
          <div className="recomendaciones-list">
            {recomendaciones.map((rec, i) => (
              <div key={i} className="recomendacion-item" style={{ '--rec-color': rec.color }}>
                <i className={`fa-solid ${rec.icono}`}></i>
                <span>{rec.texto}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-cancelar" onClick={onLimpiar}>
          <i className="fa-solid fa-rotate-left"></i> Nueva Consulta
        </button>
      </aside>
    );
  }

  return null;
};

export default AIRouteAnalysis;
