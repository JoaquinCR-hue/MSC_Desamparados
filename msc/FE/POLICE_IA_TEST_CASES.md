/**
 * EJEMPLOS DE CONVERSACIÓN - Police-IA
 * Casos de prueba para validar funcionamiento correcto
 */

# 📚 CASOS DE PRUEBA - Police-IA

## Caso 1: Consultar seguridad de ubicación

**Usuario dice:**
```
"¿Qué tan segura es mi ubicación actual?"
```

**Police-IA debería:**
1. ✅ Usar herramienta: `get_nearby_incidents`
2. ✅ Enviar: lat=9.795, lng=-84.087 (Desamparados)
3. ✅ Recibir: Array de incidentes cercanos
4. ✅ Calcular riesgo (bajo/moderado/alto)
5. ✅ Responder en español con recomendaciones

**Respuesta esperada (ejemplo):**
```
Tu ubicación en Desamparados (9.7950, -84.0870) tiene un nivel de riesgo BAJO.

Se detectaron 2 incidentes menores en un radio de 500 metros:
- Hurto menor (hace 2 horas)
- Disturbio (hace 4 horas)

Recomendaciones:
✓ Evita parques después de las 8 PM
✓ Mantén tus objetos de valor asegurados
✓ Usa calles principales iluminadas

Zona clasificada como SEGURA para movimiento diurno.
```

---

## Caso 2: Calcular ruta segura

**Usuario dice:**
```
"Necesito ir a la estación de tren de Desamparados. ¿Cuál es la ruta más segura?"
```

**Police-IA debería:**
1. ✅ Usar herramienta: `calculate_safe_route`
2. ✅ Usar ubicación GPS del usuario como origen
3. ✅ Usar estación de tren como destino
4. ✅ Llamar a OSRM para calcular ruta
5. ✅ Analizar incidentes en 3 puntos intermedios
6. ✅ Si hay riesgo alto, sugerir ruta alternativa
7. ✅ Retornar información con advertencias

**Respuesta esperada:**
```
✓ Ruta calculada exitosamente

📍 Origen: Tu ubicación actual
🏁 Destino: Estación de Tren, Desamparados

DETALLES DE LA RUTA:
- Distancia: 3.2 km
- Duración estimada: 8 minutos en auto
- Tipo de transporte: Auto
- Nivel de riesgo: MODERADO

⚠️ ADVERTENCIA:
Se detectó riesgo MODERADO en la zona de Barrio el Carmen.
Se calculó una ruta ALTERNATIVA 300m más segura.

RECOMENDACIONES:
✓ Evita la Calle Central (frecuentes asaltos)
✓ Mantén puertas con seguro
✓ Usa luces del auto
✓ Llama si ves algo sospechoso: 911

[MAPA INTERACTIVO AQUÍ]
```

---

## Caso 3: Reportar incidente

**Usuario dice:**
```
"Reporto un robo a mano armada en la esquina de mi casa. Ubicación: 9.79, -84.08"
```

**Police-IA debería:**
1. ✅ Usar herramienta: `create_incident_report`
2. ✅ Enviar tipo="Robo a mano armada"
3. ✅ Enviar descripción del incidente
4. ✅ Guardar lat=9.79, lng=-84.08
5. ✅ Insertar en tabla Reports de MySQL
6. ✅ Crear entrada en Locations si no existe
7. ✅ Crear entrada en IncidentTypes si no existe

**Respuesta esperada:**
```
🚨 INCIDENTE REPORTADO EXITOSAMENTE

ID del Reporte: #12847
Estado: PENDIENTE
Tipo: Robo a mano armada
Ubicación: 9.7900, -84.0800
Hora: 14:35 (5 minutos ago)

✓ Tu reporte ha sido registrado en el sistema
✓ Autoridades locales han sido notificadas
✓ Número de seguimiento: 12847

¿NECESITAS AYUDA INMEDIATA?
Si estás en peligro, presiona el botón SOS →
O llama al 911 directamente

El oficial asignado se contactará pronto.
```

---

## Caso 4: Alerta SOS en conversación

**Usuario dice:**
```
"¡Hay un hombre persiguiendo a una mujer en la calle! Necesito ayuda inmediata"
```

**Police-IA debería:**
1. ✅ Detectar palabras clave: "peligro inmediato", "ayuda", "persiguiendo"
2. ✅ Activar alerta SOS
3. ✅ Mostrar banner rojo con instrucción SOS
4. ✅ Mensajes en mayúsculas
5. ✅ Instrucción clara de botón SOS

**Respuesta esperada:**
```
⚠️ ¡BOTÓN SOS ACTIVADO! Mantén presionado el botón de emergencia 
en la parte superior derecha

🚨 SITUACIÓN CRÍTICA DETECTADA

Ubicación siendo registrada: 9.7950, -84.0870
Servicios de emergencia siendo alertados...

MIENTRAS ESPERAS AYUDA:
✓ Mantente en un lugar seguro
✓ Documenta cualquier detalle (descripción de personas)
✓ Permanece en línea si es posible
✓ No confrontes al delincuente

EMERGENCIAS RÁPIDAS:
911 - Policía (emergencia)
117 - Policía (no emergencia)
128 - Ambulancia
```

---

## Caso 5: Consulta por rol (Funcionario)

**Funcionario dice:**
```
"¿Cuál es la zona de mayor riesgo en mi sector de patrullaje?"
```

**Police-IA debería:**
1. ✅ Detectar rol=funcionario desde sessionStorage
2. ✅ Proporcionar acceso a estadísticas
3. ✅ Mostrar zonas de riesgo del sector
4. ✅ Sugerir rutas de patrullaje optimizadas

**Respuesta esperada (solo para funcionario):**
```
REPORTE DE SECTOR DE PATRULLAJE - Funcionario

Zona de Mayor Riesgo:
📍 Barrio el Carmen (9.792, -84.086)
- 7 incidentes en últimas 24 horas
- Nivel: ALTO
- Tipos: Robos (4), Asaltos (2), Disturbios (1)

Recomendaciones de Patrullaje:
✓ Aumentar vigilancia 18:00-22:00
✓ Enfoque en Calle Central y Avenida 2
✓ Coordinar con colegas para cobertura
✓ Reportar actividad sospechosa en tiempo real

Próximas unidades de refuerzo disponibles:
- Unidad 5: Disponible en 3 min
- Unidad 12: Disponible en 7 min
```

---

## Caso 6: Consulta por rol (Administrador)

**Administrador dice:**
```
"Muéstrame las estadísticas de seguridad de esta semana"
```

**Police-IA debería:**
1. ✅ Detectar rol=administrador
2. ✅ Acceder a todos los reportes
3. ✅ Proporcionar análisis completo
4. ✅ Mostrar tendencias y patrones

**Respuesta esperada (solo para administrador):**
```
ESTADÍSTICAS SEMANAL - MSC Desamparados

Total de Reportes: 47
- Resueltos: 32 (68%)
- Pendientes: 12 (26%)
- Archivados: 3 (6%)

Distribución por Tipo:
🔴 Robo: 18 (38%)
🟠 Asalto: 12 (26%)
🟡 Vandalism: 10 (21%)
🟢 Otros: 7 (15%)

Tendencias:
↑ Robos aumentaron 15% vs semana anterior
↓ Asaltos disminuyeron 8%
→ Disturbios estables

Zonas Críticas:
1. Barrio Carmen (15 incidents)
2. Centro (11 incidents)
3. La Unión (8 incidents)

Eficiencia Operativa: 92%
Tiempo promedio respuesta: 8 min
Tasa de resolución: 68%
```

---

## Caso 7: Error - Ubicación no disponible

**Widget intenta obtener ubicación pero el usuario deniega permiso**

**Police-IA debería:**
1. ✅ Capturar error de geolocalización
2. ✅ Informar al usuario en español
3. ✅ Permitir continuar sin ubicación (funcionalidad limitada)

**Respuesta esperada:**
```
⚠️ Error: Permiso de ubicación denegado

No se pudo obtener tu ubicación GPS. 
Esto puede deberse a:
✓ Permiso no concedido en el navegador
✓ Navegador privado/incógnito
✓ GPS desactivado en el dispositivo

SOLUCIONES:
1. Abre Configuración del navegador
2. Busca "Permisos" → "Ubicación"
3. Permite acceso a Desamparados
4. Recarga la página

Puedes continuar sin ubicación, pero algunas
funciones como "Ruta Segura" serán limitadas.

¿Cómo puedo ayudarte sin ubicación?
```

---

## Caso 8: Error - API Key no configurada

**Backend intenta llamar a Claude pero API Key no existe**

**Console debería mostrar:**
```
Error in police-ia/chat: 
Missing or invalid ANTHROPIC_API_KEY

Usuario recibe:**
```
Error al procesar tu solicitud: 
Configuración de servidor incompleta.
Por favor contacta al administrador.
```

**Solución:**
```
1. Verifica BE/.env tiene: ANTHROPIC_API_KEY=sk-ant-...
2. Reinicia servidor: npm run dev
3. Vuelve a intentar
```

---

## Caso 9: Conversación multi-turno

**Turno 1 - Usuario:**
```
"Soy funcionario. ¿Cuál es la zona más peligrosa?"
```

**Police-IA:**
```
Como funcionario, detecto que Barrio Carmen 
es la zona más peligrosa (15 incidentes/semana).
```

**Turno 2 - Usuario:**
```
"¿Cuál es la mejor ruta para patrullar esa zona?"
```

**Police-IA:**
```
Recomiendo:
1. Ruta A: Calle Central → Avenida 2 → Parque (15 min)
2. Ruta B: Perimetral (evita intersecciones peligrosas) (18 min)

La Ruta B es 40% más segura según incidentes recientes.
```

**Turno 3 - Usuario:**
```
"Reporta los incidentes activos en esa zona"
```

**Police-IA ejecuta herramientas de forma secuencial y mantiene contexto:**
```
✓ Incidentes activos en Barrio Carmen:

1. [URGENTE] Robo en progreso - Calle 5
   Reportado hace 5 minutos
   
2. [ACTIVO] Disturbio - Parque Central
   Reportado hace 12 minutos
   
3. [VIGILANCIA] Sospechoso merodeando
   Reportado hace 25 minutos

Unidades disponibles para respuesta inmediata:
- Unidad 5: 2 min
- Unidad 8: 4 min
```

---

## Caso 10: Cambio de tema

**Usuario activa "Modo Día" en settings**

**Police-IA Widget debería:**
1. ✅ Detectar cambio de tema en localStorage
2. ✅ Cambiar colores automáticamente
3. ✅ Mantener funcionalidad igual

**Vista en Modo Día:**
- Fondo: Blanco #ffffff
- Texto: Gris oscuro #1f2937
- Burbujas usuario: Naranja #F97316
- Burbujas asistente: Gris claro #f3f4f6
- Acento: Naranja #F97316

**Vista en Modo Noche:**
- Fondo: Negro #111111
- Texto: Blanco #f3f4f6
- Burbujas usuario: Naranja #F97316
- Burbujas asistente: Gris #2a2a2a
- Acento: Naranja #F97316

---

## 🧪 TESTING SCRIPT

Para probar todo automáticamente:

```bash
# 1. Instalar dependencias
cd msc/BE && npm install

# 2. Verificar API Key
grep ANTHROPIC_API_KEY msc/BE/.env

# 3. Iniciar backend
npm run dev  # En terminal 1

# 4. Iniciar frontend (nueva terminal)
cd msc/FE && npm run dev

# 5. Abrir navegador
open http://localhost:5173

# 6. Loguéate como citizen
# Usuario: ciudadano@msc.com / ciudadano123

# 7. Abre Police-IA (botón naranja)

# 8. Espera a que se obtenga ubicación

# 9. Prueba estos mensajes en orden:
#    - "¿Qué tan segura es mi ubicación?"
#    - "Necesito una ruta segura"
#    - "Reportar un incidente"

# 10. Revisa console (F12) para logs
```

---

## ✅ VALIDACIÓN EXITOSA

Cuando Police-IA funciona correctamente, deberías ver:

✅ Widget carga en esquina inferior derecha
✅ Botón naranja es visible y clickeable
✅ Panel se abre con transición suave
✅ Se solicita permiso de ubicación
✅ Se muestra mensaje de bienvenida
✅ Las acciones rápidas funcionan
✅ Los mensajes se envían y reciben
✅ Las herramientas se ejecutan
✅ Las respuestas están en español
✅ No hay errores en console

Si ves todo esto, ¡Police-IA está funcionando perfectamente! 🎉

---

**Última actualización:** 2024
**Versión:** 1.0.0
