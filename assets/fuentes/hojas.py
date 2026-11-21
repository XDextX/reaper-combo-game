# Genera los diseños de Lienzo de las cuatro hojas de sprites (32×32 por fotograma).
# Uso: python assets/fuentes/hojas.py  →  escribe assets/fuentes/<hoja>.json
# Luego: node <lienzo>/lienzo.js render assets/fuentes/<hoja>.json -o assets/<hoja>.png
import json, math, os, random

LADO = 32
AQUI = os.path.dirname(os.path.abspath(__file__))
LICENCIA = "LICENCIA-sprites.txt"

PALETA = {
    ".": "transparent",
    "o": "#24343c",  # contorno, visible sobre el suelo
    "c": "#eef6f8",  # cuerpo blanco espectral (aprobado por el dueño, v2)
    "C": "#ffffff",  # brillo
    "s": "#8fd3e0",  # sombra cian
    "k": "#07070b",  # interior de la capucha
    "m": "#ff3fb8",  # ojos
    "w": "#ffffff",  # brillo de los ojos
    "h": "#7d8f9a",  # mango de la guadaña
    "b": "#c8d6dc",  # hoja
    "M": "#ff3fb8",  # filo y tajo
    "f": "#eef6f866",  # cuerpo translúcido (esquiva)
    "F": "#8fd3e066",  # sombra translúcida
    "r": "#ff3fb8aa",  # tajo tenue
}


def lienzo():
    return [["." for _ in range(LADO)] for _ in range(LADO)]


def pon(g, x, y, ch):
    if 0 <= x < LADO and 0 <= y < LADO:
        g[y][x] = ch


def contorno(g, sobre="."):
    pintado = [(x, y) for y in range(LADO) for x in range(LADO) if g[y][x] not in (".", "r")]
    for x, y in pintado:
        for vx, vy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + vx, y + vy
            if 0 <= nx < LADO and 0 <= ny < LADO and g[ny][nx] == sobre:
                g[ny][nx] = "o"


def guadana(g, dx, dy, alta=0):
    """Mango vertical y hoja curva arriba; dx/dy la desplazan, alta la sube."""
    for y in range(4 - alta, 30 - alta):
        pon(g, 22 + dx, y + dy, "h")
    hoja = [(23, 3), (24, 3), (25, 3), (26, 3), (27, 4), (28, 4), (29, 5), (29, 6), (30, 7), (30, 8), (30, 9)]
    for x, y in hoja:
        pon(g, x + dx, y + dy - alta, "b")
        pon(g, x + dx, y + 1 + dy - alta, "b")
    filo = [(23, 5), (24, 5), (25, 5), (26, 5), (27, 6), (28, 6), (28, 7), (29, 8), (29, 9), (29, 10), (30, 10)]
    for x, y in filo:
        pon(g, x + dx, y + dy - alta, "M")


def tajo(g, radio, ancho, tenue=False):
    """Arco del corte delante del espíritu (a la derecha)."""
    ch = "r" if tenue else "M"
    for y in range(LADO):
        for x in range(16, LADO):
            d = math.hypot(x - 14, y - 16)
            if radio - ancho <= d <= radio and y <= 26:
                if g[y][x] == ".":
                    g[y][x] = ch


def espiritu(dy=0, cola=0, gx=0, gy=0, alta=0, arco=None, efecto=None):
    g = lienzo()
    for y in range(LADO):
        for x in range(LADO):
            if (x - 13) ** 2 + (y - 11 - dy) ** 2 <= 7.3 ** 2:
                pon(g, x, y, "c")
    for y in range(16 + dy, 28 + dy):
        w = 7 - (y - 16 - dy) * 0.4
        for x in range(round(13 - w), round(13 + w) + 1):
            pon(g, x, y, "c")
    for i, x in enumerate(range(8, 19, 3)):
        largo = 2 if (i + cola) % 2 == 0 else 1
        for y in range(28 + dy, 28 + dy + largo):
            pon(g, x, y, "c")
            pon(g, x + 1, y, "c")
    for y in range(LADO):
        for x in range(LADO):
            if g[y][x] == "c" and x >= 16 and (x - 13) ** 2 + (y - 11 - dy) ** 2 > 3 ** 2:
                g[y][x] = "s"
    for x, y in [(9, 7), (10, 6), (11, 5), (9, 8), (10, 7)]:
        pon(g, x, y + dy, "C")
    for y in range(LADO):
        for x in range(LADO):
            if ((x - 13.5) / 4.2) ** 2 + ((y - 12.5 - dy) / 3.3) ** 2 <= 1:
                pon(g, x, y, "k")
    for ox in (11, 15):  # ojos grandes de 2×2 con un brillo
        for x, y in ((ox, 12), (ox + 1, 12), (ox, 13), (ox + 1, 13)):
            pon(g, x, y + dy, "m")
        pon(g, ox, 12 + dy, "w")
    for x, y in [(19, 18), (20, 18), (19, 19), (20, 19)]:
        pon(g, x + gx, y + dy + gy, "c")
    guadana(g, gx, dy + gy, alta)
    if arco:
        tajo(g, *arco)
    contorno(g)
    if efecto == "translucido":
        cambio = {"c": "f", "C": "f", "s": "F", "o": ".", "h": ".", "b": ".", "M": "."}
        g = [[cambio.get(ch, ch) for ch in fila] for fila in g]
    elif efecto == "destello":
        g = [["C" if ch in "cs" else ch for ch in fila] for fila in g]
    return g


def tajo_vertical(g, radio, ancho, abajo, tenue=False):
    """Arco del corte por debajo (de frente) o por encima (de espaldas) del espíritu."""
    ch = "r" if tenue else "M"
    for y in range(LADO):
        for x in range(LADO):
            d = math.hypot(x - 16, y - 16)
            fuera = y >= 21 if abajo else y <= 9
            if radio - ancho <= d <= radio and fuera and g[y][x] == ".":
                g[y][x] = ch


def espiritu_vertical(espalda, dy=0, cola=0, gx=0, gy=0, alta=0, arco=None, efecto=None):
    """El espíritu de frente (mira abajo) o de espaldas (mira arriba), centrado en x = 16."""
    g = lienzo()
    if espalda:  # de espaldas la guadaña queda detrás del cuerpo
        guadana(g, gx - 3, dy + gy, alta)
    for y in range(LADO):
        for x in range(LADO):
            if (x - 16) ** 2 + (y - 11 - dy) ** 2 <= 7.3 ** 2:
                pon(g, x, y, "c")
    for y in range(16 + dy, 28 + dy):
        w = 7 - (y - 16 - dy) * 0.4
        for x in range(round(16 - w), round(16 + w) + 1):
            pon(g, x, y, "c")
    for i, x in enumerate(range(10, 22, 3)):
        largo = 2 if (i + cola) % 2 == 0 else 1
        for y in range(28 + dy, 28 + dy + largo):
            pon(g, x, y, "c")
            pon(g, x + 1, y, "c")
    for y in range(LADO):  # sombra cian en el lado derecho
        for x in range(LADO):
            if g[y][x] == "c" and x >= 20 and (x - 16) ** 2 + (y - 11 - dy) ** 2 > 3 ** 2:
                g[y][x] = "s"
    for x, y in [(12, 7), (13, 6), (14, 5), (12, 8)]:
        pon(g, x, y + dy, "C")
    if espalda:
        for y in range(6, 24):  # costura de la capucha
            pon(g, 16, y + dy, "s")
    else:
        for y in range(LADO):
            for x in range(LADO):
                if ((x - 16) / 4.2) ** 2 + ((y - 12.5 - dy) / 3.3) ** 2 <= 1:
                    pon(g, x, y, "k")
        for ox in (13, 17):
            for x, y in ((ox, 12), (ox + 1, 12), (ox, 13), (ox + 1, 13)):
                pon(g, x, y + dy, "m")
            pon(g, ox, 12 + dy, "w")
        for x, y in [(22, 18), (23, 18), (22, 19), (23, 19)]:  # mano
            pon(g, x + gx, y + dy + gy, "c")
        guadana(g, gx + 2, dy + gy, alta)
    if arco:
        tajo_vertical(g, arco[0], arco[1], not espalda, *arco[2:])
    contorno(g)
    if efecto == "translucido":
        cambio = {"c": "f", "C": "f", "s": "F", "o": ".", "h": ".", "b": ".", "M": "."}
        g = [[cambio.get(ch, ch) for ch in fila] for fila in g]
    elif efecto == "destello":
        g = [["C" if ch in "cs" else ch for ch in fila] for fila in g]
    return g


def juego_vertical(espalda):
    v = lambda **k: espiritu_vertical(espalda, **k)
    pre = "arriba" if espalda else "abajo"
    return [(f"{pre}-{n}", g) for n, g in [
        ("quieto-1", v()), ("quieto-2", v(dy=1, cola=1)),
        ("andar-1", v(gy=-1)), ("andar-2", v(dy=1, cola=1)), ("andar-3", v(gy=1)), ("andar-4", v(dy=1, cola=1)),
        ("golpe-L-1", v(gy=-1, alta=2)), ("golpe-L-2", v(gx=-1, arco=(13, 3))), ("golpe-L-3", v(arco=(13, 2, True))),
        ("golpe-P-1", v(gx=1, alta=3)), ("golpe-P-2", v(gx=1, alta=4, dy=1)), ("golpe-P-3", v(gx=-2, arco=(15, 5))),
        ("golpe-P-4", v(arco=(15, 3, True))),
        ("esquiva-1", v(efecto="translucido")), ("esquiva-2", v(dy=1, cola=1, efecto="translucido")),
        ("esquiva-3", v(cola=1, efecto="translucido")),
        ("dano-1", v(efecto="destello")), ("dano-2", v(gx=-1)),
    ]]


def muneco(inclina=0, destello=False):
    g = lienzo()
    madera, saco, cuerda = "p", "q", "t"
    for y in range(20, 30):  # poste
        pon(g, 15, y, madera)
        pon(g, 16, y, madera)
    for x in range(11, 21):  # base
        pon(g, x, 29, madera)
    for y in range(6, 21):  # saco, inclinado hacia atrás al recibir
        desv = round(inclina * (20 - y) / 14)
        for x in range(10, 22):
            pon(g, x + desv, y, saco)
        if y in (10, 16):
            for x in range(10, 22):
                pon(g, x + desv, y, cuerda)
    for x in range(12, 20):  # cabeza
        for y in range(2, 6):
            pon(g, x + inclina, y, saco)
    if destello:
        g = [["C" if ch in "pqt" else ch for ch in fila] for fila in g]
    contorno(g)
    return g


def chispa(radio, puntas, color, grosor=1):
    g = lienzo()
    for i in range(puntas):
        a = i * 2 * math.pi / puntas + 0.3
        for r in range(max(0, radio - 5), radio + 1):
            for t in range(grosor):
                pon(g, round(16 + math.cos(a) * r) + t, round(16 + math.sin(a) * r), color)
    if radio <= 4:
        for x, y in ((15, 15), (16, 15), (15, 16), (16, 16)):
            pon(g, x, y, "C")
    return g


def baldosa(semilla):
    azar = random.Random(semilla)
    g = [["n" for _ in range(LADO)] for _ in range(LADO)]
    for _ in range(18):  # motas
        pon(g, azar.randrange(LADO), azar.randrange(LADO), "N")
    x, y = azar.randrange(4, 28), azar.randrange(4, 28)
    for _ in range(azar.randrange(5, 12)):  # una grieta
        pon(g, x, y, "z")
        x += azar.choice((-1, 0, 1))
        y += 1
    return g


def filas(g):
    return ["".join(f) for f in g]


def hoja(nombre, fotogramas, paleta):
    capas = []
    for i, (nombre_f, g) in enumerate(fotogramas):
        capas.append({
            "id": nombre_f, "type": "pixels", "sheetFrame": nombre_f,
            "x": i * LADO, "y": 0, "width": LADO, "height": LADO,
            "palette": paleta, "rows": filas(g),
        })
    return {
        "page": {"width": LADO * len(fotogramas), "height": LADO},
        "spritesheet": {"name": nombre, "license": LICENCIA},
        "layers": capas,
    }


def paleta_usada(fotogramas, base):
    usados = {ch for _, g in fotogramas for fila in g for ch in fila}
    return {k: v for k, v in base.items() if k in usados}


# --- Enemigos del combate (aprobados por el dueño: un fotograma de frente de cada uno) ---
PALETA_ENEMIGOS = {
    ".": "transparent", "o": "#24343c",
    # segador menor: túnica morada y hoz
    "u": "#5b2a6e", "U": "#3c1a4a", "k": "#07070b", "m": "#ff3fb8", "h": "#7d8f9a", "b": "#c8d6dc",
    # lanzador: llama naranja con núcleo
    "a": "#d08a2a", "A": "#ffb347", "Y": "#fff1c2", "r": "#8a4a14",
    # escudado: armadura azul y escudo de acero
    "e": "#4f6fd0", "E": "#2f4590", "s": "#8aa0b8", "S": "#c8d6dc", "x": "#5a6878",
    "W": "#ffffff", "Z": "#eef6f899", "C": "#ffffff", "c": "#eef6f8",
}


def segador():
    g = lienzo()
    for y in range(LADO):
        for x in range(LADO):
            if (x - 16) ** 2 + (y - 13) ** 2 <= 6 ** 2:
                pon(g, x, y, "u")
    for y in range(17, 28):  # túnica que se abre hacia abajo
        w = 5 + (y - 17) * 0.5
        for x in range(round(16 - w), round(16 + w) + 1):
            pon(g, x, y, "u" if x < 18 else "U")
    for x in range(10, 23, 3):  # bajo rasgado
        pon(g, x, 28, "U")
    for y in range(LADO):
        for x in range(LADO):
            if ((x - 16) / 3.6) ** 2 + ((y - 14) / 2.8) ** 2 <= 1:
                pon(g, x, y, "k")
    for x, y in ((14, 14), (18, 14)):  # ojos pequeños
        pon(g, x, y, "m")
    for y in range(12, 27):  # hoz corta en la mano derecha
        pon(g, 24, y, "h")
    for x, y in ((25, 11), (26, 11), (27, 12), (28, 13), (28, 14), (27, 15)):
        pon(g, x, y, "b")
    return g


def lanzador():
    g = lienzo()
    for y in range(LADO):
        for x in range(LADO):
            d = (x - 16) ** 2 / 7 ** 2 + (y - 17) ** 2 / 8 ** 2
            punta = y < 17 and abs(x - 16) <= (y - 4) * 0.55
            if d <= 1 or (punta and y >= 4):
                pon(g, x, y, "a")
    for y in range(LADO):
        for x in range(LADO):
            if g[y][x] == "a" and (x - 15) ** 2 / 4 ** 2 + (y - 18) ** 2 / 5 ** 2 <= 1:
                g[y][x] = "A"
    for x, y in ((13, 17), (14, 17), (18, 17), (19, 17)):  # ojos huecos
        pon(g, x, y, "k")
    for x in range(14, 19):
        pon(g, x, 21, "r")  # boca
    for y in range(LADO):  # orbe que lanza, en la mano izquierda
        for x in range(LADO):
            if (x - 6) ** 2 + (y - 22) ** 2 <= 2.3 ** 2:
                pon(g, x, y, "Y")
    return g


def escudado():
    g = lienzo()
    for y in range(LADO):  # yelmo
        for x in range(LADO):
            if (x - 15) ** 2 + (y - 9) ** 2 <= 5.5 ** 2:
                pon(g, x, y, "e")
    for x in range(11, 20):
        pon(g, x, 9, "k")  # visera
    pon(g, 13, 9, "m")
    pon(g, 17, 9, "m")
    for y in range(14, 28):  # cuerpo ancho
        for x in range(8, 23):
            pon(g, x, y, "e" if x < 18 else "E")
    for x in range(8, 23):
        pon(g, x, 20, "x")  # cinturón
    for y in range(28, 31):  # piernas
        for x in (10, 11, 19, 20):
            pon(g, x, y, "E")
    for y in range(13, 30):  # escudo grande delante, a la derecha
        for x in range(17, 28):
            borde = y in (13, 29) or x in (17, 27)
            pon(g, x, y, "S" if borde else "s")
    for y in range(16, 27):
        pon(g, 22, y, "S")  # nervio del escudo
    return g



CARA = {"segador": "km", "lanzador": "kr", "escudado": "km"}
ESPALDA = {"segador": "u", "lanzador": "A", "escudado": "e"}  # con qué se tapa la cara de espaldas
ARMA = {"segador": "hb", "lanzador": "Y", "escudado": "sS"}
CUERPO = {"segador": "uUo", "lanzador": "aAro", "escudado": "eExo"}
BRILLO = {"u": "C", "U": "c", "a": "Y", "A": "Y", "r": "A", "e": "C", "E": "c", "x": "s"}  # aviso: se aclara


def mover(g, chars, dx, dy):
    """Mueve los píxeles de `chars` y deja transparente donde estaban."""
    puntos = [(x, y, g[y][x]) for y in range(LADO) for x in range(LADO) if g[y][x] in chars]
    for x, y, _ in puntos:
        g[y][x] = "."
    for x, y, ch in puntos:
        pon(g, x + dx, y + dy, ch)
    return g


def recolor(g, cambio):
    return [[cambio.get(ch, ch) for ch in fila] for fila in g]


def vista(tipo, g, direc):
    """Pasa el dibujo de frente (abajo) a lado (mirando a la derecha) o espalda (arriba)."""
    g = [fila[:] for fila in g]
    if direc == "lado":
        if tipo == "lanzador":
            g = [fila[::-1] for fila in g]  # el orbe va delante
        mover(g, CARA[tipo], 2, 0)
    elif direc == "arriba":
        g = recolor(g, {ch: ESPALDA[tipo] for ch in CARA[tipo]})
    return g


def adelante(direc, paso):
    return {"lado": (paso, 0), "abajo": (0, paso), "arriba": (0, -paso)}[direc]


def fotogramas_enemigo(tipo, base):
    salida = []
    for direc in ("lado", "abajo", "arriba"):
        pre = f"{tipo}-" + ("" if direc == "lado" else f"{direc}-")
        v = vista(tipo, base(), direc)
        def f(nombre, g):
            salida.append((pre + nombre, g))
        todo = "".join(set("".join("".join(fl) for fl in v)) - {"."})
        f("quieto-1", contorno_de(v))
        f("quieto-2", contorno_de(mover([fl[:] for fl in v], todo, 0, 1)))
        f("andar-1", contorno_de(mover([fl[:] for fl in v], ARMA[tipo], 0, -1)))
        f("andar-2", contorno_de(mover([fl[:] for fl in v], todo, 0, 1)))
        f("aviso-1", contorno_de(recolor(mover([fl[:] for fl in v], ARMA[tipo], 0, -2), BRILLO)))
        ax, ay = adelante(direc, 3)
        f("ataque-1", contorno_de(mover([fl[:] for fl in v], ARMA[tipo], ax, ay)))
        g2 = mover([fl[:] for fl in v], ARMA[tipo], ax * 2, ay * 2)
        if tipo == "lanzador":
            g2 = recolor(g2, {"Y": "."})  # el orbe ya salió
        f("ataque-2", contorno_de(g2))
        f("golpeado-1", contorno_de(recolor(v, {ch: "W" for ch in CUERPO[tipo] if ch != "o"})))
        for i, baja in enumerate((1, 3, 6)):
            g3 = mover([fl[:] for fl in v], todo, 0, baja)
            g3 = [["Z" if ch != "." else "." for ch in fl] for fl in g3]
            f(f"muerte-{i + 1}", g3[: LADO - baja] + [["."] * LADO for _ in range(baja)])
    return salida


def contorno_de(g):
    g = [fl[:] for fl in g]
    contorno(g)
    return g


def orbe():
    g = lienzo()
    for y in range(LADO):
        for x in range(LADO):
            if (x - 16) ** 2 + (y - 16) ** 2 <= 2.3 ** 2:
                pon(g, x, y, "Y")
    pon(g, 15, 15, "W")
    contorno(g)
    return g


HOJAS = {
    "espiritu": [
        ("quieto-1", espiritu(dy=0, cola=0)),
        ("quieto-2", espiritu(dy=1, cola=1)),
        ("andar-1", espiritu(dy=0, cola=0, gx=-1)),
        ("andar-2", espiritu(dy=1, cola=1)),
        ("andar-3", espiritu(dy=0, cola=0, gx=1)),
        ("andar-4", espiritu(dy=1, cola=1)),
        ("golpe-L-1", espiritu(gy=-1, alta=2)),
        ("golpe-L-2", espiritu(gx=1, arco=(15, 3))),
        ("golpe-L-3", espiritu(arco=(15, 2, True))),
        ("golpe-P-1", espiritu(gx=-2, alta=3)),
        ("golpe-P-2", espiritu(gx=-2, alta=4, dy=1)),
        ("golpe-P-3", espiritu(gx=1, arco=(17, 5))),
        ("golpe-P-4", espiritu(arco=(17, 3, True))),
        ("esquiva-1", espiritu(efecto="translucido")),
        ("esquiva-2", espiritu(dy=1, cola=1, efecto="translucido")),
        ("esquiva-3", espiritu(cola=1, efecto="translucido")),
        ("dano-1", espiritu(efecto="destello")),
        ("dano-2", espiritu(gx=-1)),
        *juego_vertical(False),
        *juego_vertical(True),
    ],
    "muneco": [
        ("quieto-1", muneco()),
        ("golpeado-1", muneco(inclina=3, destello=True)),
        ("golpeado-2", muneco(inclina=1)),
    ],
    "chispas": [
        ("impacto-L-1", chispa(3, 6, "C")),
        ("impacto-L-2", chispa(7, 6, "s")),
        ("impacto-L-3", chispa(10, 6, "f")),
        ("impacto-P-1", chispa(4, 8, "C", 2)),
        ("impacto-P-2", chispa(9, 8, "M", 2)),
        ("impacto-P-3", chispa(13, 8, "M")),
        ("impacto-P-4", chispa(15, 8, "r")),
    ],
    "suelo": [(f"baldosa-{i + 1}", baldosa(i)) for i in range(4)],
    "enemigos": [
        *fotogramas_enemigo("segador", segador),
        *fotogramas_enemigo("lanzador", lanzador),
        *fotogramas_enemigo("escudado", escudado),
        ("orbe-1", orbe()),
    ],
}

EXTRA = {"p": "#6b4f36", "q": "#a8865a", "t": "#4a3524", "n": "#12121a", "N": "#191924", "z": "#0a0a10"}

if __name__ == "__main__":
    for nombre, fotogramas in HOJAS.items():
        # Los enemigos tienen su propia paleta: algunas letras (s, r) significan otro color que en el espíritu.
        base = PALETA_ENEMIGOS if nombre == "enemigos" else {**PALETA, **EXTRA}
        paleta = paleta_usada(fotogramas, base)
        with open(os.path.join(AQUI, f"{nombre}.json"), "w", encoding="utf-8") as f:
            json.dump(hoja(nombre, fotogramas, paleta), f, ensure_ascii=False, indent=1)
        print(nombre, len(fotogramas), "fotogramas")
