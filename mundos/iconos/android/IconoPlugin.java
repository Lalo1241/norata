// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
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

/* El icono de la pantalla de inicio, uno por mundo (0.7.144).

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
