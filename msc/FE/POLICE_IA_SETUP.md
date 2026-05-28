/**
 * GUÍA DE INTEGRACIÓN - Police-IA
 * Sistema de IA para Seguridad Comunitaria Municipal (MSC Desamparados)
 * 
 * Este archivo proporciona instrucciones para instalar y configurar Police-IA
 */

# Police-IA - Agente IA para Seguridad Comunitaria

## 📋 Descripción

Police-IA es un agente inteligente integrado en el sistema MSC Desamparados que utiliza Claude 3.5 Sonnet para:

- ✓ Evaluar nivel de riesgo en zonas específicas
- ✓ Calcular rutas seguras con análisis de incidentes
- ✓ Facilitar reportes de incidentes con ubicación GPS
- ✓ Proporcionar recomendaciones de seguridad personalizadas
- ✓ Responder consultas sobre seguridad ciudadana

---

## 🔧 INSTALACIÓN PASO A PASO

### PASO 1: Instalar dependencias en Backend

```bash
cd msc/BE
npm install @anthropic-ai/sdk
```

O si prefieres instalar todas las dependencias nuevamente:
```bash
npm install
```

### PASO 2: Configurar variables de entorno

Edita el archivo `msc/BE/.env` y agrega tu clave de API de Anthropic:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Para obtener la clave:**
1. Ve a https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Genera una nueva API Key
4. Copia la clave en .env (reemplaza `tu_clave_aqui`)

### PASO 3: Reiniciar servidores

Backend:
```bash
cd msc/BE
npm run dev
```

Frontend (en otra terminal):
```bash
cd msc/FE
npm run dev
```

---

## 📁 ARCHIVOS CREADOS

### Backend (BE)

```
src/routes/policeIA.route.js          ← Endpoints principales
src/config/database.js                ← Configuración existente (reutilizada)
```

**Endpoints disponibles:**
- `POST /api/v1/police-ia/chat` → Procesa mensajes con Claude
- `GET /api/v1/police-ia/incidents-nearby` → Incidentes cercanos
- `POST /api/v1/police-ia/report` → Crear nuevo reporte

### Frontend (FE)

```
src/agents/policeIAAgent.js              ← Orquestador principal
src/agents/tools/incidentsTool.js        ← Herramienta: incidentes cercanos
src/agents/tools/routeTool.js            ← Herramienta: rutas seguras
src/agents/tools/reportTool.js           ← Herramienta: crear reportes
src/services/gpsService.js               ← Servicio de geolocalización
src/components/PoliceIAWidget.jsx        ← Chat flotante (UI)
src/styles/PoliceIAWidget.css            ← Estilos del widget
```

---

## 🎯 CÓMO FUNCIONA

### 1. Usuario abre el widget Police-IA

```
Botón flotante naranja 🛡️ IA (esquina inferior derecha)
↓
Click → Se abre panel de chat
↓
Se solicita ubicación GPS
↓
Se muestra mensaje de bienvenida
```

### 2. Usuario envía un mensaje

```
"¿Qué tan segura es mi ubicación?"
↓
Frontend llama a runPoliceIA()
↓
Se envía a /api/v1/police-ia/chat
↓
Claude analiza y decide usar herramientas
↓
Se ejecutan tools (getNearbyIncidents, calculateSafeRoute, etc)
↓
Respuesta personalizada al usuario
```

### 3. Ejemplo de conversación

**Usuario:** "Necesito una ruta segura a la estación de tren"

**Police-IA:**
1. Solicita coordenadas de origen (GPS del usuario)
2. Solicita destino (usuario proporciona)
3. Llama a `calculateSafeRoute()`
4. Analiza incidentes en 3 puntos intermedios
5. Si hay riesgo alto, sugiere ruta alternativa
6. Retorna mapa interactivo + recomendaciones

---

## 🔌 INTEGRACIÓN CON COMPONENTES EXISTENTES

### Ya integrado automáticamente:

✅ **PoliceIAWidget** en `src/main.jsx`
- Se carga en todas las páginas
- Solo visible para usuarios autenticados
- Respeta el tema (oscuro/claro)

✅ **Tabla de Reportes** (`Reports` en MySQL)
- Police-IA inserta reportes directamente
- Compatible con sistema existente

✅ **Sistema de Autenticación**
- Usa JWT tokens
- Obtiene rol del usuario desde sessionStorage
- Personaliza respuestas según rol

---

## 🔒 SEGURIDAD

### Permisos por rol:

| Rol | Acceso | Funciones |
|-----|--------|-----------|
| **Ciudadano** | Sí | Reportar incidentes, consultar rutas seguras, verificar riesgo |
| **Funcionario** | Sí | Todo + acceso a estadísticas de patrullaje |
| **Administrador** | Sí | Todo + gestión de reportes y estadísticas avanzadas |
| **No autenticado** | No | Widget no se muestra |

### Protecciones:

- ✓ Todos los endpoints requieren `verifyToken` middleware
- ✓ Las consultas usan parámetros preparados (previene SQL injection)
- ✓ CORS solo permite localhost:5173
- ✓ Clave ANTHROPIC_API_KEY nunca se envía al cliente

---

## 🧪 PRUEBAS RÁPIDAS

### 1. Probar GPS

Abre navegador → F12 → Console:
```javascript
navigator.geolocation.getCurrentPosition(
  pos => console.log(pos.coords),
  err => console.error(err)
);
```

### 2. Probar endpoint de incidentes

```bash
curl "http://localhost:3000/api/v1/police-ia/incidents-nearby?lat=9.795&lng=-84.087&radius=500" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Probar widget

1. Abre http://localhost:5173 (con usuario autenticado)
2. Haz click en botón naranja 🛡️
3. Espera a que se obtenga ubicación
4. Escribe: "¿Es segura mi ubicación?"

---

## 📊 BASE DE DATOS UTILIZADA

El sistema usa las tablas **existentes** en MySQL:

```sql
Reports           ← Se insertan nuevos reportes
├── id (primary key)
├── description
├── date
├── status
├── userId
├── incidentTypeId
└── locationId

Locations        ← Se insertan ubicaciones
├── id
├── lat
├── lng
├── district
├── neighborhood
└── ... otros campos

IncidentTypes    ← Tipos de incidentes
├── id
├── name
├── severity
└── description

Users            ← Usuarios existentes
└── Relación con reportes
```

**Query geográfica utilizada:**

```sql
SELECT *
FROM Reports r
JOIN Locations l ON r.locationId = l.id
WHERE (6371000 * acos(
  cos(radians(lat)) * cos(radians(user_lat)) *
  cos(radians(user_lng) - radians(lng)) +
  sin(radians(lat)) * sin(radians(user_lat))
)) <= radius_meters
```

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Cambiar modelo de Claude

En `src/routes/policeIA.route.js`, línea ~50:

```javascript
// Cambiar de:
model: 'claude-sonnet-4-20250514',

// A:
model: 'claude-opus-4-1',  // Más potente pero más lento/caro
// o
model: 'claude-3-5-haiku-20241022',  // Más rápido pero menos inteligente
```

### Modificar radio de búsqueda de incidentes

En `src/agents/tools/incidentsTool.js`:

```javascript
const getNearbyIncidents = async ({ 
  lat, 
  lng, 
  radius_meters = 1000  // Cambiar de 500 a 1000
}) => { ... }
```

### Cambiar distancia de desviación en rutas

En `src/agents/tools/routeTool.js`:

```javascript
const getDeviatedWaypoint = (lat, lng, offsetMeters = 300) // Cambiar de 150
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "ANTHROPIC_API_KEY not found"

**Solución:**
1. Verifica que `.env` tiene la línea: `ANTHROPIC_API_KEY=sk-ant-...`
2. Reinicia el servidor: `npm run dev`
3. Verifica que no hay espacios ni comillas

### Error: "No route found" al llamar a Police-IA

**Solución:**
1. Verifica que `policeIA.route.js` está en `src/routes/`
2. Verifica que `index.js` importa: `const policeIARoutes = require('./policeIA.route');`
3. Verifica que registra: `router.use('/police-ia', verifyToken, policeIARoutes);`
4. Reinicia servidor

### Widget no aparece

**Solución:**
1. Verifica que estás logueado (sessionStorage debe tener 'user')
2. Verifica que PoliceIAWidget está en `main.jsx`
3. Revisa console (F12) por errores
4. Limpia localStorage si hay conflictos: `localStorage.clear()`

### "Permiso de ubicación denegado"

**Solución:**
1. En Chrome: Settings → Privacy → Site Settings → Location
2. Busca localhost → Allow
3. Recarga la página

### Claude devuelve respuesta vacía

**Solución:**
1. Verifica que API Key es válida en console.anthropic.com
2. Verifica que tienes créditos/plan activo
3. Revisa logs del servidor: `node src/server.js` (sin nodemon)

---

## 📈 ROADMAP FUTURO

- [ ] Integración con mapas Leaflet para mostrar rutas en tiempo real
- [ ] Historial de conversaciones persistente
- [ ] Notificaciones push para alertas de seguridad
- [ ] Análisis de patrones de delincuencia
- [ ] Integración con cámaras de vigilancia
- [ ] Predicción de zonas de riesgo con IA
- [ ] Chat multiidioma
- [ ] Voz para reportes manos libres

---

## 📞 SOPORTE

Para soporte técnico:
1. Revisa los logs en terminal: `npm run dev`
2. Abre DevTools (F12) y revisa Console
3. Verifica status API: `curl http://localhost:3000/`
4. Revisa que backend está corriendo en puerto 3000
5. Revisa que frontend está corriendo en puerto 5173

---

## 📄 LICENCIA

Police-IA es parte del sistema MSC Desamparados.
Uso interno autorizado.

**Última actualización:** 2024
**Versión:** 1.0.0
