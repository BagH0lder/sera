const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text, mode, attachments } = req.body;

    // Start with base text (user typed or STT voice result)
    let prompt = text ? text.trim() : '';

    // Merge extracted text from attachments (OCR/PDF/etc.)
    if (attachments && Array.isArray(attachments)) {
      for (const file of attachments) {
        if (file.extracted_text) {
          prompt += `\n[Attachment: ${file.filename || 'unnamed'}]\n${file.extracted_text}`;
        }
      }
    }

    // For now, just return the collected prompt
    return res.json({
      status: 'ok',
      mode: mode || 'default',
      prompt
    });

  } catch (err) {
    console.error('Chat input error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
