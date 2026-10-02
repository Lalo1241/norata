// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.jakewharton.processphoenix.ProcessPhoenix;

import java.util.LinkedHashMap;
import java.util.Map;

/* El icono de la pantalla de inicio, uno por mundo (0.7.145).

   Los dieciocho iconos son entradas de la app (`activity-alias` en el
   manifiesto, todas apuntando a MainActivity) y solo una está encendida: la
   que el lanzador enseña. Cambiar de icono es encender otra y apagar las
   demás. Lo pide `js/13-nativo.js` (`norataIcono`).

   Tres cosas que no se pueden tocar sin entender por qué están:

   - **Primero se enciende la nueva y después se apagan las otras.** Al revés
     hay un instante sin ninguna entrada encendida, y un lanzador que mire
     justo ahí da la app por desinstalada y quita su acceso directo.
   - **Las entradas se DESCUBREN, no se listan aquí.** Se leen del propio
     paquete (todas las que se llaman `.Icono_*`), así que un icono nuevo solo
     se añade en el manifiesto y en `res/`, y este archivo no se toca. Y se
     usa el nombre COMPLETO que devuelve Android, no el paquete de la app más
     `.Icono_x`: si el `applicationId` no es igual al paquete del código, ese
     nombre armado a mano no existe y el cambio no hace nada.
   - **El reinicio es con ProcessPhoenix y no con `System.exit` ni una
     alarma.** Matar el proceso después de abrir la actividad nueva la mata a
     ella también (es el mismo proceso), y desde Android 10 una alarma no
     puede abrir una pantalla desde el fondo. ProcessPhoenix arranca un
     proceso aparte que abre la app de nuevo y se sale. */
@CapacitorPlugin(name = "IconoNorata")
public class IconoPlugin extends Plugin {

    private static final String PREFIJO = ".Icono_";

    /* ---- El color con el que abre la app (0.7.166) ----
       Regla de Eduardo: ni un cuadro con otro color que el del tema puesto, y
       que la app entre «de lleno en ese color, no que haga el cambio a medio
       camino». Al abrir hay tres cosas que se ven antes que la página, y las
       tres tienen que ir en el fondo del tema:

         1. La pantalla de arranque del SISTEMA. La pinta Android antes de que
            corra la app, así que no se le puede dar un color al vuelo: se
            elige, de los temas `Arranque_<color>` que viajan en el APK
            (res/values/arranque.xml), el del tema puesto, y Android lo
            recuerda para la próxima vez (`setSplashScreenTheme`). **Solo
            desde Android 13**; en los de antes se queda la noche de la casa.
         2. El fondo de la VENTANA, que asoma entre que se quita esa pantalla
            y que el WebView pinta. Sin tocarlo es el del tema de Android:
            blanco con el teléfono en modo claro.
         3. El fondo del WebView antes de su primer cuadro.

       La página lo manda con `fondo` cada vez que arranca y cada vez que se
       va al fondo (js/13-nativo.js); aquí se guarda y, al abrir, `load` pinta
       la 2 y la 3 antes del primer cuadro. */
    private static final String ARRANQUE = "norata_arranque";
    private static final int NOCHE = 0xFF10151D;

    private int fondoGuardado() {
        return getContext().getSharedPreferences(ARRANQUE, Context.MODE_PRIVATE).getInt("fondo", NOCHE);
    }

    private void pintarFondo(final int color) {
        final Activity act = getActivity();
        if (act == null) return;
        act.runOnUiThread(() -> {
            try {
                act.getWindow().setBackgroundDrawable(new ColorDrawable(color));
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().setBackgroundColor(color);
                }
            } catch (Exception e) { /* sin ventana todavía: se queda el del tema */ }
        });
    }

    /* Corre dentro del `onCreate` de la actividad, con el WebView ya creado y
       antes de que se pinte nada. */
    @Override
    public void load() {
        pintarFondo(fondoGuardado());
    }

    /** El tema de arranque de ese color, o el más parecido de los que trae el
        APK. Un color que no esté —una paleta construida después de instalar—
        no deja el arranque en la noche de la casa: toma el tono vecino.
        Devuelve el color elegido («10151d»), o vacío si no se pudo. */
    private String temaDeArranque(int color) {
        if (Build.VERSION.SDK_INT < 33) return "";
        Activity act = getActivity();
        if (act == null) return "";
        Resources res = getContext().getResources();
        String pkg = getContext().getPackageName();
        int lista = res.getIdentifier("arranque_colores", "array", pkg);
        if (lista == 0) return "";
        String mejor = null;
        int distancia = Integer.MAX_VALUE;
        for (String s : res.getStringArray(lista)) {
            int c;
            try { c = Color.parseColor("#" + s.substring(1)); } catch (Exception e) { continue; }
            int r = Color.red(c) - Color.red(color), v = Color.green(c) - Color.green(color), a = Color.blue(c) - Color.blue(color);
            int d = r * r + v * v + a * a;
            if (d < distancia) { distancia = d; mejor = s.substring(1); }
        }
        if (mejor == null) return "";
        int estilo = res.getIdentifier("Arranque_" + mejor, "style", pkg);
        if (estilo == 0) return "";
        try {
            act.getSplashScreen().setSplashScreenTheme(estilo);
        } catch (Exception e) {
            return "";
        }
        return mejor;
    }

    /** { color: "#0d2b52" } → { tema: "0d2b52" }. */
    @PluginMethod
    public void fondo(PluginCall call) {
        int color;
        try {
            color = Color.parseColor(call.getString("color", "")) | 0xFF000000;
        } catch (Exception e) {
            call.reject("color");
            return;
        }
        getContext().getSharedPreferences(ARRANQUE, Context.MODE_PRIVATE).edit().putInt("fondo", color).apply();
        pintarFondo(color);
        JSObject r = new JSObject();
        r.put("tema", temaDeArranque(color));
        call.resolve(r);
    }

    /** Las entradas de icono que trae el APK: id («casa», «plano»…) → nombre completo. */
    private Map<String, String> iconos() {
        Context ctx = getContext();
        Map<String, String> ids = new LinkedHashMap<>();
        try {
            PackageInfo info = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(),
                    PackageManager.GET_ACTIVITIES | PackageManager.MATCH_DISABLED_COMPONENTS);
            if (info.activities != null) {
                for (ActivityInfo a : info.activities) {
                    int i = a.name.lastIndexOf(PREFIJO);
                    if (i >= 0) ids.put(a.name.substring(i + PREFIJO.length()), a.name);
                }
            }
        } catch (PackageManager.NameNotFoundException e) { /* no pasa: es nuestro propio paquete */ }
        return ids;
    }

    private ComponentName componente(Map<String, String> ids, String id) {
        return new ComponentName(getContext().getPackageName(), ids.get(id));
    }

    /** La que está encendida ahora. Sin tocar nunca, vale lo del manifiesto:
        la casa nace encendida y las demás apagadas. */
    private String encendido(Map<String, String> ids) {
        PackageManager pm = getContext().getPackageManager();
        for (String id : ids.keySet()) {
            int e = pm.getComponentEnabledSetting(componente(ids, id));
            if (e == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) return id;
        }
        return "casa";
    }

    @PluginMethod
    public void actual(PluginCall call) {
        JSObject r = new JSObject();
        r.put("icono", encendido(iconos()));
        call.resolve(r);
    }

    /** { icono: "plano", reiniciar: true } → { cambiado: bool }.
        Un icono que el APK no trae (un mundo construido después de instalarlo)
        no es un error: se queda el que había y la app sigue como siempre. */
    @PluginMethod
    public void poner(PluginCall call) {
        final String id = call.getString("icono", "casa");
        final boolean reiniciar = Boolean.TRUE.equals(call.getBoolean("reiniciar", false));
        final Map<String, String> ids = iconos();
        JSObject r = new JSObject();
        if (!ids.containsKey(id) || id.equals(encendido(ids))) {
            r.put("cambiado", false);
            call.resolve(r);
            return;
        }
        PackageManager pm = getContext().getPackageManager();
        pm.setComponentEnabledSetting(componente(ids, id),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
        for (String otro : ids.keySet()) {
            if (otro.equals(id)) continue;
            pm.setComponentEnabledSetting(componente(ids, otro),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
        }
        r.put("cambiado", true);
        call.resolve(r);
        if (!reiniciar) return;

        /* Un respiro antes de reiniciar: que la respuesta llegue a la página y
           que Android termine de apuntar el cambio. Se abre por la entrada
           NUEVA, que es la única encendida. */
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent abrir = new Intent(Intent.ACTION_MAIN);
            abrir.addCategory(Intent.CATEGORY_LAUNCHER);
            abrir.setComponent(componente(ids, id));
            abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            ProcessPhoenix.triggerRebirth(getContext(), abrir);
        }, 300);
    }
}
