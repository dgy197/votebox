import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import type { Event, Participant, Question, Ballot } from '../types'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head?: string[][]
      body?: (string | number)[][]
      startY?: number
      theme?: string
      headStyles?: Record<string, unknown>
      styles?: Record<string, unknown>
      columnStyles?: Record<number, Record<string, unknown>>
      margin?: { left?: number; right?: number }
    }) => jsPDF
    lastAutoTable: { finalY: number }
  }
}

interface QuestionResult {
  question: Question
  votes: {
    yes: number
    no: number
    abstain: number
    total: number
    yesPercent: number
    noPercent: number
    abstainPercent: number
  }
  isAccepted: boolean
}

// =====================
// CSV EXPORT
// =====================

/**
 * Export participants list to CSV
 */
export function exportParticipantsToCSV(
  _event: Event,
  participants: Participant[]
): string {
  const data = participants.map((p, index) => ({
    '#': index + 1,
    'Név': p.name,
    'Email': p.email || '-',
    'Belépési kód': p.access_code,
    'Jelen': p.is_present ? 'Igen' : 'Nem',
    'Belépés időpontja': p.joined_at 
      ? new Date(p.joined_at).toLocaleString('hu-HU') 
      : '-',
    'Létrehozva': new Date(p.created_at).toLocaleString('hu-HU'),
  }))

  const csv = Papa.unparse(data, {
    delimiter: ';', // Hungarian Excel uses semicolon
    header: true,
  })

  return csv
}

/**
 * Export voting results to CSV
 */
export function exportResultsToCSV(
  _event: Event,
  results: QuestionResult[]
): string {
  const data = results.map((r, index) => ({
    '#': index + 1,
    'Kérdés': r.question.text_hu,
    'Típus': r.question.type,
    'Igen': r.votes.yes,
    'Nem': r.votes.no,
    'Tartózkodás': r.votes.abstain,
    'Összes szavazat': r.votes.total,
    'Igen %': `${r.votes.yesPercent.toFixed(1)}%`,
    'Eredmény': r.isAccepted ? 'ELFOGADVA' : 'ELUTASÍTVA',
    'Küszöb': r.question.threshold_type === 'simple_majority' 
      ? 'Egyszerű többség' 
      : r.question.threshold_type === 'two_thirds' 
        ? 'Kétharmad' 
        : 'Abszolút többség',
    'Aktiválva': r.question.activated_at 
      ? new Date(r.question.activated_at).toLocaleString('hu-HU')
      : '-',
    'Lezárva': r.question.closed_at 
      ? new Date(r.question.closed_at).toLocaleString('hu-HU')
      : '-',
  }))

  const csv = Papa.unparse(data, {
    delimiter: ';',
    header: true,
  })

  return csv
}

// =====================
// PDF EXPORT
// =====================

/**
 * Generate meeting minutes PDF (jegyzőkönyv)
 */
export function generateMinutesPDF(
  event: Event,
  participants: Participant[],
  results: QuestionResult[]
): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Közgyűlési Jegyzőkönyv', pageWidth / 2, 20, { align: 'center' })
  
  // Event details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  let y = 35
  
  doc.text(`Esemény: ${event.name}`, 20, y)
  y += 7
  if (event.description) {
    doc.text(`Leírás: ${event.description}`, 20, y)
    y += 7
  }
  doc.text(`Esemény kód: ${event.event_code}`, 20, y)
  y += 7
  doc.text(`Dátum: ${new Date().toLocaleDateString('hu-HU')}`, 20, y)
  y += 7
  
  // Participant stats
  const presentCount = participants.filter(p => p.is_present).length
  doc.text(`Regisztrált résztvevők: ${participants.length}`, 20, y)
  y += 7
  doc.text(`Jelenlévők: ${presentCount}`, 20, y)
  y += 7
  
  if (event.quorum_percent) {
    const quorumMet = (presentCount / participants.length) * 100 >= event.quorum_percent
    doc.text(`Kvórum (${event.quorum_percent}%): ${quorumMet ? 'TELJESÜLT' : 'NEM TELJESÜLT'}`, 20, y)
    y += 7
  }
  
  // Horizontal line
  y += 5
  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)
  y += 10
  
  // Voting results section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Szavazási eredmények', 20, y)
  y += 10
  
  // Results table
  if (results.length > 0) {
    doc.autoTable({
      startY: y,
      head: [['#', 'Kérdés', 'Igen', 'Nem', 'Tart.', 'Eredmény']],
      body: results.map((r, i) => [
        (i + 1).toString(),
        r.question.text_hu.length > 50 
          ? r.question.text_hu.substring(0, 47) + '...' 
          : r.question.text_hu,
        r.votes.yes.toString(),
        r.votes.no.toString(),
        r.votes.abstain.toString(),
        r.isAccepted ? '✓ Elfogadva' : '✗ Elutasítva',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        5: { cellWidth: 30 },
      },
      margin: { left: 20, right: 20 },
    })
    
    y = doc.lastAutoTable.finalY + 15
  } else {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'italic')
    doc.text('Nincs lezárt szavazás.', 20, y)
    y += 15
  }
  
  // Detailed results
  if (results.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Részletes eredmények', 20, y)
    y += 10
    
    results.forEach((r, index) => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${r.question.text_hu}`, 20, y)
      y += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Igen: ${r.votes.yes} (${r.votes.yesPercent.toFixed(1)}%)`, 30, y)
      y += 5
      doc.text(`Nem: ${r.votes.no} (${r.votes.noPercent.toFixed(1)}%)`, 30, y)
      y += 5
      doc.text(`Tartózkodás: ${r.votes.abstain} (${r.votes.abstainPercent.toFixed(1)}%)`, 30, y)
      y += 5
      doc.text(`Összesen: ${r.votes.total} szavazat`, 30, y)
      y += 5
      
      const resultText = r.isAccepted ? 'ELFOGADVA' : 'ELUTASÍTVA'
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(r.isAccepted ? 0 : 200, r.isAccepted ? 128 : 0, 0)
      doc.text(`Eredmény: ${resultText}`, 30, y)
      doc.setTextColor(0, 0, 0)
      y += 12
    })
  }
  
  // Participants list
  if (y > 220) {
    doc.addPage()
    y = 20
  }
  
  y += 5
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Résztvevők listája', 20, y)
  y += 10
  
  const presentParticipants = participants.filter(p => p.is_present)
  
  doc.autoTable({
    startY: y,
    head: [['#', 'Név', 'Belépés időpontja']],
    body: presentParticipants.map((p, i) => [
      (i + 1).toString(),
      p.name,
      p.joined_at ? new Date(p.joined_at).toLocaleString('hu-HU') : '-',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  })
  
  // Footer with generation date
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Generálva: ${new Date().toLocaleString('hu-HU')} | VoteBox v2.0 | Oldal ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  return doc
}

// =====================
// DOWNLOAD HELPERS
// =====================

/**
 * Trigger CSV file download
 */
export function downloadCSV(csv: string, filename: string) {
  // Add BOM for Hungarian characters in Excel
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  URL.revokeObjectURL(url)
}

/**
 * Trigger PDF file download
 */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename)
}

// =====================
// RESULT CALCULATOR
// =====================

/**
 * Calculate results from ballots
 */
export function calculateQuestionResult(
  question: Question,
  ballots: Ballot[]
): QuestionResult {
  let yes = 0, no = 0, abstain = 0
  
  ballots.forEach(ballot => {
    const choice = ballot.choices[0]
    if (choice === 'yes') yes++
    else if (choice === 'no') no++
    else if (choice === 'abstain') abstain++
  })
  
  const total = yes + no + abstain
  const validVotes = question.abstain_counts ? total : (yes + no)
  
  const yesPercent = validVotes > 0 ? (yes / validVotes) * 100 : 0
  const noPercent = validVotes > 0 ? (no / validVotes) * 100 : 0
  const abstainPercent = total > 0 ? (abstain / total) * 100 : 0
  
  let isAccepted = false
  if (question.threshold_type === 'simple_majority') {
    isAccepted = yesPercent > 50
  } else if (question.threshold_type === 'two_thirds') {
    isAccepted = yesPercent >= 66.67
  } else if (question.threshold_type === 'absolute') {
    isAccepted = yes > (total / 2)
  }
  
  return {
    question,
    votes: {
      yes, no, abstain, total,
      yesPercent, noPercent, abstainPercent,
    },
    isAccepted,
  }
}
