import express from 'express';
import cors from 'cors';
import { getPlatformResolution } from '../services/resolutionService.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/resolve', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
       res.status(400).json({ error: 'URL is required' });
       return;
    }
    const data = await getPlatformResolution(url);
    res.json(data);
  } catch (error: any) {
    console.error('Resolution API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to resolve' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
