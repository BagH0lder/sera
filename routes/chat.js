// routes/chat.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const extract = require('../services/extract'); // your file extraction helper
const router = express.Router();

// Configure Multer for file uploads (tmp storage).
const upload = multer({ dest: 'uploads/' });

// POST /chat
router.post('/', upload.array('files[]'), async (req, res) => {
  try {
    // UI sends text and mode as fields, files[] as files
    const { text, mode } = req.body;

    // Collect all incoming segments for later payload assembly
    const segments = [];

    // If plain text is present, add it
    if (text && text.trim()) {
      segments.push({
        type: 'user_text',
        content: text.trim()
      });
    }

    // If files were uploaded, loop through them and extract contents
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const extracted = await extract(file.path, file.mimetype);
          segments.push({
            type: 'attachment',
            filename: file.originalname,
            mimeType: file.mimetype,
            content: extracted
          });
        } catch (err) {
          console.error(`Extraction failed for ${file.originalname}:`, err);
          segments.push({
            type: 'attachment',
            filename: file.originalname,
            mimeType: file.mimetype,
            content: '[Error extracting file contents]'
          });
        } finally {
          // Always clean up temp file after processing
          fs.unlink(file.path, () => {});
        }
      }
    }

    // Debug log: shows exactly what was captured
    //console.log('DEBUG captured segments:', JSON.stringify(segments, null, 2));

    // Debug log
    console.log('DEBUG captured segments:', JSON.stringify(segments, null, 2));

    // Temporary: echo back user text as `reply`
    const replyText = segments.find(s => s.type === 'user_text')?.content || '(no text)';

    // Respond in the format the UI expects
    return res.json({
      reply: replyText,
      attached: [],
      segments
    });

    // Exit early — no call to OpenAI yet
    return res.json({ ok: true, segments });

  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Server error in chat route.' });
  }
});

module.exports = router;
