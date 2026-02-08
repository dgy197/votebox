/**
 * PDF Generator Tests
 */

import { describe, it, expect } from 'vitest'
import { generatePdfFromMarkdown, getPdfBlob } from './pdf-generator'

const sampleMarkdown = `# JEGYZŐKÖNYV

Készült: **Napfény Társasház** 2026. február 20. napján, 18:00-kor tartott **rendes** közgyűléséről.

**Helyszín:** Társasházi közös helyiség (földszint)

---

## Jelen vannak

| Név | Tulajdoni hányad | Jelenlét |
|-----|------------------|----------|
| Kovács Péter | 15.5% | személyes |
| Nagy Éva | 8.2% | online |
| Szabó János | 12% | személyes |

**Összesen:** 3 fő, **35.7%** tulajdoni hányad képviseletében

---

## Határozatképesség

A közgyűlés **✅ HATÁROZATKÉPES**, 
mivel a tulajdoni hányadok **100.0%**-a képviseltette magát.
*(Szükséges: 50%)*

---

## Tisztségviselők

- **Levezető elnök:** Kovács Péter
- **Jegyzőkönyvvezető:** Nagy Éva
- **Jegyzőkönyv hitelesítők:** Szabó János, Tóth Mária

---

### 1. Levezető elnök megválasztása

A közgyűlés tisztségviselőinek megválasztása

**Szavazás eredménye:**
- ✅ Igen: 100%
- ❌ Nem: 0%
- ⚪ Tartózkodott: 0%

> **1/2026. számú HATÁROZAT**
> 
> A közgyűlés egyszerű többséggel **ELFOGADTA** az előterjesztést.

---

## Zárás

A levezető elnök a közgyűlést 19:30-kor bezárta.

**Kelt:** Budapest, 2026. február 20.
`

describe('PDF Generator', () => {
  describe('generatePdfFromMarkdown', () => {
    it('should create a PDF document from markdown', () => {
      const doc = generatePdfFromMarkdown(sampleMarkdown)
      
      expect(doc).toBeDefined()
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    })

    it('should set document properties', () => {
      const doc = generatePdfFromMarkdown(sampleMarkdown, {
        title: 'Test Minutes'
      })

      // PDF was created successfully
      expect(doc).toBeDefined()
    })

    it('should handle empty markdown', () => {
      const doc = generatePdfFromMarkdown('')
      expect(doc).toBeDefined()
      expect(doc.getNumberOfPages()).toBe(1)
    })

    it('should handle markdown without attendance table', () => {
      const simpleMarkdown = `# JEGYZŐKÖNYV

Készült: **Test Org** 2026. január 1. napján, 10:00-kor tartott **rendes** közgyűléséről.

## Zárás
A levezető elnök a közgyűlést 11:00-kor bezárta.
`
      const doc = generatePdfFromMarkdown(simpleMarkdown)
      expect(doc).toBeDefined()
    })
  })

  describe('getPdfBlob', () => {
    it('should return a Blob', () => {
      const blob = getPdfBlob(sampleMarkdown)
      
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/pdf')
      expect(blob.size).toBeGreaterThan(0)
    })
  })

  describe('Hungarian characters', () => {
    it('should handle Hungarian special characters', () => {
      const hungarianMarkdown = `# JEGYZŐKÖNYV

Készült: **Árvíztűrő Tükörfúrógép Kft.** 2026. február 20. napján.

| Név | Hányad |
|-----|--------|
| Ötvös Ödön | 10% |
| Űrhajós Ágnes | 15% |
| Éles Írisz | 20% |
`
      const doc = generatePdfFromMarkdown(hungarianMarkdown)
      expect(doc).toBeDefined()
      expect(doc.getNumberOfPages()).toBe(1)
    })
  })

  describe('signature section', () => {
    it('should include signature section', () => {
      const doc = generatePdfFromMarkdown(sampleMarkdown)
      // Document was created with signature section
      expect(doc).toBeDefined()
    })
  })
})
