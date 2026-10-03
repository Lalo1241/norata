/* La barrera de subidas: el puente entre el Puesto de mando y GitHub */

/* ================= Por qué esto no puede vivir en la app =================
   Aprobar una subida es pedirle a GitHub que corra un trabajo
   (`.github/workflows/barrera.yml`), y eso exige una llave de GitHub. Cualquier
   llave que llegue al navegador es pública, así que la llave vive aquí y el
   panel solo dice qué quiere: esta función comprueba QUIÉN lo pide antes de
   tocar nada.

   Tampoco puede leer GitHub el navegador por su cuenta: la CSP de la app solo
   deja hablar con Supabase (`connect-src` en `index.html`), y está bien que
   sea así.

   Cuatro cosas hace, y nada más:

     estado   qué hay en la cola (lo que `main` tiene y `vivo` no), cómo está
              el grifo, qué hay publicado y cómo fueron las últimas subidas
     subir    aprueba: dispara el trabajo hasta el commit que se diga
     grifo    lo abre o lo cierra; al abrirlo, sube lo que estuviera esperando
     regresar el cierre de emergencia: cierra el grifo y vuelve a publicar una
              versión anterior con un número nuevo (`regreso.yml`)
     aprobar  aprueba el ANUNCIO de una novedad (0.7.183): dispara
              `novedades-aprobar.yml`, que la publica y la lleva al vivo si
              nada espera delante

   ---- Cómo se pone en marcha ----

     supabase secrets set GITHUB_BARRERA=github_pat_xxxxxxxx
     supabase functions deploy barrera

   La llave es un token de GitHub «fine-grained», SOLO para el repositorio de
   Norata, con: Actions (leer y escribir), Contents (leer), Pages (leer) y
   Metadata (leer). No necesita más, y con eso no puede subir código.

   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las pone Supabase sola. Requiere
   `supabase/barrera.sql` y `administracion.sql` ya corridos.

   Mientras no se despliegue, el panel llama a una dirección que no existe y
   dice que la barrera no está conectada. No se rompe nada. */

const GH = "https://api.github.com";
const REPO = "Lalo1241/norata";
const TRABAJO = "barrera.yml";
const REGRESO = "regreso.yml";
const APROBAR = "novedades-aprobar.yml";

/* De dónde se acepta la llamada. La app de Android sirve sus archivos desde
   `https://localhost`. */
const PERMITIDOS = [
  "https://mi.norata.app",
  "https://localhost",
  "http://localhost:8123",
];

function cabecerasCORS(origen: string | null) {
  const ok = origen && PERMITIDOS.includes(origen) ? origen : PERMITIDOS[0];
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function responder(cuerpo: unknown, estado: number, origen: string | null) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json", ...cabecerasCORS(origen) },
  });
}

async function gh(ruta: string, llave: string, opciones?: RequestInit) {
  return await fetch(GH + ruta, {
    ...(opciones || {}),
    headers: {
      "Authorization": "Bearer " + llave,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "norata-barrera",
      ...((opciones && opciones.headers) || {}),
    },
  });
}

/* El primer renglón de un commit: «0.7.172: lo que sea». La versión, si la
   trae, va aparte para que el panel la pinte como etiqueta. */
function partir(mensaje: string) {
  const primero = String(mensaje || "").split("\n")[0].trim();
  const m = /^(\d+\.\d+\.\d+(?:\.\d+)?)\s*:\s*(.*)$/.exec(primero);
  return m ? { version: m[1], titulo: m[2] } : { version: "", titulo: primero };
}

async function disparar(llave: string, hasta: string, sqlPegado: boolean) {
  const r = await gh(`/repos/${REPO}/actions/workflows/${TRABAJO}/dispatches`, llave, {
    method: "POST",
    body: JSON.stringify({ ref: "main", inputs: { hasta, sql_pegado: sqlPegado ? "true" : "false" } }),
  });
  if (!r.ok) throw new Error("GitHub no aceptó la subida (" + r.status + "): " + (await r.text()).slice(0, 200));
}

Deno.serve(async (req: Request) => {
  const origen = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cabecerasCORS(origen) });
  if (req.method !== "POST") return responder({ error: "Solo POST." }, 405, origen);

  const SB = Deno.env.get("SUPABASE_URL");
  const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  /* Los nombres de los secretos distinguen mayúsculas, y el panel de Supabase
     no las corrige: la primera vez se guardó como `GITHUB_Barrera` y la
     función decía que faltaba la llave. Se aceptan las dos. */
  const LLAVE = Deno.env.get("GITHUB_BARRERA") || Deno.env.get("GITHUB_Barrera");
  if (!SB || !SERVICIO) return responder({ error: "Falta configuración del servidor." }, 500, origen);

  /* Quién pregunta. Se le pasa SU sesión a `soy_admin()`, que es quien decide:
     aquí no se compara ningún correo ni se guarda ninguna lista. */
  const auth = req.headers.get("Authorization") || "";
  const rpc = (nombre: string, cuerpo: unknown) => fetch(SB + "/rest/v1/rpc/" + nombre, {
    method: "POST",
    headers: { "Authorization": auth, "apikey": SERVICIO, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo || {}),
  });
  const adm = await rpc("soy_admin", {});
  if (!adm.ok || (await adm.json()) !== true) return responder({ error: "Sin permiso." }, 403, origen);

  if (!LLAVE) return responder({ error: "Falta la llave de GitHub en el servidor.", falta: "llave" }, 503, origen);

  let cuerpo: Record<string, unknown> = {};
  try { cuerpo = await req.json(); } catch (_e) { /* sin cuerpo: se pide el estado */ }
  const accion = String(cuerpo.accion || "estado");

  try {
    if (accion === "subir") {
      const hasta = String(cuerpo.hasta || "");
      if (hasta && !/^[0-9a-f]{7,40}$/.test(hasta)) return responder({ error: "Ese commit no es válido." }, 400, origen);
      await disparar(LLAVE, hasta, cuerpo.sql_pegado === true);
      return responder({ ok: true }, 200, origen);
    }

    if (accion === "aprobar") {
      /* La llave de una ficha es su `id` o su versión: letras, números, puntos
         y guiones. Cualquier otra cosa no se le pasa a GitHub. */
      /* Una (`llave`) o varias (`llaves`, «Aprobar todas»): viajan juntas,
         separadas por comas, a una sola corrida del trabajo. */
      const varias = Array.isArray(cuerpo.llaves) ? cuerpo.llaves.map(String) : [String(cuerpo.llave || "")];
      if (!varias.length || varias.length > 40 || varias.some((k) => !/^[A-Za-z0-9._-]{1,60}$/.test(k))) return responder({ error: "Esa novedad no es válida." }, 400, origen);
      const llave = varias.join(",");
      const r = await gh(`/repos/${REPO}/actions/workflows/${APROBAR}/dispatches`, LLAVE, {
        method: "POST",
        body: JSON.stringify({ ref: "main", inputs: { llave } }),
      });
      if (!r.ok) throw new Error("GitHub no aceptó la aprobación (" + r.status + "): " + (await r.text()).slice(0, 200));
      return responder({ ok: true }, 200, origen);
    }

    if (accion === "regresar") {
      const a = String(cuerpo.a || "");
      if (!/^\d+(\.\d+){2,3}$/.test(a)) return responder({ error: "Esa versión no es válida." }, 400, origen);
      /* Primero el grifo: con él abierto, lo malo que sigue en `main` volvería
         a salir solo en la próxima subida, y el regreso no duraría nada.
         Un ENSAYO no publica nada, así que tampoco cierra: la primera vez lo
         cerraba igual, y Eduardo se encontró el grifo cerrado por probar. */
      const ensayo = cuerpo.ensayo === true;
      if (!ensayo) {
        const g = await rpc("barrera_grifo", { p_abierto: false });
        if (!g.ok) return responder({ error: "No pude cerrar el grifo: el regreso no se hizo.", falta: "sql" }, 503, origen);
      }
      const r = await gh(`/repos/${REPO}/actions/workflows/${REGRESO}/dispatches`, LLAVE, {
        method: "POST",
        body: JSON.stringify({ ref: "main", inputs: { a, ensayo: ensayo ? "true" : "false" } }),
      });
      if (!r.ok) return responder({ error: (ensayo ? "GitHub no aceptó el ensayo (" : "El grifo quedó cerrado, pero GitHub no aceptó el regreso (") + r.status + ")." }, 502, origen);
      return responder({ ok: true }, 200, origen);
    }

    if (accion === "grifo") {
      const abierto = cuerpo.abierto === true;
      const g = await rpc("barrera_grifo", { p_abierto: abierto });
      if (!g.ok) return responder({ error: "No pude mover el grifo: falta pegar el SQL de la barrera.", falta: "sql" }, 503, origen);
      /* Abrirlo es decir «que suba todo»: lo que esperaba en la cola sube ya,
         sin esperar a la próxima subida a `main`. Lo que traiga SQL se queda:
         eso se sube a propósito, diciendo que ya está pegado. */
      if (abierto) await disparar(LLAVE, "", false);
      return responder({ ok: true, ...(await g.json()) }, 200, origen);
    }

    /* ---- estado ---- */
    const [grifoR, comparaR, vivoR, corridasR, paginaR, regresosR, paquetesR] = await Promise.all([
      rpc("barrera_estado", {}),
      gh(`/repos/${REPO}/compare/vivo...main`, LLAVE),
      gh(`/repos/${REPO}/commits/vivo`, LLAVE),
      gh(`/repos/${REPO}/actions/workflows/${TRABAJO}/runs?per_page=8`, LLAVE),
      gh(`/repos/${REPO}/pages`, LLAVE),
      gh(`/repos/${REPO}/actions/workflows/${REGRESO}/runs?per_page=4`, LLAVE),
      gh(`/repos/${REPO}/releases?per_page=20`, LLAVE),
    ]);

    const grifo = grifoR.ok ? await grifoR.json() : null;

    let vivo = null;
    if (vivoR.ok) {
      const v = await vivoR.json();
      vivo = { sha: v.sha, fecha: v.commit?.committer?.date || "", ...partir(v.commit?.message || "") };
    }

    /* La cola, de la más vieja a la más nueva: es el orden en que se aprueba.
       De cada cambio se mira si toca un `.sql`, que es lo que lo detiene. */
    let cola: unknown[] = [];
    if (comparaR.ok) {
      const c = await comparaR.json();
      const commits = (c.commits || []).slice(-30);
      cola = await Promise.all(commits.map(async (k: Record<string, any>) => {
        let sql: string[] = [], archivos = 0;
        const d = await gh(`/repos/${REPO}/commits/${k.sha}`, LLAVE);
        if (d.ok) {
          const dj = await d.json();
          const fs = (dj.files || []).map((f: Record<string, string>) => String(f.filename));
          archivos = fs.length;
          sql = fs.filter((f: string) => f.startsWith("supabase/") && f.endsWith(".sql"));
        }
        return { sha: k.sha, fecha: k.commit?.committer?.date || "", archivos, sql, ...partir(k.commit?.message || "") };
      }));
    }

    /* Las corridas de la barrera y las de los regresos, juntas y por fecha. */
    let corridas: Record<string, any>[] = [];
    for (const [resp, clase] of [[corridasR, "barrera"], [regresosR, "regreso"]] as [Response, string][]) {
      if (!resp.ok) continue;
      const c = await resp.json();
      corridas = corridas.concat((c.workflow_runs || []).map((w: Record<string, any>) => ({
        id: w.id, estado: w.status, resultado: w.conclusion, evento: w.event, clase,
        titulo: w.display_title, creado: w.created_at, url: w.html_url,
      })));
    }
    corridas.sort((x, y) => String(y.creado).localeCompare(String(x.creado)));

    /* Lo que estuvo en vivo: cada vez que algo llega a `vivo` sale un paquete
       de Android (`app-<versión>`), así que la lista de paquetes ES el
       historial de lo publicado, con su fecha. Se guardan los últimos quince. */
    let historial: unknown[] = [];
    if (paquetesR.ok) {
      historial = ((await paquetesR.json()) || [])
        .filter((r: Record<string, any>) => String(r.tag_name || "").startsWith("app-") && !r.draft)
        .map((r: Record<string, any>) => ({ version: String(r.tag_name).slice(4), fecha: r.published_at || r.created_at }))
        .sort((x: Record<string, string>, y: Record<string, string>) => String(y.fecha).localeCompare(String(x.fecha)));
    }

    /* Desde qué rama se publica el sitio. Mientras no sea `vivo`, la barrera
       existe pero no frena nada: subir a `main` sigue siendo publicar. */
    let pagina = "";
    if (paginaR.ok) pagina = String((await paginaR.json()).source?.branch || "");

    return responder({ grifo, vivo, sinVivo: !vivoR.ok, cola, corridas: corridas.slice(0, 8), historial, pagina }, 200, origen);
  } catch (e) {
    return responder({ error: (e as Error).message || String(e) }, 502, origen);
  }
});
