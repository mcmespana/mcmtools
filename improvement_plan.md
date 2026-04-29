# MCM Tools — Plan de Mejora

> Revisión completa de la aplicación con propuestas ordenadas por impacto/esfuerzo.

---

## 🔴 Prioridad Alta — Bugs y problemas críticos

### 1. Seguridad del Admin hardcodeada
- **Problema:** Las credenciales `admin`/`admin` están en el código fuente del cliente ([admin-context.tsx:L25](file:///c:/Users/izanr/Projects/mcmtools/components/admin-context.tsx#L25)). Cualquiera puede ver el código y acceder.
- **Solución:** Mover la autenticación a una API route con hash bcrypt. Usar cookies HttpOnly con JWT o un token de sesión. Variables de entorno para las credenciales.
- **Esfuerzo:** ~2h

### 2. Producción en Vercel — Python serverless frágil
- **Problema:** La arquitectura actual hace una llamada HTTP interna de Node.js → Python (`/api/run`), que depende de `VERCEL_AUTOMATION_BYPASS_SECRET`, `cgi` (deprecado en Python 3.11), y tiene problemas de timeout con archivos grandes.
- **Solución:** Migrar `api/run.py` para usar el nuevo formato de Vercel con ASGI/WSGI (FastAPI o Flask), o directamente usar `multipart` en lugar de `cgi`. Añadir `vercel.json` con configuración explícita del runtime Python.
- **Esfuerzo:** ~3h

### 3. Sin limpieza de archivos temporales (leak de disco en dev)
- **Problema:** Aunque hay un `finally` que limpia `tmpDir` en [route.ts:L252](file:///c:/Users/izanr/Projects/mcmtools/app/api/tools/%5Bid%5D/run/route.ts#L252), si el proceso se mata o Node crashea, los archivos se quedan en `%TEMP%`.
- **Solución:** Aceptable para ahora, pero considerar un cron de limpieza o usar `os.tmpdir()` con un prefijo que un script de startup pueda limpiar.
- **Esfuerzo:** ~30min

---

## 🟡 Prioridad Media — Funcionalidad y UX

### 4. Dashboard: encabezado duplicado "Tus herramientas"
- **Problema:** Hay un hero header con "Tus herramientas" (L103-L111) Y un section heading "Tus herramientas" (L143-L158). Es redundante visualmente.
- **Solución:** Eliminar el "section heading" o cambiar el hero a algo más genérico tipo "MCM Tools" y dejar la sección como está.
- **Esfuerzo:** ~15min

### 5. Historial de ejecuciones por herramienta
- **Problema:** Solo se ven stats agregadas (total runs, errores, media). No hay forma de ver el log de las últimas ejecuciones.
- **Solución:** Crear una pestaña "Historial" en la vista de ejecución que muestre las últimas N ejecuciones con fecha, duración, y si tuvo error. La tabla `tool_runs` ya existe.
- **Esfuerzo:** ~1.5h

### 6. Variables de usuario tipo `select` no se pueden configurar
- **Problema:** El tipo `select` existe en el tipo [UserVar](file:///c:/Users/izanr/Projects/mcmtools/lib/types.ts#L9) pero no hay UI para definir las opciones en [tool-config.tsx](file:///c:/Users/izanr/Projects/mcmtools/components/config/tool-config.tsx). Solo se puede poner a mano en la BBDD.
- **Solución:** Añadir un campo de "opciones" (textarea o chips) cuando el tipo sea `select`.
- **Esfuerzo:** ~1h

### 7. Falta `input_files` en la referencia API del editor
- **Problema:** El panel de "API" en la pestaña de código ([tool-config.tsx:L370-L382](file:///c:/Users/izanr/Projects/mcmtools/components/config/tool-config.tsx#L370-L382)) solo documenta `input_bytes`, `output_file`, `output_filename`, `variables`. No menciona `input_files` que acabamos de añadir.
- **Solución:** Añadir `input_files` al panel con la descripción `Dict {nombre: bytes}`.
- **Esfuerzo:** ~5min

### 8. Eliminación de archivos seleccionados
- **Problema:** Cuando seleccionas múltiples archivos, no puedes eliminar uno individual. Solo puedes empezar de cero.
- **Solución:** Poner una "X" al lado de cada archivo listado para quitarlo individualmente.
- **Esfuerzo:** ~30min

### 9. Drag & Drop no muestra feedback visual al arrastrar
- **Problema:** Cuando arrastras un archivo sobre la dropzone, no hay ningún cambio visual que te diga "suéltalo aquí".
- **Solución:** Usar el estado de `dragCounter` para cambiar el borde/fondo de la dropzone cuando hay un drag activo.
- **Esfuerzo:** ~20min

---

## 🟢 Prioridad Baja — Polish y extras

### 10. Modo oscuro / Modo claro toggle
- **Problema:** La app siempre está en dark mode. Algunos usuarios pueden preferir light mode.
- **Solución:** Ya hay un `ThemeProvider` vacío. Implementar toggle con CSS variables.
- **Esfuerzo:** ~2h

### 11. Responsive para móvil
- **Problema:** La app usa `maxWidth: 1400` y grids fijos que no se adaptan bien en pantallas pequeñas.
- **Solución:** Media queries en globals.css para ajustar padding, grid columns, y font sizes en breakpoints móviles.
- **Esfuerzo:** ~1.5h

### 12. Ordenación de herramientas por drag & drop
- **Problema:** El campo `position` existe en la BBDD pero no hay UI para reordenar herramientas en el dashboard.
- **Solución:** Integrar `@dnd-kit/core` para arrastrar y reordenar las cards en modo admin.
- **Esfuerzo:** ~3h

### 13. Exportar / Importar herramientas (JSON)
- **Problema:** Si quieres compartir una herramienta con otra instancia de MCM Tools, no hay forma fácil.
- **Solución:** Botón "Exportar JSON" en el menú de acciones y "Importar herramienta" en la creación.
- **Esfuerzo:** ~1.5h

### 14. Preview de la salida de texto
- **Problema:** Cuando una herramienta devuelve texto (no archivo), el `stdout` se muestra en un `<pre>` básico. No hay syntax highlighting ni formato.
- **Solución:** Detectar si es JSON y formatearlo con colores. Detectar si es CSV y mostrarlo como tabla.
- **Esfuerzo:** ~1h

### 15. Favoritos / Herramientas fijadas
- **Problema:** El campo `featured` existe pero solo controla el gradiente visual. No hay forma de que un usuario público marque sus favoritas.
- **Solución:** Guardar favoritos en `localStorage` y añadir una sección "Favoritos" en el dashboard.
- **Esfuerzo:** ~1h

---

## 📋 Resumen por esfuerzo

| Prioridad | Tarea | Esfuerzo |
|-----------|-------|----------|
| 🔴 | Seguridad Admin | ~2h |
| 🔴 | Python Vercel robusto | ~3h |
| 🟡 | Encabezado duplicado | ~15min |
| 🟡 | Documentar `input_files` en API | ~5min |
| 🟡 | Drag feedback visual | ~20min |
| 🟡 | Eliminar archivos individuales | ~30min |
| 🟡 | Select con opciones | ~1h |
| 🟡 | Historial de ejecuciones | ~1.5h |
| 🟢 | Dark/Light toggle | ~2h |
| 🟢 | Responsive | ~1.5h |
| 🟢 | Drag & drop reordenar | ~3h |
| 🟢 | Export/Import JSON | ~1.5h |
| 🟢 | Preview de texto/JSON/CSV | ~1h |
| 🟢 | Favoritos | ~1h |

**Total estimado: ~18h de trabajo**

---

> [!TIP]
> Recomendación: empieza por los items de 5 minutos (#7 documentar API) y 15 minutos (#4 heading duplicado), luego ataca la seguridad del admin (#1). El fix de Vercel (#2) se puede hacer cuando necesites que producción funcione correctamente con archivos.
