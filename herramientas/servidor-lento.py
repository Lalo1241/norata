"""Un GitHub Pages de mentira: comprime como el de verdad, pone las mismas
cabeceras de cache, y va tan lento como se le diga. La lentitud va AQUI y no
en el panel del navegador porque el service worker pide por su cuenta y la
simulacion del panel no le llega: sin esto, la segunda visita sale falsamente
rapida."""
import gzip, os, sys, time, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BITACORA = "bitacora-%s.txt" % sys.argv[1]
KBPS = float(sys.argv[2]) if len(sys.argv) > 2 else 1200.0   # kilobits por segundo
LAT  = float(sys.argv[3]) if len(sys.argv) > 3 else 0.18     # segundos de ida y vuelta

TIPOS = {".html":"text/html",".css":"text/css",".js":"application/javascript",
         ".json":"application/json",".svg":"image/svg+xml",".png":"image/png",
         ".webmanifest":"application/manifest+json"}
CANAL = threading.Semaphore(6)   # el navegador no abre infinitas conexiones

class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *a): pass
    def do_GET(self):
        ruta = self.path.split("?")[0]
        # La verdad de cuantas veces se pide cada cosa. El navegador miente:
        # una respuesta que sirve el service worker se anota con transferSize
        # 0 aunque por debajo haya ido a la red.
        with open(BITACORA, "a") as bit: bit.write("%.3f %s\n" % (time.time(), ruta))
        if ruta.endswith("/"): ruta += "index.html"
        f = os.path.normpath(os.path.join(RAIZ, ruta.lstrip("/")))
        if not f.startswith(RAIZ) or not os.path.isfile(f):
            self.send_response(404); self.send_header("Content-Length","0"); self.end_headers(); return
        ext = os.path.splitext(f)[1]
        cuerpo = open(f,"rb").read()
        tipo = TIPOS.get(ext, "application/octet-stream")
        comprime = ext in (".html",".css",".js",".json",".svg",".webmanifest") \
                   and "gzip" in self.headers.get("Accept-Encoding","")
        if comprime: cuerpo = gzip.compress(cuerpo, 6)
        time.sleep(LAT)                                  # la ida y vuelta
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        if comprime: self.send_header("Content-Encoding","gzip")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "max-age=600")  # lo que pone GitHub Pages
        self.end_headers()
        with CANAL:
            trozo = max(1024, int(KBPS*1024/8/20))        # 20 trozos por segundo
            for i in range(0, len(cuerpo), trozo):
                self.wfile.write(cuerpo[i:i+trozo]); self.wfile.flush()
                time.sleep(1/20)
srv = ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H)
# Con TLS, porque el service worker solo se registra en https (ver
# js/11-arranque.js). Sin esto la medicion nunca toca su camino y la segunda
# visita sale de la cache del navegador, que no es lo que hace la app real.
import ssl
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain("cert.pem", "llave.pem")
srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
srv.serve_forever()
