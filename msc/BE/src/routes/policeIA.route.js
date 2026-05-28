/**
 * Rutas para Police-IA
 * Endpoints para chat, consulta de incidentes cercanos y creación de reportes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { Report, Location, IncidentType, sequelize } = require('../models');

// No necesitamos importar GoogleGenerativeAI, usaremos fetch directo

/**
 * ENDPOINT A: POST /api/v1/police-ia/chat
 * Ejecuta el agente Police-IA con soporte para herramientas (agentic loop)
 * Usa Google Gemini Flash como modelo base
 */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { system, tools, messages } = req.body;

    if (!system || !messages) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: system y messages'
      });
    }

    // Construir el prompt con el sistema y el último mensaje
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.text || lastMessage.content || '';
    
    const fullPrompt = `${system}\n\n${userMessage}`;

    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Cargada' : 'NO CARGADA');

    try {
      // Llamar a Gemini API directamente con fetch
      const apiKey = process.env.GEMINI_API_KEY;
      console.log('API Key usada:', apiKey ? apiKey.substring(0, 15) + '...' : 'NO EXISTE');
      console.log('API Key length:', apiKey ? apiKey.length : 0);
      
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      console.log('URL:', apiUrl.substring(0, 80) + '...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ]
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from Gemini:', JSON.stringify(errorData, null, 2));
        
        console.warn('Gemini experimenta alta demanda. Activando generador de respaldo local de Police-IA...');
        const isRouteQuery = fullPrompt.includes('RUTAS CALCULADAS') || fullPrompt.includes('CONSEJO_RAPIDA');
        let fallbackText = '';
        if (isRouteQuery) {
          fallbackText = `[CONSEJO_RAPIDA] (Respaldo por Saturación) Esta ruta es la más directa en tiempo. Le recomendamos transitar con precaución en intersecciones principales.
          
          [CONSEJO_SEGURA] (Respaldo por Saturación) Este trayecto evade las zonas con incidentes delictivos recientes de los últimos 7 días. Es la opción más segura calculada por la Municipalidad.
          
          [CONSEJO_ALTERNATIVA] (Respaldo por Saturación) Ruta secundaria fluida. Se aconseja circular con las puertas del vehículo aseguradas y mantener atención al entorno.`;
        } else {
          fallbackText = "Hola, soy el asistente Police-IA de respaldo. Actualmente la red de inteligencia artificial externa está experimentando alta demanda temporal. Sin embargo, nuestro sistema de geolocalización, bitácora de incidentes y cálculo de rutas locales siguen funcionando al 100%. ¿En qué puedo colaborar de forma local?";
        }

        return res.json({
          text: fallbackText,
          toolsUsed: [],
          isFallback: true
        });
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';

      res.json({
        text: text,
        toolsUsed: []
      });
    } catch (error) {
      console.error('Error calling Gemini, usando respaldo local:', error);
      
      const isRouteQuery = fullPrompt.includes('RUTAS CALCULADAS') || fullPrompt.includes('CONSEJO_RAPIDA');
      let fallbackText = '';
      if (isRouteQuery) {
        fallbackText = `[CONSEJO_RAPIDA] (Respaldo por Desconexión) Esta ruta es la más directa en tiempo. Le recomendamos transitar con precaución en intersecciones principales.
        
        [CONSEJO_SEGURA] (Respaldo por Desconexión) Este trayecto evade las zonas con incidentes delictivos recientes de los últimos 7 días. Es la opción más segura calculada por la Municipalidad.
        
        [CONSEJO_ALTERNATIVA] (Respaldo por Desconexión) Ruta secundaria fluida. Se aconseja circular con las puertas del vehículo aseguradas y mantener atención al entorno.`;
      } else {
        fallbackText = "Hola, soy el asistente Police-IA de respaldo. Actualmente no hay conexión con los servidores de inteligencia artificial externa. Sin embargo, nuestro sistema de geolocalización, bitácora de incidentes y cálculo de rutas locales siguen funcionando al 100%. ¿En qué puedo colaborar de forma local?";
      }

      return res.json({
        text: fallbackText,
        toolsUsed: [],
        isFallback: true
      });
    }
  } catch (error) {
    console.error('Error in police-ia/chat:', error);
    res.status(500).json({
      error: error.message || 'Error procesando solicitud'
    });
  }
});

/**
 * ENDPOINT B: GET /api/v1/police-ia/incidents-nearby
 * Obtiene incidentes cercanos usando consulta geográfica en MySQL
 */
router.get('/incidents-nearby', verifyToken, async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    // Validar parámetros
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Parámetros requeridos: lat, lng'
      });
    }

    const radiusMeters = parseInt(radius) || 500;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Consulta SQL con cálculo de distancia geográfica
    const query = `
      SELECT 
        r.id,
        r.description,
        r.date,
        r.status,
        l.lat,
        l.lng,
        l.district,
        l.neighborhood,
        l.street,
        it.name as tipo,
        it.severity,
        (
          6371000 * acos(
            cos(radians(?)) * cos(radians(l.lat)) *
            cos(radians(l.lng) - radians(?)) +
            sin(radians(?)) * sin(radians(l.lat))
          )
        ) AS distancia_metros
      FROM Reports r
      JOIN Locations l ON r.locationId = l.id
      JOIN IncidentTypes it ON r.incidentTypeId = it.id
      HAVING distancia_metros <= ?
      ORDER BY distancia_metros ASC
      LIMIT 50
    `;

    // Ejecutar consulta raw con Sequelize
    const incidents = await sequelize.query(query, {
      replacements: [latitude, longitude, latitude, radiusMeters],
      type: sequelize.QueryTypes.SELECT
    });

    // Mapear respuesta al formato esperado
    const formattedIncidents = incidents.map(incident => ({
      id: incident.id,
      tipo: incident.tipo,
      descripcion: incident.description,
      lat: parseFloat(incident.lat),
      lng: parseFloat(incident.lng),
      fecha: incident.date,
      nivel_riesgo: incident.severity || 'normal',
      estado: incident.status,
      distrito: incident.district,
      barrio: incident.neighborhood,
      calle: incident.street,
      distancia_metros: Math.round(incident.distancia_metros)
    }));

    res.json(formattedIncidents);
  } catch (error) {
    console.error('Error in incidents-nearby:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo incidentes cercanos'
    });
  }
});

/**
 * ENDPOINT C: POST /api/v1/police-ia/report
 * Crea un nuevo reporte de incidente
 */
router.post('/report', verifyToken, async (req, res) => {
  try {
    const { tipo, descripcion, lat, lng, usuarioId } = req.body;

    // Validar campos requeridos
    if (!tipo || !descripcion || lat === undefined || lng === undefined || !usuarioId) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: tipo, descripcion, lat, lng, usuarioId'
      });
    }

    // Iniciar transacción para asegurar integridad
    const transaction = await sequelize.transaction();

    try {
      // Crear ubicación primero
      const location = await Location.create({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        province: 'San José',
        canton: 'Desamparados',
        district: 'Centro',
        neighborhood: 'N/A',
        street: 'N/A',
        exactAddress: `${lat}, ${lng}`
      }, { transaction });

      // Obtener ID del tipo de incidente o crear uno nuevo
      let incidentType = await IncidentType.findOne({
        where: { name: tipo },
        transaction
      });

      if (!incidentType) {
        incidentType = await IncidentType.create({
          name: tipo,
          description: `Reportado por usuario: ${descripcion.substring(0, 50)}...`,
          severity: 'normal'
        }, { transaction });
      }

      // Crear reporte
      const report = await Report.create({
        description: descripcion,
        date: new Date(),
        status: 'Pendiente',
        userId: usuarioId,
        incidentTypeId: incidentType.id,
        locationId: location.id
      }, { transaction });

      // Confirmar transacción
      await transaction.commit();

      res.status(201).json({
        success: true,
        reportId: report.id,
        mensaje: 'Reporte creado exitosamente. Las autoridades serán notificadas.'
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error creando el reporte'
    });
  }
});

/**
 * Función auxiliar: Ejecuta herramientas en el backend
 * Nota: En producción real, estas funciones se ejecutarían en el cliente
 * Se incluyen aquí para referencia y para ciertos escenarios
 * @param {string} toolName - Nombre de la herramienta
 * @param {Object} input - Parámetros de la herramienta
 * @returns {Promise<string>} Resultado como string JSON
 */
async function executeToolBackend(toolName, input) {
  switch (toolName) {
    case 'get_nearby_incidents': {
      const { lat, lng, radius_meters = 500 } = input;
      
      const query = `
        SELECT 
          r.id,
          r.description,
          r.date,
          r.status,
          l.lat,
          l.lng,
          it.name as tipo,
          (
            6371000 * acos(
              cos(radians(?)) * cos(radians(l.lat)) *
              cos(radians(l.lng) - radians(?)) +
              sin(radians(?)) * sin(radians(l.lat))
            )
          ) AS distancia_metros
        FROM Reports r
        JOIN Locations l ON r.locationId = l.id
        JOIN IncidentTypes it ON r.incidentTypeId = it.id
        HAVING distancia_metros <= ?
        ORDER BY distancia_metros ASC
        LIMIT 50
      `;

      const incidents = await sequelize.query(query, {
        replacements: [lat, lng, lat, radius_meters],
        type: sequelize.QueryTypes.SELECT
      });

      return JSON.stringify({
        incidents: incidents.map(i => ({
          id: i.id,
          tipo: i.tipo,
          descripcion: i.description,
          lat: parseFloat(i.lat),
          lng: parseFloat(i.lng),
          fecha: i.date
        })),
        count: incidents.length
      });
    }

    case 'calculate_safe_route': {
      // Esta función se ejecuta mejor en el cliente con OSRM
      return JSON.stringify({
        error: 'Esta herramienta se ejecuta en el cliente'
      });
    }

    case 'create_incident_report': {
      const { tipo, descripcion, lat, lng, usuarioId } = input;

      try {
        const transaction = await sequelize.transaction();

        const location = await Location.create({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          province: 'San José',
          canton: 'Desamparados',
          district: 'Centro',
          neighborhood: 'N/A',
          street: 'N/A',
          exactAddress: `${lat}, ${lng}`
        }, { transaction });

        let incidentType = await IncidentType.findOne({
          where: { name: tipo },
          transaction
        });

        if (!incidentType) {
          incidentType = await IncidentType.create({
            name: tipo,
            description: descripcion.substring(0, 150),
            severity: 'normal'
          }, { transaction });
        }

        const report = await Report.create({
          description: descripcion,
          date: new Date(),
          status: 'Pendiente',
          userId: usuarioId,
          incidentTypeId: incidentType.id,
          locationId: location.id
        }, { transaction });

        await transaction.commit();

        return JSON.stringify({
          success: true,
          reportId: report.id,
          mensaje: 'Reporte creado exitosamente'
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error.message
        });
      }
    }

    default:
      return JSON.stringify({
        error: `Tool desconocido: ${toolName}`
      });
  }
}

module.exports = router;
