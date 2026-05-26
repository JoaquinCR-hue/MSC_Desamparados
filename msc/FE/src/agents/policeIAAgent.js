/**
 * Agente Police-IA
 * Orquestador principal que gestiona la conversación con Claude y ejecución de tools
 */

import { getNearbyIncidents, calculateRiskLevel } from './tools/incidentsTool.js';
import { calculateSafeRoute } from './tools/routeTool.js';
import { createReport } from './tools/reportTool.js';

/**
 * Define las herramientas disponibles para Police-IA
 * Compatible con formato Anthropic API
 */
const TOOLS = [
  {
    name: 'get_nearby_incidents',
    description: 'Obtiene incidentes reportados cercanos a una ubicación GPS. Útil para determinar el nivel de riesgo en una zona.',
    input_schema: {
      type: 'object',
      properties: {
        lat: {
          type: 'number',
          description: 'Latitud de la ubicación'
        },
        lng: {
          type: 'number',
          description: 'Longitud de la ubicación'
        },
        radius_meters: {
          type: 'integer',
          description: 'Radio de búsqueda en metros (default: 500)'
        }
      },
      required: ['lat', 'lng']
    }
  },
  {
    name: 'calculate_safe_route',
    description: 'Calcula una ruta segura entre dos puntos, analizando zonas de riesgo y sugiriendo rutas alternativas si es necesario.',
    input_schema: {
      type: 'object',
      properties: {
        origin_lat: {
          type: 'number',
          description: 'Latitud del punto de origen'
        },
        origin_lng: {
          type: 'number',
          description: 'Longitud del punto de origen'
        },
        dest_lat: {
          type: 'number',
          description: 'Latitud del punto de destino'
        },
        dest_lng: {
          type: 'number',
          description: 'Longitud del punto de destino'
        },
        transport: {
          type: 'string',
          enum: ['auto', 'moto', 'a_pie'],
          description: 'Modo de transporte (default: auto)'
        }
      },
      required: ['origin_lat', 'origin_lng', 'dest_lat', 'dest_lng']
    }
  },
  {
    name: 'create_incident_report',
    description: 'Crea un nuevo reporte de incidente en el sistema con ubicación GPS.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          description: 'Tipo de incidente (ej: Robo, Asalto, Vandalism, etc)'
        },
        descripcion: {
          type: 'string',
          description: 'Descripción detallada del incidente'
        },
        lat: {
          type: 'number',
          description: 'Latitud del incidente'
        },
        lng: {
          type: 'number',
          description: 'Longitud del incidente'
        },
        usuarioId: {
          type: 'integer',
          description: 'ID del usuario que reporta'
        }
      },
      required: ['tipo', 'descripcion', 'lat', 'lng', 'usuarioId']
    }
  }
];

/**
 * Ejecuta un tool específico con los parámetros proporcionados
 * @param {string} toolName - Nombre del tool a ejecutar
 * @param {Object} input - Parámetros del tool
 * @returns {Promise<string>} Resultado del tool como string JSON
 */
export const executeTool = async (toolName, input) => {
  try {
    let result;

    switch (toolName) {
      case 'get_nearby_incidents':
        const incidents = await getNearbyIncidents({
          lat: input.lat,
          lng: input.lng,
          radius_meters: input.radius_meters || 500
        });
        const riskLevel = calculateRiskLevel(incidents);
        result = {
          incidents,
          risk_level: riskLevel,
          count: incidents.length
        };
        break;

      case 'calculate_safe_route':
        result = await calculateSafeRoute({
          origin_lat: input.origin_lat,
          origin_lng: input.origin_lng,
          dest_lat: input.dest_lat,
          dest_lng: input.dest_lng,
          transport: input.transport || 'auto'
        });
        break;

      case 'create_incident_report':
        result = await createReport({
          tipo: input.tipo,
          descripcion: input.descripcion,
          lat: input.lat,
          lng: input.lng,
          usuarioId: input.usuarioId
        });
        break;

      default:
        result = { error: `Tool desconocido: ${toolName}` };
    }

    return JSON.stringify(result);
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return JSON.stringify({
      error: error.message || 'Error ejecutando la herramienta'
    });
  }
};

/**
 * Ejecuta el agente Police-IA con soporte para herramientas
 * @param {Object} params - Parámetros de ejecución
 * @param {string} params.userMessage - Mensaje del usuario
 * @param {Object} params.userLocation - Ubicación del usuario {lat, lng}
 * @param {string} params.userRole - Rol del usuario (ciudadano, funcionario, administrador)
 * @param {Array} params.conversationHistory - Historial de conversación previo
 * @returns {Promise<Object>} Respuesta con texto y tools utilizadas
 */
export const runPoliceIA = async ({
  userMessage,
  userLocation,
  userRole,
  conversationHistory = []
}) => {
  try {
    // Obtener zona horaria de Costa Rica
    const costaRicaTime = new Date().toLocaleString('es-CR', {
      timeZone: 'America/Costa_Rica'
    });

    // Construir system prompt personalizado
    const systemPrompt = `Eres Police-IA, un asistente de inteligencia artificial integrado en el sistema MSC Desamparados.
Tu rol es ayudar a los ciudadanos, funcionarios y administradores con seguridad comunitaria.

INFORMACIÓN DEL USUARIO:
- Rol: ${userRole}
- Ubicación GPS actual: Latitud ${userLocation?.lat?.toFixed(4)}, Longitud ${userLocation?.lng?.toFixed(4)}
- Hora actual en Costa Rica: ${costaRicaTime}

RESPONSABILIDADES SEGÚN ROL:
${
  userRole === 'administrador'
    ? `- Acceso a estadísticas y reportes avanzados
- Gestión de incidentes y patrullajes
- Validación de reportes
- Visualización de datos agregados`
    : userRole === 'funcionario'
      ? `- Responder a reportes y incidentes
- Calcular rutas seguras para patrullajes
- Monitorear zonas de riesgo
- Coordinar respuestas de emergencia`
      : `- Reportar incidentes y emergencias
- Obtener información sobre zonas de riesgo
- Consultar rutas seguras
- Solicitar asistencia policial`
}

INSTRUCCIONES:
1. Siempre responde en español y de manera profesional
2. Si el usuario menciona una emergencia, peligro inmediato o SOS, incluye en tu respuesta la frase: "⚠️ ¡BOTÓN SOS ACTIVADO! Mantén presionado el botón de emergencia en la parte superior derecha"
3. Utiliza las herramientas disponibles para obtener datos reales de la base de datos
4. Proporciona recomendaciones de seguridad basadas en el nivel de riesgo de la zona
5. Sé conciso y claro en tus respuestas (máximo 3-4 oraciones)
6. Si necesitas coordenadas, utiliza siempre la ubicación del usuario o solicita clarificación`;

    // Agregar mensaje del usuario al historial
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    // Llamar al endpoint de chat que ejecutará Claude
    const response = await fetch('/api/v1/police-ia/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        system: systemPrompt,
        tools: TOOLS,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la API');
    }

    const data = await response.json();

    return {
      text: data.text,
      toolsUsed: data.toolsUsed || []
    };
  } catch (error) {
    console.error('Error running Police-IA:', error);
    return {
      text: `Error al procesar tu solicitud: ${error.message}. Por favor intenta de nuevo.`,
      toolsUsed: []
    };
  }
};
