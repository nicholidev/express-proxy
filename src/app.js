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
      responseType: 'stream',  // Always use stream here since you want to stream OpenAI responses
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', req.body, config);

    if (isStream) {
      // Setting response headers for stream, useful for clients that expect streamed data
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Pipe the data from OpenAI API response directly to the client
      response.data.pipe(res);

      // Handle stream ending from OpenAI
      response.data.on('end', () => {
        res.end();  // Close the connection once streaming is complete
      });

    } else {
      // If not a stream, return a regular JSON response
      res.json(await streamToString(response.data));  // Convert stream to JSON if needed
    }

  } catch (error) {
    // Send error in JSON format in case of failure
    res.status(500).json({ error: error.message });
  }
});

// Helper function to convert stream data to string if required
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
