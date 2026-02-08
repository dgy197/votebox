/**
 * Test script for PDF export
 * Run with: npx tsx scripts/test-pdf-export.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { generatePdfFromMarkdown } from '../src/lib/pdf-generator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const testMarkdownPath = join(__dirname, '../docs/jegyzokonyv-teszt-2026-02-20.md')
const outputPath = join(__dirname, '../test-output.pdf')

console.log('📄 Reading test markdown...')
const markdown = readFileSync(testMarkdownPath, 'utf-8')
console.log(`   Read ${markdown.length} characters`)

console.log('🔧 Generating PDF...')
const doc = generatePdfFromMarkdown(markdown, {
  title: 'Napfény Társasház - Közgyűlési jegyzőkönyv',
})

console.log(`   Generated ${doc.getNumberOfPages()} page(s)`)

console.log('💾 Saving PDF...')
const pdfBuffer = doc.output('arraybuffer')
writeFileSync(outputPath, Buffer.from(pdfBuffer))

console.log(`✅ PDF saved to: ${outputPath}`)
console.log('')
console.log('Open the PDF to verify:')
console.log(`   open "${outputPath}"`)
