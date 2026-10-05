/* El panel de administración: Norata por dentro.
 *
 * AVISO, y es el mismo que lleva 10d-plan.js: NADA de este archivo es
 * seguridad. Que `esAdmin` valga false solo hace que el botón no se dibuje;
 * cualquiera puede poner esa variable a true desde la consola del navegador y
 * lo único que conseguirá es ver una pantalla vacía, porque el servidor no le
 * va a contestar. Quien decide es `metricas()` en administracion.sql.
 *
 * Por qué vive dentro de la app y no en una página aparte: para poder mirarlo
 * desde el teléfono sin escribir una dirección de memoria. El precio es que
 * este archivo viaja en la app de todo el mundo — los datos no, solo el
 * dibujo — y se paga a sabiendas.
 */

/* Empieza en false y solo el servidor lo sube. El orden importa: si arrancara
   en true, habría un instante con el botón puesto para cualquiera. */
let esAdmin = false;
/* Si el servidor YA contestó quién es esta cuenta, diga lo que diga (0.7.160.1).
   No es lo mismo «no eres admin» que «todavía no lo sé», y confundirlos le
   quitaba el mundo a la cuenta administradora en cada arranque: su plan real
   es Gratuito —el Fundador se lo pone `PLAN_DE_CASA` por ser admin— y esa
   respuesta llega DESPUÉS de la del plan. En el hueco, `refrescarApariencia`
   veía «plan confirmado: gratuito» y bajaba el mundo a la casa. Lo lee esa
   función: mientras esto valga false, no quita nada. */
let adminConfirmado = false;
let metricasCache = null;

/* Se pregunta una vez al arrancar, después de que la sesión esté lista. Si no
   hay sesión, ni se pregunta: la respuesta ya se sabe. */
async function revisarAdmin() {
  esAdmin = await sbSoyAdmin();
  adminConfirmado = true;
  /* La burbuja de la computadora solo sale para la casa (js/13d-flotante.js),
     y hasta aquí no se sabía si esta cuenta lo es. */
  if (typeof fltPintarBoton === "function") fltPintarBoton();

  /* Antes de nada, la puerta de atrás del modo de pruebas. El plan simulado
     vive en `sessionStorage`, así que aguanta una recarga a propósito —si no,
     no se podría navegar por la app mirando—. Pero el rótulo que lo anuncia
     cuelga de ser administrador, y si la respuesta del servidor llega diciendo
     que no lo eres, la simulación se quedaría puesta sin nada que la delate.
     Una app que miente sin avisar es peor que una que no se deja probar.

     Aquí y no en `planCargar`: allí `esAdmin` todavía no ha contestado, y
     preguntarlo antes de tiempo borraría la simulación siempre. */
  if (typeof planLeerSimulado === "function" && planLeerSimulado() &&
      (!esAdmin || !esCuentaDePruebas())) {
    planSimular("");
  }

  /* LA APARIENCIA, ANTES DEL `return` DE ABAJO. Aquí estaba el fallo que
     Eduardo cazo cambiando de cuenta: esta línea vivía al final de la
     función, o sea DESPUÉS de `if (!esAdmin) return`, así que para todo el
     mundo menos para él no se ejecutaba nunca. La única puerta que revisaba
     si lo que llevas puesto sigue siendo tuyo estaba cerrada para el 100% de
     las cuentas.

     No se notaba porque el plan y el nivel de una persona no suelen bajar. Al
     poder cambiar de cuenta en el mismo dispositivo sí bajan de golpe: se
     entraba con una cuenta Fundador, se cambiaba a una que no lo es, y el
     mundo de Fundador seguía puesto hasta elegir otro a mano. */
  /* …y para la cuenta administradora, PRIMERO el plan (0.7.160.1). Tiene
     Fundador puesto (ver `PLAN_DE_CASA`), y `planRefrescar` es lo que lo
     enciende: `planCargar` ya corrió antes de que el servidor contestara quién
     es, así que decidió sin saberlo. Revisando la apariencia ANTES de eso,
     como se hacía, se preguntaba con el plan Gratuito todavía puesto: el
     mundo se quitaba y se volvía a poner una línea más abajo. `planRefrescar`
     ya revisa la apariencia por su cuenta, con el plan bueno. */
  if (esAdmin && typeof planRefrescar === "function") planRefrescar();
  else if (typeof refrescarApariencia === "function") refrescarApariencia();

  if (!esAdmin) return;

  if (typeof renderAjustes === "function") renderAjustes();
  /* Y el rótulo de pruebas, que también cuelga de esto. Sin esta línea no
     aparecía nunca: cuando la sesión se abre, `esAdmin` todavía vale false, y
     `pintarAvisoPruebas` ya había pasado por ahí decidiendo que no. */
  if (typeof pintarAvisoPruebas === "function") pintarAvisoPruebas();
  /* Y el del ejemplo por lo mismo: en la cuenta de pruebas se dibuja callado,
     y esa decisión también cuelga de una respuesta que llega tarde. Sin esta
     línea, entrar al ejemplo antes de que el servidor conteste dejaba el
     rótulo hablando hasta la siguiente recarga. */
  if (typeof pintarAvisoEjemplo === "function") pintarAvisoEjemplo();
  /* La apariencia se revisa arriba, antes del `return`: la necesita todo el
     mundo, no solo quien administra. */
}

/* ---- Piezas de dibujo ----
   Todo se dibuja a mano con SVG y CSS. No hay librería de gráficas y no la va
   a haber: meter una obligaría a un empaquetador, y Norata no tiene ninguno
   a propósito. Cuatro barras y un número grande no necesitan trescientos
   kilobytes. */

/* ---- La nomenclatura de color, y es la regla de todo el panel ----

   La pidió Eduardo el 28 ago 2026 con una frase que la resume mejor que
   cualquier explicación: «que todo se vea verde no me dice nada». Y tenía
   razón por debajo de lo que parecía — no era fealdad, era que el color no
   estaba diciendo nada: las seis cifras de La gente, las tres de la gráfica,
   los cuatro escalones del embudo y todas las barras salían en menta, así que
   el verde solo significaba «esto es un número».

   La regla, y solo hay una: **el color aparece cuando hay un JUICIO, y la
   tinta normal cuando solo hay un dato.** Un número sin vara contra la que
   compararse no puede estar bien ni mal, y pintarlo de un color le pone una
   opinión encima que nadie ha calculado.

     tinta         un dato que solo cuenta: cuentas creadas, aperturas,
                   versiones, cuánto llevan con cuenta. La mayoría del panel.
     menta         llega a la vara
     luciérnaga    hay que mirarlo: va a medias, o es raro
     coral         se pierde gente, o algo se rompió

   Dos excepciones a propósito, porque ahí el color es IDENTIDAD y no juicio:
   la línea de la constelación (es la serie, y solo hay una) y los planes del
   cobro (menta los que se renuevan, lila el fundador, que es su color desde
   0.7.15). Los gajos de una dona son identidad también, y por eso ninguno
   puede ser coral: un reparto de dispositivos no tiene un lado malo.

   Dónde NO se toca: la tendencia de la gráfica (▲▼) ya usaba `--var-sube` y
   `--var-baja`, que es esta misma idea escrita antes y en todos los mundos. */

/* ================= Norata por dentro, como consola aparte (0.7.167) =================

   Hasta la 0.7.164 esto era una lista larga dentro de Ajustes. Eduardo pidió
   «algo completamente distinto, más como un panel exclusivo», y lo afinó sobre
   un boceto funcional antes de que se escribiera una línea aquí. Lo que salió:

     una capa a pantalla completa (`#dentro`), con su barra a la izquierda en la
     computadora y sus pestañas abajo en el teléfono, y cinco salas:

       Hoy          lo que hay que atender, en orden, y cuatro cifras
       Buzón        lo que escribe la gente y lo que caza la app, uno a uno
       Subidas      la versión publicada y las novedades que esperan aprobación
       Números      la gente y el cobro, en líneas
       Laboratorio  lo que está en pruebas y las herramientas para revisarlo

   **Aquí solo se dibuja lo que el servidor da de verdad.** El boceto tenía
   más: estados y respuestas en el buzón, paquetes de subida con su grifo,
   beta testers, el histórico del cobro. Nada de eso existe todavía en
   Supabase ni en GitHub, y un panel de administración que enseña un número
   inventado es peor que uno al que le falta una sala. Lo que falta está
   apuntado en VERSIONES.md, «Apuntado y sin hacer».

   Tres reglas que pidió él y que valen para todo lo que se añada:

     - **Cada explicación se dice una vez.** Si una frase se repite en cada
       fila, sobra en todas: va en la cabecera.
     - **Ni un hueco dentro de una tarjeta.** En una fila de dos, la gráfica o
       la lista crece hasta llenar la suya (`dnDibuja` pasa dos veces por eso).
     - **El color es un juicio** (ver la nota de arriba, la del 28 ago): oro lo
       que hay que mirar, coral lo que se pierde, menta lo que llega a la vara.
       Y sale de `--casa-*`, que ningún mundo pisa. */

const DN_IC = {
  rombo: "M12 2.5l9.5 9.5-9.5 9.5L2.5 12z M9.5 14.5v-2 M12 14.5v-5 M14.5 14.5v-3.5",
  hoy: "M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  buzon: "M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M3 13h5l1 3h6l1-3h5",
  subidas: "M12 16V4 M7 9l5-5 5 5 M4 20h16",
  numeros: "M4 5v14h16 M7 15l4-5 3 3 5-7",
  lab: "M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 15h9",
  fallo: "M8 8a4 4 0 0 1 8 0v1H8z M6 9h12v4a6 6 0 0 1-12 0z M12 9v10 M3 13h3 M18 13h3 M4 6l3 3 M20 6l-3 3 M4 20l3-3 M20 20l-3-3",
  idea: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z",
  duda: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8 M12 17h.01",
  gusto: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  auto: "M13 3L5 14h6l-1 7 8-11h-6z",
  buscar: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4",
  copiar: "M9 9h10v11H9z M5 15V4h10",
  flecha: "M9 5l7 7-7 7", atras: "M15 5l-7 7 7 7", salir: "M10 6l-6 6 6 6 M4 12h16",
  candado: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  check: "M5 12l5 5 9-10", x: "M6 6l12 12 M18 6L6 18",
  reloj: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2",
  regreso: "M4 4v6h6 M4.5 10A8 8 0 1 1 6 17.5",
  db: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6 M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3",
  llave: "M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M11 11l9 9 M16 16l2-2 M19 19l2-2",
  cerradura: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 9a2 2 0 0 0-1 3.7V16h2v-3.3A2 2 0 0 0 12 9z"
};
const dnIc = n => `<svg class="dn-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${DN_IC[n] || ""}"/></svg>`;
const dnE = s => escapeHtml(String(s == null ? "" : s));
const dnSuma = a => a.reduce((t, x) => t + (Number(x) || 0), 0);
const DN_MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/* «2026-10-02» → «2 oct». A mano y no con `Date`: una fecha sin hora se lee en
   UTC y en México sale el día anterior. */
function dnDia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? Number(m[3]) + " " + DN_MESES[Number(m[2]) - 1] : String(iso || "");
}
/* Días enteros entre esa fecha y hoy, las dos en hora local. */
function dnHace(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return null;
  const h = new Date(), a = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.max(0, Math.round((new Date(h.getFullYear(), h.getMonth(), h.getDate()) - a) / 86400000));
}
/* Cuándo se tomaron los números. El servidor contesta en UTC; recortar el texto
   tal cual enseñaba una hora seis horas adelantada en México. */
function dnMomento(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return "el " + d.getDate() + " " + DN_MESES[d.getMonth()] + " a las " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
/* Lo que llega de GitHub viene en UTC con hora: recortar el texto daba el día
   siguiente por la noche en México. Se pasa a la fecha local primero. */
function dnLocal(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
const dnHaceTx = n => n === null ? "" : n === 0 ? "hoy" : n === 1 ? "ayer" : "hace " + n + " días";

/* ---- Los tipos de lo que llega al buzón ----
   Una fila por tipo: añadir uno es añadir una línea aquí. Hoy la gente solo
   puede mandar fallos —el formulario de la app tiene un solo tipo—, así que las
   pestañas de sugerencias, dudas y «me gustó» no se dibujan hasta que exista al
   menos uno: una pestaña que no se puede llenar es una pantalla sin camino.

   El tipo viaja DENTRO del mensaje, pegado al lugar: `[Misiones|idea] …`. No
   hace falta tocar el servidor, y `donde` se queda en «reporte», que es lo que
   le da su cupo aparte (ver `apuntar_tropiezo`). Lo que no traiga tipo es un
   fallo, que es lo que eran todos hasta hoy. */
const DN_TIPOS = {
  fallo: { n: "Fallo", pl: "Fallos", tono: "coral", est: { nuevo: "Nuevo", curso: "En curso", hecho: "Resuelto", no: "Descartado" } },
  idea:  { n: "Sugerencia", pl: "Sugerencias", tono: "celeste", est: { nuevo: "Nueva", curso: "Planeada", hecho: "Hecha", no: "Descartada" } },
  duda:  { n: "Duda", pl: "Dudas", tono: "lila", est: { nuevo: "Nueva", curso: "En curso", hecho: "Contestada", no: "Descartada" } },
  /* Un «me gustó» no se planea ni se descarta: se lee. */
  gusto: { n: "Me gustó", pl: "Me gustó", tono: "menta", est: { nuevo: "Nuevo", curso: "En curso", hecho: "Leído", no: "Descartado" }, solo: ["nuevo", "hecho"] },
  auto:  { n: "Error automático", pl: "Automáticos", tono: "acero", est: { nuevo: "Nuevo", curso: "En curso", hecho: "Resuelto", no: "Descartado" } }
};

/* ---- El estado de un reporte (0.7.171) ----
   Cuatro —nuevo, en curso, hecho, descartado—, y cada tipo los nombra a su
   manera: una idea no se «resuelve», se hace. Viven en la columna `estado` de
   `tropiezos`, junto a una nota privada y la versión en que salió.

   **El panel funciona igual sin esas columnas.** El SQL no llega solo: hay que
   pegarlo a mano en Supabase, y entre que sube esta versión y se pega pueden
   pasar días. Mientras `estado` no venga en la respuesta, se deduce de `visto`
   —que es lo único que había— y en vez de los cuatro estados se ofrece lo de
   antes: darlo por atendido. Ver `supabase/LEEME.md`, «Pendiente de pegar». */
const dnEstado = t => t.estado || (t.visto ? "hecho" : "nuevo");
const dnAbierto = t => { const e = dnEstado(t); return e === "nuevo" || e === "curso"; };
const dnPastilla = t => { const e = dnEstado(t); return `<span class="dn-est ${e}">${dnE(DN_TIPOS[dnTipo(t)].est[e] || e)}</span>`; };

/* La etapa sale del número, igual que en el pie de la app (`pintarVersion`). */
const dnEtapa = () => versionMasNueva(VERSION, "0.9.9999") ? "" : versionMasNueva(VERSION, "0.7.9999") ? "Beta" : "Alpha";
function dnVersionHTML() {
  const et = dnEtapa();
  return `<span class="dn-ver">${et ? `<span class="etapa">${et}</span>` : ""}<span class="num">V${dnE(VERSION)}</span>${typeof VERSION_FECHA !== "undefined" ? `<span>· ${dnE(VERSION_FECHA)}</span>` : ""}</span>`;
}
const DN_DONDE_AUTO = { error: "Error de la app", promesa: "Promesa sin atender", puerta: "Error en la puerta", "puerta-promesa": "Promesa en la puerta", tope: "Cupo del día lleno" };
const DN_PREFIJO = /^\s*\[([^\]|]{1,40})(?:\|([a-z]{3,8}))?\]\s*/;

function dnTipo(t) {
  if (t.donde !== "reporte") return "auto";
  const m = DN_PREFIJO.exec(String(t.mensaje || ""));
  return m && m[2] && m[2] !== "auto" && DN_TIPOS[m[2]] ? m[2] : "fallo";
}
function dnLugar(t) {
  if (t.donde !== "reporte") return DN_DONDE_AUTO[t.donde] || String(t.donde || "Sin ubicar");
  const m = DN_PREFIJO.exec(String(t.mensaje || ""));
  return m ? m[1].trim() : "Sin ubicar";
}
/* El mensaje sin la etiqueta del lugar, partido en lo que pasó y lo que hacía
   antes: `reportarFallo` los junta con « · antes: ». */
function dnTexto(t) {
  const s = String(t.mensaje || "");
  if (t.donde !== "reporte") return { que: s, antes: "" };
  const cuerpo = s.replace(DN_PREFIJO, ""), i = cuerpo.lastIndexOf(" · antes: ");
  return i < 0 ? { que: cuerpo, antes: "" } : { que: cuerpo.slice(0, i), antes: cuerpo.slice(i + 10) };
}

/* El estado de la capa. En memoria y no en `state`: es dónde estabas mirando,
   no un dato de nadie. */
const DN = { sala: "hoy", tipo: "todo", ver: "abiertos", q: "", sel: null, num: "gente", rango: 14, lab: "pruebas", cobDias: 30, cobDesde: "", cobHasta: "", cargando: false, error: "", nov: null,
  /* La barrera: lo que contestó la función, el seguro del grifo y la ventana abierta. */
  bar: null, barError: null, seguro: true, cuenta: 15, ventana: null };

const dnTropiezos = () => (metricasCache && metricasCache.tropiezos) || [];
const dnClave = t => t.id != null ? "i" + t.id : [t.dia, t.version, t.donde, t.mensaje].join("|");
function dnFiltrados() {
  const q = DN.q.trim().toLowerCase();
  return dnTropiezos().filter(t =>
    (DN.tipo === "todo" || dnTipo(t) === DN.tipo) &&
    (DN.ver === "todos" || (DN.ver === "abiertos" ? dnAbierto(t) : !dnAbierto(t))) &&
    (!q || (t.mensaje + " " + t.version + " " + dnLugar(t) + " " + (t.de_quien || "")).toLowerCase().includes(q)));
}

/* ---- Lo que está en pruebas ----
   Una fila por prueba, y cada fila sabe decir si está encendida AQUÍ. Hoy una
   prueba vive en la pestaña (`sessionStorage`) o en el perfil, y se enciende
   con un enlace: no hay todavía beta testers ni un «para todos» que se pueda
   decidir desde el panel. Al añadir una prueba a la app, su fila va aquí. */
const dnSesion = (k, v) => { try { return sessionStorage.getItem(k) === v; } catch (e) { return false; } };
const DN_PRUEBAS = [
  { id: "novedades", n: "Pruebas de Novedades", q: "En Ajustes → Novedades, botones para ver la ventana y los anuncios de hito. La lista sigue solo con lo publicado.", on: "?novedades=borrador", off: "?novedades=",
    esta: () => typeof novedadesEnBorrador === "function" && novedadesEnBorrador() },
  { id: "contaste", n: "Mis reportes, con ejemplos", q: "Abre la app con cuatro reportes de ejemplo y su respuesta, para ver la ventana y el aviso sin mandar nada. No toca el servidor.", on: "?contaste=demo", off: "?contaste=0",
    esta: () => dnSesion("norata-prueba-contaste", "demo") },
  { id: "flotante", n: "La burbuja de la computadora", tag: "expansion", q: "Un botón «Flotar» en la barra lateral abre una ventanita encima de todo con el Pomodoro, lo que sigue en la rueda y las misiones de hoy. Sale sola en la cuenta de pruebas; aquí, con el enlace. Nadie más la ve. Solo en Chrome y Edge de escritorio.", on: "?flotante=si", off: "?flotante=no",
    esta: () => dnSesion("norata-prueba-flotante", "si") },
  { id: "informes", n: "Informes con datos de ejemplo", q: "Llena los informes con datos falsos para revisar las gráficas.", on: "?informes=demo", off: "?informes=no",
    esta: () => dnSesion("norata-prueba-informes", "demo") },
  { id: "esqueleto", n: "Esqueletos de carga", tag: "mejora", q: "Las siluetas mientras carga una pantalla. Se descartaron en la 0.7.96.", on: "?esqueleto=1", off: "?esqueleto=0",
    esta: () => dnSesion("norata-prueba-esqueleto", "1") },
  { id: "i18n", n: "Auditoría de textos", q: "Señala lo que falta por traducir al inglés.", on: "?i18n=audita", off: "?i18n=no",
    esta: () => dnSesion("norata-i18n-audita", "1") },
  { id: "aniversario", n: "Aniversario de expedición", q: "Abre el recap con tus datos de verdad. Se gasta al verlo.", on: "?aniversario=1", off: "",
    esta: () => false }
];
const dnEncendidas = () => DN_PRUEBAS.filter(p => { try { return p.esta(); } catch (e) { return false; } });

const DN_ETQ = { expansion: "Expansión", mejora: "Mejora", arreglo: "Arreglo", hito: "Nueva etapa" };
const dnEtq = k => DN_ETQ[k] ? `<span class="dn-etq c-${k}">${DN_ETQ[k]}</span>` : "";

/* ---- Las celebraciones y las pantallas de una vez ----
   Se disparan aquí porque algunas pasan una vez en la vida de una cuenta y no
   hay forma de revisarlas esperándolas. No tocan los datos ni el nivel. */
const FIESTAS = [
  { id: "nivel", rotulo: "Nivel a secas", nota: "Se va sola a los ocho segundos." },
  { id: "rango", rotulo: "Nivel con rango", nota: "Cuando además cambia el nombre del camino." },
  { id: "premio", rotulo: "Nivel con premio", nota: "La que no se cierra tocando fuera." },
  { id: "racha", rotulo: "Hito de racha", nota: "La de las semanas encendidas." },
  { id: "chica", rotulo: "La chica", nota: "El destello de subir una habilidad." }
];

function verLaFiesta(cual) {
  /* Primero se sale de la capa y de Ajustes. Las celebraciones viven en el
     piso de las fiestas (120-130) y esto en el 410: disparada desde aquí, la
     fiesta se dibujaría DEBAJO. Subirle el piso arreglaría el escaparate y
     rompería la regla de las capas; volver a la app enseña además la fiesta
     donde de verdad va a salir. */
  cerrarDentro();
  if (typeof showView === "function") showView("summary");

  if (cual === "racha") { celebrateStreak(30); return; }
  if (cual === "chica") { celebrate("Nivel 7", tx("Guitarra sube de nivel"), "#f5d76e", "music", "habilidad"); return; }

  /* Se toma un nivel de verdad de la escalera para que lo que se vea sea lo
     que va a ver la gente, no un ejemplo inventado. */
  const escalera = typeof escaleraDeExpedicion === "function" ? escaleraDeExpedicion() : [];
  if (cual === "rango") {
    const r = escalera.find(x => x.tipo === "rango" && x.listo && x.nivel > 1) || { nivel: 4 };
    celebrarNivel(r.nivel, [r]);
    return;
  }
  if (cual === "premio") {
    const a = escalera.find(x => x.tipo === "ambiente" && x.listo);
    celebrarNivel(a ? a.nivel : 3, a ? [a] : [{ nivel: 3, tipo: "ambiente", nombre: tx("Un ambiente nuevo") }]);
    return;
  }
  celebrarNivel(Math.max(2, (typeof nivelExpedicion === "function" ? nivelExpedicion().nivel : 2)), []);
}

/* Cada una se abre en ENSAYO: lo que se toque dentro se deshace al cerrar. */
const PANTALLAS_DE_UNA_VEZ = [
  { id: "region", rotulo: "Idioma y moneda", nota: "La primera de todas, en ensayo." },
  { id: "ventana", rotulo: "La ventana de novedades", nota: "La más reciente que abriría ventana." },
  { id: "beta", rotulo: "El anuncio de la beta", nota: "La escena a pantalla completa de la 0.8." },
  { id: "1.0", rotulo: "El anuncio de la 1.0", nota: "Nueve segundos como mucho." }
];

function verLaPantalla(cual) {
  cerrarDentro();
  if (cual === "region" && typeof verLaPantallaDeRegion === "function") verLaPantallaDeRegion();
  if (cual === "ventana" && typeof novedadesProbarVentana === "function") novedadesProbarVentana();
  if ((cual === "beta" || cual === "1.0") && typeof probarHito === "function") probarHito(cual);
}

/* ---- Abrir y cerrar la capa ---- */

function abrirDentro() {
  if (!esAdmin) return;
  let capa = document.getElementById("dentro");
  if (!capa) {
    capa = document.createElement("div");
    capa.id = "dentro";
    capa.className = "dn";
    capa.setAttribute("role", "dialog");
    capa.setAttribute("aria-label", "Puesto de mando");
    document.body.appendChild(capa);
    capa.addEventListener("click", dnClic);
    capa.addEventListener("input", dnEscribe);
    capa.addEventListener("change", dnCambia);
    capa.addEventListener("pointerdown", dnLlaveBaja);
    document.addEventListener("pointermove", dnLlaveMueve);
    document.addEventListener("pointerup", dnLlaveSuelta);
    document.addEventListener("pointercancel", dnLlaveSuelta);
    capa.addEventListener("keydown", ev => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.id === "dn-llave") { ev.preventDefault(); dnQuitaSeguro(); } });
    window.addEventListener("resize", () => { if (dnAbierta()) { clearTimeout(dnDibuja.t); dnDibuja.t = setTimeout(dnDibuja, 120); } });
    document.addEventListener("keydown", ev => { if (ev.key === "Escape" && dnAbierta() && !document.querySelector("#modal.show")) { if (DN.ventana) { dnCierraVentana(); dnPinta(); } else cerrarDentro(); } });
  }
  capa.classList.add("show");
  dnPinta();
  /* Los números se piden al abrir: quien entra aquí viene a verlos. Antes iban
     detrás de un botón, porque esto vivía en Ajustes y no tenía sentido pagar
     la llamada cada vez que alguien entraba a cambiar la zona horaria. */
  if (!metricasCache && !DN.cargando) cargarMetricas();
  dnCargaBarrera();
  if (!DN.nov && typeof cargarNovedades === "function") {
    cargarNovedades().then(es => { DN.nov = es || []; if (dnAbierta()) dnPinta(); }).catch(() => { DN.nov = []; });
  }
}
const dnAbierta = () => { const c = document.getElementById("dentro"); return !!(c && c.classList.contains("show")); };
function cerrarDentro() {
  const c = document.getElementById("dentro");
  if (c) c.classList.remove("show");
}

/* ---- Las salas ---- */

function dnKpi(rot, val, uni, pie, serie) {
  let spark = "";
  if (serie && serie.length > 1) {
    const mx = Math.max(1, ...serie);
    const p = serie.map((v, i) => (i ? "L" : "M") + (i * 100 / (serie.length - 1)).toFixed(1) + " " + (26 - v / mx * 23).toFixed(1)).join(" ");
    spark = `<svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><path d="${p} L100 28 L0 28Z" fill="var(--muted)" opacity=".12"/><path d="${p}" fill="none" stroke="var(--muted)" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  }
  return `<div class="dn-kpi"><span class="rot">${rot}</span><span class="val">${val}<small>${uni || ""}</small></span><span class="pie">${pie || ""}</span>${spark}</div>`;
}
/* «24 de cada 100», con su vara: llega, va a medias o se pierde. Sin gente
   suficiente no hay proporción que valga, y se dice en vez de pintar un cero. */
function dnDeCada(parte, total, vara) {
  if (!total) return { val: "—", uni: "", pie: "Todavía no hay con qué medirlo" };
  const pc = Math.round(parte / total * 100), tono = pc >= vara ? "bien" : pc >= vara / 2 ? "ojo" : "mal";
  const juicio = { bien: "Llega a la vara", ojo: "A medias de la vara", mal: "Lejos de la vara" }[tono];
  return { val: pc, uni: " de cada 100", pie: `<span class="dn-vara ${tono}">${juicio}</span> de ${vara}` };
}

/* Las fichas de una versión que todavía no existe —la beta, la 1.0: sus
   anuncios están escritos de antemano— NO son «por aprobar». El 3 oct 2026
   «Aprobar todas» se las llevó con las demás y estuvieron a un clic de
   anunciarse. Aquí dejan de verse; quien de verdad lo impide es la barrera
   (`herramientas/novedades-futuras.py`). */
const dnFutura = e => /^\d+(\.\d+){1,3}$/.test(String(e.version || "")) && versionMasNueva(String(e.version), VERSION);
function dnBorradores() {
  return (DN.nov || []).filter(e => e && e.estado !== "publicado" && !dnFutura(e));
}
const dnReservadas = () => (DN.nov || []).filter(e => e && dnFutura(e));

function dnSalaHoy() {
  const m = metricasCache, r = m.resumen || {}, c = m.cobro || {}, dias = m.dias || [];
  const tr = dnTropiezos(), gente = tr.filter(t => t.donde === "reporte" && dnEstado(t) === "nuevo").length;
  const autos = tr.filter(t => t.donde !== "reporte" && dnEstado(t) === "nuevo");
  const enVivo = autos.filter(t => t.version === VERSION).length;
  const bor = dnBorradores(), viejo = Math.max(0, ...bor.map(e => dnHace(e.fecha) || 0));
  const enc = dnEncendidas();
  const cola = (DN.bar && DN.bar.cola) || [], cerrado = DN.bar && DN.bar.grifo && DN.bar.grifo.grifo === "cerrado";
  const colaVieja = Math.max(0, ...cola.map(c => dnHace(c.fecha) || 0));
  const filas = [
    cola.length ? [colaVieja >= 5 ? "ojo" : cerrado ? "ojo" : "dato", cola.length, cola.length === 1 ? "cambio espera en la cola" : "cambios esperan en la cola",
      colaVieja >= 5 ? "El más viejo lleva " + colaVieja + " días sin subir" : cerrado ? (dnProximoPaquete().faltan === 0 ? "Hoy toca el paquete: revísalos y súbelos" : "Es el paquete de la semana: sale " + dnProximoPaquete().texto) : "Detenidos: traen SQL o no pasaron las comprobaciones", "ir:subidas"] : null,
    gente ? ["ojo", gente, gente === 1 ? "reporte nuevo en el buzón" : "reportes nuevos en el buzón", "Lo que alguien se sentó a escribir", "ir:buzon"] : null,
    autos.length ? [enVivo ? "mal" : "ojo", autos.length, autos.length === 1 ? "error automático nuevo" : "errores automáticos nuevos",
      enVivo ? enVivo + (enVivo === 1 ? " se vio" : " se vieron") + " en la " + VERSION + ", la publicada" : "Ninguno en la " + VERSION + ", la publicada", "auto"] : null,
    (r.pidieron_borrado || 0) > 0 ? ["mal", r.pidieron_borrado, r.pidieron_borrado === 1 ? "cuenta pidió borrarse" : "cuentas pidieron borrarse", "En el plazo de 30 días para arrepentirse", "ir:numeros"] : null,
    (r.sin_confirmar || 0) > 0 ? ["ojo", r.sin_confirmar, r.sin_confirmar === 1 ? "cuenta sin confirmar el correo" : "cuentas sin confirmar el correo", "Se registraron y nunca pulsaron el enlace", "ir:numeros"] : null,
    (r.nunca_abrieron || 0) > 0 ? ["ojo", r.nunca_abrieron, r.nunca_abrieron === 1 ? "cuenta nunca abrió la app" : "cuentas nunca abrieron la app", "Tienen cuenta y jamás entraron", "ir:numeros"] : null,
    bor.length ? [viejo >= 5 ? "ojo" : "dato", bor.length, bor.length === 1 ? "novedad por aprobar" : "novedades por aprobar", viejo >= 5 ? "La más vieja lleva " + viejo + " días sin aprobar" : "Esperan tu visto bueno antes de salir", "ir:subidas"] : null,
    enc.length ? ["dato", enc.length, enc.length === 1 ? "prueba encendida aquí" : "pruebas encendidas aquí", enc.map(p => p.n).join(", "), "ir:lab"] : null
  ].filter(Boolean);
  const sig = dnDeCada(r.siguen30 || 0, r.maduros || 0, 20);
  const altas7 = dnSuma(dias.slice(-7).map(d => d.altas));
  const pers = dias.slice(-14).map(d => Number(d.personas) || 0);
  const s7 = pers.slice(-7), p7 = pers.slice(-14, -7);
  return `
    <div class="dn-cab"><h2>Hoy</h2><div class="dn-der"><button class="dn-btn b-ghost mini" data-a="repedir">Volver a pedirlos</button></div>
      <p>Números tomados ${dnE(dnMomento(m.al_momento))} · publicada la ${dnE(VERSION)}</p></div>
    <div class="dn-kpis">
      ${dnKpi("Personas activas esta semana", r.activos7 || 0, "", (r.activos30 || 0) + " en 30 días", pers)}
      ${dnKpi("Cuentas creadas", r.cuentas || 0, "", "+" + altas7 + " esta semana", dias.slice(-14).map(d => Number(d.altas) || 0))}
      ${dnKpi("Siguen tras 30 días", sig.val, sig.uni, sig.pie)}
      ${c.desplegado === false ? dnKpi("Pagando ahora", "—", "", "El cobro no está desplegado") : dnKpi("Pagando ahora", c.pagando || 0, "", "$" + (c.mrr || 0) + " MXN al mes")}
    </div>
    <div class="dn-rejilla hoy">
      <div class="dn-panel"><h3>Para atender</h3>
        ${filas.length ? `<div class="dn-atender">${filas.map(f => `<button data-a="${f[4]}"><span class="n ${f[0]}">${f[1]}</span><span><b>${f[2]}</b><small>${dnE(f[3])}</small></span>${dnIc("flecha")}</button>`).join("")}</div>`
          : `<div class="dn-vacio">Nada pide tu atención ahora mismo.</div>`}
      </div>
      <div class="dn-panel"><div class="dn-pcab"><h3>Personas que abrieron la app</h3><span class="dn-chip dn-der">14 días</span></div>
        <div class="dn-graf" data-g="mini"></div>
        ${p7.length === 7 ? `<p class="dn-nota">Promedio de los últimos siete días: ${(dnSuma(s7) / 7).toFixed(1)} al día, contra ${(dnSuma(p7) / 7).toFixed(1)} la semana anterior.</p>` : ""}
      </div>
    </div>`;
}

function dnSalaBuzon() {
  const tr = dnTropiezos();
  const abiertos = t => tr.filter(x => (t === "todo" || dnTipo(x) === t) && dnAbierto(x)).length;
  /* Fallos y automáticos, siempre; los demás, cuando haya al menos uno. */
  const tipos = Object.keys(DN_TIPOS).filter(t => t === "fallo" || t === "auto" || tr.some(x => dnTipo(x) === t));
  const sel = tr.find(t => dnClave(t) === DN.sel);
  const nuevos = tr.filter(t => dnEstado(t) === "nuevo").length;
  const sinEstados = tr.length && tr.every(t => t.estado === undefined);
  return `
    <div class="dn-cab"><h2>Buzón</h2>${nuevos ? `<div class="dn-der"><button class="dn-btn b-soft mini" data-a="vistos">Dar por atendidos los ${nuevos} nuevos</button></div>` : ""}</div>
    <div class="dn-tipos">
      <button class="${DN.tipo === "todo" ? "on" : ""}" data-a="tipo:todo">Todo <em>${abiertos("todo")}</em></button>
      ${tipos.map(t => `<button class="c-${DN_TIPOS[t].tono} ${DN.tipo === t ? "on" : ""}" data-a="tipo:${t}">${dnIc(t)}${DN_TIPOS[t].pl} <em>${abiertos(t)}</em></button>`).join("")}
    </div>
    <div class="dn-filtros">
      <div class="dn-seg" role="radiogroup" aria-label="Qué se ve">${[["abiertos", "Abiertos"], ["cerrados", "Cerrados"], ["todos", "Todos"]].map(o => `<button class="${DN.ver === o[0] ? "on" : ""}" data-a="ver:${o[0]}">${o[1]}</button>`).join("")}</div>
      <label class="dn-buscar">${dnIc("buscar")}<input id="dn-q" type="search" placeholder="Buscar por texto, lugar o versión" value="${escapeAttr(DN.q)}" aria-label="Buscar en el buzón"></label>
    </div>
    <div class="dn-bz" data-abierto="${sel ? 1 : 0}">
      <div class="dn-lista" id="dn-lista">${dnListaHTML()}</div>
      <div class="dn-det">${sel ? dnDetalleHTML(sel) : `<div class="dn-vacio">Elige uno de la lista para leerlo entero.</div>`}</div>
    </div>
    <p class="dn-nota">Llegan los de los últimos treinta días.${sinEstados ? " Los estados, la nota y «salió en la versión» se encienden al pegar en Supabase el SQL pendiente." : ""}</p>`;
}
function dnListaHTML() {
  const f = dnFiltrados();
  if (!f.length) return `<div class="dn-vacio">${DN.q ? "Nada coincide con esa búsqueda." : DN.ver === "abiertos" ? "No queda nada abierto aquí." : "Todavía no hay nada en esta lista."}</div>`;
  return f.map(t => {
    const tipo = dnTipo(t), k = dnClave(t);
    return `<button class="dn-it ${dnEstado(t) === "nuevo" ? "nuevo" : ""} ${k === DN.sel ? "sel" : ""}" data-a="sel" data-k="${escapeAttr(k)}">
      <span class="dn-tic t-${DN_TIPOS[tipo].tono}">${dnIc(tipo)}</span>
      <span><span class="tx">${dnE(dnTexto(t).que)}</span>
        <span class="meta">${dnPastilla(t)}<span>${dnE(dnLugar(t))}</span><span>· v${dnE(t.version || "?")}</span><span>· ${dnE(dnDia(t.dia))}</span>${t.de_quien ? `<span>· ${dnE(t.de_quien)}</span>` : ""}${(Number(t.cuantos) || 1) > 1 ? `<span class="dn-chip">${Number(t.cuantos)}×</span>` : ""}</span></span>
    </button>`;
  }).join("");
}
/* Las versiones que se ofrecen en «salió en la versión»: la publicada y las
   últimas del changelog. La que ya tenga apuntada el reporte entra siempre. */
function dnVersiones(extra) {
  const u = [];
  [VERSION].concat((DN.nov || []).map(e => String(e.version || ""))).forEach(v => { if (/^\d+\.\d+\.\d+/.test(v) && u.indexOf(v) < 0) u.push(v); });
  const corta = u.slice(0, 8);
  if (extra && corta.indexOf(extra) < 0) corta.push(extra);
  return corta;
}
function dnDetalleHTML(t) {
  const tipo = dnTipo(t), T = DN_TIPOS[tipo], maq = tipo === "auto", tx2 = dnTexto(t), n = Number(t.cuantos) || 1, hace = dnHace(t.dia), est = dnEstado(t);
  const conEstados = t.estado !== undefined && t.id != null;
  let auto = "";
  if (maq && t.donde !== "tope") {
    const repite = t.version !== VERSION && dnTropiezos().some(x => x !== t && x.mensaje === t.mensaje && x.version === VERSION);
    auto = `<div class="dn-aviso">${t.version === VERSION ? `<b>Sigue activo.</b> Se vio en la ${dnE(VERSION)}, que es la publicada.`
      : repite ? `<b>Sigue activo.</b> El mismo error aparece también en la ${dnE(VERSION)}.`
      : `<b>Callado.</b> No se ha repetido en la ${dnE(VERSION)}; la última vez fue ${dnE(dnHaceTx(hace))}.`}</div>`;
  }
  const gestion = conEstados ? `
    <div class="dn-campo"><span>Estado</span>
      <div class="dn-seg" role="radiogroup" aria-label="Estado">${(T.solo || ["nuevo", "curso", "hecho", "no"]).map(k => `<button class="${est === k ? "on" : ""}" data-a="estado:${k}">${T.est[k]}</button>`).join("")}</div></div>
    ${est === "hecho" && tipo !== "gusto" && tipo !== "duda" ? `<label class="dn-campo"><span>Salió en la versión</span>
      <select id="dn-arreglado"><option value="">Sin apuntar</option>${dnVersiones(t.arreglado).map(v => `<option value="${escapeAttr(v)}" ${t.arreglado === v ? "selected" : ""}>${dnE(v)}</option>`).join("")}</select></label>` : ""}
    <label class="dn-campo"><span>Nota para ti · nadie más la ve</span>
      <textarea id="dn-nota" rows="2" maxlength="500" placeholder="Qué sospechas, dónde mirar">${dnE(t.nota || "")}</textarea></label>
    ${dnRespuestaHTML(t, maq)}` : "";
  return `
    <button class="dn-btn b-ghost mini dn-volver" data-a="volver">${dnIc("atras")}Buzón</button>
    <div class="dn-dcab"><span class="dn-tic t-${T.tono}">${dnIc(tipo)}</span><h3>${T.n}</h3>${dnPastilla(t)}</div>
    <p class="dn-dicho ${maq ? "maq" : ""}">${dnE(tx2.que)}</p>
    <dl class="dn-ficha">
      <dt>${maq ? "Origen" : "Dónde"}</dt><dd>${dnE(dnLugar(t))}</dd>
      ${tx2.antes ? `<dt>Justo antes</dt><dd>${dnE(tx2.antes)}</dd>` : ""}
      ${t.de_quien ? `<dt>De</dt><dd>${dnE(t.de_quien)} <button class="dn-btn b-ghost mini" data-a="dequien" data-k="${escapeAttr(t.de_quien.split(",")[0].trim())}">Ver sus reportes</button></dd>` : ""}
      <dt>Versión</dt><dd>${dnE(t.version || "?")}${t.version === VERSION ? " · la publicada" : ""}</dd>
      <dt>Llegó</dt><dd>${dnE(dnDia(t.dia))}${hace ? " · " + dnHaceTx(hace) : ""}${n > 1 ? (maq ? ` · pasó ${n} veces ese día` : ` · lo escribieron ${n} veces`) : ""}</dd>
      ${t.arreglado && est === "hecho" ? `<dt>Salió en</dt><dd>${dnE(t.arreglado)}</dd>` : ""}
    </dl>
    ${auto}${gestion}
    <div class="dn-acciones">
      ${conEstados || t.id == null ? "" : `<button class="dn-btn ${t.visto ? "b-ghost" : "b-soft"} mini" data-a="atender">${dnIc(t.visto ? "atras" : "check")}${t.visto ? "Volver a dejarlo abierto" : "Darlo por atendido"}</button>`}
      <button class="dn-btn b-linea mini" data-a="copiar:reporte">${dnIc("copiar")}Copiar para Claude</button>
    </div>`;
}

/* ---- La respuesta de vuelta (0.7.190) ----
   Lo que se escribe aquí lo lee quien mandó el reporte, en «Lo que me
   contaste». Tres cosas a propósito:

   - Se MANDA con su botón, no al salir del campo como la nota: la nota es
     tuya y un borrador a medias no le hace daño a nadie; esto le llega a otra
     persona.
   - El panel sabe el APODO y una clave corta (`de_quien`), no el correo ni el
     nombre. `con_cuenta` dice cuántas cuentas hay detrás: si es cero —lo mandó sin sesión, o antes de que los reportes se
     ligaran a la cuenta— no hay a quién contestarle, y se dice en vez de
     dejar escribir una respuesta que no va a leer nadie.
   - Sin el SQL de las respuestas, `respuesta` no viene y este bloque no sale. */
function dnRespuestaHTML(t, maq) {
  if (maq || t.respuesta === undefined) return "";
  const n = Number(t.con_cuenta) || 0;
  if (!n) return `<div class="dn-campo"><span>Respuesta</span><p class="dn-nota">No hay a quién contestarle: lo mandó sin su sesión iniciada, o antes de que los reportes se ligaran a la cuenta.</p></div>`;
  return `<label class="dn-campo"><span>Respuesta · la lee quien lo escribió${n > 1 ? " (" + n + " cuentas)" : ""}</span>
      <textarea id="dn-respuesta" rows="3" maxlength="600" placeholder="Qué pasó con lo que te contó, en una o dos frases">${dnE(t.respuesta || "")}</textarea></label>
    <div class="dn-acciones"><button class="dn-btn b-primary mini" data-a="responder">${t.respuesta ? "Enviar el cambio" : "Enviar respuesta"}</button>${t.respondido ? `<span class="dn-chip">Enviada ${dnE(dnMomento(t.respondido))}</span>` : ""}</div>`;
}

/* ---- La barrera de subidas (0.7.173) ----
   Lo que hace y por qué existe está en `.github/workflows/barrera.yml`. Aquí
   se ve y se manda: la cola, el grifo y cómo fueron las últimas subidas.

   Todo sale de la función `barrera` de Supabase, y hasta que esa función, su
   llave y su SQL estén puestos, la sala dice QUÉ falta en vez de dibujar un
   grifo que no mueve nada. */
function dnCargaBarrera() {
  if (typeof sbBarrera !== "function") return Promise.resolve();
  return sbBarrera("estado").then(b => { dnTomaEstado(b); })
    .catch(e => { DN.bar = null; DN.barError = { texto: e.message || String(e), falta: e.falta || "" }; })
    .then(() => { if (dnAbierta()) dnPinta(); });
}
/* Después de mandar algo, GitHub tarda en enterarse y el trabajo en correr:
   se vuelve a preguntar un par de veces en vez de dejar la sala con lo viejo. */
function dnRepreguntaBarrera() {
  [4000, 20000, 60000, 120000].forEach(ms => setTimeout(() => { if (dnAbierta()) dnCargaBarrera(); }, ms));
}
/* ---- La sala de Subidas se refresca sola (0.7.196) ----
   Después de aprobar algo, la sala se quedaba igual hasta que uno volvía a
   entrar: la subida tarda uno o dos minutos en GitHub y aquí no se veía nada
   moverse. Eduardo lo pidió con esas palabras: «una animación de cargando y
   que se refresque solo».

   Un solo latido mientras la sala está a la vista: cada 6 segundos si hay una
   subida en marcha, cada 30 si no. Lo de GitHub tiene cupo —cada pregunta son
   varias llamadas con la llave—, y por eso no late con la sala cerrada, con la
   pestaña escondida ni con otra sala abierta.

   Solo se repinta si lo que contestó el servidor CAMBIÓ: repintar cada seis
   segundos lo mismo reiniciaba las animaciones y le quitaba el sitio a quien
   estuviera leyendo. Y no se repinta con la llave en la mano ni con el seguro
   quitado, que el repintado se llevaría el gesto. */
const dnEnMarcha = () => !!DN.subiendo || ((DN.bar && DN.bar.corridas) || []).some(c => c.estado !== "completed");
function dnLatido() {
  clearTimeout(DN.latido);
  DN.latido = null;
  if (!dnAbierta() || DN.sala !== "subidas") return;
  DN.latido = setTimeout(async () => {
    DN.latido = null;
    if (!dnAbierta() || DN.sala !== "subidas") return;
    if (document.hidden || dnArr || !DN.seguro || DN.grifoPend || typeof sbBarrera !== "function") { dnLatido(); return; }
    try {
      if (dnTomaEstado(await sbBarrera("estado"))) dnPinta();
    } catch (e) { /* un latido que falla no dice nada: el siguiente vuelve a preguntar */ }
    dnLatido();
  }, dnEnMarcha() ? 6000 : 30000);
}
/* Lo que contestó el servidor, venga del latido o de una pregunta suelta: se
   guarda, se decide si la subida ya terminó y se avisa. Devuelve si cambió
   algo que haya que repintar. */
function dnTomaEstado(b) {
  const antes = JSON.stringify(DN.bar || null), estaba = dnEnMarcha(), colaAntes = ((DN.bar && DN.bar.cola) || []).length;
  const corriendo = (b.corridas || []).some(c => c.estado !== "completed");
  /* GitHub tarda unos segundos en dar de alta la corrida: recién mandada la
     orden, que todavía no salga ninguna en marcha no quiere decir que haya
     terminado. A los cinco minutos se suelta pase lo que pase. */
  if (DN.subiendo) {
    const lleva = Date.now() - DN.subiendo;
    if ((!corriendo && lleva > 20000) || lleva > 300000) DN.subiendo = 0;
  }
  DN.bar = b; DN.barError = null;
  const sigue = dnEnMarcha();
  if (estaba && !sigue) {
    const u = (b.corridas || [])[0], cola = (b.cola || []).length;
    if (u && u.resultado && u.resultado !== "success") toast("La subida no terminó bien: mira «Las últimas veces».", "atencion");
    else if (cola < colaAntes || !cola) toast("Ya está en vivo.", "hecho");
    /* Lo que se aprobó pudo cambiar las novedades: se vuelven a leer. */
    if (typeof cargarNovedades === "function") cargarNovedades().then(es => { DN.nov = es || []; if (dnAbierta()) dnPinta(); }).catch(() => {});
  }
  return JSON.stringify(b) !== antes || estaba !== sigue;
}
/* La tira de «está subiendo», arriba de la cola. */
function dnSubiendoHTML() {
  if (!dnEnMarcha()) return "";
  return `<div class="dn-subiendo" role="status"><span class="dn-giro" aria-hidden="true"></span><div><b>Subiendo al vivo…</b><span>Tarda uno o dos minutos. Esta sala se actualiza sola.</span></div><i class="dn-corre" aria-hidden="true"></i></div>`;
}
const dnGrifoAbierto = () => !!(DN.bar && DN.bar.grifo && DN.bar.grifo.grifo === "abierto");

function dnGrifoHTML() {
  const abierto = dnGrifoAbierto();
  const acc = abierto ? `<button class="dn-btn b-coral" data-a="emergencia">Cierre de emergencia</button>`
    : DN.seguro ? `<div class="dn-cerrojo"><button class="dn-llave" id="dn-llave" aria-label="Llave. Arrástrala hasta la cerradura para quitar el seguro">${dnIc("llave")}</button><span class="dn-riel"></span><span class="dn-cerradura" id="dn-cerradura">${dnIc("cerradura")}</span></div><small>Arrastra la llave a la cerradura</small>`
    : `<span class="dn-sin-seguro">Sin seguro por <b id="dn-cuenta">${DN.cuenta}</b> segundos</span><button class="dn-btn b-oro dn-late" data-a="grifo:abrir">Abrir el grifo</button>`;
  const ahora = abierto ? "abierto" : DN.seguro ? "cerrado" : "suelto", antes = DN.grifoVisto || ahora;
  DN.grifoVisto = ahora;
  return `<div class="dn-grifo ${abierto ? "abierto" : DN.seguro ? "" : "suelto"} ${ahora !== antes ? "cambia" : ""} ${(ahora === "abierto") !== (antes === "abierto") ? "gira" : ""}">
    <button class="dn-interruptor" role="switch" aria-checked="${abierto}" aria-label="Grifo de subidas" data-a="grifo:${abierto ? "cerrar" : "abrir"}"><i>${dnIc(abierto ? "subidas" : DN.seguro ? "candado" : "flecha")}</i></button>
    <div><h3>${abierto ? "Grifo abierto" : "Grifo cerrado"}</h3><p>${abierto ? "Lo que se sube a main llega solo al vivo. Lo que traiga SQL se queda en la cola, y lo que llegue detrás espera con él." : "Nada llega al vivo sin tu aprobación: lo que se sube a main espera aquí."}</p></div>
    <div class="acc">${acc}</div>${dnGrifoVeloHTML()}</div>`;
}
/* Mientras el servidor contesta, la tarjeta ENTERA lo dice. Abrir o cerrar
   tarda un segundo o dos —pasa por Supabase y, al abrir, por GitHub—, y en ese
   rato la tarjeta se quedaba igual y de golpe cambiaba: parecía que el toque
   no había hecho nada (Eduardo, 3 oct 2026). El candado va dibujado en dos
   piezas para que el arco se pueda mover solo. */
function dnGrifoVeloHTML() {
  const p = DN.grifoPend;
  if (!p) return "";
  return `<div class="dn-grifo-velo ${p}" role="status"><svg class="dn-cand" viewBox="0 0 24 24" aria-hidden="true"><path class="arco" d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/><path class="caja" d="M6 11h12v9H6z"/></svg><b>${p === "abriendo" ? "Abriendo el grifo…" : "Cerrando el grifo…"}</b></div>`;
}

/* Lo que falta para que la barrera funcione, dicho pieza por pieza. */
function dnBarreraFaltaHTML() {
  const e = DN.barError || {};
  const que = e.falta === "funcion" ? "La función <code>barrera</code> todavía no está desplegada en Supabase."
    : e.falta === "llave" ? "La función está puesta, pero le falta la llave de GitHub (<code>GITHUB_BARRERA</code>)."
    : e.falta === "sql" ? "Falta pegar <code>supabase/barrera.sql</code> en Supabase."
    : dnE(e.texto || "No pude preguntar por la barrera.");
  return `<div class="dn-panel"><h3>La barrera todavía no está conectada</h3>
      <p class="dn-nota">${que} Hasta entonces, lo que se sube a <code>main</code> sigue llegando directo al vivo.</p>
      <div class="dn-acciones"><button class="dn-btn b-linea mini" data-a="barrera">Volver a preguntar</button></div></div>`;
}

/* ---- El paquete de la semana (0.7.199) ----
   Eduardo, al pedir la barrera: que las subidas «sean más consistentes, y no
   sean spam de mini updates». Con el grifo CERRADO, lo terminado se junta en
   la cola y sube de una vez: eso es el paquete. Para quien usa la app es una
   sola versión —la última de la tanda—, por muchos cambios que traiga.

   Lo que el boceto tenía y aquí NO existe, porque no puede: meter y sacar
   cambios sueltos del paquete. `main` es la cola y `vivo` solo avanza en
   orden; un cambio no se salta, se revierte.

   El día es un RECORDATORIO, no un reloj: nada sube sin su aprobación. Se
   elige aquí y se guarda en este dispositivo (`localStorage`): es una
   preferencia de quien administra, no un dato de la app. */
const DN_DIAS_SEM = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function dnDiaPaquete() {
  try { const v = Number(localStorage.getItem("norata-paquete-dia")); return v >= 0 && v <= 6 && localStorage.getItem("norata-paquete-dia") !== null ? v : 4; } catch (e) { return 4; }
}
/* Cuántos días faltan para el día del paquete (0 = hoy), y esa fecha. */
function dnProximoPaquete() {
  const hoy = new Date(), faltan = (dnDiaPaquete() - hoy.getDay() + 7) % 7;
  const f = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + faltan);
  return { faltan: faltan, texto: faltan === 0 ? "hoy" : faltan === 1 ? "mañana" : "el " + DN_DIAS_SEM[f.getDay()] + " " + f.getDate() + " " + DN_MESES[f.getMonth()] };
}
/* Cuántas versiones llegaron al vivo en los últimos siete días. */
function dnSubidasDeLaSemana() {
  const hace7 = Date.now() - 7 * 864e5;
  return ((DN.bar && DN.bar.historial) || []).filter(h => Date.parse(h.fecha) >= hace7).length;
}
function dnPaqueteHTML(cola) {
  const p = dnProximoPaquete(), d = dnDiaPaquete(), sueltas = dnSubidasDeLaSemana();
  return `<div class="dn-paquete">
      <p class="dn-nota">Todo lo terminado se junta aquí y sube de una vez: para quien usa la app es una sola versión, la última de la tanda.${sueltas > 1 ? " En los últimos 7 días llegaron al vivo " + sueltas + " versiones." : ""}</p>
      <div class="dn-campo"><span>Día del paquete</span>
        <div class="dn-seg" role="radiogroup" aria-label="Día del paquete">${[1, 2, 3, 4, 5, 6, 0].map(n => `<button class="${d === n ? "on" : ""}" data-a="paqdia:${n}" aria-label="${DN_DIAS_SEM[n]}">${DN_DIAS_SEM[n].slice(0, 2)}</button>`).join("")}</div></div>
      ${p.faltan === 0 && cola.length ? `<div class="dn-aviso dn-ojo"><b>Hoy toca el paquete.</b> ${cola.length === 1 ? "Hay 1 cambio listo" : "Hay " + cola.length + " cambios listos"}: revísalos y súbelos con «Subir todo al vivo».</div>` : ""}</div>`;
}

function dnColaHTML() {
  const b = DN.bar, cola = b.cola || [], abierto = dnGrifoAbierto();
  const conSql = cola.filter(c => (c.sql || []).length).length;
  /* Con el grifo abierto, lo que hay en la cola está ahí por UNO: el primero,
     que trae SQL (o que no pasó una comprobación), y como se aprueba en orden
     los de detrás esperan aunque no traigan nada. Eduardo lo preguntó al ver
     seis cambios detenidos con el grifo abierto: la sala no decía cuál la
     tenía parada ni por qué. */
  const tapon = abierto && cola.length ? cola[0] : null, taponSql = tapon && (tapon.sql || []).length;
  const nombre = c => c.version ? "la " + dnE(c.version) : "«" + dnE(c.titulo || "un cambio") + "»";
  const clase = v => { const e = (DN.nov || []).find(x => String(x.version) === String(v)); return e ? (typeof novedadClase === "function" ? novedadClase(e) : e.clase) : ""; };
  return `<div class="dn-panel"><div class="dn-pcab"><h3>${abierto ? "Detenido en la cola" : "El paquete de la semana"}</h3><span class="dn-chip">${cola.length}</span>${abierto ? "" : `<span class="dn-chip">sale ${dnE(dnProximoPaquete().texto)}</span>`}
        ${cola.length ? `<div class="dn-der"><button class="dn-btn b-primary mini" data-a="subir:" ${dnEnMarcha() ? "disabled" : ""}>${dnIc("subidas")}${dnEnMarcha() ? "Subiendo…" : "Subir todo al vivo"}</button></div>` : ""}</div>
      ${abierto ? "" : dnPaqueteHTML(cola)}
      ${tapon ? `<div class="dn-aviso dn-ojo"><b>Detenida por ${nombre(tapon)}${taponSql ? ", que trae SQL" : ""}.</b> ${taponSql ? "Un SQL no llega solo a Supabase, así que no sube hasta que digas que ya lo pegaste." : "No pasó las comprobaciones de la barrera: el motivo está en «Las últimas veces»."}${cola.length > 1 ? (cola.length === 2 ? " El cambio de detrás espera" : " Los " + (cola.length - 1) + " de detrás esperan") + " aunque el grifo esté abierto, porque se aprueba en orden." : ""}</div>` : ""}
      ${cola.length ? `<p class="dn-nota">Se aprueba en orden: «Subir hasta aquí» lleva al vivo ese cambio y todos los de arriba.${conSql ? " Lo que trae SQL pide que lo hayas pegado antes." : ""}</p>` : ""}
      ${!cola.length ? `<div class="dn-vacio">${abierto ? "Nada detenido. Lo que se sube a main está llegando solo." : "El paquete está vacío. Lo que se suba a main aparecerá aquí."}</div>` : cola.map((c, i) => {
        const h = dnHace(dnLocal(c.fecha)), sql = (c.sql || []).length, detras = tapon && i > 0;
        return `<div class="dn-prueba"><div>
            <div class="dn-sobre-t">${dnEtq(clase(c.version))}<span class="dn-estado ${h !== null && h >= 5 ? "e-espera" : "e-no"}">${dnIc("reloj")}${h !== null && h >= 5 ? "Lleva " + h + " días sin subir" : detras ? "Espera al de arriba" : tapon ? "Detiene la cola, " + dnHaceTx(h) : "En cola, " + dnHaceTx(h)}</span>${sql ? `<span class="dn-estado e-sql">${dnIc("db")}Trae SQL</span>` : ""}</div>
            <h4>${dnE(c.titulo || "Sin título")}${c.version ? `<span class="dn-chip">${dnE(c.version)}</span>` : ""}</h4>
            ${sql ? `<p class="dn-interno">Interno · ${dnE((c.sql || []).join(", "))} · no sale en el changelog</p>` : ""}</div>
          <div class="dn-acciones"><button class="dn-btn b-soft mini" data-a="subir:${dnE(c.sha)}" ${dnEnMarcha() ? "disabled" : ""}>Subir hasta aquí</button></div></div>`;
      }).join("")}</div>`;
}

function dnCorridasHTML() {
  const cs = (DN.bar.corridas || []).slice(0, 6);
  if (!cs.length) return "";
  const que = c => c.estado !== "completed" ? ["e-espera", "reloj", "En marcha"] : c.resultado === "success" ? ["e-ok", "check", "Terminó bien"] : ["e-yo", "x", "Falló"];
  return `<div class="dn-panel"><h3>Las últimas veces que pasó algo por la barrera</h3>
      ${cs.map(c => { const q = que(c), h = dnHace(dnLocal(c.creado)); return `<div class="dn-prueba"><div>
          <div class="dn-sobre-t"><span class="dn-estado ${q[0]}">${dnIc(q[1])}${q[2]}</span><span class="dn-chip">${c.clase === "regreso" ? "regreso de emergencia" : c.evento === "push" ? "al subir a main" : "aprobada a mano"}</span><span class="dn-chip">${dnHaceTx(h)}</span></div>
          <h4>${dnE(dnPartirTitulo(c.titulo))}</h4></div>
        <div class="dn-acciones"><a class="dn-btn b-ghost mini" href="${escapeAttr(c.url)}" target="_blank" rel="noopener">Ver en GitHub</a></div></div>`; }).join("")}</div>`;
}
const dnPartirTitulo = t => String(t || "").split("\n")[0];

/* ---- Lo que estuvo en vivo, y el regreso a una versión sana ----
   El historial sale de los paquetes de Android: cada vez que algo llega a
   `vivo` se fabrica uno, así que su lista ES lo publicado, con su fecha.

   Una versión está SANA si estuvo 24 horas o más en vivo sin errores nuevos
   ni fallos abiertos. «En vigilancia» es solo para la que está en vivo: una
   que reemplazó otra antes de sus 24 horas ya no las va a cumplir, y se
   quedaba en vigilancia para siempre (lo vio Eduardo el 3 oct 2026). Esa pasa
   a DE PASO, que es definitivo: no tuvo tiempo de probarse, así que no cuenta
   como sana para el regreso automático, pero se puede elegir a mano. El boceto pedía además «abierta por al menos diez
   dispositivos», y se cayó al construirlo: los números de la app dicen en qué
   versión está HOY cada persona, no por cuáles pasó, así que de una versión
   vieja no se puede saber quién la abrió.

   Regresar no borra nada: publica el contenido de la versión elegida con un
   número nuevo y cierra el grifo (`.github/workflows/regreso.yml`). */
function dnSalud(lista) {
  const ts = dnTropiezos(), ahora = Date.now();
  return lista.map((h, i) => {
    const hasta = i ? Date.parse(lista[i - 1].fecha) : ahora;
    const horas = Math.max(0, (hasta - Date.parse(h.fecha)) / 36e5);
    const viejas = lista.slice(i + 1).map(x => x.version);
    const autos = ts.filter(t => dnTipo(t) === "auto" && t.version === h.version);
    const nuevos = autos.filter(t => !ts.some(x => x !== t && x.mensaje === t.mensaje && viejas.indexOf(x.version) >= 0)).length;
    const fallos = ts.filter(t => dnTipo(t) === "fallo" && t.version === h.version && dnAbierto(t)).length;
    const est = nuevos || fallos ? "mal" : horas >= 24 ? "sana" : i ? "paso" : "vig";
    const dias = Math.round(horas / 24);
    const dur = horas < 24 ? (i ? "duró " : "") + Math.max(1, Math.round(horas)) + " h" + (i ? " y la reemplazó otra" : " en vivo") : dias + (dias === 1 ? " día en vivo" : " días en vivo");
    const cosas = [nuevos ? nuevos + (nuevos === 1 ? " error nuevo" : " errores nuevos") : "", fallos ? fallos + (fallos === 1 ? " fallo abierto" : " fallos abiertos") : ""].filter(Boolean);
    return Object.assign({}, h, { est: est, horas: horas, texto: (cosas.length ? cosas.join(" · ") : "Sin errores nuevos") + " · " + dur });
  });
}
const dnHistorial = () => dnSalud(((DN.bar && DN.bar.historial) || []).slice(0, 15));
const dnUltimaSana = () => dnHistorial().slice(1).find(h => h.est === "sana") || null;

function dnHistorialHTML() {
  const hs = dnHistorial().slice(0, 8);
  if (!hs.length) return "";
  const est = { sana: ["e-ok", "check", "Sana"], vig: ["e-espera", "reloj", "En vigilancia"], paso: ["e-no", "flecha", "De paso"], mal: ["e-yo", "fallo", "Con problemas"] };
  const u = dnUltimaSana();
  return `<div class="dn-panel"><div class="dn-pcab"><h3>Lo que estuvo en vivo</h3>
        ${u ? `<div class="dn-der"><button class="dn-btn b-coral mini" data-a="regresar:${dnE(u.version)}">${dnIc("regreso")}Regresar a la ${dnE(u.version)}</button></div>` : ""}</div>
      <p class="dn-nota">Sana: estuvo 24 horas o más en vivo sin errores nuevos ni fallos abiertos. De paso: la reemplazó otra antes, así que no le dio tiempo de probarse. Regresar publica otra vez su contenido con un número nuevo y cierra el grifo.</p>
      ${hs.map((h, i) => { const q = est[h.est]; return `<div class="dn-prueba"><div>
          <div class="dn-sobre-t"><span class="dn-estado ${q[0]}">${dnIc(q[1])}${q[2]}</span>${i ? "" : `<span class="dn-chip">en vivo</span>`}<span class="dn-chip">${dnE(dnDia(dnLocal(h.fecha)))}</span></div>
          <h4>V${dnE(h.version)}</h4><p>${dnE(h.texto)}</p></div>
        ${i ? `<div class="dn-acciones"><button class="dn-btn b-ghost mini" data-a="regresar:${dnE(h.version)}">Regresar aquí</button></div>` : ""}</div>`; }).join("")}</div>`;
}

function dnVentanaHTML() {
  const v = DN.ventana;
  if (!v) return "";
  if (v.tipo === "aprobartodas") {
    /* Todas de un jalón (0.7.192): la lista entera a la vista antes de darle,
       que aprobar es anunciar y aquí no se abre la ficha de cada una. */
    const bor = dnBorradores();
    if (!bor.length) return "";
    const anuncia = e => typeof novedadDestacada === "function" ? novedadDestacada(e) : true;
    const sinImg = bor.filter(e => anuncia(e) && !((e.banner && e.banner.src) || (e.imagen && e.imagen.src)));
    const cola = (DN.bar && DN.bar.cola) || [], delante = cola.length && !dnGrifoAbierto();
    return `<div class="dn-velo" data-a="ventana:cerrar"><div class="dn-modal" role="dialog" aria-label="Aprobar todas las novedades" data-quieto="1">
      <h3>¿Aprobar las ${bor.length} novedades?</h3>
      <ul class="dn-lista-m">${bor.map(e => `<li>${dnIc("check")}${dnE(e.titulo || "Sin título")} <span class="dn-chip">${dnE(e.version || "")}</span>${anuncia(e) ? "" : ` <span class="dn-chip">no se anuncia</span>`}</li>`).join("")}</ul>
      <p>Las que se anuncian salen en la ventana de la app, en Ajustes → Novedades y en el changelog del sitio, con el texto y las imágenes de su ficha.</p>
      ${sinImg.length ? `<div class="dn-aviso"><b>${sinImg.length === 1 ? "Una se anuncia sin imágenes" : sinImg.length + " se anuncian sin imágenes"}:</b> ${sinImg.map(e => dnE(e.titulo || e.version)).join(", ")}. En el sitio ${sinImg.length === 1 ? "saldría" : "saldrían"} sin banner.</div>` : ""}
      ${delante ? `<div class="dn-aviso"><b>${cola.length === 1 ? "Hay 1 cambio esperando en la cola" : "Hay " + cola.length + " cambios esperando en la cola"}.</b> Las novedades no pueden adelantarlos: salen cuando los subas.</div>` : ""}
      <div class="dn-macc"><button class="dn-btn b-ghost" data-a="ventana:cerrar!">Cancelar</button><button class="dn-btn b-primary" data-a="aprobartodasya">Aprobar y publicar todas</button></div></div></div>`;
  }
  if (v.tipo === "aprobar") {
    /* Aprobar una novedad: qué se va a anunciar y dónde, antes de darle. */
    const e = (DN.nov || []).find(x => (typeof novedadLlave === "function" ? novedadLlave(x) : String(x.id || x.version)) === v.llave);
    if (!e) return "";
    const anuncia = typeof novedadDestacada === "function" ? novedadDestacada(e) : true;
    const cola = (DN.bar && DN.bar.cola) || [], delante = cola.length && !dnGrifoAbierto();
    return `<div class="dn-velo" data-a="ventana:cerrar"><div class="dn-modal" role="dialog" aria-label="Aprobar la novedad" data-quieto="1">
      <h3>¿Aprobar «${dnE(e.titulo || v.llave)}»?</h3>
      <p>${anuncia ? "Se anuncia en la ventana de la app, en Ajustes → Novedades y en el changelog del sitio, con el texto y las imágenes que viste en su ficha." : "Queda como publicada, pero no se anuncia en ningún lado: solo se anuncian las expansiones y las nuevas etapas."}</p>
      ${anuncia && !((e.banner && e.banner.src) || (e.imagen && e.imagen.src)) ? `<div class="dn-aviso"><b>No tiene imágenes.</b> En el sitio saldría sin banner, y una expansión lleva el suyo. Mejor pide sus capturas antes de aprobarla.</div>` : ""}
      ${delante ? `<div class="dn-aviso"><b>${cola.length === 1 ? "Hay 1 cambio esperando en la cola" : "Hay " + cola.length + " cambios esperando en la cola"}.</b> La novedad no puede adelantarlos: sale cuando los subas.</div>` : `<p class="dn-nota">Sale en uno o dos minutos. El sitio de Framer la toma de la hoja en menos de una hora.</p>`}
      <div class="dn-macc"><button class="dn-btn b-ghost" data-a="ventana:cerrar!">Cancelar</button><button class="dn-btn b-primary" data-a="aprobarnovya:${dnE(v.llave)}">Aprobar y publicar</button></div></div></div>`;
  }
  if (v.tipo === "emergencia") {
    const u = dnUltimaSana(), vivo = dnHistorial()[0];
    return `<div class="dn-velo" data-a="ventana:cerrar"><div class="dn-modal" role="dialog" aria-label="Cierre de emergencia" data-quieto="1">
      <h3>Cierre de emergencia</h3>
      <p>Cierra el grifo para todo lo que venga. Si lo que está en vivo${vivo ? " (la " + dnE(vivo.version) + ")" : ""} ya salió mal, además puedes regresar a la última versión sana.</p>
      ${u ? "" : `<div class="dn-aviso"><b>No hay ninguna versión sana a la que regresar.</b> Ninguna anterior estuvo 24 horas en vivo sin errores nuevos. Puedes elegir una a mano en «Lo que estuvo en vivo».</div>`}
      <div class="dn-macc"><button class="dn-btn b-ghost" data-a="ventana:cerrar!">Cancelar</button><button class="dn-btn b-linea" data-a="grifo:cerrar">Solo cerrar el grifo</button>${u ? `<button class="dn-btn b-coral" data-a="regresarya:${dnE(u.version)}">Cerrar y regresar a la ${dnE(u.version)}</button>` : ""}</div></div></div>`;
  }
  if (v.tipo === "regresar") {
    const hs = dnHistorial(), i = hs.findIndex(h => h.version === v.a), h = hs[i];
    if (!h) return "";
    const malas = hs.slice(0, i), nada = malas.length === 1 ? "la versión que subió después (" + dnE(malas[0].version) + ")" : "las " + malas.length + " versiones que subieron después";
    return `<div class="dn-velo" data-a="ventana:cerrar"><div class="dn-modal" role="dialog" aria-label="Regresar a otra versión" data-quieto="1">
      <h3>¿Regresar a la ${dnE(h.version)}?</h3>
      <p>Se publica otra vez su contenido con un número nuevo, para que llegue a todos los dispositivos, y deja sin efecto ${nada}. El grifo queda cerrado: lo que trajeron sigue en main, esperando su arreglo.</p>
      ${h.est !== "sana" ? `<div class="dn-aviso"><b>Esta no está marcada como sana.</b> ${dnE(h.texto)}.</div>` : ""}
      <p class="dn-nota">Si entre las dos cambió el formato de los datos, GitHub se niega y aquí sale como «Falló».</p>
      <div class="dn-macc"><button class="dn-btn b-ghost" data-a="ventana:cerrar!">Cancelar</button><button class="dn-btn b-coral" data-a="regresarya:${dnE(h.version)}">Regresar a la ${dnE(h.version)}</button></div></div></div>`;
  }
  const cola = (DN.bar && DN.bar.cola) || [];
  if (v.tipo === "abrir") {
    const van = cola.filter(c => !(c.sql || []).length), no = cola.length - van.length;
    return `<div class="dn-velo" data-a="ventana:cerrar"><div class="dn-modal" role="dialog" aria-label="Abrir el grifo" data-quieto="1">
      <h3>¿Abrir el grifo?</h3>
      <p>${van.length ? (van.length === 1 ? "Sube de golpe 1 cambio que estaba esperando." : "Suben de golpe " + van.length + " cambios que estaban esperando.") : "No hay nada esperando ahora."} Desde este momento, todo lo que se suba a main llega solo al vivo hasta que lo cierres.</p>
      ${no ? `<div class="dn-aviso"><b>${no === 1 ? "1 se queda en la cola" : no + " se quedan en la cola"}:</b> traen SQL, y eso se sube aparte, cuando ya esté pegado.</div>` : ""}
      <div class="dn-macc"><button class="dn-btn b-ghost" data-a="ventana:cerrar!">Cancelar</button><button class="dn-btn b-oro" data-a="grifo:abrirya">Abrir el grifo</button></div></div></div>`;
  }
  /* Subir: hasta dónde, y si en ese tramo hay SQL. */
  const i = v.hasta ? cola.findIndex(c => c.sha === v.hasta) : cola.length - 1;
  const tramo = cola.slice(0, i + 1), sql = tramo.filter(c => (c.sql || []).length);
  return `<div class="dn-velo" data-a="ventana:cerrar"><div class="dn-modal" role="dialog" aria-label="Subir al vivo" data-quieto="1">
      <h3>${tramo.length === 1 ? "¿Subir 1 cambio al vivo?" : "¿Subir " + tramo.length + " cambios al vivo?"}</h3>
      <ul class="dn-lista-m">${tramo.map(c => `<li>${dnIc("subidas")}${dnE(c.titulo)}${c.version ? ` <span class="dn-chip">${dnE(c.version)}</span>` : ""}</li>`).join("")}</ul>
      ${sql.length ? `<div class="dn-aviso"><b>${sql.length === 1 ? "Uno de ellos trae SQL" : sql.length + " de ellos traen SQL"}.</b> Un <code>.sql</code> no llega solo a Supabase: si lo subes sin haberlo pegado, la app pedirá algo que el servidor todavía no tiene.</div>` : ""}
      <div class="dn-macc"><button class="dn-btn b-ghost" data-a="ventana:cerrar!">Cancelar</button><button class="dn-btn b-primary" data-a="subirya">${sql.length ? "Ya lo pegué: subir" : "Subir al vivo"}</button></div></div></div>`;
}
function dnCierraVentana() {
  if (DN.ventana && DN.ventana.tipo === "abrir") { DN.seguro = true; clearInterval(DN.reloj); }
  DN.ventana = null;
}

/* El seguro del grifo solo se quita llevando la llave a la cerradura —un toque
   suelto no abre nada—, y vuelve solo a los quince segundos. Lo pidió Eduardo
   tal cual: que abrir sea un gesto a propósito y no un dedo que se resbala. */
function dnQuitaSeguro() {
  DN.seguro = false; DN.cuenta = 15; clearInterval(DN.reloj);
  DN.reloj = setInterval(() => {
    if (DN.ventana) return;
    DN.cuenta--;
    if (DN.cuenta <= 0) { clearInterval(DN.reloj); DN.seguro = true; if (dnAbierta()) dnPinta(); return; }
    const c = document.getElementById("dn-cuenta");
    if (c) c.textContent = DN.cuenta;
  }, 1000);
  dnPinta();
}
let dnArr = null;
const dnSobre = (k, c) => { const a = k.getBoundingClientRect(), b = c.getBoundingClientRect(); return Math.hypot(a.left + a.width / 2 - b.left - b.width / 2, a.top + a.height / 2 - b.top - b.height / 2) < 30; };
function dnLlaveBaja(ev) {
  const k = ev.target.closest && ev.target.closest(".dn-llave");
  if (!k) return;
  ev.preventDefault();
  dnArr = { k: k, x: ev.clientX, y: ev.clientY };
  k.classList.remove("vuelve"); k.classList.add("arrastra"); k.parentElement.classList.add("en-mano");
  try { k.setPointerCapture(ev.pointerId); } catch (e) { /* un dedo sin captura sigue valiendo */ }
}
function dnLlaveMueve(ev) {
  if (!dnArr) return;
  dnArr.k.style.transform = "translate(" + (ev.clientX - dnArr.x) + "px, " + (ev.clientY - dnArr.y) + "px)";
  const c = document.getElementById("dn-cerradura");
  if (c) c.classList.toggle("cerca", dnSobre(dnArr.k, c));
}
function dnLlaveSuelta() {
  if (!dnArr) return;
  const k = dnArr.k, c = document.getElementById("dn-cerradura");
  dnArr = null;
  if (c && dnSobre(k, c)) { dnQuitaSeguro(); return; }
  k.classList.remove("arrastra"); k.classList.add("vuelve"); k.style.transform = ""; k.parentElement.classList.remove("en-mano");
  if (c) c.classList.remove("cerca");
}

async function dnMandaBarrera(accion, datos, dicho) {
  /* Lo que mueve el grifo lo anuncia en la tarjeta mientras dura. */
  DN.grifoPend = accion === "grifo" ? (datos.abierto ? "abriendo" : "cerrando") : accion === "regresar" ? "cerrando" : null;
  if (DN.grifoPend) dnPinta();
  try {
    await sbBarrera(accion, datos);
    toast(dicho, "hecho");
    DN.grifoPend = null;
    /* Todo lo que pone a GitHub a trabajar enciende el «subiendo». */
    if (accion === "subir" || accion === "aprobar" || accion === "regresar" || (accion === "grifo" && datos.abierto)) {
      DN.subiendo = Date.now();
      /* El latido que ya esperaba lo hacía a paso lento (30 s): se vuelve a
         poner, ahora al paso de una subida en marcha. */
      dnLatido();
    }
    await dnCargaBarrera();
    dnRepreguntaBarrera();
  } catch (e) {
    DN.grifoPend = null;
    toast(e.message || String(e), "atencion");
    dnPinta();
  }
}

/* ---- La ficha entera de una novedad, para revisarla antes de aprobarla ----
   Eduardo lo pidió el 2 oct 2026: aquí revisa los parches, así que aquí tiene
   que poder leer lo que se va a publicar, «con su imagen y todo». Antes la
   fila enseñaba el título y el resumen, y lo demás —los puntos, los textos de
   dentro del gráfico, el inglés, el pie de cada imagen— salía sin que nadie
   lo hubiera leído en un solo sitio.

   Los dos idiomas van LADO A LADO, renglón contra renglón: una traducción que
   falta o que dice otra cosa se ve al compararlas, no leyéndolas por
   separado. Lo que falta en inglés se marca, porque la app lo sustituye por
   el español sin avisar.

   El gráfico va en TEXTO y no dibujado: lo que se revisa son las palabras, y
   el dibujo se ve tal como saldrá con «Verla en su ventana». Y nada de esto
   usa una clase de la app, como todo lo de esta capa. */
function dnDatoTx(b, d, ing) {
  const de = k => ing ? ((d.en && d.en[k]) || "") : (d[k] == null ? "" : String(d[k]));
  const cola = [de("detalle"), de("nota")].filter(Boolean).join(" · ");
  const cabeza = b.tipo === "comparar" ? de("texto") + ": " + d.antes + " → " + d.ahora
    : b.tipo === "colores" ? de("nombre")
    : String(d.valor == null ? "" : d.valor) + " " + de("texto");
  /* Un dato cuyo único texto es un número no tiene nada que traducir. */
  const falta = ing && !(d.en && (d.en.texto || d.en.nombre));
  return { tx: cabeza.trim() + (cola ? " — " + cola : ""), falta: falta };
}
function dnFichaNovedad(e) {
  const falta = `<span class="dn-nf-falta">Falta en inglés</span>`;
  const par = (rot, es, en, clase) => `<span class="dn-nf-rot">${rot}</span><div class="dn-nf-es${clase ? " " + clase : ""}">${dnE(es)}</div><div class="dn-nf-en${clase ? " " + clase : ""}">${en ? dnE(en) : (es ? falta : "")}</div>`;
  const en = e.en || {};
  const filas = [par("Título", e.titulo, en.titulo, "tit"), par("Resumen", e.resumen, en.resumen)];
  (e.puntos || []).forEach((p, i) => filas.push(par("Punto " + (i + 1), p, (en.puntos || [])[i])));
  const bloques = (Array.isArray(e.grafico) ? e.grafico : e.grafico ? [e.grafico] : []).filter(b => b && Array.isArray(b.datos));
  bloques.forEach((b, n) => {
    filas.push(par("Gráfico " + (n + 1), b.titulo, b.en && b.en.titulo, "tit"));
    b.datos.forEach(d => { const es = dnDatoTx(b, d, false), ing = dnDatoTx(b, d, true); filas.push(par("", es.tx, ing.falta ? "" : ing.tx)); });
  });
  (e.retoques || []).forEach(r => filas.push(par("Retoque " + dnE(r.version || ""), r.texto, r.en && r.en.texto)));
  const imgs = [e.banner, e.imagen].concat(e.imagenes || []).filter(i => i && i.src);
  imgs.forEach((i, n) => filas.push(par("Imagen " + (n + 1), i.alt, i.en && i.en.alt)));
  const clase = typeof novedadClase === "function" ? novedadClase(e) : (e.clase || "mejora");
  const alSitio = typeof novedadDestacada === "function" ? novedadDestacada(e) : (e.sitio != null ? !!e.sitio : (clase === "expansion" || clase === "hito"));
  return `<div class="dn-nf">
      ${imgs.length ? `<div class="dn-nf-imgs">${imgs.map(i => { const s = typeof novedadImgSrc === "function" ? novedadImgSrc(i.src) : i.src; return `<a href="${escapeAttr(s)}" target="_blank" rel="noopener"><img src="${escapeAttr(s)}" alt="${escapeAttr(i.alt || "")}" loading="lazy" onerror="this.parentNode.remove()"></a>`; }).join("")}</div>` : ""}
      <div class="dn-nf-tabla"><span></span><span class="dn-nf-cab">Español</span><span class="dn-nf-cab">English</span>${filas.join("")}</div>
      <p class="dn-nota">${alSitio ? "Al aprobarla se anuncia en la app y en el changelog del sitio." : "No se anuncia aunque la apruebes: solo se anuncian las expansiones y las nuevas etapas, o lo que lleve «sitio: true» en su ficha."}${bloques.length ? " El gráfico se ve dibujado en su ventana." : ""}</p>
    </div>`;
}

function dnSalaSubidas() {
  const m = metricasCache, vs = (m && m.versiones) || [];
  const activas = v => (Number(v.personas) || 0) - (Number(v.dormidas) || 0);
  const total = dnSuma(vs.map(activas));
  const b = DN.bar, enVivo = (b && b.vivo && b.vivo.version) || VERSION;
  const conLa = dnSuma(vs.filter(v => v.version === enVivo).map(activas));
  const bor = dnBorradores().slice().sort((a, x) => String(x.fecha || "").localeCompare(String(a.fecha || "")));
  const cola = (b && b.cola) || [];
  const llave = e => typeof novedadLlave === "function" ? novedadLlave(e) : String(e.id || e.version);
  return `
    <div class="dn-cab"><h2>Subidas</h2><span class="dn-chip dn-der">Se actualiza sola</span></div>
    ${dnSubiendoHTML()}
    <div class="dn-kpis tres">
      ${dnKpi("En vivo", "V" + dnE(enVivo), "", `<span class="dn-ver">${dnEtapa() ? `<span class="etapa">${dnEtapa()}</span>` : ""}<span>${b && b.vivo && b.vivo.fecha ? "· " + dnE(dnDia(dnLocal(b.vivo.fecha))) : "· " + dnE(typeof VERSION_FECHA !== "undefined" ? VERSION_FECHA : "")}</span></span>`)}
      ${total ? dnKpi("Ya la tienen", conLa, " de " + total, "personas que abrieron en 14 días") : dnKpi("Ya la tienen", "—", "", "Nadie abrió en 14 días")}
      ${b ? dnKpi("En la cola", cola.length, "", cola.length ? "esperan para subir" : "nada espera") : dnKpi("Novedades por aprobar", DN.nov ? bor.length : "…", "", "ya en la app, sin anunciar")}
    </div>
    ${b && b.pagina && b.pagina !== "vivo" ? `<div class="dn-aviso dn-ojo"><b>La barrera todavía no frena nada.</b> El sitio se sigue publicando desde <code>${dnE(b.pagina)}</code>: lo que se sube ahí llega al vivo sin pasar por aquí. Falta cambiar la rama en GitHub → Settings → Pages → <code>vivo</code>.</div>` : ""}
    ${!b ? (DN.barError ? dnBarreraFaltaHTML() : `<div class="dn-panel"><div class="dn-vacio">Preguntando por la barrera…</div></div>`)
      : (b.grifo ? dnGrifoHTML() : `<div class="dn-panel"><h3>Falta el grifo</h3><p class="dn-nota">Pega <code>supabase/barrera.sql</code> en Supabase y vuelve a preguntar.</p><div class="dn-acciones"><button class="dn-btn b-linea mini" data-a="barrera">Volver a preguntar</button></div></div>`) + dnColaHTML() + dnHistorialHTML() + dnCorridasHTML()}
    <div class="dn-panel"><div class="dn-pcab"><h3>Novedades por aprobar</h3><span class="dn-chip">${DN.nov ? bor.length : "…"}</span><div class="dn-der">${bor.length > 1 ? `<button class="dn-btn b-primary mini" data-a="aprobartodas">${dnIc("check")}Aprobar todas</button>` : ""}<button class="dn-btn b-linea mini" data-a="novedades">Leerlas en Novedades</button></div></div>
      <p class="dn-nota">El cambio de cada una ya está en la app. Lo que espera es su anuncio: no sale en la ventana, en Ajustes → Novedades ni en el sitio hasta que su estado pase a «publicado» en <code>novedades/novedades.json</code>. «Aprobar y publicar» la sube solo; para cambiarle un texto, pídeselo a una sesión.</p>
      ${dnReservadas().length ? `<p class="dn-nota">Guardadas para su versión, y no se pueden aprobar aquí: ${dnReservadas().map(e => dnE(e.version)).join(" y ")}. Salen cuando la app llegue a ese número.</p>` : ""}
      ${!DN.nov ? `<div class="dn-vacio">Leyendo las novedades…</div>` : !bor.length ? `<div class="dn-vacio">No hay ninguna por aprobar.</div>` : bor.map(e => {
        const h = dnHace(e.fecha), clase = typeof novedadClase === "function" ? novedadClase(e) : (e.clase || "mejora");
        return `<div class="dn-prueba"><div>
            <div class="dn-sobre-t">${dnEtq(clase)}<span class="dn-estado ${h !== null && h >= 5 ? "e-espera" : "e-no"}">${dnIc("reloj")}${h === null ? "Sin fecha" : h >= 5 ? "Lleva " + h + " días sin aprobar" : "Por aprobar, " + dnHaceTx(h)}</span></div>
            <h4>${dnE(e.titulo || "Sin título")}<span class="dn-chip">${dnE(e.version || "")}</span></h4>
            <p>${dnE(e.resumen || "")}</p></div>
          <div class="dn-acciones"><button class="dn-btn b-primary mini" data-a="aprobarnov:${dnE(llave(e))}">${dnIc("check")}Aprobar y publicar</button><button class="dn-btn b-soft mini" data-a="ficha:${dnE(llave(e))}" aria-expanded="${DN.ficha === llave(e)}">${DN.ficha === llave(e) ? "Cerrar la ficha" : "Ver la ficha"}</button><button class="dn-btn b-linea mini" data-a="ventananov:${dnE(llave(e))}">Verla en su ventana</button></div>
          ${DN.ficha === llave(e) ? dnFichaNovedad(e) : ""}</div>`;
      }).join("")}
    </div>`;
}

function dnPartes(tit, filas, claveNombre) {
  const t = dnSuma(filas.map(f => f.personas));
  if (!t) return `<div class="dn-campo"><span>${tit}</span><p class="dn-nota">Todavía no hay datos.</p></div>`;
  const tonos = ["--dn-l1", "--dn-l2", "--faint"];
  const f3 = filas.slice(0, 3), tono = (f, i) => f.tono || tonos[i];
  return `<div class="dn-campo"><span>${tit}</span><div class="dn-partes">${f3.map((f, i) => `<i style="flex:${Number(f.personas) || 0};background:var(${tono(f, i)})"></i>`).join("")}</div>
    <div class="dn-uso">${f3.map((f, i) => `<div><small><i class="dn-punto" style="background:var(${tono(f, i)})"></i>${dnE(f[claveNombre])}</small><b>${Math.round(f.personas / t * 100)}%</b></div>`).join("")}</div></div>`;
}

/* ---- Las ventas por fecha (0.7.193) ----
   Sale del libro de pagos (`pagos`, en planes.sql): cada cobro y cada
   devolución, apuntados por la función `cobro` cuando Stripe avisa. El
   servidor manda TODA la historia sumada por día, y aquí se recorta: cambiar
   de periodo o de fechas no vuelve a preguntar.

   Lo pidió Eduardo: fechas a su gusto, los periodos de 15 a 180 días,
   suscripciones contra Fundador —el flujo que se repite y el que entra una
   vez— y las devoluciones.

   Tres cosas que no se inventan: sin la tabla no hay sala, sino el aviso de
   qué falta; el libro empieza el día que se pegó, y se dice; y una devolución
   de suscripción no sabe si era mensual o anual, así que va en «suscripciones»
   a secas. */
const DN_PERIODOS = [15, 30, 60, 90, 180];
const dnPesos = cent => "$" + Math.round((Number(cent) || 0) / 100).toLocaleString("es-MX");
const dnISO = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
/* El tramo que se mira: los días del periodo hasta hoy, o las dos fechas. */
function dnTramoCobro(pagos) {
  const hoy = new Date(), fin0 = dnISO(hoy);
  let desde, hasta = fin0;
  if (DN.cobDesde || DN.cobHasta) {
    hasta = DN.cobHasta || fin0;
    desde = DN.cobDesde || (pagos.length ? String(pagos[0].dia).slice(0, 10) : hasta);
    if (desde > hasta) { const t = desde; desde = hasta; hasta = t; }
  } else {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((DN.cobDias || 30) - 1));
    desde = dnISO(d);
  }
  /* Un punto por día; pasado de 200 días, uno por semana, o la línea es un peine. */
  const dias = [], p = desde.split("-").map(Number), q = hasta.split("-").map(Number);
  const a = new Date(p[0], p[1] - 1, p[2]), z = new Date(q[0], q[1] - 1, q[2]);
  for (let d = new Date(a); d <= z && dias.length < 4000; d.setDate(d.getDate() + 1)) dias.push(dnISO(d));
  return { desde: desde, hasta: hasta, dias: dias, semanal: dias.length > 200 };
}
function dnVentas(c) {
  const pagos = (c.pagos || []).map(x => ({ dia: String(x.dia).slice(0, 10), producto: x.producto, clase: x.clase, n: Number(x.n) || 0, cent: Number(x.centavos) || 0 }));
  const t = dnTramoCobro(pagos), en = pagos.filter(x => x.dia >= t.desde && x.dia <= t.hasta);
  const suma = f => en.filter(f).reduce((s, x) => ({ n: s.n + x.n, cent: s.cent + x.cent }), { n: 0, cent: 0 });
  const esSus = x => x.clase === "pago" && x.producto !== "fundador", esFun = x => x.clase === "pago" && x.producto === "fundador", esDev = x => x.clase === "devolucion";
  /* Las series, día a día o semana a semana, en pesos. */
  const cubos = t.semanal ? t.dias.filter((d, i) => i % 7 === 0) : t.dias;
  const cubo = dia => t.semanal ? cubos[Math.floor(t.dias.indexOf(dia) / 7)] : dia;
  const serie = f => { const m = {}; en.filter(f).forEach(x => { const k = cubo(x.dia); m[k] = (m[k] || 0) + x.cent; }); return cubos.map(k => Math.round((m[k] || 0) / 100)); };
  return { t: t, pagos: pagos, sus: suma(esSus), fun: suma(esFun), dev: suma(esDev), rot: cubos.map(dnDia),
    sSus: serie(esSus), sFun: serie(esFun), sDev: serie(esDev), primero: pagos.length ? pagos[0].dia : "" };
}
function dnVentasHTML(c) {
  if (c.pagos === undefined) return `<div class="dn-panel"><h3>Las ventas por fecha</h3>
      <p class="dn-nota">Falta el libro de pagos: el servidor solo sabe cómo está cada suscripción ahora. Pega el bloque de <code>planes.sql</code> y <code>administracion.sql</code> que está en «Pendiente de pegar» y vuelve a pedir los números.</p></div>`;
  const v = dnVentas(c), libre = !!(DN.cobDesde || DN.cobHasta);
  const filtros = `<div class="dn-filtros">
      <div class="dn-seg" role="radiogroup" aria-label="Periodo">${DN_PERIODOS.map(n => `<button class="${!libre && (DN.cobDias || 30) === n ? "on" : ""}" data-a="cob:${n}">${n} días</button>`).join("")}</div>
      <label class="dn-fecha"><span>Del</span><input type="date" id="dn-cob-desde" value="${escapeAttr(libre ? v.t.desde : "")}" max="${escapeAttr(dnISO(new Date()))}"></label>
      <label class="dn-fecha"><span>al</span><input type="date" id="dn-cob-hasta" value="${escapeAttr(libre ? v.t.hasta : "")}" max="${escapeAttr(dnISO(new Date()))}"></label>
      ${libre ? `<button class="dn-btn b-ghost mini" data-a="cob:0">Quitar fechas</button>` : ""}</div>`;
  if (!v.pagos.length) return `<div class="dn-panel"><h3>Las ventas por fecha</h3>
      <p class="dn-nota">El libro de pagos ya está puesto y todavía no entra ningún cobro. Lo que se cobró antes de ponerlo no está: Stripe lo tiene, aquí no se apuntó.</p></div>`;
  const total = v.sus.cent + v.fun.cent, neto = total - v.dev.cent;
  const veces = (n, uno, varios) => n + " " + (n === 1 ? uno : varios);
  return `<div class="dn-panel"><div class="dn-pcab"><h3>Las ventas por fecha</h3><span class="dn-chip dn-der">del ${dnE(dnDia(v.t.desde))} al ${dnE(dnDia(v.t.hasta))}</span></div>
      ${filtros}
      <div class="dn-kpis">
        ${dnKpi("Entró", dnPesos(total), "", veces(v.sus.n + v.fun.n, "cobro", "cobros"))}
        ${dnKpi("Suscripciones", dnPesos(v.sus.cent), "", veces(v.sus.n, "cobro", "cobros") + " · se repite")}
        ${dnKpi("Fundador", dnPesos(v.fun.cent), "", veces(v.fun.n, "venta", "ventas") + " · entra una vez")}
        ${dnKpi("Se devolvió", dnPesos(v.dev.cent), "", v.dev.n ? veces(v.dev.n, "cargo", "cargos") + " · queda " + dnPesos(neto) : "nada en este periodo")}
      </div>
      <div class="dn-ley"><span><i class="dn-raya" style="border-color:var(--dn-l1)"></i>Suscripciones</span><span><i class="dn-raya p" style="border-color:var(--dn-l2)"></i>Fundador</span>${v.dev.n ? `<span><i class="dn-raya" style="border-color:var(--dn-coral)"></i>Devoluciones</span>` : ""}</div>
      <div class="dn-graf" data-g="ventas"></div>
      <p class="dn-nota">En pesos, ${v.t.semanal ? "semana a semana" : "día a día"}. El libro empieza el ${dnE(dnDia(v.primero))}: lo cobrado antes no está.</p></div>`;
}

function dnSalaNumeros() {
  const m = metricasCache, r = m.resumen || {}, c = m.cobro || {};
  /* El servidor da 14 días o 90, según tenga pegado el SQL nuevo o no: los
     rangos que no caben en lo que llegó no se ofrecen. */
  const dias = m.dias || [], rangos = [14, 30, 90].filter(n => n === 14 || dias.length >= n);
  if (rangos.indexOf(DN.rango) < 0) DN.rango = 14;
  const cab = `<div class="dn-cab"><h2>Números</h2>
      <div class="dn-seg" role="radiogroup" aria-label="Qué números">${[["gente", "Gente"], ["cobro", "Cobro"]].map(o => `<button class="${DN.num === o[0] ? "on" : ""}" data-a="num:${o[0]}">${o[1]}</button>`).join("")}</div>
      ${DN.num === "gente" && rangos.length > 1 ? `<div class="dn-der"><div class="dn-seg" role="radiogroup" aria-label="Rango">${rangos.map(n => `<button class="${DN.rango === n ? "on" : ""}" data-a="rango:${n}">${n} días</button>`).join("")}</div></div>` : ""}</div>`;
  if (DN.num === "cobro") {
    if (c.desplegado === false) return cab + `<div class="dn-panel"><h3>El cobro</h3><p class="dn-nota">Todavía no está puesto en el servidor. Cuando corras <code>planes.sql</code> y despliegues Stripe, esta sala se llena sola; los pasos están en <code>supabase/LEEME.md</code>.</p></div>`;
    const activos = (c.planes || []).filter(p => p.estado === "activa");
    const otros = (c.planes || []).filter(p => p.estado !== "activa");
    const nombre = k => ({ mensual: "Pro mensual", anual: "Pro anual", fundador: "Fundador" })[k] || k;
    return cab + `
      <div class="dn-panel"><div class="dn-pcab"><h3>El cobro</h3><span class="dn-chip dn-der">MXN, con IVA</span></div>
        <div class="dn-kpis tres">
          ${dnKpi("Pagando ahora", c.pagando || 0)}
          ${dnKpi("Al mes", "$" + (c.mrr || 0), "", "sin contar Fundador")}
          ${dnKpi("Lugares de Fundador", c.lugares_fundador == null ? "—" : c.lugares_fundador, " de 200", "los que quedan")}
        </div>
        ${dnPartes("Planes activos", activos.map(p => ({ personas: p.personas, n: nombre(p.plan), tono: { mensual: "--dn-l1", anual: "--faint", fundador: "--dn-l2" }[p.plan] })), "n")}
        ${otros.length ? `<p class="dn-nota">Además: ${otros.map(p => dnE(nombre(p.plan)) + " " + dnE(p.estado) + ", " + Number(p.personas)).join(" · ")}.</p>` : ""}
      </div>
      ${dnVentasHTML(c)}`;
  }
  const vol = dnDeCada(r.volvieron || 0, r.abrieron || 0, 40), sig = dnDeCada(r.siguen30 || 0, r.maduros || 0, 20), ins = dnDeCada(r.instalaron || 0, r.abrieron || 0, 30);
  const vs = m.versiones || [];
  const hayErr = vs.some(v => dnTropiezos().some(t => t.donde !== "reporte" && t.donde !== "tope" && t.version === v.version));
  const conDormidas = vs.some(v => v.dormidas !== undefined);
  const dist = r["distintas" + DN.rango];
  const reten = (m.retencion || []).filter(x => Number(x.de) > 0);
  const tramo = dias.slice(-DN.rango);
  const embudo = `<div class="dn-panel"><div class="dn-pcab"><h3>El embudo</h3><span class="dn-chip dn-der">% que pasa al paso siguiente</span></div>
        <div class="dn-graf" data-g="embudo"></div></div>`;
  const versiones = `<div class="dn-panel"><div class="dn-pcab"><h3>En qué versión se quedó cada quien</h3><span class="dn-chip dn-der" id="dn-escala">un punto, una persona</span></div>
        <div class="dn-ley"><span><i class="dn-punto" style="background:var(--dn-l1)"></i>Al día</span><span><i class="dn-punto" style="background:var(--dn-l3)"></i>Sin actualizar</span>${conDormidas ? `<span><i class="dn-punto" style="background:var(--dn-coral)"></i>Dejó de abrir ahí</span>` : ""}${hayErr ? `<span><i class="dn-punto" style="background:var(--dn-coral-s);outline:1px solid var(--dn-coral)"></i>Con errores automáticos</span>` : ""}</div>
        <div class="dn-graf" data-g="versiones"></div>
        <p class="dn-nota">${conDormidas ? "La última versión que vio cada persona en 60 días; en coral, quien lleva dos semanas sin abrir." : "La última versión que vio cada persona en 14 días."}</p></div>`;
  const uso = `<div class="dn-panel"><h3>Cómo la usan</h3>
        ${dnPartes("Desde qué dispositivo", m.aparatos || [], "grupo")}
        ${dnPartes("Instalada o en el navegador", m.instalacion || [], "grupo")}
        ${dnPartes("Cuánto llevan con cuenta", m.antiguedad || [], "tramo")}</div>`;
  const retencion = `<div class="dn-panel"><div class="dn-pcab"><h3>Cuántas siguen con los días</h3><span class="dn-chip dn-der">de cada 100 que entraron</span></div>
        <div class="dn-graf" data-g="reten"></div></div>`;
  return cab + `
    <div class="dn-panel"><div class="dn-pcab"><h3>La gente, día a día</h3>
        <div class="dn-ley dn-der"><span><i class="dn-raya" style="border-color:var(--dn-l1)"></i>Personas que abrieron</span><span><i class="dn-raya p" style="border-color:var(--dn-l2)"></i>Cuentas nuevas</span></div></div>
      <div class="dn-graf" data-g="gente"></div>
      <p class="dn-nota">En ${DN.rango} días ${dist == null ? "" : "abrieron " + Number(dist) + " personas distintas y "}se crearon ${dnSuma(tramo.map(d => d.altas))} cuentas.</p></div>
    <div class="dn-kpis">
      ${dnKpi("Volvieron otro día", vol.val, vol.uni, vol.pie)}
      ${dnKpi("Siguen tras 30 días", sig.val, sig.uni, sig.pie)}
      ${dnKpi("La instalaron", ins.val, ins.uni, ins.pie)}
      ${dnKpi("Días de uso por persona", r.dias_medios || 0, "", (r.aperturas7 || 0) + " aperturas esta semana")}
    </div>
    <div class="dn-rejilla dos">${embudo}${reten.length > 1 ? retencion : versiones}</div>
    ${reten.length > 1 ? `<div class="dn-rejilla dos">${versiones}${uso}</div>` : uso}`;
}

function dnSalaLab() {
  const cab = `<div class="dn-cab"><h2>Laboratorio</h2></div>
    <div class="dn-seg" role="radiogroup" aria-label="Qué parte del laboratorio">${[["pruebas", "En pruebas"], ["cuenta", "Herramientas"]].map(o => `<button class="${DN.lab === o[0] ? "on" : ""}" data-a="lab:${o[0]}">${o[1]}</button>`).join("")}</div>`;
  if (DN.lab === "pruebas") {
    const enc = dnEncendidas();
    return cab + `
      <div class="dn-panel"><div class="dn-pcab"><h3>Lo que está en fase de pruebas</h3><span class="dn-chip ${enc.length ? "yo" : ""} dn-der">${enc.length} ${enc.length === 1 ? "encendida aquí" : "encendidas aquí"}</span></div>
        <p class="dn-nota">Cada prueba se enciende con su enlace, solo donde lo abras. Encender o apagar recarga la app.</p>
        ${DN_PRUEBAS.map(p => {
          let on = false, ojo = ""; try { on = !!p.esta(); ojo = p.ojo ? p.ojo() : ""; } catch (e) {}
          return `<div class="dn-prueba"><div>
              <div class="dn-sobre-t">${p.tag ? dnEtq(p.tag) : `<span class="dn-chip">Herramienta</span>`}${p.off ? `<span class="dn-estado ${on ? "e-yo" : "e-no"}">${dnIc(on ? "check" : "x")}${on ? "Encendida aquí" : "Apagada aquí"}</span>` : ""}</div>
              <h4>${dnE(p.n)}</h4>
              <p>${dnE(p.q)}</p>${ojo ? `<span class="ojo">${dnE(ojo)}</span>` : ""}
              <div class="pie"><code>${dnE(p.on)}</code><button class="dn-btn b-ghost mini" data-a="copiar:${p.id}">${dnIc("copiar")}Copiar enlace</button></div></div>
            <div class="dn-acciones">${!p.off ? `<button class="dn-btn b-linea mini" data-a="prueba:${p.id}:on">Verlo</button>`
              : on ? `<button class="dn-btn b-ghost mini" data-a="prueba:${p.id}:off">Apagar aquí</button>`
              : `<button class="dn-btn b-coral mini" data-a="prueba:${p.id}:on">Encender aquí</button>`}</div></div>`;
        }).join("")}
      </div>`;
  }
  const on = typeof esCuentaDePruebas === "function" && esCuentaDePruebas();
  const cual = typeof planLeerSimulado === "function" ? planLeerSimulado() : "";
  const lista = typeof PLANES_SIMULABLES !== "undefined" ? PLANES_SIMULABLES : [];
  return cab + `
    <div class="dn-panel"><h3>Modo de pruebas</h3>
      <div class="dn-campo"><span>Esta cuenta</span>
        <div class="dn-seg" role="radiogroup" aria-label="Esta cuenta"><button class="${on ? "" : "on"}" data-a="cuenta:0">Normal</button><button class="${on ? "on" : ""}" data-a="cuenta:1">De pruebas</button></div>
        <p class="dn-nota">${on ? "Verás un marco punteado amarillo mientras la uses, y borrar todo no pedirá confirmación extra." : "Borrar todo te pedirá escribir tu correo. Es a propósito: obliga a mirar en qué cuenta estás."}</p></div>
      ${on ? `<div class="dn-campo"><span>Ver la app como si tuviera</span>
        <div class="dn-seg" role="radiogroup" aria-label="Plan simulado">${lista.map(x => `<button class="${cual === x.id ? "on" : ""}" data-a="plan:${x.id}">${dnE(x.rotulo)}</button>`).join("")}</div>
        <p class="dn-nota">Vive en la pestaña: aguanta una recarga y se cae al cerrarla. No toca lo que pagaste.</p></div>` : ""}
      <div class="dn-campo"><span>Celebraciones</span><div class="dn-botonera">${FIESTAS.map(f => `<button data-a="fiesta:${f.id}"><b>${dnE(f.rotulo)}</b><span>${dnE(f.nota)}</span></button>`).join("")}</div></div>
      <div class="dn-campo"><span>Pantallas que salen una vez</span><div class="dn-botonera">${PANTALLAS_DE_UNA_VEZ.map(p => `<button data-a="pantalla:${p.id}"><b>${dnE(p.rotulo)}</b><span>${dnE(p.nota)}</span></button>`).join("")}</div></div>
    </div>`;
}

/* ---- Pintar ---- */
const DN_NAV = [["hoy", "Hoy"], ["buzon", "Buzón"], ["subidas", "Subidas"], ["numeros", "Números"], ["lab", "Laboratorio"]];
/* Las salas que no pueden dibujarse sin los números del servidor. */
const DN_CON_NUMEROS = { hoy: 1, buzon: 1, numeros: 1 };

function dnPinta() {
  const capa = document.getElementById("dentro");
  if (!capa || !dnAbierta()) return;
  if (!esAdmin) { cerrarDentro(); capa.innerHTML = ""; return; }
  const nuevos = dnTropiezos().filter(t => dnEstado(t) === "nuevo").length, bor = dnBorradores().length, enCola = ((DN.bar && DN.bar.cola) || []).length;
  const nav = () => DN_NAV.map(v => `<button class="${DN.sala === v[0] ? "on" : ""}" data-a="ir:${v[0]}" ${DN.sala === v[0] ? 'aria-current="page"' : ""}>${dnIc(v[0])}<span>${v[1]}</span>${v[0] === "buzon" && nuevos ? `<span class="dn-globo">${nuevos}</span>` : ""}${v[0] === "subidas" && (enCola || bor) ? `<span class="dn-globo">${enCola || bor}</span>` : ""}</button>`).join("");
  const marca = `<div class="dn-marca"><span class="dn-rombo">${dnIc("rombo")}</span><span><b>Puesto de mando</b><small>Solo administración</small></span></div>`;
  let sala;
  if (DN_CON_NUMEROS[DN.sala] && !metricasCache) {
    sala = `<div class="dn-cab"><h2>${DN_NAV.find(v => v[0] === DN.sala)[1]}</h2></div>` + (DN.error
      ? `<div class="dn-panel"><h3>No pude traer los números</h3><p class="dn-nota">${dnE(DN.error)}</p><div class="dn-acciones"><button class="dn-btn b-linea mini" data-a="repedir">Intentar otra vez</button></div></div>`
      : `<div class="dn-panel"><div class="dn-vacio">Pidiendo los números…</div></div>`);
  } else {
    sala = { hoy: dnSalaHoy, buzon: dnSalaBuzon, subidas: dnSalaSubidas, numeros: dnSalaNumeros, lab: dnSalaLab }[DN.sala]();
  }
  /* El desplazamiento de la sala se conserva al repintar la MISMA sala: marcar
     un reporte como atendido no puede devolverte al principio de la lista. */
  const vieja = capa.querySelector(".dn-sala"), salaVieja = capa.dataset.sala, arriba = vieja ? vieja.scrollTop : 0;
  capa.innerHTML = `<div class="dn-caja">
    <header class="dn-cima">${marca}<button class="dn-btn b-ghost mini dn-cerrar" data-a="cerrar">${dnIc("x")}Cerrar</button></header>
    <aside class="dn-lateral">${marca}<nav aria-label="Salas">${nav()}</nav>
      <div class="pie"><span class="dn-chip">${dnIc("candado")}Solo tú lo ves</span>${dnVersionHTML()}
        <button class="dn-btn b-ghost mini" data-a="cerrar">${dnIc("salir")}Volver a Norata</button></div></aside>
    <main class="dn-sala">${sala}</main>
    <nav class="dn-tabs" aria-label="Salas">${nav()}</nav></div>${dnVentanaHTML()}`;
  capa.dataset.sala = DN.sala;
  if (salaVieja === DN.sala) capa.querySelector(".dn-sala").scrollTop = arriba;
  dnDibuja();
  if (DN.sala === "subidas" && !DN.latido) dnLatido();
}

/* ---- Gráficas ----
   A mano, con SVG: no hay librería y no la va a haber (ver la nota de arriba
   del todo). Lo que pasa en el tiempo va en LÍNEAS y sobre una sola escala; lo
   pidió Eduardo el 28 ago: barras y líneas mezcladas en un dibujo le resultaban
   sucias. Cada gráfica trae su cruz: al pasar el cursor o el dedo dice el valor
   exacto del día. */
function dnGrafica(caja, cfg) {
  caja.innerHTML = "";
  const W = Math.max(240, caja.clientWidth || 560), H = Math.max(cfg.alto || 210, caja.clientHeight || 0), L = 30, R = 12, T = 10, B = 22, n = cfg.dias.length;
  if (!n) { caja.innerHTML = `<div class="dn-vacio">Todavía no hay datos.</div>`; return; }
  let mx = Math.max(1, cfg.vara || 0, ...cfg.series.reduce((a, s) => a.concat(s.d), []));
  const b10 = Math.pow(10, Math.floor(Math.log10(mx / 4 || 1))), paso = Math.max(1, [1, 2, 5, 10].map(k => k * b10).find(q => mx / q <= 5) || 10 * b10);
  mx = Math.ceil(mx / paso) * paso;
  const x = i => L + (W - L - R) * (n > 1 ? i / (n - 1) : 0), y = v => T + (H - T - B) * (1 - v / mx);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeAttr(cfg.titulo)}">`;
  for (let v = 0; v <= mx; v += paso) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1" ${v ? 'stroke-dasharray="2 4"' : ""}/><text x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end" class="eje">${v}</text>`;
  const cada = Math.max(1, Math.ceil(n / (W < 420 ? 4 : 7)));
  cfg.dias.forEach((d, i) => { if ((n - 1 - i) % cada === 0) s += `<text x="${x(i)}" y="${H - 5}" text-anchor="${i === n - 1 ? "end" : i === 0 ? "start" : "middle"}" class="eje">${dnE(d)}</text>`; });
  if (cfg.vara) s += `<line x1="${L}" x2="${W - R}" y1="${y(cfg.vara)}" y2="${y(cfg.vara)}" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="6 4"/><text x="${W - R}" y="${y(cfg.vara) - 5}" text-anchor="end" class="eje">vara: ${cfg.vara}</text>`;
  cfg.series.forEach((se, k) => {
    const p = se.d.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
    if (k === 0) s += `<path d="${p} L${x(n - 1)} ${y(0)} L${x(0)} ${y(0)}Z" fill="var(${se.c})" opacity=".1"/>`;
    s += `<path d="${p}" fill="none" stroke="var(${se.c})" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${se.p ? 'stroke-dasharray="5 4"' : ""}/>`;
    s += `<circle cx="${x(n - 1)}" cy="${y(se.d[n - 1])}" r="4" fill="var(${se.c})" stroke="var(--card)" stroke-width="2"/>`;
  });
  s += `<g class="cruz" display="none"><line y1="${T}" y2="${H - B}" stroke="var(--muted)" stroke-width="1"/>${cfg.series.map(se => `<circle r="4.5" fill="var(${se.c})" stroke="var(--card)" stroke-width="2"/>`).join("")}</g></svg><div class="dn-tip" hidden></div>`;
  caja.innerHTML = s;
  const cruz = caja.querySelector(".cruz"), tip = caja.querySelector(".dn-tip"), svg = caja.querySelector("svg");
  const mueve = ev => {
    const b = svg.getBoundingClientRect(), px = (ev.clientX - b.left) * W / b.width;
    const i = Math.max(0, Math.min(n - 1, Math.round((px - L) / (W - L - R) * (n - 1))));
    cruz.setAttribute("display", "inline");
    cruz.querySelector("line").setAttribute("x1", x(i)); cruz.querySelector("line").setAttribute("x2", x(i));
    cruz.querySelectorAll("circle").forEach((c, k) => { c.setAttribute("cx", x(i)); c.setAttribute("cy", y(cfg.series[k].d[i])); });
    tip.hidden = false;
    tip.innerHTML = `<b>${dnE(cfg.dias[i])}</b>` + cfg.series.map(se => `<span><i class="dn-raya ${se.p ? "p" : ""}" style="border-color:var(${se.c})"></i>${dnE(se.n)}<em>${se.d[i]}</em></span>`).join("");
    const izq = x(i) * b.width / W;
    tip.style.left = (izq > b.width / 2 ? Math.max(0, izq - tip.offsetWidth - 10) : izq + 10) + "px";
  };
  svg.addEventListener("pointermove", mueve); svg.addEventListener("pointerdown", mueve);
  svg.addEventListener("pointerleave", () => { cruz.setAttribute("display", "none"); tip.hidden = true; });
}

/* El embudo: un cono de tramos pegados. El ancho de arriba de cada tramo es la
   gente que llegó a ese paso y el de abajo la que pasa al siguiente, así que la
   pendiente de cada tramo ES lo que pierde. En coral, el que más pierde. */
function dnEmbudo(caja, pasos) {
  caja.innerHTML = "";
  const E = (pasos || []).map(p => [String(p.paso), Number(p.personas) || 0]), n = E.length;
  if (!n || !E[0][1]) { caja.innerHTML = `<div class="dn-vacio">Todavía no se ha registrado nadie.</div>`; return; }
  const libre = caja.clientHeight || 0, W = Math.max(240, caja.clientWidth || 400), gap = 3;
  const hs = Math.min(60, Math.max(40, (libre - gap * (n - 1) - 4) / n)), H = n * hs + gap * (n - 1) + 4;
  const F = Math.min(W * 0.46, 250), cx = F / 2, mx = E[0][1], w = v => Math.max(30, F * v / mx);
  let peor = -1, rp = 1;
  for (let i = 0; i < n - 1; i++) { const q = E[i][1] ? E[i + 1][1] / E[i][1] : 1; if (q < rp) { rp = q; peor = i; } }
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Embudo">`;
  E.forEach((x, i) => {
    const y = 2 + i * (hs + gap), a = w(x[1]), b = i < n - 1 ? w(E[i + 1][1]) : w(x[1]) * 0.78, mal = i === peor;
    s += `<polygon points="${cx - a / 2},${y} ${cx + a / 2},${y} ${cx + b / 2},${y + hs} ${cx - b / 2},${y + hs}" fill="var(${mal ? "--dn-coral-m" : "--dn-l1"})" opacity="${mal ? 1 : 1 - i * 0.07}"/>`;
    s += `<text x="${cx}" y="${y + hs / 2 + 5}" text-anchor="middle" class="dentro">${x[1]}</text>`;
    s += `<text x="${F + 14}" y="${y + hs / 2 + (i < n - 1 ? -2 : 5)}" class="nom">${dnE(x[0])}</text>`;
    if (i < n - 1) s += `<text x="${F + 14}" y="${y + hs / 2 + 13}" class="eje ${mal ? "mal" : ""}">${x[1] ? Math.round(E[i + 1][1] / x[1] * 100) : 0}%${mal ? " · la mayor caída" : ""}</text>`;
  });
  caja.innerHTML = s + `</svg><div class="dn-tip" hidden></div>`;
  const svg = caja.querySelector("svg"), tip = caja.querySelector(".dn-tip");
  const mueve = ev => {
    const b = svg.getBoundingClientRect(), py = (ev.clientY - b.top) * H / b.height;
    const i = Math.max(0, Math.min(n - 1, Math.floor((py - 2) / (hs + gap)))), x = E[i];
    tip.hidden = false;
    tip.innerHTML = `<b>${dnE(x[0])}</b><span>Personas<em>${x[1]}</em></span><span>De las registradas<em>${Math.round(x[1] / mx * 100)}%</em></span>` + (i < n - 1 ? `<span>No pasan al siguiente<em>${x[1] - E[i + 1][1]}</em></span>` : "");
    tip.style.left = (F + 14) * b.width / W + "px"; tip.style.top = Math.max(0, Math.min(b.height - tip.offsetHeight, (2 + i * (hs + gap)) * b.height / H)) + "px";
  };
  svg.addEventListener("pointermove", mueve); svg.addEventListener("pointerdown", mueve);
  svg.addEventListener("pointerleave", () => { tip.hidden = true; });
}

/* Las versiones: puntos apilados sobre la versión en la que se quedó cada
   persona, de la más vieja a la publicada. Puntos y no barras, y lo pidió
   Eduardo: lo que quiere ver es si hay gente atorada en una subida mala. Por
   eso una versión que tuvo errores automáticos va sombreada en coral. */
function dnPuntos(caja, versiones) {
  caja.innerHTML = "";
  let V = (versiones || []).map(v => ({ v: String(v.version || "?"), n: Number(v.personas) || 0, dor: Math.min(Number(v.dormidas) || 0, Number(v.personas) || 0) })).filter(v => v.n > 0)
    .sort((a, b) => versionMasNueva(a.v, b.v) ? 1 : versionMasNueva(b.v, a.v) ? -1 : 0);
  if (!V.length) { caja.innerHTML = `<div class="dn-vacio">Nadie abrió la app en 14 días.</div>`; return; }
  /* Más de ocho columnas no caben en un teléfono: las más viejas se juntan. */
  if (V.length > 8) { const viejas = V.slice(0, V.length - 7); V = [{ v: "antes", n: dnSuma(viejas.map(x => x.n)), dor: dnSuma(viejas.map(x => x.dor)), junta: viejas.length }].concat(V.slice(-7)); }
  const err = v => dnTropiezos().filter(t => t.donde !== "reporte" && t.donde !== "tope" && t.version === v).length;
  const libre = caja.clientHeight || 0, W = Math.max(240, caja.clientWidth || 400), n = V.length, col = W / n;
  /* Si hay mucha gente, cada punto vale por varias personas: sin esto la
     columna de la versión publicada se saldría por arriba. */
  const tope0 = Math.max(...V.map(v => v.n)), vale = Math.max(1, Math.ceil(tope0 / 40)), tope = Math.ceil(tope0 / vale);
  const escala = document.getElementById("dn-escala");
  if (escala) escala.textContent = vale === 1 ? "un punto, una persona" : "un punto, " + vale + " personas";
  let por = 3, d = 8;
  for (let k = 2; k <= 6; k++) { const dk = Math.min(15, (col - 8) / k - 2.5, libre ? (libre - 38) / Math.ceil(tope / k) - 2.5 : 8); if (dk > d || k === 2) { d = Math.max(6, dk); por = k; } }
  const paso = d + 2.5, filas = Math.ceil(tope / por), H = Math.max(libre, 12 + filas * paso + 26), base = H - 22;
  /* Si todas las versiones comparten el principio («0.7.»), se quita de las
     etiquetas: repetido ocho veces no deja sitio para lo que cambia. */
  const pref = V.every(v => v.v === "antes" || /^\d+\.\d+\./.test(v.v) && v.v.split(".").slice(0, 2).join(".") === V[n - 1].v.split(".").slice(0, 2).join(".")) ? V[n - 1].v.split(".").slice(0, 2).join(".") : "";
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Personas por versión">`;
  V.forEach((v, i) => {
    const x0 = col * i + col / 2 - (por * paso - 2.5) / 2, hoy = v.v === VERSION, e = v.junta ? 0 : err(v.v), puntos = Math.ceil(v.n / vale), vivos = puntos - Math.ceil(v.dor / vale);
    if (e) s += `<rect x="${col * i + 2}" y="2" width="${col - 4}" height="${base - 2}" rx="6" fill="var(--dn-coral-s)"/>`;
    for (let k = 0; k < puntos; k++) s += `<circle cx="${x0 + (k % por) * paso + d / 2}" cy="${base - 5 - Math.floor(k / por) * paso - d / 2}" r="${d / 2}" fill="var(${k >= vivos ? "--dn-coral" : hoy ? "--dn-l1" : "--dn-l3"})"/>`;
    s += `<text x="${col * i + col / 2}" y="${H - 6}" text-anchor="middle" class="eje ${e ? "mal" : ""}">${dnE(v.junta ? "antes" : pref && v.v.indexOf(pref + ".") === 0 ? v.v.slice(pref.length) : v.v)}</text>`;
  });
  s += `<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--line)" stroke-width="1"/>`;
  caja.innerHTML = s + `</svg><div class="dn-tip" hidden></div>`;
  const svg = caja.querySelector("svg"), tip = caja.querySelector(".dn-tip");
  const mueve = ev => {
    const b = svg.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.floor((ev.clientX - b.left) / b.width * n))), v = V[i], e = v.junta ? 0 : err(v.v);
    tip.hidden = false;
    tip.innerHTML = `<b>${dnE(v.junta ? v.junta + " versiones más viejas" : v.v)}</b><span>${v.v === VERSION ? "Al día" : "Sin actualizar"}<em>${v.n - v.dor}</em></span>` + (v.dor ? `<span>Dejaron de abrir<em>${v.dor}</em></span>` : "") + (e ? `<span>Errores automáticos<em>${e}</em></span>` : "");
    const izq = (i + .5) * b.width / n;
    tip.style.left = Math.max(0, Math.min(b.width - tip.offsetWidth, izq > b.width / 2 ? izq - tip.offsetWidth - 14 : izq + 14)) + "px";
  };
  svg.addEventListener("pointermove", mueve); svg.addEventListener("pointerdown", mueve);
  svg.addEventListener("pointerleave", () => { tip.hidden = true; });
}

/* Dos pasadas, y no es descuido: la primera dibuja cada gráfica a su alto
   mínimo, y con eso ya se sabe cuánto mide cada fila; la segunda las estira
   hasta llenar su tarjeta. Con una sola, la tarjeta más baja de cada fila se
   quedaba con un hueco debajo, que es lo que Eduardo pidió que no pasara. */
function dnDibuja() { dnDibujaUna(); dnDibujaUna(); }
function dnDibujaUna() {
  const m = metricasCache;
  if (!m) return;
  const todos = m.dias || [], dias = todos.slice(-14), rot = dias.map(d => dnDia(d.dia));
  const tramo = todos.slice(-DN.rango), reten = (m.retencion || []).filter(x => Number(x.de) > 0);
  document.querySelectorAll("#dentro .dn-graf").forEach(c => {
    const g = c.dataset.g;
    if (g === "mini") dnGrafica(c, { titulo: "Personas que abrieron la app, 14 días", alto: 170, dias: rot, series: [{ n: "Personas", c: "--dn-l1", d: dias.map(d => Number(d.personas) || 0) }] });
    if (g === "ventas") {
      const v = dnVentas((metricasCache && metricasCache.cobro) || {});
      const series = [{ n: "Suscripciones", c: "--dn-l1", d: v.sSus }, { n: "Fundador", c: "--dn-l2", d: v.sFun, p: true }];
      if (v.dev.n) series.push({ n: "Devoluciones", c: "--dn-coral", d: v.sDev });
      dnGrafica(c, { titulo: "Ventas por fecha, en pesos", alto: 240, dias: v.rot, series: series });
    }
    if (g === "gente") dnGrafica(c, { titulo: "Personas que abrieron y cuentas nuevas", alto: 240, dias: tramo.map(d => dnDia(d.dia)), series: [{ n: "Personas que abrieron", c: "--dn-l1", d: tramo.map(d => Number(d.personas) || 0) }, { n: "Cuentas nuevas", c: "--dn-l2", d: tramo.map(d => Number(d.altas) || 0), p: 1 }] });
    if (g === "reten") dnGrafica(c, { titulo: "Cuántas siguen con los días", alto: 200, vara: 20, dias: reten.map(x => "Día " + x.dia), series: [{ n: "Siguen, de cada 100", c: "--dn-l1", d: reten.map(x => Math.round(Number(x.siguen) / Number(x.de) * 100)) }] });
    if (g === "embudo") dnEmbudo(c, m.embudo);
    if (g === "versiones") dnPuntos(c, m.versiones);
  });
}

/* ---- Acciones ---- */

function dnCopia(texto) {
  const no = () => toast("No pude copiarlo.", "atencion");
  try { navigator.clipboard.writeText(texto).then(() => toast("Copiado", "hecho"), no); } catch (e) { no(); }
}

/* Dar por atendido UN reporte, o volver a abrirlo. Se pinta con lo que
   CONTESTA el servidor y no con lo que suponíamos: si la fila ya no está —dos
   pestañas archivando a la vez— la respuesta es `null` y se vuelven a pedir
   los números en vez de dejar la pantalla diciendo algo que no es. */
async function archivarReporte(id, visto) {
  const t = dnTropiezos().find(x => Number(x.id) === Number(id));
  try {
    const quedo = await sbTropiezoVisto(id, visto);
    if (quedo === null || quedo === undefined) { metricasCache = null; await cargarMetricas(); return; }
    if (t) t.visto = !!quedo;
    dnPinta();
  } catch (e) {
    toast(e.message || String(e), "atencion");
  }
}

/* Cambiar el estado, la nota o la versión de UNO. Igual que al archivar: se
   pinta con lo que contesta el servidor. */
async function dnGuardar(t, cambios) {
  try {
    const quedo = await sbTropiezoEstado(t.id, cambios.estado === undefined ? null : cambios.estado,
      cambios.nota === undefined ? null : cambios.nota, cambios.arreglado === undefined ? null : cambios.arreglado, cambios.respuesta);
    if (!quedo) { metricasCache = null; await cargarMetricas(); return; }
    Object.assign(t, quedo);
    dnPinta();
  } catch (e) {
    toast(e.message || String(e), "atencion");
  }
}
/* La nota y la versión se guardan al salir del campo, no a cada letra. */
function dnCambia(ev) {
  /* Las dos fechas del cobro: no son de ningún reporte, así que van antes. */
  if (ev.target.id === "dn-cob-desde" || ev.target.id === "dn-cob-hasta") {
    DN[ev.target.id === "dn-cob-desde" ? "cobDesde" : "cobHasta"] = /^\d{4}-\d{2}-\d{2}$/.test(ev.target.value) ? ev.target.value : "";
    dnPinta();
    return;
  }
  const t = dnTropiezos().find(x => dnClave(x) === DN.sel);
  if (!t || t.id == null) return;
  if (ev.target.id === "dn-nota") dnGuardar(t, { nota: ev.target.value.slice(0, 500) });
  if (ev.target.id === "dn-arreglado") dnGuardar(t, { arreglado: ev.target.value });
}

function dnClic(ev) {
  const el = ev.target.closest("[data-a]");
  if (!el) return;
  /* Un toque DENTRO de la ventana no la cierra: solo el velo de detrás. */
  if (el.dataset.a === "ventana:cerrar" && ev.target.closest("[data-quieto]")) return;
  const partes = el.dataset.a.replace("!", "").split(":"), a = partes[0], v = partes[1], w = partes[2];
  const primero = () => { const f = dnFiltrados()[0]; return f && isDesktop() ? dnClave(f) : null; };
  const sel = dnTropiezos().find(t => dnClave(t) === DN.sel);
  switch (a) {
    case "cerrar": cerrarDentro(); return;
    case "ir": DN.sala = v; if (v === "buzon" && !sel) DN.sel = primero(); break;
    case "auto": DN.sala = "buzon"; DN.tipo = "auto"; DN.ver = "abiertos"; DN.sel = primero(); break;
    case "tipo": DN.tipo = v; DN.sel = primero(); break;
    case "ver": DN.ver = v; DN.sel = primero(); break;
    case "sel": DN.sel = el.dataset.k; break;
    case "volver": DN.sel = null; break;
    /* Todos los reportes de esa persona: su apodo y su clave, al buscador. */
    case "dequien": DN.q = el.dataset.k || ""; DN.tipo = "todo"; DN.ver = "todos"; DN.sel = primero(); break;
    case "atender": if (sel && sel.id != null) archivarReporte(sel.id, !sel.visto); return;
    case "estado": if (sel && sel.id != null && dnEstado(sel) !== v) dnGuardar(sel, { estado: v }); return;
    case "responder": {
      const c = document.getElementById("dn-respuesta"), txr = c ? c.value.trim().slice(0, 600) : "";
      if (!sel || sel.id == null) return;
      if (!txr) { toast("Escribe la respuesta antes de enviarla.", "atencion"); return; }
      dnGuardar(sel, { respuesta: txr }).then(() => { if (sel.respuesta === txr) toast("Respuesta enviada", "hecho"); });
      return; }
    case "rango": DN.rango = Number(v) || 14; break;
    case "vistos": marcarTropiezosVistos(); return;
    case "repedir": metricasCache = null; cargarMetricas(); return;
    case "barrera": DN.barError = null; dnPinta(); dnCargaBarrera(); return;
    case "ventana": dnCierraVentana(); break;
    case "subir": DN.ventana = { tipo: "subir", hasta: v || "" }; break;
    case "subirya": {
      const cola = (DN.bar && DN.bar.cola) || [], h = DN.ventana ? DN.ventana.hasta : "";
      const i = h ? cola.findIndex(c => c.sha === h) : cola.length - 1;
      const sql = cola.slice(0, i + 1).some(c => (c.sql || []).length);
      DN.ventana = null; dnPinta();
      dnMandaBarrera("subir", { hasta: h, sql_pegado: sql }, "Subida en marcha: tarda uno o dos minutos");
      return; }
    case "grifo":
      if (v === "cerrar") { DN.seguro = true; clearInterval(DN.reloj); DN.ventana = null; dnMandaBarrera("grifo", { abierto: false }, "Grifo cerrado: lo nuevo espera tu aprobación"); return; }
      if (v === "abrirya") { clearInterval(DN.reloj); DN.seguro = true; DN.ventana = null; dnPinta(); dnMandaBarrera("grifo", { abierto: true }, "Grifo abierto"); return; }
      if (DN.seguro) { toast("Tiene seguro. Arrastra la llave a la cerradura.", "atencion"); return; }
      DN.ventana = { tipo: "abrir" }; break;
    case "emergencia": DN.ventana = { tipo: "emergencia" }; break;
    case "regresar": DN.ventana = { tipo: "regresar", a: v }; break;
    case "regresarya":
      DN.ventana = null; DN.seguro = true; clearInterval(DN.reloj);
      dnMandaBarrera("regresar", { a: v }, "Grifo cerrado y regreso en marcha: tarda dos o tres minutos");
      return;
    case "paqdia": try { localStorage.setItem("norata-paquete-dia", String(Number(v) || 0)); } catch (e) { /* sin almacén, se queda en jueves */ } break;
    case "num": DN.num = v; break;
    case "cob": DN.cobDesde = ""; DN.cobHasta = ""; if (Number(v)) DN.cobDias = Number(v); break;
    case "lab": DN.lab = v; break;
    case "novedades": cerrarDentro(); if (typeof mostrarAjuste === "function") mostrarAjuste("novedades"); return;
    /* La llave de una ficha es su `id` o su versión: se toma entera del
       atributo, que una versión no lleva dos puntos pero un `id` podría. */
    case "aprobartodas": DN.ventana = { tipo: "aprobartodas" }; break;
    case "aprobartodasya": {
      const ks = dnBorradores().map(e => typeof novedadLlave === "function" ? novedadLlave(e) : String(e.id || e.version));
      DN.ventana = null; dnPinta();
      if (ks.length) dnMandaBarrera("aprobar", { llaves: ks }, "Aprobadas: se publican en uno o dos minutos");
      return; }
    case "aprobarnov": DN.ventana = { tipo: "aprobar", llave: el.dataset.a.slice(11) }; break;
    case "aprobarnovya": {
      const k = el.dataset.a.slice(13);
      DN.ventana = null; dnPinta();
      dnMandaBarrera("aprobar", { llave: k }, "Aprobada: se publica en uno o dos minutos");
      return; }
    case "ficha": { const k = el.dataset.a.slice(6); DN.ficha = DN.ficha === k ? null : k; break; }
    case "ventananov": {
      const k = el.dataset.a.slice(11), e = (DN.nov || []).find(x => (typeof novedadLlave === "function" ? novedadLlave(x) : String(x.id || x.version)) === k);
      if (!e || typeof ventanaNovedades !== "function") return;
      /* Como las fiestas: se sale de la capa, que la ventana vive en un piso
         de más abajo y aquí se dibujaría detrás. */
      cerrarDentro();
      if (typeof novedadClase === "function" && novedadClase(e) === "hito" && typeof abrirHito === "function") abrirHito(e, { prueba: true });
      else ventanaNovedades([e]);
      return; }
    case "cuenta": if (typeof marcarCuentaDePruebas === "function") marcarCuentaDePruebas(v === "1"); break;
    case "plan": if (typeof planSimular === "function") planSimular(v || ""); break;
    case "fiesta": verLaFiesta(v); return;
    case "pantalla": verLaPantalla(v); return;
    case "prueba": { const p = DN_PRUEBAS.find(x => x.id === v); if (p) location.href = location.pathname + (w === "off" ? p.off : p.on); return; }
    case "copiar":
      if (v === "reporte" && sel) { const tx2 = dnTexto(sel); dnCopia(DN_TIPOS[dnTipo(sel)].n + " · " + dnLugar(sel) + " · v" + (sel.version || "?") + " · " + dnDia(sel.dia) + ((Number(sel.cuantos) || 1) > 1 ? " · " + sel.cuantos + " veces" : "") + "\nQué pasó: " + tx2.que + (tx2.antes ? "\nJusto antes: " + tx2.antes : "") + (sel.nota ? "\nMi nota: " + sel.nota : "")); }
      else { const p = DN_PRUEBAS.find(x => x.id === v); if (p) dnCopia(location.origin + location.pathname + p.on); }
      return;
    default: return;
  }
  dnPinta();
}
function dnEscribe(ev) {
  if (ev.target.id !== "dn-q") return;
  DN.q = ev.target.value;
  /* Solo la lista, no la sala entera: repintarlo todo le quitaría el foco al
     campo a cada letra. */
  const l = document.getElementById("dn-lista");
  if (l) l.innerHTML = dnListaHTML();
}

/* ---- Lo que el resto de la app sigue llamando ----

   `renderPanelAdmin` es el nombre que usan Ajustes, el plan simulado y el modo
   de pruebas para decir «repíntate». Sigue existiendo y repinta la capa si está
   abierta. El bloque de Ajustes se queda vacío: a esa sección ya no se llega,
   porque `mostrarAjuste` y `abrirAjustes` abren la capa directamente
   (0.7.171; antes había que pulsar un «Abrir» de más). */
function renderPanelAdmin() {
  const caja = document.getElementById("panel-admin");
  if (caja) caja.innerHTML = "";
  if (!esAdmin) { cerrarDentro(); return; }
  dnPinta();
}

async function cargarMetricas() {
  DN.cargando = true; DN.error = "";
  dnPinta();
  try {
    metricasCache = await sbMetricas();
  } catch (e) {
    /* Aquí sí se enseña el error, al revés que en el latido: quien abrió el
       panel está esperando algo y merece saber por qué no llegó. */
    metricasCache = null;
    DN.error = e.message || String(e);
  }
  DN.cargando = false;
  if (isDesktop() && DN.sala === "buzon" && !DN.sel) { const f = dnFiltrados()[0]; DN.sel = f ? dnClave(f) : null; }
  dnPinta();
}

async function marcarTropiezosVistos() {
  try {
    await sbTropiezosVistos();
    metricasCache = null;
    await cargarMetricas();
    toast("Todo dado por atendido", "hecho");
  } catch (e) {
    toast(e.message || String(e), "atencion");
  }
}
