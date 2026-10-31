# Usar el entrenador con la app de Claude (plan Free, sin Claude Code)

Con esta guía usas el entrenador desde la **app de escritorio de Claude** (el chat normal), sin Claude Code y sin GitHub. Claude lee y actualiza tus archivos de entrenamiento en tu computador y crea los entrenamientos en Intervals.icu, que se sincronizan a tu Garmin o Wahoo.

Se configura **una sola vez** (~15 min). Después, solo abres un chat y hablas con tu entrenador.

> **Límites del plan Free**: el plan gratuito tiene pocos mensajes por día. Para uso diario, Claude Pro + Claude Code funciona mejor (ver `README.md`). Las funciones de cada plan cambian seguido: si algo de esta guía no aparece en tu app, revisa claude.ai/pricing.

---

## 1. Instala lo necesario

1. **App de escritorio de Claude** (Mac o Windows): https://claude.ai/download — inicia sesión con tu cuenta.
2. **Node.js** (versión LTS): https://nodejs.org — instálalo con las opciones por defecto.
3. **Intervals.icu**: crea una cuenta gratis en https://intervals.icu y conéctala a Garmin Connect / Wahoo / Strava (Settings → Connections).

## 2. Pon la carpeta en su lugar

Descomprime `training-template.zip` y deja la carpeta **`training-template`** directamente en tu carpeta de usuario:

- **Mac**: `/Users/TU_USUARIO/training-template` — tu usuario aparece en Finder → Ir → Inicio, o en Terminal con `whoami`.
- **Windows**: `C:\Users\TU_USUARIO\training-template` — abre la carpeta, haz clic en la barra de direcciones y copia la ruta.

## 3. Copia tu API key de Intervals.icu

https://intervals.icu/settings → baja hasta **Developer Settings** → **API Key** → *Generate* → cópiala. No la compartas con nadie.

## 4. Conecta Claude a la carpeta y a Intervals.icu

1. Abre la app de Claude → **Settings / Configuración** → **Developer** → **Edit Config**. Se abre el archivo `claude_desktop_config.json`.
   - Si no ves esa opción, el archivo está en:
     Mac `~/Library/Application Support/Claude/claude_desktop_config.json` ·
     Windows `%APPDATA%\Claude\claude_desktop_config.json`
2. Abre el ejemplo de esta carpeta que corresponde a tu sistema:
   - Mac → `claude-desktop/claude_desktop_config.mac.json`
   - Windows → `claude-desktop/claude_desktop_config.windows.json`
3. Copia todo su contenido en `claude_desktop_config.json` y cambia:
   - `TU_USUARIO` (aparece **2 veces**) por tu usuario.
   - `PEGA_AQUI_TU_API_KEY` por tu key.
   - Si el archivo ya tenía otros `mcpServers`, agrega estos dos dentro del mismo bloque en lugar de reemplazar todo.
4. Guarda el archivo, **cierra la app por completo** (Mac: Cmd+Q · Windows: clic derecho en el ícono de la bandeja → Quit) y vuelve a abrirla.
5. Comprueba: en un chat nuevo, el menú de herramientas/conectores (ícono junto al cuadro de texto) debe mostrar **intervals-icu** y **filesystem**. La primera vez puede tardar ~1 min (instala dependencias).

## 5. Crea tu proyecto "Entrenador"

1. En la app: **Projects / Proyectos** → **New project** → nómbralo *Entrenador*.
2. En **Instructions / Instrucciones del proyecto**, pega todo el contenido de `claude-desktop/INSTRUCCIONES-PROYECTO.md` (lo que está debajo de la línea).
3. **No subas archivos** al conocimiento del proyecto: Claude los lee directo de tu carpeta y así siempre están actualizados.

**¿Tu plan no tiene proyectos?** Empieza cada chat con este mensaje:

> Lee `claude-desktop/INSTRUCCIONES-PROYECTO.md` en mi carpeta de entrenamiento y síguelo.

## 6. Primer chat: configura tu entrenador

Dentro del proyecto, abre un chat y escribe:

> **Configura mi entrenador**

Claude te pide en un solo mensaje tus datos y objetivos (días disponibles, horas, carrera objetivo, equipo, lesiones). Lee tu FTP, LTHR y FC máxima desde Intervals.icu, llena todos tus archivos y arma tu plan de temporada y tu semana.

Cuando la app pida permiso para usar una herramienta (leer/escribir archivos, Intervals.icu), elige **Permitir siempre** para este chat o proyecto.

## 7. Día a día

- "¿Qué me toca hoy?"
- "Planea mi semana" / "Crea los entrenamientos de esta semana"
- "Analiza mi salida de ayer"
- "¿Cómo me fue la semana pasada?"

Haz **una copia de seguridad** de la carpeta `training-template` cada cierto tiempo (Google Drive, iCloud, OneDrive). Tu key no está en esa carpeta, está en el archivo de configuración de la app.

---

## Problemas comunes

| Síntoma | Solución |
|---------|----------|
| No aparecen *intervals-icu* ni *filesystem* | Revisa que el JSON sea válido (comas, comillas; en Windows las rutas llevan `\\` doble). Cierra la app por completo y ábrela de nuevo. En Settings → Developer se ve el error de cada servidor |
| Error `spawn node ENOENT` o `npx ENOENT` | La app no encuentra Node. Cambia `"node"` por la ruta completa — Mac: `/usr/local/bin/node` (y `/usr/local/bin/npx`); Windows: `C:\\Program Files\\nodejs\\node.exe` (y `C:\\Program Files\\nodejs\\npx.cmd`). En Mac puedes ver la ruta con `which node` en Terminal |
| Intervals.icu responde 401 / 403 | La key está mal copiada. Genera otra y pégala de nuevo en el config |
| Claude no encuentra los archivos | La ruta de `filesystem` debe ser la carpeta `training-template` exacta (la que contiene `CLAUDE.md`) |
| Se acaban los mensajes | Límite del plan Free. Chats cortos y una tarea por chat ayudan; para uso diario, considera Claude Pro |
