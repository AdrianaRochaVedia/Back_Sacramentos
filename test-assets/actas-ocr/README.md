# Actas de prueba para OCR

9 imágenes de actas ficticias (generadas para pruebas, ninguna persona/parroquia es real) listas para subir tal cual al flujo de OCR. Cada una fue verificada contra `helpers/ocrParser.js` — extraen el 100% de sus campos.

## Archivos

| Archivo | Sacramento | Persona | Parroquia |
|---|---|---|---|
| `bautismo_valentina.png` | Bautismo | Valentina Quispe Mamani | San Sebastián |
| `bautismo_mateo.png` | Bautismo | Mateo Fernández Ríos | Nuestra Señora del Carmen |
| `bautismo_sofia.png` | Bautismo | Sofía Ramírez Alcón | San Pedro Apóstol |
| `bautismo_joaquin.png` | Bautismo | Joaquín Torrez Villca | Virgen de Copacabana |
| `primeracomunion_valentina.png` | Primera Comunión | Valentina Quispe Mamani | San Sebastián |
| `primeracomunion_mateo.png` | Primera Comunión | Mateo Fernández Ríos | Nuestra Señora del Carmen |
| `confirmacion_valentina.png` | Confirmación | Valentina Quispe Mamani | San Sebastián |
| `confirmacion_mateo.png` | Confirmación | Mateo Fernández Ríos | Nuestra Señora del Carmen |
| `matrimonio_valentina_mateo.png` | Matrimonio | Mateo Fernández Ríos × Valentina Quispe Mamani | Sagrado Corazón de Jesús |

`fuente-html/` tiene el HTML de cada una por si hay que ajustar algo y volver a generar la imagen (Chrome headless: `--headless=new --window-size=1000,1400 --screenshot=salida.png archivo.html`).

## Formularios en blanco (PDF, para imprimir y llenar a mano)

| Archivo | Sacramento |
|---|---|
| `formulario_bautismo.pdf` | Bautismo |
| `formulario_confirmacion.pdf` | Confirmación |
| `formulario_primeracomunion.pdf` | Primera Comunión |
| `formulario_matrimonio.pdf` | Matrimonio |

Tamaño A4, una sola página cada uno, sin datos rellenados — solo el texto fijo del acta con espacios en blanco para completar a mano (nombre, fechas, padres, padrinos, etc.). Las etiquetas ("Nombre del bautizado:", "Nombre del confirmado:", "Contrayente:"/"Contrayenta:", etc.) son exactamente las que `helpers/ocrParser.js` busca, así que si se llenan a mano respetando esa redacción, el OCR debería seguir extrayendo los campos igual que con las imágenes ya rellenadas. Pensados para: imprimir → llenar a mano → fotografiar con el celular → subir esa foto al OCR — la prueba más realista posible, porque así es como va a llegar un documento real.

## Guía de pruebas

`guia-pruebas-ocr.pdf` — 6 páginas:
1. Recomendaciones para llenar a mano (tipo de letra, tinta) y para fotografiar el documento.
2. Tabla de casos de prueba sugeridos (foto inclinada, poca luz, campo en blanco, archivo no-imagen, persona duplicada, sacramento sin el previo requerido, etc.) — para no probar solo el camino feliz.
3–6. Una ficha por tipo de sacramento con **datos de ejemplo nuevos** (Emilia Aguilar Herrera, David Espinoza Zambrana, Camila Rocha Guzmán, Sergio Paredes Luna × Daniela Montes Ibáñez — ninguno repite a Valentina/Mateo/Sofía/Joaquín) listos para copiar campo por campo en los formularios en blanco. Cada ficha también se verificó contra `helpers/ocrParser.js`.

## Por qué Valentina y Mateo se repiten

No es un descuido — es a propósito. Valentina y Mateo tienen su bautismo, primera comunión y confirmación completos en este set, con los mismos datos (nombre, fecha de nacimiento, padres) en los tres documentos de cada uno. Si se suben **en orden** (bautismo → primera comunión → confirmación → matrimonio), permiten probar de punta a punta la validación que ya existe en `confirmarOCR` (`controllers/sacramentoOcr.js`): que la persona tenga los sacramentos previos antes de poder registrar el siguiente. El matrimonio de ambos solo se puede confirmar con éxito si antes se procesaron y confirmaron los 6 documentos anteriores.

Sofía y Joaquín son bautismos sueltos (bebés recién nacidos, sin sacramentos posteriores) para probar el flujo de "crear persona nueva" con familias distintas sin depender de la cadena anterior.

## Apellidos

Los apellidos siguen la convención española: apellido paterno del hijo = primer apellido del padre, apellido materno del hijo = primer apellido de la madre. Por ejemplo, Valentina Quispe Mamani es hija de Fernando **Quispe** Laura y Rosario **Mamani** Álvarez.
