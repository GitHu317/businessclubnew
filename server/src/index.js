import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import boardMemberRoutes from './routes/boardMembers.js';
import courseRoutes from './routes/courses.js';
import examRoutes from './routes/exams.js';
import certificateRoutes from './routes/certificates.js';
import gameRoutes from './routes/games.js';
import announcementRoutes from './routes/announcements.js';
import activityLogRoutes from './routes/activityLogs.js';
import instructorRoutes from './routes/instructors.js';
import reviewRoutes from './routes/reviews.js';
import gamificationRoutes from './routes/gamification.js';
import chatRoutes from './routes/chat.js';
import faqRoutes from './routes/faq.js';
import analyticsRoutes from './routes/analytics.js';

// Emulate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly set dotenv to load server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Fix Cross-Origin-Opener-Policy popup warning on window.close()
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'business-club-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/board-members', boardMemberRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/analytics', analyticsRoutes);

// Safe static file serving check for client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');

if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root health check for standalone Render API service
  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Kotebe Business Club API is live!' });
  });
}

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Business Club API running on port ${PORT}`);
});

export default app;