/* El motor de los informes: qué pasó en un periodo y cómo se compara con el
 * anterior.
 *
 * Por qué existe, en una frase: los cuatro paneles grandes cuentan lo que
 * TIENES —«12.400 XP», «8 etapas hechas»— y ninguno cuenta cómo VAS. Un
 * número sin con qué compararlo no informa, decora; y la app llevaba meses
 * guardando la historia entera sin usarla para nada.
 *
 * Este archivo solo calcula. No dibuja pantallas, no toca `state` y no
 * ejecuta nada al cargarse: quien quiera un dato lo pide cuando va a pintar.
 * Esa separación es a propósito — la pantalla de informes (fase 2) y las
 * flechas de los paneles (fase 1) tienen que leer exactamente los mismos
 * números, o acabarán discutiendo entre ellas delante del usuario.
 *
 * Todo se cuenta sobre claves de día "AAAA-MM-DD" en la zona del perfil, que
 * es la unidad en la que la app ya piensa (ver `todayKey`).
 */

/* ================= Periodos =================

   Tres, y son los que ya estaban escritos en `LIMITES` desde antes de que
   existiera ninguna pantalla que los enseñara. */

const PERIODOS = {
  semana: { nombre: "Semana", corto: "la semana" },
  mes: { nombre: "Mes", corto: "el mes" },
  ano: { nombre: "Año", corto: "el año" }
};

/* La semana va de DOMINGO a SÁBADO. No es una preferencia: es la que ya usa
   la tira de la racha (`streakInfo`), y dos semanas distintas en la misma app
   harían que el informe y la racha se contradijeran en los bordes. */
function rangoDe(periodo, atras) {
  const n = atras || 0;
  const hoy = todayKey();

  if (periodo === "mes") {
    const [y, m] = hoy.split("-").map(Number);
    const meses = y * 12 + (m - 1) - n;
    const yy = Math.floor(meses / 12);
    const mm = (meses % 12) + 1;
    const desde = `${yy}-${String(mm).padStart(2, "0")}-01`;
    /* El día 0 del mes siguiente es el último del actual: evita tener que
       acordarse de febrero y de los años bisiestos. */
    const fin = new Date(Date.UTC(yy, mm, 0));
    return { periodo, desde, hasta: fin.toISOString().slice(0, 10) };
  }

  if (periodo === "ano") {
    const y = Number(hoy.slice(0, 4)) - n;
    return { periodo, desde: `${y}-01-01`, hasta: `${y}-12-31` };
  }

  const inicio = addDaysKey(hoy, -weekdayOfKey(hoy) - 7 * n);
  return { periodo: "semana", desde: inicio, hasta: addDaysKey(inicio, 6) };
}

/* La ventana rodante del PANEL, que no es la misma cosa que un periodo del
   informe y por eso tiene su propia función. Arriba se compara «los últimos
   siete días» contra «los siete anteriores», no «esta semana» contra «la
   pasada»: en lunes, la semana natural lleva un día de vida y cualquier
   comparación con ella sería una caída del 85% que no significa nada. */
function ventanaDe(dias, atras) {
  const hasta = addDaysKey(todayKey(), -dias * (atras || 0));
  return { periodo: "ventana", dias, desde: addDaysKey(hasta, -(dias - 1)), hasta };
}

function enRango(key, r) {
  return !!key && key >= r.desde && key <= r.hasta;
}

/* Los días de un rango, del primero al último. Se corta en hoy: contar el
   futuro como días vacíos hundiría cualquier promedio del mes en curso. */
function diasDe(r) {
  const out = [];
  const tope = r.hasta < todayKey() ? r.hasta : todayKey();
  let k = r.desde;
  let guard = 400;
  while (k <= tope && guard-- > 0) { out.push(k); k = addDaysKey(k, 1); }
  return out;
}

/* Un sello de tiempo ("2026-08-27T21:14:03.120Z") al día del perfil. No vale
   cortar los diez primeros caracteres: eso da el día en UTC, y para quien
   vive en México una etapa cerrada a las 7 de la tarde caería en el día
   siguiente. */
function diaDeSello(at) {
  if (!at) return null;
  const d = new Date(at);
  return isNaN(d.getTime()) ? null : todayKey(d);
}

/* ================= Misiones ================= */

/* De dónde sale cada cosa:
   - `marcas`: cada vez que se marcó algo, aunque la misión pidiera tres al día.
   - `completas` / `tocaban`: días-misión en los que TOCABA y quedó cumplida.
     Las de una sola vez quedan fuera de esa cuenta a propósito: no «tocan» un
     día concreto, así que meterlas hundiría la constancia de quien tiene
     muchos pendientes sueltos sin haber fallado a nada.
   - `porHora`: solo las marcas que llevan hora. Las de antes del 27 de agosto
     de 2026 no la llevan y no se pueden inventar. */
function metricasMisiones(r) {
  const dias = diasDe(r);
  const m0 = { marcas: 0, tocaban: 0, completas: 0, porHora: new Array(24).fill(0), porDiaSemana: new Array(7).fill(0), conHora: 0 };

  for (const m of state.missions) {
    for (const k of dias) {
      if (m.createdAt && k < m.createdAt) continue;
      const n = missionCount(m, k);
      m0.marcas += n;
      if (n) m0.porDiaSemana[weekdayOfKey(k)] += n;

      const marcas = (m.log && Array.isArray(m.log[k])) ? m.log[k] : [];
      for (const x of marcas) {
        const h = horaDeMarca(x);
        if (h) { m0.porHora[Number(h.slice(0, 2))]++; m0.conHora++; }
      }

      /* HOY no se juzga, y por eso se salta: el día sigue en marcha. Con hoy
         dentro, una cuenta recién creada a las ocho de la tarde veía
         «Constancia 0%» antes de haber tenido ocasión de fallar a nada —el
         único número del panel que la estaba regañando por existir—. Las
         marcas del día sí cuentan, arriba: eso es lo que hiciste, no una nota.

         La partida se cierra cuando el día termina, no mientras se juega. */
      if (k !== todayKey() && m.cadence !== "once" && missionScheduledOn(m, k)) {
        m0.tocaban++;
        if (missionDone(m, k)) m0.completas++;
      }
    }
  }
  /* null y no 0 cuando no tocaba nada: son cosas distintas y se dicen
     distinto. Cero por ciento es haber fallado; nada que hacer no es fallar. */
  m0.constancia = m0.tocaban ? Math.round(m0.completas / m0.tocaban * 100) : null;
  return m0;
}

/* ================= Habilidades ================= */

/* El origen de un movimiento. `fuente` se guarda como "Misión · Correr", así
   que la familia es lo que va antes del punto medio. Los movimientos de antes
   de que existiera el campo no lo llevan; ésos y los registros a mano son la
   misma cosa para quien mira la gráfica: puntos que pusiste tú. */
function familiaDeFuente(e) {
  const f = String(e.fuente || "");
  if (/^Misión/.test(f)) return "misiones";
  if (/^Talento/.test(f)) return "talentos";
  if (/^Proyecto/.test(f)) return "proyectos";
  if (f === "Sistema") return "sistema";
  return "practica";
}

function metricasHabilidades(r) {
  const out = {
    ganada: 0, perdida: 0, minutos: 0, niveles: 0, sesiones: 0,
    porFuente: { misiones: 0, talentos: 0, proyectos: 0, practica: 0 },
    porHabilidad: new Map()
  };

  for (const s of state.skills) {
    let enPeriodo = 0;   // lo que se movió dentro del rango
    let despues = 0;     // lo que se movió DESPUÉS del rango

    for (const e of s.log) {
      const xp = Number(e.xp) || 0;
      if (e.date > r.hasta) { despues += xp; continue; }
      if (!enRango(e.date, r)) continue;

      enPeriodo += xp;
      if (xp >= 0) {
        out.ganada += xp;
        out.sesiones++;
        out.minutos += Number(e.min) || 0;
        const fam = familiaDeFuente(e);
        if (fam !== "sistema") out.porFuente[fam] += xp;
      } else {
        out.perdida += -xp;
        /* Un negativo CON fuente no es desgaste: es una vuelta atrás —reabrir
           un encargo, deshacer un talento, descumplir una misión— y tiene que
           descontarse de la MISMA familia que lo dio. Sin esto, cerrar y
           reabrir el mismo encargo tres veces dejaba «300 XP de proyectos» en
           el reparto cuando lo ganado de verdad era cero: `neta` salía bien y
           el desglose mentía, que es peor que fallar en los dos.

           El desgaste por inactividad no lleva fuente (ver `applyDecay`) y por
           eso se queda solo en `perdida`: no viene de ninguna parte, así que no
           hay a quién restárselo. Esa es justo la diferencia que decide. */
        if (e.fuente) {
          const famNeg = familiaDeFuente(e);
          if (famNeg !== "sistema") out.porFuente[famNeg] += xp;   // xp ya es negativo
        }
      }
    }

    if (enPeriodo) out.porHabilidad.set(s.id, (out.porHabilidad.get(s.id) || 0) + enPeriodo);

    /* Niveles subidos DENTRO del rango, y por eso se calcula hacia atrás en
       vez de mirar el nivel de ahora: `s.xp` es el total de hoy, así que para
       un mes pasado hay que descontar primero todo lo que vino después. Es la
       única forma de que el informe de julio siga diciendo lo mismo en
       diciembre. */
    const xpFinal = Math.max(0, s.xp - despues);
    const xpInicial = Math.max(0, xpFinal - enPeriodo);
    out.niveles += Math.max(0, levelInfo(xpFinal).level - levelInfo(xpInicial).level);
  }

  out.neta = out.ganada - out.perdida;
  return out;
}

/* ================= Talentos ================= */

/* El día en que un talento se cobró. Una compra se paga al asegurarla y una
   meta al abrir su plan, así que no hay un solo campo que lo diga: se toma el
   que exista, y en ese orden. Es una aproximación y se dice aquí para que
   nadie la lea después como si fuera un dato exacto. */
function diaDeInversion(p) {
  return p.startDate || p.completedAt || p.createdAt || null;
}

function metricasTalentos(r) {
  const out = { invertido: 0, completados: 0, abiertos: 0, vencidos: 0, invertidoPorRama: new Map() };

  for (const p of state.perks) {
    const dia = diaDeInversion(p);
    if ((p.cost > 0) && enRango(dia, r)) {
      out.invertido += p.cost;
      const rama = p.branch || "General";
      out.invertidoPorRama.set(rama, (out.invertidoPorRama.get(rama) || 0) + p.cost);
    }
    if (enRango(p.completedAt, r)) out.completados++;
    if (enRango(p.startDate, r)) out.abiertos++;
    /* Vencido: se le acabó el plazo dentro del rango y a día de hoy sigue sin
       completarse. No es lo mismo que «va tarde»: eso se mira en el panel. */
    if (p.status === "active" && enRango(p.endDate, r) && p.endDate < todayKey()) out.vencidos++;
  }
  return out;
}

/* Los que se vencen dentro de `dias` días contando desde hoy. Es dato de
   panel, no de informe: contesta «¿qué tengo que mirar ya?». */
function talentosPorVencer(dias) {
  const tope = addDaysKey(todayKey(), dias);
  return state.perks.filter(p => p.status === "active" && p.endDate && p.endDate >= todayKey() && p.endDate <= tope);
}

/* ================= Proyectos ================= */

function metricasProyectos(r) {
  const out = { etapas: 0, terminados: 0, soltados: 0, creados: 0 };

  for (const pr of state.projects) {
    for (const s of (pr.steps || [])) {
      if (s.done && enRango(diaDeSello(s.at), r)) out.etapas++;
    }
    if (enRango(pr.createdAt, r)) out.creados++;
    /* Un proyecto no guarda cuándo se descartó, solo su estado de ahora; para
       terminados sí hay fecha. Así que «soltados» se cuenta por su última
       actividad, que es cuando se tocó por última vez — y es lo más honesto
       que se puede decir sin inventar un campo nuevo. */
    if (pr.status === "done" && enRango(pr.completedAt || pr.lastActivity, r)) out.terminados++;
    if (pr.status === "dropped" && enRango(pr.lastActivity, r)) out.soltados++;
  }
  return out;
}

/* ================= La comparación =================

   Lo que convierte cuatro cifras muertas en cuatro señales. Devuelve una
   dirección y un texto corto; quien pinta decide el color.

   `dir: "nueva"` no es un empate ni un fallo: es una cuenta recién creada,
   que no tiene periodo anterior con el que compararse. Sale en gris y sin
   flecha — enseñar una caída del 100% a alguien que acaba de entrar sería
   la peor primera impresión posible. */
function variacion(ahora, antes, opciones) {
  const op = opciones || {};
  const a = Number(ahora) || 0;
  const b = Number(antes);

  if (antes === null || antes === undefined || isNaN(b)) return { dir: "nueva", txt: "" };
  if (a === b) {
    /* Dos ceros seguidos no son un empate: no ha pasado nada, y decir «igual
       que la semana pasada» debajo de un cero es contar dos veces la misma
       nada. Se calla. */
    if (a === 0) return { dir: "nueva", txt: "" };
    /* Y cuando sí hubo algo, un signo igual y nada más: son cuatro columnas
       repartiéndose el ancho de un teléfono, y «sin cambio» se partía en dos
       renglones o se cortaba a la mitad. */
    return { dir: "igual", txt: "=" };
  }

  const dif = a - b;
  const sube = dif > 0;
  /* Hay números donde subir es malo: días sin avance, XP perdida. La flecha
     apunta a donde va el número; el color lo decide `bueno`. */
  const bueno = op.invertido ? !sube : sube;
  const cuanto = op.dinero ? money(Math.abs(dif)) : fmtNumero(Math.abs(dif));

  return {
    dir: bueno ? "mejor" : "peor",
    flecha: sube ? "▲" : "▼",
    txt: (sube ? "▲ " : "▼ ") + cuanto + (op.unidad ? " " + op.unidad : ""),
    dif
  };
}

/* Miles con separador, sin decimales. `fmtXp` ya existe pero abrevia a "1.2k",
   que en una flecha de comparación se lee peor que el número entero. */
function fmtNumero(n) {
  return new Intl.NumberFormat("es-MX").format(Math.round(n));
}

/* El HTML de una flecha, para el renglón de una estadística del panel.
   `titulo` es lo que se lee al dejar el dedo encima: la flecha dice cuánto,
   el título dice contra qué — sin él, «▲ 4» no significa nada. */
function flechaHTML(v, titulo) {
  if (!v || v.dir === "nueva") return "";
  const clase = v.dir === "igual" ? "igual" : (v.dir === "mejor" ? "mejor" : "peor");
  return `<i class="sh-var ${clase}" title="${escapeAttr(titulo || "")}">${escapeHtml(v.txt)}</i>`;
}

/* ================= La prueba con enlace =================

   Las flechas cambian los cuatro paneles de la app a la vez, y qué número
   merece estar arriba lo decide Eduardo, no yo. Así que se sube apagado: la
   pestaña entra en modo prueba con `?informes=si` y sale con `?informes=no`.
   El interruptor se lee en el script de arriba de index.html —ahí y no aquí,
   o se vería el panel viejo un instante antes de cambiar—. */
function pruebaInformes() {
  return document.documentElement.classList.contains("informes");
}

/* ================= Los cuatro huecos del panel =================

   Una función por módulo, y todas devuelven lo mismo: la lista de
   estadísticas que `sectionHero` sabe pintar, con su flecha ya puesta.

   La regla que decide qué entra: **al panel solo sube un número si puede
   cambiar lo que haces en los próximos diez minutos.** Por eso se caen de
   aquí «XP total» y «Etapas hechas» —acumulados que solo suben y no piden
   nada— y suben en su lugar los del periodo, que sí se mueven.

   El número es del periodo y la flecha lo compara con el anterior. Mezclar
   las dos cosas —un total histórico con una flecha de la semana— es la forma
   más rápida de que alguien lea mal su propio progreso. */

const PANEL_DIAS = 7;
const CONTRA = "frente a los " + PANEL_DIAS + " días anteriores";

/* Los dos periodos del panel, calculados una vez por dibujo. */
function ventanasPanel() {
  return { a: ventanaDe(PANEL_DIAS, 0), b: ventanaDe(PANEL_DIAS, 1) };
}

function statsPanelMisiones(ctx) {
  const { a, b } = ventanasPanel();
  const m = metricasMisiones(a), p = metricasMisiones(b);
  const rachas = streakInfo();

  /* «Récord» y no una flecha: una racha no se compara con la de la semana
     pasada —es la misma cuenta, solo más larga—, se compara con tu mejor. */
  const record = rachas.cur > 0 && rachas.cur >= rachas.best
    ? `<i class="sh-var mejor" title="Es la racha más larga que has tenido">récord</i>` : "";

  return [
    { n: ctx.due.length, t: "Hoy" },
    { n: m.marcas, t: `Cumplidas · ${PANEL_DIAS} días`, tone: "mint",
      d: flechaHTML(variacion(m.marcas, p.marcas), `Marcas de misión ${CONTRA}`) },
    /* Un guion y no un cero cuando no tocaba nada: cero por ciento es haber
       fallado, y no tener nada que hacer no es fallar. */
    { n: m.constancia === null ? "—" : m.constancia + "%", t: "Constancia",
      d: flechaHTML(variacion(m.constancia, p.constancia, { unidad: "pts" }), `Cumplidas de las que tocaban, ${CONTRA}`) },
    { n: rachas.cur, t: "Racha", d: record }
  ];
}

function statsPanelHabilidades(ctx) {
  const { a, b } = ventanasPanel();
  const m = metricasHabilidades(a), p = metricasHabilidades(b);

  return [
    { n: state.skills.length, t: "Habilidades" },
    { n: fmtXp(m.ganada), t: `XP · ${PANEL_DIAS} días`, tone: "mint",
      d: flechaHTML(variacion(m.ganada, p.ganada, { unidad: "XP" }), `XP ganada ${CONTRA}`) },
    { n: m.niveles, t: "Niveles subidos",
      d: flechaHTML(variacion(m.niveles, p.niveles), `Niveles subidos ${CONTRA}`) },
    /* Sin flecha a propósito: no es un resultado del periodo, es una alarma
       de ahora mismo. Compararla con la semana pasada invitaría a leerla como
       «voy mejorando» cuando lo único que importa es que hay algo cayéndose. */
    { n: ctx.decaying, t: "Decayendo", tone: ctx.decaying ? "fire" : "" }
  ];
}

function statsPanelTalentos(ctx) {
  const { a, b } = ventanasPanel();
  const m = metricasTalentos(a), p = metricasTalentos(b);
  const vencen = talentosPorVencer(PANEL_DIAS).length;

  return [
    { n: ctx.activeN, t: "En curso", tone: ctx.activeN ? "fire" : "" },
    { n: m.completados, t: `Asegurados · ${PANEL_DIAS} días`, tone: "mint",
      d: flechaHTML(variacion(m.completados, p.completados), `Talentos asegurados ${CONTRA}`) },
    { n: money(m.invertido), t: `Invertido · ${PANEL_DIAS} días`,
      d: flechaHTML(variacion(m.invertido, p.invertido, { dinero: true }), `Invertido ${CONTRA}`) },
    /* «Por vencer» y no «Vencen esta semana»: medido a 375 px, el rótulo
       largo se partía en TRES renglones y dejaba esa columna más alta que las
       otras tres. Lo que se pierde —el plazo— lo dice el foco de abajo. */
    { n: vencen, t: "Por vencer", tone: vencen ? "coral" : "" }
  ];
}

function statsPanelProyectos(ctx) {
  const { a, b } = ventanasPanel();
  const m = metricasProyectos(a), p = metricasProyectos(b);

  return [
    { n: ctx.live.length, t: "Vivos", tone: "mint" },
    { n: ctx.stalled.length, t: "Estancados", tone: ctx.stalled.length ? "coral" : "" },
    { n: m.etapas, t: `Etapas · ${PANEL_DIAS} días`,
      d: flechaHTML(variacion(m.etapas, p.etapas), `Etapas cerradas ${CONTRA}`) },
    { n: m.terminados, t: `Terminados · ${PANEL_DIAS} días`,
      d: flechaHTML(variacion(m.terminados, p.terminados), `Encargos terminados ${CONTRA}`) }
  ];
}
