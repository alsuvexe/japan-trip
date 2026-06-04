import jsPDF from 'jspdf';
import { supabase } from './supabase';

interface Activity {
  id: string;
  category: string;
  time: string;
  title: string;
  description: string;
  sort_order: number;
  attachment_url?: string | null;
  attachment_name?: string | null;
  has_pending_tasks?: boolean;
}

interface DayInfo {
  day_number: number;
  date: string;
  city: string;
  title: string;
  description: string;
}

interface CityStyle {
  name: string;
  icon: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  flight: 'Transporte',
  transport: 'Desplazamiento',
  restaurant: 'Comida',
  activity: 'Actividad',
  visit: 'Visita',
  landmark: 'Monumento',
};

const CATEGORY_ACCENT: Record<string, [number, number, number]> = {
  flight: [2, 132, 199],
  transport: [37, 99, 235],
  restaurant: [194, 65, 12],
  activity: [21, 128, 61],
  visit: [190, 24, 93],
  landmark: [161, 98, 7],
};

// City name → style mapping for the full-itinerary export
const CITY_STYLES_MAP: Record<string, CityStyle> = {
  osaka: { name: 'Osaka', icon: '🏯' },
  kioto: { name: 'Kioto', icon: '⛩️' },
  tokio: { name: 'Tokio', icon: '🗼' },
};

function getCatAccent(cat: string): [number, number, number] {
  return CATEGORY_ACCENT[cat] || [71, 85, 105];
}

function sanitizeText(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*]\s+/gm, '- ')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[^\x00-\x7FÀ-ÿ]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
  const rest = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalized}, ${rest}`;
}

const W = 210;
const H = 297;
const ML = 20;
const MR = 20;
const MB = 22;
const CW = W - ML - MR;
const LINE_H = 5.5;
const FOOTER_Y = H - 12;

// ─── Shared helpers that operate on a doc+y state object ─────────────────────

function renderDayBlock(
  doc: jsPDF,
  yRef: { y: number },
  day: DayInfo,
  activities: Activity[],
  cityStyle: CityStyle,
  isFirstPage: boolean,
) {
  const newPage = () => {
    doc.addPage();
    yRef.y = 20;
  };

  const need = (h: number) => {
    if (yRef.y + h > FOOTER_Y - 4) newPage();
  };

  // ── Day header banner ──
  const headerTop = yRef.y;
  const headerH = 38;

  need(headerH + 20);

  doc.setFillColor(245, 247, 250);
  doc.rect(0, headerTop, W, headerH, 'F');
  doc.setDrawColor(220, 225, 232);
  doc.setLineWidth(0.4);
  doc.line(0, headerTop + headerH, W, headerTop + headerH);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 110, 125);
  doc.text('PLAN DIARIO - VIAJE A JAPON', ML, headerTop + 9);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 25, 35);
  doc.text(`Dia ${day.day_number}  ${cityStyle.name}`, ML, headerTop + 21);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 100, 115);
  doc.text(formatDate(day.date), ML, headerTop + 30);

  if (day.title) {
    const titleClean = sanitizeText(day.title);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 70, 90);
    doc.text(titleClean, W - MR, headerTop + 30, { align: 'right' });
  }

  yRef.y = headerTop + headerH + 10;

  // ── Day description ──
  if (day.description) {
    const descClean = sanitizeText(day.description);
    if (descClean) {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 80);
      const lines = doc.splitTextToSize(descClean, CW) as string[];
      need(lines.length * LINE_H + 4);
      for (const line of lines) {
        doc.text(line, ML, yRef.y);
        yRef.y += LINE_H;
      }
      yRef.y += 6;
      doc.setDrawColor(210, 215, 222);
      doc.setLineWidth(0.3);
      doc.line(ML, yRef.y, W - MR, yRef.y);
      yRef.y += 8;
    }
  }

  // ── Activities header ──
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 90, 110);
  doc.text('ACTIVIDADES DEL DIA', ML, yRef.y);
  yRef.y += 7;

  if (activities.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 150, 165);
    doc.text('No hay actividades registradas para este dia.', ML, yRef.y);
    yRef.y += 10;
  }

  // ── Activity blocks ──
  for (const act of activities) {
    const accent = getCatAccent(act.category);
    const catLabel = CATEGORY_LABELS[act.category] || 'Actividad';
    const headerLabel = act.time ? `${act.time}  |  ${catLabel}` : catLabel;
    const titleClean = sanitizeText(act.title);
    const descClean = act.description ? sanitizeText(act.description) : '';

    doc.setFontSize(8.5);
    const titleLines = doc.splitTextToSize(titleClean, CW - 4) as string[];
    const descLines = descClean ? (doc.splitTextToSize(descClean, CW - 4) as string[]) : [];
    const pendingH = act.has_pending_tasks ? LINE_H + 1 : 0;
    const blockH =
      5 + 5.5 + titleLines.length * LINE_H +
      (descLines.length > 0 ? 3 + descLines.length * LINE_H : 0) +
      pendingH + 5;

    need(blockH + 5);

    doc.setDrawColor(220, 225, 232);
    doc.setLineWidth(0.3);
    doc.line(ML, yRef.y, W - MR, yRef.y);
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(ML, yRef.y, 3, blockH, 'F');

    const innerX = ML + 8;
    let iy = yRef.y + 5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(headerLabel, innerX, iy);
    iy += 5.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 25, 35);
    for (const tl of titleLines) {
      doc.text(tl, innerX, iy);
      iy += LINE_H;
    }

    if (descLines.length > 0) {
      iy += 2;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(65, 75, 95);
      for (const dl of descLines) {
        need(LINE_H + 2);
        doc.text(dl, innerX, iy);
        iy += LINE_H;
      }
    }

    if (act.has_pending_tasks) {
      iy += 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 80, 20);
      doc.text('[PENDIENTE] Revisar reserva o gestion para esta actividad', innerX, iy);
    }

    yRef.y += blockH + 5;
  }

  // ── Summary ──
  yRef.y += 4;
  need(28);
  doc.setDrawColor(210, 215, 222);
  doc.setLineWidth(0.3);
  doc.line(ML, yRef.y, W - MR, yRef.y);
  yRef.y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 90, 110);
  doc.text('RESUMEN DE GASTOS DEL DIA', ML, yRef.y);
  yRef.y += 6;

  const catCounts: Record<string, number> = {};
  for (const a of activities) catCounts[a.category] = (catCounts[a.category] || 0) + 1;
  const cats = Object.keys(catCounts);

  if (cats.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 150, 165);
    doc.text('Sin actividades registradas.', ML, yRef.y);
    yRef.y += 7;
  } else {
    for (const cat of cats) {
      const accent = getCatAccent(cat);
      const label = CATEGORY_LABELS[cat] || cat;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text(label, ML + 4, yRef.y);
      doc.setTextColor(80, 90, 110);
      doc.text(`${catCounts[cat]} ${catCounts[cat] === 1 ? 'elemento' : 'elementos'}`, W - MR, yRef.y, { align: 'right' });
      yRef.y += 5.5;
    }
    yRef.y += 3;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 150, 165);
    doc.text('Los costes exactos dependen del tipo de cambio y elecciones en destino.', ML + 4, yRef.y);
    yRef.y += 5;
  }

  // ── Page break gap before next day ──
  yRef.y += 12;
}

export function exportDayToPdf(
  day: DayInfo,
  activities: Activity[],
  cityStyle: CityStyle,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const yRef = { y: 0 };

  const renderFooter = () => {
    const cur = doc.getCurrentPageInfo().pageNumber;
    const total = doc.getNumberOfPages();
    doc.setDrawColor(210, 215, 220);
    doc.setLineWidth(0.3);
    doc.line(ML, FOOTER_Y + 2, W - MR, FOOTER_Y + 2);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 155, 160);
    doc.text(`Viaje a Japon - ${cityStyle.name} - Dia ${day.day_number}`, ML, FOOTER_Y + 6);
    doc.text(`${cur} / ${total}`, W - MR, FOOTER_Y + 6, { align: 'right' });
  };

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // Header banner on first page
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, W, 42, 'F');
  doc.setDrawColor(220, 225, 232);
  doc.setLineWidth(0.4);
  doc.line(0, 42, W, 42);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 110, 125);
  doc.text('PLAN DIARIO - VIAJE A JAPON', ML, 13);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 25, 35);
  doc.text(`Dia ${day.day_number}  ${cityStyle.name}`, ML, 24);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 100, 115);
  doc.text(formatDate(day.date), ML, 32);

  if (day.title) {
    const titleClean = sanitizeText(day.title);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 70, 90);
    doc.text(titleClean, W - MR, 32, { align: 'right' });
  }

  yRef.y = 52;

  const newPage = () => {
    doc.addPage();
    yRef.y = 20;
    renderFooter();
  };

  const need = (h: number) => {
    if (yRef.y + h > FOOTER_Y - 4) newPage();
  };

  if (day.description) {
    const descClean = sanitizeText(day.description);
    if (descClean) {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 80);
      const lines = doc.splitTextToSize(descClean, CW) as string[];
      need(lines.length * LINE_H + 4);
      for (const line of lines) {
        doc.text(line, ML, yRef.y);
        yRef.y += LINE_H;
      }
      yRef.y += 6;
      doc.setDrawColor(210, 215, 222);
      doc.setLineWidth(0.3);
      doc.line(ML, yRef.y, W - MR, yRef.y);
      yRef.y += 8;
    }
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 90, 110);
  doc.text('ACTIVIDADES DEL DIA', ML, yRef.y);
  yRef.y += 7;

  if (activities.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 150, 165);
    doc.text('No hay actividades registradas para este dia.', ML, yRef.y);
    yRef.y += 10;
  }

  for (const act of activities) {
    const accent = getCatAccent(act.category);
    const catLabel = CATEGORY_LABELS[act.category] || 'Actividad';
    const headerLabel = act.time ? `${act.time}  |  ${catLabel}` : catLabel;
    const titleClean = sanitizeText(act.title);
    const descClean = act.description ? sanitizeText(act.description) : '';

    doc.setFontSize(8.5);
    const titleLines = doc.splitTextToSize(titleClean, CW - 4) as string[];
    const descLines = descClean ? (doc.splitTextToSize(descClean, CW - 4) as string[]) : [];
    const pendingH = act.has_pending_tasks ? LINE_H + 1 : 0;
    const blockH =
      5 + 5.5 + titleLines.length * LINE_H +
      (descLines.length > 0 ? 3 + descLines.length * LINE_H : 0) +
      pendingH + 5;

    need(blockH + 5);

    doc.setDrawColor(220, 225, 232);
    doc.setLineWidth(0.3);
    doc.line(ML, yRef.y, W - MR, yRef.y);
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(ML, yRef.y, 3, blockH, 'F');

    const innerX = ML + 8;
    let iy = yRef.y + 5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(headerLabel, innerX, iy);
    iy += 5.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 25, 35);
    for (const tl of titleLines) {
      doc.text(tl, innerX, iy);
      iy += LINE_H;
    }

    if (descLines.length > 0) {
      iy += 2;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(65, 75, 95);
      for (const dl of descLines) {
        need(LINE_H + 2);
        doc.text(dl, innerX, iy);
        iy += LINE_H;
      }
    }

    if (act.has_pending_tasks) {
      iy += 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 80, 20);
      doc.text('[PENDIENTE] Revisar reserva o gestion para esta actividad', innerX, iy);
    }

    yRef.y += blockH + 5;
  }

  yRef.y += 4;
  need(28);

  doc.setDrawColor(210, 215, 222);
  doc.setLineWidth(0.3);
  doc.line(ML, yRef.y, W - MR, yRef.y);
  yRef.y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 90, 110);
  doc.text('RESUMEN DE GASTOS DEL DIA', ML, yRef.y);
  yRef.y += 6;

  const catCounts: Record<string, number> = {};
  for (const a of activities) catCounts[a.category] = (catCounts[a.category] || 0) + 1;
  const cats = Object.keys(catCounts);

  if (cats.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 150, 165);
    doc.text('Sin actividades registradas.', ML, yRef.y);
    yRef.y += 7;
  } else {
    for (const cat of cats) {
      const accent = getCatAccent(cat);
      const label = CATEGORY_LABELS[cat] || cat;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text(label, ML + 4, yRef.y);
      doc.setTextColor(80, 90, 110);
      doc.text(`${catCounts[cat]} ${catCounts[cat] === 1 ? 'elemento' : 'elementos'}`, W - MR, yRef.y, { align: 'right' });
      yRef.y += 5.5;
    }
    yRef.y += 3;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 150, 165);
    doc.text('Los costes exactos dependen del tipo de cambio y elecciones en destino.', ML + 4, yRef.y);
    yRef.y += 5;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    renderFooter();
  }

  const safeCityName = cityStyle.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
  doc.save(`Plan_Japon_Dia${day.day_number}_${safeCityName}.pdf`);
}

// ─── Full itinerary export ────────────────────────────────────────────────────

export async function exportFullItineraryToPdf(): Promise<void> {
  // 1. Fetch all days ordered chronologically
  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*')
    .order('date', { ascending: true })
    .order('day_number', { ascending: true });

  if (!days || days.length === 0) return;

  // 2. Fetch all activities for those days
  const dayIds = days.map((d) => d.id);
  const { data: allActivities } = await supabase
    .from('day_activities')
    .select('*')
    .in('day_id', dayIds)
    .order('sort_order', { ascending: true });

  const activitiesByDay: Record<string, Activity[]> = {};
  for (const act of allActivities ?? []) {
    if (!activitiesByDay[act.day_id]) activitiesByDay[act.day_id] = [];
    activitiesByDay[act.day_id].push(act);
  }

  // 3. Build the document
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Cover page
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, W, H, 'F');
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 25, 35);
  doc.text('Viaje a Japon', W / 2, 110, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 110);
  doc.text('Diciembre 2026', W / 2, 124, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(130, 140, 155);
  doc.text(`Itinerario completo - ${days.length} dias`, W / 2, 136, { align: 'center' });

  // Draw a thin separator under cover text
  doc.setDrawColor(210, 215, 222);
  doc.setLineWidth(0.5);
  doc.line(ML + 20, 145, W - MR - 20, 145);

  // List cities
  const cityList = Array.from(new Set(days.map((d) => d.city)));
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 110, 125);
  doc.text('CIUDADES', W / 2, 158, { align: 'center' });
  cityList.forEach((c, i) => {
    const style = CITY_STYLES_MAP[c] || { name: c, icon: '' };
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 50, 70);
    doc.text(style.name, W / 2, 168 + i * 10, { align: 'center' });
  });

  const yRef = { y: 0 };

  // Render each day
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const activities = activitiesByDay[day.id] ?? [];
    const cityStyle = CITY_STYLES_MAP[day.city] || { name: day.city, icon: '' };

    // Every day starts on a new page (after the cover)
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');
    yRef.y = 0;

    renderDayBlock(doc, yRef, day, activities, cityStyle, true);
  }

  // Add footers to all pages except the cover
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    const dayIndex = p - 2;
    const day = days[dayIndex] ?? days[days.length - 1];
    const cityStyle = CITY_STYLES_MAP[day.city] || { name: day.city, icon: '' };

    doc.setDrawColor(210, 215, 220);
    doc.setLineWidth(0.3);
    doc.line(ML, FOOTER_Y + 2, W - MR, FOOTER_Y + 2);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 155, 160);
    doc.text(`Viaje a Japon - ${cityStyle.name} - Dia ${day.day_number}`, ML, FOOTER_Y + 6);
    doc.text(`${p - 1} / ${totalPages - 1}`, W - MR, FOOTER_Y + 6, { align: 'right' });
  }

  doc.save('Itinerario_Completo_Japon.pdf');
}
