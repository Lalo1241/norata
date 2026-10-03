// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

/* Siguiente nodo (4×1): el paso que toca de una rama. Ver `Pinta.nodo`. */
public class NodoWidget extends WidgetNorata {
    @Override
    RemoteViews vista(Context c, AppWidgetManager m, int widget) { return Pinta.nodo(c, m, widget); }
}
