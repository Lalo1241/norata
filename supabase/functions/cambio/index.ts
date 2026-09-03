/* El tipo de cambio del dia, y la unica pieza de la app que multiplica dinero */

/* ================= Que es esto y por que existe =================
   Cuando alguien cambia de moneda en Ajustes, Norata reescribe los importes
   que esa persona escribio a mano: lo que costo cada talento y lo que lleva
   invertido. Ese numero se queda guardado y ya no hay de donde recalcularlo,
   asi que un tipo de cambio malo no es un error que se ve un rato — es un
   error permanente en el diario de alguien.

   Hasta aqui el cambio era una tabla escrita en `js/01-base.js` que solo
   cambiaba si alguien se acordaba de subirla al publicar. La primera version
   de esa tabla decia que el dolar estaba a 18,50 y el euro a 21,80, y los dos
   proveedores consultados daban 17,0 y 19,7: un 9% y un 11% metido para
   siempre en los importes de quien convirtiera. Ese "si alguien se acuerda"
   es lo que esta funcion quita de en medio.

   ---- Cinco decisiones que conviene no deshacer ----

   1. **Se llama SOLO al abrir el selector de moneda**, nunca al arrancar la
      app. Norata abre de su propia copia sin tocar la red (ver CLAUDE.md,
      "Como llega la app"), y meter una peticion en el arranque por un ajuste
      que se toca una vez en la vida seria pagar el precio todos los dias por
      algo que pasa una.

   2. **Se despliega con `--no-verify-jwt`.** Norata se puede usar sin cuenta,
      y quien la usa asi tiene el mismo derecho a cambiar de moneda. Lo que
      devuelve son tres numeros publicos que no dicen nada de nadie.

   3. **Los numeros se VALIDAN antes de guardarlos.** Es la regla mas
      importante de este archivo: lo que salga de aqui va a multiplicar el
      dinero guardado de la gente. Un proveedor que un dia devuelva `null`,
      una cadena, un cero o un numero absurdo no puede llegar a la app. Ante
      cualquier duda se sirve lo ultimo bueno que haya guardado.

   4. **Se guarda lo ultimo bueno en una tabla.** No es por ahorrar llamadas
      —el proveedor es gratis y esto se usa poquisimo— sino para tener que
      servir el dia que el proveedor se caiga o cambie de formato. Un cambio
      de ayer es util; no tener cambio obliga a la app a caer a su tabla del
      codigo, que puede ser de hace meses.

   5. **La app tiene que funcionar sin esto.** Mientras no se despliegue, la
      llamada falla, `traerCambioDelServidor` devuelve null y la pantalla usa
      la tabla del codigo diciendo que es una referencia. No se rompe nada.

   ---- Como se pone en marcha ----

     (primero, el paso 1 de `supabase/tipos-de-cambio.sql`)
     supabase functions deploy cambio --no-verify-jwt

   No lleva ningun secreto: los dos proveedores son gratuitos y sin llave.
   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las pone Supabase sola. */

/* Los dos proveedores, en orden. Ninguno pide llave y los dos devuelven la
   misma forma —`rates` con cuantas unidades de cada moneda vale UN peso—, asi
   que el segundo entra sin caso especial cuando el primero no contesta.

   Comprobados el 3 de septiembre de 2026 y coincidian dentro del 0,4%, que es
   la mejor senal de que ninguno de los dos esta diciendo una tonteria. */
const PROVEEDORES = [
  { url: "https://open.er-api.com/v6/latest/MXN", nombre: "exchangerate-api.com" },
  { url: "https://api.frankfurter.dev/v1/latest?base=MXN&symbols=USD,EUR", nombre: "frankfurter.dev (BCE)" },
];

/* Las monedas que la app sabe escribir. Si algun dia entra una cuarta se
   anade aqui y en `MONEDAS` de `js/01-base.js`, y nada mas. */
const MONEDAS = ["USD", "EUR"];

/* Doce horas. El cambio se mueve durante el dia, pero no lo bastante como
   para que importe en un importe de tres cifras que ademas se puede corregir
   a mano; y pedirlo mas seguido solo carga a un servicio que nos lo regala. */
const FRESCO_MS = 12 * 60 * 60 * 1000;

/* El cerco de lo creible. Un peso vale entre un centimo y mil unidades de
   cualquier moneda razonable; fuera de ahi no hay un cambio, hay un error de
   formato, un campo movido o un proveedor devolviendo otra cosa. Es lo unico
   que separa "el euro esta a 19,7" de "el euro esta a 0" en los datos de
   alguien, asi que es deliberadamente estrecho. */
const MINIMO = 0.01;
const MAXIMO = 1000;

const PERMITIDOS = ["https://mi.norata.app", "http://localhost:8123"];

function cabecerasCORS(origen: string | null) {
  const ok = origen && PERMITIDOS.includes(origen) ? origen : PERMITIDOS[0];
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

function responder(cuerpo: unknown, estado: number, origen: string | null, cache: boolean) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      "Content-Type": "application/json",
      /* Que el navegador y el borde de Supabase absorban las repeticiones: el
         mismo trozo de datos para todo el mundo durante una hora. Sin esto,
         abrir y cerrar el selector cinco veces son cinco viajes. */
      "Cache-Control": cache ? "public, max-age=3600" : "no-store",
      ...cabecerasCORS(origen),
    },
  });
}

/* ---- Lo que llega del proveedor, convertido a lo que usa la app ----

   Los dos proveedores dicen cuantos DOLARES vale un peso (0,0588). La app
   piensa al reves —cuantos PESOS vale un dolar (17,0)— porque es como lo dice
   la gente y como esta escrita `CAMBIO_EN_PESOS`. La vuelta se da aqui y no
   en la app para que el dia que cambie el proveedor no haya que tocar dos
   sitios.

   Devuelve null en cuanto algo no cuadra. No se rellena lo que falte con un
   valor por defecto: media respuesta buena y media inventada es peor que
   ninguna, porque nadie la distingue. */
function convertir(rates: Record<string, unknown>): Record<string, number> | null {
  const out: Record<string, number> = { MXN: 1 };
  for (const cod of MONEDAS) {
    const porPeso = rates ? rates[cod] : undefined;
    if (typeof porPeso !== "number" || !isFinite(porPeso) || porPeso <= 0) return null;
    const enPesos = 1 / porPeso;
    if (!isFinite(enPesos) || enPesos < MINIMO || enPesos > MAXIMO) return null;
    /* Dos decimales: es lo que la pantalla ensena y lo que alguien podria
       escribir a mano. Guardar quince decimales no anade precision a un
       importe que ademas se redondea a entero. */
    out[cod] = Math.round(enPesos * 100) / 100;
  }
  return out;
}

async function preguntarAlProveedor() {
  for (const p of PROVEEDORES) {
    try {
      /* Con tope: un proveedor que ni contesta ni falla dejaria esta funcion
         colgada y, detras de ella, a alguien mirando una pantalla que no
         responde. Cumplido el plazo se prueba el siguiente. */
      const res = await fetch(p.url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const json = await res.json();
      const tasas = convertir(json?.rates);
      if (!tasas) continue;
      return {
        tasas,
        /* La fecha que dice el proveedor, si la dice; si no, la de hoy. Es lo
           que la app ensena para que quien mire sepa de cuando es el numero. */
        fecha: typeof json?.date === "string"
          ? json.date
          : new Date().toISOString().slice(0, 10),
        fuente: p.nombre,
      };
    } catch (_e) { /* ese proveedor no; se prueba el siguiente */ }
  }
  return null;
}

async function leerGuardado(SB: string, SERVICIO: string) {
  try {
    const res = await fetch(
      SB + "/rest/v1/tipos_de_cambio?base=eq.MXN&select=tasas,fecha,fuente,actualizado&limit=1",
      { headers: { "Authorization": "Bearer " + SERVICIO, "apikey": SERVICIO } },
    );
    if (!res.ok) return null;
    const filas = await res.json();
    return Array.isArray(filas) && filas.length ? filas[0] : null;
  } catch (_e) { return null; }
}

async function guardar(SB: string, SERVICIO: string, dato: Record<string, unknown>) {
  try {
    await fetch(SB + "/rest/v1/tipos_de_cambio?on_conflict=base", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + SERVICIO,
        "apikey": SERVICIO,
        "Content-Type": "application/json",
        /* Insertar o actualizar: siempre es la misma fila. */
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        base: "MXN",
        tasas: dato.tasas,
        fecha: dato.fecha,
        fuente: dato.fuente,
        actualizado: new Date().toISOString(),
      }),
    });
  } catch (_e) { /* no poder guardar no invalida lo que ya tenemos que servir */ }
}

Deno.serve(async (req: Request) => {
  const origen = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cabecerasCORS(origen) });
  }
  if (req.method !== "GET") {
    return responder({ error: "solo GET" }, 405, origen, false);
  }

  const SB = Deno.env.get("SUPABASE_URL");
  const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SB || !SERVICIO) {
    return responder({ error: "faltan variables de entorno" }, 500, origen, false);
  }

  const guardado = await leerGuardado(SB, SERVICIO);
  const edad = guardado?.actualizado
    ? Date.now() - new Date(guardado.actualizado).getTime()
    : Infinity;

  /* Lo de hace un rato sirve tal cual: ni se pregunta fuera. */
  if (guardado && edad < FRESCO_MS && convertir_ok(guardado.tasas)) {
    return responder({
      tasas: guardado.tasas,
      fecha: guardado.fecha,
      fuente: guardado.fuente,
      fresco: true,
    }, 200, origen, true);
  }

  const nuevo = await preguntarAlProveedor();
  if (nuevo) {
    await guardar(SB, SERVICIO, nuevo);
    return responder({ ...nuevo, fresco: true }, 200, origen, true);
  }

  /* El proveedor no contesto o dijo algo que no nos creemos. Si hay algo
     guardado se sirve aunque este viejo, y se dice que lo esta: un cambio de
     la semana pasada es mejor que la tabla del codigo, que puede ser de hace
     meses. Y quien lo reciba lo va a ver escrito con su fecha, asi que puede
     corregirlo. */
  if (guardado && convertir_ok(guardado.tasas)) {
    return responder({
      tasas: guardado.tasas,
      fecha: guardado.fecha,
      fuente: guardado.fuente,
      fresco: false,
    }, 200, origen, false);
  }

  /* Ni proveedor ni guardado: no se inventa nada. La app cae a su tabla. */
  return responder({ error: "sin tipo de cambio disponible" }, 503, origen, false);
});

/* Lo guardado tambien se revisa antes de servirlo. Podria parecer paranoia
   —lo escribio esta misma funcion tras validarlo— pero la fila la puede tocar
   una mano con la llave de servicio, y lo que sale de aqui multiplica dinero.
   Comprobarlo cuesta cuatro lineas. */
function convertir_ok(tasas: unknown): boolean {
  if (!tasas || typeof tasas !== "object") return false;
  const t = tasas as Record<string, unknown>;
  if (t.MXN !== 1) return false;
  return MONEDAS.every((c) =>
    typeof t[c] === "number" && isFinite(t[c] as number) &&
    (t[c] as number) >= MINIMO && (t[c] as number) <= MAXIMO
  );
}
