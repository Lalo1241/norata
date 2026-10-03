// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.content.Context;
import android.content.Intent;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

/* Lo que habla con la página: `js/13c-widgets.js`. Ver `Widgets.java` para el
   reparto entre la página y esto.

   Con `isPluginAvailable("WidgetsNorata")` la página sabe si este APK lo trae.
   Uno de antes no lo trae, y la app sigue exactamente como estaba. */
@CapacitorPlugin(name = "WidgetsNorata")
public class WidgetsPlugin extends Plugin {

    @Override
    public void load() {
        Widgets.instancia = this;
        apuntarIr(getActivity() == null ? null : getActivity().getIntent());
    }

    @Override
    protected void handleOnDestroy() {
        if (Widgets.instancia == this) Widgets.instancia = null;
    }

    /* Se tocó el widget con la app abierta: se apunta adónde ir y se le dice a
       la página. Con la app cerrada lo recoge `load`, del intent con el que
       arrancó, y la página lo pide en `pendientes`. */
    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (apuntarIr(intent)) hayMarcas();
    }

    private boolean apuntarIr(Intent i) {
        if (i == null || !i.hasExtra(Widgets.EXTRA_IR)) return false;
        Widgets.prefs(getContext()).edit().putString("ir", i.getStringExtra(Widgets.EXTRA_IR)).apply();
        // Que una recarga de la página no lo vuelva a leer del mismo intent.
        i.removeExtra(Widgets.EXTRA_IR);
        return true;
    }

    /* Lo llama `HoyWidget` cuando se marcó algo con la app viva. */
    void hayMarcas() {
        notifyListeners("marcas", new JSObject());
    }

    /** { foto: { zona, textos, colores, dias } } → { puestos } */
    @PluginMethod
    public void foto(PluginCall call) {
        Context c = getContext();
        Widgets.guardarFoto(c, call.getObject("foto"));
        Widgets.refrescar(c);
        JSObject r = new JSObject();
        r.put("puestos", Widgets.puestos(c).length);
        call.resolve(r);
    }

    /** → { marcas: [{ id, dia, d, t }], ir: "missions" | "nueva" | null }, y se olvidan. */
    @PluginMethod
    public void pendientes(PluginCall call) {
        Context c = getContext();
        JSObject r = new JSObject();
        try {
            r.put("marcas", new JSArray(Widgets.vaciarCola(c).toString()));
        } catch (JSONException e) {
            r.put("marcas", new JSArray());
        }
        String ir = Widgets.prefs(c).getString("ir", null);
        Widgets.prefs(c).edit().remove("ir").apply();
        r.put("ir", ir);
        call.resolve(r);
    }
}
