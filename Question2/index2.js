const exp = require('express');
const ax = require('axios');

const app = exp();
const port = 3000;

app.get('/numbers', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'At least one URL must be provided.' });
  }

  const urls = Array.isArray(url) ? url : [url];

  const results = [];
  try {
    for (const url of urls) {
      const response = await ax.get(url);
      const num = response.data;
      if (Array.isArray(num.numbers)) {
        results.push(...num.numbers);
      }
    }
    res.json({ numbers: results });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving numbers from URLs.' });
  }
});

app.listen(port, () => {
  console.log(`number-management-service is listening on port ${port}`);
});
