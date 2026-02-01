import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import type { Event, Participant, Question } from '../types';

// CSV Export
export function exportParticipantsCSV(participants: Participant[], eventName: string) {
  const data = participants.map(p => ({
    Név: p.name,
    Email: p.email || '',
    'Belépési kód': p.access_code,
    Létrehozva: new Date(p.created_at).toLocaleString('hu-HU'),
  }));

  const csv = Papa.unparse(data, {
    delimiter: ';',
    header: true,
  });

  downloadFile(csv, `resztvevok-${slugify(eventName)}-${dateStamp()}.csv`, 'text/csv;charset=utf-8');
}

export function exportResultsCSV(
  questions: Question[], 
  results: Record<string, { yes: number; no: number; abstain: number }>,
  eventName: string
) {
  const data = questions.map(q => ({
    Kérdés: q.text_hu,
    Igen: results[q.id]?.yes || 0,
    Nem: results[q.id]?.no || 0,
    Tartózkodom: results[q.id]?.abstain || 0,
    Összesen: (results[q.id]?.yes || 0) + (results[q.id]?.no || 0) + (results[q.id]?.abstain || 0),
    Eredmény: getResultText(results[q.id]),
  }));

  const csv = Papa.unparse(data, {
    delimiter: ';',
    header: true,
  });

  downloadFile(csv, `eredmenyek-${slugify(eventName)}-${dateStamp()}.csv`, 'text/csv;charset=utf-8');
}

// PDF Export (Meeting Minutes)
export function exportMeetingMinutesPDF(
  event: Event,
  questions: Question[],
  results: Record<string, { yes: number; no: number; abstain: number }>,
  participantCount: number
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.text('SZAVAZÁSI JEGYZŐKÖNYV', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Event info
  doc.setFontSize(12);
  doc.text(`Esemény: ${event.name}`, 20, y);
  y += 8;
  doc.text(`Dátum: ${new Date().toLocaleDateString('hu-HU')}`, 20, y);
  y += 8;
  doc.text(`Résztvevők száma: ${participantCount}`, 20, y);
  y += 15;

  // Separator
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Questions and results
  doc.setFontSize(14);
  doc.text('Szavazások:', 20, y);
  y += 10;

  questions.forEach((q, index) => {
    // Check for page break
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${q.text_hu}`, 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    const r = results[q.id] || { yes: 0, no: 0, abstain: 0 };
    const total = r.yes + r.no + r.abstain;
    
    doc.text(`   Igen: ${r.yes} (${total ? Math.round(r.yes / total * 100) : 0}%)`, 25, y);
    y += 6;
    doc.text(`   Nem: ${r.no} (${total ? Math.round(r.no / total * 100) : 0}%)`, 25, y);
    y += 6;
    doc.text(`   Tartózkodom: ${r.abstain} (${total ? Math.round(r.abstain / total * 100) : 0}%)`, 25, y);
    y += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`   Eredmény: ${getResultText(r)}`, 25, y);
    y += 12;
  });

  // Footer
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generálva: ${new Date().toLocaleString('hu-HU')} - VoteBox`, 20, y);

  // Save
  doc.save(`jegyzokonyv-${slugify(event.name)}-${dateStamp()}.pdf`);
}

// Helpers
function getResultText(result?: { yes: number; no: number; abstain: number }) {
  if (!result) return 'Nincs adat';
  const { yes, no } = result;
  if (yes > no) return 'ELFOGADVA';
  if (no > yes) return 'ELUTASÍTVA';
  return 'DÖNTETLEN';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
