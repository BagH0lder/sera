const express = require('express');
const app = express();
const PORT = 3000;

// Enable JSON request parsing
app.use(express.json());

// Route for chat API (logic in routes/chat.js)
app.use('/chat', require('./routes/chat'));

// Serve static files from /public (Nginx already maps /sera → this app)
// So requests like /sera/ui.html will resolve correctly
app.use(express.static(__dirname + '/public'));

// Basic root check (not used in production, just sanity check)
app.get('/', (req, res) => {
  res.send('Seraphina - Just a few prompts in less than 40 hours.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
