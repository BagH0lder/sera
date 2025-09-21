const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/chat', require('./routes/chat'));

app.get('/', (req, res) => {
  res.send('Seraphina - Just a few prompts in less than 40 hours.');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
