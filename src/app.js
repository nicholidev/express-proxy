const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json());

app.post('/proxy-openai', async (req, res) => {
  try {
    const isStream = req.body.stream || req.headers['accept'] === 'text/event-stream';

    const config = {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: isStream ? 'stream' : 'json',  // Stream or JSON response based on request
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', req.body, config);

    if (isStream) {
      response.data.on('data', (chunk) => {
        res.send(chunk);
      });

      response.data.on('end', () => {
        res.end();
      });
    } else {
      res.json(response.data);
    }

  } catch (error) {
    // Send error message in JSON format
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});