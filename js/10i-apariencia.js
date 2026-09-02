/* ================= Las apariencias =================
   Encender otra piel de Norata. Lo que hace este archivo y nada más: leer la
   elección, comprobar que se puede, aplicarla y guardarla.

   Dos palabras y no son intercambiables — están definidas en
   `apariencias/LEEME.md`, que es el documento que manda:

     ambiente   un RECOLOR. Reusa el material que ya hay y le cambia la luz.
                Son siete, viven en `css/ambientes.css` y viajan con la app
                porque pesan seis kilobytes entre todos.
     mundo      cambia el MATERIAL: otra superficie, otro marco, otra letra y
                otro peso al moverse. Pesa entre 28 y 180 KB, así que NO viaja
                con la app: se pide el día que se enciende.

   Son EXCLUYENTES, y por eso esto es un atributo y no una clase: un mundo
   declara sus propios colores, así que un ambiente por debajo no se vería.
   Con `data-apariencia` el modelo se hace cumplir solo, porque un atributo no
   puede llevar dos valores a la vez. El modo claro sigue siendo la clase
   `claro` y es un eje aparte: cada apariencia tiene sus dos caras. */

const APARIENCIA_LLAVE = "norata-apariencia";
const APARIENCIA_PRUEBA = "norata-apariencia-prueba";

/* ---- Qué se ENSEÑA hoy, que no es lo mismo que qué está construido ----

   `null` significa «todas las que estén listas», y es lo que hay que dejar
   puesto mientras se trabaja. Una lista de ids significa «solo éstas», y ése
   es el interruptor del lanzamiento: el plan de Eduardo es ir soltando los
   temas conforme se compruebe que funcionan, y salir a la calle enseñando
   únicamente el clásico y el de Fundador. Ese día esto se escribe así, y es
   la ÚNICA línea que se toca:

     const APARIENCIAS_EXHIBIDAS = ["casa", "reliquia"];

   Va aquí y no como un `oculta: true` repartido por las quince entradas por
   eso mismo: apagar ocho cosas de una en una son ocho sitios donde olvidarse
   uno, y volver a encenderlas después son otros ocho. Lo que está construido
   lo sigue diciendo `listo`, que es otra pregunta: un mundo puede estar
   terminado y todavía no exhibirse. */
const APARIENCIAS_EXHIBIDAS = null;

function seExhibe(id) {
  return !APARIENCIAS_EXHIBIDAS || APARIENCIAS_EXHIBIDAS.indexOf(id) !== -1;
}

/* ---- Lo que acaba de llegar ----

   Mes y medio. Lo pidió Eduardo y el número es suyo: lo bastante para que lo
   vea quien abre la app una vez cada dos semanas, y lo bastante poco para que
   la palabra siga significando algo — con seis meses, «nuevo» es un adorno
   pegado a media lista.

   La fecha es la de PUBLICACIÓN y se escribe a mano al soltar el tema, no sale
   de la versión: una apariencia puede estar en el código tandas antes de que
   se exhiba, y lo que cuenta para quien la mira es el día que apareció en su
   pantalla. Sin `estrena` no hay novedad, así que lo viejo no necesita que
   nadie vaya a limpiarlo. */
const NOVEDAD_DIAS = 45;

function esNovedad(a) {
  if (!a || !a.estrena) return false;
  /* Con la hora pegada, y no `Date.parse("2026-09-01")` a secas: una fecha
     sola la lee el navegador como UTC y la app trabaja en hora de México, así
     que el estreno empezaba seis horas antes de lo escrito. */
  const dias = (Date.now() - Date.parse(a.estrena + "T00:00:00")) / 86400000;
  return dias >= 0 && dias < NOVEDAD_DIAS;
}

/* Los siete ambientes. `abre` es el nivel de expedición que los desbloquea, y
   hoy ese nivel NO EXISTE —la app da niveles por habilidad y nadie suma el
   total—, así que la puerta está escrita pero todavía no la guarda nadie: ver
   `aparienciaDisponible`. Los tonos de cada uno están en `css/ambientes.css`
   y salen medidos de `apariencias/datos.py`.

   La `premisa` es la versión de PANTALLA de la que vive en `apariencias/datos.py`,
   y son dos textos a propósito: la de allá es de lámina y explica por qué el
   ambiente existe —«el primero que se gana, y llega pronto a propósito»—, que
   es exactamente lo que a nadie le importa mientras elige un color. Aquí va lo
   que se ve: a qué se parece. Un mundo trae la suya en `MUNDOS`. */
const AMBIENTES = [
  { id: "casa",     nombre: "Norata Clásico", grado: 0, abre: 0,  icon: "compass",
    premisa: "El carbón azulado y la menta de siempre. Es donde empiezas, y es lo que queda al quitarte un recolor." },
  /* Gratis siempre y no por generosidad: para quien no distingue bien los
     colores, un monocromo no es un adorno — es la única manera de usar la
     app. Cobrarlo sería cobrar por entrar. */
  { id: "tinta",    nombre: "Tinta",    grado: 3, abre: 0,  icon: "pen",
    premisa: "Tinta china sobre papel. Sin más color que el amarillo y el coral, para que lo que avisa se vea desde la otra punta del cuarto." },
  { id: "musgo",    nombre: "Musgo",    grado: 1, abre: 3,  icon: "plant",
    premisa: "Verde hondo de bosque cerrado de noche, y luz entre hojas de día." },
  { id: "marea",    nombre: "Marea",    grado: 2, abre: 5,  pro: true, icon: "globe",
    premisa: "Verdiazul de agua honda, con la menta de la casa vista desde el fondo." },
  { id: "adobe",    nombre: "Adobe",    grado: 1, abre: 7,  icon: "sol",
    premisa: "Barro cocido: terracota apagada con cal encima, el color de una pared vieja." },
  { id: "escarcha", nombre: "Escarcha", grado: 2, abre: 12, pro: true, icon: "luna",
    premisa: "La menta se vuelve celeste y la app pasa de festejar a acompañar." },
  { id: "duna",     nombre: "Duna",     grado: 1, abre: 20, icon: "star",
    premisa: "El desierto cuando se mete el sol: el cielo en violeta y la arena en lavanda." }
];

/* ================= Los mundos =================
   Un mundo cambia el MATERIAL, no la luz — y desde el 30 de agosto cambia una
   cosa más: **te renombra el camino**. Los cinco rangos de la casa —Nodo,
   Enlace, Rama, Trama, Red— son de la app; un mundo trae los suyos, con sus
   nombres y sus dibujos, alineados a su tema. Eso es lo que separa una piel de
   un mundo, y es lo que se vende: un recolor te cambia la luz; un mundo te
   cambia hasta cómo se llama lo que llevas recorrido.

   Los NIVELES de entrada no se tocan nunca, y es a propósito: si cada mundo
   moviera los peldaños, dos personas con el mismo nivel estarían en sitios
   distintos de la escalera. Una sola escalera, muchos vocabularios.

   **Un rango puede traer además una `linea`**, que es lo que se lee debajo de
   «Ahora eres X» el día que se estrena — y solo ese día, que son cinco veces
   en toda la vida de una cuenta. Es un campo opcional de CUALQUIER rango y no
   una cosa de un mundo: la casa no trae ninguna, Averno trae sus cinco
   versículos y el día que Reliquia quiera su cédula de museo se la escribe.
   `{ texto, fuente }`, y la fuente se pinta aparte — una cita tiene que verse
   citada o parece que la escribió la app. Lo pintó `js/02-progreso.js`.

   De los quince, tres están construidos —Reliquia, Blueprint y Averno— y son
   los que llevan `listo: true`. Con cualquier otra apariencia puesta,
   `rangosDeApariencia()` devuelve null y manda la casa. Los dibujos de los
   rangos viajan con su mundo y no con la app: meter en ICONS los cinco rangos
   de quince mundos serían setenta y cinco dibujos que se baja todo el mundo
   para no usar ninguno. */
const MUNDOS = [
  {
    id: "arboleda", nombre: "Arboleda",
    /* Los cinco que se habían dibujado para la app y que Eduardo movió aquí:
       de la tierra al cielo, que es lo que hace que cada uno se le ocurra solo
       al anterior. En un bosque no eres un nodo de una red: eres lo que crece. */
    rangos: [
      { nombre: "Semilla", trazo: '<path d="M12 3.4c4 3.4 6.3 7 6.3 10.6 0 3.8-2.8 6.8-6.3 6.8s-6.3-3-6.3-6.8c0-3.6 2.3-7.2 6.3-10.6z"/><path d="M12 9.4v8.4"/>' },
      { nombre: "Brote",   trazo: '<path d="M12 20.6v-8"/><path d="M12 15.4c-3.6 0-6-2.3-6-5.8 3.9-.4 6 2.2 6 5.8z"/><path d="M12 13.2c0-3.7 2.4-6.2 6.2-5.9 0 3.6-2.5 5.9-6.2 5.9z"/><path d="M6 20.6h12"/>' },
      { nombre: "Refugio", trazo: '<path d="M12 4.6L2.8 19.6h18.4z"/><path d="M12 4.6L8.4 19.6 12 15.2l3.6 4.4z"/>' },
      { nombre: "Cima",    trazo: '<path d="M3 19.2l7-11.2 4 5.7 2.2-2.9 5.8 8.4z"/><path d="M10 8V3.4"/><path d="M10 3.9l4.4 1.5L10 7z"/>' },
      { nombre: "Norte",   trazo: '<path d="M12 2.6l2.5 6.9 6.9 2.5-6.9 2.5-2.5 6.9-2.5-6.9L2.6 12l6.9-2.5z"/>' }
    ]
  },
  /* Averno es el tercero construido, y con él se cierra la pareja que
     `mundos/MUNDOS.md` puso por delante. Va con Pro como los otros doce: de
     los quince, el único que no abre Pro es Reliquia, que es de Fundador.

     **El concepto es demonología cristiana, y lo pidió Eduardo.** Los cinco
     rangos fueron antes los estados del fuego —Ceniza, Chispa, Brasa, Llama,
     Hoguera— y se cambiaron enteros: describían una fogata, que es el tema
     visual del mundo pero no su concepto.

     La línea que separa esto de un disfraz —y es la que hay que sostener al
     tocar cualquier cosa de Averno— es **teología, no utilería**. Cada peldaño
     cita un texto y ninguno es un cuerno, un tridente ni un diablillo: eso es
     lo que se ve infantil, y es exactamente lo que Eduardo pidió evitar.

       Ceniza    «polvo y ceniza» (Job 42:6)
       Sello     el sello con el que se ata y se nombra (Apocalipsis 20:1-3,
                 y los sellos de la Llave Menor de Salomón)
       Leviatán  «no hay sobre la tierra quien se le parezca» (Job 41:33)
       Legión    «Legión me llamo, porque somos muchos» (Marcos 5:9)
       Abadón    el ángel del abismo, rey de las langostas del pozo
                 (Apocalipsis 9:11)

     El orden lo puso Eduardo, y es el que hace que la escalera suba de verdad:
     **lo que quedó, lo que tiene nombre, lo que es grande, lo que es muchos y
     quien reina sobre ellos**. Los dos primeros son cosas y los tres últimos
     son seres, así que el salto de peldaño 2 a 3 es además el salto de ser
     algo a ser alguien.

     Antes iba «Azufre» de segundo, y era el único que no encajaba: una
     sustancia entre cuatro entidades. Su dibujo era ya la cruz de Leviatán, o
     sea que el glifo llevaba el nombre de otro peldaño puesto encima.

     Y pasan las otras dos pruebas que dejó escrita la tanda de Blueprint: de
     todos se puede decir «soy», y **ninguno inflexiona** —dos son cosas y tres
     son nombres propios—, así que «Ahora eres Leviatán» le dice lo mismo a
     todo el mundo. Los títulos de la Goetia —Duque, Marqués, Conde—
     eran lo primero que pedía el tema y se descartaron por eso, no por el
     concepto: es el mismo fallo que costó cambiar «Arquitecto» en Blueprint.

     **Los dibujos son glifos, no criaturas.** Un caput mortuum, un sello
     inscrito, la cruz de Leviatán, tres siluetas encapuchadas y el pentagrama
     invertido. Cinco siluetas que no se parecen entre sí, que es la prueba que
     hay que pasar antes de mirar si cada una es bonita. Una criatura dibujada a 20 px —que es el tamaño al que se pintan—
     solo puede salir caricatura; un glifo a ese tamaño se lee, y además es lo
     que de verdad usaba la tradición. Lo que da el miedo en los dos que llevan
     figura es el HUECO RELLENO, no el detalle: un vacío pintado se lee a
     cualquier tamaño.

     **Ceniza va primero y se queda, decidido por Eduardo.** Queda escrito
     porque el reparo se le ocurre a cualquiera que lo mire: la ceniza es lo
     que queda DESPUÉS del fuego, así que como escalera parece del revés. No
     lo es — el arco es «de las cenizas», que se entiende solo y es el que hace
     que el primer peldaño signifique algo: no empiezas en nada, empiezas en lo
     que quedó. Se propuso Yesca y se descartó. No volver a proponerlo. */
  { id: "averno", nombre: "Averno", listo: true, pro: true, icon: "eclipse", estrena: "2026-09-01",
    premisa: "Piedra quemada con la brasa debajo, y los círculos del poema. Demonología de la que se lee, no de la que se disfraza.",
    rangos: [
      /* **Caput mortuum**, la «cabeza muerta»: el nombre que la alquimia le dio
         al residuo que queda en el fondo después de calcinar, lo que ya no
         sirve para nada más. Es literalmente el concepto de este peldaño, y
         por eso sustituye al montón de ceniza que había antes — «no evoca un
         concepto interesante, ni se entiende», y las dos cosas eran ciertas:
         un montón con una voluta es un montón de cualquier cosa.

         El cráneo es además memento mori, que es cristiano y viejo, no de
         película. Y es la silueta más distinta de las cinco, así que se
         reconoce antes de mirarlo. */
      { nombre: "Ceniza", trazo: '<path d="M12 3.2c4.3 0 7.4 3.1 7.4 7.3 0 2.2-.9 3.6-1.9 4.5-.5.5-.8 1-.8 1.7v1.5c0 1-.8 1.8-1.8 1.8H9.1c-1 0-1.8-.8-1.8-1.8v-1.5c0-.7-.3-1.2-.8-1.7-1-.9-1.9-2.3-1.9-4.5 0-4.2 3.1-7.3 7.4-7.3z"/><ellipse cx="8.9" cy="11.2" rx="1.9" ry="2.2" fill="currentColor" stroke="none"/><ellipse cx="15.1" cy="11.2" rx="1.9" ry="2.2" fill="currentColor" stroke="none"/><path d="M12 13.6l1.3 2.6h-2.6z" fill="currentColor" stroke="none"/>',
        linea: { texto: "Me arrepiento en polvo y ceniza.", fuente: "Job 42:6" } },
      /* **La cruz de Leviatán**, que es el signo del AZUFRE en su forma de cruz:
         doble travesaño sobre una lemniscata. Viene de la alquimía —el azufre
         es uno de los tres principios, con el mercurio y la sal— y de ahí pasó
         al ocultismo, que es por donde casi todo el mundo lo ha visto.

         Se cambió dos veces. El triángulo sobre cruz es el signo alquímico
         más literal del azufre, pero no se reconoce: dibujado a línea sale
         limpio de laboratorio y relleno sale pesado pero mudo. Éste sí se
         reconoce, y esa era la petición de Eduardo: «que se entienda que es
         con qué». Tiene nombre y se puede buscar.

         El sello: el anillo y la figura inscrita dentro. En esa tradición nada
         existe hasta que su sello está trazado, así que éste es el peldaño en
         el que dejas de ser un residuo y pasas a tener nombre.

         **Éste no se toca.** Llegó a ser un hexágono durante un rato: al pasar
         Abadón a pentagrama-en-círculo me pareció que dos glifos «redondos con
         figura dentro» se confundirían, y lo cambié por mi cuenta. Eduardo lo
         devolvió — el encargo era Ceniza, no éste—, y visto puesto tenía razón:
         un pentagrama y un triángulo dentro de un aro no se confunden, porque
         lo que separa un glifo de otro es la FIGURA y no el marco. */
      { nombre: "Sello", trazo: '<circle cx="12" cy="12" r="9.2"/><path d="M12 18.7L5.7 8.1h12.6z"/><circle cx="12" cy="11.4" r="1.7"/>',
        linea: { texto: "Lo ató, y puso su sello sobre él.", fuente: "Apocalipsis 20:2-3" } },
      /* **Leviatán**, y el dibujo pasó a llamarse como lo que ya era. El glifo
         no cambió ni un punto: es la cruz de Leviatán, que entró aquí como el
         signo del azufre y llevaba el nombre de otro peldaño encima. Con el
         reorden que pidió Eduardo el nombre y el dibujo por fin coinciden, que
         es lo que hace que un glifo se entienda sin pie de foto.

         Y de paso el rango deja de ser una sustancia para ser un ser, como los
         dos que vienen detrás. La escalera de arriba abajo queda: lo que
         quedó, lo que tiene nombre, lo que es grande, lo que es muchos y quien
         reina sobre ellos. */
      { nombre: "Leviatán", trazo: '<path d="M12 2.4v12.8"/><path d="M6.6 6h10.8M8.8 9.8h6.4"/><path d="M12 18.4c-1.5-2-2.7-2.9-4.1-2.9-1.5 0-2.6 1.2-2.6 2.7s1.1 2.7 2.6 2.7c1.4 0 2.6-.9 4.1-2.5z"/><path d="M12 18.4c1.5-2 2.7-2.9 4.1-2.9 1.5 0 2.6 1.2 2.6 2.7s-1.1 2.7-2.6 2.7c-1.4 0-2.6-.9-4.1-2.5z"/>',
        linea: { texto: "No hay sobre la tierra quien se le parezca.", fuente: "Job 41:33" } },
      /* Tres siluetas encapuchadas, LAS TRES IGUALES y la de en medio delante,
         con el hueco de la cara relleno. Dos correcciones seguidas:

         Primero eran cinco trazos verticales sobre una línea, y el problema no
         era el estilo: se leía como una GRÁFICA DE BARRAS. Después eran tres
         siluetas pero las de los lados iban abiertas y a otra escala, y la de
         la derecha «se veía muy distinta» — con razón: eran otro dibujo. Ahora
         es la MISMA figura tres veces, y lo único que cambia es el tamaño.

         El hueco relleno donde va la cara es lo que la vuelve demoníaca sin
         dibujar un demonio. Una cara a 20 px es una caricatura; un hueco a
         20 px es una presencia. */
      { nombre: "Legión", trazo: '<path d="M5.6 12.9c1.14 0 1.9.91 1.9 2.13 0 .61-.15 1.14-.46 1.52 1.14.53 1.82 1.52 1.82 2.96v1.9H2.34v-1.9c0-1.44.68-2.43 1.82-2.96-.3-.38-.46-.91-.46-1.52 0-1.22.76-2.13 1.9-2.13z"/><path d="M18.4 12.9c1.14 0 1.9.91 1.9 2.13 0 .61-.15 1.14-.46 1.52 1.14.53 1.82 1.52 1.82 2.96v1.9h-6.52v-1.9c0-1.44.68-2.43 1.82-2.96-.3-.38-.46-.91-.46-1.52 0-1.22.76-2.13 1.9-2.13z"/><path d="M12 10.2c1.5 0 2.5 1.2 2.5 2.8 0 .8-.2 1.5-.6 2 1.5.7 2.4 2 2.4 3.9v2.5H7.7v-2.5c0-1.9.9-3.2 2.4-3.9-.4-.5-.6-1.2-.6-2 0-1.6 1-2.8 2.5-2.8z"/><ellipse cx="12" cy="12.9" rx="1.35" ry="1.75" fill="currentColor" stroke="none"/>',
        linea: { texto: "Legión me llamo, porque somos muchos.", fuente: "Marcos 5:9" } },
      /* **Abadón**, y el quinto rango deja de ser un sitio para ser ALGUIEN.
         Era «Abismo» y su dibujo —el brocal que se estrecha con el hueco
         relleno— «parecía un paliacate de boca de vaquero», que es exactamente
         lo que era. Cambiar el dibujo no bastaba: el problema venía del
         concepto, porque un agujero no tiene silueta.

         Abadón sí. Apocalipsis 9:11 le pone nombre al rey de las langostas del
         pozo: «tienen por rey al ángel del abismo, cuyo nombre en hebreo es
         Abadón, y en griego Apolión». Es un ser y no un lugar, y además cierra
         mejor la escalera: de Legión —eres muchos— a Abadón —eres a quien esos
         muchos responden—.

         El dibujo es **el pentagrama invertido en su círculo**, y lo eligió
         Eduardo enseñando la imagen. Sustituye a la corona sobre la masa
         oscura, que se leía bien pero era un invento; ésta es la marca que
         cualquiera reconoce sin que se la expliquen, que es lo que se le pide
         al último peldaño.

         **El nombre se queda en Abadón** aunque el glifo ya no lo retrate: el
         pentagrama no es el emblema de un ser concreto sino el de la casa
         entera, y Abadón es quien reina en ella. Cambiarlo a Bafomet ataría el
         rango al dibujo, y de paso perdería la cita de Apocalipsis, que es lo
         que sostiene que esto sea teología y no utilería.

         Y con esto cae la línea que decía «nada de cuernos ni pentagramas» en
         la premisa del mundo: era mía, es de cuando el concepto era otro, y la
         decisión de ahora es de Eduardo. Lo que sigue en pie de aquella regla
         es lo que de verdad importaba: nada de diablillos ni tridentes. */
      { nombre: "Abadón", trazo: '<circle cx="12" cy="12" r="9.6"/><path d="M12 20.6L6.94 5.04L20.18 14.66L3.82 14.66L17.06 5.04z"/>',
        linea: { texto: "Su rey es el ángel del abismo, cuyo nombre es Abadón.", fuente: "Apocalipsis 9:11" } }
    ] },
  /* El nombre de éste está decidido; sus dibujos se hacen cuando se construya
     el mundo, con el resto de sus vectores. Escribirlo ahora sin dibujo no es
     una promesa a medias: mientras el mundo no exista, esta lista no la lee
     nadie. */
  { id: "consola",  nombre: "Consola",
    rangos: ["Bit", "Byte", "Proceso", "Núcleo", "Sistema"].map(n => ({ nombre: n })) },
  /* Blueprint es el segundo construido, y el orden lo dejó escrito
     `mundos/MUNDOS.md`: Averno y Blueprint por delante, pero el motor se
     estrena con los baratos, y Blueprint casi no lleva imágenes. Va con Pro y
     no con Fundador: de los quince mundos, el único que no abre Pro es
     Reliquia.

     Los cinco rangos son los OFICIOS del taller de dibujo, de quien afila
     lápices a quien firma el plano. Se cambiaron enteros porque los primeros
     —Boceto, Trazo, Plano, Corte, Obra— fallaban por dos sitios a la vez, y
     lo cerró Eduardo con una sola pregunta: «¿no te parece raro decir soy
     nivel Trazo?».

     El primero es que NO SUBEN. Un trazo es más pequeño que un boceto, y un
     corte no va después de un plano: es una VISTA de ese mismo plano. Una
     escalera cuyos peldaños no crecen no es una escalera. Compárese con
     Reliquia —Hallazgo, Pieza, Colección, Sala, Legado— o con Arboleda, donde
     cada nombre solo se le puede ocurrir al anterior.

     El segundo es que eran MARCAS SOBRE UN PAPEL, y un rango es lo que la
     persona ES. De un oficio sí se puede decir «soy», y esa es toda la
     diferencia entre esta lista y la de antes.

     Y los dos últimos cambiaron OTRA VEZ, y por dos razones que Eduardo vio
     antes que nadie. La primera: «Maestro de obra» y «Arquitecto» TIENEN
     GÉNERO, y la app no pregunta el tuyo a propósito — así que a la mitad de
     la gente le decía el nombre equivocado en la frase «Ahora eres X», que es
     la celebración más grande que tiene la app. La segunda: «arquitecto» es
     además un título con cédula, y decírselo a un ingeniero civil es meterse
     en un pleito de gremios que a Norata no le toca.

     El límite que salió de buscar sustitutos, y conviene saberlo antes de
     proponer otro: **el español genera con género casi todos los nombres de
     oficio.** Las únicas familias que no lo llevan son `-ista`, `-ante/-ente`,
     `-e` y `-az`, y esas terminaciones se concentran en el vocabulario
     técnico. Los tres primeros caen ahí por suerte y además son palabras
     cálidas; para la cima de un oficio de la construcción NO EXISTE una
     palabra española que sea a la vez cálida, cotidiana y sin género. Por eso
     la cima dejó de ser un puesto.

     Y los dibujos son INSTRUMENTOS y no personas, que es la parte que hay que
     entender antes de tocarlos: cinco figuras humanas no se distinguen a 20 px
     —que es el tamaño al que se pintan—, mientras que un lápiz, una escuadra,
     un compás, un casco y un hilo guía se leen de un vistazo y además escalan
     solos: se te da el lápiz, luego la regla, luego decides tú, luego
     respondes por la obra entera, y al final eres la línea con la que se
     alinean los demás. */
  { id: "plano", nombre: "Blueprint", listo: true, pro: true, icon: "map", estrena: "2026-09-01",
    premisa: "El papel de plano: retícula de dos pesos, cotas con puntas de flecha y marcas de sección. Todo lo tuyo, todavía en obra.",
    rangos: [
      /* El lápiz: lo primero que te dan y lo único que sabes usar. */
      { nombre: "Aprendiz", trazo: '<path d="M5 19l.9-3.7L16.4 4.8a2 2 0 012.8 2.8L8.7 18.1z"/><path d="M14.2 7l2.8 2.8"/>' },
      /* La escuadra, con su hueco: ya trazas derecho lo que otro pensó. */
      { nombre: "Dibujante", trazo: '<path d="M4 19.6h16.4L4 5.4z"/><path d="M7.4 16.6h8L7.4 9.4z"/>' },
      /* El compás: dejas de copiar y empiezas a decidir dónde van las cosas. */
      { nombre: "Proyectista", trazo: '<circle cx="12" cy="4.8" r="1.6"/><path d="M11.2 6.2L6.4 20M12.8 6.2L17.6 20"/><path d="M8 16.4a8.4 8.4 0 008 0"/>' },
      /* El casco: lo que te pones cuando la obra entera es asunto tuyo. */
      { nombre: "Contratista", trazo: '<path d="M2.8 17.6h18.4"/><path d="M5 17.6v-2.4a7 7 0 0114 0v2.4"/><path d="M9.8 9.4V6.4a1.6 1.6 0 011.6-1.6h1.2a1.6 1.6 0 011.6 1.6v3"/>' },
      /* El hilo tenso entre dos estacas, con su plomada colgando: en una obra
         eso ES la guía, la referencia con la que se aploma todo lo demás. Por
         eso este rango no habla de ti sino de los demás. */
      { nombre: "Guía", trazo: '<path d="M2.8 7h18.4"/><path d="M6 3.8v6.4M18 3.8v6.4"/><path d="M12 7v6.2"/><path d="M12 13.2l2.2 3-2.2 2.8-2.2-2.8z"/>' }
    ] },
  /* Reliquia es el primero construido, y va antes que Averno y Blueprint
     porque lo decidió Eduardo: es lo único que Fundador tiene además de Pro
     —`LIMITES` no tiene entrada de fundador, así que Fundador ES Pro sin
     fecha— y un pago único de $890 necesita algo que se vea.

     `listo: true` es lo que lo separa de los otros cuatro: sus nombres están
     decididos, pero sin mundo detrás no se ofrecen. `plan: "fundador"` no es
     lo mismo que `pro`: éste NO se abre pagando cada mes. */
  { id: "reliquia", nombre: "Reliquia", listo: true, plan: "fundador", icon: "gem", estrena: "2026-09-01",
    premisa: "Una pieza en su vitrina: forro de terciopelo, marco de latón y el vidrio por encima.",
    rangos: [
      { nombre: "Hallazgo", trazo: '<path d="M11 3.6l7.4 4.3v8.2L11 20.4 3.6 16.1V7.9z"/><path d="M11 3.6v16.8"/>' },
      { nombre: "Pieza",    trazo: '<path d="M12 3.4l3.1 5.1 5.7 1.3-3.9 4.5.5 5.9-5.4-2.4-5.4 2.4.5-5.9L3.2 9.8l5.7-1.3z"/>' },
      { nombre: "Colección", trazo: '<rect x="3.2" y="4.2" width="7" height="7" rx="1"/><rect x="13.8" y="4.2" width="7" height="7" rx="1"/><rect x="3.2" y="12.8" width="7" height="7" rx="1"/><rect x="13.8" y="12.8" width="7" height="7" rx="1"/>' },
      { nombre: "Sala",     trazo: '<path d="M3 20V9.6L12 4l9 5.6V20z"/><path d="M8 20v-6.4h8V20"/><path d="M3 20h18"/>' },
      { nombre: "Legado",   trazo: '<path d="M12 2.8l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.1l5-.7z"/><path d="M8.4 15.8L7 21.2l5-2.6 5 2.6-1.4-5.4"/>' }
    ] }
];

function mundoPorId(id) {
  return MUNDOS.filter(m => m.id === id)[0] || null;
}

/* Lo que `js/02b-expedicion.js` pregunta antes de dibujar un rango. Devuelve
   null cuando la apariencia puesta es la casa o un ambiente — **un ambiente
   NUNCA renombra los rangos**: cambia la luz, no el vocabulario. */
function rangosDeApariencia() {
  const m = mundoPorId(apariencia());
  return m ? m.rangos : null;
}

function ambientePorId(id) {
  return AMBIENTES.filter((a) => a.id === id)[0] || null;
}

/* Un ambiente o un mundo, que para casi todo el motor son lo mismo: una
   apariencia. Solo se separan donde importa —un mundo renombra los rangos y un
   ambiente no, y un mundo trae su propio archivo—. Los mundos sin `listo` no
   cuentan: sus nombres están escritos porque el plan vive mejor en el código
   que en la cabeza de nadie, pero mientras no exista el mundo no se ofrece. */
function aparienciaPorId(id) {
  return ambientePorId(id) || MUNDOS.filter((m) => m.id === id && m.listo)[0] || null;
}

function esMundo(id) {
  const m = mundoPorId(id);
  return !!(m && m.listo);
}

/* ---- El archivo de los mundos, que se pide cuando hace falta ----
   `css/mundos.css` no está en `index.html` ni en `ASSETS` a propósito: lleva la
   tipografía y las texturas del mundo, y eso son decenas de kilobytes que no
   tiene por qué bajarse quien nunca va a encenderlo. Es la regla que dejó
   escrita la caché de 0.7.38.

   Se engancha una sola vez y se deja puesto: quitarlo al volver a la casa
   obligaría a bajarlo otra vez en el siguiente vistazo, y probar dos mundos
   seguidos es exactamente lo que alguien hace la primera tarde. */
let mundosPedidos = false;

function pedirLosMundos() {
  if (mundosPedidos) return;
  mundosPedidos = true;
  /* Puede venir ya enganchada desde el script de arriba de `index.html`, que la
     pide cuando lo guardado es un mundo para que no haya fogonazo. Engancharla
     dos veces no rompe nada pero la pide dos veces. */
  /* Con `^=` y no con `=`: la dirección lleva una huella detrás (`?h=…`) que
     cambia cada vez que cambia el archivo, y con la igualdad exacta este
     ancla dejaba de reconocer el `link` que ya puso el script de arriba y lo
     pedía dos veces. */
  if (document.querySelector('link[href^="css/mundos.css"]')) { pintarColorDeBarra(); return; }
  const l = document.createElement("link");
  l.rel = "stylesheet";
  /* La HUELLA del contenido va en la dirección, y la pone `mundos/app.py` al
     generar el archivo. Sin ella, un aparato podía quedarse con una copia
     vieja PARA SIEMPRE: este archivo no está en ASSETS —pesa lo que pesa un
     mundo—, así que no lo renueva la instalación; se pide suelto y lo que
     llegue se guarda en la caché de esa versión, y a partir de ahí ya es un
     acierto. Con GitHub Pages tardando un minuto en publicar, hay una ventana
     en la que `sw.js` ya es el nuevo y esto todavía es lo viejo: quien abra
     ahí se queda el archivo viejo con el número de versión nuevo puesto.
     Reproducido, y es lo que pasó con la 0.7.55.3. Cambiando la dirección,
     una copia vieja ni siquiera es la misma cosa. */
  l.href = "css/mundos.css?h=28e3f8e4db";
  /* La franja del navegador, otra vez, cuando el archivo ya está. Se pinta
     leyendo `--bg`, y hasta que este `link` carga `--bg` sigue siendo el de la
     casa: sin esto, un mundo se quedaba con la ceja azul de la casa encima.
     Medido con Reliquia: la etiqueta decía #10151d y su fondo es #100c1a. */
  l.addEventListener("load", () => pintarColorDeBarra());
  document.head.appendChild(l);
}

/* ---- Qué apariencia está puesta ---- */

function apariencia() {
  const raiz = document.documentElement;
  return raiz.getAttribute("data-apariencia") || "casa";
}

/* Lo que se guardó, que no siempre es lo que se ve: una apariencia de prueba
   vive en `sessionStorage` y desaparece al cerrar la pestaña. */
function aparienciaGuardada() {
  try { return localStorage.getItem(APARIENCIA_LLAVE) || "casa"; } catch (e) { return "casa"; }
}

/* ---- Quién puede usar qué ----
   Devuelve `true`, o el motivo por el que todavía no. Dos puertas y en este
   orden: primero el NIVEL, que es lo que se gana, y después el PLAN, que es
   lo que se paga. El orden importa para lo que se le dice a la persona — a
   quien todavía no llega al nivel no se le ofrece pagar, se le dice cuánto
   le falta. Cobrar por saltarse la escalera es justo lo que rompería la
   escalera. */
function aparienciaDisponible(id) {
  const a = aparienciaPorId(id);
  if (!a) return "no existe";
  /* Un mundo de fundador NO se abre pagando cada mes, y ésa es toda la
     diferencia que se compra. Va antes que la pregunta del nivel porque no hay
     nivel que lo abra: no es una escalera, es una compra. */
  if (a.plan === "fundador") {
    const p = typeof PLAN !== "undefined" && PLAN ? PLAN.plan : "";
    return p === "fundador" ? true : "fundador";
  }
  /* El nivel sale de `js/02b-expedicion.js`, que es el motor de la casa. Este
     archivo NO cuenta puntos: hubo un momento en que existieron dos motores a
     la vez —uno aquí y otro allá— y los dos declaraban `EXP_PUNTOS` en el
     ámbito global, que es un SyntaxError y la app entera dejaba de arrancar.
     Un solo motor, y las apariencias solo le preguntan. */
  if (a.abre && typeof nivelExpedicion === "function") {
    if (nivelExpedicion().nivel < a.abre) return "nivel";
  }
  if (a.pro && typeof planPermite === "function" && !planPermite("apariencia")) return "pro";
  return true;
}

/* ---- Ponérsela ---- */

function ponerApariencia(cual, opciones) {
  const op = opciones || {};
  const a = aparienciaPorId(cual) ? cual : "casa";
  const raiz = document.documentElement;
  if (a !== "casa" && aparienciaDisponible(a) !== true && !op.forzar) return false;
  /* El archivo del mundo, antes de poner el atributo. Si llegara después se
     vería un parpadeo con el mundo a medias: los colores puestos y la letra y
     la textura todavía en camino. */
  if (esMundo(a)) pedirLosMundos();

  /* Un instante sin transiciones, y por el mismo motivo exacto que
     `ponerTema`: en esta app una transición sobre una propiedad cuyo valor
     sale de una variable se queda CONGELADA —Chrome no se entera del cambio y
     deja el color clavado en el primero que vio, para siempre—. Cambiar de
     apariencia cambia veinte variables de golpe, así que es el mismo caso que
     el modo claro pero más grande.
     Se apagan, se cambia, se fuerza el recálculo leyendo un estilo, y se
     devuelven en el siguiente turno con un temporizador. Con
     `requestAnimationFrame` no vale: en una pestaña en segundo plano el
     navegador no dibuja cuadros, así que ese aviso no llega nunca y la app se
     quedaría SIN transiciones para siempre. */
  raiz.classList.add("cambiando-modo");
  if (a === "casa") raiz.removeAttribute("data-apariencia");
  else raiz.setAttribute("data-apariencia", a);
  getComputedStyle(raiz).backgroundColor;   // obliga a recalcular ya, no luego
  setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);

  if (!op.soloVista) {
    try { localStorage.setItem(APARIENCIA_LLAVE, a); } catch (e) {}
  }
  pintarColorDeBarra();
  return true;
}

/* La franja del navegador de arriba —y en Android la barra de estado de la app
   instalada— no la pinta el CSS. `ponerTema` la cambia a mano con dos colores
   escritos; aquí no se puede, porque cada apariencia tiene los suyos y serían
   catorce parejas que mantener a mano. Se LEE el fondo ya calculado, que
   siempre dice la verdad aunque mañana entre un mundo nuevo. */
function pintarColorDeBarra() {
  const viejo = document.querySelector('meta[name="theme-color"]');
  if (!viejo) return;

  /* El color se lee del fondo YA CALCULADO y no de la variable en crudo: una
     apariencia puede declarar su página como degradado, y un degradado no vale
     para esta etiqueta. Antes se leía `--bg` y se abandonaba si traía un
     paréntesis, y abandonar quería decir dejar puesto el color de otra cosa. */
  const raiz = document.documentElement;
  let color = getComputedStyle(raiz).getPropertyValue("--bg").trim();
  if (!color || color.indexOf("(") !== -1) {
    const c = getComputedStyle(document.body || raiz).backgroundColor;
    if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) color = c;
  }
  if (!color || color.indexOf("(") !== -1) return;

  /* Y se REEMPLAZA la etiqueta en vez de cambiarle el atributo. Parece lo
     mismo y no lo es: Chrome en Android elige el color de los iconos del
     sistema —la hora, la señal, la batería— al leer esta etiqueta, y cambiando
     solo el `content` hay versiones que repintan el fondo de la barra y NO
     vuelven a elegir el color de los iconos. Resultado: iconos claros sobre una
     barra que acaba de ponerse clara, o sea una barra ilegible, que es
     exactamente lo que Eduardo veía al pasar la app a modo día. Quitar y poner
     el elemento la obliga a decidir otra vez. */
  if (viejo.getAttribute("content") === color) return;
  const nuevo = document.createElement("meta");
  nuevo.setAttribute("name", "theme-color");
  nuevo.setAttribute("content", color);
  viejo.parentNode.replaceChild(nuevo, viejo);
}

/* ---- La prueba con enlace ----
   Como los tonos del modo claro en 0.7.3.1: se sube apagada y se enciende con
   una dirección. En `sessionStorage` y no en `localStorage` a propósito, para
   que no se quede pegada como si fuera un ajuste; con la pestaña cerrada
   desaparece. El rótulo fijo es parte de la receta: sin él es fácil olvidar
   que la pestaña está en modo prueba y acabar juzgando la app de verdad por
   lo que se ve ahí. */
function aparienciaDePrueba() {
  let cual = null;
  try { cual = sessionStorage.getItem(APARIENCIA_PRUEBA); } catch (e) {}
  if (!cual) return null;
  if (!aparienciaPorId(cual)) return null;
  return cual;
}

function rotuloDePrueba(cual) {
  if (document.getElementById("aparienciaPrueba")) return;
  const n = aparienciaPorId(cual);
  const d = document.createElement("div");
  d.id = "aparienciaPrueba";
  d.textContent = "Apariencia de prueba: " + (n ? n.nombre : cual);
  document.body.appendChild(d);
}

/* ---- El arranque ----
   Lo llama `js/11-arranque.js`. El atributo ya lo puso el script de arriba de
   `index.html` antes de pintar; esto es lo que hace falta después: el rótulo,
   el color de la barra, y quitar una apariencia que se guardó cuando se podía
   y ahora ya no —alguien que dejó de pagar con Escarcha puesta—. */
function arrancarApariencia() {
  const prueba = aparienciaDePrueba();
  if (prueba) {
    ponerApariencia(prueba, { soloVista: true, forzar: true });
    rotuloDePrueba(prueba);
    pintarColorDeBarra();
    return;
  }
  const puesta = apariencia();
  /* Si lo guardado es un mundo, su archivo hace falta ANTES de nada: el
     atributo ya lo puso el script de arriba de `index.html` para que no haya
     fogonazo, así que sin esto la app arrancaría con el atributo puesto y sin
     ninguna regla que lo lea — o sea, con la casa pintada y el nombre de otro. */
  if (esMundo(puesta)) pedirLosMundos();
  /* AQUÍ NO SE QUITA NADA, y esto costó un fallo que Eduardo vio en su
     teléfono: «no cambia el tema y quita el recolor».

     Antes se preguntaba aquí si la apariencia guardada seguía estando
     permitida, y se quitaba si no. El problema es CUÁNDO corre esto: al
     arrancar, antes de que el servidor haya contestado quién eres. En ese
     instante tu nivel es 0 y tu plan es el libre, así que la puerta decía que
     no y la apariencia se caía — y no había segunda mirada. Medido: con
     `norata-apariencia = duna` guardado, el atributo salía en null y seguía en
     null aunque después el nivel llegara a 50.

     Ahora se pinta lo guardado y la puerta se revisa en `refrescarApariencia()`,
     cuando el servidor ya contestó. */
  pintarColorDeBarra();
}

/* Volver a mirar si la apariencia puesta sigue permitida. La llaman
   `revisarAdmin` cuando el servidor contesta y los dos sitios que mueven el
   plan, que es exactamente cuando la respuesta puede cambiar.

   Congelar, nunca quitar: si ya no se puede, se vuelve a la casa en vez de
   dejar la app pintada con algo que el servidor no reconoce, pero la elección
   guardada NO se borra — el día que vuelva a pagar, vuelve su apariencia. */
function refrescarApariencia() {
  const puesta = apariencia();
  const raiz = document.documentElement;
  const puedo = puesta === "casa" || aparienciaDisponible(puesta) === true;
  const ahora = raiz.getAttribute("data-apariencia") || "casa";
  const debe = puedo ? puesta : "casa";
  if (ahora === debe) return;

  if (debe !== "casa" && esMundo(debe)) pedirLosMundos();
  raiz.classList.add("cambiando-modo");
  if (debe === "casa") raiz.removeAttribute("data-apariencia");
  else raiz.setAttribute("data-apariencia", debe);
  getComputedStyle(raiz).backgroundColor;
  setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);
  pintarColorDeBarra();
}

/* ================= La pantalla de Apariencia =================
   Vive DENTRO de Ajustes y no en una pantalla nueva ni en una pestaña de la
   barra: una tienda con su propio botón abajo es un mostrador en la recámara.
   Y la app ya tenía el sitio natural — el interruptor de sol y luna vive en el
   índice de Ajustes, y elegir ambiente es la misma familia de decisión. El sol
   y la luna NO se mueven de ahí: están dos centímetros más arriba en la misma
   pantalla, y sacarlos de su sitio para hacerle hueco a esto sería cobrarle el
   cambio a quien no viene a comprar. */

/* Desde 0.7.41 la sección es de todos: el nivel de expedición existe, así que
   un ambiente que se desbloquea ya sabe cuándo se desbloqueó y la escalera
   significa algo. Antes iba detrás de `?apariencia=` justamente porque
   enseñar cinco premios que nadie podía ganarse los regalaba. */
const APARIENCIA_PUBLICA = true;

function aparienciaVisibleEnAjustes() {
  return APARIENCIA_PUBLICA || !!aparienciaDePrueba();
}

/* ---- Por qué no se puede, dicho como lo diría una persona ----

   Devuelve las CUATRO cosas que hacen falta para contarlo y no solo la chapa:
   la chapa que va en la tarjeta, el título y el párrafo que se leen en el
   escaparate, y qué botón ofrecer. Antes esto devolvía dos palabras —«Nivel
   5»— y con esas dos palabras se pintaba todo: una tarjeta que dice «Nivel 5»
   no explica que ese nivel se gana usando la app y no se compra, ni que Marea
   además viene con el plan. Un candado sin motivo es una lista de lo que te
   falta; con el motivo entero es una meta.

   El ORDEN de las dos puertas no cambia, y es la decisión de fondo: primero el
   NIVEL, que se gana, y después el PLAN, que se paga. A quien todavía no llega
   al nivel no se le ofrece pagar — cobrar por saltarse la escalera es
   exactamente lo que rompería la escalera. Por eso el caso `nivel` nombra el
   plan dentro del texto cuando también hace falta, pero no saca botón. */
function estadoApariencia(a) {
  const puede = aparienciaDisponible(a.id);
  /* Abierto, pero SIGUE SIENDO de plan, y eso se sigue diciendo — con la
     insignia sola y sin texto. Lo pidió Eduardo: una cápsula que dice «PRO»
     sobre algo que ya tienes es ruido, pero borrarla del todo hace que un tema
     de plan y uno gratis se vean idénticos en cuanto pagas, y entonces lo que
     compraste deja de notarse. La piedra sin texto dice «esto viene con tu
     plan» sin ocupar sitio ni sonar a candado. */
  if (puede === true) {
    return {
      ok: true,
      clase: a.plan === "fundador" ? "fundador" : "pro",
      insignia: a.plan === "fundador" ? "plan-fundador" : (a.pro ? "plan-pro" : null)
    };
  }

  const pro = typeof NOMBRE_PRO === "string" ? NOMBRE_PRO : "Norata Pro";
  const fun = typeof NOMBRE_FUNDADOR === "string" ? NOMBRE_FUNDADOR : "Norata Fundador";

  if (puede === "nivel") {
    /* El nivel de verdad, para poder decir cuánto falta y no solo dónde está la
       meta. «Te faltan dos» mueve a alguien; «Nivel 5» a secas es un número. */
    const n = typeof nivelExpedicion === "function" ? nivelExpedicion().nivel : 0;
    const faltan = Math.max(1, a.abre - n);
    return {
      ok: false, clase: "nivel", chapa: "Nivel " + a.abre, corta: "Nivel " + a.abre, insignia: null,
      titulo: faltan === 1 ? "Te falta un nivel" : "Te faltan " + faltan + " niveles",
      texto: a.nombre + " se abre en el nivel " + a.abre + " de expedición y vas en el " +
        n + ". Ese nivel no se compra: sube solo con lo que haces en la app." +
        (a.pro ? " Al llegar arriba se enciende con " + pro + "." : ""),
      /* Sin botón, y es lo mismo que dice el comentario de arriba: aquí no se
         ofrece pagar. La salida de este candado es usar la app. */
      accion: null
    };
  }

  if (puede === "fundador") {
    const precio = (typeof PLANES !== "undefined" && PLANES.fundador) ? PLANES.fundador.precio : "";
    return {
      ok: false, clase: "fundador", chapa: "Solo Fundador", corta: "Fundador", insignia: "plan-fundador",
      titulo: a.nombre + " es de " + fun,
      texto: a.nombre + " es lo único que " + fun + " tiene además de Pro" +
        (precio ? ": un pago único de " + precio + ", sin fecha y sin renovaciones." : ".") +
        " No se abre con el plan mensual ni con el anual.",
      accion: { texto: "Ver " + fun, como: "fundador", insignia: "plan-fundador" }
    };
  }

  return {
    ok: false, clase: "pro", chapa: "Con " + pro, corta: "Pro", insignia: "plan-pro",
    titulo: a.nombre + " viene con " + pro,
    /* Un mundo y un ambiente no se venden con la misma frase porque no son lo
       mismo, y decir «viene con Pro» de los dos es justo la confusión que
       `apariencias/LEEME.md` existe para evitar. */
    texto: esMundo(a.id)
      ? "Un mundo es la app hecha de otro material: su tipografía, sus texturas, su marco y sus propios nombres para cada rango del camino. Con " + pro + " se abren los tres construidos y los que lleguen después."
      : "El nivel ya lo tienes; lo que falta es el plan. Con " + pro + " se abren todas las apariencias, las de hoy y las que vengan.",
    accion: { texto: "Ver " + pro, como: "pro", insignia: "plan-pro" }
  };
}

/* Se queda porque la chapa suelta sigue haciendo falta en la reja, y porque
   es el nombre por el que se entra desde fuera de este archivo. */
function motivoApariencia(a) {
  const e = estadoApariencia(a);
  return e.ok ? null : e.chapa;
}

/* La chapa del candado, escrita UNA vez porque sale en tres sitios —la tarjeta
   de la galería, la ventana de detalle y el pie de un ambiente— y los tres
   tienen que decir lo mismo. La insignia solo la llevan las dos que se pagan:
   «Nivel 5» con la piedra de Pro al lado diría que el nivel se compra, que es
   justo lo que el texto de al lado se esfuerza en negar.

   Y va en DOS largos. En la tarjeta, corto —«Pro», «Fundador»— porque ahí
   compite con el nombre del mundo y no puede ganarle: una cápsula que dice
   «CON NORATA PRO» en negrita al lado de «Averno» se lee antes que el mundo,
   que es lo contrario de lo que hace una tienda. Lo paró Eduardo. En la ficha
   del escaparate va entero, que es donde hay sitio y donde de verdad se está
   decidiendo.

   Y hay un tercer largo: NINGUNO. Lo que ya está abierto pero sigue siendo de
   plan lleva la piedra sola, sin una palabra — dice «esto viene con tu plan»
   sin sonar a candado. Lo que es gratis no lleva nada. */
function chapaApariencia(e, corta) {
  if (e.ok) {
    if (!e.insignia) return "";
    return `<span class="mun-p ap-${e.clase} ap-tengo"
      title="Viene con tu plan" aria-label="Viene con tu plan">${icon(e.insignia, 11)}</span>`;
  }
  return `<span class="mun-p ap-${e.clase}">` +
    (e.insignia ? icon(e.insignia, 10) : "") +
    `<span>${escapeHtml(corta ? (e.corta || e.chapa) : e.chapa)}</span></span>`;
}

/* Y la marca de lo recién llegado. Va en menta y sin insignia: no dice nada de
   planes, dice «esto no estaba la última vez». */
function novedadApariencia(a) {
  return esNovedad(a) ? '<span class="ap-nueva">Nuevo</span>' : "";
}

/* ---- `casa` tiene DOS nombres, y no es un descuido ----

   Ambiente y mundo son dos ejes, y `casa` es el punto de partida de los dos: es
   el recolor de partida —**Norata Clásico**— y además el mundo de partida
   —**Noche de expedición**—. Lo separó Eduardo, y separarlo arregla de paso una
   mentira que llevaba puesta la fila de los mundos: decía «con el ambiente que
   lleves puesto», y elegirla te quitaba también el recolor. Claro que te lo
   quita: ambiente y mundo comparten UN atributo —son excluyentes a propósito,
   está arriba— así que volver al mundo de partida es volver entero.

   Cuál de los dos se enseña lo decide por cuál de las dos rejas se tocó, que
   es lo que recuerda `miradaComoMundo`. Es el único sitio de la app donde un
   dos maneras, y por eso está escrito aquí y no repartido. */
const CASA_MUNDO = {
  nombre: "Noche de expedición",
  premisa: "El mundo de partida: el material original de Norata, sin forro ni marco. Elegirlo te quita el mundo y el recolor que lleves puestos."
};

function nombreApariencia(a, comoMundo) {
  return (comoMundo && a.id === "casa") ? CASA_MUNDO.nombre : a.nombre;
}

/* ---- Y lo que pasa al tocar un candado de los que se pagan ----

   Va DIRECTO al panel del plan, que es donde están los dos precios, lo que abre
   cada uno y los botones de pagar. Una sola pantalla y se acabó.

   Llegó a pasar antes por `topeAlcanzado("apariencia")`, el cuadro que sale al
   llenar una rama de talentos: título, lo que abre, el precio y un botón que
   lleva… al panel del plan. O sea que para comprar había que atravesar la ficha
   del escaparate —que ya explica por qué está cerrado—, luego un cuadro que
   vuelve a explicarlo con otras palabras, y solo entonces llegabas a la tabla.
   Tres pantallas diciendo lo mismo antes de poder decidir. «Hay demasiadas
   ventanas emergentes», y tenía razón: en este camino ese cuadro no añade nada
   que la ficha no haya dicho ya.

   `topeAlcanzado` sigue viva y sigue siendo la buena para los OTROS topes —una
   rama llena, un informe— porque ahí no hay ninguna ficha que haya explicado
   nada antes: el cuadro es la primera y única explicación. Aquí sobra. */
function aparienciaAPagar() {
  if (typeof abrirAjustes === "function") abrirAjustes("plan");
}

/* ================= El preview de un mundo =================

   Un mundo se ve de verdad, con su material, en la ventana que abre su renglón.
   Uno cada vez.

   Por qué hace falta un documento aparte: el CSS de un mundo cuelga de
   `html[data-apariencia="…"]`, así que enseñarlo sin ponérselo a la app entera
   pide un `<html>` propio. Con uno solo eso cuesta un documento y nada más.

   HUBO UNA GALERÍA —los quince a la vez, cada uno con su preview vivo en su
   tarjeta, al estilo de la tienda de Discord— y duró una versión, la 0.7.70.
   Eduardo la vio publicada y volvió a los renglones: una tarjeta grande por
   mundo convierte la sección en algo con más peso que los ambientes de arriba,
   y en esta pantalla las dos cosas son opciones de lo mismo. Con ella se
   fueron el montaje perezoso y el observador de intersección, que existían solo
   para no pagar quince documentos de golpe. Queda apuntado porque la idea es
   buena y puede volver: lo que la hundió fue el peso visual, no el mecanismo.

   Y no lleva ni una línea de JavaScript dentro: lo que cambia —la apariencia y
   el modo claro— se lo pone esta página desde fuera tocando su `<html>`, que
   es del mismo origen. Un documento tonto es un documento que no se
   desincroniza. */

/* La hoja del preview. Va aparte de `estilos.css` y encima: lo que se pinta son
   las cinco cosas que un mundo cambia y un color no —el suelo, el material de
   la tarjeta, el marco, la letra y el nombre del rango—, y con eso basta para
   reconocerlo. Un trozo de app de verdad enseñaría lo mismo con veinte veces
   más reglas. */
const ESCENA_CSS = `
  body { min-height: 0; padding: 13px 12px; overflow: hidden; }
  /* Ni una transición ni una animación, y no es por ahorrar: en esta app una
     transición sobre una propiedad cuyo valor sale de una variable se queda
     CONGELADA en el color de partida para siempre —está contado en CLAUDE.md y
     ya mordió cuatro veces—. Aquí se cambian veinte variables de golpe cada vez
     que alguien cambia de modo, así que sería el caso peor. */
  * { transition: none !important; animation: none !important; }
  .vp-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .vp-tit { font-family: var(--tipo-titulo); font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
  .vp-chapa {
    font-family: var(--tipo-cifra); font-size: 10px; font-weight: 700;
    color: var(--sobre-macizo); background: var(--mint-macizo);
    border-radius: var(--r-pastilla); padding: 2px 8px; white-space: nowrap;
  }
  .vp-caja {
    background: var(--sup-tarjeta);
    border: var(--borde-tarjeta) solid var(--line);
    border-image: var(--marco-tarjeta);
    border-radius: var(--r-caja);
    padding: 10px 11px; margin-bottom: 8px;
  }
  .vp-caja:last-child { margin-bottom: 0; }
  .vp-fila { display: flex; align-items: center; gap: 10px; }
  .vp-aro {
    flex: none; width: 20px; height: 20px; border-radius: var(--r-redondo);
    border: 2px solid var(--mint);
  }
  .vp-tx { min-width: 0; }
  .vp-tx b { display: block; font-size: 12.5px; font-weight: 650; line-height: 1.25; }
  .vp-tx i { display: block; font-style: normal; font-size: 10.5px; color: var(--muted); margin-top: 1px; }
  .vp-carril { height: 5px; border-radius: var(--r-barra); background: var(--carril); margin-top: 10px; overflow: hidden; }
  .vp-carril span { display: block; height: 100%; border-radius: var(--r-barra); background: var(--mint); }
  .vp-rango { display: flex; align-items: center; gap: 10px; }
  .vp-glifo {
    flex: none; display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: var(--r-chico);
    background: var(--mint-soft); color: var(--mint);
  }
  .vp-glifo svg { stroke: currentColor; fill: none; }
`;

/* La dirección de `css/mundos.css` se LEE del `link` que ya está puesto y no se
   escribe aquí, y es a propósito: lleva una huella detrás (`?h=…`) que estampa
   `mundos/app.py` buscando la línea donde se le asigna el `href` al `link` del
   archivo de los mundos. (Esa marca no se escribe aquí ni de ejemplo: el
   sellador la busca por texto, así que un comentario que la cite se sella
   también y se queda con una huella vieja dentro para siempre. Pasó al
   escribir este mismo párrafo.) Escribiendo la dirección otra vez habría un
   segundo sitio que sellar, y el día que el sellado alcance a uno y no al
   otro, la galería enseñaría mundos viejos sin que nada lo delate.

   Y devuelve VACÍO cuando todavía no hay `link`, en vez de la dirección pelada.
   Escribir `css/mundos.css` a secas estuvo puesto media hora y estaba mal: el
   service worker guardaba esa respuesta bajo una dirección sin huella, y a
   partir de ahí ya es un acierto que no se renueva NUNCA. Es el fallo de la
   0.7.55.3 entrando por una puerta nueva. */
function direccionDeLosMundos() {
  const l = document.querySelector('link[href^="css/mundos.css"]');
  return l ? l.getAttribute("href") : "";
}

/* El rango del medio, que es el que mejor cuenta un mundo: ni el primero, que
   suena a empezar, ni el último, que no le toca a casi nadie. */
function escenaRango(id) {
  const m = mundoPorId(id);
  const propios = m && m.listo && m.rangos ? m.rangos : null;
  const casa = typeof EXP_RANGOS !== "undefined" ? EXP_RANGOS : null;
  const r = propios ? propios[2] : (casa ? casa[2] : null);
  if (!r) return { nombre: "Explorador", glifo: "" };
  const glifo = r.trazo && typeof svgDeTrazo === "function"
    ? svgDeTrazo(r.trazo, 19)
    : (r.icon && typeof icon === "function" ? icon(r.icon, 19) : "");
  return { nombre: r.nombre || "", glifo: glifo };
}

/* Un trozo de Norata con las cinco cosas que un mundo cambia y un color no: el
   suelo, el material de la tarjeta, el marco, la letra y el nombre del rango.
   Hubo una versión recortada de esto para las miniaturas de la galería; con la
   galería fuera, queda un solo tamaño. */
function escenaCuerpo(id) {
  const r = escenaRango(id);
  const m = mundoPorId(id);
  return `
    <div class="vp-cab">
      <span class="vp-tit">Tu expedición</span>
      <span class="vp-chapa">Nivel 14</span>
    </div>
    <div class="vp-caja">
      <div class="vp-fila">
        <span class="vp-aro"></span>
        <span class="vp-tx"><b>Leer veinte páginas</b><i>Hoy · todos los días</i></span>
      </div>
      <div class="vp-carril"><span style="width:64%"></span></div>
    </div>
    <div class="vp-caja vp-rango">
      <span class="vp-glifo">${r.glifo}</span>
      <span class="vp-tx"><b>${escapeHtml(r.nombre)}</b><i>${m && m.listo ? "Tu rango en " + escapeHtml(m.nombre) : "Tu rango"}</i></span>
    </div>`;
}

function escenaDoc(id) {
  const claro = document.documentElement.classList.contains("claro");
  const attr = (id && id !== "casa" ? ` data-apariencia="${id}"` : "") + (claro ? ' class="claro"' : "");
  const mundos = direccionDeLosMundos();
  return `<!doctype html><html lang="es"${attr}><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<link rel="stylesheet" href="css/fuente.css">` +
    `<link rel="stylesheet" href="css/estilos.css">` +
    `<link rel="stylesheet" href="css/ambientes.css">` +
    (mundos ? `<link rel="stylesheet" href="${mundos}">` : "") +
    `<style>${ESCENA_CSS}</style></head><body>${escenaCuerpo(id)}</body></html>`;
}

/* El modo claro y el preview son dos ejes independientes, y el de dentro tiene
   que seguir al de fuera: sin esto, cambiar a modo día dejaba el escaparate en
   su noche, enseñando una cara que no es la que se va a llevar. Se mira el
   atributo de `<html>` en vez de engancharse a `ponerTema`, que vive en otro
   archivo — así esto sigue funcionando el día que el modo cambie desde un sitio
   nuevo.

   Va por el `id` y no por un atributo de datos. Buscaba
   `iframe[data-mundo][data-puesto]`, que era el reparto de cuando había una
   galería con un iframe por mundo; con uno solo, `data-puesto` ya no lo pone
   nadie —el escaparate se monta desde `pintarEscena`— así que el selector no
   encontraba nada y el modo día no llegaba adentro. Ningún error, ninguna
   pista: el preview simplemente se quedaba de noche. */
function sincronizarVistas() {
  const f = document.getElementById("ap-vista");
  const d = f && f.contentDocument;
  if (!d || !d.documentElement) return;
  d.documentElement.classList.toggle("claro", document.documentElement.classList.contains("claro"));
}

new MutationObserver(sincronizarVistas)
  .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

/* ================= El escaparate =================

   Un escenario arriba del todo que enseña lo que estás mirando —ambiente o
   mundo, los dos entran igual— y debajo las dos rejas. Tocar una tarjeta MIRA;
   ponérsela es un botón aparte.

   Es la tercera forma que tiene esta pantalla y la que se queda. Hubo una
   ventana emergente por mundo (0.7.71.3) y antes una galería de tarjetas con un
   preview vivo cada una (0.7.70), y las dos fallaban por lo mismo: le daban a
   los mundos un peso que los ambientes no tienen, cuando en esta pantalla las
   dos cosas son opciones de lo mismo. Con un solo escenario arriba, todo lo de
   abajo se ve igual y lo que cambia es lo que enseña el de arriba. */
let aparienciaMirada = null;
let miradaComoMundo = false;

/* El documento entero se rehace SOLO al montar. Cambiar de apariencia es
   cambiar un atributo y el cuerpo, que cuesta un pestañeo en vez de una carga. */
function pintarEscena(id) {
  const marco = document.getElementById("ap-vista");
  if (!marco) return;
  const doc = marco.contentDocument;
  /* Se rehace cuando no hay documento todavía Y cuando el que hay se montó sin
     el archivo de los mundos. Lo segundo pasa de verdad: `pedirLosMundos()`
     engancha el `link` en esta página, y un documento montado un instante antes
     se quedó sin él — cambiarle el atributo después pondría el nombre del mundo
     sin una sola de sus reglas, que se ve como un mundo que no hace nada. */
  const faltaMundos = !!direccionDeLosMundos() &&
    !!(doc && !doc.querySelector('link[href^="css/mundos.css"]'));
  if (!doc || !doc.body || !doc.querySelector("style") || faltaMundos) {
    /* Al montar hay que esperar: el alto de dentro no significa nada hasta que
       las hojas de estilo llegaron, y la letra de un mundo cambia lo que mide
       un renglón. `load` del iframe es después de sus `link`. */
    marco.addEventListener("load", ajustarEscena, { once: true });
    marco.srcdoc = escenaDoc(id);
    return;
  }
  const raiz = doc.documentElement;
  if (id && id !== "casa") raiz.setAttribute("data-apariencia", id);
  else raiz.removeAttribute("data-apariencia");
  raiz.classList.toggle("claro", document.documentElement.classList.contains("claro"));
  doc.body.innerHTML = escenaCuerpo(id);
  ajustarEscena();
}

/* El alto se MIDE, no se escribe. Con un alto fijo los diez de hoy cabían por
   cinco píxeles, y ese margen no es holgura: es la distancia que separa «cabe»
   de «se corta» el día que un mundo traiga la letra un punto más grande
   —`--tipo-titulo-escala` existe justo para eso y ya la mueven dos—.

   Y OJO al comprobarlo: `body.scrollHeight` MIENTE aquí, porque el cuerpo lleva
   `overflow: hidden` y entonces devuelve el alto de la caja y no el del
   contenido. Decía que cabía mientras la barra salía cortada por la mitad. Se
   mide contra el borde de abajo de la última pieza. */
function ajustarEscena() {
  const marco = document.getElementById("ap-vista");
  const doc = marco && marco.contentDocument;
  const ultima = doc && doc.body && doc.body.lastElementChild;
  if (!ultima) return;
  const alto = Math.min(340, Math.max(150, Math.ceil(ultima.getBoundingClientRect().bottom + 13)));
  marco.style.height = alto + "px";
}

/* ---- La ficha de lo que se está mirando ----
   El nombre, la premisa, los cinco nombres del camino si es un mundo, y —si
   está cerrado— por qué y por dónde se abre. Es el sitio donde vive lo que
   antes cabía en un toast de cuatro segundos. */
function pintarFicha(id) {
  const caja = document.getElementById("ap-ficha");
  if (!caja) return;
  /* `casa` existe en AMBIENTES, así que sale por aquí como cualquier otra: es
     el recolor de partida Y el mundo de partida, y son la misma cosa mirada
     desde las dos rejas. */
  const a = aparienciaPorId(id);
  if (!a) return;
  const m = mundoPorId(id);
  const e = estadoApariencia(a);
  const puesta = apariencia() === id;
  const comoMundo = miradaComoMundo;
  const nombre = nombreApariencia(a, comoMundo);
  const premisa = (comoMundo && id === "casa") ? CASA_MUNDO.premisa : (a.premisa || "");

  /* Los cinco nombres del camino, que es lo que de verdad separa un mundo de un
     recolor: un ambiente te cambia la luz, un mundo te renombra lo que llevas
     recorrido. */
  const rangos = m && m.listo && m.rangos
    ? `<div class="ap-rangos"><span class="ap-rot">Tu camino en ${escapeHtml(m.nombre)}</span>
       <p>${m.rangos.map(r => escapeHtml(r.nombre)).join(" · ")}</p></div>` : "";

  const abajo = !e.ok
    ? `<div class="ap-cerrado ap-${e.clase}">
         <b>${escapeHtml(e.titulo)}</b>
         <span>${escapeHtml(e.texto)}</span>
       </div>` +
       /* Menta para Pro y LILA para Fundador: en esta app todo lo de Fundador
          va en lila, y un botón menta que dice «Ver Norata Fundador» lo pinta
          del color del otro plan. El nivel del botón es el mismo —es la única
          acción de la ficha cuando está cerrada—; lo que cambia es el tinte. */
       (e.accion ? `<button type="button" class="btn btn-block ap-btn ${e.clase === "fundador" ? "btn-fundador" : "btn-primary"}" onclick="aparienciaAPagar()">${e.accion.insignia ? icon(e.accion.insignia, 16) : ""}<span>${escapeHtml(e.accion.texto)}</span></button>` : "")
    /* «Aplicar» y no «Ponérmelo», que es lo que decía y lo paró Eduardo. La app
       tutea y habla cerca, pero un botón no es una frase: «Ponérmelo» le pone
       voz de primera persona a algo que solo tiene que decir qué hace, y encima
       suena a ropa. «Aplicar» es lo que hace y se lee igual para un recolor que
       para un mundo. */
    : (puesta
        ? `<p class="ap-yaesta">${icon("check", 15)}<span>Es la que llevas puesta.</span></p>`
        : `<button type="button" class="btn btn-primary btn-block" onclick="elegirApariencia('${id}')">Aplicar</button>`);

  /* El nombre y las cápsulas arriba en su renglón, y la premisa ENTERA debajo.
     Los tres iban en la misma fila y en un teléfono la cápsula larga dejaba la
     premisa en una columna de media pantalla. Medido a 375 px. */
  caja.innerHTML = `
    <div class="ap-cab">
      <span class="ap-ic mues-${id}">${icon((m && m.icon) || (ambientePorId(id) || {}).icon || "compass", 20)}</span>
      <b class="ap-nom">${escapeHtml(nombre)}</b>
      ${comoMundo && id === "casa" ? '<span class="mun-p ap-base">Predeterminado</span>' : ""}
      ${novedadApariencia(a)}
      ${chapaApariencia(e, true)}
    </div>
    <p class="ap-premisa">${escapeHtml(premisa)}</p>
    ${rangos}
    ${abajo}`;
}

/* Mirar no es ponerse. No guarda nada, no recarga y funciona igual con lo
   cerrado — que es justo lo que hay que poder ver antes de pagarlo. */
function mirarApariencia(id, comoMundo) {
  aparienciaMirada = id;
  /* Por cuál de las dos rejas se entró, que solo cambia algo en `casa` —el
     único id que se llama de dos maneras, ver `CASA_MUNDO`—. Se guarda porque
     la ficha se vuelve a pintar sola al cambiar el plan o al abrir Ajustes, y
     sin esto el nombre saltaba al otro a mitad de mirar. */
  miradaComoMundo = !!comoMundo;
  pintarEscena(id);
  pintarFicha(id);
  pintarSeleccion();
}

/* Dos marcas y no una, porque son dos cosas: la que llevas PUESTA lleva su
   palomita, y la que estás MIRANDO lleva el aro. Con una sola marca, asomarse a
   un mundo parecía habérselo puesto. */
function pintarSeleccion() {
  const puesta = apariencia();
  document.querySelectorAll("#panel-apariencia [data-ap]").forEach((b) => {
    const id = b.getAttribute("data-ap");
    b.classList.toggle("mirando", id === aparienciaMirada);
    b.classList.toggle("on", id === puesta);
    b.setAttribute("aria-pressed", String(id === puesta));
  });
}

/* ================= Un mundo, en la lista =================
   Un renglón con su icono, su nombre y su frase. Lo que hace es MIRARLO: lo
   que se ve arriba cambia y no se toca nada de lo que llevas puesto. */
function filaMundo(m, esSalida) {
  const e = esSalida ? { ok: true } : estadoApariencia(m);
  return `
    <button type="button" class="mun-m mues-${m.id}${esSalida ? " mun-salida" : ""}${e.ok ? "" : " cerrado"}"
      data-ap="${m.id}" onclick="mirarApariencia('${m.id}', true)"
      title="${escapeHtml(m.nombre)}${e.ok ? "" : " · " + escapeHtml(e.chapa)}">
      ${m.icon ? `<span class="mun-ic">${icon(m.icon, 20)}</span>` : ""}
      <span class="mun-tx">
        <b>${escapeHtml(m.nombre)}${esSalida ? "" : novedadApariencia(m)}</b>
        <span>${escapeHtml(m.premisa || "")}</span>
      </span>
      ${esSalida
        /* «Predeterminado» y no una cápsula de plan: es el mundo original, no
           algo que se abra pagando ni subiendo de nivel. Lo pidió Eduardo. */
        ? '<span class="mun-p ap-base">Predeterminado</span>'
        : chapaApariencia(e, true)}
      <span class="mun-ok" aria-hidden="true">${icon("check", 13)}</span>
    </button>`;
}

/* ================= El panel de Ajustes ================= */

function renderPanelApariencia() {
  const caja = document.getElementById("panel-apariencia");
  if (!caja) return;

  /* El archivo de los mundos se pide al ABRIR el catálogo y no al encender un
     mundo, que es lo que se hacía antes. Quien llega a esta pantalla vino a
     mirarlos, y el escaparate no puede enseñar ninguno sin él. Quien nunca la
     abre sigue sin bajárselo, que es la regla que dejó escrita la caché de
     0.7.38: `css/mundos.css` no está en `ASSETS` y pesa 180 KB.

     Va antes de montar nada porque el `link` tiene que existir cuando se
     escriba el documento del escaparate — se engancha en el acto aunque tarde
     en llegar, así que la huella ya está disponible en esta misma línea. */
  if (typeof pedirLosMundos === "function") pedirLosMundos();

  const muestras = AMBIENTES.filter((a) => seExhibe(a.id)).map((a) => {
    const e = estadoApariencia(a);
    /* La chapa se escribe AL LADO: es lo que convierte «no lo tienes» en «lo
       tendrás», y es la mitad del premio. Aquí va en TEXTO y sin insignia, a
       diferencia de la fila de un mundo: la muestra mide 88 px y una piedra de
       10 px al lado de «NIVEL 12» en ese ancho es una mancha, no un símbolo. */
    const pie = e.ok ? "" : e.chapa;
    return `
      <button type="button" class="amb-m mues-${a.id}${e.ok ? "" : " cerrado"}"
        data-ap="${a.id}" onclick="mirarApariencia('${a.id}')"
        title="${escapeHtml(a.nombre)}${pie ? " · " + escapeHtml(pie) : ""}">
        <span class="amb-mini" aria-hidden="true">
          <span class="amb-tarj"></span><span class="amb-pt"></span>
          ${a.icon ? `<span class="amb-ic">${icon(a.icon, 15)}</span>` : ""}
          <span class="amb-ok" aria-hidden="true">${icon("check", 12)}</span>
          ${esNovedad(a) ? '<span class="amb-nueva">Nuevo</span>' : ""}
        </span>
        <span class="amb-n">${escapeHtml(a.nombre)}</span>
        ${pie ? `<span class="amb-p">${escapeHtml(pie)}</span>` : ""}
      </button>`;
  }).join("");

  /* Los mundos van en su PROPIA reja y no mezclados con los ambientes, y no es
     una cuestión de orden: son cosas de distinta especie. Un ambiente le cambia
     la luz al mismo material; un mundo cambia el material —la superficie, el
     marco, la letra y el peso al moverse— y por eso declara sus propios
     colores y es excluyente con los ambientes. */
  const listos = MUNDOS.filter((m) => m.listo && seExhibe(m.id));
  /* La primera fila es el MUNDO DE PARTIDA, y existe porque Eduardo preguntó
     lo obvio: con un mundo puesto, ¿cómo se vuelve? Antes había que tocar un
     recolor, que es pedir una cosa para conseguir otra.

     Se llama «Noche de expedición» y no «Norata Clásico»: ése es el nombre del
     RECOLOR de partida, que está en la otra reja. Ver `CASA_MUNDO`. */
  const salida = seExhibe("casa") ? filaMundo({
    id: "casa", nombre: CASA_MUNDO.nombre, icon: "compass", premisa: CASA_MUNDO.premisa
  }, true) : "";
  const mundos = salida + listos.map((m) => filaMundo(m, false)).join("");

  /* El escaparate se monta UNA VEZ y las listas se redibujan todas las que
     hagan falta. Esto se llama cada vez que se abre la sección de Ajustes y
     cada vez que cambia el plan; rehacer el `innerHTML` entero mataría el
     iframe y volvería a cargarle los estilos en cada visita. */
  if (!document.getElementById("ap-escena")) {
    caja.innerHTML = `
      <div class="ap-escena" id="ap-escena">
        <div class="ap-marco"><iframe id="ap-vista" title="Vista previa de la apariencia" scrolling="no" tabindex="-1" aria-hidden="true"></iframe></div>
        <div class="ap-ficha" id="ap-ficha"></div>
      </div>
      <h3 class="amb-h2">Ambientes</h3>
      <p class="settings-note">El mismo Norata con otra luz. Se van desbloqueando conforme avanzas, y el modo de día y de noche sigue arriba: cada ambiente tiene sus dos caras.</p>
      <div class="amb-rej" id="ap-ambientes"></div>
      <h3 class="amb-h2">Mundos</h3>
      <p class="settings-note">Un mundo no es otra luz: es otro material. Cambia la superficie, el marco, la letra y hasta cómo se llama tu camino. Van aparte de los ambientes porque no se combinan — llevas uno o llevas el otro.</p>
      <div class="mun-rej" id="ap-mundos"></div>`;
  }
  document.getElementById("ap-ambientes").innerHTML = muestras;
  document.getElementById("ap-mundos").innerHTML = (listos.length || salida) ? mundos : "";

  /* Al abrir se mira lo que se lleva puesto, que es de donde parte cualquiera
     para decidir si quiere otra cosa. Y se conserva por qué reja se había
     entrado, que es lo que decide cómo se llama `casa`. */
  const sigue = aparienciaMirada && aparienciaPorId(aparienciaMirada) && seExhibe(aparienciaMirada);
  mirarApariencia(sigue ? aparienciaMirada : apariencia(), sigue && miradaComoMundo);
}

/* Ponérsela de verdad: se guarda y se recarga. Si no se puede, sale el cuadro
   del plan en vez de un aviso que se va solo. */
function elegirApariencia(id) {
  /* `aparienciaPorId` y no `ambientePorId`, que es lo que había y por lo que
     tocar Reliquia no hacía absolutamente nada: la lista de mundos no está en
     `AMBIENTES`, así que esto salía por el `return` de la línea siguiente sin
     un error, sin un aviso y sin cambiar nada. */
  const a = aparienciaPorId(id);
  if (!a) return;
  const e = estadoApariencia(a);
  if (!e.ok) {
    /* Lo que se paga saca el cuadro del plan; lo que se gana se queda en la
       ventana, que ya dice cuánto falta y no tiene nada más que ofrecer. */
    if (e.accion) aparienciaAPagar();
    else if (typeof toast === "function") toast(e.titulo, "atencion");
    return;
  }
  if (!ponerApariencia(id)) return;
  pintarSeleccion();

  /* Y se recarga la página. Lo pidió Eduardo y resuelve de raíz una clase
     entera de problemas: un mundo trae su propio archivo de estilos, que llega
     por la red DESPUÉS de que el atributo ya esté puesto, y el árbol de
     talentos y las escenas se dibujan una vez con los colores que había al
     dibujarlas. Aplicarlo en caliente deja media app con lo nuevo y media con
     lo viejo; recargar la deja entera, y el arranque ya sabe pintar la
     apariencia guardada antes del primer fotograma.

     Dentro del EJEMPLO no se recarga: el ejemplo vive en memoria y una recarga
     lo borraría sin avisar. */
  if (typeof modoEjemplo !== "undefined" && modoEjemplo) { renderPanelApariencia(); return; }
  /* Sin el nombre: lo pidió Eduardo y tiene razón — el nombre ya está en la
     ventana que acabas de cerrar, y repetirlo en el aviso es decir dos veces lo
     mismo medio segundo antes de que la app se recargue y lo enseñe. */
  if (typeof toast === "function") toast("Cambiando tema…", "calma");
  /* Un respiro para que el aviso se vea y para que `localStorage` haya
     escrito de verdad antes de irse. */
  setTimeout(() => location.reload(), 420);
}

/* Desde la tarjeta del Resumen: lleva a Ajustes con la sección ya abierta. Es
   el único camino corto que hay a lo que se acaba de desbloquear, y sin él la
   tarjeta anuncia un premio sin decir dónde se recoge. */
function abrirApariencia() {
  if (typeof showView === "function") showView("settings");
  if (typeof ajusteAbierto !== "undefined") ajusteAbierto = "aspecto";
  if (typeof renderAjustes === "function") renderAjustes();
}
