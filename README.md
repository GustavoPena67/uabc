# Historia de la migración japonesa a Mexicali

Proyecto **Meta 4.3 · HTML 2** (UABC). Página web informativa sobre la migración japonesa a Mexicali, Baja California.

Abre `index.html` en el navegador para verla.

**Para entregar:** `entrega/migracion-japonesa-mexicali.html` es un solo archivo con todo dentro (estilos, scripts y fotos). Se puede subir o enviar tal cual.

## Estructura

```
index.html        Página principal
css/estilos.css   Estilos
js/main.js        Interacciones (índice activo, filtros, formulario, avisos)
assets/moments/   Animaciones al hacer scroll (del skill taste-skill)
img/fotos/        Fotografías reales (Wikimedia Commons)
img/              Mapa ilustrado (SVG)
```

## Requisitos cubiertos

| Requisito | Dónde |
| --- | --- |
| `<html>`, `<head>`, `<title>`, `<body>` | Estructura de `index.html` |
| Título principal `<h1>` y subtítulos `<h2>`–`<h6>` | Portada y todas las secciones (h4–h6 en *Actualidad*) |
| Al menos 7 párrafos `<p>` | Más de 15 párrafos de contenido histórico |
| `<strong>`, `<b>`, `<i>`, `<u>` | Fechas en `<strong>`, conceptos en `<b>`, palabras japonesas en `<i>`, conceptos destacados en `<u>` |
| `<br>` y `<hr>` | Portada / pie y separación entre secciones |
| Lista ordenada `<ol>` y desordenada `<ul>` | *El viaje* (4 capítulos) y *Aportaciones culturales* |
| Índice con hipervínculos internos | Barra de navegación fija (`href="#seccion"`) |
| Al menos 3 enlaces externos | Sección *Referencias* (5 enlaces) |
| Al menos 3 imágenes `<img>` | 10 fotografías reales + 1 mapa ilustrado |
| `<div>` para agrupar | Contenedores de portada, tablas, campos del formulario |
| Tabla con mínimo 10 celdas | *Actividades económicas* (15 celdas) y *Línea del tiempo* (31 celdas, con `thead`, `tbody`, `tfoot`, `caption`, `colspan`) |
| Botones | Filtros de la línea del tiempo (con pastilla deslizante) y botones `submit` / `reset` |
| Formulario | Sección *Formulario*: `input` texto y correo, `select`, `radio`, `checkbox`, `textarea`, validación |
| Referencias bibliográficas | Sección *Referencias* |

## Diseño basado en emilkowalski/skills

Se aplicaron las reglas del repositorio [emilkowalski/skills](https://github.com/emilkowalski/skills):

- Curvas `ease-out` personalizadas (`cubic-bezier(0.23, 1, 0.32, 1)`), nunca `ease-in` ni `transition: all`.
- Botones con `transform: scale(0.97)` al presionar (`ui-cheatsheet`).
- Efectos *hover* sólo con `@media (hover: hover) and (pointer: fine)`.
- Entrada de la portada escalonada y no uniforme (`choreograph`), con `blur(2px)` durante la transición.
- Avisos tipo *toast* al estilo Sonner: entrada de 400 ms `ease`, salida más rápida.
- `prefers-reduced-motion`: se quitan los movimientos y se conservan los cambios de opacidad.
- Títulos con `letter-spacing: -0.02em`, texto limitado a `65ch` y fechas con `tabular-nums`.

## Diseño con taste-skill

Con el skill [taste-skill](https://github.com/Leonxlnx/taste-skill) (instalado en `.claude/skills/design-taste-frontend`):

- **Paleta propia:** índigo (*ai-iro*), bermellón, sol del desierto, algodón y agave; secciones con fondos alternos (papel, arena, índigo).
- **Portada a pantalla completa:** un sol que sale sobre olas *seigaiha* y un título que sube línea por línea al cargar.
- **Momento "photo-chapters"** en *El viaje*: la sección se queda fija mientras cada ilustración se descubre sobre la anterior al hacer scroll.
- **Momento "word-highlight"** en la *Conclusión*: la frase se ilumina palabra por palabra al bajar.
- **Capa de movimiento al pasar el mouse:** las tarjetas suben 2 px, las imágenes se acercan 1.03, los subrayados se dibujan y los botones bajan al presionarlos.
- Sin animaciones de aparición en cada sección (el skill las prohíbe por verse genéricas).
- Los momentos se empaquetaron en `assets/moments/momentos.js` como script normal, para que la página funcione abriendo `index.html` directo, sin servidor.

## Animaciones nuevas

- Portada con una foto de 1921 en duotono que se acerca lentamente, y fechas que cuentan hasta su año.
- Momento **picture-develops**: la foto de Mexicali en los años 20 se revela como en un cuarto oscuro.
- El kanji de cada sección se estampa como un sello japonés (*hanko*) la primera vez que aparece.
- La línea del tiempo se dibuja punto por punto.
- Una banda de palabras (*issei*, *nisei*, algodón, Mexicali…) se desliza entre secciones y se pausa al pasar el mouse.
- Visor de fotos: al dar clic, la foto crece desde su miniatura y muestra su crédito; se cierra con Esc.

## Notas para la entrega

- Las fotografías son de Wikimedia Commons (dominio público, CC0 o CC BY/BY-SA); los créditos están en la sección *Referencias*. Algunas son representativas de la época (el Kasato Maru llevó emigrantes a Brasil; la foto de Kobe de 1921 también).
- Revisa los enlaces externos antes de entregar y agrega tu nombre y matrícula en el pie de página.
