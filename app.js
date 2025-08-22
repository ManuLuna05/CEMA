// ====== AJUSTES GLOBALES ======
const BASELINE_Y = -4; // Desplaza todo el texto hacia abajo/arriba (negativo = baja). Prueba -3 a -6.
const DEFAULT_SIZE = 10;
const SMALL_SIZE = 8;

// ====== COORDENADAS (ACTUALÍZALAS TRAS CALIBRAR) ======
const coords = {
    proveedor: { x: 120, y: 690 },
    fecha:     { x: 460, y: 690 },
    tlf:       { x: 120, y: 668 },
    movil:     { x: 460, y: 668 },
    ciudad:    { x: 120, y: 626 },
    provincia: { x: 460, y: 626 },
    nif:       { x: 120, y: 606 },
    contacto:  { x: 460, y: 606 },
    email:     { x: 120, y: 586 },
    cargo:     { x: 460, y: 586 },

  // PEDIDO (línea 1)
  marca1:    { x: 85,  y: 573 },
  modelo1:   { x: 205, y: 573 },
  serie1:    { x: 330, y: 573 },
  ano1:      { x: 430, y: 573 },
  horas1:    { x: 500, y: 573 },
  precio1:   { x: 580, y: 573 },

  // ACCESORIOS (bloque 1) — posiciones de las “X”
  ce1_SI:    { x: 110, y: 548 }, ce1_NO: { x: 135, y: 548 },
  ficha1_SI: { x: 240, y: 548 }, ficha1_NO:{ x: 270, y: 548 },
  perm1_SI:  { x: 420, y: 548 }, perm1_NO:{ x: 450, y: 548 },
  itv1_SI:   { x: 520, y: 548 }, itv1_NO:{ x: 550, y: 548 },
};

// ====== UTILIDADES ======
async function loadTemplateArrayBuffer() {
  const fileInput = document.getElementById('templateFile');
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (file) return await file.arrayBuffer();
  // GitHub Pages o servidor local
  const tryUrls = ['HOJA_PEDIDOS.pdf', 'HOJA_PEDIDOS'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.arrayBuffer();
    } catch {}
  }
  throw new Error('No se encontró la plantilla. Sube el PDF o coloca HOJA_PEDIDOS.pdf junto al index.html.');
}

function drawText(page, font, fontBold, key, text, opts = {}) {
  if (!text) return;
  const pos = coords[key];
  if (!pos) return;
  page.drawText(String(text), {
    x: pos.x,
    y: pos.y + BASELINE_Y,              // <<— ajuste global
    size: opts.size ?? DEFAULT_SIZE,
    font: opts.bold ? fontBold : font,
    color: PDFLib.rgb(0,0,0),
    maxWidth: opts.maxWidth
  });
}

function markBox(page, fontBold, baseKey, value) {
  if (!value) return;
  const key = `${baseKey}_${value.toUpperCase()}`; // ej: ce1_SI
  const pos = coords[key];
  if (!pos) return;
  page.drawText('X', { x: pos.x, y: pos.y, size: 12, font: fontBold, color: PDFLib.rgb(0,0,0) });
}

// ====== GENERAR PDF NORMAL ======
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    const templateBytes = await loadTemplateArrayBuffer();
    const { PDFDocument, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];

    // Info tamaño de página (te ayuda a estimar)
    const { width, height } = page.getSize();
    console.log('Tamaño de página:', { width, height }); // Ej: A4 ~ 595 x 842 pt

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Proveedor
    drawText(page, font, fontBold, 'proveedor', data.proveedor, { bold: true });
    drawText(page, font, fontBold, 'fecha', data.fecha);
    drawText(page, font, fontBold, 'tlf', data.tlf);
    drawText(page, font, fontBold, 'movil', data.movil);
    drawText(page, font, fontBold, 'ciudad', data.ciudad);
    drawText(page, font, fontBold, 'provincia', data.provincia);
    drawText(page, font, fontBold, 'nif', data.nif);
    drawText(page, font, fontBold, 'contacto', data.contacto);
    drawText(page, font, fontBold, 'email', data.email, { size: SMALL_SIZE });
    drawText(page, font, fontBold, 'cargo', data.cargo);

    // Pedido 1
    drawText(page, font, fontBold, 'marca1', data.marca1);
    drawText(page, font, fontBold, 'modelo1', data.modelo1);
    drawText(page, font, fontBold, 'serie1', data.serie1);
    drawText(page, font, fontBold, 'ano1', data.ano1);
    drawText(page, font, fontBold, 'horas1', data.horas1);
    drawText(page, font, fontBold, 'precio1', data.precio1);

    // Accesorios 1
    markBox(page, fontBold, 'ce1', data.ce1);
    markBox(page, fontBold, 'ficha1', data.ficha1);
    markBox(page, fontBold, 'perm1', data.permiso1);
    markBox(page, fontBold, 'itv1', data.itv1);

    // Descargar
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `propuesta_compra_${(data.proveedor || 'documento').replace(/\s+/g, '_')}.pdf`
    });
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  } catch (err) {
    console.error(err);
    alert('No pude generar el PDF. Mira la consola para detalles.');
  }
});

// ====== MODO REJILLA PARA CALIBRAR ======
document.getElementById('btnCalibrar').addEventListener('click', async () => {
  try {
    const templateBytes = await loadTemplateArrayBuffer();
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Rejilla cada 20pt; gruesa cada 100pt
    const step = 20;
    for (let x = 0; x <= width; x += step) {
      page.drawLine({
        start: { x, y: 0 },
        end:   { x, y: height },
        thickness: (x % 100 === 0) ? 0.8 : 0.2,
        color: rgb(0.7,0.7,1)
      });
      if (x % 100 === 0) {
        page.drawText(String(x), { x: x + 2, y: 4, size: 8, font, color: rgb(0.2,0.2,0.6) });
      }
    }
    for (let y = 0; y <= height; y += step) {
      page.drawLine({
        start: { x: 0, y },
        end:   { x: width, y },
        thickness: (y % 100 === 0) ? 0.8 : 0.2,
        color: rgb(0.7,0.7,1)
      });
      if (y % 100 === 0) {
        page.drawText(String(y), { x: 4, y: y + 2, size: 8, font, color: rgb(0.2,0.2,0.6) });
      }
    }

    // Marcas del origen y recordatorio
    page.drawText('ORIGEN (0,0)', { x: 4, y: 8, size: 10, font, color: rgb(0.8,0,0) });
    page.drawText('Ejes en puntos PDF. Texto usa línea base; ajusta con BASELINE_Y.', { x: 100, y: height - 20, size: 9, font, color: rgb(0.8,0,0) });

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'plantilla_con_rejilla.pdf'
    });
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
    console.log('Tamaño de página para tu plantilla:', { width, height });
  } catch (err) {
    console.error(err);
    alert('No pude generar el PDF de calibración. Revisa consola.');
  }
});
