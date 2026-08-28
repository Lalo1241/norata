/* Las lecturas del informe. Fase 4 y última de la reforma de los paneles.
 *
 * Una gráfica enseña; una lectura DICE. «El 70% de tu XP viene de misiones»
 * es lo que alguien repetiría en voz alta, y es lo que convierte un informe
 * en algo que se vuelve a abrir. Van al final de cada rama, después de las
 * gráficas, y son tres a cinco frases como mucho.
 *
 * Se hicieron al final del plan a propósito: se escriben mucho mejor mirando
 * las gráficas ya dibujadas con datos reales que imaginándolas.
 *
 * Cuatro reglas que las gobiernan, y ninguna es negociable:
 *
 *   1. **Ninguna aparece sin datos suficientes detrás.** Cada una lleva su
 *      propio mínimo escrito. Una frase inventada sobre tres días de uso se
 *      lleva por delante la confianza en las otras veinte.
 *   2. **No regañan.** Dicen lo que se ve y por dónde se sale. Nunca «no
 *      cumpliste», nunca mayúsculas de alarma, nunca cerrar contando lo que
 *      alguien hizo mal.
 *   3. **No repiten la gráfica.** Si la barra ya dice que el martes es el día
 *      más flojo, la lectura tiene que añadir qué significa o qué hacer.
 *   4. **Van ordenadas por lo que importa**, no por módulo: la primera que
 *      cumpla su condición sale primero, y se cortan en cuatro. Cinco frases
 *      seguidas ya no se leen, se hojean.
 *
 * Cada regla es una función que devuelve su frase o `null`. Añadir una es
 * escribir una función más y ponerla donde toque en la lista.
 */

/* Cuatro y no cinco. El plan decía «tres a cinco»; con cinco puestas en
   pantalla, la última se lee ya en diagonal. */
const LECTURAS_MAX = 4;

/* El suelo común: por debajo de esto no se interpreta nada, se dice que
   todavía es pronto. Tres días con actividad es el mínimo con el que una
   frase puede significar algo. */
const LECTURAS_MINIMO_DIAS = 3;

function diasConAlgo(r, datos) {
  let n = 0;
  diasDe(r).forEach(k => {
    let hubo = false;
    datos.missions.forEach(x => { if (!hubo && missionCount(x, k) > 0) hubo = true; });
    if (!hubo) datos.skills.forEach(s => { if (!hubo && s.log.some(e => e.date === k && e.xp > 0)) hubo = true; });
    if (hubo) n++;
  });
  return n;
}

/* ---- Ayudas de redacción ----
   Viven aquí y no dentro de cada regla porque son las que mantienen el mismo
   castellano en las treinta frases. */

function plural(n, singular, plural_) {
  return n + " " + (n === 1 ? singular : plural_);
}

/* «7 de cada 10» se entiende de un vistazo; «68,4%» hay que traducirlo
   mentalmente. Para una frase hablada gana la proporción. */
function deCada10(parte, total) {
  return Math.round(parte / total * 10) + " de cada 10";
}

function nombreDia(i) {
  return ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][i];
}

/* ================= Misiones ================= */

const LECTURAS_MISIONES = [
  /* La racha, primero: es lo que más se siente y lo único que se pierde de
     golpe. */
  function (c) {
    const ra = c.rachas;
    if (!ra || ra.cur < 5) return null;
    if (ra.cur >= ra.best) return `Llevas ${plural(ra.cur, "día seguido", "días seguidos")} haciendo algo, y es tu racha más larga hasta ahora.`;
    return `Llevas ${plural(ra.cur, "día seguido", "días seguidos")}. Tu mejor racha fueron ${ra.best}, así que ya sabes que se puede.`;
  },

  /* El día flojo. Pide dos semanas: con una, el «día flojo» es simplemente el
     día que te tocó estar ocupado. */
  function (c) {
    if (c.dias < 14 || c.m.marcas < 10) return null;
    const v = c.m.porDiaSemana;
    const conDatos = v.filter(x => x > 0).length;
    if (conDatos < 5) return null;
    const media = v.reduce((a, b) => a + b, 0) / 7;
    let peor = 0;
    v.forEach((x, i) => { if (x < v[peor]) peor = i; });
    if (v[peor] >= media * 0.6) return null;
    return `Los ${nombreDia(peor)}s cumples bastante menos que el resto de la semana. Puede que el problema sea lo que tienes puesto ese día y no el día: mira si algo se puede mover.`;
  },

  /* Constancia alta y baja. La baja no acusa: propone quitar, que es lo que
     de verdad la sube. */
  function (c) {
    if (c.m.constancia === null || c.m.tocaban < 10) return null;
    if (c.m.constancia >= 85) return `Cumpliste ${deCada10(c.m.completas, c.m.tocaban)} veces que tocaba. A ese ritmo esto deja de ser esfuerzo y pasa a ser costumbre.`;
    if (c.m.constancia <= 40) return `De lo que tocaba, salió ${deCada10(c.m.completas, c.m.tocaban)}. Casi siempre significa que hay más misiones puestas de las que caben en un día: quitar dos hace subir todas las demás.`;
    /* La banda de en medio también habla. Antes se callaba, y el resultado
       era que quien va normal —que es casi todo el mundo— no leía ni una
       frase sobre su constancia. Sin adjetivos: el dato y para qué sirve. */
    return `Cumpliste ${deCada10(c.m.completas, c.m.tocaban)} veces que tocaba. Es el número al que mirar dentro de un mes para saber si te movías.`;
  },

  /* La misión que lo sostiene todo. */
  function (c) {
    if (c.m.marcas < 8 || c.porMision.length < 3) return null;
    const top = c.porMision[0];
    if (top.v < c.m.marcas * 0.4) return null;
    return `Casi la mitad de lo que marcas es «${top.k}». Es tu ancla: mientras esa aguante, el resto se apoya en ella.`;
  },

  /* La franja horaria. Solo con marcas que lleven hora, y con suficientes
     para que la concentración signifique algo. */
  function (c) {
    if (c.m.conHora < 10) return null;
    const nombres = ["de madrugada", "por la mañana", "por la tarde", "por la noche"];
    const f = [0, 0, 0, 0];
    c.m.porHora.forEach((n, h) => { f[Math.min(3, Math.floor(h / 6))] += n; });
    const total = f.reduce((a, b) => a + b, 0);
    let top = 0;
    f.forEach((x, i) => { if (x > f[top]) top = i; });
    if (f[top] < total * 0.5) return null;
    return `Más de la mitad de lo que cumples lo cumples ${nombres[top]}. Si algo se te resiste, esa es la franja donde ya sabes que funcionas.`;
  },

  /* Las que nunca se cumplieron. Se dice sin cargo de conciencia: la salida
     es borrarlas, y borrar no es fracasar. */
  function (c) {
    const nunca = c.datos.missions.filter(m => !m.archived && Object.keys(m.log || {}).length === 0);
    if (nunca.length < 2 || c.dias < 14) return null;
    return `Tienes ${plural(nunca.length, "misión", "misiones")} que no has cumplido ninguna vez. Quitarlas no te resta nada; verlas cada día sí.`;
  }
];

/* ================= Habilidades ================= */

const LECTURAS_HABILIDADES = [
  /* De dónde sale el XP. Es la lectura que más gente no sabría contestar de
     su propia app, y por eso va primera. */
  function (c) {
    const f = c.h.porFuente;
    const total = f.misiones + f.talentos + f.proyectos + f.practica;
    if (total < 100) return null;
    const pares = [["misiones", f.misiones], ["talentos", f.talentos], ["proyectos", f.proyectos], ["práctica suelta", f.practica]];
    pares.sort((a, b) => b[1] - a[1]);
    const [nombre, valor] = pares[0];
    if (valor < total * 0.7) return null;
    const otros = pares.slice(1).filter(x => x[1] === 0).map(x => x[0]);
    const cola = otros.length
      ? ` Lo que casi no te está dando puntos: ${otros.join(", ")}.`
      : "";
    return `El ${Math.round(valor / total * 100)}% de tu XP viene de ${nombre}.${cola}`;
  },

  /* Lo que se está cayendo. El aviso lleva SIEMPRE la salida pegada: es la
     única frase del informe que habla de una pérdida. */
  function (c) {
    if (!c.h.perdida) return null;
    if (c.h.perdida < c.h.ganada * 0.15) return null;
    return `Perdiste ${fmtXp(c.h.perdida)} XP por habilidades que se quedaron sin practicar. Se detiene con registrar cualquier práctica, cumplir una misión enlazada o avanzar algo que las entrene.`;
  },

  /* Niveles: lo bueno se dice tan claro como lo otro. */
  function (c) {
    if (!c.h.niveles) return null;
    return `Subiste ${plural(c.h.niveles, "nivel", "niveles")} en este periodo.`;
  },

  /* El tiempo, dicho en unidades de vida. Solo con horas de verdad: decir
     «llevas 40 minutos» no le cambia el día a nadie. */
  function (c) {
    const horas = c.h.minutos / 60;
    if (horas < 5) return null;
    /* La frase se arma entera y no pegando un plural en medio: «son 1 día
       completo … puestos» es lo que salía, y una falta de concordancia en la
       frase que más se va a releer se lleva por delante todo lo demás. */
    if (horas >= 24) {
      const d = Math.round(horas / 24);
      return `Llevas ${Math.round(horas)} horas registradas: ${d === 1 ? "un día completo" : d + " días completos"} de tu vida.`;
    }
    return `Llevas ${Math.round(horas)} horas de práctica registradas en este periodo.`;
  },

  /* La que lleva más tiempo sin tocarse, con nombre y apellido. Un número de
     habilidades decayendo no dice a cuál ir; un nombre sí. */
  function (c) {
    const vivas = c.datos.skills.filter(s => !s.permanent && s.xp > 0 && (s.lastActivity || s.createdAt));
    if (vivas.length < 3) return null;
    const orden = [...vivas].sort((a, b) =>
      daysBetween(b.lastActivity || b.createdAt, todayKey()) - daysBetween(a.lastActivity || a.createdAt, todayKey()));
    const s = orden[0];
    const dias = daysBetween(s.lastActivity || s.createdAt, todayKey());
    if (dias < 10) return null;
    return `${s.name} lleva ${plural(dias, "día", "días")} sin práctica, la que más de todas. Un registro corto le devuelve su periodo de gracia entero.`;
  },

  /* Concentración: ni buena ni mala, pero conviene saberlo. */
  function (c) {
    if (c.h.ganada < 200 || c.topHab.length < 2) return null;
    const top = c.topHab[0];
    if (top.v < c.h.ganada * 0.6) return null;
    return `Casi todo tu crecimiento fue en ${top.k}. Está bien tener una punta de lanza; solo conviene saber cuál es.`;
  }
];

/* ================= Talentos ================= */

const LECTURAS_TALENTOS = [
  /* Lo que se vence: es lo único de esta rama que hay que mirar hoy. */
  function (c) {
    const pronto = talentosPorVencer(7, c.D);
    if (!pronto.length) return null;
    const p = pronto[0];
    const quedan = daysBetween(todayKey(), p.endDate);
    return `«${p.name}» se vence ${quedan <= 0 ? "hoy" : "en " + plural(quedan, "día", "días")}.${pronto.length > 1 ? ` Y hay ${pronto.length - 1} más con la fecha encima.` : ""}`;
  },

  /* Dinero que salió y nada que entrara. Se dice sin juicio: pagar y no
     terminar es lo más humano que hay, y lo que ayuda es verlo escrito. */
  function (c) {
    if (!(c.t.invertido > 0) || c.t.completados > 0) return null;
    return `Este periodo invertiste ${money(c.t.invertido)} y todavía no cerraste ninguno. No es un problema si están en marcha; sí lo es si están esperando a que sobre tiempo.`;
  },

  function (c) {
    if (!c.t.completados) return null;
    return `Aseguraste ${plural(c.t.completados, "talento", "talentos")}. Eso ya no se pierde: los talentos completados no decaen.`;
  },

  /* Plazos vencidos. La salida es reabrir el plazo, no rendirse. */
  function (c) {
    if (!c.t.vencidos) return null;
    return `A ${plural(c.t.vencidos, "talento se le pasó", "talentos se les pasó")} el plazo. Darles una fecha nueva y realista vale más que dejarlos venciendo.`;
  },

  /* Cuánto tardas de verdad, contra lo que te diste. */
  function (c) {
    if (c.r.periodo === "semana") return null;
    const cerrados = c.datos.perks.filter(x => x.completedAt && enRango(x.completedAt, c.r) && x.endDate);
    if (cerrados.length < 2) return null;
    const aTiempo = cerrados.filter(x => x.completedAt <= x.endDate).length;
    if (aTiempo === cerrados.length) return `Cerraste dentro de plazo todos los que tenían fecha. Los plazos que te pones son realistas, que es más raro de lo que parece.`;
    return `De ${plural(cerrados.length, "talento con fecha", "talentos con fecha")}, ${aTiempo} llegaron dentro de plazo. Si la mayoría se pasa, suele ser la fecha y no las ganas.`;
  }
];

/* ================= Proyectos ================= */

const LECTURAS_PROYECTOS = [
  /* Lo estancado. Es la única decisión que la app pide de verdad, y por eso
     va primera y con las dos salidas puestas. */
  function (c) {
    const parados = c.vivos.filter(x => projectHealth(x).key === "stalled");
    if (!parados.length) return null;
    return `${plural(parados.length, "encargo lleva", "encargos llevan")} más de mes y medio sin avanzar. Retomarlos o soltarlos libera la misma atención; dejarlos en el limbo es lo único que no ayuda.`;
  },

  function (c) {
    if (!c.p.terminados) return null;
    return `Terminaste ${plural(c.p.terminados, "encargo", "encargos")} en este periodo.`;
  },

  /* El ritmo, comparado. La caída se dice sin dramatismo: un periodo flojo no
     es una tendencia. */
  function (c) {
    if (c.p.etapas < 3 && c.pAntes.etapas < 3) return null;
    if (c.p.etapas >= c.pAntes.etapas) {
      if (!c.pAntes.etapas) return null;
      return `Cerraste ${c.p.etapas} etapas frente a ${c.pAntes.etapas} del periodo anterior: vas más rápido que antes.`;
    }
    return `Cerraste ${c.p.etapas} etapas frente a ${c.pAntes.etapas} del periodo anterior. Un periodo más lento no es una tendencia; dos seguidos sí dicen algo.`;
  },

  /* Todo parado a la vez. */
  function (c) {
    if (!c.vivos.length || c.p.etapas > 0) return null;
    return `Tienes ${plural(c.vivos.length, "encargo vivo", "encargos vivos")} y ninguna etapa cerrada en este periodo. Una etapa pequeña basta para que dejen de contar días.`;
  },

  function (c) {
    if (!c.p.soltados) return null;
    return `Soltaste ${plural(c.p.soltados, "encargo", "encargos")}. Soltar a tiempo también es avanzar: lo que no sigue ya no ocupa sitio.`;
  }
];

/* ================= Todo junto ================= */

const LECTURAS_TODO = [
  /* Comparación general: la pregunta con la que se abre el informe. */
  function (c) {
    const v = variacion(c.m.marcas, c.mAntes.marcas);
    if (v.dir === "nueva" || c.m.marcas + c.mAntes.marcas < 10) return null;
    if (v.dir === "igual") return `Cumpliste exactamente lo mismo que el periodo anterior. Sostener también es un resultado.`;
    return v.dir === "mejor"
      ? `Cumpliste ${Math.abs(v.dif)} misiones más que el periodo anterior.`
      : `Cumpliste ${Math.abs(v.dif)} misiones menos que el periodo anterior. Pasa, y no borra lo de antes.`;
  },

  /* El módulo que se quedó fuera. Se dice como una puerta abierta, no como
     una falta: hay quien no usa Talentos y hace bien. */
  function (c) {
    const usados = [
      { n: "Misiones", v: c.m.marcas },
      { n: "Talentos", v: c.t.completados + (c.t.invertido > 0 ? 1 : 0) },
      { n: "Proyectos", v: c.p.etapas + c.p.terminados }
    ];
    const sinUsar = usados.filter(x => !x.v);
    if (!sinUsar.length || sinUsar.length === usados.length || c.diasActivos < 7) return null;
    return `No tocaste ${sinUsar.map(x => x.n).join(" ni ")} en este periodo. No es obligatorio usarlo todo; solo que sepas dónde no estuviste.`;
  },

  function (c) {
    const f = c.h.porFuente;
    const total = f.misiones + f.talentos + f.proyectos + f.practica;
    if (total < 100) return null;
    const pares = [["las misiones", f.misiones], ["los talentos", f.talentos], ["los proyectos", f.proyectos], ["la práctica suelta", f.practica]];
    pares.sort((a, b) => b[1] - a[1]);
    return `La energía de este periodo se fue sobre todo a ${pares[0][0]}.`;
  },

  /* El cierre. Es el único que no mira ningún dato: es la frase con la que se
     sale del informe, y va en aspiracional, como todos los cierres de la app. */
  function (c) {
    if (c.diasActivos < LECTURAS_MINIMO_DIAS) return null;
    return `Hiciste algo en ${plural(c.diasActivos, "día", "días")} de este periodo. Tienes por delante un camino largo, y se recorre en días pequeños.`;
  }
];

const LECTURAS = {
  todo: LECTURAS_TODO,
  misiones: LECTURAS_MISIONES,
  habilidades: LECTURAS_HABILIDADES,
  talentos: LECTURAS_TALENTOS,
  proyectos: LECTURAS_PROYECTOS
};

/* ================= El armado ================= */

/* Todo lo que las reglas pueden necesitar, calculado UNA vez. Sin esto, cada
   regla llamaría a las métricas por su cuenta y un informe recorrería el
   historial treinta veces para dibujar cuatro frases. */
function contextoLecturas(r, rAntes, D) {
  const datos = D || state;
  const m = metricasMisiones(r, D);
  const h = metricasHabilidades(r, D);

  const porMision = datos.missions.map(x => {
    let n = 0;
    diasDe(r).forEach(k => { n += missionCount(x, k); });
    return { k: x.name, v: n };
  }).filter(x => x.v > 0).sort((a, b) => b.v - a.v);

  const topHab = [...h.porHabilidad.entries()]
    .map(([id, xp]) => {
      const s = datos.skills.find(x => x.id === id);
      return s ? { k: s.name, v: xp } : null;
    })
    .filter(Boolean).sort((a, b) => b.v - a.v);

  return {
    r, rAntes, D, datos,
    m, mAntes: metricasMisiones(rAntes, D),
    h,
    t: metricasTalentos(r, D),
    p: metricasProyectos(r, D),
    pAntes: metricasProyectos(rAntes, D),
    vivos: datos.projects.filter(x => x.status === "active" || x.status === "paused"),
    porMision, topHab,
    dias: diasDe(r).length,
    diasActivos: diasConAlgo(r, datos),
    rachas: D ? rachaDemo(D) : (typeof streakInfo === "function" ? streakInfo() : null)
  };
}

function lecturasDe(rama, ctx) {
  const reglas = LECTURAS[rama] || [];
  const salen = [];
  for (const regla of reglas) {
    if (salen.length >= LECTURAS_MAX) break;
    let frase = null;
    /* Una regla que reviente no puede llevarse el informe entero por delante:
       lo que se pierde es una frase, y el resto de la pantalla sigue en pie. */
    try { frase = regla(ctx); } catch (e) { frase = null; }
    if (frase) salen.push(frase);
  }
  return salen;
}

/* El bloque que se pega al final de cada rama. Con poca historia no se
   interpreta: se dice que es pronto, que es la verdad y además es una
   promesa. */
function lecturasHTML(rama, r, rAntes, D) {
  const ctx = contextoLecturas(r, rAntes, D);

  if (ctx.diasActivos < LECTURAS_MINIMO_DIAS) {
    return `
      <section class="panel inf-lecturas">
        <h3>Qué veo aquí</h3>
        <p class="inf-pronto">Todavía es pronto para leer nada. Con unos días de uso, aquí aparece lo que se ve en tus números — el día que se te cae, de dónde sale tu XP, qué llevas parado.</p>
      </section>`;
  }

  const frases = lecturasDe(rama, ctx);
  if (!frases.length) return "";

  return `
    <section class="panel inf-lecturas">
      <h3>Qué veo aquí</h3>
      <ul class="inf-lista">
        ${frases.map(f => `<li>${escapeHtml(f)}</li>`).join("")}
      </ul>
    </section>`;
}
