# maymi — K-Beauty Store

Tienda web de cuidado coreano de **Marypaz Pumachara** (@maymi.pe). Sitio estático: `index.html`, `styles.css`, `app.js` y `motion.js`. No necesita instalación ni build.

## Cómo verla en local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8000
# luego entra a http://localhost:8000
```

## Publicarla con GitHub Pages

En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**. En un par de minutos queda en `https://sebashulla.github.io/maimi-tienda/`.

## Rediseño (noviembre 2026)

Se mantuvo la esencia de la marca (manteca, vino y azul polvo; Baloo 2, DM Serif Display y Nunito Sans; el logo y las fotos) y toda la lógica de la tienda en `app.js` (catálogo, filtros, bolsa, cupones, Skin Finder, Maymi Box, rutina, checkout).

**Diseño**
- Cabecera flotante tipo cristal que se oculta al bajar y reaparece al subir; menú móvil a pantalla completa.
- Portada con la foto en parallax, titular que entra línea por línea y "gotas de rocío" (glass skin) que se mueven con el scroll y el mouse.
- Categorías como recorrido de rutina 01 → 06: en computadora la sección se fija y las tarjetas avanzan en horizontal al hacer scroll; en celular se deslizan con el dedo.
- Marcas en una cinta continua (al hacer clic filtra la tienda).
- Tarjetas de producto nuevas: fondo uniforme para las fotos, botones más grandes, aparición escalonada.
- Skin Finder con foto en arco y parallax; Maymi Box a pantalla completa con parallax y tarjeta de cristal; cupones con forma de ticket; pie de página con el nombre gigante en parallax.
- Antes/después con un pequeño movimiento de ejemplo la primera vez que aparece.
- Bolsa lateral con fondo difuminado; se cierra con Esc o tocando fuera.
- Títulos en español (antes había varios en inglés).

**Movimiento v2**
- Scroll suave con [Lenis](https://github.com/darkroomengineering/lenis) y animaciones ligadas al scroll con [GSAP + ScrollTrigger](https://gsap.com) (incluidas en `assets/vendor`, sin CDN).
- Intro con el logo y la portada que se abre desde una ventana.
- Portada fija: al bajar, la foto crece a pantalla completa, el titular se separa, las gotas suben a distintas velocidades y aparece la frase "Una selección de K-beauty para cuidar tu piel a tu ritmo."
- Títulos que entran palabra por palabra y paneles que crecen al aparecer.
- Categorías: el fondo cambia de color en cada paso y las tarjetas entran girando.
- Productos con inclinación 3D y brillo al pasar el mouse; cursor propio y botones magnéticos.
- Maymi Box se abre como una ventana a pantalla completa; los ingredientes se apilan como tarjetas.
- La cinta de marcas se inclina según la velocidad del scroll; el nombre del pie sube letra por letra.

**Rendimiento y accesibilidad**
- Tipografías alojadas en el propio repositorio (`assets/fonts`), sin depender de Google Fonts.
- Imágenes de portada, caja y antes/después en WebP (la portada pasó de 1,8 MB a ~40 KB).
- Respeta "reducir movimiento" del sistema: sin parallax ni animaciones.
- Foco visible con teclado, enlace "Ir a la tienda", etiquetas para lectores de pantalla.
- Etiquetas Open Graph para que el enlace se vea bien al compartirlo en WhatsApp o Instagram.

## Pendiente (no es de diseño)

- Los pedidos y el formulario de contacto todavía no se envían a la tienda: se guardan solo en el navegador de la clienta. Conviene mandarlos por WhatsApp o a una base de datos.
- Las cuentas bancarias del checkout son de ejemplo y la opción Visa es una simulación.
- Las fotos de productos se cargan desde otras webs; lo ideal es subir fotos propias a `assets/`.
