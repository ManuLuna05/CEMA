// Coordenadas aproximadas (x, y) en puntos PDF desde la esquina inferior-izquierda.
// Ajusta a tu plantilla con prueba–error. Añade más claves para más filas/casillas.
const coords = {
  proveedor: { x: 85,  y: 720 },
  fecha:     { x: 420, y: 720 },
  tlf:       { x: 85,  y: 701 },
  movil:     { x: 420, y: 701 },
  ciudad:    { x: 85,  y: 663 },
  provincia: { x: 420, y: 663 },
  nif:       { x: 85,  y: 644 },
  contacto:  { x: 420, y: 644 },
  email:     { x: 85,  y: 625 },
  cargo:     { x: 420, y: 625 },

  // Primera línea de "PEDIDO"
  marca1:    { x: 85,  y: 573 },
  modelo1:   { x: 205, y: 573 },
  serie1:    { x: 330, y: 573 },
  ano1:      { x: 430, y: 573 },
  horas1:    { x: 500, y: 573 },
  precio1:   { x: 580, y: 573 },

  // Accesorios (bloque 1) – “X” en las casillas
  ce1_SI:    { x: 110, y: 548 }, ce1_NO: { x: 135, y: 548 },
  ficha1_SI: { x: 240, y: 548 }, ficha1_NO:{ x: 270, y: 548 },
  perm1_SI:  { x: 420, y: 548 }, perm1_NO:{ x: 450, y: 548 },
  itv1_SI:   { x: 520, y: 548 }, itv1_NO:{ x: 550, y: 548 },
};

const fontSize = 10;
const fontSizeSmall = 8;

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // 1) Datos del formulario
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());

  // 2) Cargar la plantilla (debe estar en la misma carpeta)
  const templateBytes = await fetch('HOJA_PEDIDOS.pdf').then(r => r.arrayBuffer());
  const { PDFDocument, StandardFonts, rgb } = PDFLib;

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];

  // 3) Fuentes
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helpers
  const draw = (key, text, opts = {}) => {
    if (!text) return;
    const pos = coords[key];
    if (!pos) return;
    page.drawText(String(text), {
      x: pos.x, y: pos.y,
      size: opts.size ?? fontSize,
      font: opts.bold ? fontBold : font,
      color: rgb(0,0,0),
      maxWidth: opts.maxWidth
    });
  };

  const mark = (baseKey, value) => {
    if (!value) return;
    const key = `${baseKey}_${value.toUpperCase()}`; // ej: ce1_SI
    const pos = coords[key];
    if (!pos) return;
    page.drawText('X', { x: pos.x, y: pos.y, size: 12, font: fontBold, color: rgb(0,0,0) });
  };

  // 4) Escribir campos
  draw('proveedor', data.proveedor, { bold: true });
  draw('fecha', data.fecha);
  draw('tlf', data.tlf);
  draw('movil', data.movil);
  draw('ciudad', data.ciudad);
  draw('provincia', data.provincia);
  draw('nif', data.nif);
  draw('contacto', data.contacto);
  draw('email', data.email, { size: fontSizeSmall });
  draw('cargo', data.cargo);

  // Pedido – primera línea
  draw('marca1', data.marca1);
  draw('modelo1', data.modelo1);
  draw('serie1', data.serie1);
  draw('ano1', data.ano1);
  draw('horas1', data.horas1);
  draw('precio1', data.precio1);

  // Accesorios (bloque 1)
  mark('ce1', data.ce1);
  mark('ficha1', data.ficha1);
  mark('perm1', data.permiso1);
  mark('itv1', data.itv1);

  // 5) Descargar
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `propuesta_compra_${(data.proveedor || 'documento').replace(/\s+/g, '_')}.pdf`
  });
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
});
