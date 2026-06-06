import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Estimate, EstimateLineItem } from '@/types/models.types';

// ── Single-color professional palette ────────────────────────────────────────
type RGB = readonly [number, number, number];
const PRIMARY: RGB = [37,  99,  235];   // blue-600  — the ONE brand color
const DARK:    RGB = [15,  23,  42];    // near-black text
const SUB:     RGB = [71,  85,  105];   // secondary text
const MUTED:   RGB = [148, 163, 184];   // muted / labels
const BORDER:  RGB = [226, 232, 240];   // light dividers
const ROWALT:  RGB = [248, 250, 252];   // alternating table row


const fill  = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const draw  = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const color = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

function money(n: number | string | undefined | null): string {
  return `$${Number(n ?? 0).toFixed(2)}`;
}
function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Draw a thin horizontal rule
function rule(doc: jsPDF, y: number, M: number, CW: number, weight = 0.3): void {
  draw(doc, BORDER);
  doc.setLineWidth(weight);
  doc.line(M, y, M + CW, y);
}

// Small ALL-CAPS section label
function sectionLabel(doc: jsPDF, text: string, x: number, y: number): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  color(doc, PRIMARY);
  doc.text(text, x, y);
}

// ─────────────────────────────────────────────────────────────────────────────

export function downloadEstimatePdf(
  estimate: Estimate,
  lineItems: EstimateLineItem[],
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const M   = 16;
  const CW  = PW - M * 2;
  const FOOTER_H    = 12;
  const SAFE_BOTTOM = PH - FOOTER_H - 4;
  let   y   = 0;

  const cf          = (estimate.custom_fields as Record<string, unknown>) || {};
  const title       = (cf.title as string) || 'Service Estimate';
  const termsText   = (cf.terms_and_conditions as string) || '';
  const isApproved  = estimate.status === 'approved' || estimate.status === 'converted_to_wo';

  const hasSig      = isApproved && !!estimate.signature_url;
  const contactName = estimate.contact
    ? `${estimate.contact.first_name} ${estimate.contact.last_name}` : '—';



  // ── 1. HEADER ───────────────────────────────────────────────────────────────
  // Blue top accent bar
  fill(doc, PRIMARY);
  doc.rect(0, 0, PW, 2.5, 'F');

  y = 10;

  // Left: company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  color(doc, PRIMARY);
  doc.text('FieldForce Pro', M, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  color(doc, MUTED);
  doc.text('Field Service Management', M, y + 5);

  // Right: document type + number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  color(doc, DARK);
  doc.text('ESTIMATE', PW - M, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  color(doc, MUTED);
  doc.text(estimate.estimate_number || '', PW - M, y + 5.5, { align: 'right' });

  // Estimate title (if present)
  if (title && title !== 'Service Estimate') {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    color(doc, SUB);
    doc.text(title, PW - M, y + 11, { align: 'right' });
    y += 19;
  } else {
    y += 14;
  }

  rule(doc, y, M, CW, 0.5);
  y += 7;

  // ── 2. BILL TO  +  ESTIMATE DETAILS ─────────────────────────────────────────

  const lineH = 5.2;

  // — Left column header —
  sectionLabel(doc, 'BILL TO', M, y);

  // — Right column header (right-aligned) —
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); color(doc, PRIMARY);
  doc.text('ESTIMATE DETAILS', PW - M, y, { align: 'right' });

  y += 5;
  const infoTopY = y;  // anchor for right column

  // — Left column content —
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  color(doc, DARK);
  doc.text(contactName, M, y);
  y += lineH + 0.5;

  if (estimate.contact?.email) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(doc, SUB);
    doc.text(estimate.contact.email, M, y);
    y += lineH;
  }
  if (estimate.contact?.phone) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(doc, SUB);
    doc.text(estimate.contact.phone, M, y);
    y += lineH;
  }

  const leftEndY = y;

  // — Right column content (key: value rows) —
  const detailRows: [string, string][] = [
    ['Estimate No.',  estimate.estimate_number || '—'],
    ['Date',          fmtDate(estimate.created_at)],
    ['Valid Until',   estimate.expiry_date ? fmtDate(estimate.expiry_date) : '—'],
  ];

  // Find the widest value so all labels align at the same x
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  const maxValW = Math.max(...detailRows.map(([, val]) => doc.getTextWidth(val)));
  const fixedLblX = PW - M - maxValW - 3;

  let ry = infoTopY;
  detailRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); color(doc, DARK);
    doc.text(val, PW - M, ry, { align: 'right' });

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(doc, MUTED);
    doc.text(lbl, fixedLblX, ry, { align: 'right' });
    ry += lineH;
  });

  y = Math.max(leftEndY, ry) + 6;

  rule(doc, y, M, CW, 0.4);
  y += 7;

  // ── 3. LINE ITEMS TABLE ──────────────────────────────────────────────────────
  const sorted = [...lineItems].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const tableBody = sorted.map((item, idx) => {
    const qty   = Number(item.quantity   ?? 0);
    const price = Number(item.unit_price ?? 0);
    const disc  = Number(item.discount   ?? 0);
    return [
      String(idx + 1),
      item.name,
      qty % 1 === 0 ? String(qty) : qty.toFixed(2),
      money(price),
      money(qty * price - disc),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Items', 'Qty', 'Unit Price', 'Amount']],
    body: tableBody.length > 0 ? tableBody : [['', 'No line items added', '', '', '']],
    margin: { left: M, right: M },
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 2.5, right: 4, bottom: 2.5, left: 4 },
      overflow: 'linebreak',
      lineColor: [BORDER[0], BORDER[1], BORDER[2]],
      lineWidth: 0.15,
      textColor: [SUB[0], SUB[1], SUB[2]],
      font: 'helvetica',
    },
    headStyles: {
      fillColor:   [PRIMARY[0], PRIMARY[1], PRIMARY[2]],
      textColor:   [255, 255, 255],
      fontStyle:   'bold',
      fontSize:    8,
      halign:      'left',
      valign:      'middle',
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
    },
    alternateRowStyles: {
      fillColor: [ROWALT[0], ROWALT[1], ROWALT[2]],
    },
    columnStyles: {
      0: { cellWidth: 13, halign: 'center', textColor: [MUTED[0], MUTED[1], MUTED[2]] },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [DARK[0], DARK[1], DARK[2]] },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY;

  // ── 4. TOTALS ────────────────────────────────────────────────────────────────
  const subtotal   = Number(estimate.subtotal ?? 0);
  const tax        = Number(estimate.tax      ?? 0);
  const discount   = Number(estimate.discount ?? 0);
  const grandTotal = Number(estimate.total    ?? 0);

  const totLabelX = M + CW * 0.58;
  const totValX   = M + CW;
  const totRowH   = 6;

  const totRows: [string, string][] = [
    ['Subtotal', money(subtotal)],
    ...(discount > 0 ? [['Discount', `-${money(discount)}`] as [string, string]] : []),
    ['Tax', money(tax)],
  ];

  const totH = totRows.length * totRowH + 14; // rows + grand total row
  if (y + totH > SAFE_BOTTOM) { doc.addPage(); y = 20; }

  let ty = y + 4;
  totRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(doc, MUTED);
    doc.text(lbl, totLabelX + 4, ty);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(doc, DARK);
    doc.text(val, totValX - 4, ty, { align: 'right' });
    ty += totRowH;
  });

  // thin rule above grand total
  draw(doc, BORDER); doc.setLineWidth(0.4);
  doc.line(totLabelX + 4, ty, totValX - 4, ty);
  ty += 5;

  // Grand total row
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); color(doc, PRIMARY);
  doc.text('Total (USD)', totLabelX + 4, ty);
  doc.setFontSize(11);
  doc.text(money(grandTotal), totValX - 4, ty, { align: 'right' });

  y += totH + 4;

  rule(doc, y, M, CW, 0.3);
  y += 6;

  // ── 5. NOTES ─────────────────────────────────────────────────────────────────
  if (estimate.notes) {
    if (y + 14 > SAFE_BOTTOM) { doc.addPage(); y = 20; }
    sectionLabel(doc, 'NOTES', M, y);
    y += 5;
    const nLines = doc.splitTextToSize(estimate.notes, CW) as string[];
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(doc, SUB);
    doc.text(nLines, M, y);
    y += (nLines.length * 5) + 5;
    rule(doc, y, M, CW, 0.3);
    y += 6;
  }

  // ── 6. TERMS AND CONDITIONS ──────────────────────────────────────────────────
  if (y + 16 > SAFE_BOTTOM) { doc.addPage(); y = 20; }
  sectionLabel(doc, 'TERMS AND CONDITIONS', M, y);
  y += 5;

  const termLines = termsText.split('\n').filter((l) => l.trim());

  if (termLines.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); color(doc, MUTED);
    doc.text('No terms and conditions specified.', M, y);
    y += 6;
  } else {
    termLines.forEach((line, idx) => {
      if (y + 5 > SAFE_BOTTOM) { doc.addPage(); y = 20; }
      const numbered = /^\d+\./.test(line.trim()) ? line.trim() : `${idx + 1}. ${line.trim()}`;
      const colonIdx = numbered.indexOf(':');

      if (colonIdx > 0 && colonIdx < 35) {
        const boldPart   = numbered.slice(0, colonIdx + 1);
        const normalPart = numbered.slice(colonIdx + 1).trim();
        doc.setFont('helvetica', 'bold');   doc.setFontSize(8); color(doc, DARK);
        doc.text(boldPart, M, y);
        const bW = doc.getTextWidth(boldPart);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(doc, SUB);
        const rest = doc.splitTextToSize(normalPart, CW - bW - 2) as string[];
        if (rest[0]) doc.text(rest[0], M + bW + 1, y);
        for (let i = 1; i < rest.length; i++) { y += 4.8; doc.text(rest[i], M + bW + 1, y); }
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(doc, SUB);
        const wrapped = doc.splitTextToSize(numbered, CW) as string[];
        doc.text(wrapped, M, y);
        y += (wrapped.length - 1) * 4.8;
      }
      y += 5;
    });
  }

  rule(doc, y, M, CW, 0.3);
  y += 6;

  // ── 7. SIGNATURE ─────────────────────────────────────────────────────────────
  const sigLineW = 72;
  const sigX     = M + CW - sigLineW;
  const sigH     = hasSig ? 36 : 22;

  if (y + sigH + FOOTER_H > PH - 2) { doc.addPage(); y = 20; }

  if (hasSig) {
    // Signature image — no box, just the image with a thin underline
    try {
      doc.addImage(estimate.signature_url!, 'PNG', sigX, y, sigLineW, 22);
    } catch {
      // fallback: blank space
    }
    y += 22;
    // Underline beneath signature image
    draw(doc, MUTED); doc.setLineWidth(0.4);
    doc.line(sigX, y, sigX + sigLineW, y);
    y += 4;
  } else {
    // Blank signature line
    y += 14;
    draw(doc, MUTED); doc.setLineWidth(0.4);
    doc.line(sigX, y, sigX + sigLineW, y);
    y += 4;
  }

  // Label: "Authorized Signature"
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); color(doc, MUTED);
  doc.text('Authorized Signature', sigX, y + 3.5);

  // Customer name (right-aligned end of line)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); color(doc, DARK);
  doc.text(contactName, sigX + sigLineW, y + 3.5, { align: 'right' });

  y += 8;

  // ── 8. FOOTER (all pages) ────────────────────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // thin top rule on footer
    draw(doc, BORDER); doc.setLineWidth(0.3);
    doc.line(M, PH - FOOTER_H, M + CW, PH - FOOTER_H);

    // Left: company
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); color(doc, PRIMARY);
    doc.text('FieldForce Pro', M, PH - 5);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); color(doc, MUTED);
    doc.text('  ·  support@fieldforce.pro', M + doc.getTextWidth('FieldForce Pro'), PH - 5);

    // Center: disclaimer
    doc.setFontSize(6.5); color(doc, MUTED);
    doc.text(
      'Valid until expiry date shown. Prices subject to change.',
      PW / 2, PH - 5, { align: 'center' },
    );

    // Right: page number
    doc.setFontSize(7); color(doc, MUTED);
    doc.text(`Page ${p} of ${totalPages}`, PW - M, PH - 5, { align: 'right' });
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  doc.save(`Estimate-${estimate.estimate_number || estimate.id.slice(0, 8)}.pdf`);
}
