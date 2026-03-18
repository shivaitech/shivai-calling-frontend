/**
 * Free, fully client-side document text extraction service.
 *
 * Supported formats (no paid API, no new dependencies):
 *   PDF  → react-pdftotext (already in package.json, uses PDF.js under the hood)
 *   DOCX → unzip the Office Open XML, parse word/document.xml
 *   PPTX → unzip the Office Open XML, parse ppt/slides/slide*.xml
 *   XLSX → unzip the Office Open XML, parse xl/sharedStrings.xml + sheet data
 *   TXT / CSV / MD → native file.text()
 *   HTML → DOMParser, extract innerText
 *   Other → empty string (not supported in-browser without a library)
 */

import pdfToText from 'react-pdftotext';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Read a File as an ArrayBuffer */
function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Minimal ZIP reader – returns a map of { entryName → Uint8Array } for all
 * files in the archive.  Handles Deflate and Store compression only.
 * (Office Open XML files are ZIP archives.)
 */
async function readZipEntries(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let offset = 0;
  while (offset < bytes.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compression = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const fileNameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLen);
    const entryName = new TextDecoder().decode(fileNameBytes);

    const dataStart = offset + 30 + fileNameLen + extraLen;
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize);

    try {
      let text = '';
      if (compression === 0) {
        // Store (no compression)
        text = new TextDecoder('utf-8', { fatal: false }).decode(compressedData);
      } else if (compression === 8 && typeof DecompressionStream !== 'undefined') {
        // Deflate – wrap in a raw deflate stream
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        writer.write(compressedData);
        writer.close();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          if (value) chunks.push(value);
          done = d;
        }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const merged = new Uint8Array(total);
        let pos = 0;
        for (const c of chunks) { merged.set(c, pos); pos += c.length; }
        text = new TextDecoder('utf-8', { fatal: false }).decode(merged);
      }
      if (text) result.set(entryName, text);
    } catch {
      // Skip unreadable entries silently
    }

    offset = dataStart + compressedSize;
  }
  return result;
}

/** Strip all XML tags from a string and collapse whitespace */
function xmlToPlainText(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x[0-9a-fA-F]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── per-format extractors ────────────────────────────────────────────────────

async function extractPdf(file: File): Promise<string> {
  return pdfToText(file);
}

async function extractDocx(file: File): Promise<string> {
  const buf = await readAsArrayBuffer(file);
  const entries = await readZipEntries(buf);
  const docXml = entries.get('word/document.xml') ?? '';
  if (!docXml) return '';

  // Preserve paragraph breaks: replace </w:p> with newline before stripping tags
  const withBreaks = docXml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br[^/]*/g, '\n');
  return xmlToPlainText(withBreaks);
}

async function extractPptx(file: File): Promise<string> {
  const buf = await readAsArrayBuffer(file);
  const entries = await readZipEntries(buf);
  const parts: string[] = [];
  for (const [name, xml] of entries) {
    if (/^ppt\/slides\/slide\d+\.xml$/.test(name)) {
      const withBreaks = xml.replace(/<\/a:p>/g, '\n');
      const text = xmlToPlainText(withBreaks);
      if (text) parts.push(text);
    }
  }
  return parts.join('\n\n');
}

async function extractXlsx(file: File): Promise<string> {
  const buf = await readAsArrayBuffer(file);
  const entries = await readZipEntries(buf);

  // Shared strings table (most cell values live here)
  const sharedXml = entries.get('xl/sharedStrings.xml') ?? '';
  const sharedStrings: string[] = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRegex.exec(sharedXml)) !== null) {
    sharedStrings.push(xmlToPlainText(m[1]));
  }

  const rows: string[] = [];
  for (const [name, xml] of entries) {
    if (/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) {
      const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
      while ((m = rowRegex.exec(xml)) !== null) {
        const rowXml = m[1];
        const cells: string[] = [];
        const cellRegex = /<c [^>]*t="s"[^>]*>[\s\S]*?<v>(\d+)<\/v>/g;
        const numCellRegex = /<c (?!.*t=")[^>]*>[\s\S]*?<v>([^<]+)<\/v>/g;
        let cm: RegExpExecArray | null;
        while ((cm = cellRegex.exec(rowXml)) !== null) {
          cells.push(sharedStrings[parseInt(cm[1])] ?? '');
        }
        while ((cm = numCellRegex.exec(rowXml)) !== null) {
          cells.push(cm[1]);
        }
        if (cells.length) rows.push(cells.join('\t'));
      }
    }
  }
  return rows.join('\n');
}

async function extractHtml(file: File): Promise<string> {
  const html = await file.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove scripts and styles
  doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
  return (doc.body?.innerText ?? doc.body?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Extracts text from any supported file entirely in the browser — no paid API.
 *
 * @param file - The File object to parse.
 * @returns Extracted text string, or empty string for unsupported types.
 */
export async function extractTextWithUnstructured(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  try {
    // PDF
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      console.log(`📄 Extracting PDF: ${file.name}`);
      return await extractPdf(file);
    }

    // DOCX
    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      console.log(`📄 Extracting DOCX: ${file.name}`);
      return await extractDocx(file);
    }

    // PPTX
    if (
      type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      name.endsWith('.pptx')
    ) {
      console.log(`📄 Extracting PPTX: ${file.name}`);
      return await extractPptx(file);
    }

    // XLSX
    if (
      type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      name.endsWith('.xlsx')
    ) {
      console.log(`📄 Extracting XLSX: ${file.name}`);
      return await extractXlsx(file);
    }

    // HTML
    if (type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')) {
      console.log(`📄 Extracting HTML: ${file.name}`);
      return await extractHtml(file);
    }

    // Plain text, CSV, Markdown — read directly
    if (
      type === 'text/plain' ||
      type === 'text/csv' ||
      name.endsWith('.txt') ||
      name.endsWith('.csv') ||
      name.endsWith('.md')
    ) {
      return await file.text();
    }

    console.log(`⚠️ Unsupported file type for text extraction: ${file.name} (${type})`);
    return '';
  } catch (error) {
    console.error(`❌ Error extracting text from ${file.name}:`, error);
    return '';
  }
}

