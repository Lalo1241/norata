// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.widget.RemoteViews;

/* Lo que tienen en común todos los widgets de Norata: se pintan cuando Android
   lo pide (al ponerlos, cada media hora, al reiniciar el teléfono), cuando
   cambian de tamaño y cuando la página manda una foto nueva o se toca algo
   (`Widgets.refrescar`, que los recorre a todos).

   Cada widget es una clase aparte porque Android necesita una por cada entrada
   del selector de widgets; lo que de verdad hacen está en `Pinta.java`. */
public abstract class WidgetNorata extends AppWidgetProvider {

    /** El molde lleno, o null si este APK no trae el molde. */
    abstract RemoteViews vista(Context c, AppWidgetManager m, int widget);

    /** Lo que haya que avisar después de pintar (la lista de Hoy). */
    void despues(Context c, AppWidgetManager m, int[] ids) {}

    final void pinta(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = vista(c, m, widget);
        if (v != null) m.updateAppWidget(widget, v);
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) pinta(c, m, id);
        despues(c, m, ids);
        Widgets.armarTic(c);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle opciones) {
        pinta(c, m, id);
        despues(c, m, new int[] { id });
    }
}
