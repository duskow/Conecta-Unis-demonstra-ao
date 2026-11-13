import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedIfNeeded } from './seed.js';
import { withDemoSession } from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import opportunityRoutes from './routes/opportunities.js';
import applicationRoutes from './routes/applications.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 4000;

seedIfNeeded();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
// UUID de alta entropia por aba. Requisições sem ID são recusadas para
// impedir que um cliente antigo altere o banco compartilhado.
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  const id = req.get('X-Demo-Session');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ message: 'Sessão de demonstração inválida. Atualize a página.' });
  }
  withDemoSession(id.toLowerCase(), next);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'conecta-unis-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Rota da API não encontrada.' });
});

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Erro interno no servidor.' });
});

app.listen(PORT, () => {
  console.log(`Conecta Unis API rodando em http://localhost:${PORT}`);
});
