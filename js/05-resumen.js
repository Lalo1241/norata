/* Resumen, tablero, catálogo y el motor de sugerencia */
/* ================= Render: resumen ================= */

/* La madrugada no tiene saludo propio en español, y los dos intentos lo
   demostraron: «trasnochador» le pone género a quien lee —y una «a» detrás no
   lo arregla, lo alarga— y «madrugada» acaba saludando al reloj, que además de
   raro no le habla a nadie.

   Así que a esa hora se usa lo único que siempre es correcto: **su nombre.**
   El apodo si lo puso, y si no el primero de su nombre —eso es `saludoActual`,
   la misma respuesta que usan los correos y el menú de la cuenta—. Sin cuenta
   no hay nombre, y entonces «buenas noches», que a las cuatro de la mañana es
   lo que dice cualquiera en México. */
function greeting() {
  const h = hourNow();
  if (h < 6) {
    const q = typeof saludoActual === "function" ? saludoActual() : "";
    return q ? T`Hola, ${q}` : tx("Buenas noches");
  }
  if (h < 12) return tx("Buenos días");
  if (h < 19) return tx("Buenas tardes");
  return tx("Buenas noches");
}

function renderSummary() {
  quizaLuciernagas();
  if (typeof quizaAniversario === "function") quizaAniversario();
  const el = document.getElementById("summary-content");
  const skills = state.skills;
  const perks = state.perks;
  const projects = state.projects;
  const missions = state.missions;

  /* Con el tablero vacío no hay tablero que acomodar. El botón de ordenar
     widgets encima de la pantalla de bienvenida ofrecía un modo sin nada
     dentro, justo cuando la única pregunta que importa es por cuál de los
     tres caminos empezar. */
  const vacio = skills.length === 0 && perks.length === 0 && projects.length === 0 && missions.length === 0;

  /* ---- El saludo y la fecha, en la cabecera del Resumen (0.7.57) ----
     Vivían dentro de la tarjeta de la racha, y eran la ÚNICA aparición de
     `greeting()` en toda la app: quien quitaba esa tarjeta del tablero —cosa
     que el Modo Editor permite— se quedaba sin saludo y sin fecha en el
     Resumen entero. La fecha no es un dato de la racha; es de hoy.

     **Y NO sale hasta que la app tiene algo dentro** (0.7.93). Se escribía
     antes del caso vacío justo al revés —«un perfil recién creado no tiene
     tablero, pero sí tiene día»— y eso resultó ser lo contrario de lo que hace
     falta ahí: la primera pantalla de alguien que acaba de entrar tiene UNA
     pregunta que hacer —por cuál de los tres caminos empiezas— y encima de
     ella salía «Buenas tardes · lunes, 6 de septiembre», que ni es la pregunta
     ni ayuda a contestarla. Lo paró Eduardo.

     Son DOS condiciones y no una, porque son dos maneras distintas de no haber
     empezado: el tablero vacío (no hay nada que resumir) y la bienvenida sin
     contestar (hay algo, pero la app todavía está recomendando por dónde ir).
     Con solo la primera, quien creaba una habilidad suelta y se saltaba el
     cuestionario ya se llevaba el saludo encima del cartel que se lo ofrece.

     Se BORRA además de no escribirse: `renderSummary` corre otra vez al
     borrarlo todo, y sin el `else` el saludo del tablero de antes se quedaba
     puesto sobre la pantalla vacía. */
  const elSaludo = document.getElementById("resumen-saludo");
  if (elSaludo) {
    if (vacio || bienvenidaPendiente()) elSaludo.textContent = "";
    else {
      const dateTxt = keyToDate(todayKey()).toLocaleDateString(localeActual(), { weekday: "long", day: "numeric", month: "long" });
      elSaludo.textContent = greeting() + " · " + dateTxt;
    }
  }
  const btnTablero = document.getElementById("dash-btn");
  if (vacio && btnTablero) btnTablero.style.display = "none";
  if (vacio) {
    dashEditing = false;
    el.className = "dash";
    el.innerHTML = `
      <div class="empty">
        <div class="bubble">${icon("compass", 34)}</div>
        <h2>${tx("Tu expedición empieza aquí")}</h2>
        <p>${tx("Convierte tu vida en un videojuego: misiones que haces hoy, habilidades que suben con la práctica, talentos que compras con dinero real y proyectos que avanzan por etapas.")}</p>
        <div class="stack" style="align-items:center">
          <button class="btn btn-primary" onclick="startOnboarding()">${tx("Armar mi tablero en 6 preguntas")}</button>
          <button class="btn btn-ghost" onclick="verElEjemplo()">${tx("Ver un ejemplo completo")}</button>
          <!-- Tres botones del mismo peso en la pantalla más vacía es una
               decisión de más, y encima la tercera se salta lo único que aquí
               enseña algo. Sigue estando —hay quien no quiere asistentes— pero
               pesa como lo que es: una salida, no una opción a la par. -->
          <button class="suelto" onclick="openSkillForm()">${tx("Empezar de cero")}</button>
        </div>
      </div>`;
    return;
  }

  const stk = streakInfo();
  const totalLevels = skills.reduce((a, s) => a + levelInfo(s.xp).level, 0);
  const decayingList = skills.filter(isDecaying);
  const dueList = perks.filter(p => perkStatus(p) === "due");
  const activeList = perks.filter(p => perkStatus(p) === "active");
  const invested = perks.reduce((a, p) => a + (p.investedTotal || 0), 0);

  const readyList = perks.filter(p => perkStatus(p) === "available");

  /* ---- «Atención hoy» se topa en TRES ----

     Medido el 21 sep 2026 abriendo la app con el reloj adelantado: al corriente
     este bloque trae UN aviso; a los diez días fuera trae siete, y seis son
     «estás perdiendo». Y no crece con la ausencia — a los 10, a los 30 y a los
     90 días son los mismos seis—, porque cada habilidad pasada su gracia se
     gana un renglón y ahí se queda. O sea que no es una lista de cosas que
     atender: es un muro que aparece de golpe y no se mueve.

     Se topa porque quien vuelve después de un tiempo puede hacer UNA cosa, no
     siete, y una lista que no se puede atender no se atiende: se cierra la app.
     El daño real es pequeño —el desgaste está topado al 25% de lo acumulado y
     a cinco días de práctica—, así que enseñarlo siete veces cuenta algo peor
     de lo que pasa.

     Lo que sobra no se pierde: cada habilidad lo dice en su ficha, el contador
     honesto sigue en la tarjeta de niveles («DECAYENDO», más abajo, que usa la
     lista entera a propósito) y el recuento de la ausencia lo da la ventana de
     vuelta. Aquí solo se elige qué se enseña primero. */
  const ATENCION_TOPE = 3;

  /* Y con un tope, el ORDEN deja de ser un detalle: lo que quede fuera tiene
     que ser lo que menos corre prisa. Se ordena por lo que falta para bajar de
     nivel, no por cuándo se creó la habilidad — sin esto el tope enseñaba las
     tres primeras que hubiera y escondía justo la que baja mañana.
     `diasParaBajarNivel` da null cuando no hay nivel que perder: esas al final. */
  const decayPorUrgencia = decayingList.slice().sort((a, b) => {
    const da = diasParaBajarNivel(a), db = diasParaBajarNivel(b);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });

  const attention = [
    ...dueList.map(p => `
      <button class="att-item" onclick="openPerk('${p.id}')">
        <span class="dot" style="background:var(--fire-soft);color:var(--fire)">${icon("flag", 17)}</span>
        <span class="tx"><b>${escapeHtml(p.name)}</b><span>${tx("El plan venció — confirma si lo lograste")}</span></span>
        <span class="go">→</span>
      </button>`),
    ...decayPorUrgencia.map(s => {
      const d = diasParaBajarNivel(s);
      return `
      <button class="att-item" onclick="openDetail('${s.id}')">
        <span class="dot" style="background:var(--coral-soft);color:var(--coral)">${icon(s.icon, 17)}</span>
        <span class="tx"><b>${escapeHtml(s.name)}</b><span>−${desgasteDiario(s)} XP al día${d ? ` · a ${d} día${d === 1 ? "" : "s"} de bajar al nivel ${levelInfo(s.xp).level - 1}` : ""}</span></span>
        <span class="go">→</span>
      </button>`;
    })
  ];
  const stalledProjects = projects.filter(p => projectHealth(p).key === "stalled");
  stalledProjects.forEach(p => attention.push(`
      <button class="att-item" onclick="openProject('${p.id}')">
        <span class="dot" style="background:var(--coral-soft);color:var(--coral)">${icon(p.icon, 17)}</span>
        <span class="tx"><b>${escapeHtml(p.name)}</b><span>${T`Estancado ${daysIdle(p)} días — retómalo o suéltalo`}</span></span>
        <span class="go">→</span>
      </button>`));
  if (!stk.activeToday) {
    attention.push(`
      <button class="att-item" onclick="showView('home')">
        <span class="dot" style="background:var(--mint-soft);color:var(--mint)">${icon("flame", 17)}</span>
        <span class="tx"><b>${tx("Aún no registras práctica hoy")}</b><span>${tx("Una sesión corta mantiene viva tu racha")}</span></span>
        <span class="go">→</span>
      </button>`);
  }

  // Cada bloque del tablero es un widget que se puede mover u ocultar
  const W = {
    /* ---- La tarjeta de la racha ----

       Estaba desaprovechada y se veía: media tarjeta de cielo vacío arriba, el
       contenido apretado contra el borde de abajo y el mes en una esquina.
       Eduardo lo comparó con la pantalla de racha de Duolingo, que es la
       referencia obvia del género, y la pregunta que sacamos de ahí no fue
       «cómo copiarla» sino qué hace bien: **el mes entero es la superficie que
       hace volver, no el número.** Ver el mes llenándose es lo que engancha;
       el número solo lo resume.

       Y desde 0.7.35 la tarjeta **sabe de qué ancho es**, medido en píxeles y
       no en columnas del tablero. Los umbrales viven en el CSS —`@container`
       sobre `.streak-card`— y aquí se escribe todo siempre.

       ---- Y en 0.7.56 el mes pasó a mandar ----
       Hasta la 0.7.47 eran TRES bloques en fila —la marca, el hito, el mes—,
       y ese reparto tenía tres problemas que se veían y ninguno era de color:
       217 px de sangría a la izquierda contra 18 a la derecha, cada bloque
       empezando a una altura distinta, y 166 de los 456 px de la tarjeta
       vacíos. Encima, el tercer bloque solo aparecía pasados los 1150 px, o
       sea que el hito no existía en teléfono, tableta ni laptop.

       Ahora son DOS: el mes a la izquierda y un solo carril a su derecha con
       la marca arriba y el hito debajo. Con dos bloques no hay junta interior
       que repartir —hay un margen igual a los dos lados—, los dos arrancan en
       la misma línea, y el alto de la tarjeta es el que pide el mes. El
       precipicio de 1150 desaparece con el tercer bloque.

       El alto NO se elige: sale del ancho (ver `ALTO_RACHA`). Estirarla hacia
       abajo solo añade cielo vacío, que es justo el problema del que venimos.

       Lo que NO se copia de Duolingo, y es a propósito: ni las cápsulas de
       colores por semana, ni los congeladores, ni las flechas para pasear por
       meses viejos, ni el susto de «te quedan 2 días para recuperar tu racha».
       Un aviso en Norata informa y da la salida; no mete prisa. */
    racha: () => {
      const cuentas = activityDayCounts();
      const hoy = todayKey();
      const anio = Number(hoy.slice(0, 4));
      const mes = Number(hoy.slice(5, 7));

      /* La frase de hoy. Es lo unico de esta tarjeta que pide algo, y pide sin
         asustar: dice que falta y con que se resuelve, nunca cuanto vas a
         perder. */
      const hoyCuenta = (cuentas.get(hoy) || 0) > 0;
      /* Con la racha rota, el numero grande dice 0 y esa es toda la verdad que
         daba la tarjeta: parece que no hay nada detras. Pero `streakInfo` ya
         sabe a cuanto llegaste, asi que la frase —que es la unica pieza de esta
         tarjeta que habla— lo dice antes de pedir nada. No es una cuarta pieza:
         es la misma frase diciendo algo cierto en vez de nada. Y el cierre se
         queda al final, en aspiracional, como manda el tono.

         Pide `best > 1` porque «tu mejor racha fue 1 dia» no consuela a nadie:
         ahi vale mas la frase corta de siempre. */
      const frase = hoyCuenta
        ? tx("Hoy ya cuenta.")
        : (stk.cur > 0
          ? tx("Hoy todavía no cuenta. Cualquier registro la mantiene viva.")
          : (stk.best > 1
            ? T`Llegaste a ${stk.best} días seguidos. Cualquier registro de hoy la echa a andar.`
            : tx("Cualquier registro de hoy la echa a andar.")));

      return `
      <div class="scene-card streak-card">
        ${scene(820, 230, 11)}
        <div class="scene-fade"></div>
        <div class="scene-body">
          ${/* ---- Tres piezas y ni una mas (0.7.100) ----
                Esta tarjeta llego a decir SIETE cosas: el numero, la fraccion de
                la semana, la del mes, la frase de hoy, la comparacion con la
                semana pasada, el proximo hito y que misiones la sostenian. Todas
                ciertas y ninguna de mas por si sola; el problema es que las
                siete pedian el mismo turno de atencion y ninguna ganaba.

                Eduardo lo dijo entero: «decir tanta info no ayuda y solo provoca
                que la gente no quiera leer los textos, entonces se vuelve inutil
                si nadie quiere prestar atencion a Resumen». Y ahi esta lo que va
                mas alla de esta tarjeta: la racha es el 25% del Resumen y es la
                PRIMERA. Si lo primero que ves es denso, aprendes que esta
                pantalla se hojea, y a partir de ahi las otras siete tarjetas no
                se leen por buenas que sean. **La racha no solo se lee a si
                misma: decide si el Resumen se lee.**

                Asi que quedan tres, en este orden y por este motivo:

                  1. la CABECERA dice donde estas —cuantos dias llevas— y si hoy
                     hace falta algo. Es lo unico accionable;
                  2. el MES es el dibujo, y es lo que hace volver a mirar. Dice
                     por si solo lo que decian las dos fracciones que se fueron,
                     y lo dice sin que haya que leer un numero;
                  3. el HITO, en un renglon, porque es lo unico que empuja a
                     volver HOY y no lo dice ninguna otra pieza de la app.

                Lo que se fue con esto: la comparacion con la semana pasada, que
                duro de la 0.7.99 a la 0.7.100. No estaba mal —la eligio el
                mismo Eduardo— pero con el mes de protagonista pasaba a ser la
                tercera forma de decir lo mismo, y el mes lo dice mejor. */""}
          ${/* El titulo dice «Racha» a secas: el mes lo dice el propio
                calendario, tres renglones mas abajo, donde etiqueta lo que hay
                que leer. Con los dos puestos salia «septiembre 2026» dos veces
                en la misma tarjeta. Antes no chocaban porque cada reparto
                escondia uno con CSS — y esa clase de arreglo es justo la que se
                fue con los repartos. */""}
          <div class="label">${tx("Racha")}</div>
          ${/* La cabecera envuelve: en una tarjeta ancha la frase de hoy va a la
                derecha del numero, y en un telefono cae debajo. Es la misma
                pieza en los dos sitios, no dos repartos distintos — que es de
                lo que venimos. */""}
          <div class="streak-row">
            ${/* La llama respira mientras la racha este viva. Con la racha rota
                  se queda quieta: una llama que late encima de un cero anima
                  algo que no esta pasando. */""}
            <span class="flame ic${stk.cur > 0 ? " viva" : ""}"><svg viewBox="0 0 24 24">${ICONS.flame}</svg></span>
            <span class="num">${stk.cur}</span>
            <span class="lbl">${stk.cur === 1 ? tx("día<br>de racha") : tx("días<br>de racha")}</span>
            <p class="sg-hoy${hoyCuenta ? " si" : ""}">${escapeHtml(frase)}</p>
          </div>
          ${calendarioRacha(anio, mes, cuentas, hoy)}
          ${bloqueDelHito(stk.cur)}
        </div>
      </div>`;
    },

    misiones: () => {
      const { due, done, pct } = todayMissionStats();
      const key = todayKey();
      /* ---- El día sin misiones también es un día ----
         Aquí había un `return ""`, y una tarjeta que devuelve vacío se cae del
         tablero entera (ver `visibles`, más abajo). Eso convertía un martes sin
         nada programado en lo que parece un fallo: la tarjeta que pusiste tú
         desaparece sola y deja su hueco en el acomodo.

         Y llegar a cero es fácil sin haberlo buscado: apartar todo a
         "Pendientes de la semana" o a un tablero propio lo hace, archivarlo
         todo lo hace, y tener solo semanales que no caen hoy lo hace.

         Así que la tarjeta se queda y dice lo que pasa. Son dos vacíos
         distintos y piden cosas distintas: quien todavía no tiene ninguna
         necesita saber qué es una misión; quien las tiene pero hoy no le toca
         ninguna solo necesita el camino para adelantar algo. */
      if (!due.length) {
        const tiene = missions.some(m => !m.archived);
        return `
        <div class="panel ms-today ms-hueca">
          <div class="mt-head">
            <div class="mt-tx">
              <b>${tx("Misiones de hoy")}</b>
              <span>${tiene ? tx("Hoy no te toca ninguna") : tx("Todavía no tienes ninguna")}</span>
            </div>
            <button class="btn ${tiene ? "btn-linea" : "btn-soft"} btn-sm" onclick="${
              tiene ? "showView('missions')" : "openMissionForm()"}">${
              tiene ? "Ver misiones" : tx("Crear una")}</button>
          </div>
          ${/* La nota se centra en lo que sobre de tarjeta: el alto lo eligió
                el acomodo pensando en una lista de misiones, y con dos frases
                pegadas arriba el resto se lee como un panel roto. */""}
          <p class="settings-note mt-hueco">${tiene
            ? tx("Un día sin misiones programadas también cuenta. Si quieres adelantar algo, tráelo a hoy desde Misiones.")
            : tx("Una misión es algo que haces hoy y que suma a una habilidad. La primera es la que echa a andar la racha.")}</p>
        </div>`;
      }
      const pend = due.filter(m => !missionDone(m, key));
      return `
      <div class="panel ms-today">
        <div class="mt-head">
          <div class="ring-wrap" style="width:64px;height:64px">
            ${ring(64, 7, [{ pct: pct / 100, color: "var(--mint)" }], "var(--carril)")}
            <div class="ring-center"><div class="v" style="font-size:15px"><b>${done.length}/${due.length}</b></div></div>
          </div>
          <div class="mt-tx">
            <b>${tx("Misiones de hoy")}</b>
            <span>${pend.length === 0 ? tx("Todas cumplidas")
              : (pend.length === 1 ? T`${pend.length} pendiente` : T`${pend.length} pendientes`)}</span>
          </div>
          <button class="btn btn-soft btn-sm" onclick="showView('missions')">${tx("Ver todas")}</button>
        </div>
        ${/* Lo pendiente primero y lo cumplido después, pero cumplido a la
              vista: esto es un resumen del día, y un día del que ya
              desaparece lo hecho cuenta la mitad de la historia. Además, al
              marcar una desde aquí se ve el cambio en el sitio donde se
              tocó, en vez de esfumarse la tarjeta. */""}
        ${(() => {
          const hechas = due.filter(m => missionDone(m, key));
          const lista = [...pend, ...hechas].slice(0, 5);
          const resto = due.length - lista.length;
          if (!lista.length) return "";
          return `<div class="ms-list" style="margin-top:14px">
          ${lista.map(m => {
            const c = missionCount(m, key), t = missionTarget(m);
            return `<div class="ms-card ${c >= t ? "done" : ""}" style="${tonos("mc", m.color)}">
              ${botonMision(m, c, t)}
              ${iconoMision(m)}
              <div class="ms-body"><div class="ms-name">${escapeHtml(m.name)}</div></div>
            </div>`;
          }).join("")}
          ${resto > 0 ? `<p class="settings-note" style="margin:2px 0 0">y ${resto} más en Misiones.</p>` : ""}
        </div>`;
        })()}
      </div>`;
    },

    niveles: () => {
      const totalXp = skills.reduce((a, s) => a + (s.xp || 0), 0);
      // La habilidad más cerca de subir: es lo único accionable de la tarjeta
      let cerca = null;
      skills.forEach(s => {
        const li = levelInfo(s.xp);
        if (li.level >= MAX_LEVEL) return;
        if (!cerca || li.pct > cerca.pct) {
          cerca = { s, pct: li.pct, falta: li.needed - li.inLevel, nivel: li.level + 1 };
        }
      });
      return `
      <button class="sum-card a" onclick="showView('home')" style="width:100%">
        ${icon("chart", 22)}
        <div class="n">${totalLevels}</div>
        <div class="t">${skills.length === 1 ? T`niveles en ${skills.length} habilidad` : T`niveles en ${skills.length} habilidades`}</div>
        <div class="sc-rows">
          ${/* «XP TOTAL» era un acumulado que solo sube: enseñarlo cada día en
                el Resumen no cambia nada de lo que haces. Lo sustituye lo que
                se movió esta semana, con su flecha contra la anterior — la
                misma regla y el mismo motor que los cuatro paneles grandes
                (js/10f-informes.js). El total sigue en el informe. */
             (() => {
               const a = metricasHabilidades(ventanaDe(7, 0));
               const b = metricasHabilidades(ventanaDe(7, 1));
               return `<div><b>${fmtXp(a.ganada)}</b><span>${tx("XP · 7 DÍAS")}</span>${
                 flechaHTML(variacion(a.ganada, b.ganada), tx("XP ganada frente a los 7 días anteriores"))}</div>`;
             })()}
          ${decayingList.length ? `<div><b style="color:var(--fire)">${decayingList.length}</b><span>${tx("DECAYENDO")}</span></div>` : ""}
        </div>
        ${cerca ? `<div class="sc-near">
          <span>${T`A ${cerca.falta} XP del nivel ${cerca.nivel}`}</span>
          <b>${escapeHtml(cerca.s.name)}</b>
          <i style="--p:${cerca.pct}%;${tonos("c", cerca.s.color)}"></i>
        </div>` : ""}
      </button>`;
    },

    /* La expedición: el nivel de la CUENTA, que no es el de ninguna habilidad.
       Va al lado de "Niveles" a propósito —son primos y conviene que se lean
       juntos— pero dicen cosas distintas: aquella suma lo que practicas, esta
       cuenta lo que has recorrido en la app entera.

       Lo que la hace útil no es la cifra, es la última línea: **el próximo
       desbloqueo, con lo que falta escrito**. Un premio sorpresa no mueve a
       nadie; uno que se ve venir, sí. Y los de Pro salen igual, con su
       etiqueta: a la vista y deseables, nunca escondidos.

       Y lleva a «Mi expedición», que es el destino que esta misma nota pedía
       cuando todavía no existía: la tarjeta habla de tu nivel, y la pantalla
       de tu nivel es esa. Antes iba a Ajustes → Mi apariencia por falta de
       sitio mejor, que es un buen atajo para recoger un premio y un mal
       destino para «¿por dónde voy?». */
    expedicion: () => {
      const info = nivelExpedicion();
      const r = rangoExpedicion(info.nivel);
      const prox = proximoDesbloqueo(info.nivel);
      const faltan = prox ? prox.nivel - info.nivel : 0;
      return `
      <button class="sum-card a" onclick="abrirColeccion('summary')" style="width:100%;text-align:left">
        <div class="exp-cab">
          ${insigniaExpedicionHTML(38) || `<span class="ic">${icon("compass", 22)}</span>`}
          <div class="exp-cifra">
            <div class="n">${info.nivel}</div>
            <div class="t">${tx("de expedición")}${r ? " · " + escapeHtml(nombreDeRango(r)) : ""}</div>
          </div>
        </div>
        <div class="sc-rows">
          <div><b>${info.faltan}</b><span>${T`PUNTOS PARA EL ${info.nivel + 1}`}</span></div>
        </div>
        ${prox ? `<div class="sc-near">
          <span>${faltan === 1 ? tx("En el siguiente nivel") : T`A ${faltan} niveles`}${prox.pro ? tx(" · con Pro") : ""}</span>
          <b>${escapeHtml(tx(prox.corto || prox.nombre))}</b>
          <i style="--p:${info.pct}%"></i>
        </div>` : ""}
      </button>`;
    },

    invertido: () => {
      const enCurso = activeList.length + dueList.length;
      const permanentes = state.perks.filter(p => p.status === "completed").length;
      // El talento en curso que más cerca está de cerrarse
      let cerca = null;
      [...activeList, ...dueList].forEach(p => {
        const pct = perkProgress(p);
        if (!cerca || pct > cerca.pct) cerca = { p, pct };
      });
      return `
      <button class="sum-card b" onclick="showView('tree')" style="width:100%">
        ${icon("map", 22)}
        ${/* Encabeza lo que ya conseguiste y no lo que gastaste, igual que el
              panel de Talentos desde 0.7.30: una persona vale por lo que es,
              no por su gasto, y el dinero presidiendo decía lo contrario. El
              importe no desaparece, baja a la fila —con el código de la
              moneda más pequeño, que es la unidad y no una cifra—. */""}
        <div class="n">${permanentes}</div>
        <div class="t">${permanentes === 1 ? tx("talento ya es tuyo") : tx("talentos ya son tuyos")}</div>
        <div class="sc-rows">
          <div><b${enCurso ? ` style="color:var(--fire)"` : ""}>${enCurso}</b><span>${tx("EN CURSO")}</span></div>
          <div><b>${moneyHTML(invested)}</b><span>${tx("INVERTIDO")}</span></div>
        </div>
        ${cerca ? `<div class="sc-near">
          <span>${T`${cerca.pct}% hecho, lo más avanzado`}</span>
          <b>${escapeHtml(cerca.p.name)}</b>
          <i style="--p:${cerca.pct}%;${tonos("c", cerca.p.color || "var(--fire)")}"></i>
        </div>` : ""}
      </button>`;
    },

    /* ---- Tus cifras: las tres de arriba en una sola tarjeta (0.7.134) ----
       Expedición, Niveles e Invertido son la misma pieza —cifra grande, rótulo
       y un renglón—, y en dos columnas ocupaban diez filas de las ocho que hay.
       Juntas caben en dos, y de paso se acaba para siempre la regla de que dos
       de ellas no se toquen: aquí no pueden, son una.

       Cada celda es un botón y lleva a donde llevaba su tarjeta. Lo que se
       queda fuera es el renglón de «lo más cerca»: la tira es un vistazo, y el
       detalle vive en las tarjetas sueltas, que siguen en el ＋.

       Una celda por módulo ENCENDIDO: con Habilidades apagado no hay niveles
       que contar, y con Talentos cerrado por nivel la celda se queda con su
       candado, como la tarjeta cerrada del tablero. */
    cifras: () => {
      const info = nivelExpedicion();
      const r = rangoExpedicion(info.nivel);
      const celdas = [`
        <button class="tc" onclick="abrirColeccion('summary')">
          <span class="tc-n">${info.nivel}</span>
          <span class="tc-t">${tx("de expedición")}${r ? " · " + escapeHtml(nombreDeRango(r)) : ""}</span>
          <span class="tc-x">${T`${info.faltan} puntos para el ${info.nivel + 1}`}</span>
          <i style="--p:${info.pct}%"></i>
        </button>`];
      if (moduloOn("home")) {
        const xp = metricasHabilidades(ventanaDe(7, 0)).ganada;
        celdas.push(`
        <button class="tc" onclick="showView('home')">
          <span class="tc-n">${totalLevels}</span>
          <span class="tc-t">${skills.length === 1 ? T`niveles en ${skills.length} habilidad` : T`niveles en ${skills.length} habilidades`}</span>
          <span class="tc-x">${T`${fmtXp(xp)} XP en 7 días`}</span>
        </button>`);
      }
      if (moduloOn("tree")) {
        if (!moduloAbierto("tree")) {
          celdas.push(`
          <button class="tc tc-cerrada" onclick="avisoModuloCerrado('tree')">
            <span class="tc-n">${icon("lock", 18)}</span>
            <span class="tc-t">${tx("Talentos")}</span>
            <span class="tc-x">${T`Se abre en el nivel ${MODULO_NIVEL.tree}`}</span>
          </button>`);
        } else {
          const tuyos = perks.filter(p => p.status === "completed").length;
          celdas.push(`
          <button class="tc b" onclick="showView('tree')">
            <span class="tc-n">${tuyos}</span>
            <span class="tc-t">${tuyos === 1 ? tx("talento ya es tuyo") : tx("talentos ya son tuyos")}</span>
            <span class="tc-x">${T`${activeList.length + dueList.length} en curso`}</span>
          </button>`);
        }
      }
      return `<div class="panel tira-cifras" style="--celdas:${celdas.length}">${celdas.join("")}</div>`;
    },

    proyectos: () => {
      const live = projects.filter(p => p.status === "active" || p.status === "paused");
      if (!live.length) return "";
      return `
      <button class="sum-card wide" onclick="showView('projects')" style="width:100%">
        <div class="sw-head">
          ${icon("flag", 20)}
          <span>${tx("Proyectos")}</span>
          <span class="sw-go">→</span>
        </div>
        <div class="sw-rows">
          ${live.slice(0, 4).map(p => {
            const pg = projectProgress(p), hh = projectHealth(p);
            return `<div class="sw-row">
              <span class="sw-name">${escapeHtml(p.name)}</span>
              <span class="sw-bar"><i style="width:${pg}%;background:${trazo(p.color)}"></i></span>
              <span class="sw-pct" style="color:${hh.color}">${pg}%</span>
            </div>`;
          }).join("")}
        </div>
      </button>`;
    },

    /* El recorte se hace AQUÍ y no al construir `attention`, para que la lista
       entera siga disponible para quien la cuenta de verdad. */
    atencion: () => {
      const sobran = Math.max(0, attention.length - ATENCION_TOPE);
      return `
      <div class="panel">
        <h3>${tx("Atención hoy")}</h3>
        ${attention.length
          ? attention.slice(0, ATENCION_TOPE).join("")
          : `<p class="settings-note" style="margin:0">${tx("Todo bajo control. Nada urge hoy — sigue explorando.")}</p>`}
        ${sobran ? `<p class="settings-note" style="margin:12px 0 0">${
          sobran === 1 ? tx("Hay una más, en su propia ficha.")
                       : T`Hay ${sobran} más, cada una en su ficha.`}</p>` : ""}
      </div>`;
    },

    listos: () => !readyList.length ? "" : `
      <div class="panel alt ready-panel">
        <h3>${tx("Listos para empezar")}</h3>
        <p class="settings-note">${tx("Estos talentos están desbloqueados y esperando. Empieza uno para ponerlo en progreso.")}</p>
        <div class="ready-grid">
          ${readyList.slice(0, 6).map(p => `
            <button class="ready-chip" onclick="openPerk('${p.id}')" style="${tonos("rc", p.color)}">
              <span class="rc-ic">${icon(p.icon, 17)}</span>
              <span class="rc-tx">
                <b>${escapeHtml(p.name)}</b>
                <span>${escapeHtml(p.branch || "General")}${p.cost > 0 ? " · " + money(p.cost) : ""}</span>
              </span>
            </button>`).join("")}
        </div>
        ${readyList.length > 6 ? `<p class="settings-note" style="margin:12px 0 0">y ${readyList.length - 6} más en el árbol.</p>` : ""}
      </div>`
  };

  const { order, hidden } = dashLayout();
  /* ---- Apagado desaparece; CERRADO se queda con su candado ----
     Son dos cosas distintas y hasta 0.7.95 el tablero las trataba igual: las
     dos hacían desaparecer la tarjeta.

     Un módulo APAGADO desaparece porque la persona lo apagó — no hay nada que
     anunciarle sobre algo que ella misma quitó, y su tarjeta vuelve sola al
     encenderlo. Un módulo CERRADO no: ahí la tarjeta se queda puesta, apagada
     y diciendo en qué nivel se abre. Lo decidió Eduardo, y corrige lo que hacía
     la 0.7.93 —esconderlas— con el argumento bueno: **un tablero al que le
     faltan tres huecos no enseña que vienen tres cosas, enseña un tablero
     pequeño.** Con la tarjeta puesta, el Resumen del primer día ya tiene la
     forma que va a tener siempre y lo que falta se ve venir.

     `cerrados` es la lista de las que van así; salen del filtro normal —su
     cuerpo no se puede pintar, no hay datos— y se les da uno propio. */
  const cerrado = (id) => !!DASH_MODULO[id] && moduloOn(DASH_MODULO[id]) && !moduloAbierto(DASH_MODULO[id]);
  /* **Una tarjeta cerrada por módulo, no una por widget.** Talentos alimenta
     dos del tablero —«Invertido» y «Listos para empezar»— y Misiones otras
     dos, así que sin esto el Resumen del primer día enseñaba «Talentos · Nivel
     2 de 3» DOS VECES, una debajo de otra y diciendo exactamente lo mismo. Se
     queda la primera en el orden que tenga puesto la persona, que es la que
     ella colocó más arriba. Lo cazó una medición, no la vista. */
  const yaCerrado = {};
  const visibles = order.filter(id => {
    if (hidden.includes(id)) return false;
    if (DASH_MODULO[id] && !moduloOn(DASH_MODULO[id])) return false;
    if (!W[id]) return false;
    if (!cerrado(id)) return !!W[id]();
    const mod = DASH_MODULO[id];
    if (yaCerrado[mod]) return false;
    yaCerrado[mod] = true;
    return true;
  });
  /* Dónde va cada una. En el teléfono no hay columnas que repartir: se apilan
     en el orden de lectura y la cuadrícula de una sola columna hace el resto. */
  const sitio = isDesktop() ? disposicionTablero(visibles, dashCols()) : {};
  const piezas = visibles
    .map(id => {
      const body = cerrado(id) ? cuerpoCerrado(id) : (W[id] ? W[id]() : "");
      if (!body) return "";
      const meta = DASH_META[id];
      const sz = dashSize(id);
      const p = sitio[id];
      return `
      <div class="widget${cerrado(id) ? " w-cerrado" : ""}" data-w="${id}" style="--w:${sz.w};--h:${sz.h}${
        p ? `;--c:${p.c + 1};--f:${p.f + 1}` : ""}">
        ${body}
        <div class="w-edit">
          <span class="w-grip">${icon("map", 14)} ${escapeHtml(tx(meta.title))}</span>
          <button class="w-hide" onclick="hideWidget('${id}')" aria-label="${escapeAttr(T`Quitar ${tx(meta.title)}`)}">✕</button>
        </div>
        <button class="w-resize" aria-label="${escapeAttr(T`Cambiar tamaño de ${tx(meta.title)}`)}">
          <svg viewBox="0 0 24 24"><path d="M20 10v10H10M20 20l-9-9"/></svg>
        </button>
      </div>`;
    })
    .filter(Boolean);

  /* El botón de acomodar aparece cuando hay algo que acomodar. Con una sola
     tarjeta no existe un orden que elegir, así que ofrecerlo antes es enseñar
     una herramienta que no puede hacer nada — y recién estrenada la app es
     justo cuando más despista. */
  if (piezas.length < 2) dashEditing = false;
  if (btnTablero) btnTablero.style.display = piezas.length > 1 ? "" : "none";

  /* "editing" enciende las etiquetas, el asa de tamaño y el meneo de las
     tarjetas. En el teléfono no hay nada de eso: la bandeja sale igual, pero
     el tablero se queda como está. */
  el.className = dashEditing ? (isDesktop() ? "dash editing" : "dash eligiendo") : "dash";
  el.innerHTML = piezas.join("");
  /* La bandeja del Modo Editor vive fuera del tablero: dentro competía por
     una celda con las tarjetas y había que calcularle filas a mano. */
  const host = document.getElementById("dash-tray-host");
  if (host) host.innerHTML = dashEditing ? dashTray(hidden) : "";

  marcarDesbordes();
  if (dashEditing && isDesktop()) attachDashHandlers();
}

/* ================= Tablero personalizable =================
   El Resumen es una rejilla de widgets: se reordenan arrastrando
   (mantén pulsado para entrar en modo edición) y se pueden quitar o volver a añadir. */

/* El cuerpo de una tarjeta cuyo módulo todavía no abre el nivel. No es un
   widget más: no hay datos que resumir, así que lo que se pinta es la promesa
   —el dibujo del módulo, la barra de cuánto falta y el nivel al que llega—.

   El dibujo sale del BOTÓN de la barra (`trazoDeModulo`, js/04-misiones.js) por
   lo mismo que en la celebración: un dibujo, un sitio. Y se toca: lleva al
   mismo cuadro que el candado del menú, con su aro y con lo que te espera
   dentro. Una tarjeta cerrada que no contesta al tocarla es un adorno.

   Es un `button` y no un `div` porque se pulsa: un div con onclick no entra con
   el tabulador ni contesta al Enter. */
function cuerpoCerrado(id) {
  const mod = DASH_MODULO[id];
  const m = (typeof MODULOS !== "undefined" ? MODULOS : []).find(x => x.id === mod);
  const pide = (typeof MODULO_NIVEL !== "undefined" && MODULO_NIVEL[mod]) || 0;
  if (!m || !pide) return "";
  const trazo = typeof trazoDeModulo === "function" ? trazoDeModulo(mod) : "";
  const f = typeof faltaParaNivel === "function"
    ? faltaParaNivel(pide) : { abre: T`Se desbloquea en el nivel ${pide}` };
  return `
    <button type="button" class="wc" onclick="avisoModuloCerrado('${escapeAttr(mod)}')"
      aria-label="${escapeAttr(T`${tx(m.label)} · se abre en el nivel ${pide}`)}">
      <span class="wc-alto">
        <b>${trazo ? `<svg class="wc-ic" viewBox="0 0 24 24" aria-hidden="true">${trazo}</svg>` : ""}${escapeHtml(tx(m.label))}</b>
        <span class="wc-llave">${icon("lock", 13)}</span>
      </span>
      ${/* Sin candado dentro de la barra: en esta tarjeta ya hay uno arriba a la
           derecha, y dos serían el mismo dibujo dos veces. */""
      }${typeof barraDeNivelHTML === "function" ? barraDeNivelHTML(pide, { chica: true }) : ""}
      <span class="wc-abre">${escapeHtml(f.abre)}</span>
    </button>`;
}

const DASH_META = {
  /* Una columna siempre desde la 0.7.100: ver `ALTO_RACHA`. */
  racha:     { title: "Racha", w: 1, h: 6 },
  misiones:  { title: "Misiones de hoy", w: 1, h: 8 },
  atencion:  { title: "Atención hoy", w: 1, h: 3 },
  niveles:   { title: "Niveles", w: 1, h: 3 },
  /* El nivel de la CUENTA. Una fila más alta que sus vecinas porque lleva
     tres cosas y no dos: la cifra con su insignia, los puntos que faltan y
     el próximo desbloqueo. */
  expedicion: { title: "Expedición", w: 1, h: 4 },
  invertido: { title: "Invertido", w: 1, h: 3 },
  proyectos: { title: "Proyectos", w: 1, h: 3 },
  listos:    { title: "Listos para empezar", w: 1, h: 4 },
  /* Las tres cifras en una (0.7.134). Dos filas y no más de tres: estirada
     solo gana aire. */
  cifras:    { title: "Tus cifras", w: 1, h: 2 }
};
const DASH_DEFAULT = ["racha", "misiones", "atencion", "expedicion", "niveles", "invertido", "proyectos", "listos", "cifras"];
/* Tarjetas que llegan escondidas. Un tablero ya acomodado recibe las tarjetas
   nuevas al fondo (ver `dashLayout`), y con "Tus cifras" eso ponía debajo de
   todo lo mismo que ya dicen tres tarjetas de más arriba. Entra en el tablero
   cuando un acomodo la pone o cuando alguien la trae con el ＋. */
const DASH_LLEGAN_OCULTAS = ["cifras"];
/* Qué módulo alimenta cada tarjeta del tablero. "racha" y "atencion" no
   aparecen porque se nutren de todo y siguen teniendo sentido con
   cualquier combinación encendida. */
const DASH_MODULO = {
  misiones: "missions", niveles: "home",
  invertido: "tree", listos: "tree", proyectos: "projects"
};
const ROW_H = 56, ROW_GAP = 22;
/* El hueco vertical es distinto del horizontal (gap: 24px 22px), y para
   colocar por filas hay que usar el de verdad: con el otro, la cuenta se va
   desviando una fila cada pocas filas. */
const ROW_GAP_V = 24;
const ROW_PITCH = ROW_H + ROW_GAP_V;
/* Suelo de encogimiento, medido tarjeta por tarjeta: por debajo de esto
   deja de comunicar. No es una cifra común porque no todas dicen lo mismo
   —"Listos para empezar" es una lista y necesita cuatro; "Proyectos" es un
   dato suelto y se apaña con dos—. El techo sigue siendo el mismo para
   todas: encoger estropea, agrandar no. */
const DASH_MIN_H = { racha: 6, misiones: 3, atencion: 2, expedicion: 3, niveles: 3, invertido: 3, proyectos: 2, listos: 4, cifras: 2 };
/* Techo generoso: son 40 filas de la cuadrícula, más de dos pantallas de
   alto. Existe solo para que un tirón desbocado del asa no deje una tarjeta
   de mil filas imposible de volver a encoger. */
const DASH_MAX_H = 40;

/* ================= Acomodos sugeridos =================
   Acomodar el tablero a mano es lento: ocho tarjetas, cada una con su sitio y
   su tamaño, y hasta que no está entero no se sabe si el reparto funciona.
   Estos tres son puntos de partida ya probados; desde cualquiera de ellos se
   sigue arrastrando a gusto.

   ---- Se rehicieron los doce en la 0.7.134, y por qué ----
   Los de la 0.7.56 se escribieron cuando la racha podía ir a lo ancho, y desde
   la 0.7.100 va siempre en una columna. Nadie los rehízo, y se notaba en tres
   cosas medidas: "Panorama" y "Mirador" prometían la escena a lo ancho y
   salían casi iguales; para tapar huecos se estiraban tarjetas de cifra
   (Niveles con 6 filas para 3 de contenido, Proyectos con 7), y en dos
   columnas el tablero pedía casi dos pantallas — 640 px de más en una laptop
   de 1366 x 768.

   **Lo último no se arreglaba con ningún orden, y eso decidió lo demás.** Las
   ocho tarjetas piden 30 filas como poco; en dos columnas son 15, unos 1200
   px, y una laptop de 768 tiene sitio para 8. Así que en dos columnas el
   acomodo **también elige qué tarjetas salen**: cuatro o cinco, y las demás
   esperan en el ＋ del Modo Editor. Es un cambio sobre la regla de antes —«el
   acomodo reparte lo que hay, no qué debe haber»—, y lo aprobó Eduardo. Si
   alguien devuelve una con el ＋, el scroll es decisión suya.

   ---- Cómo se escriben ahora ----
   Por COLUMNAS: qué tarjetas van en cada una, de arriba abajo. Las alturas no
   se escriben: salen de lo que cada tarjeta mide (`filasQuePide`), y lo que
   sobre de pantalla se reparte solo entre las LISTAS —misiones, atención,
   listos, proyectos—. Una tarjeta de cifra nunca se estira: con tres renglones
   de contenido en seis filas se lee como una tarjeta rota. Ver `colocarAcomodo`.

   "cifras" es "Tus cifras" —Expedición, Niveles y Talentos en una sola
   tarjeta— en vez de las tres sueltas. Va en todas las pantallas menos en el
   monitor de tres columnas, que es la única donde hay sitio para las tres.
   `ancha` la pone a lo ancho, arriba o abajo: es para la tableta, donde una
   columna mide 333 px y tres cifras no caben en ella.

   Las dos reglas de antes siguen: **ninguna columna termina antes que las
   otras** (lo garantiza el reparto, que llena cada columna hasta el mismo
   fondo) y **dos tarjetas de cifra no se tocan**, ni de lado ni de arriba
   abajo. En la tira no pueden tocarse porque son una.

   Los tres nombres se repiten en todas las pantallas a propósito, y ahora se
   distinguen por lo que va PRIMERO: el día, la constancia o lo que construyes.
   Es la misma pregunta en todas partes; lo que cambia es cuánto sitio hay. */
const DASH_ACOMODOS = [
  {
    nombre: "El día",
    sub: "Las misiones al centro; la racha y lo urgente a la izquierda",
    cols: [["racha", "invertido", "atencion"], ["misiones", "proyectos"], ["expedicion", "listos", "niveles"]]
  },
  {
    nombre: "Constancia",
    sub: "La racha preside al centro, y el día a su lado",
    /* "Invertido" arriba a la izquierda y "Niveles" arriba a la derecha, con
       la racha entre las dos: es el único sitio donde las tres cifras quedan
       lejos entre sí. En la primera versión "Invertido" iba al pie de la
       tercera columna y se tocaba de lado con "Expedición". */
    cols: [["invertido", "misiones", "atencion"], ["racha", "expedicion", "proyectos"], ["niveles", "listos"]]
  },
  {
    nombre: "Lo que construyo",
    sub: "Proyectos y talentos a la izquierda; el día, después",
    cols: [["proyectos", "listos", "niveles"], ["invertido", "misiones"], ["racha", "expedicion", "atencion"]]
  }
];

/* ---- Dos columnas anchas: la laptop, y cualquier ventana de dos columnas ----
   Ocho filas de pantalla en una de 768 (con la cabecera de 0.7.134), nueve en
   una de 900. La racha son seis y la tira dos, así que una columna con las dos
   ya está llena: por eso cada acomodo lleva cuatro o cinco tarjetas y no más. */
const DASH_ACOMODOS_LAPTOP = [
  {
    nombre: "El día",
    sub: "Misiones y lo urgente; al lado, la racha y tus cifras",
    cols: [["misiones", "atencion"], ["racha", "cifras"]]
  },
  {
    nombre: "Constancia",
    sub: "La racha primero; tus cifras y el día al lado",
    cols: [["racha", "atencion"], ["cifras", "misiones"]]
  },
  {
    nombre: "Lo que construyo",
    sub: "Proyectos y talentos a la izquierda; el día al lado",
    cols: [["proyectos", "listos", "atencion"], ["cifras", "misiones"]]
  }
];

/* ---- Tableta: dos columnas ESTRECHAS ----
   A 333 px por columna la racha se apila y tres cifras no caben de lado, así
   que la tira va a lo ancho y debajo quedan seis filas para dos columnas. */
const DASH_ACOMODOS_TABLETA = [
  {
    nombre: "El día",
    sub: "Tus cifras arriba; misiones y racha debajo", ancha: "arriba",
    cols: [["misiones"], ["racha"]]
  },
  {
    nombre: "Constancia",
    sub: "La racha y las misiones; tus cifras al pie", ancha: "abajo",
    cols: [["racha"], ["misiones"]]
  },
  {
    nombre: "Lo que construyo",
    sub: "Tus cifras arriba; talentos listos, proyectos y lo urgente", ancha: "arriba",
    /* Sin misiones: proyectos y talentos listos, uno encima de otro, ya
       piden siete filas de las seis que quedan debajo de la tira. */
    cols: [["listos"], ["proyectos", "atencion"]]
  }
];

/* ---- Acomodos del teléfono ----
   En una sola columna no hay nada que repartir a lo ancho ni alturas que
   elegir: lo único que cambia el tablero es QUÉ VA PRIMERO, y el teléfono se
   baja siempre. Llevan la tira igual que la laptop: son dos tarjetas menos que
   recorrer con el dedo.

   El arrastre y el resto del Modo Editor están apagados en el teléfono a
   propósito: la personalización de móvil se va a rehacer con otro gesto, y
   mientras tanto es mejor no tener a medias algo que se siente mal. */
const DASH_ACOMODOS_MOVIL = [
  {
    nombre: "El día",
    sub: "Lo de hoy primero: misiones, racha y lo que urge",
    order: ["misiones", "racha", "atencion", "cifras", "proyectos", "listos"]
  },
  {
    nombre: "Constancia",
    sub: "La racha arriba, y debajo lo que la alimenta",
    order: ["racha", "cifras", "misiones", "atencion", "listos", "proyectos"]
  },
  {
    nombre: "Lo que construyo",
    sub: "Proyectos y talentos al frente; el día, después",
    order: ["proyectos", "listos", "cifras", "misiones", "atencion", "racha"]
  }
];

/* ---- Qué forma tiene la ventana ----
   No basta el ancho de la ventana: lo que decide el reparto son las COLUMNAS,
   cuántas hay y cómo de anchas, y eso hay que medirlo.

   Hasta la 0.7.47 el segundo salto lo daba el ALTO de la ventana —una constante
   `VENTANA_BAJA` de 860— y esa cuenta dejaba fuera una forma entera: una
   ventana alta de menos de 1700 px de ancho tiene DOS columnas y recibía la
   lista de tres. Un monitor de 1512 x 950, que es una MacBook Pro de 14
   pulgadas cualquiera, veía un primer botón que prometía "tres columnas
   parejas, las misiones al centro" delante de dos columnas y sin centro; y
   medido de verdad, "Panorama" y "Mirador" ocupaban 1.72 pantallas.

   Ahora el salto es el número de columnas, que es lo que de verdad cambia el
   reparto. El alto no elige lista y no hace falta que lo haga: de que quepa ya
   se encarga `colocarAcomodo`, que mide en vez de suponer. */
function formaTablero() {
  if (!isDesktop()) return "telefono";
  const col = anchoDeColumna();
  /* Sin medida se responde lo de siempre. Es lo que había antes de que
     existieran las formas, así que en el peor caso no se empeora nada. */
  if (col && col < RACHA_LADO_A_LADO) return "tableta";
  return dashCols() < 3 ? "laptop" : "escritorio";
}

const ACOMODOS_POR_FORMA = {
  telefono: DASH_ACOMODOS_MOVIL,
  tableta: DASH_ACOMODOS_TABLETA,
  laptop: DASH_ACOMODOS_LAPTOP,
  escritorio: DASH_ACOMODOS
};

function acomodosDeAhora() {
  return ACOMODOS_POR_FORMA[formaTablero()] || DASH_ACOMODOS;
}

/* ---- Qué plantilla está puesta ----
   Se guarda el NOMBRE, no el número: las listas de la computadora y del
   teléfono no son la misma, y un índice apuntaría a otra cosa al cambiar de
   pantalla. Deja de estar puesta en cuanto se toca algo a mano —mover,
   redimensionar, quitar o añadir una tarjeta—, porque a partir de ahí el
   tablero ya no es el que propuso la plantilla. */
/* Y se guarda también la FORMA con la que se puso. Los tres nombres se
   repiten en las tres listas de escritorio, y las tres escriben en la misma
   ranura: sin esto, poner "Mirador" en la laptop y luego abrir la app en una
   tableta dejaba el botón encendido señalando un reparto que no es el que hay
   en pantalla. Un tablero guardado antes de que existieran las formas no
   lleva ninguna, y se le da por buena la de ahora: lo único que se juega es
   qué botón sale marcado. */
function acomodoActivo() {
  const d = (state.ui || {})[ranuraTablero()] || {};
  if (!d.acomodo) return null;
  if (d.forma && d.forma !== formaTablero()) return null;
  return d.acomodo;
}

function marcarAcomodo(nombre) {
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  const cur = state.ui[ranura] || {};
  if (nombre) { cur.acomodo = nombre; cur.forma = formaTablero(); }
  else { delete cur.acomodo; delete cur.forma; }
  state.ui[ranura] = cur;
}

/* Vuelve a dibujar solo la bandeja. Arrastrar o redimensionar no repinta el
   tablero (esa es justo la razón de que se sienta fluido), pero sí apaga la
   plantilla activa: sin esto, el botón se quedaría encendido señalando un
   acomodo que ya no es el que hay. */
function refrescarBandeja() {
  const host = document.getElementById("dash-tray-host");
  if (!host || !dashEditing) return;
  host.innerHTML = dashTray(dashLayout().hidden);
}

function olvidarAcomodo() {
  if (!acomodoActivo()) return;
  marcarAcomodo(null);
  save();
}

function aplicarAcomodo(i) {
  const a = acomodosDeAhora()[i];
  if (!a) return;
  recordarTablero("acomodo " + a.nombre);
  colocarAcomodo(a);
  marcarAcomodo(a.nombre);
  save();
  /* Sin aviso en el teléfono: el botón se queda encendido, que ya dice cuál
     está puesta, y cambiar de idea es tocar otro. */
  if (isDesktop()) toast(T`Acomodo ${tx(a.nombre)}`, "hecho", { label: tx("Deshacer"), onclick: "deshacerTablero()" });
}

/* Las listas que pueden crecer para llenar su columna. Una tarjeta de cifra
   no está: estirada se lee como una tarjeta rota. "Tus cifras" sí, pero solo
   hasta tres filas, que es lo que tarda en sobrarle aire. */
const DASH_CRECEN = ["misiones", "atencion", "listos", "proyectos"];
const CIFRAS_TOPE = 3;

/* ---- Cuántas filas caben debajo de la cabecera ----
   Se cuenta con lo que la página deja debajo del tablero, que se MIDE: solo se
   puede leer cuando el tablero se sale de la pantalla (si cabe, la página mide
   lo que la ventana), así que se guarda lo último medido. Con los 26 px que
   daba por hecho `encajarEnPantalla`, una laptop de 768 salía con 7 filas y no
   con 8, y el acomodo se pasaba 8 px. */
let _pieTablero = 28;
function filasDePantalla() {
  const el = document.getElementById("summary-content");
  if (!el) return 1;
  const alto = document.scrollingElement.scrollHeight;
  if (alto > window.innerHeight + 2) {
    const p = alto - (el.getBoundingClientRect().bottom + window.scrollY);
    if (p >= 0 && p < 200) _pieTablero = p;
  }
  /* La bandeja del Modo Editor no cuenta: se va al pulsar «Listo», y lo que
     tiene que caber es el tablero de después. */
  const host = document.getElementById("dash-tray-host");
  const bandeja = host && host.firstElementChild ? host.getBoundingClientRect().height + 26 : 0;
  const disp = window.innerHeight - (el.getBoundingClientRect().top + window.scrollY - bandeja) - _pieTablero;
  return Math.max(1, Math.floor((disp + ROW_GAP_V) / ROW_PITCH));
}

/* ---- Poner un acomodo ----
   Tres pasos, y el orden importa:
   1. se ponen SOLO las tarjetas que van, para poder medirlas;
   2. cada una recibe lo que mide —nunca menos— y lo que sobra de pantalla va
      a las listas de su columna, una fila cada vez a la que menos aire lleva;
   3. se escribe el sitio de cada una, columna por columna, sin huecos.

   Medir antes de colocar es lo que hace que funcione con los datos de cada
   quien: "Misiones de hoy" con dos misiones pide cuatro filas y con cinco,
   seis. Una tabla escrita a mano acierta con unos datos y falla con otros. */
function colocarAcomodo(a) {
  const el = document.getElementById("summary-content");
  const visibles = a.order ? a.order.slice() : [].concat(...a.cols, a.ancha ? ["cifras"] : []);
  const hidden = Object.keys(DASH_META).filter(id => !visibles.includes(id));

  if (!isDesktop()) {
    saveDash(visibles.concat(hidden), hidden, null, null);
    flipRender(el, renderSummary);
    return;
  }

  const antes = new Map();
  [...el.children].forEach(c => { if (c.dataset.w) antes.set(c.dataset.w, c.getBoundingClientRect()); });

  const sizes = {};
  visibles.forEach(id => sizes[id] = { w: 1, h: DASH_META[id].h });
  if (a.ancha) sizes.cifras = { w: 2, h: DASH_META.cifras.h };
  saveDash(visibles.concat(hidden), hidden, sizes, null);
  renderSummary();
  const pide = filasQuePide();

  const h = {};
  visibles.forEach(id => {
    if (id === "racha") h[id] = ALTO_RACHA;
    else if (id === "cifras") h[id] = clamp(pide[id] || 2, altoMinimo(id), CIFRAS_TOPE);
    else h[id] = Math.max(altoMinimo(id), pide[id] || 0);
  });
  const tiraH = a.ancha ? h.cifras : 0;
  const cols = a.cols.map(col => col.filter(id => !(a.ancha && id === "cifras")));
  const sumas = cols.map(col => col.reduce((s, id) => s + h[id], 0));
  const fondo = Math.max(filasDePantalla() - tiraH, ...sumas);
  cols.forEach((col, i) => {
    for (let n = sumas[i]; n < fondo; n++) {
      const crecen = col.filter(id => DASH_CRECEN.includes(id) || (id === "cifras" && h[id] < CIFRAS_TOPE));
      if (!crecen.length) break;
      crecen.sort((x, y) => (h[x] - (pide[x] || 0)) - (h[y] - (pide[y] || 0)));
      h[crecen[0]]++;
    }
  });

  const pos = {};
  const arranque = a.ancha === "arriba" ? tiraH : 0;
  cols.forEach((col, c) => {
    let f = arranque;
    col.forEach(id => { pos[id] = { c, f }; f += h[id]; });
  });
  if (a.ancha) pos.cifras = { c: 0, f: a.ancha === "arriba" ? 0 : fondo };
  Object.keys(h).forEach(id => sizes[id] = { w: a.ancha && id === "cifras" ? 2 : 1, h: h[id] });

  const orden = Object.keys(pos).sort((x, y) => pos[x].f - pos[y].f || pos[x].c - pos[y].c);
  saveDash(orden.concat(hidden), hidden, sizes, pos);
  renderSummary();
  animarDesde(el, antes);
}

/* ---- Cuántas filas pide de verdad cada tarjeta ----
   Se MIDE, no se estima: se deja que las tarjetas crezcan a su altura natural
   durante un instante, se apunta cuánto ocupan y se devuelven a su sitio. Un
   solo repintado y nadie lo ve, porque no se sale de esta función.

   Hace falta porque el alto que pide una tarjeta depende de lo que hay
   dentro: "Misiones de hoy" con diez misiones ocupa siete filas y con tres,
   cuatro. Cualquier tabla escrita a mano acierta con unos datos y se
   equivoca con otros. */
function filasQuePide() {
  const el = document.getElementById("summary-content");
  const pide = {};
  if (!el) return pide;
  el.classList.add("midiendo");
  [...el.children].forEach(w => {
    const id = w.dataset.w;
    const cuerpo = [...w.children].find(x =>
      !x.classList.contains("w-edit") && !x.classList.contains("w-resize"));
    if (!id || !cuerpo) return;
    const px = cuerpo.getBoundingClientRect().height;
    pide[id] = Math.max(1, Math.ceil((px + ROW_GAP_V) / ROW_PITCH));
  });
  el.classList.remove("midiendo");
  return pide;
}

let dashEditing = false;

/* ---- Un tablero por tamaño de pantalla ----
   El mismo reparto no puede servir en los dos sitios: en escritorio hay dos
   o tres columnas y las tarjetas tienen alto propio; en el teléfono hay una
   sola columna y el alto lo pone el contenido. Acomodar en el teléfono
   deshacía el trabajo hecho en la computadora, y al revés.

   Así que cada uno guarda el suyo y ninguno toca al otro. El del teléfono
   estrena copiando al de escritorio —se lee de ahí mientras no exista, y la
   primera vez que se acomoda algo se queda con lo que había— para que el
   día del cambio nadie se encuentre el tablero de fábrica. */
function ranuraTablero() { return isDesktop() ? "dash" : "dashMovil"; }

function dashLayout() {
  const ui = state.ui || {};
  const d = ui[ranuraTablero()] || ui.dash || {};
  const saved = Array.isArray(d.order) ? d.order.filter(id => DASH_META[id]) : [];
  const order = [...saved, ...DASH_DEFAULT.filter(id => !saved.includes(id))];
  const hidden = Array.isArray(d.hidden) ? d.hidden.slice() : [];
  DASH_LLEGAN_OCULTAS.forEach(id => { if (!saved.includes(id) && !hidden.includes(id)) hidden.push(id); });
  return {
    order,
    hidden,
    sizes: d.sizes || {},
    /* Dónde está cada tarjeta: `pos[id] = {c, f}`, columna y fila. Puede no
       existir —tableros de antes de que esto fuera posicional— y entonces se
       deduce empaquetando el orden, que es justo lo que hacía la cuadrícula
       por su cuenta. Así nadie ve su tablero cambiar al actualizar. */
    pos: d.pos || null
  };
}

/* Cuántas columnas tiene el tablero AHORA. La cuadrícula lo decide en CSS por
   el ancho de la ventana; aquí hay que saberlo para colocar y para arrastrar,
   y las dos cuentas tienen que dar lo mismo. */
function dashCols() {
  if (!isDesktop()) return 1;
  return window.matchMedia("(min-width: 1700px)").matches ? 3 : 2;
}

/* ---- Empaquetar en orden ----
   Coloca una lista de tarjetas buscando el primer hueco libre de arriba a
   abajo y de izquierda a derecha: exactamente lo que hacía la cuadrícula
   sola. Se usa para estrenar el modelo con lo que ya había y para aplicar un
   acomodo, que sigue estando escrito como una lista ordenada. */
function empaquetar(order, sizes, cols) {
  const usado = [];
  const pos = {};
  const libre = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      if (!usado[i]) continue;
      for (let j = c; j < c + w; j++) if (usado[i][j]) return false;
    }
    return true;
  };
  const marcar = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      usado[i] = usado[i] || [];
      for (let j = c; j < c + w; j++) usado[i][j] = true;
    }
  };
  order.forEach(id => {
    if (!DASH_META[id]) return;
    const s = dashSize(id);
    const w = Math.min(s.w, cols);
    for (let f = 0; f < 500; f++) {
      let puesto = false;
      for (let c = 0; c + w <= cols; c++) {
        if (libre(c, f, w, s.h)) { pos[id] = { c, f }; marcar(c, f, w, s.h); puesto = true; break; }
      }
      if (puesto) break;
    }
  });
  return pos;
}

/* ---- La disposición final ----
   Toma lo que el usuario decidió (columna y fila de cada tarjeta) y resuelve
   los solapes de la única forma que no sorprende: lo que estorba BAJA, y baja
   dentro de su columna. Nadie cambia de columna por culpa de otro, que es lo
   que convertía cada arrastre en una cascada.

   Se ordena por fila y luego por columna —el orden en que se lee— para que el
   resultado no dependa de en qué orden estén guardadas las tarjetas. */
function disposicionTablero(ids, cols, extra) {
  const { pos, sizes, order, hidden } = dashLayout();
  // Las escondidas no ocupan sitio en el reparto de estreno
  const base = pos || empaquetar(order.filter(id => !hidden.includes(id)), sizes, cols);
  /* La primera fila libre por debajo de todo lo que YA tiene sitio. Es dónde
     va a parar una tarjeta que no existía cuando esta persona acomodó su
     tablero: al fondo, sin tocar nada de lo suyo.

     Y es una fila de verdad, no un número gordo de centinela: con `f: 9999` la
     tarjeta se plantaba en la fila 9999 de la cuadrícula —el buscador de hueco
     la encontraba libre y la dejaba ahí— y el tablero se llevaba detrás
     800.000 px de vacío que sí se podían recorrer. */
  const fondo = Object.keys(base).reduce((max, id) => {
    const p = base[id], s = dashSize(id);
    return p ? Math.max(max, (p.f || 0) + (s ? s.h : 1)) : max;
  }, 0);
  /* ---- La columna que perdió una tarjeta se cierra ----
     Desde 0.7.56 el sitio de cada tarjeta está escrito, así que una que no se
     dibuja deja su rectángulo vacío: nadie vuelve a empaquetar en un
     repintado normal. Se ve como un agujero en medio del Resumen, y se lee
     como un fallo. Lo cazó Eduardo con el módulo de Misiones apagado: 640 px
     de nada en la columna del centro, con "Invertido" solo al fondo.

     Son TRES puertas al mismo hueco y las tres pasan por aquí: un módulo
     apagado se lleva su tarjeta, la ✕ del Modo Editor la quita, y una tarjeta
     puede no tener nada que decir hoy. En los tres casos el sitio se conserva
     en `pos` —esa parte sí está bien y es lo que hace que la tarjeta vuelva
     donde estaba al encender el módulo o al devolverla con el chip ＋—; lo
     único que sobra es el agujero mientras tanto.

     Solo suben las columnas que perdieron algo, y solo esas: en las demás
     cada tarjeta se queda exactamente donde la dejaste, que es la regla de
     este tablero. Y no se guarda nada: cambia cómo se dibuja hoy, no dónde
     vive cada tarjeta.

     Con `extra` puesto no se toca: eso es un arrastre en curso, y mover el
     resto del tablero debajo del dedo es justo lo que esta cuadrícula
     existe para no hacer. */
  const dibujadas = new Set(ids);
  const suben = new Set();
  if (!extra) order.forEach(id => {
    if (dibujadas.has(id) || !DASH_META[id] || !base[id]) return;
    const s = dashSize(id);
    for (let c = base[id].c; c < base[id].c + Math.min(s.w, cols); c++) suben.add(c);
  });

  const piezas = ids.map(id => {
    const s = dashSize(id);
    const p = (extra && extra[id]) || base[id] || { c: 0, f: fondo };
    return { id, w: Math.min(s.w, cols), h: s.h, c: clamp(p.c, 0, Math.max(0, cols - Math.min(s.w, cols))), f: Math.max(0, p.f) };
  });
  piezas.sort((a, b) => (a.f - b.f) || (a.c - b.c));

  const usado = [];
  const libre = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      if (!usado[i]) continue;
      for (let j = c; j < c + w; j++) if (usado[i][j]) return false;
    }
    return true;
  };
  const marcar = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      usado[i] = usado[i] || [];
      for (let j = c; j < c + w; j++) usado[i][j] = true;
    }
  };
  const fin = {};
  piezas.forEach(p => {
    /* Las piezas se recorren en orden de lectura, así que empezar por arriba
       en una columna tocada sube cada una hasta el primer hueco libre sin que
       dos se crucen: la de más arriba se coloca antes y las de abajo ya la
       encuentran ocupando su sitio. */
    let sube = false;
    for (let i = 0; i < p.w; i++) if (suben.has(p.c + i)) sube = true;
    let f = sube ? 0 : p.f;
    while (f < 600 && !libre(p.c, f, p.w, p.h)) f++;
    marcar(p.c, f, p.w, p.h);
    fin[p.id] = { c: p.c, f, w: p.w, h: p.h };
  });
  return fin;
}

function guardarPosiciones(pos) {
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  const cur = state.ui[ranura] || state.ui.dash || {};
  state.ui[ranura] = Object.assign({}, cur, { pos });
  marcarAcomodo(null);       // movido a mano: ya no es la plantilla
  save();
}

function altoMinimo(id) { return DASH_MIN_H[id] || 2; }

/* ---- El alto de la racha no se elige: sale de su ancho ----
   La tarjeta tiene un acomodo por cada ancho posible, y cada acomodo pide lo
   que pide: apilada necesita diez filas, en dos columnas ocho, en tres siete.
   Estirarla más solo añadía cielo vacío, que es el problema del que venía.

   Se aplica al leer Y al escribir: al leer, para que un tablero guardado con
   la altura vieja se corrija solo sin que nadie tenga que tocar nada. */
/* Cinco filas de una columna, seis de dos o de tres. Las nueve de antes eran
   demasiado —una tarjeta de una columna acaparaba media pantalla— y salían de
   dar por hecho que estrecha significaba apilada. No: una columna del tablero
   son unos 470 px, sitio de sobra para poner la identidad al lado del mes con
   las casillas más pequeñas. Quien de verdad apila es el teléfono, y ahí el
   alto lo pone el contenido y no esta tabla.

   Medido con el peor mes posible, uno de seis semanas como agosto de 2026:
   308 px de una columna y 372 de dos. Una fila del tablero son 56 px con 24
   de hueco, así que 5 filas dan 376 y 6 dan 456. Lo que sobre lo reparte el
   cuerpo, que va centrado.

   ---- Y por qué ya no basta con contar columnas ----
   «Una columna son unos 470 px» es verdad en un monitor y en una laptop, y
   deja de serlo en una tableta: a 1024 px de ventana, con la barra lateral
   puesta, cada columna mide 333. Ahí la tarjeta cae por debajo del umbral de
   430 de su propio `@container`, se apila —la identidad encima del mes— y
   pide 518 px. Recibía 376 y se comía cinco días de calendario, en silencio,
   en todos los iPad.

   Así que el alto se decide midiendo, no contando: se compara el ancho de
   verdad de la tarjeta contra el MISMO 430 que usa el CSS. Las dos cuentas
   tienen que decidir lo mismo o la tarjeta sale cortada; si algún día se
   mueve el `@container` de `.streak-card`, se mueve esta constante con él. */
const RACHA_LADO_A_LADO = 430;
/* Y el segundo umbral, el que decide si el mes va grande y si entra «qué la
   sostiene». Vive aquí y en el `@container` de `.streak-card`, y los dos
   tienen que decir lo mismo: si se mueve uno, se mueve el otro.

   Son 900 y no 680, y el número lo puso una medida: a 688 px —que es lo que
   mide la racha de dos columnas en una tableta— el carril de la derecha se
   queda en 294 px, la frase de hoy y las dos cifras parten en varias líneas, y
   la tarjeta pedía 459 px cuando recibía 376. Se salía por abajo sin que nada
   lo dijera, que es el mismo fallo que ya tuvo esta tarjeta en la 0.7.35. */
/* ---- El alto de la racha: UNO, y ya ----
   Fueron tres —apilada, de lado y ancha— con dos umbrales en pixeles para
   elegir entre ellos, porque la tarjeta tenia tres repartos. Desde la 0.7.100
   solo hay uno, asi que solo hace falta un numero.

   Sigue sin salir del contenido, y eso no es una eleccion: el dibujo del cielo
   es una ilustracion de alto fijo, asi que la tarjeta ocupa un numero entero de
   filas de la cuadricula y `.scene-body` reparte el sobrante arriba y abajo.
   Lo que cambia es que ahora hay UN numero que mantener al dia en vez de tres.

   **Al tocar lo que hay dentro de la racha, volver a medir esto.** Es
   literalmente el fallo de la 0.7.99: entro la comparacion con la semana
   pasada, nadie toco la tabla, y el rotulo de la tarjeta acabo 5 px por encima
   de su propio borde. */
const ALTO_RACHA = 6;

/* Cuánto mide de ancho una columna del tablero AHORA MISMO, en píxeles. Se
   mide y no se calcula: el ancho disponible depende de la barra lateral, de
   si está plegada y del relleno de la página, y esa cuenta repetida aquí se
   desincronizaría del CSS a la primera.

   La medida se guarda hasta que termine la tarea en curso y se olvida sola.
   No es por velocidad: es porque dentro de un mismo dibujado todas las
   preguntas tienen que recibir el MISMO ancho. `dashSize` se llama siete
   veces por tablero —al pintar, al empaquetar, al arrastrar— y si la ventana
   cambiara en medio, la racha podría salir de cinco filas en un sitio y de
   siete en otro, con lo que el reparto no cuadraría consigo mismo. Y como se
   borra en la microtarea siguiente, nunca queda un valor viejo mandando. */
let _anchoColumna = null;
function anchoDeColumna() {
  if (_anchoColumna !== null) return _anchoColumna;
  const el = document.getElementById("summary-content");
  const total = el ? el.getBoundingClientRect().width : 0;
  // 0 = el tablero aún no está en pantalla; quien pregunte tendrá que suponer
  _anchoColumna = total ? (total - ROW_GAP * (dashCols() - 1)) / dashCols() : 0;
  Promise.resolve().then(() => { _anchoColumna = null; });
  return _anchoColumna;
}

/* Lo que mide una tarjeta de `w` columnas, huecos incluidos. */
function anchoDeTarjeta(w) {
  const col = anchoDeColumna();
  return col ? col * w + ROW_GAP * (w - 1) : 0;
}

/* El suelo se aplica al LEER, no solo al arrastrar. Si no, un tablero
   guardado con la altura vieja se seguiría pintando por debajo del mínimo
   para siempre: el usuario nunca vuelve a tocar esa tarjeta y el valor
   antiguo se queda mandando. */
function dashSize(id) {
  const { sizes } = dashLayout();
  const s = sizes[id] || {};
  /* El ancho nunca puede pasar de las columnas que hay. Sin este tope, una
     tarjeta guardada de tres columnas en la computadora llegaba al teléfono
     diciendo que era de tres —y la racha, que ahora tiene un acomodo por
     ancho, sacaba en una pantalla de 375 px el reparto pensado para 1500—. */
  /* La racha va SIEMPRE en una columna, y esto es lo que lo garantiza: da
     igual lo que traiga guardado un tablero viejo o lo que se arrastre. Lo
     pidio Eduardo y ademas es lo que evita que vuelva a tener repartos. */
  const w = id === "racha" ? 1 : Math.min(s.w || DASH_META[id].w, dashCols());
  return {
    w,
    h: id === "racha" ? ALTO_RACHA : clamp(s.h || DASH_META[id].h, altoMinimo(id), DASH_MAX_H)
  };
}

function saveDash(order, hidden, sizes, pos) {
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  const cur = state.ui[ranura] || state.ui.dash || {};
  /* Lo que no se pasa sale de `dashLayout` y no de lo guardado a secas: ahí
     es donde una tarjeta que llega escondida (DASH_LLEGAN_OCULTAS) entra en
     `hidden`. Con lo guardado a secas, el primer arrastre la destapaba. */
  const d = dashLayout();
  state.ui[ranura] = {
    order: order || d.order,
    hidden: hidden || d.hidden,
    sizes: sizes || cur.sizes || {},
    pos: pos || cur.pos || null
  };
  save();
}

/* Y también al GUARDAR. Es el único punto por el que entra un tamaño nuevo,
   así que sujetarlo aquí garantiza que en disco nunca quede nada por debajo
   del suelo, venga del arrastre o de donde venga. */
function setWidgetSize(id, w, h) {
  const { sizes } = dashLayout();
  sizes[id] = id === "racha"
    ? { w: 1, h: ALTO_RACHA }
    : { w, h: clamp(h, altoMinimo(id), DASH_MAX_H) };
  marcarAcomodo(null);
  saveDash(null, null, sizes);
}

/* ---- Deshacer del tablero ----
   Acomodar el Resumen es prueba y error: se mueve algo, se ve cómo queda y
   a veces la respuesta es "estaba mejor antes". Sin una salida atrás, esa
   última parte obliga a reconstruir a mano lo que ya estaba bien.

   Guarda una copia del reparto entero —orden, ocultas y tamaños— antes de
   cada acción. Es un puñado de bytes por paso, así que la pila puede ser
   larga sin que importe.

   La pila NO se comparte con la del editor de talentos: son dos pantallas
   distintas y Ctrl+Z tiene que deshacer lo que el usuario está mirando, no
   lo último que tocó en cualquier sitio. */
const DASH_UNDO_MAX = 40;
let dashUndo = [];

function instantaneaTablero() {
  const { order, hidden, sizes, pos } = dashLayout();
  return JSON.stringify({ order, hidden, sizes, pos, acomodo: acomodoActivo() });
}

function recordarTablero(etiqueta) {
  dashUndo.push({ snap: instantaneaTablero(), etiqueta });
  if (dashUndo.length > DASH_UNDO_MAX) dashUndo.shift();
}

/* Se llama al terminar una acción: si el tablero quedó igual que antes de
   empezarla —un arrastre que vuelve a su sitio, un tirón del asa que no
   llegó a cambiar de fila— el paso sobra. Sin esto, deshacer gastaría
   pulsaciones en revertir cosas que nunca llegaron a pasar. */
function olvidarPasoVacio() {
  if (dashUndo.length && dashUndo[dashUndo.length - 1].snap === instantaneaTablero()) dashUndo.pop();
}

function deshacerTablero() {
  if (!dashUndo.length) { toast(tx("No hay nada que deshacer en el tablero"), "atencion"); return; }
  const prev = dashUndo.pop();
  const d = JSON.parse(prev.snap);
  saveDash(d.order, d.hidden, d.sizes, d.pos);
  marcarAcomodo(d.acomodo || null);
  save();
  renderSummary();
  toast(`Deshecho: ${prev.etiqueta}`, "deshecho");
}

/* Qué pasa cuando el contenido no cabe en el alto elegido.
   Hubo una versión donde la tarjeta crecía sola hasta que cupiera todo. Era
   frustrante por una razón concreta: convertía el tamaño elegido en una
   sugerencia. Uno ajustaba la tarjeta, salía de edición y la veía volver a
   otro alto, sin manera de saber si se había guardado. El tamaño lo decide
   el usuario, punto; el suelo por tarjeta (DASH_MIN_H) ya garantiza que
   ninguna pueda quedar tan aplastada que no comunique nada.

   Lo que sobra no se corta a hachazos: se desvanece hacia abajo. Un corte
   limpio a media línea parece un error de maquetación; un degradado dice
   "esto sigue" y deja el último renglón legible a medias, que es
   exactamente la información que hace falta.

   El color y el redondeo del velo se leen de la propia tarjeta en vez de
   escribirse a mano, porque cada widget tiene los suyos —unos son .panel,
   otros .sum-card— y una constante aquí se desincronizaría del CSS a la
   primera que alguien cambiara un radio. */
function marcarDesbordes() {
  document.querySelectorAll("#summary-content .widget").forEach(el => {
    const body = el.querySelector(":scope > *:not(.w-edit):not(.w-resize)");
    // Solo en escritorio hay alto fijo; en móvil la tarjeta ocupa lo que necesita
    if (!body || !isDesktop()) { el.classList.remove("rebosa"); return; }
    const rebosa = body.scrollHeight - body.clientHeight > 4;
    el.classList.toggle("rebosa", rebosa);
    if (!rebosa) return;
    const cs = getComputedStyle(body);
    const fondo = cs.backgroundColor;
    const opaco = fondo && !/^rgba\(0, 0, 0, 0\)$|transparent/.test(fondo);
    el.style.setProperty("--fundido", opaco ? fondo : "var(--card)");
    el.style.setProperty("--rad-bl", cs.borderBottomLeftRadius);
    el.style.setProperty("--rad-br", cs.borderBottomRightRadius);
  });
}

function dashTray(hidden) {
  const avail = Object.keys(DASH_META).filter(id => hidden.includes(id));
  const escritorio = isDesktop();
  return `
  <div class="dash-tray full-row">
    <div class="tray-head">
      <div class="tray-tx">
        <h3>${escritorio ? "Modo Editor" : "Acomodos"}</h3>
        <p class="settings-note" style="margin:0">${escritorio
          ? `Arrastra para acomodar · esquina inferior derecha para cambiar el tamaño · ✕ para quitar · <kbd>Ctrl</kbd><kbd>Z</kbd> deshacer`
          : `Elige con qué quieres encontrarte al abrir la app. Acomodar tarjeta por tarjeta llegará más adelante, con un gesto pensado para el teléfono.`}</p>
      </div>
      <button class="btn btn-primary" onclick="setDashEdit(false)">${tx("Listo")}</button>
    </div>
    ${avail.length ? `
      <div class="tray-chips">
        ${avail.map(id => `<button class="tray-chip" onclick="showWidget('${id}')">＋ ${escapeHtml(tx(DASH_META[id].title))}</button>`).join("")}
      </div>` : ""}
    <div class="tray-acomodos">
      <span class="lbl">${tx("Acomodos sugeridos")}</span>
      <div class="acomodo-fila">
        ${acomodosDeAhora().map((a, i) => `
          <button class="acomodo ${a.nombre === acomodoActivo() ? "on" : ""}" onclick="aplicarAcomodo(${i})">
            <span class="ac-n">${i + 1}</span>
            <span class="ac-tx"><b>${escapeHtml(tx(a.nombre))}</b><span>${escapeHtml(tx(a.sub))}</span></span>
          </button>`).join("")}
      </div>
    </div>
    ${misAcomodosHTML()}
  </div>`;
}

/* ================= Mis acomodos (0.7.134) =================
   Tres casillas donde guardar el tablero como lo dejaste, para volver a él de
   un toque. Las pidió Eduardo, y son gratis: es tu propio tablero, y cobrar por
   volver a algo que ya hiciste tú sería cobrar por la memoria.

   **Una casilla recuerda cómo la dejaste en CADA forma de pantalla**, no una
   sola foto. Las posiciones de tres columnas no sirven en dos, y el teléfono ni
   siquiera tiene posiciones: guardar «Mi acomodo 1» en la laptop y tocarlo en
   el monitor no puede poner las tarjetas en sitios que allí no existen. Así
   que cada casilla guarda una foto por forma (`pantallas[forma]`), y en una
   forma donde no se guardó se acomoda sola: mismo orden y mismas tarjetas,
   repartidas como un acomodo sugerido (`recolocarMio`).

   Viven en `state.ui.misAcomodos`, que viaja con la cuenta. Tres y no más: una
   cuarta ya es una lista que hay que administrar, y esto es un atajo. */
const MIS_ACOMODOS = 3;
const NOMBRE_FORMA = { telefono: "Teléfono", tableta: "Tableta", laptop: "Laptop", escritorio: "Monitor" };
let misAcomodoMenu = -1;

function misAcomodos() {
  state.ui = state.ui || {};
  const cs = Array.isArray(state.ui.misAcomodos) ? state.ui.misAcomodos : [];
  while (cs.length < MIS_ACOMODOS) cs.push(null);
  state.ui.misAcomodos = cs.slice(0, MIS_ACOMODOS);
  return state.ui.misAcomodos;
}

function guardarMiAcomodo(i) {
  const cs = misAcomodos();
  const forma = formaTablero();
  const d = dashLayout();
  const c = cs[i] || { nombre: T`Mi acomodo ${i + 1}`, pantallas: {} };
  c.pantallas[forma] = JSON.parse(JSON.stringify({
    order: d.order, hidden: d.hidden, sizes: d.sizes, pos: d.pos, acomodo: acomodoActivo()
  }));
  cs[i] = c;
  misAcomodoMenu = -1;
  save();
  refrescarBandeja();
  toast(T`Guardado en «${c.nombre}» para ${tx(NOMBRE_FORMA[forma])}`, "hecho");
}

function usarMiAcomodo(i) {
  const c = misAcomodos()[i];
  if (!c) return;
  recordarTablero("mi acomodo " + c.nombre);
  const forma = formaTablero();
  const foto = c.pantallas[forma];
  if (foto) {
    saveDash(foto.order, foto.hidden, foto.sizes, foto.pos);
    marcarAcomodo(foto.acomodo || null);
    save();
    flipRender(document.getElementById("summary-content"), renderSummary);
    toast(T`«${c.nombre}»`, "hecho", { label: tx("Deshacer"), onclick: "deshacerTablero()" });
  } else {
    const otra = Object.keys(c.pantallas)[0];
    if (!otra) return;
    recolocarMio(c.pantallas[otra]);
    toast(T`«${c.nombre}» se guardó en ${tx(NOMBRE_FORMA[otra])}: aquí se acomodó solo`, "hecho",
      { label: tx("Deshacer"), onclick: "deshacerTablero()" });
  }
  misAcomodoMenu = -1;
  refrescarBandeja();
}

/* Lo guardado en otra pantalla llega sin posiciones que sirvan aquí. Se toma
   su orden y sus tarjetas, y se reparten como un acomodo sugerido: cada una a
   la columna más corta en ese momento. No se marca ningún botón encendido,
   porque no es ninguno de los tres. */
function recolocarMio(foto) {
  const vis = foto.order.filter(id => !foto.hidden.includes(id) && DASH_META[id]);
  if (!isDesktop()) {
    colocarAcomodo({ order: vis });
  } else {
    const n = dashCols();
    const cols = [...Array(n)].map(() => []);
    const altos = Array(n).fill(0);
    vis.forEach(id => {
      const c = altos.indexOf(Math.min(...altos));
      cols[c].push(id);
      altos[c] += DASH_META[id].h;
    });
    colocarAcomodo({ cols });
  }
  marcarAcomodo(null);
  save();
}

function menuMiAcomodo(i) { misAcomodoMenu = misAcomodoMenu === i ? -1 : i; refrescarBandeja(); }
function cerrarMenuMiAcomodo() { misAcomodoMenu = -1; refrescarBandeja(); }

function renombrarMiAcomodo(i, valor) {
  const c = misAcomodos()[i];
  if (!c) return;
  const limpio = String(valor || "").trim().slice(0, 28);
  if (limpio) { c.nombre = limpio; save(); }
}

/* Vaciar no pide confirmación: lo que se pierde es un atajo, no el tablero,
   y el tablero de ahora se queda tal cual. */
function vaciarMiAcomodo(i) {
  misAcomodos()[i] = null;
  misAcomodoMenu = -1;
  save();
  refrescarBandeja();
  toast(tx("Casilla vacía"), "deshecho");
}

function misAcomodosHTML() {
  const forma = formaTablero();
  return `
    <div class="mis-acomodos">
      <span class="lbl">${tx("Mis acomodos")}</span>
      <div class="ma-fila">${misAcomodos().map((c, i) => {
        if (!c) return `
          <button class="ma ma-vacia" onclick="guardarMiAcomodo(${i})">
            <span class="ac-n">${i + 1}</span>
            <span class="ac-tx"><b>${tx("Casilla libre")}</b><span>${tx("Guardar aquí el de ahora")}</span></span>
          </button>`;
        if (misAcomodoMenu === i) return `
          <div class="ma ma-menu">
            <label class="ma-lbl" for="ma-nombre-${i}">${tx("Nombre")}</label>
            <input id="ma-nombre-${i}" class="ma-input" maxlength="28" value="${escapeAttr(c.nombre)}"
              onchange="renombrarMiAcomodo(${i}, this.value)"
              onkeydown="if (event.key === 'Enter') { renombrarMiAcomodo(${i}, this.value); cerrarMenuMiAcomodo(); }">
            <div class="ma-botones">
              <button class="btn btn-soft btn-sm" onclick="guardarMiAcomodo(${i})">${tx("Guardar el de ahora")}</button>
              <button class="btn btn-danger-ghost btn-sm" onclick="vaciarMiAcomodo(${i})">${tx("Vaciar")}</button>
              <button class="btn btn-ghost btn-sm" onclick="cerrarMenuMiAcomodo()">${tx("Listo")}</button>
            </div>
          </div>`;
        /* Dónde se guardó, con una ✓ en la pantalla de ahora: sin ella no se
           sabe si tocarla va a poner lo que dejaste o a acomodarse sola. */
        const donde = Object.keys(c.pantallas).map(k => tx(NOMBRE_FORMA[k]) + (k === forma ? " ✓" : "")).join(" · ");
        return `
          <div class="ma ma-llena">
            <button class="ma-usar" onclick="usarMiAcomodo(${i})">
              <span class="ac-n">${i + 1}</span>
              <span class="ac-tx"><b>${escapeHtml(c.nombre)}</b><span>${escapeHtml(donde)}</span></span>
            </button>
            <button class="ma-mas" onclick="menuMiAcomodo(${i})" aria-label="${escapeAttr(T`Opciones de ${c.nombre}`)}">⋯</button>
          </div>`;
      }).join("")}</div>
    </div>`;
}

function setDashEdit(on) {
  dashEditing = on;
  renderSummary();
  if (!on) return;
  toast(isDesktop()
    ? tx("Arrastra las tarjetas para reacomodarlas")
    : tx("Elige un acomodo para tu Resumen"), "hecho");
}

function hideWidget(id) {
  const { order, hidden } = dashLayout();
  if (hidden.includes(id)) return;
  recordarTablero(`quitar ${DASH_META[id].title}`);
  marcarAcomodo(null);
  saveDash(order, [...hidden, id]);
  flipRender(document.getElementById("summary-content"), renderSummary);
  toast(T`${tx(DASH_META[id].title)} quitado del tablero`, "deshecho");
}

function showWidget(id) {
  const { order, hidden } = dashLayout();
  recordarTablero(`añadir ${DASH_META[id].title}`);
  marcarAcomodo(null);
  saveDash(order, hidden.filter(h => h !== id));
  flipRender(document.getElementById("summary-content"), renderSummary);
}

/* Anima el reacomodo: mide antes, vuelve a dibujar y desliza desde la posición vieja. */
function flipRender(container, renderFn) {
  const before = new Map();
  [...container.children].forEach(c => {
    if (c.dataset.w) before.set(c.dataset.w, c.getBoundingClientRect());
  });
  renderFn();
  animarDesde(container, before);
}

/* Anima un reacomodo que YA está hecho en el DOM: se le pasa dónde estaba
   cada pieza antes de moverla y las desliza desde ahí. Es la segunda mitad de
   flipRender, separada para poder usarla sin volver a dibujar nada. */
function animarDesde(container, antes) {
  [...container.children].forEach(c => {
    const b = antes.get(c.dataset.w);
    if (!b) return;
    const a = c.getBoundingClientRect();
    const dx = b.left - a.left, dy = b.top - a.top;
    if (!dx && !dy) return;
    c.style.transition = "none";
    c.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
      c.style.transition = "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)";
      c.style.transform = "";
    });
  });
}

function attachDashHandlers() {
  // El tablero solo se toca con las manos en la computadora (ver dashTray)
  if (!isDesktop()) return;
  const cont = document.getElementById("summary-content");
  if (cont.dataset.bound) return;
  cont.dataset.bound = "1";

  let holdTimer = null, dragId = null, ghost = null, startPt = null;
  let sizeId = null, sizeStart = null, cellW = 0;
  /* El orden mientras dura el arrastre. Se guarda al soltar, no en cada paso:
     antes cada cruce de tarjeta escribía en disco y volvía a dibujar el
     Resumen ENTERO —siete tarjetas rehechas desde cero, con sus anillos
     reanimados—, y eso es lo que se sentía pesado. Ahora en cada paso solo se
     mueve un nodo de sitio y se anima el deslizamiento. */
  let ordenVivo = null, ghostIni = null;
  /* La disposición que se está viendo mientras se arrastra, y la última celda
     probada: sin ella se recalcularía en cada píxel aunque la celda no haya
     cambiado, y las animaciones se cortarían unas a otras. */
  let sitioVivo = null, celdaVista = null;

  const cols = () => {
    const t = getComputedStyle(cont).gridTemplateColumns.split(" ").filter(Boolean);
    return Math.max(1, t.length);
  };

  const startDrag = (id, e) => {
    /* Un solo paso por arrastre, no uno por cada intercambio del camino:
       deshacer debe devolver la tarjeta a donde estaba antes de agarrarla,
       que es lo que el usuario recuerda. */
    recordarTablero(`mover ${DASH_META[id].title}`);
    dragId = id;
    const el = cont.querySelector(`.widget[data-w="${id}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    ghost = el.cloneNode(true);
    ghost.className = "widget ghost";
    ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;pointer-events:none;z-index:var(--piso-arrastre);`;
    ghostIni = { x: r.left, y: r.top, dx: e.clientX - r.left, dy: e.clientY - r.top };
    document.body.appendChild(ghost);
    el.classList.add("dragging");
    if (userHasTapped && navigator.vibrate) navigator.vibrate(12);
  };

  cont.addEventListener("pointerdown", (e) => {
    /* Los oyentes se enganchan una sola vez y sobreviven a un cambio de
       tamaño de ventana: sin esto, encoger la ventana hasta el ancho de un
       teléfono dejaría vivo el arrastre que ahí está apagado. */
    if (!isDesktop()) return;
    const w = e.target.closest(".widget");
    if (!w || e.target.closest(".w-hide")) return;

    // Esquina inferior derecha: cambia el tamaño en unidades de la cuadrícula
    if (e.target.closest(".w-resize")) {
      recordarTablero(`tamaño de ${DASH_META[w.dataset.w].title}`);
      sizeId = w.dataset.w;
      const total = cont.getBoundingClientRect().width;
      const n = cols();
      cellW = (total - ROW_GAP * (n - 1)) / n;
      // Se parte del tamaño que se ve en pantalla, no del guardado
      sizeStart = {
        x: e.clientX, y: e.clientY, max: n,
        w: +w.style.getPropertyValue("--w") || dashSize(sizeId).w,
        h: +w.style.getPropertyValue("--h") || dashSize(sizeId).h
      };
      w.classList.add("sizing");
      try { cont.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      return;
    }

    startPt = { x: e.clientX, y: e.clientY };
    if (dashEditing) {
      startDrag(w.dataset.w, e);
      try { cont.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    } else {
      // Pulsación sostenida: entra en modo edición y arrastra de una vez
      holdTimer = setTimeout(() => {
        holdTimer = null;
        dashEditing = true;
        renderSummary();
        startDrag(w.dataset.w, e);
        try { cont.setPointerCapture(e.pointerId); } catch (err) {}
      }, 420);
    }
  });

  cont.addEventListener("pointermove", (e) => {
    if (sizeId) {
      e.preventDefault();
      const el = cont.querySelector(`.widget[data-w="${sizeId}"]`);
      if (!el) return;
      const dw = Math.round((e.clientX - sizeStart.x) / (cellW + ROW_GAP));
      const dh = Math.round((e.clientY - sizeStart.y) / ROW_H);
      const w = clamp(sizeStart.w + dw, 1, sizeStart.max);
      /* La racha no se estira ni a lo ancho ni a lo alto: es de una columna y
         de `ALTO_RACHA` filas, siempre. Antes se dejaba estirar y al soltar
         volvia de golpe a su sitio — el tiron funcionaba, la tarjeta no
         obedecia, y eso no se lee como una regla sino como algo roto. Ahora
         no se mueve mientras se arrastra, que es lo que si se lee como una
         regla. */
      const h = sizeId === "racha"
        ? ALTO_RACHA
        : clamp(sizeStart.h + dh, altoMinimo(sizeId), DASH_MAX_H);
      el.style.setProperty("--w", sizeId === "racha" ? 1 : w);
      el.style.setProperty("--h", h);
      return;
    }
    if (holdTimer && startPt && Math.hypot(e.clientX - startPt.x, e.clientY - startPt.y) > 10) {
      clearTimeout(holdTimer); holdTimer = null;   // se movió: era desplazamiento, no pulsación
    }
    if (!dragId || !ghost) return;
    e.preventDefault();
    /* Con transform y no con left/top: el navegador lo resuelve sin volver a
       calcular el reparto de la página, así que la pieza va pegada al cursor
       en vez de ir un paso por detrás. */
    ghost.style.transform =
      `translate3d(${e.clientX - ghostIni.dx - ghostIni.x}px, ${e.clientY - ghostIni.dy - ghostIni.y}px, 0) scale(1.03)`;

    /* ---- En escritorio se arrastra por CELDAS ----
       La tarjeta cae en la columna y la fila donde la sueltas, y punto. Lo
       que estorbe baja dentro de su columna; nadie más se entera. Antes esto
       era una lista que la cuadrícula volvía a empaquetar en cada paso, y por
       eso al mover una se recolocaban cinco o seis a la vez: eso era el
       parpadeo. Mover dentro de una columna ya no puede sugerir otra, porque
       la columna la decide el puntero y nada más. */
    if (isDesktop()) {
      const rc = cont.getBoundingClientRect();
      const cols = dashCols();
      const anchoCol = (rc.width - ROW_GAP * (cols - 1)) / cols;
      const w = Math.min(dashSize(dragId).w, cols);
      const gx = e.clientX - ghostIni.dx;      // esquina de la pieza, no el cursor
      const gy = e.clientY - ghostIni.dy;
      const c = clamp(Math.round((gx - rc.left) / (anchoCol + ROW_GAP)), 0, Math.max(0, cols - w));
      const f = Math.max(0, Math.round((gy - rc.top) / ROW_PITCH));
      if (celdaVista && celdaVista.c === c && celdaVista.f === f) return;
      celdaVista = { c, f };

      const visibles = [...cont.querySelectorAll(".widget")].map(el => el.dataset.w);
      const mapa = disposicionTablero(visibles, cols, { [dragId]: { c, f } });
      const antes = new Map();
      cont.querySelectorAll(".widget").forEach(el => antes.set(el.dataset.w, el.getBoundingClientRect()));
      cont.querySelectorAll(".widget").forEach(el => {
        const p = mapa[el.dataset.w];
        if (!p) return;
        el.style.setProperty("--c", p.c + 1);
        el.style.setProperty("--f", p.f + 1);
      });
      animarDesde(cont, antes);
      sitioVivo = mapa;
      return;
    }

    /* En el teléfono no hay columnas: el tablero es una pila y lo que importa
       es el orden. La tarjeta de destino es la que tiene el centro más cerca,
       para que no haya que apuntarle fino. */
    let target = null, mejor = Infinity;
    [...cont.querySelectorAll(".widget")].forEach(el => {
      if (el.dataset.w === dragId) return;
      const rr = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (rr.left + rr.width / 2), e.clientY - (rr.top + rr.height / 2));
      if (d < mejor) { mejor = d; target = el; }
    });
    if (!target) return;

    /* Dónde cae la tarjeta se decide por la posición del puntero dentro de
       la que tiene debajo, no por cuál fue la última que pisó.

       La versión anterior se acordaba de la última (lastOver) y se saltaba
       cualquier movimiento sobre ella. Eso hacía imposible arrepentirse: al
       soltar una tarjeta sobre otra quedaban intercambiadas, y volver atrás
       exigía pasar por una tercera para "olvidar" la anterior. Había que
       recolocarla a mano en vez de simplemente devolverla.

       El guardián existía por algo real: sin él, recalcular el orden sobre
       la misma tarjeta la hacía oscilar entre dos posiciones a cada píxel.
       La regla del punto medio lo arregla de raíz porque no tiene memoria —
       el resultado depende solo de dónde está el puntero ahora—, así que
       volver sobre tus pasos devuelve exactamente el orden de partida. */
    const r = target.getBoundingClientRect();
    const centro = r.top + r.height / 2;
    const despues = e.clientY > centro || (e.clientY === centro && e.clientX > r.left + r.width / 2);

    const order = ordenVivo || dashLayout().order;
    const sinLaQueMuevo = order.filter(id => id !== dragId);
    let destino = sinLaQueMuevo.indexOf(target.dataset.w);
    if (destino < 0) return;
    if (despues) destino++;
    const nuevo = [...sinLaQueMuevo.slice(0, destino), dragId, ...sinLaQueMuevo.slice(destino)];
    if (nuevo.join() === order.join()) return;      // ya estaba justo ahí

    /* Mover el nodo y animar, sin tocar el disco ni rehacer el HTML. El hueco
       translúcido de la tarjeta que se arrastra viaja con ella, que es lo que
       hace entender dónde va a caer — igual que en Misiones y en Proyectos. */
    const antes = new Map();
    [...cont.children].forEach(c => { if (c.dataset.w) antes.set(c.dataset.w, c.getBoundingClientRect()); });
    const piezas = new Map();
    [...cont.children].forEach(c => { if (c.dataset.w) piezas.set(c.dataset.w, c); });
    nuevo.forEach(id => { const el = piezas.get(id); if (el) cont.appendChild(el); });
    animarDesde(cont, antes);
    ordenVivo = nuevo;
  });

  const endDrag = () => {
    if (sizeId) {
      const el = cont.querySelector(`.widget[data-w="${sizeId}"]`);
      if (el) {
        /* El respaldo del alto es el suelo de ESA tarjeta, no un 2 fijo:
           con el fijo, un widget cuyo mínimo es 4 podía guardarse en 2 si
           la propiedad venía vacía. */
        setWidgetSize(sizeId,
          +el.style.getPropertyValue("--w") || 1,
          +el.style.getPropertyValue("--h") || altoMinimo(sizeId));
        el.classList.remove("sizing");
      }
      sizeId = null; sizeStart = null;
      olvidarPasoVacio();
      /* Una tarjeta más alta puede pisar a la de abajo: se vuelve a resolver
         con las mismas reglas que al arrastrar —lo que estorba baja— en vez
         de dejar dos tarjetas encimadas. */
      if (isDesktop()) renderSummary();
      refrescarBandeja();
      marcarDesbordes();          // al cambiar el alto cambia lo que sobra
      return;
    }
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (ghost) { ghost.remove(); ghost = null; }
    const el = cont.querySelector(".widget.dragging");
    if (el) el.classList.remove("dragging");
    // Se escribe una sola vez, cuando se suelta
    if (sitioVivo) {
      const pos = {};
      Object.keys(sitioVivo).forEach(id => { pos[id] = { c: sitioVivo[id].c, f: sitioVivo[id].f }; });
      /* Las escondidas conservan las coordenadas que tenían: al volver a
         encenderlas deben aparecer donde estaban, no en la esquina. */
      const previas = dashLayout().pos || {};
      Object.keys(previas).forEach(id => { if (!pos[id]) pos[id] = previas[id]; });
      guardarPosiciones(pos);
      sitioVivo = null;
    }
    if (ordenVivo) { saveDash(ordenVivo, dashLayout().hidden); ordenVivo = null; }
    celdaVista = null;
    refrescarBandeja();
    if (dragId) olvidarPasoVacio();
    dragId = null; startPt = null; ghostIni = null;
  };
  cont.addEventListener("pointerup", endDrag);
  cont.addEventListener("pointercancel", endDrag);
}

/* ================= Render: habilidades ================= */

function renderHome() {
  const skills = state.skills;

  const totalLevels = skills.reduce((acc, s) => acc + levelInfo(s.xp).level, 0);
  const totalXp = skills.reduce((acc, s) => acc + s.xp, 0);
  const decaying = skills.filter(isDecaying).length;
  const permanent = skills.filter(s => s.permanent).length;

  // Lo que más urge practicar: la que ya decae, o la más cercana a subir de nivel
  const decayList = skills.filter(isDecaying);
  const closest = [...skills].filter(s => levelInfo(s.xp).level < MAX_LEVEL)
    .sort((a, b) => levelInfo(b.xp).pct - levelInfo(a.xp).pct)[0];
  let hFocus;
  if (decayList.length) {
    hFocus = { k: "Perdiendo XP", v: decayList[0].name, color: "var(--fire)", onclick: `openDetail('${decayList[0].id}')` };
  } else if (closest) {
    const li = levelInfo(closest.xp);
    hFocus = { k: T`A ${li.needed - li.inLevel} XP del nivel ${li.level + 1}`, v: closest.name, color: "var(--mint)", pct: li.pct, onclick: `openDetail('${closest.id}')` };
  } else {
    hFocus = { k: tx("Todo al máximo"), v: tx("No queda nivel por subir"), color: "var(--mint)" };
  }

  document.getElementById("home-hero").innerHTML = skills.length === 0 ? "" : sectionHero({
    lead: `<div>
      <div class="label">${tx("Nivel de tu personaje")}</div>
      <div class="big"><b>${totalLevels}</b><span> ${tx("niveles")}</span></div>
    </div>`,
    /* Los cuatro huecos los decide el motor de informes: números del periodo
       con su flecha, en vez de acumulados que solo suben. Aquí estaban «XP
       total» y «Blindadas», que no pasan la regla del panel —ninguno de los
       dos te hace tocar nada hoy—. */
    stats: statsPanelHabilidades({ decaying }),
    informe: "habilidades",
    focus: hFocus
  });

  /* Panel de lo que está decayendo. Antes solo se veía un número y el
     nombre de una: no decía cuáles, ni cuánto queda, ni qué hacer. Ahora
     lista hasta cinco con sus días reales para bajar de nivel, resume el
     resto, y termina diciendo la única cosa que lo detiene. */
  const zona = document.getElementById("decay-zone");
  if (zona) {
    if (!decayList.length) {
      zona.innerHTML = "";
    } else {
      const orden = [...decayList].sort((a, b) => (diasParaBajarNivel(a) || 999) - (diasParaBajarNivel(b) || 999));
      const visibles = orden.slice(0, 5);
      const resto = orden.length - visibles.length;
      zona.innerHTML = `
      <div class="panel decay-panel">
        <div class="panel-head">
          <h3 style="margin:0">${tx("Perdiendo XP")}</h3>
          <span class="dz-count">${orden.length}</span>
        </div>
        <div class="dz-list">
          ${visibles.map(s => {
            const d = diasParaBajarNivel(s);
            const nv = levelInfo(s.xp).level;
            return `
            <button class="dz-row" onclick="openDetail('${s.id}')">
              <span class="dz-ic" style="background:${velo(s.color, "22")};color:${tinta(s.color)}">${icon(s.icon, 15)}</span>
              <span class="dz-tx">
                <b>${escapeHtml(s.name)}</b>
                <span>−${desgasteDiario(s)} XP al día${d ? ` · ${d} día${d === 1 ? "" : "s"} para caer al nivel ${nv - 1}` : ""}</span>
              </span>
              <span class="go">→</span>
            </button>`;
          }).join("")}
          ${resto > 0 ? `<div class="dz-mas">y ${resto} habilidad${resto === 1 ? "" : "es"} más</div>` : ""}
        </div>
        <p class="settings-note" style="margin:12px 0 0">
          Se detiene con registrar cualquier práctica, cumplir una misión enlazada o avanzar un talento o proyecto que la entrene. Con eso vuelve a contar desde cero su periodo de gracia.
        </p>
      </div>`;
    }
  }

  /* "Todas" es a la vez el rótulo del primer chip y el VALOR con el que se
     compara aquí abajo, así que se traduce solo al escribirlo: traducirlo en
     la lista dejaría `activeCategory` en inglés y el filtro no encontraría
     nada al volver al español.

     Y se traduce ESE y no los demás. Las otras categorías salen de las
     habilidades, que ya las guardan en el idioma en que se crearon; pasarlas
     todas por `tx()` sería traducir datos de la persona, que es justo lo que
     el barrido del DOM tiene prohibido — una categoría suya llamada
     «Guardar» se volvería «Save» sola. */
  const cats = ["Todas", ...new Set(skills.map(s => s.category).filter(Boolean))];
  if (!cats.includes(activeCategory)) activeCategory = "Todas";
  document.getElementById("chips").innerHTML = skills.length === 0 ? "" : cats.map(c =>
    `<button class="chip ${c === activeCategory ? "active" : ""}" onclick="setCategory('${enJS(c)}')">${escapeHtml(c === "Todas" ? tx("Todas") : c)}</button>`
  ).join("");

  const list = document.getElementById("skill-list");
  const visible = activeCategory === "Todas" ? skills : skills.filter(s => s.category === activeCategory);

  renderHomeTools();

  // Con una sola habilidad no hay nada que reordenar y la pista sobra
  const pista = document.getElementById("hb-hint");
  if (pista) pista.textContent = (visible.length > 1 && !seleccionHab) ? pistaReordenar() : "";

  if (skills.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <div class="bubble">${icon("star", 34)}</div>
        <h2>${tx("Sin habilidades todavía")}</h2>
        <p>${tx("Empieza por el catálogo: verlas en cero es lo que te recuerda que existen. Luego puedes crear las tuyas.")}</p>
        <div class="stack" style="align-items:center">
          ${bloqueBienvenida()}
          <button class="${claseAccionPropia()}" onclick="openCatalogo()">${tx("Ver el catálogo")}</button>
          ${bienvenidaPendiente() ? "" : `<button class="btn btn-ghost" onclick="openSkillForm()">${tx("Crear una a mano")}</button>`}
        </div>
      </div>`;
    return;
  }

  const enSeleccion = !!seleccionHab;
  /* El XP decide el orden de salida, pero lo que el usuario haya acomodado
     a mano manda por encima: si movió algo ahí quiso dejarlo. Las que nunca
     tocó siguen ordenadas por XP, porque ordenarPor conserva el orden de
     entrada de las que no figuran en la lista guardada. */
  const sorted = ordenarPor([...visible].sort((a, b) => b.xp - a.xp), "habOrden");
  list.innerHTML = sorted.map((s, i) => {
    const li = levelInfo(s.xp);
    const marcada = enSeleccion && seleccionHab.has(s.id);
    const tab = isDecaying(s)
      ? `<span class="skill-tab warn">${tx("▾ perdiendo XP")}</span>`
      : (s.permanent ? `<span class="skill-tab perm">${icon("shield", 10)}blindada</span>` : "");
    const pct = li.level >= MAX_LEVEL ? 1 : li.pct / 100;
    return `
    <button type="button" class="skill-card ${i % 2 === 0 ? "r-a" : "r-b"}${marcada ? " marcada" : ""}"
      data-rid="${s.id}"
      onclick="${enSeleccion ? `toggleHabSel('${s.id}')` : `openDetail('${s.id}')`}">
      ${tab}
      ${enSeleccion ? `<span class="hb-check">${marcada ? icon("check", 13) : ""}</span>` : ""}
      <div class="skill-emoji" style="background:${velo(s.color, "26")};color:${tinta(s.color)}">${icon(s.icon, 23)}</div>
      <div class="skill-info">
        <div class="skill-name">${escapeHtml(s.name)}</div>
        <div class="skill-meta">${escapeHtml(s.category || tx("Sin categoría"))}</div>
      </div>
      ${enSeleccion ? "" : `<div class="mini-ring">
        ${ring(46, 4.5, [{ pct, color: trazo(s.color) }], "var(--carril)")}
        <span class="lv" style="color:${tinta(s.color)}">${li.level}</span>
      </div>`}
    </button>`;
  }).join("");

  /* Reordenar a mano, salvo mientras se marcan habilidades para borrar: ahí
     el mismo gesto ya significa otra cosa. */
  hacerReordenable(list, ".skill-card", (ids) => {
    guardarOrden("habOrden", ids);
    renderHome();
  }, () => !seleccionHab);
}

/* Barra de acciones sobre la lista: añadir del catálogo y quitar en bloque. */
/* ---- El calendario de la racha ----

   Es primo del de los informes pero no el mismo, y la diferencia es lo que
   cambia todo: **aquí los días llevan su número escrito.** En un informe el
   calendario es un patrón que se mira de lejos —cuántos días, dónde están los
   huecos— y las fechas sobran; en la tarjeta de la racha se mira de cerca,
   una casilla es un día concreto de tu semana, y sin el número hay que
   contarlas con el dedo para saber cuál es cuál.

   Tres estados y ninguno regaña:
     · lleno    lo hiciste, y cuánto lo dice la intensidad
     · vacío    no pasó nada; sin cruces ni rojos, que un mes marcado de
                fallos es un mes que no se quiere volver a abrir
     · futuro   el número apagado, para que se vea que el mes sigue

   Hoy lleva un aro, y la semana en curso una banda por detrás: es lo que
   contesta «¿cómo voy AHORA?» sin necesitar una tira aparte. */
/* ---- La tercera columna: lo que hace que la racha siga viva ----

   Aquí estaban «los últimos meses»: seis renglones con los días activos de
   cada uno. Eduardo lo leyó y dijo que no le decía nada, y al mirarlo con esa
   pregunta encima tenía razón — era una tabla que casi siempre son ceros o
   números parecidos, no contesta nada que se pueda hacer hoy, y compararte con
   tu marzo no cambia tu jueves.

   Lo que sí importa de una racha son dos cosas, y las dos son de AHORA:

     1. **A dónde va.** Norata ya celebra hitos de racha (3, 7, 14, 30…), pero
        el número de la tarjeta no decía nunca cuál viene ni cuánto falta: el
        premio existía y era invisible. Una meta cerca es lo que hace volver
        mañana; un mes viejo, no.
     2. **De qué está hecha.** Casi todas las rachas largas se sostienen sobre
        una o dos cosas concretas. Saber cuáles —con su nombre y sus días— es
        lo único de esta tarjeta que se puede usar para decidir algo: si tu
        racha vive de una sola misión, ya sabes qué proteger.

   Las dos se calculan sobre los últimos treinta días, no sobre la racha viva:
   con una racha de tres días, contar solo esos tres daría tres empates de uno
   y no diría nada. */

/* El hito de racha que viene, con lo que llevas recorrido desde el anterior.
   `HITOS_RACHA` es la misma lista que dispara la celebración, así que la
   tarjeta y el festejo no pueden decir cosas distintas. */
function proximoHito(cur) {
  const sig = HITOS_RACHA.find(h => h > cur);
  if (!sig) return null;
  const previos = HITOS_RACHA.filter(h => h <= cur);
  const desde = previos.length ? previos[previos.length - 1] : 0;
  return { sig, faltan: sig - cur, pct: Math.round((cur - desde) / (sig - desde) * 100) };
}

/* El proximo hito, en UN renglon. Se llamaba `loQueSostiene` y devolvia dos
   bloques; desde la 0.7.99.3 solo queda este, asi que el nombre pasa a decir
   lo que hace. */
function bloqueDelHito(cur) {
  const hito = proximoHito(cur);

  return `
    ${hito ? `
      ${/* El hito, en UNA línea desde la 0.7.56. Tenía la cifra en grande
            —26 px— y eso hacía dos cosas mal: competía con el número de la
            racha, que es el número de esta tarjeta, y costaba 33 px de alto
            en una tarjeta cuyo alto se mide en filas de la cuadrícula. Esos
            33 px son exactamente los que separan cinco filas de seis. */""}
      <div class="sg-hito">
        <div class="rc-rot">${T`Próximo hito · ${hito.sig} días`}</div>
        ${/* La misma barra que el nivel y las dos cifras de arriba. Aquí es
              donde más paga: «te faltan 4 días» es lo único de esta tarjeta
              que mueve a volver hoy, y estaba dibujado como un carril
              muerto. */""}
        <div class="barra-viva sgh-b"><i style="--p:${Math.max(3, hito.pct)}%;--c:var(--mint)"></i></div>
        <div class="sgh-p">${hito.faltan === 1 ? tx("Te falta 1 día") : T`Te faltan ${hito.faltan} días`}</div>
      </div>` : `
      <div class="sg-hito">
        <div class="rc-rot">${tx("Los hitos")}</div>
        <div class="sgh-p">${tx("Pasaste el último de la lista. A partir de aquí, cada día es récord.")}</div>
      </div>`}
`;
}

function calendarioRacha(anio, mes, cuentas, hoy) {
  const total = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const primero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  const mm = String(mes).padStart(2, "0");
  const inicioSemana = addDaysKey(hoy, -weekdayOfKey(hoy));
  const finSemana = addDaysKey(inicioSemana, 6);

  let max = 1;
  for (let d = 1; d <= total; d++) max = Math.max(max, cuentas.get(anio + "-" + mm + "-" + String(d).padStart(2, "0")) || 0);
  /* La escala sale del acento de la APARIENCIA y no de la menta de la casa
     escrita aquí, que es lo que había. El calendario vive dentro de la tarjeta
     de la racha, o sea dentro de una escena, y una escena vuelve a declarar su
     paleta entera: `var(--mint)` ahí dentro es el acento del ambiente o del
     mundo que esté puesto. Con el hex escrito, en Reliquia salían cuatro
     casillas VERDES en mitad de una vitrina violeta. Es el mismo fallo que ya
     tenía la caja de un grupo en el mapa de talentos, en otro sitio.

     `velo()` y `pinta()` dejan pasar un `var(...)` intacto, así que esto sigue
     dando exactamente lo mismo que antes en la casa. */
  const acento = "var(--mint)";
  const escala = ["", velo(acento, "3a"), velo(acento, "77"), velo(acento, "b4"), pinta(acento)];

  let celdas = "";
  for (let i = 0; i < primero; i++) celdas += `<i class="rc-hueco"></i>`;
  for (let d = 1; d <= total; d++) {
    const k = anio + "-" + mm + "-" + String(d).padStart(2, "0");
    const n = cuentas.get(k) || 0;
    const nivel = n <= 0 ? 0 : Math.min(4, Math.ceil(n / max * 4));
    const clases = ["rc-d"];
    if (k > hoy) clases.push("rc-futuro");
    if (k === hoy) clases.push("rc-hoy");
    if (k >= inicioSemana && k <= finSemana) clases.push("rc-semana");
    /* Tinta oscura solo sobre el relleno macizo: es el único nivel que se
       pinta con el color entero, y encima de él un número claro desaparece.
       Los tres velos siguen siendo fondo oscuro con transparencia. */
    if (nivel === 4) clases.push("rc-tinta");
    const titulo = T`${d} de ${nombreDeMes(mes)}` +
      (n ? (n === 1 ? T`: ${n} registro` : T`: ${n} registros`) : "");
    celdas += `<i class="${clases.join(" ")}"${nivel ? ` style="background:${escala[nivel]}"` : ""} title="${escapeAttr(titulo)}">${d}</i>`;
  }

  return `
    <div class="rc">
      ${/* Con el año escrito. Sin él, un calendario suelto no dice de
            cuándo es —y esta tarjeta va a llevar años abierta—: en enero, un
            mes de treinta y un días que empieza en jueves puede ser
            perfectamente el de hace tres años. Lo preguntó Eduardo y no había
            ninguna razón para no ponerlo. */""}
      <div class="rc-rot">${escapeHtml(nombreDeMes(mes))} ${anio}</div>
      <div class="rc-dow" aria-hidden="true">${letrasDeSemana().map(x => `<span>${x}</span>`).join("")}</div>
      <div class="rc-rejilla">${celdas}</div>
    </div>`;
}

function renderHomeTools() {
  const el = document.getElementById("hb-tools");
  if (!el) return;
  if (!state.skills.length) { el.innerHTML = ""; return; }
  if (seleccionHab) {
    const n = seleccionHab.size;
    el.innerHTML = `
      <button class="btn btn-ghost hb-b" onclick="toggleSeleccionHab()">${tx("Cancelar")}</button>
      <button class="btn btn-danger-ghost hb-b" ${n ? "" : "disabled"} onclick="borrarSeleccionHab()">
        ${n ? `Borrar ${n}` : "Marca alguna"}
      </button>`;
    return;
  }
  el.innerHTML = `
    <button class="btn btn-soft hb-b" onclick="openCatalogo()">${tx("＋ Del catálogo")}</button>
    <button class="btn btn-ghost hb-b" onclick="toggleSeleccionHab()">${tx("Seleccionar")}</button>`;
}

/* ================= Catálogo de habilidades =================
   La idea es que el tablero enseñe también lo que NO has desarrollado. Ver
   "Botánica 0" o "Pesca 0" propone algo; una lista con solo lo que ya
   practicas no propone nada. Todas nacen en cero y se pueden quitar en
   bloque, porque la lista es del usuario, no nuestra. */

const SKILL_CATALOG = [
  // Salud y cuerpo
  { n: "Ejercicio",      c: "Salud",       i: "dumbbell", k: "#ff8a70" },
  { n: "Correr",         c: "Salud",       i: "bolt",     k: "#ff8a70" },
  { n: "Natación",       c: "Salud",       i: "target",   k: "#6fc3e8" },
  { n: "Yoga",           c: "Salud",       i: "heart",    k: "#b7a2ea" },
  { n: "Meditación",     c: "Salud",       i: "heart",    k: "#b7a2ea" },
  { n: "Ciclismo",       c: "Salud",       i: "bolt",     k: "#8fd18a" },
  { n: "Escalada",       c: "Salud",       i: "flag",     k: "#f5d76e" },
  { n: "Baile",          c: "Salud",       i: "music",    k: "#f0a5c0" },
  { n: "Primeros auxilios", c: "Salud",    i: "heart",    k: "#ff8a70" },
  /* El sitio donde caben las rutinas mínimas —beber agua, lavarse los
     dientes, dormir a horas—. Sin ella, misiones así se quedaban sin
     habilidad a la que sumar o acababan colgadas de Ejercicio, que no es
     lo mismo: cuidarse no es entrenar. */
  { n: "Cuidado personal", c: "Salud",     i: "smile",    k: "#6fc3e8" },

  // Casa y oficios
  { n: "Cocina",         c: "Casa",        i: "coffee",   k: "#f5d76e" },
  { n: "Repostería",     c: "Casa",        i: "coffee",   k: "#f0a5c0" },
  { n: "Jardinería",     c: "Casa",        i: "plant",    k: "#8fd18a" },
  { n: "Botánica",       c: "Casa",        i: "plant",    k: "#5fe0b0" },
  { n: "Carpintería",    c: "Casa",        i: "wrench",   k: "#f5d76e" },
  { n: "Reparaciones",   c: "Casa",        i: "wrench",   k: "#9aa7b8" },
  { n: "Costura",        c: "Casa",        i: "pen",      k: "#b7a2ea" },
  { n: "Mecánica",       c: "Casa",        i: "wrench",   k: "#9aa7b8" },
  { n: "Electrónica",    c: "Casa",        i: "bolt",     k: "#6fc3e8" },

  // Creatividad
  { n: "Dibujo",         c: "Creatividad", i: "brush",    k: "#b7a2ea" },
  { n: "Pintura",        c: "Creatividad", i: "brush",    k: "#f0a5c0" },
  { n: "Fotografía",     c: "Creatividad", i: "camera",   k: "#6fc3e8" },
  { n: "Escritura",      c: "Creatividad", i: "pen",      k: "#f5d76e" },
  { n: "Caligrafía",     c: "Creatividad", i: "pen",      k: "#9aa7b8" },
  { n: "Guitarra",       c: "Creatividad", i: "music",    k: "#ff8a70" },
  { n: "Piano",          c: "Creatividad", i: "music",    k: "#eaf1ef" },
  { n: "Canto",          c: "Creatividad", i: "mic",      k: "#f0a5c0" },
  { n: "Cerámica",       c: "Creatividad", i: "gem",      k: "#f5d76e" },
  { n: "Vídeo",          c: "Creatividad", i: "camera",   k: "#b7a2ea" },

  // Aprendizaje
  { n: "Idiomas",        c: "Aprendizaje", i: "globe",    k: "#6fc3e8" },
  { n: "Programación",   c: "Aprendizaje", i: "code",     k: "#5fe0b0" },
  { n: "Lectura",        c: "Aprendizaje", i: "book",     k: "#f5d76e" },
  { n: "Astronomía",     c: "Aprendizaje", i: "star",     k: "#b7a2ea" },
  { n: "Ajedrez",        c: "Aprendizaje", i: "crown",    k: "#9aa7b8" },
  { n: "Historia",       c: "Aprendizaje", i: "book",     k: "#f5d76e" },
  { n: "Oratoria",       c: "Aprendizaje", i: "mic",      k: "#ff8a70" },

  // Vida adulta
  { n: "Finanzas",       c: "Vida adulta", i: "coin",     k: "#5fe0b0" },
  { n: "Carisma",        c: "Vida adulta", i: "smile",    k: "#6fc3e8" },
  /* Escuchar es lo otro que se practica al estar con alguien, y hasta la
     0.7.84 no existía: la bienvenida ofrecía "Gente que quiero" y creaba
     Oratoria, que es hablar delante de una sala. Va aparte de Carisma
     porque no son la misma práctica —se puede caer bien sin enterarse de
     nada— y porque el par de esa área tiene que sostenerse solo. */
  { n: "Escucha",        c: "Vida adulta", i: "heart",    k: "#8fd18a" },
  { n: "Negociación",    c: "Vida adulta", i: "chart",    k: "#f5d76e" },
  { n: "Organización",   c: "Vida adulta", i: "map",      k: "#9aa7b8" },
  { n: "Liderazgo",      c: "Vida adulta", i: "crown",    k: "#b7a2ea" },
  { n: "Barismo",        c: "Vida adulta", i: "coffee",   k: "#f5d76e" },

  // Aire libre
  { n: "Pesca",          c: "Aire libre",  i: "rod",      k: "#6fc3e8" },
  { n: "Senderismo",     c: "Aire libre",  i: "compass",  k: "#8fd18a" },
  { n: "Supervivencia",  c: "Aire libre",  i: "flame",    k: "#ff8a70" },
  { n: "Buceo",          c: "Aire libre",  i: "goggles",  k: "#6fc3e8" },
  { n: "Orientación",    c: "Aire libre",  i: "compass",  k: "#f5d76e" }
];

/* ================= Adivinar qué habilidad sube =================
   El objetivo es que el usuario no tenga que elegir a mano en cada
   formulario. Probado contra los títulos reales de la app, buscar el nombre
   de la habilidad dentro del título acierta 3 de 11 —y uno de esos tres es
   un falso positivo ("Renovar la cocina" no es cocinar—, así que hace falta
   un diccionario de verdad.

   Dos pesos: los VERBOS (con "!") valen 3 y los sustantivos 1. No es un
   capricho: el verbo dice qué HACES y el sustantivo suele ser el escenario.
   En "Renovar la cocina", "cocina" es un lugar y "renovar" es la actividad;
   sin esa diferencia, la XP se iría a Cocina en vez de a Reparaciones.

   Nunca decide solo: propone, y lo que el usuario corrige se aprende. */

const LEXICO = {
  "Ejercicio":     "!entrenar !entreno !ejercitar !moverme gimnasio gym pesas rutina cardio abdominales flexiones sentadillas",
  "Correr":        "!correr !corro !trotar carrera maraton running trote kilometros km 5k 10k zapatillas",
  "Natación":      "!nadar !nado natacion alberca piscina brazadas crol",
  "Yoga":          "!estirar yoga postura asana flexibilidad esterilla",
  "Meditación":    "!meditar !respirar meditacion calma mindfulness silencio atencion plena",
  "Ciclismo":      "!pedalear !rodar bici bicicleta ciclismo ruta pedaleo",
  "Escalada":      "!escalar !trepar escalada muro boulder rocodromo",
  "Baile":         "!bailar !danzar baile danza salsa coreografia",
  "Primeros auxilios": "!auxiliar rcp botiquin emergencias primeros auxilios",
  /* Las rutinas de mantenimiento del cuerpo. Lleva "!beber" y "!dormir"
     porque son las dos que más aparecen escritas como misión, y "vasos",
     "cepillo" y "protector" porque la gente escribe el objeto y no el
     verbo: "ocho vasos", "hilo dental", "protector solar". */
  "Cuidado personal": "!beber !hidratarme !dormir !cepillarme !lavarme !descansar !estirarme agua vasos dientes cepillo hilo dental piel crema protector solar higiene rutina sueño siesta uñas cabello ducha",

  "Cocina":        "!cocinar !guisar !sofreir receta recetas sarten fogon comida platillo chef guiso",
  "Repostería":    "!hornear !amasar !repostear pastel tarta galletas pan masa reposteria horno",
  "Jardinería":    "!plantar !podar !regar !sembrar jardin maceta huerto semillas tierra planta",
  "Botánica":      "!identificar botanica especies hojas flora herbario plantas",
  "Carpintería":   "!lijar !ensamblar !tallar madera carpinteria sierra mueble tablon",
  "Reparaciones":  "!reparar !arreglar !renovar !reformar !remodelar !instalar averia taladro obra fontaneria",
  "Costura":       "!coser !bordar !remendar costura aguja hilo maquina patron tela",
  "Mecánica":      "!desarmar mecanica motor coche taller aceite bujias",
  "Electrónica":   "!soldar !cablear electronica circuito arduino soldadura placa",

  "Dibujo":        "!dibujar !bocetar !ilustrar dibujo boceto ilustracion lapiz trazo",
  "Pintura":       "!pintar !acuarela pintura oleo lienzo pincel mural",
  "Fotografía":    "!fotografiar !retratar foto fotos fotografia camara retrato revelado encuadre",
  "Escritura":     "!escribir !redactar !narrar escritura relato novela cuento articulo texto blog",
  "Caligrafía":    "!caligrafiar caligrafia letras rotulacion pluma trazos lettering",
  "Guitarra":      "!tocar guitarra acordes cuerdas guitarrista puentes",
  "Piano":         "!tocar piano teclado teclas partitura pianista",
  "Canto":         "!cantar canto voz coro afinacion karaoke",
  "Cerámica":      "!modelar !tornear ceramica barro arcilla torno esmalte",
  "Vídeo":         "!grabar !editar !montar video edicion metraje corto rodaje",

  "Idiomas":       "!hablar !traducir idioma idiomas ingles frances aleman italiano portugues japones vocabulario gramatica duolingo",
  "Programación":  "!programar !codear !desarrollar codigo software app web python javascript programacion",
  "Lectura":       "!leer lectura libro libros pagina capitulo novela ensayo",
  "Astronomía":    "!observar astronomia estrellas telescopio planetas cielo constelaciones",
  "Ajedrez":       "!jugar ajedrez apertura tactica elo partidas tablero",
  "Historia":      "!investigar historia epoca documental siglo museo",
  "Oratoria":      "!hablar !exponer !presentar oratoria discurso publico presentacion charla",

  "Finanzas":      "!ahorrar !invertir !presupuestar finanzas dinero gastos ahorro inversion presupuesto fondo deuda emergencia bolsa",
  "Carisma":       "!conversar !socializar !platicar !conocer carisma conversacion gente social amigos trato red contactos",
  /* "escucha" y "empatia" salieron de Carisma al nacer esta: dos habilidades
     que reclaman la misma palabra convierten el acierto en un sorteo. */
  "Escucha":       "!escuchar !atender !acompanar !interrumpir escucha empatia atencion presencia paciencia",
  "Negociación":   "!negociar !vender !cerrar negociacion trato cliente venta acuerdo precio",
  "Organización":  "!organizar !ordenar !planificar organizacion agenda tramite papeles orden calendario",
  "Liderazgo":     "!liderar !dirigir !coordinar !delegar liderazgo equipo junta reunion jefe mentoria feedback decision",
  "Barismo":       "!preparar cafe barismo espresso molienda cafetera latte",

  "Pesca":         "!pescar pesca caña anzuelo carnada rio muelle",
  "Senderismo":    "!caminar !senderear sendero ruta montana excursion mochila cumbre",
  "Supervivencia": "!acampar !sobrevivir campamento fogata refugio supervivencia tienda",
  "Buceo":         "!bucear buceo inmersion arrecife snorkel botella",
  "Orientación":   "!orientar brujula mapa coordenadas norte orientacion"
};

/* Palabras vacías. Además de artículos y preposiciones, aquí van las que
   aparecen en CUALQUIER meta —"curso", "taller", "proyecto", "semana"— y
   que por eso no distinguen nada: dejarlas dentro hacía que "curso" llevara
   a Programación en "Curso de cocina" y "Curso de inversión". */
const PARADAS = new Set([
  "de","del","la","el","los","las","un","una","mi","mis","para","por","con","en","y","o","a","al",
  "que","me","lo","su","sus","este","esta","primer","primera","mas","muy",
  "curso","cursos","clase","clases","taller","talleres","proyecto","meta","plan","reto",
  "semana","semanas","mes","meses","dia","dias","ano","anos","vez","veces","hora","horas",
  "linea","online","basico","basica","nuevo","nueva","propio","propia"
]);

function normalizarTexto(s) {
  return String(s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/).filter(w => w.length > 2 && !PARADAS.has(w));
}

/* Recorta terminaciones para que "corriendo", "corrí" y "correr" cuenten
   igual. Es un recorte tosco a propósito: un lematizador completo pesaría
   más que toda la app y aquí solo hace falta acercar palabras. */
function raiz(w) {
  return w.replace(/(andose|iendose|arse|erse|irse|ando|iendo|aste|aron|amos|emos|imos|aba|ado|ido|ar|er|ir|es|as|os|a|o|s)$/, "");
}

function lexAprendido() {
  return (state.ui && state.ui.lexAprendido) || {};
}

/* Devuelve las habilidades candidatas ordenadas por puntuación. Solo mira
   las que el usuario TIENE: proponer una que no existe sería inútil. */
function sugerirHabilidades(titulo, rama) {
  const palabras = normalizarTexto(titulo);
  if (!palabras.length && !rama) return [];
  const raices = palabras.map(raiz);
  const aprendido = lexAprendido();
  const puntos = new Map();
  const suma = (nombre, p) => puntos.set(nombre, (puntos.get(nombre) || 0) + p);

  /* Cada palabra del título puntúa UNA vez por habilidad, con su mejor
     coincidencia. Sumar por término inflaba el resultado: "correr" casaba a
     la vez con "!correr" y con "!corro" y valía el doble que nada.

     Y el verbo exacto (3) vale más que el encontrado por raíz (2), porque
     recortar terminaciones vuelve iguales al verbo y al sustantivo:
     "cocina" y "cocinar" comparten raíz, pero solo una de las dos dice que
     la actividad sea cocinar. Esa diferencia es la que hace que "Renovar la
     cocina" vaya a Reparaciones y no a Cocina. */
  Object.keys(LEXICO).forEach(nombre => {
    const terminos = LEXICO[nombre].split(" ").map(t => {
      const v = t[0] === "!";
      const w = v ? t.slice(1) : t;
      return { v, w, r: raiz(w) };
    });
    let total = 0;
    palabras.forEach((pal, i) => {
      const pr = raices[i];
      let mejor = 0;
      terminos.forEach(t => {
        if (pal === t.w) mejor = Math.max(mejor, t.v ? 3 : 1);
        else if (t.r.length > 3 && pr === t.r) mejor = Math.max(mejor, t.v ? 2 : 1);
      });
      total += mejor;
    });
    if (total > 0) suma(nombre, total);
  });

  // Lo aprendido de las correcciones del usuario pesa por encima del diccionario
  palabras.forEach(w => {
    const m = aprendido[w];
    if (m) Object.keys(m).forEach(nombre => suma(nombre, m[nombre]));
  });

  const lista = state.skills.map(s => ({ s, p: puntos.get(s.name) || 0 })).filter(x => x.p > 0);
  lista.sort((a, b) => b.p - a.p);

  // Red de seguridad: si el título no dice nada, la rama al menos acota
  if ((!lista.length || lista[0].p < 3) && rama) {
    state.skills.forEach(s => {
      if (s.category && normalizarTexto(s.category)[0] === normalizarTexto(rama)[0]) {
        if (!lista.some(x => x.s.id === s.id)) lista.push({ s, p: 0.5, porRama: true });
      }
    });
    lista.sort((a, b) => b.p - a.p);
  }
  return lista.slice(0, 4);
}

/* Guarda la corrección: si eliges una que no se proponía, sus palabras
   quedan asociadas; si descartas la propuesta, se penaliza. Así la app
   aprende cómo nombras TÚ las cosas. */
function aprenderDeEleccion(titulo, elegidaNombre, propuestaNombre) {
  if (!elegidaNombre || elegidaNombre === propuestaNombre) return;
  state.ui = state.ui || {};
  const mapa = state.ui.lexAprendido || (state.ui.lexAprendido = {});
  normalizarTexto(titulo).forEach(w => {
    const m = mapa[w] || (mapa[w] = {});
    m[elegidaNombre] = Math.min(6, (m[elegidaNombre] || 0) + 2);
    if (propuestaNombre) m[propuestaNombre] = Math.max(-6, (m[propuestaNombre] || 0) - 2);
  });
}

/* ---- Las sugerencias dentro del formulario ----
   Aparecen solas al escribir el título y la primera se marca sola. Marcarla
   es la diferencia entre "cero trabajo si acierto" y "un desplegable más
   que abrir"; que se vean todas y sean tocables es lo que evita que se
   equivoque en silencio. */

let sugActual = { p: null, pr: null };   // qué se propuso primero, para aprender de la corrección

function refrescarSugerencias(pref) {
  const cont = document.getElementById(pref + "-sug");
  if (!cont) return;
  const titulo = (document.getElementById(pref + "-name") || {}).value || "";
  const rama = (document.getElementById(pref + "-branch") || {}).value || "";
  const sel = document.getElementById(pref + "-skill");

  if (titulo.trim().length < 3) { cont.innerHTML = ""; sugActual[pref] = null; return; }

  const lista = sugerirHabilidades(titulo, rama);
  if (!lista.length) {
    cont.innerHTML = `<span class="sug-nada">${tx("No sé cuál encaja con ese nombre; elígela tú si quieres.")}</span>`;
    sugActual[pref] = null;
    return;
  }

  // Solo se marca sola si el campo sigue vacío: nunca pisa una decisión tuya
  if (sel && !sel.value) { sel.value = lista[0].s.id; sugActual[pref] = lista[0].s.name; }
  else if (!sugActual[pref]) sugActual[pref] = lista[0].s.name;

  cont.innerHTML = `<span class="sug-tit">${tx("Sube:")}</span>` + lista.map(x => `
    <button type="button" class="sug-chip ${sel && sel.value === x.s.id ? "on" : ""}"
      style="${tonos("sc", x.s.color)}" onclick="elegirSugerencia('${pref}','${x.s.id}')">
      ${escapeHtml(x.s.name)}${x.porRama ? ` <i>${tx("por la rama")}</i>` : ""}
    </button>`).join("");
}

function elegirSugerencia(pref, id) {
  const sel = document.getElementById(pref + "-skill");
  if (!sel) return;
  sel.value = sel.value === id ? "" : id;   // volver a tocarla la desmarca
  refrescarSugerencias(pref);
}

function marcarSugerenciaElegida(pref) { refrescarSugerencias(pref); }

/* Al guardar: si lo que quedó elegido no es lo que se propuso, esa
   corrección se aprende y la próxima vez se propone mejor. */
function aprenderAlGuardar(pref, titulo, skillId) {
  const elegida = state.skills.find(s => s.id === skillId);
  aprenderDeEleccion(titulo, elegida ? elegida.name : null, sugActual[pref]);
  sugActual[pref] = null;
}

let catalogoSel = new Set();
let seleccionHab = null;   // null = fuera del modo selección

function nuevaHabilidad(nombre, categoria, icono, color) {
  /* La exigencia elegida, no el par fijo de antes: las que salen del catálogo
     tienen que nacer igual que las del formulario. */
  const ex = exigenciaActual();
  return {
    id: uid(), name: nombre, category: categoria, icon: icono, color: color,
    xp: 0, log: [], permanent: false, graceDays: ex.grace, decayPerDay: ex.decay,
    lastActivity: null, createdAt: todayKey()
  };
}

function openCatalogo() {
  catalogoSel = new Set();
  renderCatalogo();
  showView("catalog");
}

function toggleCatalogo(nombre) {
  if (catalogoSel.has(nombre)) catalogoSel.delete(nombre);
  else catalogoSel.add(nombre);
  renderCatalogo();
}

function toggleCatalogoCat(cat) {
  const dentro = SKILL_CATALOG.filter(x => x.c === cat && !yaTengo(x.n));
  const todas = dentro.every(x => catalogoSel.has(x.n));
  dentro.forEach(x => todas ? catalogoSel.delete(x.n) : catalogoSel.add(x.n));
  renderCatalogo();
}

/* Recibe siempre el nombre ESPAÑOL del catálogo —es la clave interna— y lo
   compara contra lo que hay guardado, que va con el rótulo del idioma en que
   se creó. Sin el `tx()`, en inglés el catálogo enseñaría «Drawing» como
   disponible teniendo ya la habilidad puesta, y añadirla la duplicaría. */
function yaTengo(nombre) {
  const rotulo = tx(nombre).toLowerCase();
  return state.skills.some(s => {
    const n = s.name.toLowerCase();
    return n === rotulo || n === nombre.toLowerCase();
  });
}

function renderCatalogo() {
  const cats = [...new Set(SKILL_CATALOG.map(x => x.c))];
  const n = catalogoSel.size;
  document.getElementById("catalog-content").innerHTML = `
    <p class="settings-note" style="padding:0 4px 4px">
      ${tx("Añade las que te interese seguir, aunque sea en cero: ver una habilidad sin empezar te recuerda que existe. Las de aquí además se reconocen solas — al escribir un talento o un proyecto se proponen para recibir el XP. Si te falta alguna, créala arriba: esa lo irá aprendiendo del uso.")}
    </p>
    ${cats.map(cat => {
      const dentro = SKILL_CATALOG.filter(x => x.c === cat);
      const libres = dentro.filter(x => !yaTengo(x.n));
      return `
      <div class="cat-group">
        <div class="cat-head">
          <h3>${escapeHtml(tx(cat))}</h3>
          ${libres.length ? `<button class="cat-all" onclick="toggleCatalogoCat('${enJS(cat)}')">
            ${libres.every(x => catalogoSel.has(x.n)) ? tx("Quitar todas") : tx("Todas")}
          </button>` : `<span class="cat-done">${tx("ya las tienes")}</span>`}
        </div>
        <div class="cat-grid">
          ${dentro.map(x => {
            const tengo = yaTengo(x.n);
            const sel = catalogoSel.has(x.n);
            return `
            <button class="cat-chip ${tengo ? "tengo" : ""} ${sel ? "sel" : ""}"
              ${tengo ? "disabled" : `onclick="toggleCatalogo('${enJS(x.n)}')"`}>
              <span class="cc-ic" style="background:${velo(x.k, "26")};color:${tinta(x.k)}">${icon(x.i, 18)}</span>
              <span class="cc-n">${escapeHtml(tx(x.n))}</span>
              ${tengo ? `<span class="cc-ok">${icon("check", 15)}</span>` : `<span class="cc-box">${sel ? icon("check", 13) : ""}</span>`}
            </button>`;
          }).join("")}
        </div>
      </div>`;
    }).join("")}
    <div class="cat-bar">
      <button class="btn btn-ghost" onclick="showView('home')">${tx("Cancelar")}</button>
      <button class="btn btn-primary" ${n ? "" : "disabled"} onclick="añadirDelCatalogo()">
        ${n ? `Añadir ${n} habilidad${n === 1 ? "" : "es"}` : "Elige alguna"}
      </button>
    </div>`;
}

function añadirDelCatalogo() {
  const elegidas = SKILL_CATALOG.filter(x => catalogoSel.has(x.n) && !yaTengo(x.n));
  if (!elegidas.length) return;
  /* Aquí no se añade una: se añaden las que estén marcadas. Así que el tope se
     mira contra el LOTE entero y no de una en una — si no, con cinco puestas y
     cuatro marcadas entrarían las cuatro y el plan se saltaría por el sitio más
     fácil de encontrar. Se para el lote completo y se dice por qué; elegir
     cuáles caben es de quien las eligió, no nuestro. */
  if (!cabeUnoMas("skills", state.skills.length + elegidas.length - 1)) {
    topeAlcanzado("skills");
    return;
  }
  /* Se guarda el nombre TRADUCIDO —es el rótulo que va a llevar la habilidad—
     y la categoría también, que se ve en el filtro de Habilidades. La clave
     interna sigue siendo la española: es la que compara `yaTengo` y la que
     busca el asistente para dar icono y color. */
  elegidas.forEach(x => state.skills.push(nuevaHabilidad(tx(x.n), tx(x.c), x.i, x.k)));
  save();
  catalogoSel = new Set();
  showView("home");
  toast(`${elegidas.length} habilidad${elegidas.length === 1 ? "" : "es"} añadida${elegidas.length === 1 ? "" : "s"}`, "logro");
}

/* ---- Selección múltiple para quitar varias de golpe ---- */

function toggleSeleccionHab() {
  seleccionHab = seleccionHab ? null : new Set();
  renderHome();
}

function toggleHabSel(id) {
  if (!seleccionHab) return;
  if (seleccionHab.has(id)) seleccionHab.delete(id);
  else seleccionHab.add(id);
  renderHome();
}

async function borrarSeleccionHab() {
  if (!seleccionHab || !seleccionHab.size) return;
  const n = seleccionHab.size;
  const conXp = state.skills.filter(s => seleccionHab.has(s.id) && s.xp > 0).length;
  const ok = await ask(
    `Se van ${n} habilidad${n === 1 ? "" : "es"}` +
    (conXp ? `, y ${conXp === 1 ? tx("una de ellas tiene") : `${conXp} de ellas tienen`} progreso registrado que se pierde` : "") +
    ".\n\nEsto no se puede deshacer.",
    `Borrar ${n === 1 ? "la habilidad" : "las " + n}`, true);
  if (!ok) return;
  // Las misiones que apuntaban a una habilidad borrada se quedan sin dueño,
  // no se borran: la misión sigue siendo algo que el usuario hace.
  state.missions.forEach(m => { if (seleccionHab.has(m.skillId)) m.skillId = null; });
  state.perks.forEach(p => { if (seleccionHab.has(p.skillId)) p.skillId = null; });
  state.skills = state.skills.filter(s => !seleccionHab.has(s.id));
  seleccionHab = null;
  save();
  renderHome();
  toast(`${n} habilidad${n === 1 ? "" : "es"} borrada${n === 1 ? "" : "s"}`, "deshecho");
}

function fmtXp(n) {
  return n >= 10000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n);
}

function setCategory(c) {
  activeCategory = c;
  renderHome();
}

/* ================= Encabezado común de sección =================
   Las cuatro secciones se leen igual: una cifra que resume el conjunto,
   indicadores comparables y el foco de lo que pide atención. */

/* ================= La tira de sección (0.7.118) =================
   Era un banner: un dibujo de 208 px con cuatro cifras, la línea de foco y el
   informe. Eduardo lo paró tres veces —0.7.49 el velo, 0.7.112 quitarlo del
   teléfono, y ahora— y la última con el diagnóstico exacto: «aportan poco para
   lo mucho que roban». Medido en Misiones: el banner empujaba dos misiones por
   debajo del doblez.

   Lo que queda es UNA fila de 62 px con lo único que cambia lo que haces en el
   siguiente minuto —la cifra del módulo y lo que pide atención— y un chevron.
   Detrás del chevron siguen las cuatro cifras y el informe: **no se pierde
   nada, se deja de estorbar**.

   Fuera la ilustración de fondo, que es lo que más pesaba y lo que menos decía;
   el color del módulo ya lo identifica. Por eso `scene` ya no se recibe: los
   cinco sitios dejaron de calcularla.

   Abierta o cerrada se recuerda en `heroAbierto` mientras dure la sesión, y se
   estampa al dibujar: sin eso, cualquier repintado —cumplir una misión, que
   pase un cuarto de hora— la volvería a cerrar en las narices de quien acaba de
   abrirla. */
let heroAbierto = false;
function alternarTiraSeccion(btn) {
  heroAbierto = !heroAbierto;
  const t = btn.closest(".sec-tira");
  if (t) t.classList.toggle("abierta", heroAbierto);
  btn.setAttribute("aria-expanded", String(heroAbierto));
}

function sectionHero({ lead, stats, focus, informe }) {
  const conVar = stats.some(s => s.d);
  const alto = stats.some(s => String(s.n).length >= 9);
  const cifras = stats.map(s => `<div>${
    conVar ? (s.d || `<i class="sh-var"></i>`) : ""
  }<div class="n ${alto ? "alto " : ""}${s.tone || ""}">${s.n}</div><div class="t">${s.t}</div></div>`).join("");
  /* La línea del foco es el corazón de la tira, así que cuando lleva acción es
     un botón de verdad y no un adorno con `onclick`. */
  const eti = focus.onclick ? "button" : "div";
  return `
    <div class="sec-tira${heroAbierto ? " abierta" : ""}">
      <div class="st-fila">
        <div class="st-lead">${lead}</div>
        <${eti} class="st-foco"${focus.onclick ? ` onclick="${focus.onclick}"` : ""}>
          <span class="stf-v">${escapeHtml(focus.v)}</span>
          <span class="stf-k" style="color:${focus.color}">${escapeHtml(focus.k)}</span>
          ${typeof focus.pct === "number" ? `<span class="shf-bar"><i style="width:${focus.pct}%;background:${focus.color}"></i></span>` : ""}
        </${eti}>
        <button type="button" class="st-mas" onclick="alternarTiraSeccion(this)" aria-expanded="${heroAbierto}"
          aria-label="${escapeAttr(tx("Ver los números"))}" title="${escapeAttr(tx("Ver los números"))}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10l5 5 5-5"/></svg>
        </button>
      </div>
      <div class="st-abierta">
        <div class="sh-stats">${cifras}</div>
        ${/* La puerta al informe. En `btn-linea` y no en menta maciza porque no
              escribe nada: solo lleva a mirar (ver los seis niveles de botón). */
          informe ? `<button class="btn btn-linea st-informe" onclick="abrirInforme('${informe}')">${tx("Ver el informe")}</button>` : ""}
      </div>
    </div>`;
}

/* ================= Menú de herramientas de una rama =================
   Solo "＋" se queda fuera, que es lo único de uso diario; lo demás vive
   aquí dentro con su nombre escrito, en vez de ser una fila de iconos
   mudos que además no cabía en el móvil. */

const BM_ICONS = {
  puntos: '<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
  flecha: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  lapiz: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  reordenar: '<path d="M3 12a9 9 0 0115.5-6.2M21 12a9 9 0 01-15.5 6.2"/><path d="M18 3v5h-5M6 21v-5h5"/>',
  bote: '<path d="M4 7h16M10 11.5v6M14 11.5v6M6.5 7l.9 12.1a2 2 0 002 1.9h5.2a2 2 0 002-1.9L17.5 7M9.5 7V5.2a2 2 0 012-2h1a2 2 0 012 2V7"/>',
  expandir: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
  /* Encuadrar NO es lo mismo que pantalla completa, y llevaban el mismo
     dibujo: cuatro esquinas hacia fuera. Este mira hacia DENTRO —las esquinas
     apuntan al centro— porque eso es lo que hace: recoger todo el mapa para
     que quepa. Lo cazo Eduardo al ver los dos botones iguales. */
  encuadrar: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  copiar: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M6.5 15H5.2A2.2 2.2 0 013 12.8V5.2A2.2 2.2 0 015.2 3h7.6A2.2 2.2 0 0115 5.2v1.3"/>',
  caja: '<path d="M3 8.5L12 4l9 4.5v7L12 20l-9-4.5z"/><path d="M3 8.5L12 13l9-4.5M12 13v7"/>',
  /* ---- Poner de pie una rama, y volverla a tumbar ----
     Son DOS iconos y no uno, y la diferencia importa: el que se enseña dibuja
     la rama COMO ESTÁ AHORA, con la flecha señalando hacia dónde la vas a
     llevar. Con un icono fijo, una rama ya de pie seguía enseñando el
     rectángulo tumbado y el botón contaba lo contrario de lo que pasaba. Lo
     pidió Eduardo. Ver `girarRama`. */
  girar: '<rect x="3" y="13" width="12" height="7.5" rx="1.8"/><path d="M13.5 9.5V5.6A2 2 0 0115.5 3.6h4"/><path d="M17.6 1.6l2.4 2-2.4 2"/>',
  girarVuelta: '<rect x="13" y="3" width="7.5" height="12" rx="1.8"/><path d="M9.5 13.5H5.6A2 2 0 013.6 11.5v-4"/><path d="M1.6 9.4l2-2.4 2 2.4"/>'
};

let openBranchMenu = null;

/* `key` llega EN CRUDO, sin escapar por fuera. Es a propósito: viaja a dos
   sitios que necesitan escapes distintos —dentro de una cadena de JavaScript
   y dentro de un atributo que luego se compara con `dataset.menu`— y si el
   que llama lo escapaba, los dos acababan con textos distintos y el menú de
   una rama con apóstrofo no se abría nunca. */
function branchMenu(key, items) {
  if (!items.length) return "";
  return `
    <div class="bmenu-wrap">
      <button class="badd solid" onclick="toggleBranchMenu('${enJS(key)}', event)" aria-label="${escapeAttr(tx("Más opciones de esta rama"))}" aria-haspopup="true">
        <svg viewBox="0 0 24 24">${BM_ICONS.puntos}</svg>
      </button>
      <div class="bmenu" data-menu="${escapeAttr(key)}">
        ${items.map(it => `
          <button class="${it.danger ? "danger" : ""}" onclick="closeBranchMenus();${it.onclick}">
            <span class="bm-tx"><b>${escapeHtml(it.title)}</b><span>${escapeHtml(it.hint)}</span></span>
            <span class="bm-ic"><svg viewBox="0 0 24 24">${BM_ICONS[it.icon]}</svg></span>
          </button>`).join("")}
      </div>
    </div>`;
}

function syncBranchMenus() {
  document.querySelectorAll(".bmenu").forEach(m => m.classList.toggle("open", m.dataset.menu === openBranchMenu));
}

function closeBranchMenus() {
  openBranchMenu = null;
  syncBranchMenus();
}

/* stopPropagation es necesario: sin él, el mismo clic que abre el menú
   burbujea hasta el documento y lo cierra en el acto. */
function toggleBranchMenu(key, ev) {
  if (ev) ev.stopPropagation();
  cerrarCtxMenu();          // dos menús abiertos a la vez no se leen
  openBranchMenu = (openBranchMenu === key) ? null : key;
  syncBranchMenus();
}

document.addEventListener("click", () => { if (openBranchMenu) closeBranchMenus(); });

/* "sus 1 proyecto" no lo dice nadie. El singular cambia el posesivo y el
   verbo, y con cero no hay nada que anunciar: devuelve "" y quien llama
   omite la frase entera en vez de escribir "sus 0 proyectos". */
function fraseCantidad(n, singular, plural) {
  if (n === 0) return "";
  if (n === 1) return `su único ${singular}`;
  return `sus ${n} ${plural}`;
}

/* Borrar una rama entera. Es de las pocas acciones de la app que destruyen
   datos sin vuelta atrás, así que se avisa con el número exacto de lo que
   se va y con el botón en rojo. */
/* ---- Las ramas existen aunque estén vacías ----
   Una rama era solo el nombre que llevaban escrito sus talentos o sus
   encargos: al sacar el último, la rama desaparecía de la pantalla y lo que
   acababas de mover ya no tenía a dónde volver. Mover una tarjeta nunca debe
   cerrar la puerta por la que entró.

   Así que la lista de ramas se guarda aparte. Una rama vacía sigue ahí
   esperando, se puede crear antes de tener nada que meterle, y solo
   desaparece cuando se borra a mano. */
function claveRamas(kind) { return kind === "perks" ? "ramasTalentos" : "ramasProyectos"; }

function ramasDe(kind) {
  const lista = kind === "perks" ? state.perks : state.projects;
  state.ui = state.ui || {};
  const clave = claveRamas(kind);
  const guardadas = state.ui[clave] || [];
  const usadas = [...new Set(lista.map(x => x.branch || "General"))];
  const nuevas = usadas.filter(n => !guardadas.includes(n));
  /* Las ramas que llegan escritas en un dato —de antes de que existiera esta
     lista, de una importación, de otro dispositivo— se apuntan la primera vez
     que se dibujan. Solo se guarda cuando de verdad hay algo nuevo: si no,
     cada repintado escribiría en disco. */
  if (nuevas.length) {
    state.ui[clave] = [...guardadas, ...nuevas];
    save();
  }
  return (state.ui[clave] || []).slice();
}

/* El botón de crear una rama abre EL CAJÓN, no la caja de texto.

   Es el instante en que alguien se queda mirando un lienzo vacío, y por eso es
   el sitio donde tienen que estar los diez caminos: un catálogo guardado en
   una sección del menú no lo encuentra nadie. Dentro, «De cero» sigue siendo
   la primera opción y hace exactamente lo de siempre.

   El tope no se mira aquí: se mira dentro, porque el cajón se abre igual
   cuando ya no caben más ramas —con los caminos apagados y mirables— y eso es
   la diferencia entre un escaparate y un muro con un precio. */
function crearRama(kind) {
  abrirCajon(kind);
}

async function crearRamaDeCero(kind) {
  const esTalentos = kind === "perks";
  /* Cada módulo tiene su propia clave de tope porque los números son
     distintos: tres ramas de talentos y dos proyectos. Antes esto miraba solo
     Talentos y Proyectos no miraba nada, así que la tabla de precios prometía
     un límite que la app no aplicaba en ningún sitio. Se pregunta ANTES de
     pedir el nombre, para no hacer escribir algo que se va a tirar. */
  const claveTope = esTalentos ? "ramas" : "ramasProyectos";
  if (!cabeUnoMas(claveTope, ramasDe(kind).length)) {
    topeAlcanzado(claveTope);
    return;
  }
  const nombre = await askText(
    esTalentos ? tx("Nueva rama de talentos") : tx("Nueva rama de proyectos"), "", "Crear",
    esTalentos
      ? tx("Un ámbito donde agrupar talentos: un oficio, un instrumento, un plan.")
      : tx("Algo que estás construyendo: una mudanza, un lanzamiento, un trámite largo. Dentro van los encargos que lo hacen avanzar."),
    30);
  if (!nombre) return;
  const ramas = ramasDe(kind);
  /* ---- Cómo se llama cada cosa en Proyectos ----
     La jerarquía, tal como la fijó Eduardo el 27 ago 2026:

       rama de proyectos  →  encargos  →  etapas

     Y el detalle que parece un capricho y no lo es: **la rama de proyectos,
     una vez creada, se llama PROYECTO**. Se crean ramas y se tienen
     proyectos. Por eso este cuadro dice «Nueva rama de proyectos» y el aviso
     de dos líneas más abajo dice «Proyecto X creado»: no es una
     inconsistencia, es el ciclo de vida de la misma cosa.

     Los encargos son las tarjetas de dentro —«son como quests», palabras
     suyas— y las etapas son los pasos de cada quest.

     Él mismo avisó de que suena raro y de que parece faltar un eslabón. Se
     queda así a propósito: es como entiende hoy el asunto, y el vocabulario
     de la app tiene que ser el suyo y no uno más ordenado que nadie usa. Si
     algún día aparece el eslabón que falta, este comentario es el sitio por
     donde empezar. */
  if (ramas.includes(nombre)) {
    toast(`Ya tienes ${esTalentos ? "una rama" : "un proyecto"} "${nombre}"`, "atencion");
    return;
  }
  state.ui[claveRamas(kind)] = [...ramas, nombre];
  save();
  if (esTalentos) renderTree(); else renderProjects();
  toast(`${esTalentos ? "Rama" : "Proyecto"} "${nombre}" ${esTalentos ? "creada" : "creado"}`, "hecho");
}

/* Al renombrar, la rama conserva su sitio en la lista. Si se juntó con otra,
   el hueco de la que desaparece se cierra en vez de dejar un nombre muerto. */
function renombrarEnRamas(kind, viejo, nuevo) {
  const clave = claveRamas(kind);
  const o = ramasDe(kind);
  const i = o.indexOf(viejo);
  if (i < 0) return;
  o[i] = o.includes(nuevo) ? null : nuevo;
  state.ui[clave] = o.filter(Boolean);
}

async function deleteBranch(kind, b) {
  const esTalentos = kind === "perks";
  const lista = (esTalentos ? state.perks : state.projects).filter(p => (p.branch || "General") === b);
  const singular = esTalentos ? "talento" : "encargo";
  const plural = esTalentos ? "talentos" : "encargos";
  const n = lista.length;

  const arrastra = fraseCantidad(n, singular, plural);
  /* Cada módulo llama a su contenedor por su nombre: en Talentos es una rama y
     en Proyectos es el proyecto entero. Un cuadro que dice «se borrará la
     rama» cuando lo que se borra es un proyecto con sus encargos dentro le
     pide a la persona que traduzca, y justo antes de confirmar algo que no se
     deshace. */
  const cont = esTalentos ? "la rama" : "el proyecto";
  const ok = await ask(
    (arrastra
      ? `Se borrará ${cont} "${b}" y con ${esTalentos ? "ella" : "él"} ${arrastra}.`
      : `Se borrará ${cont} "${b}", que está ${esTalentos ? "vacía" : "vacío"}.`) + "\n\n" +
    (esTalentos && n ? tx("También se pierden las conexiones que llegaban a esos talentos desde otras ramas.\n\n") : "") +
    tx("Esto no se puede deshacer."),
    esTalentos ? tx("Borrar la rama") : tx("Borrar el proyecto"), true);
  if (!ok) return;

  state.ui[claveRamas(kind)] = ramasDe(kind).filter(n => n !== b);

  const ids = new Set(lista.map(p => p.id));
  if (esTalentos) {
    state.perks = state.perks.filter(p => !ids.has(p.id));
    // Nadie puede quedar exigiendo un talento que ya no existe: eso dejaría
    // nodos bloqueados para siempre, sin forma de desbloquearlos.
    state.perks.forEach(p => {
      const r = requisitosDe(p);
      if (r.some(id => ids.has(id))) p.requiere = r.filter(id => !ids.has(id));
    });
    if (editandoRama(b, "talentos")) editBranch = null;
    /* Y si se estaba viendo a pantalla completa, se sale: quedarse dentro de
       una rama borrada es lo que dejaba la capa encima con datos fantasma. */
    if (typeof fullscreenBranch !== "undefined" && fullscreenBranch === b
        && fullscreenMod === "talentos") closeBranchFullscreen();
  } else {
    state.projects = state.projects.filter(p => !ids.has(p.id));
    /* Igual que en Talentos: quedarse dentro de un proyecto borrado deja la
       capa encima enseñando algo que ya no existe. */
    if (typeof fullscreenBranch !== "undefined" && fullscreenBranch === b
        && fullscreenMod === "proyectos") closeBranchFullscreen();
    /* La misma trampa que en Talentos, y ahora tambien aqui porque un
       encargo puede depender de otro: sin limpiar, los que apuntaban a uno
       borrado se quedarian esperando un turno que no va a llegar nunca. */
    state.projects.forEach(p => {
      const r = requisitosDe(p);
      if (r.some(id => ids.has(id))) p.requiere = r.filter(id => !ids.has(id));
    });
    if (editandoRama(b, "proyectos")) editBranch = null;
    if (state.ui.mapaProyectos) delete state.ui.mapaProyectos[b];
  }
  save();
  if (esTalentos) renderTree(); else renderProjects();
  toast(`Rama "${b}" borrada`, "deshecho");
}

/* ---- Renombrar una rama de talentos ----
   La rama no es un dato aparte: es el nombre que llevan escrito sus talentos
   y sus cajas. Renombrarla es reescribirlo en todos a la vez, y por eso vive
   aquí y no en un formulario.

   Si el nombre nuevo ya existe, las dos ramas se juntan. No es un error que
   haya que impedir —juntar dos ramas que se llamaban casi igual es una razón
   perfectamente buena para renombrar— pero sí se avisa antes, porque el
   resultado no se puede adivinar desde el teclado. */
async function renombrarRama(b) {
  const nuevo = await askText(`Renombrar la rama "${b}"`, b, "Renombrar",
    tx("Se reescribe en todos sus talentos y en sus cajas."));
  if (nuevo === null || !nuevo || nuevo === b) return;

  const existe = state.perks.some(p => (p.branch || "General") === nuevo);
  if (existe && !await ask(
    `Ya tienes una rama llamada "${nuevo}". Los talentos de "${b}" se van a juntar con los suyos en una sola rama.`,
    "Juntarlas")) return;

  state.perks.forEach(p => { if ((p.branch || "General") === b) p.branch = nuevo; });
  (state.cajas || []).forEach(c => { if (c.branch === b) c.branch = nuevo; });
  renombrarEnRamas("perks", b, nuevo);
  // El estado de la interfaz va pegado al nombre: si no se muda, la rama
  // renombrada aparecería desplegada y la vieja seguiría "plegada" sin existir
  if (state.ui && state.ui.collapsed && state.ui.collapsed[b]) {
    delete state.ui.collapsed[b];
    state.ui.collapsed[nuevo] = true;
  }
  if (editandoRama(b, "talentos")) editBranch = nuevo;
  if (fullscreenBranch === b && fullscreenMod === "talentos") fullscreenBranch = nuevo;
  save();
  renderTree();
  toast(existe ? `Ramas juntadas en "${nuevo}"` : `Ahora se llama "${nuevo}"`, "hecho");
}

/* Lo mismo para las ramas de Proyectos. Vive aparte de la de Talentos porque
   lo que arrastra cada una es distinto —allí también hay cajas del ático y un
   modo edición abierto— y unificarlas dejaría una función con dos mitades que
   nunca se ejecutan juntas. */
async function renombrarRamaProyectos(b) {
  const nuevo = await askText(`Renombrar el proyecto "${b}"`, b, "Renombrar",
    tx("Se reescribe en todos sus encargos."));
  if (nuevo === null || !nuevo || nuevo === b) return;

  const existe = state.projects.some(p => (p.branch || "General") === nuevo);
  if (existe && !await ask(
    `Ya tienes un proyecto llamado "${nuevo}". Los encargos de "${b}" se van a juntar con los suyos en uno solo.`,
    "Juntarlos")) return;

  state.projects.forEach(p => { if ((p.branch || "General") === b) p.branch = nuevo; });
  renombrarEnRamas("projects", b, nuevo);
  /* Igual que "plegada" en Talentos: si la vista no se muda con el nombre, el
     proyecto renombrado vuelve a la lista y el nombre viejo se queda marcado
     como "en mapa" sin existir. */
  if (state.ui && state.ui.mapaProyectos && state.ui.mapaProyectos[b]) {
    delete state.ui.mapaProyectos[b];
    state.ui.mapaProyectos[nuevo] = true;
  }
  if (editandoRama(b, "proyectos")) editBranch = nuevo;
  if (fullscreenBranch === b && fullscreenMod === "proyectos") fullscreenBranch = nuevo;
  save();
  renderProjects();
  toast(existe ? `Proyectos juntados en "${nuevo}"` : `Ahora se llama "${nuevo}"`, "hecho");
}

/* Etiqueta de rama reutilizable: el mismo concepto en todas las secciones. */
function branchHeader(name, countLabel, buttons) {
  return `
    <div class="branch-head">
      <div class="btitle">
        <span class="branch-kicker">${tx("Rama")}</span>
        <h3>${escapeHtml(name)}</h3>
      </div>
      <span class="count">${countLabel}</span>
      <div class="bhead-btns">${buttons}</div>
    </div>`;
}


/* ================= Las luciérnagas de medianoche (0.7.129) =================
   Un secreto que pidió Eduardo y aprobó en un boceto: si abres Norata entre
   las 00:00 y las 3:59, de tres a cinco luciérnagas cruzan el Resumen. Si
   atrapas una, te deja una frase y las demás se van; si no, se van solas en
   unos diez segundos. Una vez por noche, y solo en el Resumen.

   Lo que se decidió y por qué:

   - **Una vez por noche.** Si salieran siempre, dejarían de ser un secreto y
     serían decoración. Se apunta en `state.ui.luciNoche` AL SOLTARLAS, no al
     intentarlo: si en ese momento había una ventana encima, no salieron y
     todavía les toca.
   - **Poco tiempo en pantalla.** Eduardo pidió que no se quedaran esperando a
     que las toques: sin saber qué pasa, cinco bichos dando vueltas un minuto
     abruman. Entran casi juntas, pasan de 5 a 7 s y se van (0.7.133.2; antes 7 a 10).
   - **Se atrapa UNA por noche.** Atrapada una, las demás salen volando deprisa y
     ya no se dejan: el aviso dice «¡Atrapaste una luciérnaga!», sin la cuenta.
   - **La frase se queda lo que tarda en leerse dos veces**: 6 s más 70 ms por
     letra, con una barra que dice cuánto queda y una X para irse antes. Con
     los 7 s fijos del boceto, la primera se sentía corta.
   - **Las atrapadas se cuentan, como curiosidad**, en dorado, en Mi
     expedición. No dan puntos ni abren nada. Van en `settings.luciernagas` y
     `fusionarEstados` se queda con el mayor, para que dos dispositivos no se
     roben la cuenta.
   - **De día no brillan**: el bicho se ve entero, con el abdomen amarillo y
     sin halo (`--luci-halo: none` en `html.claro`). Es la regla de siempre.
   - **Con «menos movimiento» no vuelan**: aparecen quietas, parpadean y se
     desvanecen.

   Y la luciérnaga RARA (0.7.131), la de luz blanca azulada que da la pista
   del mundo Arcade. Esperó a que el mundo existiera: una pista hacia nada es
   una broma pesada. Es cuadrada —un píxel—, parpadea a saltos y vuela solo en
   ocho direcciones; sale una noche de cada quince y solo a quien ya atrapó
   tres normales (`arcadeTocaRara`). No suma a la cuenta, y deja un píxel en
   una esquina que abre el mando del código. Ver js/10k-arcade.js. */
/* **Ninguna frase puede hacer sentir mal a nadie** (Eduardo, 0.7.129.1). La
   segunda decía que las luciérnagas encienden la luz «para encontrar pareja»:
   graciosa para unos, un piquete para quien está solo a las tres de la mañana,
   que es justo quien la va a leer. Se cayó. A esta hora la persona está
   despierta y a veces no por gusto: la broma es CON ella, nunca de algo suyo. */
const LUCI_FRASES = [
  () => tx("A esta hora solo quedamos las luciérnagas y quien jura que ya se iba a dormir."),
  () => tx("Brillamos unas pocas semanas al año, y esta noche nos tocó brillar contigo."),
  () => tx("Solo salimos cuando el mundo está dormido. Por eso nos sorprendió verte."),
  h => T`Qué reflejos para ser ${h}.`,
  () => tx("Las únicas que seguimos trabajando somos nosotras. Y, por lo visto, tú."),
  h => T`Una luz encendida a ${h}. Ya somos dos.`
];

let luciBichos = [], luciReloj = null, luciAntes = 0, luciUltimaFrase = -1;

/* El icono de la luciérnaga (0.7.133.2): alas, cuerpo y el abdomen encendido,
   que es lo único con color. Lo acompaña al aviso de atraparla y a la cuenta
   de Mi expedición. Los tonos salen de variables —el abdomen es `--luci-luz`
   y su halo, `--luci-halo-ic`, que de día no existe—. */
const LUCI_ICONO =
  '<svg class="luci-svg" viewBox="0 0 32 32" aria-hidden="true">' +
    '<path class="luci-svg-ant" d="M14.6 7.6C13.6 5.4 12 4.3 10.2 4.1M17.4 7.6c1-2.2 2.6-3.3 4.4-3.5"/>' +
    '<ellipse class="luci-svg-ala" cx="10.6" cy="13.4" rx="6.2" ry="3.3" transform="rotate(-32 10.6 13.4)"/>' +
    '<ellipse class="luci-svg-ala" cx="21.4" cy="13.4" rx="6.2" ry="3.3" transform="rotate(32 21.4 13.4)"/>' +
    '<circle class="luci-svg-cuerpo" cx="16" cy="9.3" r="2.3"/>' +
    '<ellipse class="luci-svg-cuerpo" cx="16" cy="14.2" rx="3" ry="3.6"/>' +
    '<ellipse class="luci-svg-luz" cx="16" cy="21.6" rx="4.1" ry="5.6"/>' +
  '</svg>';

/* **A lo mucho 30 segundos en pantalla**, y es regla de Eduardo (0.7.131.1):
   pueden salir en cualquier momento de la noche, pero una vez que salen no se
   quedan todo el rato, y no vuelven esa noche. Con `dura` (5 a 7 s) ya se
   van mucho antes; el tope está para que la regla no dependa de esos números
   el día que alguien los mueva. A los 28 s echan a volar y a los 30 ya no
   están. */
const LUCI_TOPE = 30;

function luciQuieto() {
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
}

/* La hora de verdad, escrita para meterla en una frase. En español lleva su
   artículo, y la 1 es singular: «para ser la 1:05», «para ser las 2:47». En
   inglés va la hora sola, que es como la pide la traducción. */
function luciHora() {
  const d = new Date(), h = d.getHours() % 12 || 12;
  const hhmm = h + ":" + String(d.getMinutes()).padStart(2, "0");
  if (IDIOMA !== IDIOMA_POR_DEFECTO) return hhmm;
  return (h === 1 ? "la " : "las ") + hhmm;
}

/* Se llama al pintar el Resumen, que es muchas veces al día: casi siempre
   sale en la primera línea. */
function quizaLuciernagas() {
  // El píxel que dejó la rara sigue ahí el resto de la noche (Arcade).
  if (typeof arcadeQuizaPixel === "function") arcadeQuizaPixel();
  const h = new Date().getHours();
  if (h >= 4) return;
  state.ui = state.ui || {};
  if (state.ui.luciNoche === todayKey() || luciBichos.length) return;
  // Dentro del ejemplo no: al salir, la marca de «ya salieron» se iría con él.
  if (typeof modoEjemplo !== "undefined" && modoEjemplo) return;
  if (bienvenidaPendiente()) return;
  setTimeout(() => {
    // Se vuelve a mirar al disparar: pudo abrirse una ventana o cambiar de pantalla.
    if (activeMainView !== "summary" || document.hidden) return;
    if (document.documentElement.classList.contains("quieto")) return;
    if (state.ui.luciNoche === todayKey() || luciBichos.length) return;
    if (new Date().getHours() >= 4) return;
    state.ui.luciNoche = todayKey();
    guardarLocal(state);
    soltarLuciernagas();
  }, 900);
}

function soltarLuciernagas() {
  const cap = document.createElement("div");
  cap.className = "enjambre";
  document.body.appendChild(cap);
  const W = innerWidth, H = innerHeight, quieto = luciQuieto();
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "luci";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="bicho"><i class="ala i"></i><i class="ala d"></i><i class="cuerpo"></i><i class="luz"></i></span>';
    cap.appendChild(el);
    const borde = Math.floor(Math.random() * 4);
    let x = borde === 0 ? -20 : borde === 1 ? W + 20 : Math.random() * W;
    let y = borde === 2 ? -20 : borde === 3 ? H + 20 : H * (0.15 + Math.random() * 0.6);
    if (quieto) { x = W * (0.15 + Math.random() * 0.7); y = H * (0.15 + Math.random() * 0.6); }
    const b = { el, x, y, rumbo: Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - 0.5),
      vel: 34 + Math.random() * 18, fase: Math.random() * 6.28, periodo: 1.6 + Math.random() * 1.2,
      espera: i * (0.3 + Math.random() * 0.4), vida: 0, dura: 5 + Math.random() * 2,
      huye: false, atrapada: false, fuera: false };
    /* `pointerdown` y no `click`: vuelan, y entre bajar y levantar el dedo la
       luciérnaga ya se movió de debajo. */
    el.addEventListener("pointerdown", e => { e.preventDefault(); atraparLuciernaga(b); });
    el.style.opacity = 0;
    luciBichos.push(b);
  }
  /* La rara va en lugar de la última: una luciérnaga más no se nota, una
     distinta sí. */
  if (typeof arcadeTocaRara === "function" && arcadeTocaRara()) {
    const b = luciBichos[luciBichos.length - 1];
    b.rara = true;
    b.el.classList.add("rara");
  }
  luciAntes = Date.now();
  // Con setInterval y no con fotogramas, por lo mismo que el candado que se rompe.
  luciReloj = setInterval(pasoLuciernagas, 16);
}

/* El parpadeo: se enciende despacio, se sostiene y se apaga, con pausas. Una
   onda seno pura se ve como un faro. De día nunca se apaga del todo, porque
   sin halo una luz apagada es un bicho invisible. */
function brilloLuciernaga(b, t) {
  const c = ((t + b.fase) % b.periodo) / b.periodo;
  const on = c < 0.55 ? Math.sin(c / 0.55 * Math.PI) : 0;
  const suelo = document.documentElement.classList.contains("claro") ? 0.35 : 0.08;
  if (b.rara) return on > 0.3 ? 1 : suelo;   // la rara, a saltos, como un píxel
  return suelo + (1 - suelo) * Math.pow(on, 0.7);
}

function pasoLuciernagas() {
  /* Dos relojes distintos, y el segundo es el arreglo de 0.7.133.2. `dt` mueve
     el bicho y lleva tope, para que un tirón no lo teletransporte. Pero la
     EDAD (`vida`) va con el reloj de verdad: con el tope también ahí, un
     teléfono que ahorra batería y va a menos cuadros las dejaba el doble o el
     triple de tiempo en pantalla —y el tope de 30 s, con ellas—. Eduardo lo
     vio así: «no deben salir tanto tiempo». */
  const ahora = Date.now(), real = Math.min(1, (ahora - luciAntes) / 1000), dt = Math.min(0.05, real);
  luciAntes = ahora;
  const W = innerWidth, H = innerHeight, quieto = luciQuieto();
  // Si la persona se fue del Resumen, se van todas deprisa.
  const irse = activeMainView !== "summary";
  let vivas = 0;
  luciBichos.forEach(b => {
    if (b.fuera) return;
    vivas++;
    b.vida += real;
    if (b.vida < b.espera) return;
    const t = b.vida - b.espera;
    if (b.atrapada) return;
    const luz = b.el.querySelector(".luz");
    if (quieto) {
      const op = t > b.dura * 0.5 || irse ? Math.max(0, 1 - (t - b.dura * 0.5) / 2) : 1;
      if (op <= 0 || irse || b.vida > LUCI_TOPE) { b.fuera = true; b.el.remove(); return; }
      b.el.style.opacity = op;
      b.el.style.transform = `translate(${b.x}px,${b.y}px)`;
      luz.style.opacity = brilloLuciernaga(b, t).toFixed(2);
      return;
    }
    if (t > b.dura || irse || b.vida > LUCI_TOPE - 2) b.huye = true;
    if (b.huye && b.huyeDesde == null) b.huyeDesde = b.vida;
    /* Una vez que echan a volar, a lo mucho tres segundos de verdad: el vuelo va con `dt`, que lleva tope, y en un teléfono lento
       la salida sola tardaba el triple. */
    if (b.vida > LUCI_TOPE || (b.huyeDesde != null && b.vida - b.huyeDesde > 3)) { b.fuera = true; b.el.remove(); return; }
    b.rumbo += (Math.random() - 0.5) * 2.4 * dt;
    if (!b.huye) {
      const m = 40, adentro = Math.atan2(H / 2 - b.y, W / 2 - b.x);
      if (b.x < m || b.x > W - m || b.y < m || b.y > H - m) {
        let d = adentro - b.rumbo;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        b.rumbo += d * 1.8 * dt;
      }
    }
    const v = b.vel * (b.huye ? (irse ? 6 : 3.2) : 1);
    // La rara vuela como un sprite: solo en ocho direcciones y sin vaivén.
    const rumbo = b.rara ? Math.round(b.rumbo / (Math.PI / 4)) * (Math.PI / 4) : b.rumbo;
    b.x += Math.cos(rumbo) * v * dt;
    b.y += Math.sin(rumbo) * v * dt + (b.rara ? 0 : Math.sin(t * 2.1 + b.fase) * 6 * dt);   // un vaivén suave
    if (b.huye && (b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40)) { b.fuera = true; b.el.remove(); return; }
    const giro = Math.cos(b.rumbo) < 0 ? -1 : 1;
    b.el.style.opacity = 1;
    b.el.style.transform = `translate(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px) scaleX(${giro})`;
    luz.style.opacity = brilloLuciernaga(b, t).toFixed(2);
  });
  if (!vivas) {
    clearInterval(luciReloj);
    luciReloj = null;
    luciBichos = [];
    const cap = document.querySelector(".enjambre");
    // Deja acabar las chispas y la desbandada, que dura hasta 1,15 s.
    if (cap) setTimeout(() => cap.remove(), 1500);
  }
}

function atraparLuciernaga(b) {
  if (b.atrapada || b.fuera) return;
  /* **Una sola por noche** (Eduardo, 0.7.133.2): atrapada una, ya no se deja
     ninguna más. */
  if (luciBichos.some(o => o.atrapada)) return;
  b.atrapada = true;
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (x) {} }
  // Unas chispas donde la tocaste: es lo que dice «la tienes».
  if (!luciQuieto()) {
    const cap = b.el.parentNode;
    for (let i = 0; i < 7; i++) {
      const c = document.createElement("i");
      c.className = "chispa";
      c.style.left = b.x - 2 + "px"; c.style.top = b.y - 2 + "px";
      cap.appendChild(c);
      const a = Math.random() * 6.28, d = 14 + Math.random() * 18;
      c.animate([{ transform: "translate(0,0)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`, opacity: 0 }],
        { duration: 500 + Math.random() * 300, easing: "ease-out", fill: "forwards" });
      setTimeout(() => c.remove(), 900);
    }
  }
  desbandadaLuciernagas(b);

  /* La frase, un poco DESPUÉS: la ventana trae su velo, y saliendo al mismo
     tiempo tapaba justo la desbandada. */
  const frase = () => {
    // La rara no suma a la cuenta: da la pista de Arcade (js/10k-arcade.js).
    if (b.rara && typeof arcadeRaraAtrapada === "function") { arcadeRaraAtrapada(); return; }
    let i;
    do { i = Math.floor(Math.random() * LUCI_FRASES.length); } while (i === luciUltimaFrase);
    luciUltimaFrase = i;
    fraseDeLuciernaga(LUCI_FRASES[i](luciHora()), tx("¡Atrapaste una luciérnaga!"));
  };
  if (!b.rara) {
    state.settings = state.settings || {};
    state.settings.luciernagas = (Number(state.settings.luciernagas) || 0) + 1;
    save();
  }
  setTimeout(frase, luciQuieto() ? 0 : 650);
}

/* ---- La desbandada (0.7.133.3) ----
   Eduardo: al atrapar una, que TODAS salgan volando fuera de la pantalla, la
   atrapada y la rara incluidas. Cada una se aleja del punto donde tocaste,
   cada vez más deprisa; la atrapada, un respiro después y hacia arriba, que es
   por donde se va algo que se suelta.

   Va con animaciones del navegador y no con el reloj de `pasoLuciernagas`: ese
   lleva tope por paso y en un teléfono lento la huida salía a cámara lenta.
   Cada una se marca `fuera` para que el reloj deje de moverla, y se quita del
   documento al llegar.

   La rara vuela como lo que es: en ocho direcciones y a saltos. Con «menos
   movimiento», se desvanecen donde están. */
function desbandadaLuciernagas(atrapada) {
  const W = innerWidth, H = innerHeight, lejos = Math.hypot(W, H) + 80;
  const quieto = luciQuieto();
  luciBichos.forEach(o => {
    if (o.fuera) return;
    o.fuera = true;
    o.el.style.pointerEvents = "none";
    // Las que aún no habían entrado, ni se asoman.
    if (o.vida < o.espera || !o.el.animate) { o.el.remove(); return; }
    if (quieto) {
      o.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).onfinish = () => o.el.remove();
      return;
    }
    let ang = o === atrapada
      ? -Math.PI / 2 + (Math.random() - 0.5) * 0.9
      : Math.atan2(o.y - atrapada.y, o.x - atrapada.x) + (Math.random() - 0.5) * 0.5;
    if (o.rara) ang = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
    const giro = Math.cos(ang) < 0 ? -1 : 1;
    const x1 = o.x + Math.cos(ang) * lejos, y1 = o.y + Math.sin(ang) * lejos;
    // Encendidas al huir: el susto las prende.
    const luz = o.el.querySelector(".luz");
    if (luz) luz.style.opacity = 1;
    if (o === atrapada && luz) {
      luz.animate([{ transform: "scale(1)" }, { transform: "scale(2.2)", offset: 0.35 }, { transform: "scale(1)" }],
        { duration: 320, easing: "ease-out" });
    }
    const vuelo = o.el.animate([
      { transform: `translate(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px) scaleX(${giro})` },
      { transform: `translate(${x1.toFixed(1)}px,${y1.toFixed(1)}px) scaleX(${giro})` }
    ], {
      duration: o === atrapada ? 950 : 700 + Math.random() * 250,
      delay: o === atrapada ? 200 : Math.random() * 90,
      // Arranca despacio y acelera: así se va algo que se asusta.
      easing: o.rara ? "steps(9, end)" : "cubic-bezier(0.5, 0, 0.9, 0.4)",
      fill: "forwards"
    });
    vuelo.onfinish = () => o.el.remove();
  });
}

/* La ventana de la frase. No es `askBase`: Eduardo la pidió con una X y una
   barra de tiempo, y el cuadro de siempre tiene botones y no se va solo. Del
   de siempre sí se lleva el VELO (`.modal-backdrop`), para que se lea como las
   demás ventanas de la app. Está en `CAPAS_QUE_TAPAN`, así que la página de
   detrás se queda quieta mientras tanto. */
/* El rótulo dice lo que acaba de pasar —«¡Atrapaste una luciérnaga!»— y no
   lleva la cuenta: Eduardo lo pidió así (0.7.133.2). La cuenta sigue en Mi
   expedición, que es donde se mira con calma. La rara trae el suyo. */
function fraseDeLuciernaga(texto, rotulo, rara) {
  const vieja = document.getElementById("luci-frase");
  if (vieja) vieja.remove();
  const dura = 6000 + texto.length * 70;
  const v = document.createElement("div");
  v.id = "luci-frase";
  v.className = "modal-backdrop";
  v.innerHTML =
    '<div class="luci-card' + (rara ? " rara" : "") + '" role="dialog" aria-live="polite">' +
      '<button type="button" class="luci-x" aria-label="' + escapeAttr(tx("Cerrar")) + '">' + icon("close", 16) + '</button>' +
      '<span class="luci-ic" aria-hidden="true">' + (rara ? "<i></i>" : LUCI_ICONO) + '</span>' +
      '<span class="luci-num">' + escapeHtml(rotulo) + '</span>' +
      '<span class="luci-tx">' + escapeHtml(texto) + '</span>' +
      '<span class="luci-resta" aria-hidden="true"><i></i></span>' +
    '</div>';
  document.body.appendChild(v);
  void v.offsetWidth;
  v.classList.add("show");
  let hecho = false, reloj = null;
  const irse = () => {
    if (hecho) return;
    hecho = true;
    clearInterval(reloj);
    v.classList.remove("show");
    setTimeout(() => v.remove(), 300);
  };
  v.querySelector(".luci-x").addEventListener("click", irse);
  v.addEventListener("click", e => { if (e.target === v) irse(); });
  const inicio = Date.now(), tira = v.querySelector(".luci-resta i");
  reloj = setInterval(() => {
    const q = Math.max(0, 1 - (Date.now() - inicio) / dura);
    tira.style.transform = "scaleX(" + q.toFixed(4) + ")";
    if (q === 0) irse();
  }, 50);
}

/* El renglón de Mi expedición. No sale hasta la primera: un «0 luciérnagas»
   le contaría el secreto a quien todavía no lo ha encontrado. */
function luciernagasHTML() {
  const n = Number(state.settings && state.settings.luciernagas) || 0;
  if (!n) return "";
  return '<div class="exp-luci"><span class="exp-luci-ic" aria-hidden="true">' + LUCI_ICONO + '</span>' +
    escapeHtml(n === 1 ? tx("1 luciérnaga atrapada") : T`${n} luciérnagas atrapadas`) + '</div>';
}
