import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { backendApi } from './Backend/app.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Mount Backend API
  app.use('/api', backendApi);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 InvoiceAI server running on:`);
    console.log(`   > Local:   http://localhost:${PORT}`);
    console.log(`   > Network: http://127.0.0.1:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});