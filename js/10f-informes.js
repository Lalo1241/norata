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
function metricasMisiones(r, D) {
  const datos = D || state;
  const dias = diasDe(r);
  const m0 = { marcas: 0, tocaban: 0, completas: 0, porHora: new Array(24).fill(0), porDiaSemana: new Array(7).fill(0), conHora: 0 };

  for (const m of datos.missions) {
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

function metricasHabilidades(r, D) {
  const datos = D || state;
  const out = {
    ganada: 0, perdida: 0, minutos: 0, niveles: 0, sesiones: 0,
    porFuente: { misiones: 0, talentos: 0, proyectos: 0, practica: 0 },
    porHabilidad: new Map()
  };

  for (const s of datos.skills) {
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

function metricasTalentos(r, D) {
  const datos = D || state;
  const out = { invertido: 0, completados: 0, abiertos: 0, vencidos: 0, invertidoPorRama: new Map() };

  for (const p of datos.perks) {
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
function talentosPorVencer(dias, D) {
  const tope = addDaysKey(todayKey(), dias);
  return (D || state).perks.filter(p => p.status === "active" && p.endDate && p.endDate >= todayKey() && p.endDate <= tope);
}

/* ================= Proyectos ================= */

function metricasProyectos(r, D) {
  const datos = D || state;
  const out = { etapas: 0, terminados: 0, soltados: 0, creados: 0 };

  for (const pr of datos.projects) {
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
  return new Intl.NumberFormat(localeActual()).format(Math.round(n));
}

/* El HTML de una flecha, para el renglón de una estadística del panel.
   `titulo` es lo que se lee al dejar el dedo encima: la flecha dice cuánto,
   el título dice contra qué — sin él, «▲ 4» no significa nada. */
function flechaHTML(v, titulo) {
  if (!v || v.dir === "nueva") return "";
  const clase = v.dir === "igual" ? "igual" : (v.dir === "mejor" ? "mejor" : "peor");
  return `<i class="sh-var ${clase}" title="${escapeAttr(titulo || "")}">${escapeHtml(v.txt)}</i>`;
}

/* ================= El escaparate: `?informes=demo` =================

   Aquí hubo un interruptor —`pruebaInformes()`— que mantuvo toda esta reforma
   apagada mientras Eduardo la miraba, de 0.7.20 a 0.7.27. Se fue en 0.7.28:
   las flechas y el botón del informe son ya la app y no una prueba.

   Lo que se queda es esto, y por un motivo que costó descubrir: **en una
   cuenta sin historia el trabajo entero es invisible.** No sale ninguna
   flecha —no hay periodo anterior con el que comparar, y un cero contra otro
   cero se calla a propósito—, así que la primera vez que se miró parecía que
   no había cambiado nada. Sin un mes de vida inventada delante no se puede
   opinar de ninguna de estas pantallas.

   Los números NO tocan tus datos: no se guardan, no pasan por `state` y solo
   existen mientras se dibuja. Y el rótulo de la pantalla lo dice mientras
   están puestos, porque enseñar cifras que no son tuyas sin avisar es peor
   que no poder mirarlas. */
function pruebaDemo() {
  return document.documentElement.classList.contains("informes-demo");
}

/* ---- Un mes de vida inventada ----

   Antes esto eran ocho cifras escritas a mano, y servían para mirar el panel
   pero no para nada más: el informe necesita historia de verdad —días, horas,
   orígenes del XP, etapas con su fecha—. Así que el demo pasa a ser un juego
   de datos completo con la misma forma que `state`, y todo lo demás lo
   calculan las mismas funciones que leen tus datos. Es lo único que garantiza
   que lo que se ve en la prueba sea lo que se verá de verdad.

   Sin azar y con las cuentas escritas: si los números cambiaran en cada
   dibujo, la pantalla se movería sola al cambiar de pestaña y no habría forma
   de opinar sobre nada. Se construye una vez y se recuerda.

   No se guarda, no pasa por `state` y no sobrevive a cerrar la pestaña. */
let _demoCache = null;

/* Cuántas de las cinco misiones se cumplieron cada día, de hoy hacia atrás.
   Escrito a mano para que las comparaciones digan algo: los últimos 7 días
   suman 23 y los 7 anteriores 18, así que esa flecha sube; y el único día en
   blanco está en el 27, que es lo que hace que la racha valga 27. */
const DEMO_DIAS = [3, 4, 3, 5, 2, 3, 3,  2, 3, 3, 2, 3, 2, 3,  4, 3, 2, 3, 3, 4, 2,
                   3, 2, 3, 2, 3, 2, 0,  2, 3, 2, 3, 2, 3, 2];

function datosDemo() {
  if (_demoCache) return _demoCache;

  const dia = (n) => addDaysKey(todayKey(), -n);
  const sello = (n, hora) => new Date(Date.parse(dia(n) + "T" + hora + ":00Z")).toISOString();

  /* Las cinco habilidades que entrenan las misiones. Su XP se rellena abajo
     sumando sus propios movimientos: una habilidad cuyo total no cuadre con
     su historial mentiría justo en la gráfica que reparte el XP por origen. */
  const skills = [
    { id: "d-s1", name: "Dibujo",    category: "Creatividad", icon: "pen",    color: "#c7a6ff", xp: 0, log: [], permanent: false, graceDays: 7, createdAt: dia(34), lastActivity: dia(0) },
    { id: "d-s2", name: "Ejercicio", category: "Cuerpo",      icon: "heart",  color: "#5fe0b0", xp: 0, log: [], permanent: false, graceDays: 7, createdAt: dia(34), lastActivity: dia(0) },
    { id: "d-s3", name: "Idiomas",   category: "Mente",       icon: "book",   color: "#8ecdf5", xp: 0, log: [], permanent: false, graceDays: 7, createdAt: dia(34), lastActivity: dia(1) },
    { id: "d-s4", name: "Cocina",    category: "Casa",        icon: "coffee", color: "#f5d76e", xp: 0, log: [], permanent: false, graceDays: 7, createdAt: dia(34), lastActivity: dia(2) },
    { id: "d-s5", name: "Finanzas",  category: "Dinero",      icon: "chart",  color: "#ff8a70", xp: 0, log: [], permanent: false, graceDays: 5, createdAt: dia(34), lastActivity: dia(21) }
  ];

  /* Cada misión a una hora distinta: es lo que hace que la gráfica de «a qué
     hora cumples» tenga algo que enseñar. */
  const defs = [
    { id: "d-m1", name: "Dibujar 15 minutos",  skillId: "d-s1", xp: 20, hora: "21" },
    { id: "d-m2", name: "Caminar 20 minutos",  skillId: "d-s2", xp: 20, hora: "07" },
    { id: "d-m3", name: "Repasar vocabulario", skillId: "d-s3", xp: 15, hora: "13" },
    { id: "d-m4", name: "Cocinar en casa",     skillId: "d-s4", xp: 25, hora: "19" },
    { id: "d-m5", name: "Anotar mis gastos",   skillId: "d-s5", xp: 15, hora: "22" }
  ];

  const missions = defs.map(d => ({
    id: d.id, name: d.name, skillId: d.skillId, xp: d.xp, icon: "check", color: "#5fe0b0",
    cadence: "daily", target: 1, log: {}, archived: false, completedAt: null, createdAt: dia(34)
  }));

  const porId = (id) => skills.find(x => x.id === id);

  DEMO_DIAS.forEach((cuantas, i) => {
    const fecha = dia(i);
    for (let j = 0; j < cuantas; j++) {
      const m = missions[j];
      const d = defs[j];
      const min = String(10 + ((i * 7 + j * 13) % 50)).padStart(2, "0");
      m.log[fecha] = ["demo." + fecha + "." + j + "@" + d.hora + min];
      const s = porId(d.skillId);
      s.xp += d.xp;
      s.log.unshift({ date: fecha, at: sello(i, d.hora + ":" + min), xp: d.xp,
        note: "Misión cumplida: " + d.name, fuente: "Misión · " + d.name, min: 15 });
    }
  });

  /* Práctica suelta, un talento y un proyecto: las otras tres porciones del
     reparto de XP. Los dos grandes caen en la semana ANTERIOR a propósito,
     que es lo que hace que el XP de ésta baje: con todo subiendo no se puede
     opinar sobre si el coral molesta o si sobra. */
  const extra = (skillId, i, xp, note, fuente, min) => {
    const s = porId(skillId);
    s.xp += xp;
    s.log.unshift({ date: dia(i), at: sello(i, "18:20"), xp, note, fuente, min: min || 0 });
  };
  extra("d-s1", 2, 60, "Práctica libre", null, 45);
  extra("d-s3", 5, 40, "Práctica libre", null, 30);
  /* Uno de cada familia DENTRO del periodo, además de los dos gordos de la
     semana pasada: sin ellos, el reparto de «de dónde sale tu XP» se quedaba
     en dos porciones y no se podía ver si cuatro colores juntos se leen. */
  extra("d-s2", 4, 120, "Talento completado: Bici de ciudad", "Talento · Bici de ciudad");
  extra("d-s4", 3, 90, "Proyecto terminado: Regalo de mamá", "Proyecto · Regalo de mamá");
  extra("d-s2", 9, 300, "Talento completado: Curso de acuarela", "Talento · Curso de acuarela");
  extra("d-s4", 11, 250, "Proyecto terminado: Ordenar la cocina", "Proyecto · Ordenar la cocina");
  extra("d-s1", 16, 80, "Práctica libre", null, 60);

  /* Y algo cayéndose: sin XP perdido, la mitad de lo que el informe tiene que
     saber contar no se ve nunca. Sin fuente, que es lo que lo distingue de
     una vuelta atrás (ver el reparto por familias). */
  skills[4].log.unshift({ date: dia(1), at: sello(1, "03:00"), xp: -12, note: "Decaimiento por inactividad", fuente: null });
  skills[4].xp -= 12;
  skills[2].log.unshift({ date: dia(8), at: sello(8, "03:00"), xp: -9, note: "Decaimiento por inactividad", fuente: null });
  skills[2].xp -= 9;

  const perks = [
    { id: "d-p1", name: "Curso de acuarela", branch: "Oficio", icon: "pen",    color: "#c7a6ff", tipo: "meta",   status: "active",    cost: 1890, startDate: dia(3),  endDate: addDaysKey(todayKey(), 4),  planDays: 7,  completedAt: null, createdAt: dia(30), steps: [{ id: "e1", name: "Materiales", done: true, at: sello(2, "10:00") }, { id: "e2", name: "Primeras láminas", done: false, at: null }], history: [] },
    { id: "d-p2", name: "Bici de ciudad",    branch: "Cuerpo", icon: "heart",  color: "#5fe0b0", tipo: "compra", status: "active",    cost: 4200, startDate: dia(10), endDate: addDaysKey(todayKey(), 20), planDays: 30, completedAt: null, createdAt: dia(40), steps: [], history: [] },
    { id: "d-p3", name: "Teclado partido",   branch: "Oficio", icon: "chart",  color: "#8ecdf5", tipo: "compra", status: "completed", cost: 990,  startDate: dia(25), endDate: null, completedAt: dia(2),  createdAt: dia(28), steps: [], history: [] },
    { id: "d-p4", name: "Certificado B2",    branch: "Mente",  icon: "book",   color: "#8ecdf5", tipo: "meta",   status: "active",    cost: 0,    startDate: dia(6),  endDate: addDaysKey(todayKey(), 40), planDays: 46, completedAt: null, createdAt: dia(20), steps: [], history: [] },
    { id: "d-p5", name: "Sartén de hierro",  branch: "Casa",   icon: "coffee", color: "#f5d76e", tipo: "compra", status: "completed", cost: 1200, startDate: dia(60), endDate: null, completedAt: dia(58), createdAt: dia(62), steps: [], history: [] },
    { id: "d-p6", name: "Curso de finanzas", branch: "Dinero", icon: "chart",  color: "#ff8a70", tipo: "meta",   status: "completed", cost: 2400, startDate: dia(90), endDate: dia(60), completedAt: dia(64), createdAt: dia(95), steps: [], history: [] }
  ];

  /* Nueve encargos: seis vivos —dos parados desde hace mes y medio, que es lo
     que dispara «estancado»— y tres cerrados. Las etapas llevan su sello de
     tiempo porque el ritmo del informe se cuenta con él. */
  const etapas = (dias) => dias.map((n, i) => ({
    id: "e" + i, name: "Etapa " + (i + 1), done: n !== null, at: n === null ? null : sello(n, "16:00")
  }));

  const projects = [
    { id: "d-x1", name: "Mudanza",           branch: "Casa",     icon: "flag", color: "#5fe0b0", status: "active", createdAt: dia(30), lastActivity: dia(0),  completedAt: null,   steps: etapas([0, 1, 3, 5, null, null]), history: [] },
    { id: "d-x2", name: "Portafolio nuevo",  branch: "Oficio",   icon: "flag", color: "#c7a6ff", status: "active", createdAt: dia(45), lastActivity: dia(2),  completedAt: null,   steps: etapas([2, 4, 6, 9, 11, null]), history: [] },
    { id: "d-x3", name: "Huerto del patio",  branch: "Casa",     icon: "flag", color: "#f5d76e", status: "paused", createdAt: dia(60), lastActivity: dia(12), completedAt: null,   steps: etapas([8, 10, 12, 13, null]), history: [] },
    { id: "d-x4", name: "Trámite del coche", branch: "Trámites", icon: "flag", color: "#8ecdf5", status: "active", createdAt: dia(80), lastActivity: dia(52), completedAt: null,   steps: etapas([52, 60, null, null, null]), history: [] },
    { id: "d-x5", name: "Libro a medias",    branch: "Mente",    icon: "flag", color: "#ff8a70", status: "active", createdAt: dia(90), lastActivity: dia(55), completedAt: null,   steps: etapas([55, 70, null, null, null, null]), history: [] },
    { id: "d-x6", name: "Cambiar de banco",  branch: "Dinero",   icon: "flag", color: "#5fe0b0", status: "active", createdAt: dia(25), lastActivity: dia(4),  completedAt: null,   steps: etapas([4, 7, 8, null]), history: [] },
    { id: "d-x7", name: "Ordenar la cocina", branch: "Casa",     icon: "flag", color: "#f5d76e", status: "done",   createdAt: dia(40), lastActivity: dia(1),  completedAt: dia(1), steps: etapas([1, 6, 10, 14]), history: [] },
    { id: "d-x8", name: "Regalo de mamá",    branch: "Casa",     icon: "flag", color: "#c7a6ff", status: "done",   createdAt: dia(35), lastActivity: dia(5),  completedAt: dia(5), steps: etapas([5, 9, 13]), history: [] },
    { id: "d-x9", name: "Impuestos",         branch: "Dinero",   icon: "flag", color: "#8ecdf5", status: "done",   createdAt: dia(50), lastActivity: dia(9),  completedAt: dia(9), steps: etapas([9, 10, 11, 12]), history: [] }
  ];

  _demoCache = { skills, missions, perks, projects };
  return _demoCache;
}

/* La racha del demo. `streakInfo` lee `state` por dentro y no tiene forma de
   mirar otra cosa, así que aquí se cuenta lo mismo sobre los días con alguna
   misión cumplida: seguidos desde hoy, y la mejor de toda la historia. */
function rachaDemo(D) {
  const dias = new Set();
  D.missions.forEach(m => Object.keys(m.log || {}).forEach(k => { if (missionCount(m, k) > 0) dias.add(k); }));
  let cur = 0, k = todayKey();
  if (!dias.has(k)) k = addDaysKey(k, -1);
  while (dias.has(k) && cur < 4000) { cur++; k = addDaysKey(k, -1); }
  let best = 0, run = 0, prev = null;
  [...dias].sort().forEach(x => {
    run = (prev && daysBetween(prev, x) === 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = x;
  });
  return { cur, best };
}

/* La fuente de datos de todo lo que se dibuja: tus cosas, o el mes inventado
   cuando la pestaña está en modo demo. Una sola función para no tener que
   acordarse en cada sitio; devuelve null con tus datos, que es lo que las
   funciones de métricas entienden como «usa `state`». */
function datosDeAhora() {
  return pruebaDemo() ? datosDemo() : null;
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
  const D = datosDeAhora();
  const { a, b } = ventanasPanel();
  const m = metricasMisiones(a, D), p = metricasMisiones(b, D);
  const rachas = D ? rachaDemo(D) : streakInfo();
  const hoy = D
    ? D.missions.filter(x => !x.archived && missionScheduledOn(x, todayKey())).length
    : ctx.due.length;

  /* «Récord» y no una flecha: una racha no se compara con la de la semana
     pasada —es la misma cuenta, solo más larga—, se compara con tu mejor. */
  const record = rachas.cur > 0 && rachas.cur >= rachas.best
    ? `<i class="sh-var mejor" title="Es la racha más larga que has tenido">${tx("récord")}</i>` : "";

  return [
    { n: hoy, t: "Hoy" },
    { n: m.marcas, t: `Cumplidas · ${PANEL_DIAS} días`, tone: "mint",
      d: flechaHTML(variacion(m.marcas, p.marcas), `Marcas de misión ${CONTRA}`) },
    /* Un guion y no un cero cuando no tocaba nada: cero por ciento es haber
       fallado, y no tener nada que hacer no es fallar. */
    { n: m.constancia === null ? "—" : m.constancia + "%", t: "Constancia",
      d: flechaHTML(variacion(m.constancia, p.constancia), `Cumplidas de las que tocaban, ${CONTRA}`) },
    { n: rachas.cur, t: "Racha", d: record }
  ];
}

function statsPanelHabilidades(ctx) {
  const D = datosDeAhora();
  const { a, b } = ventanasPanel();
  const m = metricasHabilidades(a, D), p = metricasHabilidades(b, D);
  const cuantas = (D || state).skills.length;
  const decayendo = D ? D.skills.filter(isDecaying).length : ctx.decaying;

  return [
    { n: cuantas, t: "Habilidades" },
    { n: fmtXp(m.ganada), t: `XP · ${PANEL_DIAS} días`, tone: "mint",
      d: flechaHTML(variacion(m.ganada, p.ganada), `XP ganada ${CONTRA}`) },
    { n: m.niveles, t: "Niveles subidos",
      d: flechaHTML(variacion(m.niveles, p.niveles), `Niveles subidos ${CONTRA}`) },
    /* Sin flecha a propósito: no es un resultado del periodo, es una alarma
       de ahora mismo. Compararla con la semana pasada invitaría a leerla como
       «voy mejorando» cuando lo único que importa es que hay algo cayéndose. */
    { n: decayendo, t: "Decayendo", tone: decayendo ? "fire" : "" }
  ];
}

function statsPanelTalentos(ctx) {
  const D = datosDeAhora();
  const { a, b } = ventanasPanel();
  const m = metricasTalentos(a, D), p = metricasTalentos(b, D);
  const vencen = talentosPorVencer(PANEL_DIAS, D).length;
  const enCurso = D ? D.perks.filter(x => x.status === "active").length : ctx.activeN;

  return [
    { n: enCurso, t: "En curso", tone: enCurso ? "fire" : "" },
    { n: m.completados, t: `Asegurados · ${PANEL_DIAS} días`, tone: "mint",
      d: flechaHTML(variacion(m.completados, p.completados), `Talentos asegurados ${CONTRA}`) },
    /* `moneyHTML` y no `money`: aquí el importe se inserta como HTML, así que
       el código de la moneda puede ir en su etiqueta y pintarse más pequeño.
       Con las dos partes al mismo tamaño, «MXN» pesaba como una cifra. */
    { n: moneyHTML(m.invertido), t: `Invertido · ${PANEL_DIAS} días`,
      d: flechaHTML(variacion(m.invertido, p.invertido, { dinero: true }), `Invertido ${CONTRA}`) },
    /* «Por vencer» y no «Vencen esta semana»: medido a 375 px, el rótulo
       largo se partía en TRES renglones y dejaba esa columna más alta que las
       otras tres. Lo que se pierde —el plazo— lo dice el foco de abajo. */
    { n: vencen, t: "Por vencer", tone: vencen ? "coral" : "" }
  ];
}

function statsPanelProyectos(ctx) {
  const D = datosDeAhora();
  const { a, b } = ventanasPanel();
  const m = metricasProyectos(a, D), p = metricasProyectos(b, D);
  const vivos = D ? D.projects.filter(x => x.status === "active" || x.status === "paused") : ctx.live;
  const parados = D ? vivos.filter(x => projectHealth(x).key === "stalled") : ctx.stalled;

  return [
    { n: vivos.length, t: "Vivos", tone: "mint" },
    { n: parados.length, t: "Estancados", tone: parados.length ? "coral" : "" },
    { n: m.etapas, t: `Etapas · ${PANEL_DIAS} días`,
      d: flechaHTML(variacion(m.etapas, p.etapas), `Etapas cerradas ${CONTRA}`) },
    { n: m.terminados, t: `Terminados · ${PANEL_DIAS} días`,
      d: flechaHTML(variacion(m.terminados, p.terminados), `Encargos terminados ${CONTRA}`) }
  ];
}
