/* ================= Pomodoro: el día en una rueda (0.7.101 en adelante) =====
   Una rueda de 24 horas donde se acomoda CUÁNDO se hace cada cosa, con un
   reloj de arena en el centro que lleva los tramos de enfoque (la técnica
   pomodoro). Al acabar un tramo apunta el avance en el módulo que toque.

   ---- Se ve «Pomodoro» y por dentro se llama `jornada` ----
   Nació llamándose Jornada (0.7.101) y Eduardo lo renombró en la 0.7.102, con
   un tomate de icono. Los identificadores internos NO se cambiaron a
   propósito —`state.jornada`, `#view-jornada`, `?jornada=1`—: son los que ya
   guardan los datos de quien lo está probando, y renombrarlos los dejaría
   huérfanos. Es la misma decisión que se tomó con `mainquest-v1` cuando la app
   cambió de nombre dos veces. `?pomodoro=1` vale igual que `?jornada=1`.

   Nació de dos bocetos del 10 sep 2026. El primero ponía un botón de «Enfocar»
   en cada misión y cada habilidad, y Eduardo lo paró: «vas a saturar de
   botones la interfaz». Lo que él se imaginaba era un LUGAR para planear el
   día, como las apps de bloques de tiempo, y con los controles de otra que
   había visto: una sola cosa grande, un botón de Iniciar y casi nada de texto.

   ---- Encendido para todos desde la 0.7.103 ----
   Nació apagado y detrás de `?jornada=1`, con la marca en `state.ui.jornada`.
   Eduardo pidió que saliera en el live general porque «no siempre sale», y
   la causa no era el enlace: `state.ui` viaja ENTERO desde el dispositivo que
   guardó más reciente, así que otro dispositivo sin la marca lo apagaba en
   silencio. Ahora es un módulo como los otros cuatro —se apaga en Ajustes y
   solo se guarda el APAGADO, en `modulosOff`— y la marca vieja se convierte
   una vez (`jMigrarInterruptor`). Los enlaces siguen valiendo.

   ---- Dos maneras de usarlo (0.7.104) ----
   «Mi día» es la rueda. «Solo enfocar» es un reloj de un toque: nada que
   vincular ni que configurar —25, 50 o libre, y ya—, para cuando lo único que
   hace falta es hiperfoco. Lo pidió Eduardo con esas palabras: «algo mucho más
   lite donde no andes buscando configuraciones complejas». Comparten el mismo
   reloj (`state.jornada.run`, con `lite: true`), así que la píldora y el
   informe los cuentan igual.

   ---- Dos clases de bloque: los de enfoque y los de descanso ----
   Dormir con tramos de 25 minutos no tiene sentido (lo dijo Eduardo en la
   primera prueba), y comer o ir en camino tampoco. Un bloque de descanso
   (`b.descanso`: dormir, comida o traslado) no ofrece Iniciar: el centro
   enseña cuánto le queda, y Dormir apunta a qué hora te dormiste y a qué hora
   despertaste. Media hora antes de dormir, un aviso. Comer y Traslado llegan
   sugeridos una vez y se borran como cualquier bloque.

   ---- El reloj mide con marcas de tiempo, nunca contando ----
   Se guarda cuándo empezó el tramo y cuánto llevaba, no un contador que baja.
   Así sobrevive a cerrar la app, a que el teléfono duerma la pestaña y a
   recargar: al volver, la cuenta sale igual. Por la misma razón el paso lo da
   un `setInterval` y no `requestAnimationFrame`: en una pestaña de fondo no hay
   fotogramas, y sin eso el tramo no acababa —ni sonaba el aviso— hasta volver.

   ---- La regla de todo: el reloj propone y tú confirmas ----
   Solo toca otros módulos por las puertas que ya existen: `logMission` para
   cumplir una misión (y solo si dices que la terminaste) y `addXp` para la
   práctica de una habilidad, con los mismos topes de medio día que el registro
   manual. Lo que da, lo da A NOMBRE DEL POMODORO (`fuente: "Pomodoro · …"`),
   que el informe cuenta aparte; la misión igual queda cumplida en Misiones.
   Los talentos y los encargos no guardan tiempo en ningún campo, así que si
   entrenan una habilidad, la practica esa; si no, queda en el registro del
   Pomodoro, que es lo que lee su informe (`metricasPomodoro`,
   js/10f-informes.js). */

const J_DIA = 1440, J_MS = 60000;
const J_C = 160, J_RO = 126, J_RI = 94, J_RM = 110;
const J_PRESETS = { clasico: { foco: 25, desc: 5, ciclos: 4 }, profundo: { foco: 50, desc: 10, ciclos: 2 } };
/* Lo que se guarda del registro. Eran 300, que a ocho tramos al día son cinco
   semanas: el informe del año se quedaba sin historia. Cada entrada pesa poco
   más de cien bytes. */
const J_REG_MAX = 2000;
/* El sol es el hermano de la luna: si irse a dormir lleva icono, despertar
   también. Mismo trazo de 24x24 que el resto de la casa. */
const J_SOL = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
/* El símbolo de prohibido, para el bloque que estás pisando: mientras dure el
   arrastre sustituye a SU icono, porque ahí no se trata de qué es sino de que
   ahí no cabe. */
const J_PROHIBIDO = '<circle cx="12" cy="12" r="9"/><line x1="5.6" y1="18.4" x2="18.4" y2="5.6"/>';
const J_LUNA = '<path d="M19.5 14.5A7.5 7.5 0 019.5 4.5a7.5 7.5 0 1010 10z"/>';
const J_ARENA = '<path d="M7 3h10M7 21h10M8 3c0 5 8 6.5 8 9s-8 4-8 9M16 3c0 5-8 6.5-8 9s8 4 8 9"/>';
/* Los bloques de descanso. Los rótulos se traducen donde se DIBUJAN: una tabla
   de nivel superior se evalúa una vez al cargar y congelaría el idioma. */
const J_DESCANSOS = {
  dormir:   { nombre: "Dormir",   fase: "Hora de dormir", icono: J_LUNA },
  /* Los cubiertos salen del catálogo (`ICONS`, js/01-base.js) desde la
     0.7.109, que es donde los pidió Eduardo para las habilidades: era el mismo
     dibujo escrito dos veces, y dos copias se separan al primer retoque. */
  comida:   { nombre: "Comer",    fase: "Hora de comer",  icono: ICONS.cubiertos },
  traslado: { nombre: "Traslado", fase: "En camino",      icono: '<path d="M5.5 16.5V8a3 3 0 013-3h7a3 3 0 013 3v8.5M5.5 12h13M5.5 16.5h13M7.5 16.5V19M16.5 16.5V19"/>' }
};

function jornadaEncendida() { return typeof moduloOn === "function" ? moduloOn("jornada") : true; }

/* La marca de la 0.7.101-0.7.102 pasa al sistema de todos los módulos: quien
   lo había APAGADO a propósito lo sigue teniendo apagado; a los demás no se
   les guarda nada, porque encendido es lo de partida. */
function jMigrarInterruptor() {
  if (!state.ui || state.ui.jornada === undefined) return;
  const off = new Set(state.ui.modulosOff || []);
  if (state.ui.jornada === false) off.add("jornada");
  state.ui.modulosOff = [...off];
  delete state.ui.jornada;
  save();
}

/* Los datos se siembran al PEDIRLOS, no al cargar: quien nunca abra el
   Pomodoro no lleva ni una llave de más en su perfil. */
function jDatos() {
  if (!state.jornada || typeof state.jornada !== "object") state.jornada = {};
  const j = state.jornada;
  if (!Array.isArray(j.bloques)) j.bloques = [{ id: uid(), descanso: "dormir", ini: 23 * 60, fin: 7 * 60 }];
  /* La 0.7.101 marcaba el de dormir con `sueno: true`; desde la 0.7.102 los
     descansos son tres y van por nombre. */
  j.bloques.forEach(b => { if (b.sueno) { b.descanso = "dormir"; delete b.sueno; } });
  /* Comer y Traslado llegan UNA vez, sugeridos, y solo donde caben. Si alguien
     los borra no vuelven: por eso la marca, y no «si no existen». */
  if (!j.sugeridos) {
    j.sugeridos = true;
    [["comida", 14 * 60, 15 * 60], ["traslado", 8 * 60, 8 * 60 + 30]].forEach(([d, ini, fin]) => {
      if (!jChocaEn(j.bloques, ini, fin, null)) j.bloques.push({ id: uid(), descanso: d, ini, fin });
    });
  }
  /* ---- Una rutina por día (0.7.115) ----
     Hasta aquí la rueda era UNA plantilla para los siete días, y eso obliga a
     mentir: el gimnasio de martes y jueves o el sábado sin traslados no caben.
     Ahora son siete listas, `rutinas[0]` domingo y `rutinas[6]` sábado, como
     `Date.getDay()` — así ningún sitio tiene que traducir el índice.
     La que había se copia a los siete, que es lo que la persona tenía en la
     cabeza: «mi día», todos los días. Los ids se rehacen en cada copia porque
     si no, el mismo bloque existiría siete veces con el mismo id y el registro
     de un tramo no sabría de cuál día habla. */
  if (!Array.isArray(j.rutinas) || j.rutinas.length !== 7) {
    j.rutinas = [];
    for (let d = 0; d < 7; d++) {
      j.rutinas.push(d === jHoy()
        ? j.bloques
        : j.bloques.map(b => Object.assign({}, b, { id: uid() })));
    }
  }
  /* `bloques` se queda como ESPEJO del día de hoy y no como otra copia: una
     versión anterior de la app en otro dispositivo lo sigue leyendo y ve su
     día de siempre. Se reescribe en `jDatos` y en cada pintada (`jEspejoHoy`). */
  if (typeof j.vinculado !== "boolean") j.vinculado = false;
  jEspejoHoy(j);
  if (!j.cfg || typeof j.cfg !== "object") j.cfg = {};
  /* `notificar` sustituye a `avisos` (0.7.105.1): aquel nació apagado y se
     guardó apagado en todos los perfiles, así que reusarlo no habría
     encendido nada. */
  /* Se rellena lo que falta SIN cambiar el objeto (0.7.106). Antes se
     reemplazaba por una copia en cada llamada —cuatro veces por segundo—, y
     quien guardaba el de antes escribía en una copia huérfana: el reloj no
     cambiaba al mover los minutos. */
  const porDefecto = { preset: "clasico", foco: 25, desc: 5, ciclos: 4, auto: false, sonido: true, notificar: true, hfModo: "travesia" };
  for (const k in porDefecto) if (!(k in j.cfg)) j.cfg[k] = porDefecto[k];
  if (!Array.isArray(j.registro)) j.registro = [];
  return j;
}

/* ---------- El tiempo ---------- */
const jDur = b => ((b.fin - b.ini + J_DIA) % J_DIA) || J_DIA;
const jDentro = (b, m) => ((m - b.ini + J_DIA) % J_DIA) < jDur(b);
const jSnap = m => ((Math.round(m / 15) * 15) % J_DIA + J_DIA) % J_DIA;
/* La hora del perfil, no la del reloj de la máquina: es la misma zona que usan
   `todayKey` y las marcas de las misiones. */
function jAhora() {
  const s = hhmmNow();
  return (+s.slice(0, 2)) * 60 + (+s.slice(2)) + new Date().getSeconds() / 60;
}
/* ---- Hoy, el día que se mira, y el grupo ----
   `jHoy` es el día de verdad y manda en todo lo que PASA: lo que corre, lo que
   se avisa, lo que se apunta. `jDiaVisto` es el que estás mirando y manda en
   todo lo que se EDITA. Separarlos es lo que evita que ver el jueves mueva el
   tramo de hoy. El día visto no se guarda en `state`: es de este dispositivo y
   de este rato, como el modo, y vuelve a hoy al entrar. */
function jHoy() { return new Date().getDay(); }
let jDiaSel = null;
function jDiaVisto() { return jDiaSel == null ? jHoy() : jDiaSel; }
function jBloques() { return jDatos().rutinas[jDiaVisto()]; }
function jBloquesHoy() { return jDatos().rutinas[jHoy()]; }
const jFinde = d => d === 0 || d === 6;
function jDiasGrupo(d) { return jFinde(d) ? [6, 0] : [1, 2, 3, 4, 5]; }
function jHuella(bs) {
  return bs.slice().sort((x, y) => x.ini - y.ini)
    .map(b => [b.ini, b.fin, b.descanso || "", b.color || "", b.nombre || "", b.ref ? b.ref.t + ":" + b.ref.id : ""].join("·")).join("|");
}
function jGrupoIgual(d) {
  const dias = jDiasGrupo(d), h = jHuella(jDatos().rutinas[dias[0]]);
  return dias.every(x => jHuella(jDatos().rutinas[x]) === h);
}
/* Se copia de verdad y no se comparte la lista: desvincular tiene que dejar a
   cada día con lo suyo, no con una referencia al mismo sitio. Y los ids se
   rehacen por lo mismo que en la migración: un id es de un bloque de un día. */
function jCopiaDia(bs) { return bs.map(b => Object.assign({}, b, { id: uid() })); }
function jPropagar() {
  const j = jDatos();
  if (!j.vinculado) return jEspejoHoy();
  const d = jDiaVisto(), bs = j.rutinas[d];
  jDiasGrupo(d).forEach(x => { if (x !== d) j.rutinas[x] = jCopiaDia(bs); });
  jEspejoHoy();
}
/* El espejo para las versiones anteriores: `bloques` siempre apunta al día de
   HOY. Recibe los datos en vez de pedirlos porque también se llama desde
   dentro de `jDatos`, y pedirlos ahí sería una recursión sin fondo. */
function jEspejoHoy(j) { j = j || jDatos(); j.bloques = j.rutinas[jHoy()]; }
/* ---- El selector de días ----
   Siete botones con HOY marcado por un punto, y un interruptor para llevar
   solo dos rutinas. Vinculado se enciende el grupo entero: tocar un martes es
   tocar «entre semana», y eso tiene que verse antes de editar nada. */
const J_LETRAS = ["D", "L", "M", "X", "J", "V", "S"];
let jDiasAbierto = false;
const J_DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0];
function jNombreDia(d) {
  return [tx("Domingo"), tx("Lunes"), tx("Martes"), tx("Miércoles"), tx("Jueves"), tx("Viernes"), tx("Sábado")][d];
}
function jDiasHTML() {
  const j = jDatos(), visto = jDiaVisto(), hoy = jHoy();
  const botones = J_DIAS_ORDEN.map(d => {
    const marcado = j.vinculado ? jDiasGrupo(visto).indexOf(d) >= 0 : d === visto;
    return `<button type="button" class="jor-dia${d === hoy ? " hoy" : ""}" data-jdia="${d}" aria-pressed="${marcado}" title="${escapeAttr(jNombreDia(d) + " · " + jResumenDia(d))}">${tx(J_LETRAS[d])}</button>`;
  }).join("");
  const sub = j.vinculado
    ? tx("Vinculado: una rutina para los cinco días hábiles y otra para el fin de semana")
    : tx("Sin vincular: cada día lleva la suya, siete en total");
  const nota = visto !== hoy
    ? T`Estás viendo tu ${jNombreDia(visto).toLowerCase()}. Los tramos se inician en el día de hoy.`
    : (j.vinculado
        ? (jFinde(visto) ? tx("Lo que cambies aquí se copia a sábado y domingo.") : tx("Lo que cambies aquí se copia a los cinco días hábiles."))
        : T`Hoy, ${jNombreDia(hoy).toLowerCase()}.`);
  /* La fila de días se queda siempre —es navegación, se toca a diario—, y lo
     de vincular se pliega: se configura una vez y estorba el resto del tiempo.
     Lo pidió Eduardo. Plegado solo se ve la nota cuando estás mirando OTRO
     día, que es la única que no se puede deducir del propio selector. */
  /* Con título: siete letras sueltas no dicen qué son. Y el chevron a la
     derecha del rótulo, no al final de los días, que ahí parecía un octavo
     día. Lo pidió Eduardo. */
  return `<div class="jor-dias">
    <div class="jor-dias-cab">
      <h3 class="jor-rot">${tx("Rutina por día")}</h3>
      <button type="button" class="jor-dias-mas" data-jdias-mas="1" aria-expanded="${jDiasAbierto}" aria-label="${escapeAttr(tx("Ajustes de la rutina"))}" title="${escapeAttr(tx("Ajustes de la rutina"))}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10l5 5 5-5"/></svg>
      </button>
    </div>
    <div class="jor-dias-fila" role="group" aria-label="${escapeAttr(tx("Día de la rutina"))}">${botones}</div>
    ${jDiasAbierto ? `<button type="button" class="jor-vinculo" data-jvinculo="1" role="switch" aria-checked="${j.vinculado}">
      <span class="jor-palanca"></span>
      <span class="jor-vinculo-tx"><b>${tx("Vincular entre semana y fin de semana")}</b><small>${sub}</small></span>
    </button>` : ""}
    ${jDiasAbierto || visto !== hoy ? `<p class="jor-dias-nota">${nota}</p>` : ""}
  </div>`;
}
/* Vincular IGUALA los días del grupo, así que si los venías llevando uno a uno
   alguno se perdería. En vez de decidir por la persona, se pregunta con cuál
   se queda. Desvincular, en cambio, no cambia NADA: solo deja de copiar, y por
   eso no pregunta. */
function jTocarVinculo() {
  const j = jDatos();
  if (j.vinculado) {
    j.vinculado = false; save(); jPintar();
    toast(tx("Desvinculado: cada día se queda como está"), "hecho");
    return;
  }
  const falta = [];
  if (!jGrupoIgual(1)) falta.push("semana");
  if (!jGrupoIgual(0)) falta.push("finde");
  if (!falta.length) {
    j.vinculado = true; save(); jPintar();
    toast(tx("Vinculado: dos rutinas, entre semana y fin de semana"), "hecho");
    return;
  }
  jVinc = { falta, elegido: { semana: jFinde(jDiaVisto()) ? 1 : jDiaVisto(), finde: jFinde(jDiaVisto()) ? jDiaVisto() : 6 } };
  jAbrirHoja("vincular");
}
let jVinc = null;
function jAplicarVinculo() {
  const j = jDatos();
  if (jVinc.falta.indexOf("semana") >= 0) {
    const bs = j.rutinas[jVinc.elegido.semana];
    [1, 2, 3, 4, 5].forEach(d => { if (d !== jVinc.elegido.semana) j.rutinas[d] = jCopiaDia(bs); });
  }
  if (jVinc.falta.indexOf("finde") >= 0) {
    const fs = j.rutinas[jVinc.elegido.finde];
    [6, 0].forEach(d => { if (d !== jVinc.elegido.finde) j.rutinas[d] = jCopiaDia(fs); });
  }
  j.vinculado = true; jVinc = null; jSelId = null;
  save(); jApuntarPlan(); cerrarHojaJornada(); jPintar();
  toast(tx("Vinculado: dos rutinas, entre semana y fin de semana"), "hecho");
}
function jResumenDia(d) {
  const bs = jDatos().rutinas[d];
  let foco = 0, n = 0;
  bs.forEach(b => { if (!b.descanso) { foco += jDur(b); n++; } });
  const cuantos = bs.length + " " + (bs.length === 1 ? tx("bloque") : tx("bloques"));
  return cuantos + " · " + (n ? T`${jFmtDur(foco)} de foco` : tx("sin foco"));
}
function jBloqueEn(m) { return jBloquesHoy().find(b => jDentro(b, m)) || null; }
function jH12(m) {
  m = ((Math.round(m) % J_DIA) + J_DIA) % J_DIA;
  const h = Math.floor(m / 60), mm = m % 60;
  return `${h % 12 || 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
/* La hora de una marca de tiempo, en minutos del día del perfil. */
function jMinDe(epoch) {
  const p = tzParts(new Date(epoch), { hour: "2-digit", minute: "2-digit", hour12: false });
  const g = t => +((p.find(x => x.type === t) || {}).value || 0);
  return (g("hour") % 24) * 60 + g("minute");
}
const jRango = b => jH12(b.ini) + " – " + jH12(b.fin);
function jFmtDur(d) {
  const h = Math.floor(d / 60), m = d % 60;
  if (!h) return T`${m} min`;
  return m ? T`${h} h ${m} min` : T`${h} h`;
}
function jMmss(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
/* Horas y minutos para lo que dura más que un tramo: la noche, la comida.
   Con DOS dígitos en la hora (03:17 y no 3:17), como los minutos del tramo:
   lo pidió Eduardo porque al pasar de uno a otro el reloj cambiaba de ancho. */
function jHm(min) {
  min = Math.max(0, Math.round(min));
  return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
}

/* ---------- A qué apunta un bloque ---------- */
function jColeccion(t) {
  return ({ mision: state.missions, habilidad: state.skills, talento: state.perks, proyecto: state.projects })[t] || [];
}
function jRef(ref) {
  if (!ref) return null;
  const o = jColeccion(ref.t).find(x => x.id === ref.id);
  return o ? { t: ref.t, id: o.id, o, nombre: o.name || "" } : null;
}
function jIconoDe(o) { const n = o && o.icon; return ICONS[n] || ICONS[EMOJI_TO_ICON[n]] || ICONS.star; }
function jNombreBloque(b) {
  /* El nombre que escribió la persona manda (0.7.109). Los tres descansos y lo
     que se enfoca traen el suyo, pero «Comer» no siempre es comer: Eduardo
     quería poder llamarle a cada bloque como le toca en su día. */
  if (b.nombre) return b.nombre;
  if (b.descanso) return tx((J_DESCANSOS[b.descanso] || J_DESCANSOS.dormir).nombre);
  const r = jRef(b.ref);
  return r ? r.nombre : tx("Bloque libre");
}
/* El color PROPIO del bloque manda (0.7.103.1): los tres descansos salían del
   mismo gris y en la rueda no se distinguía Comer de Dormir. Lo pidió Eduardo.
   Sin color propio, sigue siendo el de lo que enfoca, o el gris del descanso. */
function jColorBloque(b) {
  if (b.color) return pinta(b.color);
  if (b.descanso) return b.descanso === "dormir" ? "var(--jor-sueno)" : "var(--jor-descanso)";
  const r = jRef(b.ref);
  return r && r.o.color ? pinta(r.o.color) : "var(--jor-libre)";
}
function jIconoBloque(b) {
  if (b.descanso) return (J_DESCANSOS[b.descanso] || J_DESCANSOS.dormir).icono;
  const r = jRef(b.ref);
  return r ? jIconoDe(r.o) : J_ARENA;
}

/* ---- Cuánto dura lo que dice el nombre (0.7.119) ----
   «Moverme 20 minutos» dura veinte minutos, y ponerle una hora en la rueda es
   escribir un dato falso: el informe cuenta después esa hora como planeada. Lo
   cazó Eduardo. No hay campo de duración en una misión —y no se va a inventar
   uno por esto—, así que se lee del nombre, que es donde la persona ya lo
   escribió. Si el nombre no dice nada, se queda la hora de siempre.
   Se leen las dos lenguas porque el nombre lo escribe quien usa la app, no la
   app: alguien en inglés escribe «20 min» igual. */
function jMinutosDeNombre(nombre) {
  const s = String(nombre || "").toLowerCase();
  if (/(hora y media|hour and a half)/.test(s)) return 90;
  if (/(media hora|half an hour)/.test(s)) return 30;
  if (/(cuarto de hora|quarter of an hour)/.test(s)) return 15;
  const h = s.match(/(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hora|horas|hour|hours)\b/);
  if (h) {
    const n = Math.round(parseFloat(h[1].replace(",", ".")) * 60);
    if (n >= 5 && n <= 720) return n;
  }
  const m = s.match(/(\d+)\s*(m|min|mins|minuto|minutos|minute|minutes)\b/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 5 && n <= 720) return n;
  }
  return null;
}
/* Lo que dura el bloque al que vas a enfocar, y lo que le QUEDA si ya empezó:
   el ritmo tiene que caber en lo que falta, no en el total. */
function jRestoDelObjetivo() {
  const j = jDatos();
  if (j.run) return null;
  const b = jBloqueSel() || jBloqueEn(jAhora());
  if (!b || b.descanso) return null;
  const dentro = jDentro(b, jAhora());
  const resto = dentro ? ((b.fin - jAhora() + J_DIA) % J_DIA) : jDur(b);
  return { bloque: b, resto: Math.max(1, Math.round(resto)), dentro };
}
function jBloqueSel() {
  return jSelId ? jBloques().find(b => b.id === jSelId) || null : null;
}

/* Lo que se puede poner en la rueda. Las misiones son las DE HOY: una misión
   de los martes no tiene nada que hacer en el miércoles. */
function jCandidatos() {
  return [
    ["mision", tx("Misiones de hoy"), (state.missions || []).filter(m => missionDueToday(m))],
    ["habilidad", tx("Habilidades"), state.skills || []],
    ["talento", tx("Talentos en curso"), (state.perks || []).filter(p => p.status === "active")],
    ["proyecto", tx("Encargos en curso"), (state.projects || []).filter(p => p.status === "active" || p.status === "paused")]
  ].filter(g => g[2].length);
}

/* ---------- Mi día o Solo enfocar ----------
   Es preferencia de ESTE dispositivo y no dato del usuario: vive en su propia
   llave de localStorage y nunca en `state`, como el plegado de la barra. */
function jModo() {
  try { return localStorage.getItem("norata-pomodoro-modo") === "lite" ? "lite" : "dia"; } catch (e) { return "dia"; }
}
function jPonerModo(m) {
  try { localStorage.setItem("norata-pomodoro-modo", m); } catch (e) { /* se queda en este rato */ }
  renderJornada();
}

/* ---------- Qué se enfoca si tocas Iniciar ---------- */
let jEleccion;   // undefined: lo decide el bloque de ahora · null: sin vincular · {t,id}: lo que elegiste
/* «Enfocar de todos modos» dentro de un descanso: vale para ESE bloque y se
   olvida al salir de él, para que la noche siguiente vuelva a ser noche. */
let jForzado = null;
function jDescansoAhora() {
  const b = jBloqueEn(jAhora());
  return b && b.descanso && jForzado !== b.id ? b : null;
}
function jObjetivo() {
  const j = jDatos();
  if (j.run) return j.run.ref;
  if (jEleccion !== undefined) return jEleccion;
  /* Elegir un bloque en la rueda ES decir en qué te vas a enfocar (0.7.119).
     Antes solo contaba el bloque de la hora actual, así que tocar el de las
     cinco y darle a Iniciar arrancaba «Sin vincular» — lo dijo Eduardo. El
     orden es: lo que corre, lo que elegiste a mano, lo que tocaste en la
     rueda, y lo que toca ahora. */
  const sel = jBloqueSel();
  if (sel && !sel.descanso && jRef(sel.ref)) return sel.ref;
  const b = jBloqueEn(jAhora());
  return b && !b.descanso && jRef(b.ref) ? b.ref : null;
}

/* ---------- El reloj ---------- */
const jTrans = run => !run ? 0 : (run.acum || 0) + (run.seg ? Date.now() - run.seg : 0);

/* ---- Qué dispositivo lleva el reloj (0.7.105.1) ----
   El reloj viaja con la sincronía, así que con el teléfono y la computadora
   abiertos los dos cerraban el mismo tramo y los dos sonaban; y si uno traía
   una copia vieja, volvía a sonar. Eduardo lo describió así: «siento que suena
   algo pero nunca me acabo enterando el motivo». Desde aquí el tramo es del
   dispositivo donde se empezó (`run.origen`): ese lo cierra y suena. Otro solo
   lo cierra —en silencio— si ya pasó minuto y medio y el primero no lo hizo,
   que es cuando está apagado o dormido. Es preferencia de este dispositivo:
   localStorage, nunca `state`. */
function jEsteDispositivo() {
  try {
    let id = localStorage.getItem("norata-pomodoro-dispositivo");
    if (!id) { id = uid(); localStorage.setItem("norata-pomodoro-dispositivo", id); }
    return id;
  } catch (e) { return "este"; }
}
const jEsMio = run => !run || !run.origen || run.origen === jEsteDispositivo();
function jPuedoCerrar(run) { return jEsMio(run) || jTrans(run) - run.dur > 90000; }
/* El permiso de los avisos del sistema se pide al tocar Iniciar: es un gesto
   tuyo y es justo cuando se entiende para qué. Sin permiso, el aviso de fuera
   de la app no puede explicar nada, y una campana sin explicación es ruido. */
function jPedirPermiso() {
  const c = jDatos().cfg;
  if (c.notificar === false || !("Notification" in window) || Notification.permission !== "default") return;
  try { Notification.requestPermission(); } catch (e) { /* sin avisos del sistema */ }
}

function jIniciar() {
  jAudio(); jPedirPermiso();
  const j = jDatos(), c = j.cfg, libre = c.preset === "libre";
  let tramo = 1, ref = jObjetivo(), bloque = null;
  if (j.run && j.run.fase === "listo" && !j.run.lite) { tramo = j.run.tramo; ref = j.run.ref; bloque = j.run.bloque; }
  else {
    const b = jBloqueEn(jAhora());
    bloque = b && !b.descanso && jEleccion === undefined ? b.id : null;
  }
  j.run = { fase: "foco", tramo, dur: libre ? null : c.foco * J_MS, acum: 0, seg: Date.now(), pausas: 0, libre, ref: ref || null, bloque,
    origen: jEsteDispositivo(), fid: uid(), reloj: jTipoReloj(libre ? 0 : c.foco) };
  save(); jPintar();
}
function jPausa() {
  const run = jDatos().run; if (!run || run.fase !== "foco") return;
  if (run.seg) { run.acum = jTrans(run); run.seg = null; run.pausas++; }
  else run.seg = Date.now();
  save(); jPintarControles(); jPintarCentro(); jPintarPildora();
}
function jSiguiente() {
  const j = jDatos(), run = j.run;
  Object.assign(run, { fase: "listo", tramo: run.tramo + 1, dur: j.cfg.foco * J_MS, acum: 0, seg: null, pausas: 0 });
  if (j.cfg.auto) jIniciar();
  else { save(); jPintarControles(); }
}
function jFinFase() {
  const j = jDatos(), run = j.run;
  /* Cada final de fase suena UNA vez (`clave`) y solo en el dispositivo que
     lleva el reloj (`mio`). */
  const mio = jEsMio(run), clave = (run.fid || run.seg || "") + "|" + run.fase;
  if (run.lite) {
    const k = run.modo || "travesia", h = jHfCfg().hf[k] || {};
    if (run.fase === "foco") {
      const min = Math.round(run.dur / J_MS);
      jApuntarLite(min, run.pausas, k);
      /* Una Travesía sigue sola: foco, descanso, foco… hasta sus rondas. */
      if (k === "travesia" && run.tramo < (run.rondas || 1)) {
        Object.assign(run, { fase: "descanso", dur: (h.desc || 5) * J_MS, acum: 0, seg: Date.now(), fid: uid() });
        save();
        jAvisar(T`Ronda ${run.tramo} de ${run.rondas} lista`, T`Descansa ${h.desc || 5} min.`, clave, mio);
      } else {
        Object.assign(run, { fase: "listo", min, acum: 0, seg: null });
        save();
        jAvisar(tx("Listo"), k === "travesia" && (run.rondas || 1) > 1 ? T`Terminaste tus ${run.rondas} rondas.` : T`${min} min de hiperfoco.`, clave, mio);
      }
    } else if (run.fase === "descanso") {
      if (k === "respiro") {
        jApuntarRespiro(Math.round(run.dur / J_MS));
        j.run = null;
        save();
        jAvisar(tx("Tu respiro terminó"), tx("Vuelve cuando quieras."), clave, mio);
      } else {
        Object.assign(run, { fase: "foco", tramo: run.tramo + 1, dur: (h.foco || 25) * J_MS, acum: 0, seg: Date.now(), pausas: 0, fid: uid() });
        save();
        jAvisar(tx("De vuelta al foco"), T`Ronda ${run.tramo} de ${run.rondas}.`, clave, mio);
      }
    }
    jPintar();
    return;
  }
  if (run.fase === "foco") {
    run.min = Math.round(run.dur / J_MS);
    run.fase = "cierre"; run.seg = null;
    save();
    jAvisar(T`Tramo ${run.tramo} de ${j.cfg.ciclos} listo`, T`${run.min} min de foco. Toca descansar.`, clave, mio);
    if (document.querySelector("#view-jornada.active")) jAbrirHoja("cierre");
    jPintarControles();
  } else if (run.fase === "descanso") {
    jAvisar(tx("Se acabó el descanso"), T`Sigue el tramo ${run.tramo + 1}.`, clave, mio);
    jSiguiente();
  }
}
function jTerminarLibre() {
  const run = jDatos().run;
  run.acum = jTrans(run); run.seg = null;
  run.min = Math.max(1, Math.round(run.acum / J_MS));
  run.fase = "cierre";
  save(); jPintarControles(); jAbrirHoja("cierre");
}
/* ---- Abandonar es UN toque, y se puede deshacer ----
   En la 0.7.101 pedía dos toques («Otra vez para abandonar»), y el rótulo ni
   cabía en el botón: se partía en dos líneas. Eduardo pidió quitar la segunda
   confirmación. Lo que protege del toque sin querer ya no es preguntar, es el
   «Deshacer» del aviso: devuelve el tramo tal cual, en pausa. */
let jDeshacer = null;
function jAbandonar() {
  const j = jDatos(), run = j.run; if (!run) return;
  const r = jRef(run.ref);
  const entrada = { id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: run.ref, nombre: r ? r.nombre : tx("Sin vincular"),
    min: Math.floor(jTrans(run) / J_MS), pausas: run.pausas, animo: 0, res: tx("Abandonado · sin XP"), abandono: true, bloque: run.bloque || null };
  j.registro.unshift(entrada);
  jDeshacer = { run: JSON.parse(JSON.stringify(run)), id: entrada.id, en: Date.now() };
  j.run = null; jEleccion = undefined;
  save(); jPintar();
  toast(tx("Tramo abandonado"), "deshecho", { label: tx("Deshacer"), onclick: "jDeshacerAbandono()" });
}
function jDeshacerAbandono() {
  const d = jDeshacer, j = jDatos();
  if (!d || j.run) return;
  jDeshacer = null;
  j.registro = j.registro.filter(x => x.id !== d.id);
  /* Vuelve en PAUSA: el rato que pasaste decidiendo no es foco. */
  const run = d.run;
  if (run.seg) { run.acum = (run.acum || 0) + (d.en - run.seg); run.seg = null; }
  j.run = run;
  save(); jPintar();
  toast(tx("El tramo sigue, en pausa"), "hecho");
}

/* ---------- Hiperfoco: tres maneras (0.7.105) ----------
   Lo pidió Eduardo al probar el modo rápido: que también tuviera intervalos,
   con tres opciones —una normal, una «hardcore» sin descanso y una «zen» sin
   trabajo—, cada una con otro nombre y un lápiz para cambiárselo.

     travesia   foco y descanso alternados, por rondas
     inmersion  solo foco, de corrido
     respiro    solo descanso: nada que hacer, solo parar

   Los nombres son los de la casa —la expedición—, pero son de quien los usa:
   `cfg.hfNombres` guarda el que haya puesto, y vacío vuelve al de siempre.
   Los rótulos se traducen donde se dibujan, igual que los descansos. */
const J_HF = {
  travesia:  { nombre: "Travesía",  verbo: "Enfocar" },
  inmersion: { nombre: "Inmersión", verbo: "Sumergirme" },
  respiro:   { nombre: "Respiro",   verbo: "Respirar" }
};
function jHfCfg() {
  const c = jDatos().cfg;
  /* En su sitio, igual que `jDatos`: reemplazar `c.hf` en cada llamada dejaba
     huérfano a quien tuviera en la mano el de antes. */
  if (!c.hf || typeof c.hf !== "object") c.hf = {};
  const porDefecto = { travesia: { foco: 25, desc: 5, rondas: 4 }, inmersion: { foco: 50 }, respiro: { desc: 10 } };
  for (const m in porDefecto) {
    if (!c.hf[m] || typeof c.hf[m] !== "object") c.hf[m] = {};
    for (const p in porDefecto[m]) if (typeof c.hf[m][p] !== "number") c.hf[m][p] = porDefecto[m][p];
  }
  if (!J_HF[c.hfModo]) c.hfModo = "travesia";
  if (!c.hfNombres || typeof c.hfNombres !== "object") c.hfNombres = {};
  return c;
}
function jHfNombre(k) {
  const c = jDatos().cfg;
  return (c.hfNombres && c.hfNombres[k]) || tx((J_HF[k] || J_HF.travesia).nombre);
}
function jHfResumen(k) {
  const h = jHfCfg().hf[k];
  if (k === "travesia") return T`${h.foco} / ${h.desc} min · ${h.rondas} rondas`;
  if (k === "inmersion") return T`${h.foco} min sin pausa`;
  return T`${h.desc} min de calma`;
}

function jIniciarLite() {
  jAudio(); jPedirPermiso();
  const c = jHfCfg(), k = c.hfModo, h = c.hf[k], j = jDatos();
  const base = { lite: true, modo: k, tramo: 1, acum: 0, seg: Date.now(), pausas: 0, ref: null, bloque: null,
    origen: jEsteDispositivo(), fid: uid(), reloj: jTipoReloj(k === "respiro" ? h.desc : h.foco) };
  j.run = k === "respiro"
    ? Object.assign(base, { fase: "descanso", dur: h.desc * J_MS })
    : Object.assign(base, { fase: "foco", dur: h.foco * J_MS, rondas: k === "travesia" ? h.rondas : 1 });
  save(); jPintar();
}
/* Lo que se hizo en Hiperfoco queda en el registro sin vincular: no da XP
   —no está atado a nada que la reciba— pero cuenta como foco en el informe,
   con el nombre del modo, que es lo que agrupa «¿En qué pusiste el foco?». */
function jApuntarLite(min, pausas, modo) {
  if (min < 1) return;
  const j = jDatos(), nombre = jHfNombre(modo || "travesia");
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: null, nombre,
    min, pausas: pausas || 0, animo: 0, res: tx("Hiperfoco"), lite: true, modo: modo || "travesia" });
  j.registro = j.registro.slice(0, J_REG_MAX);
}
/* Un Respiro se apunta aparte (`tipo: "respiro"`): es descanso a propósito,
   y el informe no lo cuenta como foco. */
function jApuntarRespiro(min) {
  if (min < 1) return;
  const j = jDatos();
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: null, nombre: jHfNombre("respiro"), min, tipo: "respiro" });
  j.registro = j.registro.slice(0, J_REG_MAX);
}
/* Parar guarda lo hecho y ya: aquí no hay «abandonar», porque no hay nada que
   cumplir. Diez minutos de hiperfoco son diez minutos. */
function jPararLite() {
  const j = jDatos(), run = j.run; if (!run) return;
  const min = Math.floor(jTrans(run) / J_MS);
  const respiro = run.modo === "respiro";
  if (run.fase === "foco") jApuntarLite(min, run.pausas, run.modo);
  else if (run.fase === "descanso" && respiro) jApuntarRespiro(min);
  j.run = null;
  save(); jPintar();
  if (run.fase === "foco" || respiro) {
    toast(min < 1 ? tx("Menos de un minuto: no queda apuntado")
      : respiro ? T`${min} min de respiro apuntados` : T`${min} min de hiperfoco apuntados`, min >= 1 ? "logro" : "calma");
  }
}
/* Saltar el descanso de una Travesía es pasar ya a la ronda siguiente. */
function jSaltarLite() {
  const j = jDatos(), run = j.run; if (!run) return;
  if (run.modo === "respiro") return jPararLite();
  const h = jHfCfg().hf.travesia;
  Object.assign(run, { fase: "foco", tramo: run.tramo + 1, dur: h.foco * J_MS, acum: 0, seg: Date.now(), pausas: 0, fid: uid() });
  save(); jPintar();
}

/* ---- Reiniciar la fase y saltar lo que queda (0.7.107.3) ----
   Las dos salidas que aparecen al pausar en Hiperfoco.

   **Reiniciar** pone la fase a cero y la deja CORRIENDO: quien la reinicia
   quiere volver a empezar ahora, no volver a tocar Seguir. Se lleva por delante
   los minutos que iban —y eso es lo que se está pidiendo—, así que el `fid`
   cambia: es la marca de «esta fase es otra» y sin ella la campana del final
   creería que ya sonó.

   **Saltar** no regala tiempo. Termina la fase AQUÍ, poniéndole a `dur` lo que
   de verdad se llevaba trabajado, y deja que `jFinFase` haga lo de siempre: así
   el registro apunta los minutos reales y no los que se pensaban hacer, y la
   Travesía sigue a su descanso sin saber que pasó nada raro. Un botón que
   apuntara la fase entera por saltarla sería una manera de mentirle al informe,
   que es lo único que este módulo tiene que cuidar. */
function jReiniciarFaseLite() {
  const run = jDatos().run; if (!run || !run.lite) return;
  Object.assign(run, { acum: 0, seg: Date.now(), pausas: 0, fid: uid() });
  save(); jPintar();
  toast(tx("La fase vuelve a empezar"), "hecho");
}
function jSaltarFaseLite() {
  const run = jDatos().run; if (!run || !run.lite) return;
  run.acum = jTrans(run); run.seg = null;
  run.dur = Math.max(0, run.acum);
  save();
  jFinFase();
}

/* ---------- Dormir y despertar ---------- */
function jBuenasNoches() {
  const j = jDatos(), b = jBloqueEn(jAhora());
  j.dormido = { inicio: Date.now(), bloque: b && b.descanso === "dormir" ? b.id : null };
  save(); jModoDormir(); jPintar();
  toast(tx("Que descanses. Al despertar, toca «Buenos días»."), "calma");
}
function jBuenosDias(desde) {
  const j = jDatos(), d = j.dormido;
  if (!d) return;
  const min = Math.max(1, Math.round((Date.now() - d.inicio) / J_MS));
  j.registro.unshift({ id: uid(), fecha: todayKey(), tipo: "sueno", inicio: d.inicio, fin: Date.now(), min, bloque: d.bloque });
  j.registro = j.registro.slice(0, J_REG_MAX);
  j.dormido = null;
  save(); jAmanecer(desde); jPintar();
  toast(T`Buenos días · dormiste ${jFmtDur(min)}`, "logro");
}
/* Media hora antes de dormir. Una vez por noche y por bloque: la marca lleva
   el día, así que mañana vuelve a avisar. */
function jAvisoSueno() {
  const j = jDatos();
  if (j.dormido) return;
  const m = jAhora(), hoy = todayKey();
  for (const b of jBloquesHoy()) {
    if (b.descanso !== "dormir") continue;
    const falta = (b.ini - m + J_DIA) % J_DIA;
    if (falta <= 0 || falta > 30) continue;
    const clave = hoy + "|" + b.id;
    if (j.avisoSueno === clave) continue;
    j.avisoSueno = clave;
    save();
    jAvisar(T`En ${Math.ceil(falta)} min toca dormir`, T`Tu bloque de dormir empieza a las ${jH12(b.ini)}.`, "sueno|" + clave);
  }
}

/* ---------- Lo planeado contra lo hecho (0.7.104) ----------
   La rueda es una plantilla que se repite cada día, así que «cuántos bloques
   tenía el martes» no se puede reconstruir después: si hoy la cambias, el
   martes pasado cambiaría con ella. Por eso se APUNTA, un número por día —los
   bloques de enfoque, sin los descansos— y el informe lo cruza con los bloques
   que de verdad tuvieron un tramo. Solo se guarda cuando el número cambia. */
function jApuntarPlan() {
  const j = jDatos(), hoy = todayKey();
  const n = jBloquesHoy().filter(b => !b.descanso).length;
  if (!j.planes || typeof j.planes !== "object") j.planes = {};
  if (j.planes[hoy] === n) return;
  j.planes[hoy] = n;
  const ks = Object.keys(j.planes).sort();
  while (ks.length > 400) delete j.planes[ks.shift()];
  save();
}
function jPlanDeHoy() {
  const j = jDatos(), hoy = todayKey();
  const enfoque = jBloquesHoy().filter(b => !b.descanso);
  const conFoco = new Set();
  j.registro.forEach(r => { if (r.fecha === hoy && r.bloque && !r.abandono && r.tipo !== "sueno") conFoco.add(r.bloque); });
  return { plan: enfoque.length, hechos: enfoque.filter(b => conFoco.has(b.id)).length };
}

/* ---------- Lo que pasa al guardar un tramo ---------- */
/* La tarifa del registro manual (`PRACTICAS`, js/06-detalle.js): 40 XP la hora
   y un extra pequeño por sostenerlo. Un tramo de 25 minutos da 17. */
const jXp = min => min <= 60 ? Math.round(min * 40 / 60) : Math.round(40 + (min - 60) * 45 / 60);
const jNivelPractica = min => min < 45 ? "suave" : min < 105 ? "moderada" : "intensiva";
/* El origen que se guarda en el historial de la habilidad. SIN traducir, a
   propósito: `familiaDeFuente` lo reconoce por cómo empieza, y en inglés
   «Pomodoro» se escribe igual. */
const jFuente = nombre => "Pomodoro · " + nombre;

function jEfecto(ref, min, terminada) {
  const r = jRef(ref);
  if (!r) return { t: tx("Queda en tu registro"), s: tx("Sin tocar ningún módulo.") };
  if (r.t === "mision") {
    const m = r.o, hoy = todayKey();
    if (missionDone(m, hoy)) return { t: T`${min} min de foco en «${m.name}»`, s: tx("La misión ya estaba cumplida hoy.") };
    if (terminada) {
      /* Se cumple en Misiones —cuenta para la racha y su informe— y su XP va
         a nombre del Pomodoro. Lo pidió Eduardo así: que se tache como
         terminada y que el mérito sea del Pomodoro. Y solo si lo confirmaste:
         que se acabe el tiempo no quiere decir que se acabara la actividad. */
      return {
        t: tx("Misión cumplida"),
        s: m.skillId && m.xp ? T`Y su habilidad recibe ${m.xp} XP, a nombre del Pomodoro.` : T`Con ${min} min de foco.`,
        propio: true, terminada: true,
        hacer: () => logMission(m.id, missionTarget(m) - missionCount(m, hoy), { fuente: jFuente(m.name) })
      };
    }
    return { t: T`${min} min de foco apuntados`, s: tx("La misión sigue abierta.") };
  }
  const s = r.t === "habilidad" ? r.o : (r.o.skillId ? (state.skills || []).find(x => x.id === r.o.skillId) : null);
  if (!s) return { t: T`${min} min de foco apuntados`, s: tx("Queda en tu registro del Pomodoro.") };
  /* Los mismos dos topes que el registro manual: medio día por habilidad y
     medio día sumando todas. Por encima el número deja de decir lo que pasó. */
  const libre = Math.min(TOPE_MIN_DIA - minutosHoy(s), TOPE_MIN_DIA - minutosHoyGlobal());
  const cuenta = Math.max(0, Math.min(min, libre));
  const xp = jXp(cuenta);
  if (!xp) return { t: T`${min} min de foco apuntados`, s: tx("Ya llegaste al tope de práctica de hoy.") };
  return {
    t: T`+${xp} XP a ${s.name}`,
    s: r.t === "habilidad" ? tx("Cuenta como práctica de hoy: no baja.") : T`Por «${r.nombre}», que la entrena.`,
    skill: s,
    hacer: () => addXp(s, xp, T`Enfoque: ${r.nombre}`, jFuente(r.nombre), { min: cuenta, nivel: jNivelPractica(cuenta) })
  };
}

let jRespuesta = "no", jAnimo = 2;
function jGuardar(descansar) {
  const j = jDatos(), run = j.run;
  if (!run || run.fase !== "cierre") return;
  const ef = jEfecto(run.ref, run.min, jRespuesta === "si");
  const antes = ef.skill ? levelInfo(ef.skill.xp).level : null;
  if (ef.hacer) ef.hacer();
  const r = jRef(run.ref);
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: run.ref, nombre: r ? r.nombre : tx("Sin vincular"),
    min: run.min, pausas: run.pausas, animo: jAnimo, res: ef.t, bloque: run.bloque || null, terminada: !!ef.terminada });
  j.registro = j.registro.slice(0, J_REG_MAX);
  const ultimo = !run.libre && run.tramo >= j.cfg.ciclos;
  if (run.libre || ultimo) { j.run = null; jEleccion = undefined; }
  else if (descansar) Object.assign(run, { fase: "descanso", dur: j.cfg.desc * J_MS, acum: 0, seg: Date.now(), fid: uid() });
  else Object.assign(run, { fase: "listo", tramo: run.tramo + 1, dur: j.cfg.foco * J_MS, acum: 0, seg: null, pausas: 0 });
  save();
  cerrarHojaJornada();
  if (!ultimo && !descansar && j.run && j.cfg.auto) jIniciar();
  if (typeof checkStreakMilestone === "function") checkStreakMilestone();
  if (typeof revisarNivelExpedicion === "function") revisarNivelExpedicion();
  if (ef.skill && levelInfo(ef.skill.xp).level > antes) {
    celebrate(T`Nivel ${levelInfo(ef.skill.xp).level}`, T`${ef.skill.name} sube de nivel`, ef.skill.color, ef.skill.icon);
  } else if (!ef.propio) {
    toast(ultimo ? T`${ef.t} · terminaste los ${j.cfg.ciclos} tramos` : ef.t, "logro");
  }
  jPintar();
}

/* ---------- La rueda ---------- */
function jPt(r, m) { const a = m / J_DIA * Math.PI * 2; return [J_C + r * Math.sin(a), J_C - r * Math.cos(a)]; }
function jArco(ini, d) {
  const large = d > 720 ? 1 : 0;
  const [x1, y1] = jPt(J_RO, ini), [x2, y2] = jPt(J_RO, ini + d), [x3, y3] = jPt(J_RI, ini + d), [x4, y4] = jPt(J_RI, ini);
  return `M${x1} ${y1}A${J_RO} ${J_RO} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${J_RI} ${J_RI} 0 ${large} 0 ${x4} ${y4}Z`;
}
/* Una línea curva suelta: el hilo de guía y el arco de lo que va del día. */
function jArcoLinea(r, ini, fin) {
  const d = ((fin - ini + J_DIA) % J_DIA) || J_DIA;
  const [x1, y1] = jPt(r, ini), [x2, y2] = jPt(r, fin);
  return `M${x1} ${y1}A${r} ${r} 0 ${d > 720 ? 1 : 0} 1 ${x2} ${y2}`;
}
/* ---- El gajo, con las cuatro esquinas redondeadas (0.7.114) ----
   El mismo gajo de siempre: mismo ancho, mismos radios, solo sin el pico. Con
   `k` en 0 sale exactamente el de antes. Ni punta redonda entera —dos vecinos
   dejaban una junta blanda y no se veía dónde acababa uno— ni filo, que picaba
   de más; Eduardo lo afinó en el boceto y se quedó en 7.
   El radio de la esquina se mide en el arco, así que un gajo corto lo recorta
   solo: si no cabe, se dibuja el gajo de siempre. */
const J_ESQ = 7;
function jGajo(ini, d, rIn, rOut, k) {
  rIn = rIn || J_RI; rOut = rOut || J_RO;
  k = Math.min(k === undefined ? J_ESQ : k, (rOut - rIn) / 2 - 0.5, ((d / J_DIA) * 2 * Math.PI * rIn) / 2 - 0.5);
  const t1 = ini / J_DIA * Math.PI * 2, t2 = (ini + d) / J_DIA * Math.PI * 2;
  const P = (r, t) => `${(J_C + r * Math.sin(t)).toFixed(2)} ${(J_C - r * Math.cos(t)).toFixed(2)}`;
  const A = (r, l, s, x) => `A${r.toFixed(2)} ${r.toFixed(2)} 0 ${l} ${s} ${x}`;
  const grande = d > 720 ? 1 : 0;
  if (k <= 1) return `M${P(rOut, t1)}${A(rOut, grande, 1, P(rOut, t2))}L${P(rIn, t2)}${A(rIn, grande, 0, P(rIn, t1))}Z`;
  const dO = k / rOut, dI = k / rIn;
  return `M${P(rOut, t1 + dO)}` +
    A(rOut, (t2 - t1 - 2 * dO) > Math.PI ? 1 : 0, 1, P(rOut, t2 - dO)) +
    A(k, 0, 1, P(rOut - k, t2)) + `L${P(rIn + k, t2)}` +
    A(k, 0, 1, P(rIn, t2 - dI)) +
    A(rIn, (t2 - t1 - 2 * dI) > Math.PI ? 1 : 0, 0, P(rIn, t1 + dI)) +
    A(k, 0, 1, P(rIn + k, t1)) + `L${P(rOut - k, t1)}` +
    A(k, 0, 1, P(rOut, t1 + dO)) + "Z";
}
/* El borde de un gajo es SU color muy atenuado, no el fondo: con el fondo por
   borde, lo que está pasando ahora parecía recortado con tijeras. Sigue
   separando a dos vecinos, porque cada uno trae el suyo. */
const jBordeBloque = col => `color-mix(in srgb, ${col} 42%, var(--jor-sep))`;
/* El asa: una barrita delgada cruzada sobre el aro. Se VE fina y se AGARRA
   ancho —el rectángulo transparente de detrás mide 34×46—, así que el dibujo
   no tiene que engordar para que se atine con el dedo. */
function jAsaHTML(k, min) {
  const [x, y] = jPt(J_RM, min);
  /* DOS grupos, y esto no es adorno: el de fuera lleva el `transform` del SVG
     —dónde va el asa— y el de dentro es el que se anima. Con los dos en el
     mismo elemento, el `transform` del CSS PISA al del atributo y el asa se
     dibujaba un instante en la esquina de arriba a la izquierda, que es el
     origen del lienzo. Lo cazó Eduardo en la 0.7.114. */
  return `<g data-h="${k}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(min / J_DIA * 360).toFixed(2)})">
    <g class="jor-asa-g"><rect x="-17" y="-23" width="34" height="46" fill="transparent"/>
    <rect class="jor-asa" x="-3.5" y="-14" width="7" height="28" rx="3"/></g></g>`;
}
/* El fondo del aro NO se pinta (0.7.114): era una rosquilla gris llena aunque
   el día estuviera vacío, y lo que se tiene que ver es TU día. En su lugar,
   dos hilos de guía que enmarcan por dónde va el aro y los puntos de las
   medias horas. Lo de fuera —marcas de hora, números, aguja— no se toca. */
function jBaseRueda() {
  /* La malla diagonal que tapa lo que está ocupado. Se declara aquí porque las
     dos ruedas —la grande y la de la hoja— salen de esta misma base; las dos
     copias son idénticas, así que da igual cuál resuelva el `url(#…)`. */
  let h = `<defs><pattern id="jor-veda" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
      <rect class="jor-veda-fondo" width="9" height="9"/>
      <line class="jor-veda-raya" x1="0" y1="0" x2="0" y2="9"/></pattern></defs>`;
  h += `<circle class="jor-guia" cx="${J_C}" cy="${J_C}" r="${J_RI - 3}"/><circle class="jor-guia" cx="${J_C}" cy="${J_C}" r="${J_RO + 2}"/>`;
  for (let i = 1; i < 48; i += 2) {
    const [x, y] = jPt(J_RI - 3, i * 30);
    h += `<circle class="jor-media" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.1"/>`;
  }
  for (let i = 0; i < 24; i++) {
    const mayor = i % 6 === 0;
    const [x1, y1] = jPt(J_RO + 3, i * 60), [x2, y2] = jPt(J_RO + (mayor ? 10 : 6), i * 60);
    h += `<line class="jor-tick${mayor ? " mayor" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for (let i = 0; i < 24; i += 2) {
    const mayor = i % 6 === 0;
    const txt = mayor ? `${i % 12 || 12} ${i < 12 ? "AM" : "PM"}` : String(i % 12 || 12);
    const [x, y] = jPt(J_RO + 22, i * 60);
    h += `<text class="jor-num${mayor ? " mayor" : ""}" x="${x}" y="${y}">${txt}</text>`;
  }
  return h;
}

let jSelId = null;
/* El bloque que va en el aire ahora mismo. Se pinta el ÚLTIMO —en SVG no hay
   z-index, manda el orden— o pasaría por DEBAJO de lo que está cruzando. */
let jVolando = null;
/* A qué hora caería si lo soltaras aquí: el mismo sitio, o el hueco libre más
   cercano. Se calcula en cada paso del arrastre y se dibuja punteado. */
let jDestino = null;
function jPintarRueda() {
  const g = document.getElementById("jor-bloques-svg");
  if (!g) return;
  let h = "";
  const ahora = jAhora();
  /* Lo que va del día, en un hilo por dentro del aro. */
  if (ahora > 0) h += `<path class="jor-transcurrido" d="${jArcoLinea(J_RI - 8, 0, ahora)}"/>`;
  /* Y el hueco al que caería lo que llevas en la mano, dibujado entero. */
  if (jDestino != null && jVolando) {
    const v = jBloques().find(x => x.id === jVolando);
    if (v) h += `<path class="jor-destino" d="${jGajo(jDestino, jDur(v), J_RI + 2, J_RO - 2)}" style="fill:${jColorBloque(v)};fill-opacity:.2"/>`;
  }
  const enMano = jVolando ? jBloques().find(x => x.id === jVolando) : null;
  const pisando = enMano ? jChoca(enMano.ini, enMano.fin, enMano.id) : null;
  const bloques = jVolando
    ? [...jBloques()].sort((x, y) => (x.id === jVolando) - (y.id === jVolando))
    : jBloques();
  for (const b of bloques) {
    const d = jDur(b), col = jColorBloque(b);
    /* El gajo en curso BRILLA con su propio color (0.7.105), con el mismo halo
       que `.barra-viva` en lo lleno. Solo la luz: el dibujo no cambia. El color
       entra por una variable y el halo no se anima —animado, Chrome lo deja
       congelado—, y de día se apaga en el CSS, como todos los halos. */
    const enCurso = jDiaVisto() === jHoy() && jDentro(b, ahora);
    /* En coral y con el trazo cortado solo mientras lo arrastras por encima de
       otro: ahí no se queda tal cual, al soltarlo se irá al hueco más cercano. */
    const vuela = b.id === jVolando, encima = vuela && !!jChoca(b.ini, b.fin, b.id);
    /* Pisando a otro, el gajo SALE del aro a la órbita de fuera: dos bloques
       no pueden encimarse, y verlo levantado lo dice antes de soltarlo. Y el
       que está DEBAJO lo dice también, en coral y con el borde cortado —si no,
       se ve que algo pasa pero no con qué—; el resto del día se apaga un poco
       para que los dos protagonistas se lean solos. */
    const bloqueado = !vuela && !!enMano && jSolapan(b, enMano);
    const apagado = !vuela && !!enMano && !bloqueado && !!pisando;
    const rIn = encima ? J_RO + 6 : J_RI, rOut = encima ? J_RO + 30 : J_RO;
    const rm = (rIn + rOut) / 2;
    const camino = jGajo(b.ini, d, rIn, rOut);
    h += `<path class="jor-blq${b.id === jSelId ? " sel" : ""}${enCurso ? " ahora" : ""}${vuela ? " volando" : ""}${encima ? " orbita" : ""}${bloqueado ? " bloqueado" : ""}${apagado ? " apagado" : ""}" data-id="${b.id}" d="${camino}" style="fill:${col};--jor-brillo:${col};--jor-borde:${jBordeBloque(col)}"/>`;
    if (bloqueado) h += `<path class="jor-veda" d="${camino}"/>`;
    if (d >= 60 || bloqueado) {
      const [x, y] = jPt(rm, b.ini + d / 2);
      h += `<svg class="jor-blq-ic${bloqueado ? " vedado" : b.descanso && !b.color ? " descanso" : ""}" x="${x - 8}" y="${y - 8}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${bloqueado ? J_PROHIBIDO : jIconoBloque(b)}</svg>`;
    }
  }
  g.innerHTML = h;
  const svg = document.getElementById("jor-svg");
  if (svg) svg.classList.toggle("jor-quieta", !!jQuieta());
  const s = (jQuieta() || jVolando) ? null : jBloques().find(b => b.id === jSelId);
  document.getElementById("jor-asas").innerHTML = s ? jAsaHTML("ini", s.ini) + jAsaHTML("fin", s.fin) : "";
}
function jPintarAguja() {
  const a = document.getElementById("jor-aguja");
  /* La aguja es de HOY: en otro día no señala nada y engañaría. */
  if (a) a.hidden = jDiaVisto() !== jHoy();
  if (a) a.setAttribute("transform", `rotate(${jAhora() / J_DIA * 360} ${J_C} ${J_C})`);
}

/* ---------- Arrastrar en la rueda ---------- */
function jMinEn(svg, e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse());
  let a = Math.atan2(q.x - J_C, -(q.y - J_C)); if (a < 0) a += Math.PI * 2;
  return a / (Math.PI * 2) * J_DIA;
}
/* Los vecinos se miran UNA vez, al empezar a estirar una punta: al alargar un
   bloque no se le puede comer al de al lado, así que durante el arrastre no
   cambian. Mover el bloque ENTERO ya no los mira (0.7.109): vuela libre. */
function jVecinos(b) {
  /* Por id además de por identidad: el borrador de la hoja tiene el id de un
     bloque guardado pero es otro objeto, y sin esto sería su propio vecino. */
  const otros = jBloques().filter(o => o !== b && o.id !== b.id);
  let prev = null, next = null, dp = 1e9, dn = 1e9;
  for (const o of otros) {
    const n = (o.ini - b.ini + J_DIA) % J_DIA; if (n > 0 && n < dn) { dn = n; next = o; }
    const p = (b.ini - o.ini + J_DIA) % J_DIA; if (p > 0 && p < dp) { dp = p; prev = o; }
  }
  return prev && next ? { prevFin: prev.fin, nextIni: next.ini } : null;
}
/* Si lo pedido se sale del hueco, se queda en la orilla más cercana. */
function jAcotar(off, lo, hi) {
  if (off >= lo && off <= hi) return off;
  const aHi = ((off - hi) % J_DIA + J_DIA) % J_DIA, aLo = ((lo - off) % J_DIA + J_DIA) % J_DIA;
  return aHi < aLo ? hi : lo;
}
function jMoverIni(b, m, v) {
  const base = v ? v.prevFin : b.fin;
  const hi = ((b.fin - 15) - base + 2 * J_DIA) % J_DIA;
  return (base + jAcotar((m - base + J_DIA) % J_DIA, v ? 0 : 15, hi)) % J_DIA;
}
function jMoverFin(b, m, v) {
  const maxD = v ? (((v.nextIni - b.ini + J_DIA) % J_DIA) || J_DIA) : J_DIA - 15;
  return (b.ini + jAcotar((m - b.ini + J_DIA) % J_DIA, 15, maxD)) % J_DIA;
}
/* ---- Pasar por encima de otro bloque (0.7.109) ----
   Hasta la 0.7.108 un bloque arrastrado se quedaba pegado a su vecino: para
   llevar algo al otro lado de la rueda había que mover antes todo lo que
   hubiera en medio. «Parecen muros y no permiten reorganizar el orden de las
   cosas», dijo Eduardo. Ahora vuela libre y la cuenta se hace al SOLTARLO, que
   es cuando de verdad hay que decidir dónde queda:

     sitio libre    -> se queda donde lo soltaste
     sitio ocupado  -> al hueco libre más cercano, hacia el lado que sea
     sin hueco      -> vuelve a donde estaba, y se dice por qué

   Volver atrás es mejor que dejarlo encima de otro: dos bloques a la misma
   hora no son un día, son un dato roto que alguien tendrá que adivinar. */
function jHuecoCerca(ini, d, id) {
  for (let off = 0; off <= J_DIA / 2; off += 15) {
    for (const s of (off ? [1, -1] : [1])) {
      const c = (ini + s * off + J_DIA) % J_DIA;
      if (!jChoca(c, (c + d) % J_DIA, id)) return c;
    }
  }
  return null;
}
function jAterrizar(b, ini0) {
  const pisado = jChoca(b.ini, b.fin, b.id);
  if (!pisado) return;
  const d = jDur(b), c = jHuecoCerca(b.ini, d, b.id);
  /* El aro ya lo dijo con el color mientras arrastrabas; lo que pasó con TU
     bloque se cuenta en palabras: con qué chocaste, qué se hizo y dónde quedó. */
  if (c == null) {
    b.ini = ini0; b.fin = (ini0 + d) % J_DIA;
    toast(T`«${jNombreBloque(pisado)}» ya ocupa esa hora, y no hay ningún hueco de ${jFmtDur(d)} libre. Tu bloque volvió a las ${jH12(ini0)}.`, "atencion");
    return;
  }
  b.ini = c; b.fin = (c + d) % J_DIA;
  toast(T`«${jNombreBloque(pisado)}» ya ocupa esa hora. Tu bloque se acomodó en el hueco libre de las ${jH12(c)}.`, "atencion");
}
function jEngancharRueda(svg) {
  let arr = null;
  svg.addEventListener("pointerdown", e => {
    const asa = e.target.closest("[data-h]"), p = e.target.closest(".jor-blq");
    const bloques = jBloques();
    const s = bloques.find(b => b.id === jSelId);
    const quieta = jQuieta();
    if (quieta && (asa || p)) {
      /* Se dice por qué en el momento de intentarlo, que es cuando la pregunta
         existe. Con un tramo en curso el bloque sí se puede elegir y abrir. */
      if (quieta.todo || asa || !p) { toast(quieta.txt, "atencion"); return; }
      const b = bloques.find(x => x.id === p.dataset.id);
      if (!b) return;
      if (jSelId === b.id) jAbrirBloque(b.id);
      else { jSelId = b.id; jPintarRueda(); jPintarLista(); }
      return;
    }
    if (asa && s) {
      arr = { modo: asa.dataset.h, b: s, v: jVecinos(s), x: e.clientX, y: e.clientY, movido: false };
    } else if (p) {
      const b = bloques.find(x => x.id === p.dataset.id);
      if (!b) return;
      const ya = jSelId === b.id;
      jSelId = b.id;
      arr = { modo: "todo", b, v: jVecinos(b), m0: jMinEn(svg, e), ini0: b.ini, x: e.clientX, y: e.clientY, movido: false, ya };
      jVolando = b.id;
      jPintarRueda(); jPintarLista();
    } else {
      if (jSelId) { jSelId = null; jPintarRueda(); jPintarLista(); }
      return;
    }
    try { svg.setPointerCapture(e.pointerId); } catch (x) { /* sin captura, sigue igual */ }
    e.preventDefault();
  });
  svg.addEventListener("pointermove", e => {
    if (!arr) return;
    if (!arr.movido && Math.hypot(e.clientX - arr.x, e.clientY - arr.y) < 6) return;
    arr.movido = true;
    const { b, v } = arr, m = jSnap(jMinEn(svg, e));
    if (arr.modo === "ini") b.ini = jMoverIni(b, m, v);
    else if (arr.modo === "fin") b.fin = jMoverFin(b, m, v);
    else {
      const d = jDur(b);
      const delta = ((jMinEn(svg, e) - arr.m0 + 720) % J_DIA + J_DIA) % J_DIA - 720;
      const ini = jSnap(arr.ini0 + delta);
      b.ini = ini; b.fin = (ini + d) % J_DIA;
      jDestino = jChoca(b.ini, b.fin, b.id) ? jHuecoCerca(b.ini, d, b.id) : null;
    }
    jPintarRueda(); jPintarLista();
  });
  const soltar = () => {
    if (!arr) return;
    const a = arr; arr = null; jVolando = null; jDestino = null;
    if (a.movido && a.modo === "todo") jAterrizar(a.b, a.ini0);
    if (a.movido) save();
    else if (a.modo === "todo" && a.ya) jAbrirBloque(a.b.id);
    jPintar();
  };
  svg.addEventListener("pointerup", soltar);
  svg.addEventListener("pointercancel", soltar);
}

/* ---------- Choques ---------- */
const jSolapan = (a, b) => jDentro(a, b.ini) || jDentro(b, a.ini);
function jChocaEn(bloques, ini, fin, exceptoId) {
  const t = { ini, fin };
  return bloques.find(o => o.id !== exceptoId && (jDentro(o, ini) || jDentro(t, o.ini))) || null;
}
function jChoca(ini, fin, exceptoId) { return jChocaEn(jBloques(), ini, fin, exceptoId); }
/* Acomodar: lo pone en el primer hueco libre desde ahora, de una hora si cabe. */
function jAcomodar(t, id) {
  const q = jQuieta();
  if (q && q.todo) { toast(q.txt, "atencion"); return; }
  const desde = Math.ceil(jAhora() / 15) * 15;
  /* Si la actividad dice cuánto dura, ESE es el primer tamaño que se prueba.
     Los de siempre quedan detrás, por si no cabe. */
  const r = jRef({ t, id });
  const suya = r ? jMinutosDeNombre(r.nombre) : null;
  const tamanos = suya ? [suya, 60, 45, 30, 15].filter((x, i, a) => a.indexOf(x) === i) : [60, 45, 30, 15];
  for (const d of tamanos) {
    for (let s = 0; s < J_DIA; s += 15) {
      const ini = (desde + s) % J_DIA, fin = (ini + d) % J_DIA;
      if (!jChoca(ini, fin, null)) {
        const b = { id: uid(), ref: { t, id }, ini, fin };
        jBloques().push(b); jSelId = b.id;
        save(); jApuntarPlan(); jPintar();
        return;
      }
    }
  }
  toast(tx("La rueda está llena: quita o acorta un bloque"), "atencion");
}

/* ---------- La pantalla ---------- */
/* ---------- Tres relojes, según el tiempo (0.7.106) ----------
   El reloj que se ve depende del tiempo elegido ANTES de iniciar: poco tiempo,
   uno pequeño; mucho, el Monumental. Lo pidió Eduardo —«si un usuario elige
   mucho tiempo, que tenga un reloj distinto y alusivo a tener más tiempo»— y
   con dos condiciones: que sea el mismo en el foco y en el descanso, y que no
   sea el mismo dibujo encogido. Eligió de dos tandas de bocetos (el Clásico de
   antes queda retirado):

     chico    15 min o menos   tapa lisa arriba y abajo
     mediano  de 20 a 45       dos columnas y pedestal de dos escalones
     grande   50 o más         el Monumental: arco con remate, cuatro
                               columnas torneadas, pedestal y escala

   ---- Los tres son SIMÉTRICOS respecto al cuello (0.7.108.1) ----
   Y eso no es una manía de dibujante: es lo que deja que al voltear gire el
   RELOJ ENTERO y no solo el vidrio. Media vuelta a un reloj con arco arriba y
   pedestal abajo lo deja apoyado del revés, así que hasta la 0.7.108 giraba
   solo el vidrio dentro de su pie. Eduardo lo vio al mirarlo de cerca —«no me
   había percatado de ese detalle»— y pidió los tres simétricos.

   La simetría no se escribe a mano, se dibuja UNA vez: cada reloj declara la
   mitad de ARRIBA (`cabAtras`, `cabDelante`) y `esp()` la copia abajo espejada
   sobre el cuello. Así no hay ninguna resta que pueda salir mal, y mover una
   tapa mueve las dos. Lo que ya era simétrico por su cuenta —los postes, las
   panzas de las columnas, las marcas de la escala— se queda en `atras` y
   `adelante` sin copiar.

   Qué cambió de los dibujos al hacerlos simétricos: el chico lleva su tapa
   arriba y abajo (antes la de abajo era más chica), el mediano lleva el
   pedestal de dos escalones en los dos extremos, y el Monumental su arco con
   remate arriba y abajo — y pierde la peana ancha del suelo, que era justo la
   pieza que no tenía pareja. Lo que los distingue entre sí no se toca. */
const J_RELOJES = (() => {
  function vidrio(cx, hw, y0, y1, pared) {
    const mid = (y0 + y1) / 2, n = 3.5, a = y0 + pared, b = y1 - pared, nt = mid - 4, nb = mid + 4;
    return {
      mid,
      todo: `M${cx - hw} ${y0} L${cx + hw} ${y0} L${cx + hw} ${a} L${cx + n} ${nt} L${cx + n} ${nb} L${cx + hw} ${b} L${cx + hw} ${y1} L${cx - hw} ${y1} L${cx - hw} ${b} L${cx - n} ${nb} L${cx - n} ${nt} L${cx - hw} ${a} Z`,
      arriba: `M${cx - hw} ${y0} L${cx + hw} ${y0} L${cx + hw} ${a} L${cx + n} ${nt} L${cx + n} ${mid} L${cx - n} ${mid} L${cx - n} ${nt} L${cx - hw} ${a} Z`,
      abajo: `M${cx - n} ${mid} L${cx + n} ${mid} L${cx + n} ${nb} L${cx + hw} ${b} L${cx + hw} ${y1} L${cx - hw} ${y1} L${cx - hw} ${b} L${cx - n} ${nb} Z`
    };
  }
  const pz = (x, y, w, h, r) => `<rect class="jor-madera" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const po = (x, y0, y1, grosor) => `<line class="jor-poste${grosor ? " " + grosor : ""}" x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
  /* El espejo sobre el cuello: `y' = 2·mid − y`. Una matriz y no dos traslados
     para que el trazo no cambie de grosor por el camino. */
  const esp = (mid, c) => c ? `<g transform="matrix(1 0 0 -1 0 ${2 * mid})">${c}</g>` : "";
  const def = o => {
    const v = vidrio(o.cx, o.hw, o.y0, o.y1, o.pared);
    return { vb: o.vb, cx: o.cx, hw: o.hw, y0: o.y0, y1: o.y1, v,
      atras: (o.atras || "") + (o.cabAtras || "") + esp(v.mid, o.cabAtras),
      adelante: (o.adelante || "") + (o.cabDelante || "") + esp(v.mid, o.cabDelante) };
  };
  return {
    /* Sin el escalón de abajo (0.7.106.3): con él, el pequeño y el mediano no
       se distinguían en nada —lo vio Eduardo poniéndolos lado a lado—. Se
       queda con una tapa lisa, y el pedestal de dos escalones es del mediano. */
    chico: def({ vb: "0 0 140 156", cx: 70, hw: 30, y0: 30, y1: 142, pared: 18,
      atras: po(32, 28, 144, "delgado") + po(108, 28, 144, "delgado"),
      cabDelante: pz(26, 16, 88, 14, 4) }),
    mediano: def({ vb: "0 0 170 240", cx: 85, hw: 36, y0: 34, y1: 206, pared: 28,
      atras: po(30, 32, 208) + po(140, 32, 208),
      cabDelante: pz(12, 8, 146, 14, 4) + pz(22, 22, 126, 12, 3) }),
    /* Menos adornos (0.7.108.2): con cuatro postes, seis torneados y la escala
       de rayas al costado, el grande se separaba demasiado de los otros dos
       —«se diferencia demasiado de los otros 2», dijo Eduardo—. Se queda con
       el arco y su remate, que es lo que le da el rango sin volverlo otro
       objeto. Con la escala se fue el último uso de `.jor-marca`. */
    grande: def({ vb: "0 0 200 300", cx: 100, hw: 38, y0: 40, y1: 260, pared: 64,
      atras: po(40, 38, 262) + po(160, 38, 262),
      cabAtras: `<circle class="jor-madera" cx="100" cy="7" r="5"/><path class="jor-madera" d="M40 28 Q100 -4 160 28 Z"/>`,
      cabDelante: pz(30, 26, 140, 13, 3) })
  };
})();
/* `min` son los minutos elegidos; sin límite (Libre) cuenta como mucho tiempo. */
function jTipoReloj(min) { return !min ? "grande" : min <= 15 ? "chico" : min >= 50 ? "grande" : "mediano"; }
/* El que toca ahora: el del tramo en curso —se apunta al empezar, y así no
   cambia entre el foco y el descanso—, o el de lo que está elegido. */
function jRelojActual() {
  const j = jDatos(), run = j.run;
  if (run && run.reloj) return run.reloj;
  if ((run && run.lite) || (!run && jModo() === "lite")) {
    const c = jHfCfg(), k = run ? (run.modo || "travesia") : c.hfModo, h = c.hf[k];
    return jTipoReloj(k === "respiro" ? h.desc : h.foco);
  }
  return jTipoReloj(j.cfg.preset === "libre" ? 0 : j.cfg.foco);
}
function jRelojHTML(tipo) {
  const t = J_RELOJES[tipo] ? tipo : "mediano", R = J_RELOJES[t], v = R.v, x = R.cx - R.hw - 2, w = R.hw * 2 + 4;
  return `
    <svg class="jor-arena t-${t}" id="jor-arena" data-tipo="${t}" viewBox="${R.vb}" aria-hidden="true">
      <defs>
        <clipPath id="jor-c-arriba"><path d="${v.arriba}"/></clipPath>
        <clipPath id="jor-c-abajo"><path d="${v.abajo}"/></clipPath>
      </defs>
      <g id="jor-giro" style="transform-origin:${R.cx}px ${v.mid}px">
        ${R.atras}
        <path class="jor-vidrio" d="${v.todo}"/>
        <g class="jor-arena-g">
          <rect id="jor-a-arriba" clip-path="url(#jor-c-arriba)" x="${x}" y="${R.y0}" width="${w}" height="${v.mid - R.y0}"/>
          <rect id="jor-a-abajo" clip-path="url(#jor-c-abajo)" x="${x}" y="${R.y1}" width="${w}" height="0"/>
          <line id="jor-chorro" x1="${R.cx}" y1="${v.mid}" x2="${R.cx}" y2="${R.y1 - 2}"/>
        </g>
        <path class="jor-vidrio-borde" d="${v.todo}"/>
        ${R.adelante}
      </g>
    </svg>`;
}
/* Si cambió el tiempo elegido —otro ritmo, otra manera del Hiperfoco—, cambia
   el reloj. Se rehace entero porque cada uno es otro dibujo. */
function jAsegurarReloj() {
  const el = document.getElementById("jor-arena");
  if (!el) return;
  const t = jRelojActual();
  if (el.dataset.tipo === t) return;
  el.outerHTML = jRelojHTML(t);
  jArribaAntes = 1; jVolteando = false;
}
/* ---- El banner del módulo (0.7.116) ----
   El Pomodoro era el único de los cinco sin banner, y por eso su puerta al
   informe acabó de botón suelto al final de la lista, que es donde nadie la
   busca. Ahora se lee como los demás: la cifra que resume, los cuatro
   indicadores comparables, lo que pide atención y el informe detrás del mismo
   botón que en el resto de la app. */
function jHeroHTML() {
  const j = jDatos(), plan = jPlanDeHoy();
  const pct = plan.plan ? Math.round(plan.hechos / plan.plan * 100) : 0;
  const hoyKey = todayKey();
  const min = (j.registro || []).reduce((t, r) => t + (r.fecha === hoyKey && !r.abandono && r.tipo !== "sueno" && r.tipo !== "respiro" ? (Number(r.min) || 0) : 0), 0);
  const ahora = jBloqueEn(jAhora()), sig = jSiguienteBloque();
  const foco = ahora
    ? { k: ahora.descanso ? tx("Ahora, descanso") : tx("Ahora toca"), v: jNombreBloque(ahora), color: ahora.descanso ? "var(--jor-brasa)" : "var(--mint)" }
    : (sig ? { k: tx("Lo siguiente"), v: T`${jNombreBloque(sig)} · ${jH12(sig.ini)}`, color: "var(--mint)" }
           : { k: tx("Nada a esta hora"), v: tx("Acomoda un bloque o enfoca sin vincular"), color: "var(--muted)" });
  return sectionHero({
    lead: `
      <div class="ring-wrap aro-tira">
        ${ring(92, 9, [{ pct: plan.plan ? plan.hechos / plan.plan : 0, color: "var(--mint)" }], "rgba(234,241,239,0.14)")}
        <div class="ring-center">
          <div class="v"><b>${plan.hechos}</b><span style="font-size:13px;color:var(--muted)">/${plan.plan}</span></div>
        </div>
      </div>
      <div>
        <div class="label">${escapeHtml(jNombreDia(jHoy()))}</div>
        <div class="big"><b>${jHorasTxt(min)}</b><span> ${tx("de foco hoy")}</span></div>
      </div>`,
    stats: statsPanelPomodoro(),
    informe: "pomodoro",
    focus: foco
  });
}
/* El primer bloque que empieza después de ahora, para el «lo siguiente». */
function jSiguienteBloque() {
  const m = jAhora();
  let mejor = null, falta = 1e9;
  for (const b of jBloquesHoy()) {
    const d = (b.ini - m + J_DIA) % J_DIA;
    if (d > 0 && d < falta) { falta = d; mejor = b; }
  }
  return mejor;
}
/* La primera vez no hay nada que resumir: en vez de un banner con ceros, la
   presentación del módulo con sus dos salidas. Desaparece sola en cuanto hay
   un tramo apuntado. */
function jBienvenidaHTML() {
  return `<div class="empty jor-bienvenida">
    <div class="bubble"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="34" height="34">${J_ARENA}</svg></div>
    <h2>${tx("Tu día, en una rueda")}</h2>
    <p>${tx("Acomoda tus bloques en las 24 horas y enfoca en uno: el Pomodoro cuenta el tiempo y apunta lo que hiciste. Y si solo quieres el reloj, el Hiperfoco cuenta sin planear nada.")}</p>
    <div class="stack" style="align-items:center">
      <button type="button" class="btn btn-primary" data-jbien="iniciar">${tx("Empezar un tramo")}</button>
      <button type="button" class="btn btn-linea" data-jbien="bloque">${tx("Acomodar mi día")}</button>
    </div>
  </div>`;
}
function renderJornada() {
  const cont = document.getElementById("jornada-content");
  if (!cont || !jornadaEncendida()) return;
  jDatos();
  const modo = jModo();
  const pestanas = `<div class="jor-modos" role="tablist" aria-label="${escapeAttr(tx("Cómo usar el Pomodoro"))}">
    ${[["dia", tx("Rutina diaria")], ["lite", tx("Hiperfoco")]].map(([k, n]) =>
      `<button type="button" role="tab" data-modo="${k}" aria-selected="${modo === k}">${n}</button>`).join("")}
  </div>`;
  /* `jor-fin` es la hora a la que acaba la fase (0.7.107.3). Nace escondido:
     solo hay hora que dar cuando algo está corriendo con final conocido. */
  /* El banner primero, como en los otros cuatro módulos. Sin registro todavía
     no hay nada que resumir, y va la presentación en su lugar. */
  const cabeza = (jDatos().registro || []).length ? jHeroHTML() : jBienvenidaHTML();
  const numeros = `<div id="jor-tiempo">25:00</div><div id="jor-fase"></div><div id="jor-sub"></div><div id="jor-fin" hidden></div>`;

  if (modo === "lite") {
    cont.innerHTML = cabeza + pestanas + `
      <div class="jor-lite">
        <div class="jor-reloj-caja">${jRelojHTML(jRelojActual())}</div>
        ${numeros}
        <div class="jor-controles" id="jor-controles"></div>
      </div>`;
  } else {
    cont.innerHTML = cabeza + pestanas + `
      <div class="jor">
        ${jDiasHTML()}
        <div class="jor-reloj">
          <div class="jor-rueda">
            <svg id="jor-svg" viewBox="0 0 320 320" role="img" aria-label="${escapeAttr(tx("Tu día en una rueda de 24 horas"))}">
              <g>${jBaseRueda()}</g><g id="jor-bloques-svg"></g>
              <g id="jor-aguja" class="jor-aguja"><line x1="${J_C}" y1="${J_C - J_RI + 6}" x2="${J_C}" y2="${J_C - J_RO - 9}"/><circle cx="${J_C}" cy="${J_C - J_RO - 9}" r="3.5"/></g>
              <g id="jor-asas"></g>
            </svg>
            <div class="jor-centro"><div class="jor-reloj-caja">${jRelojHTML(jRelojActual())}</div>${numeros}</div>
          </div>
          <div class="jor-controles" id="jor-controles"></div>
        </div>
        <div class="jor-lista">
          <h3 class="jor-rot">${tx("Hoy")}<span class="jor-rot-dato" id="jor-hoy-dato"></span></h3>
          <div class="jor-bloques" id="jor-lista-bloques"></div>
          <h3 class="jor-rot">${tx("Por acomodar")}</h3>
          <div class="jor-acomodar" id="jor-acomodar"></div>
          <p class="jor-como">${tx("Toca un bloque para elegirlo, arrastra sus puntas para cambiar la hora y arrástralo entero para moverlo, aunque haya otro en medio. Tócalo otra vez para editarlo.")}</p>
        </div>
      </div>`;
    jEngancharRueda(document.getElementById("jor-svg"));
  }
  jArribaAntes = 1; jVolteando = false;
  jApuntarPlan();
  jPintar();
  jPintarAguja();
  const run = jDatos().run;
  if (run && run.fase === "cierre") jAbrirHoja("cierre");
}
/* El selector de días se repinta con todo lo demás. Sin esto, vincular dejaba
   el interruptor en gris y los días sin recolorear hasta cambiar de pantalla:
   el dato cambiaba y la interfaz se quedaba con la foto vieja. Lo cazó Eduardo
   al aplicar un vínculo. */
function jPintarDias() {
  const caja = document.querySelector(".jor-dias");
  if (caja) caja.outerHTML = jDiasHTML();
}
function jPintar() {
  /* Estando vinculado, lo que tocas en un día se copia a los suyos. Va aquí y
     no en cada sitio que edita: así no hay forma de añadir una edición nueva y
     olvidarse de propagarla, que es como se desincronizan estas cosas. */
  jPropagar();
  jPintarDias();
  if (document.getElementById("jor-arena")) { jPintarRueda(); jPintarLista(); jPintarControles(); jPintarCentro(); }
  jPintarPildora();
}

function jPintarLista() {
  const el = document.getElementById("jor-lista-bloques");
  if (!el) return;
  const j = jDatos(), m = jAhora(), hoy = todayKey();
  const foco = {}, sueno = {};
  j.registro.forEach(r => {
    if (r.fecha !== hoy || !r.bloque) return;
    if (r.tipo === "sueno") { if (!sueno[r.bloque]) sueno[r.bloque] = r.min; }
    else if (!r.abandono) foco[r.bloque] = (foco[r.bloque] || 0) + r.min;
  });
  el.innerHTML = jBloques().slice().sort((a, b) => a.ini - b.ini).map(b => {
    const extra = foco[b.id] ? " · " + T`${foco[b.id]} min de foco` : sueno[b.id] ? " · " + T`dormiste ${jFmtDur(sueno[b.id])}` : "";
    return `
    <button type="button" class="jor-fila${b.id === jSelId ? " sel" : ""}" data-id="${b.id}">
      <span class="jor-tile${b.descanso && !b.color ? " descanso" : ""}" style="background:${jColorBloque(b)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${jIconoBloque(b)}</svg></span>
      <span class="jor-fila-t"><b>${escapeHtml(jNombreBloque(b))}</b><span>${jRango(b)}${escapeHtml(extra)}</span></span>
      <span class="jor-fila-d">${jDentro(b, m) ? `<span class="jor-chip ahora">${tx("Ahora")}</span>` : ""}<span class="jor-chip">${jFmtDur(jDur(b))}</span></span>
    </button>`;
  }).join("");
  /* Lo planeado contra lo hecho, en el sitio donde se planea. */
  const dato = document.getElementById("jor-hoy-dato");
  if (dato) {
    const p = jPlanDeHoy();
    dato.textContent = p.plan ? T`${p.hechos} de ${p.plan} con foco` : "";
  }
  const puestas = new Set(jBloques().filter(b => b.ref && b.ref.t === "mision").map(b => b.ref.id));
  const libres = (state.missions || []).filter(x => missionDueToday(x) && !missionDone(x, hoy) && !puestas.has(x.id));
  document.getElementById("jor-acomodar").innerHTML = libres.length
    ? libres.map(x => `<button type="button" data-acomodar="${x.id}"><span class="jor-punto" style="background:${pinta(x.color || "#9aa7b8")}"></span>${escapeHtml(x.name)}</button>`).join("")
    : `<p class="jor-vacio">${tx("Todas tus misiones de hoy ya tienen hora.")}</p>`;
}

const J_PLAY = '<svg class="lleno" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
const J_PAUSA = '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';
const J_PARAR = '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>';

const J_LAPIZ = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';

/* Los controles del Hiperfoco: elegir una de las tres maneras, sus minutos y
   un botón. Nada que vincular. */
function jControlesLite(run) {
  const c = jHfCfg();
  if (!run) {
    const k = c.hfModo, h = c.hf[k];
    const paso = (clave, lbl, val) => `<div class="jor-hf-paso"><span>${lbl}</span><span class="jor-paso">
        <button type="button" data-a="hf-paso" data-k="${clave}" data-d="-1" aria-label="${escapeAttr(tx("Menos"))}">−</button><output>${val}</output>
        <button type="button" data-a="hf-paso" data-k="${clave}" data-d="1" aria-label="${escapeAttr(tx("Más"))}">+</button></span></div>`;
    const ajustes = k === "travesia"
      ? paso("foco", tx("Foco"), T`${h.foco} min`) + paso("desc", tx("Descanso"), T`${h.desc} min`) + paso("rondas", tx("Rondas"), h.rondas)
      : k === "inmersion" ? paso("foco", tx("Foco"), T`${h.foco} min`)
      : paso("desc", tx("Descanso"), T`${h.desc} min`);
    return `<div class="jor-hf-modos">${Object.keys(J_HF).map(m => `
        <div class="jor-hf">
          <button type="button" class="jor-hf-sel" data-a="hf-modo" data-v="${m}" aria-pressed="${m === k}"><b>${escapeHtml(jHfNombre(m))}</b><span>${escapeHtml(jHfResumen(m))}</span></button>
          <button type="button" class="jor-hf-lapiz" data-a="hf-nombre" data-v="${m}" aria-label="${escapeAttr(tx("Cambiar el nombre"))}" title="${escapeAttr(tx("Cambiar el nombre"))}">${J_LAPIZ}</button>
        </div>`).join("")}</div>
      <div class="jor-hf-ajustes-caja"><div class="jor-hf-ajustes">${ajustes}</div></div>
      <div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="lite-go">${J_PLAY}${tx(J_HF[k].verbo)}</button></div>`;
  }
  if (run.fase === "foco") {
    /* ---- En pausa aparecen las dos salidas de la fase (0.7.107.3) ----
       Las pidió Eduardo, y solo en pausa: corriendo son ruido —lo que hay que
       hacer es enfocar— y en pausa son justo las dos preguntas que uno se hace
       ahí parado, «esta ronda ya no me sirve» o «ya estuvo, sigue».

       Volver a Pausa las esconde, así que no hay que acordarse de nada. */
    const extra = run.seg ? "" : `<div class="jor-acc dos jor-mas">
        <button type="button" class="btn btn-aviso jor-chico" data-a="hf-reiniciar">${tx("Reiniciar fase")}</button>
        <button type="button" class="btn btn-ghost jor-chico" data-a="hf-saltar">${tx("Saltar lo que queda")}</button>
      </div>`;
    return `<div class="jor-acc dos">
        <button type="button" class="btn btn-soft jor-grande" data-a="pausa">${run.seg ? J_PAUSA + tx("Pausa") : J_PLAY + tx("Seguir")}</button>
        <button type="button" class="btn btn-ghost jor-grande" data-a="lite-parar">${J_PARAR}${tx("Parar")}</button>
      </div>` + extra;
  }
  if (run.fase === "listo") {
    return `<div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="lite-go">${J_PLAY}${tx("Otra vez")}</button></div>
      <button type="button" class="jor-enlace" data-a="fin">${tx("Terminar")}</button>`;
  }
  if (run.fase === "descanso") {
    return run.modo === "respiro"
      ? `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="lite-parar">${J_PARAR}${tx("Parar")}</button></div>`
      : `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="saltar">${tx("Saltar el descanso")}</button></div>
         <button type="button" class="jor-enlace" data-a="lite-parar">${tx("Parar")}</button>`;
  }
  return "";
}

function jPintarControles() {
  const c = document.getElementById("jor-controles");
  if (!c) return;
  const j = jDatos(), run = j.run, cfg = j.cfg;
  /* Un tramo rápido se lleva con sus propios controles aunque se mire desde
     la rueda: pasarlo a los de la rueda lo convertiría en otro tramo. */
  if ((jModo() === "lite" && !run) || (run && run.lite)) { c.innerHTML = jControlesLite(run); return; }
  const r = jRef(jObjetivo());
  const flecha = '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>';
  const mas = `<button type="button" class="btn btn-ghost jor-icono" data-a="nuevo" aria-label="${escapeAttr(tx("Crear bloque"))}" title="${escapeAttr(tx("Crear bloque"))}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>`;
  const desc = !run ? jDescansoAhora() : null;
  let h = "", regla = "";

  /* Mirando otro día solo se acomoda: los tramos se inician en el de hoy, y
     un botón que no puede hacer lo que dice es peor que no estar. */
  if (jDiaVisto() !== jHoy()) {
    c.innerHTML = `<div class="jor-acc"><span class="jor-desc-tx">${escapeHtml(T`Estás acomodando tu ${jNombreDia(jDiaVisto()).toLowerCase()}.`)}</span>${mas}</div>` +
      `<p class="jor-regla">${tx("Para iniciar un tramo, vuelve al día de hoy.")}</p>`;
    return;
  }

  if (!run && j.dormido) {
    /* Dormido gana a todo: lo primero al abrir por la mañana es despertar. */
    /* Con la app atenuada, este botón es la ÚNICA salida: va por encima del
       velo, con su sol y un halo que respira. Y lo dice en primera persona
       —«Ya desperté» es lo que haces, no un saludo—; el saludo se queda en el
       aviso de después, que es donde se lee como saludo. */
    h = `<div class="jor-acc una jor-despertar"><button type="button" class="btn btn-primary jor-grande" data-a="despertar"><svg viewBox="0 0 24 24">${J_SOL}</svg>${tx("Buenos días, ya desperté")}</button></div>`;
    regla = tx("Tócalo al despertar y queda apuntado cuánto dormiste.");
  } else if (desc) {
    h = desc.descanso === "dormir"
      ? `<div class="jor-acc"><button type="button" class="btn btn-soft jor-grande" data-a="dormir"><svg viewBox="0 0 24 24">${J_LUNA}</svg>${tx("Buenas noches, a dormir")}</button>${mas}</div>`
      : `<div class="jor-acc"><span class="jor-desc-tx">${tx("Bloque de descanso: no lleva tramos.")}</span>${mas}</div>`;
    h += `<button type="button" class="jor-enlace" data-a="forzar">${tx("Enfocar de todos modos")}</button>`;
    regla = desc.descanso === "dormir" ? tx("Toca al irte a dormir y al despertar: así sabes cuánto dormiste.") : "";
  } else {
    if (!run || run.fase === "listo") {
      const ritmo = cfg.preset === "libre" ? tx("Libre") : `${cfg.foco}m / ${cfg.desc}m · ${cfg.ciclos}`;
      h += `<div class="jor-pildoras">
        <button type="button" class="jor-pild" data-a="enque" ${run ? "disabled" : ""}>${r && r.o.color ? `<span class="jor-punto" style="background:${pinta(r.o.color)}"></span>` : `<svg viewBox="0 0 24 24">${J_ARENA}</svg>`}<span class="t">${escapeHtml(r ? r.nombre : tx("Sin vincular"))}</span>${run ? "" : flecha}</button>
        <button type="button" class="jor-pild" data-a="ritmo"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></svg><span class="t">${ritmo}</span>${flecha}</button>
      </div>`;
    }
    if (!run) {
      h += `<div class="jor-acc"><button type="button" class="btn btn-primary jor-grande" data-a="iniciar">${J_PLAY}${tx("Iniciar")}</button>${mas}</div>`;
    } else if (run.fase === "listo") {
      h += `<div class="jor-acc"><button type="button" class="btn btn-primary jor-grande" data-a="iniciar">${J_PLAY}${escapeHtml(T`Tramo ${run.tramo} de ${cfg.ciclos}`)}</button>
        <button type="button" class="btn btn-ghost jor-icono" data-a="fin" aria-label="${escapeAttr(tx("Terminar por hoy"))}" title="${escapeAttr(tx("Terminar por hoy"))}">${J_PARAR}</button></div>`;
    } else if (run.fase === "foco") {
      const pausa = `<button type="button" class="btn btn-soft jor-grande" data-a="pausa">${run.seg ? J_PAUSA + tx("Pausa") : J_PLAY + tx("Seguir")}</button>`;
      h += run.libre
        ? `<div class="jor-acc dos">${pausa}<button type="button" class="btn btn-primary jor-grande" data-a="terminar">${tx("Terminar")}</button></div>
           <button type="button" class="jor-enlace peligro" data-a="abandonar">${tx("Abandonar")}</button>`
        : `<div class="jor-acc dos">${pausa}<button type="button" class="btn btn-danger-ghost jor-grande" data-a="abandonar">${tx("Abandonar")}</button></div>`;
    } else if (run.fase === "descanso") {
      h += `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="saltar">${tx("Saltar el descanso")}</button></div>`;
    } else if (run.fase === "cierre") {
      h += `<div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="cierre">${tx("Guardar el tramo")}</button></div>`;
    }
    regla = jTextoRegla();
  }
  c.innerHTML = h + (regla ? `<p class="jor-regla">${escapeHtml(regla)}</p>` : "");
}
/* La línea de debajo de los controles: qué va a pasar con lo que se enfoca.
   Es «el reloj propone, tú confirmas» dicho antes de empezar. */
function jTextoRegla() {
  const r = jRef(jObjetivo());
  if (!r) return tx("Sin vincular: solo queda en tu registro.");
  if (r.t === "mision") return tx("Al acabar el tramo te pregunta si la terminaste.");
  if (r.t === "habilidad") return tx("Cada tramo cuenta como práctica y le da XP.");
  const s = r.o.skillId && (state.skills || []).find(x => x.id === r.o.skillId);
  return s ? T`Cada tramo le da XP a ${s.name}, la habilidad que entrena.` : tx("Queda en tu registro del Pomodoro.");
}

/* ---------- El reloj de arena del centro ----------
   La arena se dibuja SIEMPRE con el reloj derecho: la de arriba apoyada en el
   cuello, la de abajo en el suelo. Al voltearlo gira el dibujo entero con la
   arena dentro y, al acabar el giro, se endereza sin que se note: lleno, un
   bulbo va de punta a punta, así que «abajo lleno, girado» y «arriba lleno,
   derecho» son el mismo dibujo. En el primer boceto la arena se dibujaba de
   cabeza y en el modo Libre se quedaba pegada al techo — lo cazó Eduardo.

   Desde 0.7.108.1 el enderezado del final tampoco se nota en el MARCO, y es lo
   que permitió que gire el reloj entero: los tres son simétricos respecto al
   cuello, así que a media vuelta el pie se ve igual que derecho. Ver
   `J_RELOJES`, que es donde vive esa simetría. */
let jArribaAntes = 1, jVolteando = false;
function jVoltear() {
  const g = document.getElementById("jor-giro");
  if (!g) return;
  jVolteando = true;
  /* La vuelta entera vive en el CSS (`@keyframes jor-voltear`): media vuelta
     con un encogimiento a mitad de camino. Aquí solo se enciende y se espera. */
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Al terminar la vuelta se quita la clase Y se redibuja la arena en el MISMO
     turno, para que el navegador pinte las dos cosas juntas. Antes la arena se
     corregía en el siguiente paso del reloj —hasta 250 ms después—, y en ese
     hueco el vidrio ya estaba derecho con la arena dibujada como si siguiera
     girado: abajo en vez de arriba. Lo vio Eduardo como un parpadeo.

     Se busca el grupo otra vez porque el reloj pudo cambiar de dibujo en medio,
     y `acabar` se protege sola: la llaman el final de la animación Y un plazo
     de seguridad, y con el dibujo cambiado en medio el `animationend` no llega
     nunca — sin ese plazo la arena se quedaría congelada a media vuelta. */
  const acabar = () => {
    if (!jVolteando) return;
    jVolteando = false;
    const g2 = document.getElementById("jor-giro");
    if (g2) g2.classList.remove("girando");
    jPintarCentro();
  };
  if (quieto) { acabar(); return; }
  g.classList.add("girando");
  g.addEventListener("animationend", acabar, { once: true });
  setTimeout(acabar, 1200);
}
/* `fc` es el estado, y de él salen los colores del centro y de la píldora:
   foco en menta, descanso en luciérnaga, pausa en coral. */
function jEstadoCentro() {
  const j = jDatos(), run = j.run, cfg = j.cfg;
  if (!run) {
    if (jModo() === "lite") {
      const hc = jHfCfg(), k = hc.hfModo, h = hc.hf[k];
      /* Parado, la arena está ABAJO: un reloj de arena en reposo tiene el grano
         en el bulbo de abajo, y se voltea para empezar a contar. Eso hace que
         al tocar «Enfocar» el reloj DÉ LA VUELTA solo —`jPintarCentro` voltea
         cuando la arena sube de golpe—, que es el gesto de ponerlo en marcha.
         Lo pidió Eduardo: «lo correcto es que esté con la arena abajo». */
      return { arriba: 0, t: jMmss((k === "respiro" ? h.desc : h.foco) * J_MS), f: jHfNombre(k), fc: k === "respiro" ? "brasa" : "",
        sub: jHfResumen(k), cae: false, prog: 0 };
    }
    /* Mirando otro día, el centro habla de ESE día: el tiempo de foco que
       tiene planeado y cuántos bloques. Enseñar ahí la cuenta de hoy, con la
       rueda de otro día detrás, sería mezclar dos cosas distintas. */
    if (jDiaVisto() !== jHoy()) {
      const bs = jDatos().rutinas[jDiaVisto()];
      const foco = bs.filter(b => !b.descanso);
      const min = foco.reduce((t, b) => t + jDur(b), 0);
      return { arriba: 1, t: min ? jFmtDur(min) : "—", f: jNombreDia(jDiaVisto()), fc: "",
        sub: !foco.length ? tx("Sin bloques de foco") : foco.length === 1 ? tx("1 bloque de foco") : T`${foco.length} bloques de foco`, cae: false, prog: 0 };
    }
    const m = jAhora();
    if (j.dormido) {
      const min = (Date.now() - j.dormido.inicio) / J_MS;
      const b = jBloquesHoy().find(x => x.id === j.dormido.bloque);
      /* Lo que se enseña es lo que FALTA, no lo que llevas (0.7.113.1). Un
         número que sube mientras duermes no se sabe contra qué se compara
         —lo dijo Eduardo: «es confuso»—, y dormido lo único que importa es
         cuánto queda hasta levantarse. Sin bloque de dormir no hay contra qué
         medir, y ahí sí vale lo que llevas, que es el dato que existe. */
      const dentro = b && jDentro(b, jAhora());
      const falta = dentro ? ((b.fin - jAhora() + J_DIA) % J_DIA) : 0;
      return {
        arriba: dentro ? Math.max(0, Math.min(1, falta / jDur(b))) : (b ? 0 : 0.5),
        t: dentro ? jHm(falta) : jHm(min),
        f: tx("Durmiendo"), fc: "brasa",
        sub: dentro ? T`Te levantas a las ${jH12(b.fin)}` : T`Desde las ${jH12(jMinDe(j.dormido.inicio))}`,
        cae: true, prog: 0
      };
    }
    const d = jDescansoAhora();
    if (d) {
      const pasado = (m - d.ini + J_DIA) % J_DIA, dur = jDur(d);
      return { arriba: 1 - pasado / dur, t: jHm(dur - pasado), f: tx((J_DESCANSOS[d.descanso] || J_DESCANSOS.dormir).fase), fc: "brasa",
        sub: d.descanso === "dormir" ? T`Te levantas a las ${jH12(d.fin)}` : T`Hasta las ${jH12(d.fin)}`, cae: true, prog: 0 };
    }
    const b = jBloqueEn(m), r = jRef(jObjetivo());
    return { arriba: 1, t: cfg.preset === "libre" ? "00:00" : jMmss(cfg.foco * J_MS), f: r ? r.nombre : tx("Sin vincular"), fc: "",
      sub: b ? jRango(b) : tx("Nada a esta hora"), cae: false, prog: 0 };
  }
  const el = jTrans(run), r = jRef(run.ref);
  const hfNom = run.lite ? jHfNombre(run.modo || "travesia") : "";
  const nom = run.lite ? hfNom : (r ? r.nombre : tx("Sin vincular"));
  if (run.fase === "foco") {
    const enPausa = !run.seg;
    const sub = run.lite
      ? (run.libre ? tx("Sin límite") : (run.rondas || 1) > 1 ? T`Ronda ${run.tramo} de ${run.rondas}` : tx("Sin pausas"))
      : nom;
    if (run.libre) {
      const v = (el % (25 * J_MS)) / (25 * J_MS);
      return { arriba: 1 - v, t: jMmss(el), f: enPausa ? tx("En pausa") : (run.lite ? hfNom : tx("Enfoque libre")), fc: enPausa ? "pausa" : "foco", sub, cae: !enPausa, prog: v };
    }
    const p = Math.min(1, el / run.dur);
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: enPausa ? tx("En pausa") : (run.lite ? hfNom : T`Foco · ${run.tramo} de ${cfg.ciclos}`), fc: enPausa ? "pausa" : "foco", sub, cae: !enPausa, prog: p, resta: run.dur - el };
  }
  if (run.fase === "descanso") {
    const p = Math.min(1, el / run.dur);
    const respiro = run.lite && run.modo === "respiro";
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: respiro ? hfNom : tx("Descanso"), fc: "brasa",
      sub: respiro ? tx("Nada que hacer: solo respirar") : run.lite ? T`Luego, ronda ${run.tramo + 1} de ${run.rondas || 1}` : T`Luego, tramo ${run.tramo + 1}`, cae: true, prog: p, resta: run.dur - el };
  }
  if (run.fase === "listo" && run.lite) {
    return { arriba: 0, t: jMmss((run.min || 0) * J_MS), f: tx("Listo"), fc: "foco",
      sub: (run.rondas || 1) > 1 ? T`Terminaste tus ${run.rondas} rondas.` : T`${run.min || 0} min de hiperfoco`, cae: false, prog: 1 };
  }
  if (run.fase === "listo") return { arriba: 1, t: jMmss(cfg.foco * J_MS), f: T`Tramo ${run.tramo} de ${cfg.ciclos}`, fc: "", sub: nom, cae: false, prog: 0 };
  return { arriba: 0, t: jMmss(run.libre ? run.acum : 0), f: tx("Tramo listo"), fc: "foco", sub: nom, cae: false, prog: 1 };
}
function jPintarCentro() {
  jAsegurarReloj();
  const reloj = document.getElementById("jor-arena");
  if (!reloj) return;
  const R = J_RELOJES[reloj.dataset.tipo] || J_RELOJES.mediano, mid = R.v.mid, alto = mid - R.y0;
  const s = jEstadoCentro();
  if (s.arriba - jArribaAntes > 0.5 && !jVolteando) jVoltear();
  jArribaAntes = s.arriba;
  const p = jVolteando ? 1 : 1 - s.arriba;
  const yA = R.y0 + p * alto, yB = R.y1 - p * alto;
  const A = document.getElementById("jor-a-arriba"), B = document.getElementById("jor-a-abajo"), ch = document.getElementById("jor-chorro");
  A.setAttribute("y", yA); A.setAttribute("height", Math.max(0, mid - yA));
  B.setAttribute("y", yB); B.setAttribute("height", R.y1 - yB);
  ch.style.display = s.cae && !jVolteando && s.arriba > 0.01 ? "" : "none";
  ch.setAttribute("y2", Math.max(mid + 2, yB));
  reloj.classList.toggle("brasa", s.fc === "brasa");
  reloj.classList.toggle("pausa", s.fc === "pausa");
  document.getElementById("jor-tiempo").textContent = s.t;
  const f = document.getElementById("jor-fase");
  f.textContent = s.f; f.className = s.fc;
  document.getElementById("jor-sub").textContent = s.sub;
  jPintarFin(s);
}
/* ---- A qué hora acabas esto (0.7.107.3) ----
   La pidió Eduardo: hora de ahora + lo que le queda a la fase. Se calcula desde
   el reloj y no desde la hora a la que empezó, y esa es toda la gracia: así una
   pausa de diez minutos corre la hora diez minutos, que es lo que de verdad va
   a pasar.

   En pausa el rótulo lo dice —«si sigues»—, porque ahí el número no es una
   promesa: es lo que pasaría si le dieras a Seguir ahora mismo, y se va
   moviendo solo mientras no lo hagas.

   Va en la hora del PERFIL (`jMinDe` + `jH12`), no en la del reloj de la
   máquina: es la misma zona con la que se dibujan los bloques del día, y dos
   horas distintas en la misma pantalla no se pueden mirar juntas.

   Y los segundos se cortan hacia abajo —`jMinDe` lee hora y minuto— en vez de
   redondearse: si la fase acaba a las 10:46:44 todavía son las 10:46, y
   redondear escribiría una hora a la que la fase YA habría terminado. Ojo al
   compararlo con `jH12(jAhora())`, que sí redondea: por eso «ahora» puede ir un
   minuto por delante de la cuenta hecha a mano, y no es un error de la resta. */
function jPintarFin(s) {
  const el = document.getElementById("jor-fin");
  if (!el) return;
  const hay = s.resta > 0;
  el.hidden = !hay;
  if (!hay) { el.textContent = ""; return; }
  const hora = jH12(jMinDe(Date.now() + s.resta));
  el.textContent = s.fc === "pausa" ? T`Si sigues, acabas a las ${hora}` : T`Acabas a las ${hora}`;
}

/* ---------- La píldora: el reloj te sigue a otras pantallas ----------
   Cambia de color con el estado —menta en foco, coral en pausa, luciérnaga en
   descanso— y el estado va en negritas y de ese color, separado del nombre.
   Lo pidió Eduardo al verla en pausa con el borde verde: una píldora que no
   reacciona dice «todo sigue corriendo» cuando no es verdad. */
function jPintarPildora() {
  const pil = document.getElementById("jornada-pildora");
  if (!pil) return;
  const j = jornadaEncendida() ? jDatos() : null;
  const run = j ? j.run : null;
  /* DURMIENDO también saca la píldora (0.7.113), y no es un adorno: con el
     velo del modo dormir encima, la píldora es lo único que se queda
     encendido, dice desde qué hora duermes y es el camino a «Buenos días».
     Sin ella, atenuar la app dejaba la pantalla sin una sola salida a la vista. */
  const durmiendo = !!(j && j.dormido);
  const ver = (durmiendo || (!!run && run.fase !== "listo")) &&
              !document.querySelector("#view-jornada.active") && !document.getElementById("portada");
  pil.hidden = !ver;
  if (!ver) return;
  const s = jEstadoCentro();
  const cierre = !!run && run.fase === "cierre";
  const estado = cierre ? "foco" : s.fc || "foco";
  ["foco", "pausa", "brasa"].forEach(k => pil.classList.toggle(k, k === estado));
  document.getElementById("jor-pil-t").textContent = cierre ? tx("Listo") : s.t;
  const rot = cierre ? tx("Tramo listo") : s.f;
  const nom = cierre ? tx("Toca para guardarlo") : s.sub;
  document.getElementById("jor-pil-s").innerHTML = `<b class="jor-pil-est">${escapeHtml(rot)}</b> · ${escapeHtml(nom)}`;
}

/* ---------- El paso ---------- */
let jCuartoAntes = -1;
/* El modo dormir se ve en toda la app: esta clase es la que enciende el velo
   (css/jornada.css). Vive aquí y no en el CSS de la casa porque el dato es
   del Pomodoro, y se apaga sola si el módulo está apagado. */
function jModoDormir() {
  if (jAmaneciendo) return;          // a media luz no se toca el interruptor
  const on = jornadaEncendida() && !!jDatos().dormido;
  document.documentElement.classList.toggle("durmiendo", on);
}
/* ---- El amanecer (0.7.114) ----
   Quitar el velo de golpe era un parpadeo. La luz entra DESDE EL BOTÓN: una
   máscara circular que se abre desde donde tocaste y se lleva la penumbra por
   delante. Por eso hacen falta las coordenadas del botón —el gesto tiene que
   salir de donde pusiste el dedo, o se nota postizo— y por eso el velo no se
   quita hasta que la máscara termina.
   Con «menos movimiento» puesto no hay máscara: se quita y ya. */
let jAmaneciendo = false;
function jAmanecer(desde) {
  const raiz = document.documentElement;
  const r = desde && desde.getBoundingClientRect ? desde.getBoundingClientRect() : null;
  raiz.style.setProperty("--jor-x", r ? `${Math.round(r.left + r.width / 2)}px` : "50%");
  raiz.style.setProperty("--jor-y", r ? `${Math.round(r.top + r.height / 2)}px` : "70%");
  let quieto = false;
  try { quieto = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { /* sin matchMedia, que se anime */ }
  if (quieto) { raiz.classList.remove("durmiendo"); return; }
  jAmaneciendo = true;
  raiz.classList.add("despertando");
  setTimeout(() => {
    jAmaneciendo = false;
    raiz.classList.remove("despertando", "durmiendo");
  }, 950);
}
/* ---- Cuándo la rueda se queda quieta (0.7.113) ----
   Dos casos, y no son el mismo:
   - DURMIENDO: la app está bloqueada a propósito, así que el día no se toca
     —ni arrastrar, ni abrir un bloque—. Quien quiera acomodar algo, primero
     se levanta: es un toque en «Buenos días».
   - TRAMO EN CURSO: mover el bloque que estás enfocando cambiaría a media
     cuenta lo que se está midiendo. Ahí solo se prohíbe ARRASTRAR; abrir un
     bloque y mirarlo sigue valiendo.
   El Hiperfoco no entra: su tramo no cuelga de la rueda, y quien lo usa puede
   estar planeando el día mientras tanto. */
function jQuieta() {
  const j = jDatos();
  if (j.dormido) return { todo: true, txt: tx("Mientras duermes, la rueda se queda quieta. Toca «Buenos días» para acomodar tu día.") };
  const r = j.run;
  if (r && !r.lite && (r.fase === "foco" || r.fase === "descanso")) {
    return { todo: false, txt: tx("Con un tramo en curso los bloques no se mueven. Termínalo o abandónalo para acomodar tu día.") };
  }
  return null;
}
function jPaso() {
  jModoDormir();
  if (!jornadaEncendida()) { jPintarPildora(); return; }
  const run = jDatos().run;
  if (run && (run.fase === "foco" || run.fase === "descanso") && run.dur && run.seg && jTrans(run) >= run.dur && jPuedoCerrar(run)) jFinFase();
  jAvisoSueno();
  /* Cada cuarto de hora puede cambiar el bloque de «ahora», y con él se olvida
     el «Enfocar de todos modos» del bloque que ya pasó. Y es cuando se apunta
     el plan del día, que así queda escrito aunque no se abra la pantalla. */
  const cuarto = Math.floor(jAhora() / 15);
  const cambio = cuarto !== jCuartoAntes;
  if (cambio) {
    jCuartoAntes = cuarto;
    const b = jBloqueEn(jAhora());
    if (jForzado && (!b || b.id !== jForzado)) jForzado = null;
    jApuntarPlan();
  }
  if (document.getElementById("jor-arena") && document.querySelector("#view-jornada.active")) {
    jPintarCentro(); jPintarAguja();
    if (cambio) {
      jPintarRueda();   // el gajo que brilla cambia con el bloque de «ahora»
      jPintarLista();
      if (!jDatos().run || jDatos().run.fase === "listo") jPintarControles();
    }
  }
  jPintarPildora();
}

/* ---------- Avisos ----------
   El sonido y la vibración salen con la app abierta. Con la pestaña de fondo,
   el aviso del sistema, si se dio permiso. Con la app CERRADA no hay nada que
   pueda avisar desde una página web: eso pide avisos desde el servidor, y
   llegará en otra versión. */
let jCtx = null;
function jAudio() {
  try { jCtx = jCtx || new (window.AudioContext || window.webkitAudioContext)(); jCtx.resume(); } catch (e) { /* sin sonido */ }
}
function jCampana() {
  if (!jCtx || !jDatos().cfg.sonido) return;
  [[660, 0], [880, .18], [990, .36]].forEach(([f, t]) => {
    const o = jCtx.createOscillator(), g = jCtx.createGain(), t0 = jCtx.currentTime + t;
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.18, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + .9);
    o.connect(g).connect(jCtx.destination); o.start(t0); o.stop(t0 + 1);
  });
}
/* ---- Nada suena sin decir por qué (0.7.105.1) ----
   Antes la campana sonaba SIEMPRE y la explicación iba a un aviso dentro de
   la app, de dos segundos y medio: con la app de fondo sonaba algo y el porqué
   se lo llevaba una pestaña que nadie miraba. Ahora hay tres caminos y en los
   tres el sonido llega con su motivo:

     - app a la vista: campana y un aviso que dice «Pomodoro · …», con un
       botón para ir y diez segundos para leerlo;
     - app de fondo, con permiso: campana y el aviso del SISTEMA, que es lo que
       se ve fuera de la app;
     - app de fondo, sin permiso: NO suena. Se guarda, y al volver se dice
       «Mientras no estabas · …».

   `clave` hace que cada final de fase suene una sola vez aunque la sincronía
   traiga otra vez el mismo tramo, y `mio === false` es el dispositivo que no
   lleva el reloj: ese no suena nunca. */
const jSonados = new Set();
let jPendientes = [];
function jAvisar(titulo, texto, clave, mio) {
  if (mio === false) return;
  if (clave) { if (jSonados.has(clave)) return; jSonados.add(clave); }
  const t = tx("Pomodoro") + " · " + titulo;
  const vibrar = () => { try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) { /* sin vibración */ } };
  if (!document.hidden) {
    jCampana(); vibrar();
    toast(t + " · " + texto, "logro", { label: tx("Ver"), onclick: "irAModulo('jornada')", ms: 10000 });
    return;
  }
  const cfg = jDatos().cfg;
  if (cfg.notificar !== false && "Notification" in window && Notification.permission === "granted") {
    jCampana(); vibrar();
    const op = { body: texto, tag: "jornada", icon: "icon-192.png", badge: "icon-192.png" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(r => r.showNotification(t, op)).catch(() => { try { new Notification(t, op); } catch (e) { /* nada */ } });
    } else { try { new Notification(t, op); } catch (e) { /* nada */ } }
    return;
  }
  jPendientes.push(t + " · " + texto);
  jPendientes = jPendientes.slice(-3);
}
function jMostrarPendientes() {
  if (!jPendientes.length) return;
  const lista = jPendientes;
  jPendientes = [];
  lista.forEach((m, i) => setTimeout(() =>
    toast(T`Mientras no estabas · ${m}`, "logro", { label: tx("Ver"), onclick: "irAModulo('jornada')", ms: 10000 }), i * 400));
}

/* ---------- Las hojas ---------- */
let jHoja = null, jEdit = null, jQuitando = false;
function jornadaHojaAbierta() { return !!jHoja; }
function jAbrirHoja(tipo) {
  jEditando = null;
  jHoja = tipo; jQuitando = false;
  if (tipo === "cierre") { jRespuesta = "no"; jAnimo = 2; }
  jPintarHoja();
  document.getElementById("jornada-modal").classList.add("show");
}
/* `desdeFuera` es tocar el velo o el gesto de atrás: el cierre de un tramo no
   se va así, porque se perdería lo que acabas de hacer. */
function cerrarHojaJornada(desdeFuera) {
  if (!jHoja) return;
  if (desdeFuera && jHoja === "cierre") return;
  jHoja = null;
  const m = document.getElementById("jornada-modal");
  if (m) m.classList.remove("show");
}
function jAbrirBloque(id) {
  const q = jQuieta();
  if (q && q.todo) { toast(q.txt, "atencion"); return; }
  const b = jBloques().find(x => x.id === id);
  if (b) jEdit = { id: b.id, descanso: b.descanso || null, ref: b.ref || null, color: b.color || null, nombre: b.nombre || "", ini: b.ini, fin: b.fin };
  else {
    const ini = (Math.ceil(jAhora() / 15) * 15) % J_DIA;
    const g = jCandidatos()[0];
    jEdit = { id: null, descanso: g ? null : "comida", ref: g ? { t: g[0], id: g[2][0].id } : null, color: null, nombre: "", ini, fin: (ini + 60) % J_DIA };
  }
  jAbrirHoja("bloque");
}
/* ---- La rueda dentro de la hoja (0.7.109) ----
   Creando un bloque desde el botón, la hoja tapa la rueda entera y no había
   forma de ver dónde iba a caer lo nuevo: se guardaba y luego se miraba. Lo
   pidió Eduardo. Es la MISMA rueda, en pequeño y solo para mirar —sin asas y
   sin arrastre—, con lo que ya hay apagado y lo nuevo en primer plano. */
/* ---- Guardar el borrador de la hoja ----
   Devuelve false cuando no se puede: se encima con otro bloque, o no tiene ni
   nombre ni con qué vincularse. Vive aparte del botón porque al cambiarte de
   bloque dentro de la hoja hay que guardar antes lo que llevas escrito. */
function jGuardarBloque() {
  const j = jDatos();
  if (jChoca(jEdit.ini, jEdit.fin, jEdit.id)) return false;
  if (!jEdit.descanso && !jRef(jEdit.ref) && !(jEdit.nombre || "").trim()) return false;
  const datos = jEdit.descanso ? { descanso: jEdit.descanso, ref: undefined } : { descanso: undefined, ref: jEdit.ref || undefined };
  datos.color = jEdit.color || undefined;
  datos.nombre = (jEdit.nombre || "").trim() || undefined;
  if (jEdit.id) {
    const x = jBloques().find(y => y.id === jEdit.id);
    if (x) Object.assign(x, datos, { ini: jEdit.ini, fin: jEdit.fin });
  } else {
    const n = Object.assign({ id: uid(), ini: jEdit.ini, fin: jEdit.fin }, datos);
    jBloques().push(n); jSelId = n.id; jEdit.id = n.id;
  }
  /* `undefined` no viaja en JSON, pero en memoria sí estorba al leer. */
  jBloques().forEach(x => { if (x.descanso === undefined) delete x.descanso; if (x.ref === undefined) delete x.ref; if (x.color === undefined) delete x.color; if (x.nombre === undefined) delete x.nombre; });
  save(); jApuntarPlan();
  return true;
}

/* ---- La rueda de la hoja, viva (0.7.114) ----
   Era un dibujo para mirar. Ahora es la misma rueda en pequeño y se usa: el
   bloque que estás editando se arrastra y se estira ahí dentro, y tocando otro
   te pasas a editarlo SIN salir de la ventana. Al cambiarte se guarda antes lo
   que llevas —tocar otro gajo no puede costarte lo que acabas de escribir—, y
   si lo que llevas no se puede guardar todavía, se dice y no se cambia. */
const J_BORRADOR = "jor-borrador";
function jPreviaRueda() {
  return `<svg class="jor-previa" id="jor-previa-svg" viewBox="0 0 320 320" role="img" aria-label="${escapeAttr(tx("Tu día: arrastra el bloque o toca otro para editarlo"))}">${jDibujarPrevia()}</svg>`;
}
function jDibujarPrevia() {
  const e = jEdit;
  let h = jBaseRueda();
  if (jDestino != null && jPrevVolando) {
    h += `<path class="jor-destino" d="${jGajo(jDestino, jDur(e), J_RI + 2, J_RO - 2)}" style="fill:${jColorBloque(e)};fill-opacity:.2"/>`;
  }
  for (const b of jBloques()) {
    if (b.id === e.id) continue;
    const col = jColorBloque(b), choca = jPrevVolando && jSolapan(b, e);
    const camino = jGajo(b.ini, jDur(b));
    h += `<path class="jor-blq otro${choca ? " bloqueado" : ""}" data-id="${b.id}" d="${camino}" style="fill:${col};--jor-borde:${jBordeBloque(col)}"/>`;
    if (choca) {
      h += `<path class="jor-veda" d="${camino}"/>`;
      const [ix, iy] = jPt(J_RM, b.ini + jDur(b) / 2);
      h += `<svg class="jor-blq-ic vedado" x="${ix - 8}" y="${iy - 8}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${J_PROHIBIDO}</svg>`;
    }
  }
  const d = jDur(e), col = jColorBloque(e);
  const fuera = jPrevVolando && !!jChoca(e.ini, e.fin, e.id);
  const rIn = fuera ? J_RO + 6 : J_RI, rOut = fuera ? J_RO + 30 : J_RO;
  h += `<path class="jor-blq nuevo${fuera ? " orbita" : ""}" data-id="${J_BORRADOR}" d="${jGajo(e.ini, d, rIn, rOut)}" style="fill:${col};--jor-borde:${jBordeBloque(col)}"/>`;
  if (!jPrevVolando) h += jAsaHTML("ini", e.ini) + jAsaHTML("fin", e.fin);
  h += `<g class="jor-aguja" transform="rotate(${jAhora() / J_DIA * 360} ${J_C} ${J_C})"><line x1="${J_C}" y1="${J_C - J_RI + 6}" x2="${J_C}" y2="${J_C - J_RO - 9}"/><circle cx="${J_C}" cy="${J_C - J_RO - 9}" r="3.5"/></g>`;
  return h;
}
let jPrevVolando = false;
function jPintarPrevia() {
  const s = document.getElementById("jor-previa-svg");
  if (s) s.innerHTML = jDibujarPrevia();
  /* Las horas se tocan a mano y no se rehace la hoja: rehacerla en mitad del
     arrastre se lleva por delante la captura del puntero —y el foco del campo
     del nombre, si estabas escribiendo—. */
  const outs = document.querySelectorAll("#jornada-hoja .jor-filas .jor-paso output");
  if (outs.length >= 2) { outs[0].textContent = jH12(jEdit.ini); outs[1].textContent = jH12(jEdit.fin); }
  const nota = document.querySelector("#jornada-hoja .jor-nota");
  if (nota) {
    const otro = jChoca(jEdit.ini, jEdit.fin, jEdit.id);
    nota.className = otro ? "jor-nota error" : "jor-nota";
    nota.textContent = otro ? T`Se encima con «${jNombreBloque(otro)}». Muévelo o acórtalo.` : T`Dura ${jFmtDur(jDur(jEdit))}.`;
  }
}
function jEngancharPrevia(svg) {
  if (!svg || svg.dataset.listo) return;
  svg.dataset.listo = "1";
  let arr = null;
  svg.addEventListener("pointerdown", ev => {
    const asa = ev.target.closest("[data-h]"), p = ev.target.closest(".jor-blq");
    if (asa) {
      arr = { modo: asa.dataset.h, v: jVecinos(jEdit), ini0: jEdit.ini, fin0: jEdit.fin, x: ev.clientX, y: ev.clientY, movido: false };
    } else if (p && p.dataset.id === J_BORRADOR) {
      arr = { modo: "todo", m0: jMinEn(svg, ev), ini0: jEdit.ini, fin0: jEdit.fin, x: ev.clientX, y: ev.clientY, movido: false };
      jPrevVolando = true; jPintarPrevia();
    } else if (p) {
      /* Otro bloque: guardas lo que llevas y te pasas a ese. */
      const id = p.dataset.id;
      if (!jGuardarBloque()) { toast(tx("Guarda este bloque antes de pasar a otro"), "atencion"); return; }
      jSelId = id; jAbrirBloque(id); jPintar();
      return;
    } else return;
    try { svg.setPointerCapture(ev.pointerId); } catch (x) { /* sin captura, sigue igual */ }
    ev.preventDefault();
  });
  svg.addEventListener("pointermove", ev => {
    if (!arr) return;
    if (!arr.movido && Math.hypot(ev.clientX - arr.x, ev.clientY - arr.y) < 6) return;
    arr.movido = true;
    const m = jSnap(jMinEn(svg, ev));
    if (arr.modo === "ini") jEdit.ini = jMoverIni(jEdit, m, arr.v);
    else if (arr.modo === "fin") jEdit.fin = jMoverFin(jEdit, m, arr.v);
    else {
      const d = ((arr.fin0 - arr.ini0 + J_DIA) % J_DIA) || J_DIA;
      const delta = ((jMinEn(svg, ev) - arr.m0 + 720) % J_DIA + J_DIA) % J_DIA - 720;
      const ini = jSnap(arr.ini0 + delta);
      jEdit.ini = ini; jEdit.fin = (ini + d) % J_DIA;
      jDestino = jChoca(jEdit.ini, jEdit.fin, jEdit.id) ? jHuecoCerca(jEdit.ini, d, jEdit.id) : null;
    }
    jPintarPrevia();
  });
  const soltar = () => {
    if (!arr) return;
    const a = arr; arr = null;
    const destino = jDestino;
    jPrevVolando = false; jDestino = null;
    if (a.movido && a.modo === "todo" && jChoca(jEdit.ini, jEdit.fin, jEdit.id)) {
      const d = jDur(jEdit);
      if (destino == null) { jEdit.ini = a.ini0; jEdit.fin = a.fin0; toast(tx("No cabe: a esa hora la rueda está llena"), "atencion"); }
      else { jEdit.ini = destino; jEdit.fin = (destino + d) % J_DIA; }
    }
    jPintarHoja();
  };
  svg.addEventListener("pointerup", soltar);
  svg.addEventListener("pointercancel", soltar);
}

/* La palomita es SIEMPRE la de Misiones (`PALOMITA`, en 04-misiones.js) y
   nunca el carácter «✓»: cada sistema lo dibuja a su manera —más fino, más
   alto, desalineado— y no casa con ningún otro icono de la app. Lo paró
   Eduardo al verlo aquí al lado de la lista de misiones. */
function jOpcion(v, tile, titulo, sub, sel, act) {
  return `<button type="button" class="jor-op" data-act="${act}" data-v="${escapeAttr(v)}" aria-pressed="${sel}">${tile}<span><span class="jor-op-t">${titulo}</span>${sub ? `<small>${sub}</small>` : ""}</span><span class="jor-ok">${sel ? PALOMITA : ""}</span></button>`;
}
function jTileDe(o) {
  return `<span class="jor-tile chico" style="background:${o.color ? pinta(o.color) : "var(--jor-libre)"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${jIconoDe(o)}</svg></span>`;
}
function jListaOpciones(act, actual) {
  return jCandidatos().map(([t, rot, lista]) =>
    `<h4 class="jor-grupo">${rot}</h4>` +
    lista.map(o => jOpcion(t + ":" + o.id, jTileDe(o), escapeHtml(o.name), "", !!actual && actual.t === t && actual.id === o.id, act)).join("")
  ).join("");
}
function jOpcionesDescanso(actual) {
  return `<h4 class="jor-grupo">${tx("Descanso")}</h4>` + Object.keys(J_DESCANSOS).map(k => {
    const d = J_DESCANSOS[k];
    const tile = `<span class="jor-tile chico descanso" style="background:${k === "dormir" ? "var(--jor-sueno)" : "var(--jor-descanso)"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d.icono}</svg></span>`;
    return jOpcion("descanso:" + k, tile, escapeHtml(tx(d.nombre)), tx("Sin tramos"), actual === k, "b-ref");
  }).join("");
}

/* Lo más largo que puede durar un foco: lo que falta de la actividad, y si no
   hay actividad, el tope de siempre. */
function jTopeFoco() {
  const r = jRestoDelObjetivo();
  return r ? Math.max(5, Math.min(180, r.resto)) : 90;
}
/* Reparte lo que queda en tramos enteros con sus descansos en medio. Prefiere
   tramos de 25 y baja de ahí; nunca propone menos de 10 min de foco, que es
   donde un tramo deja de ser un tramo. */
function jCuadrar(resto, desc) {
  if (!resto || resto < 10) return null;
  let mejor = null;
  for (let c = 1; c <= 8; c++) {
    const foco = Math.floor((resto - desc * (c - 1)) / c);
    if (foco < 10 || foco > 180) continue;
    const sobra = resto - (foco * c + desc * (c - 1));
    const lejos = Math.abs(foco - 25);
    if (!mejor || lejos < mejor.lejos || (lejos === mejor.lejos && sobra < mejor.sobra)) {
      mejor = { foco, ciclos: c, sobra, lejos };
    }
  }
  return mejor;
}
let jEditando = null;
function jPintarHoja() {
  const H = document.getElementById("jornada-hoja");
  if (!H) return;
  const j = jDatos(), cfg = j.cfg;
  const sw = (k, lbl, sub) => `<div class="jor-fila-aj"><span>${lbl}${sub ? `<small>${sub}</small>` : ""}</span><button type="button" class="jor-sw" role="switch" aria-checked="${!!cfg[k]}" data-act="sw" data-v="${k}" aria-label="${escapeAttr(lbl)}"></button></div>`;
  /* El lápiz abre el número para escribirlo a mano: los botones siguen yendo
     de cinco en cinco —que es el gesto rápido— y el lápiz da acceso a los
     impares y a lo que no es múltiplo de cinco, de uno en uno. Lo pidió
     Eduardo. `num` es el valor crudo que va al campo; `val` es cómo se lee. */
  const paso = (act, k, lbl, val, num, lapiz) => `<div class="jor-fila-aj"><span>${lbl}</span><span class="jor-paso">
    <button type="button" data-act="${act}" data-k="${k}" data-d="-1" aria-label="${escapeAttr(tx("Menos"))}">−</button>
    ${jEditando === k && lapiz
      ? `<input type="number" class="jor-num" data-num="${k}" value="${num}" min="${lapiz.min}" max="${lapiz.max}" step="1" inputmode="numeric" autofocus>`
      : `<output>${val}</output>`}
    <button type="button" data-act="${act}" data-k="${k}" data-d="1" aria-label="${escapeAttr(tx("Más"))}">+</button>
    ${lapiz ? `<button type="button" class="jor-lapiz-num" data-act="lapiz" data-k="${k}" aria-label="${escapeAttr(tx("Escribir el número"))}" title="${escapeAttr(T`Entre ${lapiz.min} y ${lapiz.max}`)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 10-4-4L4 16v4z"/></svg>
    </button>` : ""}
  </span></div>`;
  let h = "";
  if (jHoja === "ritmo") {
    const libre = cfg.preset === "libre";
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${tx("Ritmo")}</span><h3>${tx("¿Cómo quieres ir?")}</h3></div>
      <div class="jor-seg">${[["clasico", tx("Clásico")], ["profundo", tx("Profundo")], ["libre", tx("Libre")]].map(([k, n]) => `<button type="button" data-act="preset" data-v="${k}" aria-pressed="${cfg.preset === k}">${n}</button>`).join("")}</div>
      ${libre ? `<p class="jor-nota">${tx("Cuenta hacia arriba hasta que tú lo pares. El reloj se voltea solo cada 25 minutos.")}</p>` : `<div class="jor-filas">
        ${paso("paso", "foco", tx("Foco"), T`${cfg.foco} min`, cfg.foco, { min: 5, max: jTopeFoco() })}
        ${paso("paso", "desc", tx("Descanso"), T`${cfg.desc} min`, cfg.desc, { min: 1, max: 30 })}
        ${paso("paso", "ciclos", tx("Tramos"), cfg.ciclos, cfg.ciclos, { min: 1, max: 8 })}
      </div>
      ${(() => {
        /* El ritmo tiene que caber en lo que FALTA de la actividad, no en su
           total: un bloque de dos horas del que quedan veinte minutos no
           admite cuatro tramos de veinticinco. Se dice cuánto queda y se
           ofrece cuadrarlo de un toque; el tope del foco sale de ahí. */
        const r = jRestoDelObjetivo();
        if (!r) return "";
        const plan = jCuadrar(r.resto, cfg.desc);
        const cabe = cfg.foco * cfg.ciclos + cfg.desc * (cfg.ciclos - 1) <= r.resto;
        return `<p class="jor-nota${cabe ? "" : " error"}">${escapeHtml(r.dentro
          ? T`A «${jNombreBloque(r.bloque)}» le quedan ${jFmtDur(r.resto)}.`
          : T`«${jNombreBloque(r.bloque)}» dura ${jFmtDur(r.resto)}.`)}${cabe ? "" : " " + escapeHtml(tx("Tu ritmo no cabe ahí."))}</p>
        ${plan && (plan.foco !== cfg.foco || plan.ciclos !== cfg.ciclos)
          ? `<button type="button" class="btn btn-soft btn-block" data-act="cuadrar">${escapeHtml(T`Cuadrar: ${plan.ciclos} × ${plan.foco} min`)}</button>`
          : ""}`;
      })()}`}
      <div class="jor-filas">
        ${sw("auto", tx("Seguir solo"), tx("El siguiente tramo arranca sin tocar nada"))}
        ${sw("sonido", tx("Sonido"))}
        ${sw("notificar", tx("Avisarme fuera de la app"), tx("Con un aviso del sistema que dice qué pasó"))}
      </div>
      <button type="button" class="btn btn-primary btn-block" data-act="cerrar">${tx("Listo")}</button>`;
  } else if (jHoja === "enque") {
    const b = jBloqueEn(jAhora()), del = b && !b.descanso ? jRef(b.ref) : null;
    const reloj = `<span class="jor-tile chico sin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${J_ARENA}</svg></span>`;
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${tx("Enfocar en")}</span><h3>${tx("¿En qué?")}</h3></div>
      <div class="jor-ops">
        ${jOpcion("auto", reloj, tx("Lo que toca ahora"), del ? escapeHtml(del.nombre) : tx("No hay nada a esta hora"), jEleccion === undefined, "elegir")}
        ${jListaOpciones("elegir", jEleccion || null)}
        ${jOpcion("none", reloj, tx("Sin vincular"), tx("Solo queda en tu registro"), jEleccion === null, "elegir")}
      </div>`;
  } else if (jHoja === "bloque") {
    const e = jEdit, d = ((e.fin - e.ini + J_DIA) % J_DIA) || J_DIA;
    const otro = jChoca(e.ini, e.fin, e.id);
    const r = jRef(e.ref);
    const auto = e.descanso ? tx((J_DESCANSOS[e.descanso] || J_DESCANSOS.dormir).nombre) : (r ? r.nombre : tx("Bloque libre"));
    const propio = (e.nombre || "").trim();
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${e.id ? tx("Bloque") : tx("Nuevo bloque")}</span><h3 id="jor-b-titulo">${escapeHtml(propio || auto)}</h3></div>
      ${jPreviaRueda()}
      <div class="jor-campo">
        <label for="jor-b-nombre">${tx("Cómo se llama")}</label>
        <input type="text" id="jor-b-nombre" data-in="nombre" maxlength="40" autocomplete="off" value="${escapeAttr(e.nombre || "")}" placeholder="${escapeAttr(auto)}">
      </div>
      <div class="jor-filas">
        ${paso("b-hora", "ini", tx("Empieza"), jH12(e.ini))}
        ${paso("b-hora", "fin", tx("Acaba"), jH12(e.fin))}
      </div>
      ${otro ? `<p class="jor-nota error">${escapeHtml(T`Se encima con «${jNombreBloque(otro)}». Muévelo o acórtalo.`)}</p>` : `<p class="jor-nota">${escapeHtml(T`Dura ${jFmtDur(d)}.`)}</p>`}
      <div class="jor-grupo-p"><p>${tx("Color")}</p><div class="jor-colores">
        <button type="button" class="jor-color auto" data-act="b-color" data-v="" aria-pressed="${!e.color}">${tx("Automático")}</button>
        ${COLORS.map(c => `<button type="button" class="jor-color" data-act="b-color" data-v="${c}" aria-pressed="${e.color === c}" style="background:${pinta(c)}" aria-label="${c}"></button>`).join("")}
      </div></div>
      <div class="jor-ops alto">${jOpcionesDescanso(e.descanso)}${jListaOpciones("b-ref", e.descanso ? null : e.ref)}</div>
      <button type="button" class="btn btn-primary btn-block" data-act="b-guardar" ${otro || (!e.descanso && !r && !propio) ? "disabled" : ""}>${tx("Guardar")}</button>
      ${e.id ? `<button type="button" class="btn btn-danger-ghost btn-block" data-act="b-quitar">${jQuitando ? tx("Toca otra vez para quitarlo") : tx("Quitar de la rueda")}</button>` : ""}`;
  } else if (jHoja === "vincular") {
    if (!jVinc) { cerrarHojaJornada(); return; }
    const fila = (grupo, d) => jOpcion(grupo + ":" + d,
      `<span class="jor-tile chico sin">${tx(J_LETRAS[d])}</span>`,
      escapeHtml(jNombreDia(d)), escapeHtml(jResumenDia(d)), jVinc.elegido[grupo] === d, "v-elige");
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${tx("Vincular")}</span><h3>${tx("¿Con cuál rutina te quedas?")}</h3></div>
      <p class="jor-nota">${tx("Vincular deja una rutina para los cinco días hábiles y otra para el fin de semana. Los días que no elijas se sobrescriben, y desvincular después no lo deshace.")}</p>
      ${jVinc.falta.indexOf("semana") >= 0 ? `<div class="jor-grupo-p"><p>${tx("Entre semana")}</p><div class="jor-ops">${[1, 2, 3, 4, 5].map(d => fila("semana", d)).join("")}</div></div>` : ""}
      ${jVinc.falta.indexOf("finde") >= 0 ? `<div class="jor-grupo-p"><p>${tx("Fin de semana")}</p><div class="jor-ops">${[6, 0].map(d => fila("finde", d)).join("")}</div></div>` : ""}
      <button type="button" class="btn btn-aviso btn-block" data-act="v-ok">${tx("Vincular y sobrescribir")}</button>
      <button type="button" class="btn btn-ghost btn-block" data-act="v-no">${tx("Mejor no")}</button>`;
  } else if (jHoja === "cierre") {
    const run = j.run;
    if (!run || run.fase !== "cierre") { cerrarHojaJornada(); return; }
    const r = jRef(run.ref);
    const ef = jEfecto(run.ref, run.min, jRespuesta === "si");
    const pregunta = r && r.t === "mision" && !missionDone(r.o, todayKey());
    const ultimo = !run.libre && run.tramo >= cfg.ciclos;
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${run.libre ? tx("Enfoque libre") : escapeHtml(T`Tramo ${run.tramo} de ${cfg.ciclos}`)}</span><h3>${escapeHtml(T`${run.min} min de foco`)}</h3></div>
      <div class="jor-efecto"><svg viewBox="0 0 24 24"><path d="M5 17l5-5 3 3 6-7"/><path d="M15 8h4v4"/></svg><div>${escapeHtml(ef.t)}${ef.s ? `<small>${escapeHtml(ef.s)}</small>` : ""}</div></div>
      ${pregunta ? `<div class="jor-grupo-p"><p>${tx("¿La terminaste?")}</p><div class="jor-seg"><button type="button" data-act="sino" data-v="si" aria-pressed="${jRespuesta === "si"}">${tx("Sí")}</button><button type="button" data-act="sino" data-v="no" aria-pressed="${jRespuesta === "no"}">${tx("Todavía no")}</button></div></div>` : ""}
      <div class="jor-grupo-p"><p>${tx("¿Cómo te fue?")}</p><div class="jor-animo">${[[1, tx("Disperso")], [2, tx("Bien")], [3, tx("Muy enfocado")]].map(([v, t]) => `<button type="button" data-act="animo" data-v="${v}" aria-pressed="${jAnimo === v}"><span class="d">${[1, 2, 3].map(i => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span>${t}</button>`).join("")}</div></div>
      <button type="button" class="btn btn-primary btn-block" data-act="guardar" data-v="1">${run.libre ? tx("Guardar") : ultimo ? tx("Guardar y terminar") : escapeHtml(T`Descansar ${cfg.desc} min`)}</button>
      ${run.libre || ultimo ? "" : `<button type="button" class="btn btn-ghost btn-block" data-act="guardar" data-v="0">${tx("Seguir sin descanso")}</button>`}`;
  }
  H.innerHTML = h;
  if (jHoja === "bloque") jEngancharPrevia(document.getElementById("jor-previa-svg"));
}

function jClickHoja(e) {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v, j = jDatos(), cfg = j.cfg;
  if (a === "cerrar") { cerrarHojaJornada(); jPintar(); return; }
  if (a === "preset") {
    cfg.preset = v;
    if (J_PRESETS[v]) Object.assign(cfg, J_PRESETS[v]);
    if (j.run && j.run.fase === "listo" && !j.run.lite) j.run.dur = cfg.foco * J_MS;
    save();
  }
  if (a === "lapiz") { jEditando = jEditando === b.dataset.k ? null : b.dataset.k; jPintarHoja(); return; }
  if (a === "cuadrar") {
    const r = jRestoDelObjetivo(), plan = r && jCuadrar(r.resto, cfg.desc);
    if (plan) {
      cfg.foco = plan.foco; cfg.ciclos = plan.ciclos;
      if (j.run && j.run.fase === "listo" && !j.run.lite) j.run.dur = cfg.foco * J_MS;
      save();
    }
    jEditando = null; jPintarHoja(); jPintarControles(); return;
  }
  if (a === "paso") {
    const k = b.dataset.k, salto = { foco: 5, desc: 1, ciclos: 1 }[k];
    /* El tope del foco ya no es fijo: es lo que falta de la actividad a la que
       vas a enfocar, o 90 si no hay ninguna. */
    const lim = { foco: [5, jTopeFoco()], desc: [1, 30], ciclos: [1, 8] }[k];
    cfg[k] = Math.min(lim[1], Math.max(lim[0], cfg[k] + salto * Number(b.dataset.d)));
    if (j.run && j.run.fase === "listo" && !j.run.lite) j.run.dur = cfg.foco * J_MS;
    save();
  }
  if (a === "sw") {
    cfg[v] = !cfg[v];
    /* El permiso se pide al ENCENDER el interruptor, que es un gesto tuyo: pedirlo
       al abrir la pantalla es el cuadro que todo el mundo cierra sin leer. */
    if (v === "notificar" && cfg.notificar && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(p => {
        if (p !== "granted") { cfg.notificar = false; save(); jPintarHoja(); toast(tx("Sin permiso para avisar: el navegador lo tiene bloqueado"), "atencion"); }
      });
    }
    save();
  }
  if (a === "elegir") {
    jEleccion = v === "auto" ? undefined : v === "none" ? null : { t: v.split(":")[0], id: v.split(":").slice(1).join(":") };
    cerrarHojaJornada(); jPintar(); return;
  }
  if (a === "v-elige") {
    const [g, d] = v.split(":");
    jVinc.elegido[g] = Number(d);
    jPintarHoja(); return;
  }
  if (a === "v-ok") { jAplicarVinculo(); return; }
  if (a === "v-no") { jVinc = null; cerrarHojaJornada(); jPintar(); return; }
  if (a === "b-ref") {
    const t = v.split(":")[0], id = v.split(":").slice(1).join(":");
    if (t === "descanso") { jEdit.descanso = id; jEdit.ref = null; }
    else { jEdit.descanso = null; jEdit.ref = { t, id }; }
  }
  if (a === "b-color") jEdit.color = v || null;
  if (a === "b-hora") {
    const k = b.dataset.k, n = (jEdit[k] + 15 * Number(b.dataset.d) + J_DIA) % J_DIA;
    const d = k === "ini" ? (jEdit.fin - n + J_DIA) % J_DIA : (n - jEdit.ini + J_DIA) % J_DIA;
    if (d >= 15) jEdit[k] = n;
  }
  if (a === "b-guardar") {
    if (!jGuardarBloque()) return;
    cerrarHojaJornada(); jPintar(); return;
  }
  if (a === "b-quitar") {
    if (!jQuitando) { jQuitando = true; jPintarHoja(); return; }
    j.rutinas[jDiaVisto()] = jBloques().filter(x => x.id !== jEdit.id);
    jSelId = null; save(); jApuntarPlan(); cerrarHojaJornada(); jPintar(); return;
  }
  if (a === "sino") jRespuesta = v;
  if (a === "animo") jAnimo = Number(v);
  if (a === "guardar") { jGuardar(v === "1"); return; }
  jPintarHoja(); jPintarControles();
}

/* Escribir el nombre NO vuelve a pintar la hoja: rehacerla en cada tecla le
   quita el foco al campo a media palabra. Se toca a mano lo poco que depende
   de él, que es el título de arriba y si ya se puede guardar. */
function jInputHoja(ev) {
  /* El número escrito a mano va de uno en uno y se recorta a su rango: el
     máximo del foco es lo que falta de la actividad, así que no se puede pedir
     un tramo que no cabe. Se aplica al escribir, no al salir del campo: salir
     tocando otra cosa perdería lo escrito. */
  const num = ev.target.closest("[data-num]");
  if (num) {
    const j = jDatos(), cfg = j.cfg, k = num.dataset.num;
    const lim = { foco: [5, jTopeFoco()], desc: [1, 30], ciclos: [1, 8] }[k];
    const v = Math.round(Number(num.value));
    if (!isNaN(v) && v >= lim[0] && v <= lim[1]) {
      cfg[k] = v;
      if (j.run && j.run.fase === "listo" && !j.run.lite) j.run.dur = cfg.foco * J_MS;
      save(); jPintarControles();
    }
    return;
  }
  const el = ev.target.closest("[data-in]");
  if (!el || jHoja !== "bloque") return;
  jEdit.nombre = el.value;
  const t = document.getElementById("jor-b-titulo");
  if (t) t.textContent = el.value.trim() || el.placeholder;
  const g = document.querySelector("#jornada-hoja [data-act='b-guardar']");
  if (g) g.disabled = !!jChoca(jEdit.ini, jEdit.fin, jEdit.id) || (!jEdit.descanso && !jRef(jEdit.ref) && !el.value.trim());
}

function jClickControles(e) {
  const btn = e.target.closest("button[data-a]");
  if (!btn || btn.disabled) return;
  const a = btn.dataset.a, j = jDatos();
  if (a === "enque") return jAbrirHoja("enque");
  if (a === "ritmo") return jAbrirHoja("ritmo");
  if (a === "nuevo") return jAbrirBloque(null);
  if (a === "iniciar") return jIniciar();
  if (a === "dormir") return jBuenasNoches();
  if (a === "despertar") return jBuenosDias(btn);
  if (a === "forzar") { const b = jBloqueEn(jAhora()); jForzado = b ? b.id : null; jPintar(); return; }
  if (a === "hf-modo") { jHfCfg().hfModo = btn.dataset.v; save(); jPintar(); return; }
  if (a === "hf-paso") {
    const c = jHfCfg(), h = c.hf[c.hfModo], k = btn.dataset.k, d = Number(btn.dataset.d);
    /* Los minutos de descanso van de uno en uno hasta diez y luego de cinco:
       entre 3 y 4 minutos hay una diferencia; entre 43 y 44, no. */
    const salto = k === "foco" ? 5 : k === "rondas" ? 1 : (d > 0 ? (h.desc >= 10 ? 5 : 1) : (h.desc > 10 ? 5 : 1));
    const lim = { foco: [5, 180], desc: [1, 60], rondas: [1, 12] }[k];
    h[k] = Math.min(lim[1], Math.max(lim[0], h[k] + salto * d));
    save(); jPintar(); return;
  }
  if (a === "hf-nombre") {
    const m = btn.dataset.v;
    askText(tx("¿Cómo quieres llamarlo?"), jHfNombre(m), tx("Guardar"), tx("Déjalo vacío para volver al nombre de siempre."), 24).then(t => {
      if (t === null) return;
      const c = jHfCfg();
      if (t) c.hfNombres[m] = t; else delete c.hfNombres[m];
      save(); jPintar();
    });
    return;
  }
  if (a === "lite-go") return jIniciarLite();
  if (!j.run) return;
  if (a === "pausa") jPausa();
  if (a === "terminar") jTerminarLibre();
  if (a === "abandonar") jAbandonar();
  if (a === "lite-parar") jPararLite();
  if (a === "hf-reiniciar") jReiniciarFaseLite();
  if (a === "hf-saltar") jSaltarFaseLite();
  if (a === "saltar") { if (j.run.lite) jSaltarLite(); else jSiguiente(); }
  if (a === "cierre") jAbrirHoja("cierre");
  if (a === "fin") { j.run = null; jEleccion = undefined; save(); jPintar(); }
}

function jClickLista(e) {
  const f = e.target.closest(".jor-fila");
  if (f) { jSelId = f.dataset.id; jPintarRueda(); jPintarLista(); jAbrirBloque(f.dataset.id); return; }
  const ac = e.target.closest("[data-acomodar]");
  if (ac) jAcomodar("mision", ac.dataset.acomodar);
}

/* ---------- El enlace que lo enciende ---------- */
function jornadaDesdeEnlace() {
  jMigrarInterruptor();
  let q = null;
  try {
    const p = new URLSearchParams(location.search);
    q = p.get("jornada") || p.get("pomodoro");
  } catch (e) { return; }
  if (q !== "1" && q !== "0") return;
  state.ui = state.ui || {};
  const off = new Set(state.ui.modulosOff || []);
  if (q === "1") off.delete("jornada"); else off.add("jornada");
  state.ui.modulosOff = [...off];
  save();
  /* Se quita de la dirección para que recargar no lo vuelva a aplicar encima
     de lo que hayas cambiado después en Ajustes. */
  try {
    const u = new URL(location.href);
    u.searchParams.delete("jornada"); u.searchParams.delete("pomodoro");
    history.replaceState(history.state, "", u.pathname + u.search + u.hash);
  } catch (e) { /* se queda en la dirección, sin más */ }
  setTimeout(() => toast(q === "1" ? tx("Pomodoro encendido: ya está en tu menú") : tx("Pomodoro apagado"), q === "1" ? "hecho" : "deshecho"), 900);
}

/* Se llama una vez desde el arranque. Los clics van por delegación sobre
   contenedores que no se rehacen, así que no hay que volver a engancharlos. */
function iniciarRelojJornada() {
  const hoja = document.getElementById("jornada-hoja");
  if (hoja) { hoja.addEventListener("click", jClickHoja); hoja.addEventListener("input", jInputHoja); }
  const cont = document.getElementById("jornada-content");
  if (cont) {
    cont.addEventListener("click", e => {
      const md = e.target.closest("[data-modo]");
      if (md) { if (md.dataset.modo !== jModo()) jPonerModo(md.dataset.modo); return; }
      const bien = e.target.closest("[data-jbien]");
      if (bien) {
        if (bien.dataset.jbien === "iniciar") jIniciar(); else jAbrirBloque(null);
        return;
      }
      const dia = e.target.closest("[data-jdia]");
      if (dia) {
        jDiaSel = Number(dia.dataset.jdia);
        jSelId = null; cerrarHojaJornada(); renderJornada();
        return;
      }
      if (e.target.closest("[data-jdias-mas]")) { jDiasAbierto = !jDiasAbierto; jPintarDias(); return; }
      if (e.target.closest("[data-jvinculo]")) return jTocarVinculo();
      if (e.target.closest("#jor-controles")) jClickControles(e);
      else if (e.target.closest(".jor-lista")) jClickLista(e);
    });
  }
  setInterval(jPaso, 250);
  document.addEventListener("visibilitychange", () => { jPaso(); if (!document.hidden) jMostrarPendientes(); });
}
