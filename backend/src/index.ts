import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileRoutes from './routes/files';
import { connectDB } from './utils/db';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/files', fileRoutes);

app.get('/api/health', (_req, res) => {
  const mongoState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
  res.json({ status: 'ok', mongoState });
});

// basic error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err?.message || 'Internal error' });
});

const PORT = Number(process.env.PORT || 4000);

async function start() {
  // attempt DB connect but don't block server startup if DB is unavailable
  connectDB().catch((err) => {
    console.error('DB connect failed (continuing without DB):', err?.message || err);
  });

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log('Shutting down server...');
    server.close(async () => {
      try {
        await mongoose.disconnect();
        console.log('Mongo disconnected');
      } catch (err) {
        console.error('Error during mongoose disconnect', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

export default app;
