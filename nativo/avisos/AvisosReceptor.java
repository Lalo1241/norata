// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/* Lo que contesta cuando la app no está: los botones de un aviso, la alarma
   del final de una fase, la del inicio de una actividad y el reinicio del
   teléfono (que borra todas las alarmas programadas). Ver `Avisos.java`.

   Todo lo que se toca aquí se hace en el momento sobre el aviso —que se vea
   que pasó— y además se APUNTA en la cola con su hora. La página lo repasa al
   abrir y lo aplica a su estado de verdad (`jAplicarAvisos`,
   js/09d-jornada.js). Si la app está viva de fondo, se le avisa en el acto. */
public class AvisosReceptor extends BroadcastReceiver {

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (a == null) return;
        switch (a) {
            case Intent.ACTION_BOOT_COMPLETED:
            case Intent.ACTION_MY_PACKAGE_REPLACED:
            case "android.intent.action.LOCKED_BOOT_COMPLETED":
                trasReiniciar(c);
                break;
            case Avisos.FIN:
                finDeFase(c, i.getStringExtra("clave"));
                break;
            case Avisos.REPINTA: {
                // Un tramo libre que acaba de cruzar la hora: la cifra baja a 28.
                JSONObject r = Avisos.reloj(c);
                if (r != null) Avisos.pintarReloj(c, r);
                break;
            }
            case Avisos.AGENDA:
                agenda(c, i.getStringExtra("entrada"), i.getBooleanExtra("unaVez", false));
                break;
            case Avisos.ACCION:
                accion(c, i);
                break;
            default:
                break;
        }
    }

    /* Un reinicio se lleva las alarmas y el aviso fijo. Se vuelven a poner
       las de la agenda y, si había un tramo corriendo que todavía no acaba,
       su reloj y su final. Uno que acabó con el teléfono apagado no se dice:
       la página lo cierra al abrir, como siempre. */
    private void trasReiniciar(Context c) {
        Avisos.reprogramarAgenda(c);
        JSONObject r = Avisos.reloj(c);
        if (r == null) return;
        if (r.optBoolean("pausado") || r.optLong("fin", 0) > System.currentTimeMillis() || r.optLong("inicio", 0) > 0) {
            Avisos.ponerReloj(c, r);
        } else {
            Avisos.ponerReloj(c, null);
        }
    }

    private void finDeFase(Context c, String clave) {
        JSONObject r = Avisos.reloj(c);
        // Una alarma vieja de una fase que ya no corre: no se dice nada.
        if (r == null || clave == null || !clave.equals(r.optString("clave"))) return;
        JSONObject fin = r.optJSONObject("alFinal");
        String titulo = fin != null ? fin.optString("titulo") : r.optString("titulo");
        String texto = fin != null ? fin.optString("texto") : "";
        if (!Avisos.enPrimerPlano && siguienteDeLaCadena(c, r, clave, titulo, texto, fin)) return;
        /* El aviso fijo deja de contar: se queda dicho lo que acaba de pasar
           hasta que la página, al despertar, ponga la fase que sigue. */
        try {
            JSONObject quieto = new JSONObject(r.toString());
            quieto.put("fin", 0);
            quieto.put("inicio", 0);
            quieto.put("pausable", false);
            quieto.put("titulo", titulo);
            quieto.put("texto", texto);
            quieto.remove("siguiente");
            // El molde de lo que acaba de pasar (el de «Tramo listo»), sin cuenta.
            quieto.remove("vistas");
            if (fin != null && fin.optJSONObject("vista") != null) quieto.put("vista", fin.optJSONObject("vista"));
            Avisos.guardar(c, "reloj", quieto);
            Avisos.pintarReloj(c, quieto);
            Avisos.avisarWidgets(c);
        } catch (JSONException e) { /* se queda el que había */ }
        /* Con la app a la vista lo dice ella: campana y aviso dentro. */
        if (Avisos.enPrimerPlano) return;
        if (Avisos.primeraVez(c, clave)) Avisos.avisar(c, titulo, texto, r.optString("icono"), "jornada",
                fin == null ? null : fin.optJSONObject("vista"));
    }

    /* Una Travesía trae escrito lo que sigue (`cadena`, de `jCadenaLite` en
       js/09d-jornada.js): al acabar una ronda se dice, y se pone sola su
       descanso; al acabar el descanso, la ronda siguiente. Antes se quedaba
       parada hasta abrir la app. Lo que pasó se apunta en la cola (`fase`)
       para que la página lo repita con su hora. Con la app a la vista no se
       toca: ahí la página lo hace ella, y dos manos sobre el mismo reloj lo
       adelantarían dos veces. */
    private boolean siguienteDeLaCadena(Context c, JSONObject r, String clave, String titulo, String texto, JSONObject fin) {
        JSONArray cad = r.optJSONArray("cadena");
        if (cad == null || cad.length() == 0) return false;
        try {
            JSONObject sig = cad.getJSONObject(0);
            long t = System.currentTimeMillis(), dur = sig.optLong("dur", 0);
            if (dur <= 0) return false;
            String fid = "n" + Long.toString(t, 36), fase = sig.optString("fase", "foco");
            JSONObject iconos = r.optJSONObject("iconos");
            JSONObject ic = iconos == null ? null : iconos.optJSONObject(fase);
            JSONObject nuevo = new JSONObject();
            nuevo.put("titulo", sig.optString("titulo"));
            nuevo.put("texto", sig.optString("texto"));
            nuevo.put("icono", ic != null ? ic.optString("icono") : r.optString("icono"));
            nuevo.put("pausable", sig.optBoolean("pausable", true));
            nuevo.put("clave", fid + "|" + fase);
            nuevo.put("fase", fase);
            nuevo.put("lite", sig.optString("lite", r.optString("lite")));
            nuevo.put("tramo", sig.optInt("tramo", 1));
            nuevo.put("total", sig.optInt("total", 1));
            nuevo.put("dur", dur);
            nuevo.put("fin", t + dur);
            if (sig.has("alFinal")) nuevo.put("alFinal", sig.getJSONObject("alFinal"));
            if (sig.has("vistas")) nuevo.put("vistas", sig.getJSONObject("vistas"));
            JSONArray resto = new JSONArray();
            for (int k = 1; k < cad.length(); k++) resto.put(cad.get(k));
            if (resto.length() > 0) nuevo.put("cadena", resto);
            if (iconos != null) nuevo.put("iconos", iconos);
            if (Avisos.primeraVez(c, clave)) Avisos.avisar(c, titulo, texto, r.optString("icono"), "jornada",
                    fin == null ? null : fin.optJSONObject("vista"));
            Avisos.ponerReloj(c, nuevo);
            JSONObject ev = new JSONObject();
            ev.put("accion", "fase");
            ev.put("t", t);
            ev.put("clave", clave);
            ev.put("fid", fid);
            ev.put("fase", fase);
            ev.put("dur", dur);
            Avisos.encolar(c, ev);
            return true;
        } catch (JSONException e) {
            return false;
        }
    }

    private void agenda(Context c, String id, boolean unaVez) {
        if (id == null) return;
        JSONObject e = Avisos.entrada(c, id);
        // Una entrada que ya no está (se borró el bloque): su alarma se queda muda.
        if (e == null) return;
        if (!unaVez) Avisos.programarEntrada(c, e);
        // Las que solo valen con la app cerrada (la de ir a dormir, que la
        // página ya dice dentro).
        if (Avisos.enPrimerPlano && !e.optBoolean("visible", true)) return;
        Avisos.avisarEntrada(c, e);
    }

    private void accion(Context c, Intent i) {
        String accion = i.getStringExtra("accion");
        if (accion == null) return;
        long t = System.currentTimeMillis();
        JSONObject r = Avisos.reloj(c);
        JSONObject ev = new JSONObject();
        try {
            ev.put("accion", accion);
            ev.put("t", t);
            if (r != null) ev.put("clave", r.optString("clave"));
            switch (accion) {
                case "pausa": {
                    long fin = r == null ? 0 : r.optLong("fin", 0);
                    if (r == null || r.optBoolean("pausado") || (fin <= 0 && r.optLong("inicio", 0) <= 0)) return;
                    r.put("pausado", true);
                    r.put("restante", fin > 0 ? Math.max(0, fin - t) : 0);
                    r.put("transcurrido", fin > 0 ? 0 : Math.max(0, t - r.optLong("inicio", t)));
                    r.put("fin", 0);
                    r.put("inicio", 0);
                    Avisos.ponerReloj(c, r);
                    break;
                }
                case "seguir": {
                    if (r == null || !r.optBoolean("pausado")) return;
                    r.put("pausado", false);
                    long resto = r.optLong("restante", 0);
                    if (resto > 0) r.put("fin", t + resto);
                    else r.put("inicio", t - r.optLong("transcurrido", 0));
                    r.remove("restante");
                    r.remove("transcurrido");
                    Avisos.ponerReloj(c, r);
                    break;
                }
                case "iniciar": {
                    JSONObject ini = new JSONObject(i.getStringExtra("inicio"));
                    /* El id de la fase lo pone esto y no la página: así la
                       alarma del final y la página, cuando se entere, hablan
                       del mismo tramo y el aviso no sale dos veces. */
                    String fid = "n" + Long.toString(t, 36);
                    long dur = ini.optLong("dur", 0);
                    JSONObject nuevo = new JSONObject();
                    nuevo.put("titulo", ini.optString("titulo"));
                    nuevo.put("texto", ini.optString("texto"));
                    nuevo.put("icono", ini.optString("icono"));
                    /* Un Respiro no es foco: es un descanso que no se pausa. La
                       fase y el resto (0.7.210) los escribe la página, para el
                       widget del Pomodoro; lo de antes no los traía, y vale. */
                    String fase = ini.optString("fase", "foco");
                    nuevo.put("pausable", ini.optBoolean("pausable", true));
                    nuevo.put("clave", fid + "|" + fase);
                    nuevo.put("fase", fase);
                    nuevo.put("lite", ini.optString("lite", ""));
                    nuevo.put("tramo", ini.optInt("tramo", 1));
                    nuevo.put("total", ini.optInt("total", 1));
                    nuevo.put("dur", dur);
                    if (dur > 0) nuevo.put("fin", t + dur); else nuevo.put("inicio", t);
                    if (ini.has("alFinal")) nuevo.put("alFinal", ini.getJSONObject("alFinal"));
                    // Las dos caras del tramo que empieza (corriendo y en pausa), ya escritas por la página.
                    if (ini.has("vistas")) nuevo.put("vistas", ini.getJSONObject("vistas"));
                    // Una Travesía trae lo que sigue (ver `siguienteDeLaCadena`).
                    if (ini.has("cadena")) nuevo.put("cadena", ini.getJSONArray("cadena"));
                    if (ini.has("iconos")) nuevo.put("iconos", ini.getJSONObject("iconos"));
                    Avisos.ponerReloj(c, nuevo);
                    Avisos.quitar(c, Avisos.ID_AGENDA);
                    ev.put("fid", fid);
                    ev.put("bloque", ini.optString("bloque"));
                    ev.put("dur", dur);
                    // Si es un Hiperfoco, cuál: la página lo enciende con `jIniciarLite`.
                    if (!ini.optString("lite", "").isEmpty()) ev.put("lite", ini.optString("lite"));
                    break;
                }
                case "parar": {
                    /* Parar un Hiperfoco desde el widget del Pomodoro: el reloj
                       se quita ya, y la página apunta los minutos al abrir, con
                       la hora de este toque. */
                    if (r == null) return;
                    Avisos.ponerReloj(c, null);
                    break;
                }
                case "posponer": {
                    String id = i.getStringExtra("entrada");
                    Avisos.quitar(c, Avisos.idDe(id == null ? null : Avisos.entrada(c, id)));
                    if (id != null) Avisos.programar(c, t + 5 * 60 * 1000L, Avisos.alarmaDe(c, id, true));
                    return; // Nada que contarle a la página: la rueda no cambia.
                }
                case "cumplir": {
                    /* «Ya la hice» en el recordatorio de una misión: el aviso se
                       quita ya y la página la marca al abrir, con la hora de
                       este toque (`jAplicarAvisos` → `logMission`). */
                    String id = i.getStringExtra("entrada");
                    JSONObject e = id == null ? null : Avisos.entrada(c, id);
                    if (e != null) Avisos.quitar(c, Avisos.idDe(e));
                    ev.remove("clave");
                    ev.put("mision", i.getStringExtra("mision"));
                    break;
                }
                default:
                    return;
            }
        } catch (JSONException e) {
            return;
        }
        Avisos.encolar(c, ev);
    }
}
