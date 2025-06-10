import 'reflect-metadata';
import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS for all origins (adjust in prod as needed)
app.use(cors());
// Parse JSON bodies
app.use(express.json());

// Health-check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// If this module is run directly, start the server
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
