// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONException;

/* Lo que habla con la página: `js/13b-avisos.js` (`norataAvisos`). Ver
   `Avisos.java` para el reparto entre la página y esto.

   Con `isPluginAvailable("AvisosNorata")` la página sabe si este APK lo trae.
   Uno de antes no lo trae, y el Pomodoro sigue como estaba. */
@CapacitorPlugin(
        name = "AvisosNorata",
        permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "avisos") }
)
public class AvisosPlugin extends Plugin {

    @Override
    public void load() {
        Avisos.instancia = this;
        Avisos.enPrimerPlano = true;
        apuntarIr(getActivity() == null ? null : getActivity().getIntent());
    }

    @Override
    protected void handleOnResume() { Avisos.enPrimerPlano = true; }

    @Override
    protected void handleOnPause() { Avisos.enPrimerPlano = false; }

    @Override
    protected void handleOnDestroy() {
        Avisos.enPrimerPlano = false;
        if (Avisos.instancia == this) Avisos.instancia = null;
    }

    /* Se tocó un aviso con la app abierta: se apunta adónde ir y se le dice a
       la página. Con la app cerrada lo recoge `load`, del intent con el que
       arrancó, y la página lo pide en `pendientes`. */
    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (apuntarIr(intent)) notifyListeners("acciones", new JSObject());
    }

    private boolean apuntarIr(Intent i) {
        if (i == null || !i.hasExtra("norataIr")) return false;
        Avisos.prefs(getContext()).edit().putString("ir", i.getStringExtra("norataIr")).apply();
        // Que una recarga de la página no lo vuelva a leer del mismo intent.
        i.removeExtra("norataIr");
        return true;
    }

    /* Lo llama el receptor cuando se tocó algo con la app viva de fondo. */
    void hayAcciones() {
        notifyListeners("acciones", new JSObject());
    }

    private JSObject estadoPermisos() {
        Context c = getContext();
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        JSObject r = new JSObject();
        r.put("avisos", nm != null && nm.areNotificationsEnabled());
        r.put("exactas", Avisos.exactas(c));
        return r;
    }

    /** { textos: {...}, color: "#00cc7f", zona: "America/Mexico_City" } */
    @PluginMethod
    public void configurar(PluginCall call) {
        Context c = getContext();
        android.content.SharedPreferences.Editor ed = Avisos.prefs(c).edit();
        JSObject t = call.getObject("textos");
        if (t != null) ed.putString("textos", t.toString());
        String color = call.getString("color");
        if (color != null) {
            try { ed.putInt("color", Color.parseColor(color)); } catch (IllegalArgumentException e) { /* el de siempre */ }
        }
        // Los tonos de los moldes (0.7.161): ya resueltos por la página.
        JSObject col = call.getObject("colores");
        if (col != null) ed.putString("colores", col.toString());
        String zona = call.getString("zona");
        if (zona != null && !zona.isEmpty()) ed.putString("zona", zona);
        ed.commit();
        Avisos.canales(c);
        call.resolve(estadoPermisos());
    }

    @PluginMethod
    public void permisos(PluginCall call) {
        call.resolve(estadoPermisos());
    }

    /* Desde Android 13 avisar pide permiso. Se pide al tocar Iniciar o al
       encender el interruptor, que son gestos de la persona y es cuando se
       entiende para qué (la misma regla que en la web). */
    @PluginMethod
    public void pedirAvisos(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("avisos") != PermissionState.GRANTED) {
            requestPermissionForAlias("avisos", call, "trasPedirAvisos");
            return;
        }
        call.resolve(estadoPermisos());
    }

    @PermissionCallback
    private void trasPedirAvisos(PluginCall call) {
        call.resolve(estadoPermisos());
    }

    /* Las alarmas exactas no se piden con un cuadro: se mandan a los ajustes
       del sistema, a su interruptor. La página lo ofrece solo si hace falta. */
    @PluginMethod
    public void pedirExactas(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31 && !Avisos.exactas(getContext())) {
            try {
                Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } catch (Exception e) { /* un sistema sin esa pantalla */ }
        }
        call.resolve(estadoPermisos());
    }

    /** { estado: {...} | null } — el aviso fijo del tramo en curso. */
    @PluginMethod
    public void reloj(PluginCall call) {
        JSObject e = call.getObject("estado");
        Avisos.ponerReloj(getContext(), e == null || e.length() == 0 ? null : e);
        call.resolve();
    }

    /** { titulo, texto, clave?, icono? } → { mostrado } */
    @PluginMethod
    public void avisar(PluginCall call) {
        Context c = getContext();
        JSObject r = new JSObject();
        if (!Avisos.primeraVez(c, call.getString("clave"))) {
            r.put("mostrado", false);
            call.resolve(r);
            return;
        }
        Avisos.avisar(c, call.getString("titulo", ""), call.getString("texto", ""), call.getString("icono"),
                call.getString("ir", "jornada"), call.getObject("vista"));
        r.put("mostrado", true);
        call.resolve(r);
    }

    /** { entradas: [{ id, dia, min, titulo, texto, icono?, iniciar?, visible?, posponible? }] } */
    @PluginMethod
    public void agenda(PluginCall call) {
        JSArray l = call.getArray("entradas");
        Avisos.ponerAgenda(getContext(), l == null ? new JSONArray() : l);
        call.resolve();
    }

    /** → { acciones: [...], ir: "jornada" | null }, y se olvidan. */
    @PluginMethod
    public void pendientes(PluginCall call) {
        Context c = getContext();
        JSObject r = new JSObject();
        JSONArray cola = Avisos.vaciarCola(c);
        try {
            r.put("acciones", new JSArray(cola.toString()));
        } catch (JSONException e) {
            r.put("acciones", new JSArray());
        }
        String ir = Avisos.prefs(c).getString("ir", null);
        Avisos.prefs(c).edit().remove("ir").apply();
        r.put("ir", ir);
        call.resolve(r);
    }
}
