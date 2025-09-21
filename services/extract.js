// /services/extract.js
// --------------------------------------------------
// Purpose: Extract usable text from common file types
//          so their content can be included in the
//          prompt payload before hitting OpenAI.
//
// Supported:
//   - TXT, MD, CSV, HTML, JSON, YAML, INI, CONF
//   - Source code: js, ts, py, php, css, java, c, cpp
//   - PDF (via poppler-utils / pdftotext)
//   - DOCX (via mammoth)
//   - XLSX (via xlsx, first sheet only)
//   - RTF (basic plain read fallback)
//   - Everything else → binary preview
//
// Images (png/jpg/webp/etc.):
//   - Not handled here. They stay in attachments
//     and can be sent to OpenAI vision.
// --------------------------------------------------

const fs = require('fs');
const { execSync } = require('child_process');
const mammoth = require('mammoth');     // npm install mammoth
const xlsx = require('xlsx');           // npm install xlsx

// --------------------------------------------------
// Plain text / code / markup files
// --------------------------------------------------
function extractTextFile(path) {
  const txt = fs.readFileSync(path, 'utf8');
  return txt.substring(0, 20000); // trim to avoid huge payloads
}

// --------------------------------------------------
// PDF files using pdftotext (poppler-utils must be installed)
// --------------------------------------------------
function extractPdf(path) {
  try {
    const cmd = `pdftotext -layout -q "${path}" -`;
    const txt = execSync(cmd, { encoding: 'utf8' });
    return txt.substring(0, 30000);
  } catch (err) {
    console.error('PDF extraction failed:', err.message);
    return '';
  }
}

// --------------------------------------------------
// DOCX files using mammoth
// --------------------------------------------------
async function extractDocx(path) {
  try {
    const result = await mammoth.extractRawText({ path });
    return result.value.substring(0, 30000);
  } catch (err) {
    console.error('DOCX extraction failed:', err.message);
    return '';
  }
}

// --------------------------------------------------
// XLSX spreadsheets using xlsx lib
//   - Only first sheet by default
//   - Joins cells into simple text
// --------------------------------------------------
function extractXlsx(path) {
  try {
    const wb = xlsx.readFile(path, { sheetRows: 50 }); // limit rows
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const txt = xlsx.utils.sheet_to_csv(sheet);
    return txt.substring(0, 20000);
  } catch (err) {
    console.error('XLSX extraction failed:', err.message);
    return '';
  }
}

// --------------------------------------------------
// Fallback for binary / unsupported files
// --------------------------------------------------
function extractFallback(path, mimeType) {
  const buf = fs.readFileSync(path);
  const preview = buf.slice(0, 32768).toString('hex').substring(0, 200);
  return `Binary file (${mimeType}), size=${buf.length} bytes, preview=${preview}`;
}

// --------------------------------------------------
// Main dispatcher
//   - Chooses extraction based on extension/mime
//   - Note: DOCX is async, so this returns a Promise
// --------------------------------------------------
async function extract(path, mimeType) {
  const lower = path.toLowerCase();

  // Text-like files
  if (
    mimeType.startsWith('text/') ||
    /\.(txt|md|csv|log|html?|json|ya?ml|ini|conf|js|ts|py|php|css|java|c|cpp)$/i.test(lower)
  ) {
    return extractTextFile(path);
  }

  // PDF
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(lower)) {
    return extractPdf(path);
  }

  // DOCX
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || /\.docx$/i.test(lower)) {
    return await extractDocx(path);
  }

  // XLSX
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || /\.xlsx$/i.test(lower)) {
    return extractXlsx(path);
  }

  // RTF (fallback to plain read)
  if (mimeType === 'application/rtf' || /\.rtf$/i.test(lower)) {
    return extractTextFile(path);
  }

  // Fallback: return binary preview
  return extractFallback(path, mimeType);
}

// --------------------------------------------------
// Export
// --------------------------------------------------
module.exports = { extract };
