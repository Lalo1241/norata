# El renacer de Norata

**Qué es este archivo:** el punto de partida del pivote a proyectos. Va en la raíz
del repositorio, junto a `CLAUDE.md`, y cada sesión que trabaje en el renacer lo
lee antes de tocar nada. El plan completo, con la competencia y la IA, está en
el documento «Norata Proyectos: el plan del pivote»
(https://claude.ai/artifact/HjLYzepgCzitaaxwMTntHm).

Escrito el 28 oct 2026, sobre la versión 0.7.216.

## La decisión

Norata deja de ser «tu vida como videojuego» y pasa a ser una sola cosa:
**planea un proyecto largo como un mapa y avánzalo en días pequeños, con la IA
llevando el registro.** Lo decidió Eduardo el 28 oct 2026, después de ver que
eran dos apps chocando: una de hábitos (Misiones y Habilidades) y una de
proyectos (Ramas).

La app nunca se lanzó y su único usuario es Eduardo, así que **se reinician el
número de versión y el changelog público**. Lo que NO se reinicia es lo
aprendido (ver «Qué se archiva y qué se borra»).

## El circuito nuevo

Plan → Hoy → Enfoque → Bitácora → Informe, y cada semana se ajusta el plan.
La IA toca tres pasos: arma el plan, escribe la bitácora y analiza el informe.

| Pieza de hoy | En el renacer |
| --- | --- |
| Ramas de clase proyecto | El centro: «Proyectos», abiertos desde el primer minuto |
| Misiones | «Hoy»: los pasos del día salen de las etapas; se permiten pendientes sueltos |
| Pomodoro (`jornada`) | «Enfoque»: cada sesión ligada a un proyecto, registra tiempo |
| Informes (`10f`, `10g`) | Informe semanal por proyecto |
| Caminos | Plantillas de proyecto; la IA arma las que falten |
| Habilidades, ramas de talento | Apagados por defecto, datos intactos, «Modo clásico» en Ajustes |
| Niveles y candados (`MODULO_NIVEL`) | Sin candados; el nivel queda como logro |
| Racha | «Días con avance» |
| Mundos, ambientes, Arcade | Se quedan, congelados |
| Widgets y avisos de Android | Se adaptan al proyecto, en UNA tanda nativa |
| Health Connect | Congelado |
| Puesto de mando, barrera, novedades, correos, `herramientas/` | Intactos |

## Antes de la primera línea

1. **La etiqueta de la clásica.** Sin esto no se empieza:

   ```bash
   git fetch origin
   git tag -a clasica-0.7.216 origin/vivo -m "Norata clásica, antes del pivote a proyectos"
   git push origin clasica-0.7.216
   git branch clasica origin/vivo
   git push origin clasica
   ```

   La barrera solo corre al subir a `main`; esto no publica nada.
2. **Los datos de Eduardo:** exportar el JSON desde Ajustes → Tus datos en la
   cuenta real, y un respaldo de la base desde el panel de Supabase.
3. **Todo detrás de `?renacer=1`** mientras se construye, con la receta de
   «Antes de tocar lo que se ve: una prueba con enlace» de `CLAUDE.md`.

## El reinicio del número: dos trampas medidas

Bajar el número choca con dos piezas que hoy solo dejan ir hacia delante.
Se comprobó leyendo el código el 28 oct 2026:

- **La barrera rechaza un número menor que el de `vivo`**
  (`.github/workflows/barrera.yml`, la comparación `ORDEN` alrededor de la
  línea 189). Hace falta una excepción de UNA sola vez para el reinicio —por
  ejemplo, que acepte un número menor solo si el commit trae una marca
  explícita—, y quitarla después. No se apaga la comprobación entera.
- **El APK solo instala paquetes más nuevos que el suyo** (`masNueva` en
  `js/13-nativo.js`). Un APK con 0.7.216 nunca tomará un 0.1.0. Como el único
  teléfono es el de Eduardo, la salida es **reinstalar el APK** después del
  reinicio, con los pasos de `LEEME.md` de `Norata App Android`.

Revisar también si algo más compara versiones antes de bajar el número:
`grep -rn "masNueva\|ORDEN\|split('.')" js .github herramientas`.

## Qué se archiva y qué se borra

- **`VERSIONES.md`**: la lista de versiones se mueve entera a
  `archivo/VERSIONES-clasica.md` y el archivo vuelve a empezar desde el número
  nuevo. Se conservan sus secciones de reglas («Cómo se cuenta», «Las fechas
  van en hora de México», «Apuntado y sin hacer»), revisadas.
- **`novedades/novedades.json`**: se vacía y empieza con la ficha del renacer.
  Las imágenes de `novedades/img/` no se borran.
- **`CLAUDE.md` y `VOZ.md`**: NO se reinician. Son el porqué de cada decisión
  y casi todo sigue valiendo. Se quita lo que hable de módulos apagados solo
  cuando de verdad se apaguen.
- **La etiqueta `clasica-0.7.216`** guarda todo lo demás. Nada se pierde.

Las demás comparaciones (`versionMasNueva` en `js/10l-novedades.js`,
`herramientas/aprobar-novedad.py`, `herramientas/novedades-futuras.py`) miden
contra la `VERSION` de la propia app, así que se alinean solas al empezar el
JSON de cero. Revisado el 28 oct 2026.

## Lo que decidió Eduardo (28 oct 2026)

- **Número:** el renacer es la `0.1.0`; la beta con 10 personas sigue siendo
  la `0.8`, con el anuncio de nueva etapa (`hito`) que ya existe.
- **Frase:** «Planea en grande. Avanza en días pequeños.» (inglés por
  aprobar: «Plan big. Move forward in small days.»).
- **Enfoque sale en el renacer.**
- **Precios iguales** ($69 / $590 / $890 MXN). El plan Gratuito se cuenta por
  proyectos: 1 proyecto activo y sin IA. Pro: proyectos sin límite y la IA.
- **IA: Claude.** Haiku para la bitácora y el informe; Sonnet solo para «Arma
  mi plan». **Tope: 20% de Pro, unos $14 MXN por persona al mes**; al llegar,
  la IA se pausa hasta el mes siguiente con un aviso que dice cuándo vuelve.
- **El recorte vive en la rama `renacer`**, no en `main`: el grifo está
  abierto y todo lo que llega a `main` se publica. `main` queda para arreglos
  de la clásica. Se fusiona al pasar la Puerta 1.

## El respaldo, hecho (28 oct 2026)

La etiqueta `clasica-0.7.216` y la rama `clasica` apuntan a `3c3d1e0`, el
`vivo` de ese día (0.7.216). Falta lo de Eduardo: exportar su JSON y el
respaldo de Supabase.

## El orden de trabajo

1. Respaldo (arriba).
2. Recorte detrás de `?renacer=1`: proyectos al frente y sin candados,
   Habilidades y Talentos apagados por defecto, vista Hoy, Enfoque ligado a
   un proyecto.
3. **Resolver cómo escribe el servidor sin pisar la sincronía** antes de
   cualquier conector: la sincronía fusiona en el dispositivo
   (`js/10-fusion.js`), así que lo que escriba la IA desde fuera tiene que
   entrar como movimientos que se suman.
4. Conector MCP (una función de Supabase más) y «Arma mi plan».
5. Reinicio del número, ficha del renacer y sitio nuevo.
6. Beta con 10 personas.

Puertas: el 4 dic 2026 (¿Eduardo la usó 5 de los 7 días?) y el 11 ene 2027
(¿3 de 10 personas siguen avanzando en su segunda semana?).
