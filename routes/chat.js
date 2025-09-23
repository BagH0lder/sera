// /routes/chat.js
// --------------------------------------------------
// Purpose: Handle incoming chat signals from the UI.
// Captures user input, file attachments, mode, and
// metadata into an array of "segments". These
// segments will later be used to construct the final
// payload that goes to OpenAI.
// --------------------------------------------------

const express = require('express');
const { extract } = require('../services/extract'); // custom service for file text extraction
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text, mode, attachments } = req.body;

    // Array to hold every captured part of the incoming request.
    // Nothing is merged yet — we store raw segments for full control later.
    const segments = [];

    // Capture user text (typed prompt or STT voice result).
    if (text) {
      segments.push({
        type: 'user_text',
        content: text.trim()
      });
    }

    // Capture file attachments. Each file becomes its own segment.
    // Extracted text is pulled in using the extract.js service.
    if (attachments && Array.isArray(attachments)) {
      for (const file of attachments) {
        const extracted = await extract(file.path, file.mimeType);
        segments.push({
          type: 'attachment',
          filename: file.filename || 'unnamed',
          mimeType: file.mimeType,
          content: extracted
        });
      }
    }

    // Capture the mode (e.g., "chat", "work", etc.).
    // Stored as a segment so it can influence payload build later.
    if (mode) {
      segments.push({
        type: 'mode',
        content: mode
      });
    }

    // Always capture a timestamp segment for ordering and traceability.
    segments.push({
      type: 'timestamp',
      content: new Date().toISOString()
    });

    // For now: log the captured segments to console
    // and return them to the UI for verification.
    console.log('Captured segments:', JSON.stringify(segments, null, 2));

    return res.json({
      status: 'ok',
      segments
    });

  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
