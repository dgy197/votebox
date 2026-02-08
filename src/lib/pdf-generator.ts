/**
 * VoteBox PDF Generátor
 * Magyar karaktereket támogató jegyzőkönyv PDF export
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// === Types ===

export interface PdfExportOptions {
  filename?: string
  title?: string
  addWatermark?: boolean
}

interface ParsedMinutes {
  title: string
  organizationName: string
  date: string
  time: string
  meetingType: string
  location: string
  attendees: Array<{ name: string; weight: string; type: string }>
  totalAttendees: number
  totalWeight: string
  quorum: {
    reached: boolean
    percentage: string
    required: string
  }
  officials: {
    chair: string
    secretary: string
    verifiers: string[]
  }
  agendaItems: Array<{
    number: number
    title: string
    description?: string
    votes?: {
      yes: string
      no: string
      abstain?: string
    }
    resolution?: {
      number: string
      passed: boolean
      text: string
    }
    noVote?: boolean
    pending?: boolean
  }>
  closingTime: string
  city: string
}

// === Helpers ===

/**
 * Parse markdown content into structured data
 */
function parseMinutesMarkdown(markdown: string): ParsedMinutes {
  const lines = markdown.split('\n')
  
  // Extract basic info from header
  const headerMatch = markdown.match(/Készült: \*\*(.+?)\*\* (.+?) napján, (.+?)-kor tartott \*\*(.+?)\*\* közgyűléséről/)
  const locationMatch = markdown.match(/\*\*Helyszín:\*\* (.+)/)
  
  // Parse attendance table
  const attendees: ParsedMinutes['attendees'] = []
  const tableLines = lines.filter(l => l.startsWith('|') && !l.includes('---'))
  for (const line of tableLines.slice(1)) { // Skip header
    const cells = line.split('|').filter(c => c.trim())
    if (cells.length >= 3) {
      const name = cells[0].trim().replace(/[👤💻]/g, '').trim()
      const weight = cells[1].trim().replace(/[()]/g, '').split(' ')[0]
      const type = cells[2].trim().replace(/[👤💻]/g, '').trim()
      if (name && !name.includes('Név') && !name.includes('---')) {
        attendees.push({ name, weight, type })
      }
    }
  }

  // Parse totals
  const totalMatch = markdown.match(/\*\*Összesen:\*\* (\d+) fő, \*\*(.+?)\*\*/)
  
  // Parse quorum
  const quorumReached = markdown.includes('✅ HATÁROZATKÉPES') || markdown.includes('határozatképes')
  const quorumPercentMatch = markdown.match(/\*\*(\d+\.?\d*)%\*\*-a képviseltette/) || markdown.match(/(\d+\.?\d*)%-a képviseltette/)
  const quorumRequiredMatch = markdown.match(/\(Szükséges: (\d+)%\)/) || markdown.match(/szükséges: (\d+)%/)

  // Parse officials
  const chairMatch = markdown.match(/\*\*Levezető elnök:\*\* (.+)/)
  const secretaryMatch = markdown.match(/\*\*Jegyzőkönyvvezető:\*\* (.+)/)
  const verifiersMatch = markdown.match(/\*\*Jegyzőkönyv hitelesítők:\*\* (.+)/)
  
  // Parse agenda items
  const agendaItems: ParsedMinutes['agendaItems'] = []
  const agendaSections = markdown.split(/### \d+\./).slice(1)
  
  let itemNum = 0
  for (const section of agendaSections) {
    if (section.includes('számú HATÁROZAT') || section.includes('NAPIRENDI PONT')) continue
    
    itemNum++
    const titleMatch = section.match(/^(.+?)(\n|$)/)
    const title = titleMatch ? titleMatch[1].trim() : `Napirendi pont ${itemNum}`
    
    // Find description (first paragraph after title)
    const descLines = section.split('\n').slice(1).filter(l => l.trim() && !l.startsWith('**') && !l.startsWith('-') && !l.startsWith('>'))
    const description = descLines[0]?.trim()
    
    // Parse vote results
    const yesMatch = section.match(/[✅]? ?Igen: ([\d.]+%)/)
    const noMatch = section.match(/[❌]? ?Nem: ([\d.]+%)/)
    const abstainMatch = section.match(/[⚪]? ?Tartózkodott: ([\d.]+%)/)
    
    const votes = yesMatch ? {
      yes: yesMatch[1],
      no: noMatch?.[1] || '0%',
      abstain: abstainMatch?.[1]
    } : undefined
    
    // Parse resolution
    const resNumMatch = section.match(/\*\*(\d+\/\d+)\. számú HATÁROZAT\*\*/)
    const passedMatch = section.match(/\*\*(ELFOGADTA|ELUTASÍTOTTA)\*\*/)
    
    const resolution = resNumMatch ? {
      number: resNumMatch[1],
      passed: passedMatch?.[1] === 'ELFOGADTA',
      text: description || ''
    } : undefined

    const noVote = section.includes('Szavazás nélküli') || section.includes('szavazás')
    const pending = section.includes('Még nem tárgyalt') || section.includes('folyamatban')

    agendaItems.push({
      number: itemNum,
      title,
      description,
      votes,
      resolution,
      noVote,
      pending
    })
  }

  // Parse closing
  const closingMatch = markdown.match(/közgyűlést (.+?)-kor bezárta/)
  const cityMatch = markdown.match(/\*\*Kelt:\*\* ([^,]+)/) || markdown.match(/Kelt: ([^,]+)/)

  return {
    title: 'JEGYZŐKÖNYV',
    organizationName: headerMatch?.[1] || 'Szervezet',
    date: headerMatch?.[2] || new Date().toLocaleDateString('hu-HU'),
    time: headerMatch?.[3] || '00:00',
    meetingType: headerMatch?.[4] || 'rendes',
    location: locationMatch?.[1] || '',
    attendees,
    totalAttendees: parseInt(totalMatch?.[1] || '0'),
    totalWeight: totalMatch?.[2] || '0%',
    quorum: {
      reached: quorumReached,
      percentage: quorumPercentMatch?.[1] || '0',
      required: quorumRequiredMatch?.[1] || '50'
    },
    officials: {
      chair: chairMatch?.[1]?.replace(/_/g, '').trim() || '',
      secretary: secretaryMatch?.[1]?.replace(/_/g, '').trim() || '',
      verifiers: verifiersMatch?.[1]?.split(',').map(v => v.replace(/_/g, '').trim()) || []
    },
    agendaItems,
    closingTime: closingMatch?.[1] || '[időpont]',
    city: cityMatch?.[1]?.trim() || 'Budapest'
  }
}

/**
 * Configure PDF with Hungarian font support
 * Using built-in Helvetica with UTF-8 encoding
 */
function configurePdfFonts(doc: jsPDF): void {
  // jsPDF 2.x with built-in Unicode support
  doc.setFont('helvetica')
}

/**
 * Add header to PDF page
 */
function addHeader(doc: jsPDF, data: ParsedMinutes, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('JEGYZŐKÖNYV', pageWidth / 2, y, { align: 'center' })
  y += 12

  // Meeting info
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const headerText = `Készült: ${data.organizationName} ${data.date} napján, ${data.time}-kor tartott ${data.meetingType} közgyűléséről.`
  const headerLines = doc.splitTextToSize(headerText, contentWidth)
  doc.text(headerLines, margin, y)
  y += headerLines.length * 5 + 4

  // Location
  if (data.location) {
    doc.setFont('helvetica', 'bold')
    doc.text('Helyszín: ', margin, y)
    const labelWidth = doc.getTextWidth('Helyszín: ')
    doc.setFont('helvetica', 'normal')
    doc.text(data.location, margin + labelWidth, y)
    y += 8
  }

  return y
}

/**
 * Add attendance table
 */
function addAttendanceTable(doc: jsPDF, data: ParsedMinutes, y: number): number {
  const margin = 20

  // Section title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Jelen vannak:', margin, y)
  y += 6

  // Attendance table
  if (data.attendees.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Név', 'Tulajdoni hányad', 'Jelenlét']],
      body: data.attendees.map(a => [a.name, a.weight, a.type]),
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // Totals
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Összesen: ${data.totalAttendees || data.attendees.length} fő, ${data.totalWeight} tulajdoni hányad képviseletében`, margin, y)
  y += 8

  return y
}

/**
 * Add quorum section
 */
function addQuorumSection(doc: jsPDF, data: ParsedMinutes, y: number): number {
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 2 * margin

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Határozatképesség:', margin, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const quorumStatus = data.quorum.reached ? 'HATÁROZATKÉPES' : 'NEM HATÁROZATKÉPES'
  const quorumText = `A közgyűlés ${quorumStatus}, mivel a tulajdoni hányadok ${data.quorum.percentage}%-a képviseltette magát (szükséges: ${data.quorum.required}%).`
  
  const quorumLines = doc.splitTextToSize(quorumText, contentWidth)
  doc.text(quorumLines, margin, y)
  y += quorumLines.length * 5 + 8

  return y
}

/**
 * Add officials section
 */
function addOfficialsSection(doc: jsPDF, data: ParsedMinutes, y: number): number {
  const margin = 20

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Tisztségviselők:', margin, y)
  y += 6

  doc.setFontSize(10)
  const officials = [
    ['Levezető elnök:', data.officials.chair || '_______________________'],
    ['Jegyzőkönyvvezető:', data.officials.secretary || '_______________________'],
    ['Jegyzőkönyv hitelesítők:', data.officials.verifiers.join(', ') || '_______________________, _______________________'],
  ]

  for (const [label, value] of officials) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, y)
    const labelWidth = doc.getTextWidth(label + ' ')
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + labelWidth, y)
    y += 6
  }

  y += 4

  // Separator line
  doc.setDrawColor(200)
  doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y)
  y += 8

  return y
}

/**
 * Add agenda items
 */
function addAgendaItems(doc: jsPDF, data: ParsedMinutes, y: number): number {
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 2 * margin
  const pageHeight = doc.internal.pageSize.getHeight()

  for (const item of data.agendaItems) {
    // Check for page break
    if (y > pageHeight - 60) {
      doc.addPage()
      y = 20
    }

    // Item number and title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`${item.number}. NAPIRENDI PONT`, margin, y)
    y += 6

    doc.setFontSize(11)
    const titleLines = doc.splitTextToSize(item.title, contentWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 5 + 4

    // Description
    if (item.description) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(item.description, contentWidth)
      doc.text(descLines, margin, y)
      y += descLines.length * 4 + 4
    }

    // Votes
    if (item.votes) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Szavazás eredménye:', margin, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.text(`• Igen: ${item.votes.yes}`, margin + 5, y)
      y += 5
      doc.text(`• Nem: ${item.votes.no}`, margin + 5, y)
      y += 5
      if (item.votes.abstain) {
        doc.text(`• Tartózkodott: ${item.votes.abstain}`, margin + 5, y)
        y += 5
      }
      y += 2
    }

    // Resolution
    if (item.resolution) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${item.resolution.number}. számú HATÁROZAT`, margin, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      const resultText = item.resolution.passed 
        ? 'A közgyűlés ELFOGADTA az előterjesztést.'
        : 'A közgyűlés ELUTASÍTOTTA az előterjesztést.'
      doc.text(resultText, margin, y)
      y += 8
    }

    // Pending status
    if (item.pending) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text('(Még nem tárgyalt napirendi pont)', margin, y)
      y += 8
    }

    // No vote
    if (item.noVote && !item.votes) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text('(Szavazás nélküli napirendi pont)', margin, y)
      y += 8
    }

    // Separator
    doc.setDrawColor(220)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
  }

  return y
}

/**
 * Add closing section
 */
function addClosingSection(doc: jsPDF, data: ParsedMinutes, y: number): number {
  const margin = 20
  const pageHeight = doc.internal.pageSize.getHeight()

  // Check for page break
  if (y > pageHeight - 80) {
    doc.addPage()
    y = 20
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Zárás', margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`A levezető elnök a közgyűlést ${data.closingTime}-kor bezárta.`, margin, y)
  y += 8

  doc.text(`Kelt: ${data.city}, ${data.date}`, margin, y)
  y += 16

  return y
}

/**
 * Add signature section
 */
function addSignatureSection(doc: jsPDF, data: ParsedMinutes, y: number): void {
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - 2 * margin
  const colWidth = contentWidth / 2

  // Check for page break - signatures need ~60mm
  if (y > pageHeight - 70) {
    doc.addPage()
    y = 30
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // First row: Chair and Secretary
  const col1X = margin + colWidth / 2
  const col2X = margin + colWidth + colWidth / 2

  // Signature lines
  doc.setDrawColor(0)
  doc.line(margin + 10, y, margin + colWidth - 10, y)
  doc.line(margin + colWidth + 10, y, pageWidth - margin - 10, y)
  y += 5

  // Labels
  doc.setFont('helvetica', 'normal')
  doc.text('Levezető elnök', col1X, y, { align: 'center' })
  doc.text('Jegyzőkönyvvezető', col2X, y, { align: 'center' })
  y += 5

  // Names
  doc.setFont('helvetica', 'italic')
  if (data.officials.chair) {
    doc.text(data.officials.chair, col1X, y, { align: 'center' })
  }
  if (data.officials.secretary) {
    doc.text(data.officials.secretary, col2X, y, { align: 'center' })
  }
  y += 20

  // Second row: Verifiers
  doc.setDrawColor(0)
  doc.line(margin + 10, y, margin + colWidth - 10, y)
  doc.line(margin + colWidth + 10, y, pageWidth - margin - 10, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.text('Jegyzőkönyv hitelesítő', col1X, y, { align: 'center' })
  doc.text('Jegyzőkönyv hitelesítő', col2X, y, { align: 'center' })
  y += 5

  doc.setFont('helvetica', 'italic')
  if (data.officials.verifiers[0]) {
    doc.text(data.officials.verifiers[0], col1X, y, { align: 'center' })
  }
  if (data.officials.verifiers[1]) {
    doc.text(data.officials.verifiers[1], col2X, y, { align: 'center' })
  }
}

/**
 * Add page numbers
 */
function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${i} / ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
}

// === Main Export Functions ===

/**
 * Generate PDF from markdown content
 */
export function generatePdfFromMarkdown(
  markdown: string,
  options: PdfExportOptions = {}
): jsPDF {
  const { title } = options

  // Parse markdown
  const data = parseMinutesMarkdown(markdown)

  // Create PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Configure fonts
  configurePdfFonts(doc)

  // Set document properties
  doc.setProperties({
    title: title || `Jegyzőkönyv - ${data.organizationName}`,
    subject: 'Közgyűlési jegyzőkönyv',
    author: 'VoteBox',
    creator: 'VoteBox PDF Generator',
  })

  let y = 20

  // Add sections
  y = addHeader(doc, data, y)
  y = addAttendanceTable(doc, data, y)
  y = addQuorumSection(doc, data, y)
  y = addOfficialsSection(doc, data, y)
  y = addAgendaItems(doc, data, y)
  y = addClosingSection(doc, data, y)
  addSignatureSection(doc, data, y)

  // Add page numbers
  addPageNumbers(doc)

  return doc
}

/**
 * Export PDF and trigger download
 */
export function downloadPdf(
  markdown: string,
  options: PdfExportOptions = {}
): void {
  const doc = generatePdfFromMarkdown(markdown, options)
  const filename = options.filename || `jegyzokonyv-${Date.now()}.pdf`
  doc.save(filename)
}

/**
 * Get PDF as Blob
 */
export function getPdfBlob(
  markdown: string,
  options: PdfExportOptions = {}
): Blob {
  const doc = generatePdfFromMarkdown(markdown, options)
  return doc.output('blob')
}

/**
 * Get PDF as Data URL (for preview)
 */
export function getPdfDataUrl(
  markdown: string,
  options: PdfExportOptions = {}
): string {
  const doc = generatePdfFromMarkdown(markdown, options)
  return doc.output('dataurlstring')
}
