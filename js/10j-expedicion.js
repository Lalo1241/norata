/* ================= El nivel de expedición =================
   Un solo número que dice cuánto llevas recorrido en Norata. Hasta ahora la
   app solo tenía niveles POR HABILIDAD —del 0 al 10, y bajan si la dejas—, y
   nadie sumaba el total: no existía una cifra que hablara de TI. Sin ella no
   hay de dónde colgar un desbloqueo, porque un ambiente que se gana necesita
   saber cuándo se ganó.

   El nombre ya estaba puesto sin darnos cuenta: la pantalla de bienvenida
   dice «Tu expedición empieza aquí».

   ---- LA DECISIÓN QUE SOSTIENE TODO LO DEMÁS ----
   Los puntos NO SE GUARDAN: SE CUENTAN. Cada vez, leyendo lo que ya está en
   tus datos. No es un capricho técnico — es la regla que ya rige la sincronía
   y que está escrita en `js/10-fusion.js`: «El XP no se suma a mano: se
   recalcula contando los movimientos. Así una fusión no puede inflarlo aunque
   se repita mil veces.»

   Un contador guardado se rompe justo ahí: dos aparatos que suman 100 cada
   uno se juntan y se quedan con 100. Contando, no hay nada que fusionar
   porque los movimientos ya se fusionan solos.

   Tres cosas salen gratis por decidirlo así:
     · Es RETROACTIVO. El día que esto se publique tu cuenta ya tiene su
       nivel, sacado de meses de datos que ya existen. Nadie empieza en cero
       por haber llegado antes.
     · La sincronía no lo puede inflar ni perder.
     · Nunca se desalinea, porque no hay un número guardado que pueda
       contradecir a los datos.

   El único borde: borrar historial a mano baja los puntos. Se tapa con un
   piso —el nivel más alto que hayas tenido, guardado aparte—, que es un
   MÁXIMO y un máximo sí se fusiona sin problema: gana el mayor de los dos
   lados. Está abajo, en `pisoDeExpedicion`. */

/* Lo que vale cada cosa. Todo lo que la app ya celebra, y nada más: un punto
   se paga por lo que cuesta conseguir algo, no por lo que cuesta hacerle
   clic. */
const EXP_PUNTOS = {
  semanaPrimerosDos: 40,   // los dos primeros días de cada semana
  semanaDiaExtra: 5,       // cada día más de esa misma semana
  mision: 2,               // hasta EXP_MISIONES_DIA al día
  etapa: 5,                // de un talento o de un encargo
  hito: 20,                // los mini-talentos, que se cierran en sí mismos
  hitoRacha: 25,           // 3, 7, 14, 30… los que la app ya festeja
  habilidadNivel: 30,      // por cada nivel que una habilidad haya alcanzado
  talento: 50,             // meta cumplida o compra asegurada
  encargo: 50,             // con todas sus etapas cerradas
  estreno: 15              // la primera habilidad, misión, talento y encargo
};
const EXP_MISIONES_DIA = 5;

/* ---- Por qué la semana se parte en dos ----
   Con un valor fijo por día, quien entra dos veces por semana tardaba 4,4
   años en llegar al último rango y quien entra cinco tardaba 1,7: el sistema
   medía FRECUENCIA, no constancia. Pagando fuerte las dos primeras veces de
   cada semana esa distancia se cierra a 2,3 contra 1,3 sin regalarle nada a
   nadie — y de paso deja de tener sentido abrir la app diez segundos para no
   perder el punto del día. */

/* ---- La curva ----
   Sin tope: la cuenta no se acaba nunca. Los tres primeros niveles van en
   rampa aparte para que la primera tarde tenga premio; del cuarto en adelante
   cada nivel cuesta 30 más que el anterior. Es una RECTA y no una explosión:
   con la curva de las habilidades (×1,5 por nivel) el nivel 40 pediría cuatro
   millones de puntos y dejaría de ser alcanzable. */
const EXP_RAMPA = [15, 35, 60];

function costeDeNivel(n) {
  if (n <= 0) return 0;
  if (n <= EXP_RAMPA.length) return EXP_RAMPA[n - 1];
  return 30 * n + 15;
}

/* Cuánto cuesta llegar hasta el nivel n, acumulado. */
function totalHastaNivel(n) {
  let t = 0;
  for (let i = 1; i <= n; i++) t += costeDeNivel(i);
  return t;
}

/* De puntos a nivel. Devuelve también lo que falta, que es la mitad de lo que
   se enseña: un número sin «cuánto falta» no mueve a nadie. */
function nivelDeExpedicion(puntos) {
  let nivel = 0, base = 0, guard = 2000;
  while (guard-- > 0) {
    const coste = costeDeNivel(nivel + 1);
    if (puntos - base < coste) return {
      nivel: nivel,
      dentro: puntos - base,
      pide: coste,
      pct: coste ? (puntos - base) / coste : 0,
      falta: coste - (puntos - base),
      puntos: puntos
    };
    base += coste;
    nivel++;
  }
  return { nivel: nivel, dentro: 0, pide: 1, pct: 1, falta: 0, puntos: puntos };
}

/* ---- La cuenta ----
   Se lee lo que ya está en `state`. Ningún dato nuevo, ningún campo nuevo. */
function puntosDeExpedicion() {
  let total = 0;
  const parte = {};
  const suma = (k, n) => { if (!n) return; parte[k] = (parte[k] || 0) + n; total += n; };

  /* Los días, agrupados por semana. `activityDayCounts` ya sabe qué días
     tuvieron actividad de verdad —práctica registrada, movimientos en
     talentos y misiones marcadas— y ya descuenta el decaimiento, que no es
     algo que hiciste. */
  const dias = (typeof activityDayCounts === "function")
    ? [...activityDayCounts().keys()] : [];
  const semanas = new Map();
  for (const d of dias) {
    const s = semanaDeClave(d);
    semanas.set(s, (semanas.get(s) || 0) + 1);
  }
  for (const [, n] of semanas) {
    suma("dias", Math.min(n, 2) * EXP_PUNTOS.semanaPrimerosDos);
    if (n > 2) suma("dias", (n - 2) * EXP_PUNTOS.semanaDiaExtra);
  }

  /* Misiones cumplidas, con tope diario: doce misiones en un día no valen
     seis veces más que dos. El tope es por DÍA y no por misión. */
  const porDia = new Map();
  for (const m of (state.missions || [])) {
    for (const k of Object.keys(m.log || {})) {
      if (typeof missionDone === "function" ? missionDone(m, k) : false)
        porDia.set(k, (porDia.get(k) || 0) + 1);
    }
  }
  for (const [, n] of porDia) suma("misiones", Math.min(n, EXP_MISIONES_DIA) * EXP_PUNTOS.mision);

  /* Talentos: etapas hechas, hitos conseguidos y talentos logrados. Un hito
     es un mini-talento —se cierra en sí mismo— y por eso vale distinto que
     una meta, que se persigue. */
  let etapas = 0;
  for (const p of (state.perks || [])) {
    for (const s of (p.steps || [])) if (s && s.done) etapas++;
    if (p.status === "completed") {
      const t = (typeof tipoDe === "function") ? tipoDe(p) : (p.tipo || "meta");
      suma(t === "hito" ? "hitos" : "talentos",
           t === "hito" ? EXP_PUNTOS.hito : EXP_PUNTOS.talento);
    }
  }

  /* Encargos: sus etapas cuentan igual que las de un talento, y terminarlo
     paga como un talento logrado. */
  let encargos = 0;
  for (const pr of (state.projects || [])) {
    for (const s of (pr.steps || [])) if (s && s.done) etapas++;
    if (pr.status === "done") encargos++;
  }
  suma("etapas", etapas * EXP_PUNTOS.etapa);
  suma("encargos", encargos * EXP_PUNTOS.encargo);

  /* Habilidades: cuenta el nivel MÁS ALTO que cada una llegó a tener, no el
     de hoy. El decaimiento no te quita el punto — lo aprendido pasó, aunque
     ahora esté oxidado. Se reconstruye recorriendo el historial de XP: como
     se guarda del más nuevo al más viejo, se recorre al revés. */
  let niveles = 0;
  for (const s of (state.skills || [])) {
    const mov = (s.log || []).slice().reverse();
    let acum = 0, tope = 0;
    for (const e of mov) { acum += (e.xp || 0); if (acum > tope) tope = acum; }
    if (acum > tope) tope = acum;
    const alto = (typeof levelInfo === "function") ? levelInfo(tope).level : 0;
    niveles += Math.max(0, alto);
  }
  suma("habilidades", niveles * EXP_PUNTOS.habilidadNivel);

  /* Hitos de racha: los que la app ya festeja, y solo hasta donde llegó tu
     mejor racha. Se cuentan de la MEJOR y no de la actual: perder una racha
     ya duele bastante sin que además te quite puntos. */
  if (typeof streakInfo === "function" && typeof HITOS_RACHA !== "undefined") {
    const mejor = (streakInfo() || {}).best || 0;
    const cuantos = HITOS_RACHA.filter(h => h <= mejor).length;
    suma("racha", cuantos * EXP_PUNTOS.hitoRacha);
  }

  /* Estrenos. Sin ellos, el primer día de alguien de uso ligero da 14 puntos
     y se queda en nivel 0 — y el primer premio tiene que llegar el primer día
     o no hay segundo. */
  let estrenos = 0;
  if ((state.skills || []).length) estrenos++;
  if ((state.missions || []).length) estrenos++;
  if ((state.perks || []).length) estrenos++;
  if ((state.projects || []).length) estrenos++;
  suma("estrenos", estrenos * EXP_PUNTOS.estreno);

  return { total: total, parte: parte };
}

/* La semana de una clave `AAAA-MM-DD`, contada en semanas desde la época. Da
   igual dónde caiga el corte mientras sea SIEMPRE el mismo: lo que se mide es
   «cuántos días distintos de esa semana», no qué día de la semana fue. */
function semanaDeClave(k) {
  const p = String(k).split("-");
  const t = Date.UTC(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  return Math.floor(t / 864e5 / 7);
}

/* ---- El piso ----
   Lo único que se guarda, y es un MÁXIMO: el nivel más alto que hayas tenido.
   Existe por un solo borde —borrar historial a mano baja los puntos— y se
   guarda como máximo justamente para que la sincronía lo pueda fusionar sin
   pensar: gana el mayor de los dos lados, siempre, sin importar el orden. */
const EXP_PISO_LLAVE = "norata-expedicion-piso";

function pisoDeExpedicion() {
  try { return parseInt(localStorage.getItem(EXP_PISO_LLAVE), 10) || 0; } catch (e) { return 0; }
}
function guardarPiso(n) {
  try { if (n > pisoDeExpedicion()) localStorage.setItem(EXP_PISO_LLAVE, String(n)); } catch (e) {}
}

/* La cifra que usa el resto de la app. Devuelve el nivel de verdad y, aparte,
   el que vale para desbloquear —que es el más alto de los dos—. */
function expedicion() {
  const p = puntosDeExpedicion();
  const info = nivelDeExpedicion(p.total);
  guardarPiso(info.nivel);
  const piso = pisoDeExpedicion();
  info.alcanzado = Math.max(info.nivel, piso);
  info.parte = p.parte;
  info.rango = rangoDe(info.alcanzado);
  info.siguiente = siguienteDesbloqueo(info.alcanzado);
  return info;
}

/* ---- Los rangos ----
   Cinco, no diez, y no son una colección para presumir: son la CARA y el
   NOMBRE del nivel. «Nivel 12» no se recuerda; «Refugio» sí. Un rango que
   cambia cada dos niveles es ruido; uno que dura medio año es algo que
   recuerdas haber sido.

   Cada uno trae su ambiente, y el emparejamiento no es decorativo: un refugio
   está hecho de barro, en una cima hay escarcha, y el norte es la estrella que
   se ve en el cielo violeta de Duna.

   Y NINGUNO LLEVA CANDADO, que es la única regla nueva: un rango es la cara
   del nivel y el nivel sube para todos. Ponerle candado sería topar el número
   por la puerta de atrás. Lo que pide Pro son los ambientes. */
const RANGOS = [
  { nivel: 1,  nombre: "Semilla", ambiente: "tinta" },
  { nivel: 3,  nombre: "Brote",   ambiente: "musgo" },
  { nivel: 7,  nombre: "Refugio", ambiente: "adobe" },
  { nivel: 12, nombre: "Cima",    ambiente: "escarcha" },
  { nivel: 20, nombre: "Norte",   ambiente: "duna" }
];

function rangoDe(nivel) {
  let r = null;
  for (const x of RANGOS) if (nivel >= x.nivel) r = x;
  return r;
}

/* Lo que viene, escrito ANTES de llegar. Un premio sorpresa no mueve a nadie;
   uno que se ve venir, sí. */
function siguienteDesbloqueo(nivel) {
  const pasos = [];
  for (const r of RANGOS) pasos.push({ nivel: r.nivel, que: "Rango " + r.nombre, tipo: "rango" });
  if (typeof AMBIENTES !== "undefined") {
    for (const a of AMBIENTES) {
      if (!a.abre) continue;
      pasos.push({ nivel: a.abre, que: a.nombre, tipo: "ambiente", pro: !!a.pro });
    }
  }
  pasos.sort((x, y) => x.nivel - y.nivel);
  return pasos.filter(p => p.nivel > nivel)[0] || null;
}
