import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { logActivity, safeBody } from '../utils/activityLog.js';

const router = Router();

// GET /api/games
router.get('/', async (req, res) => {
  try {
    const games = await prisma.businessGame.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ games });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not load games.' });
  }
});

// GET /api/games/:id
router.get('/:id', async (req, res) => {
  try {
    const game = await prisma.businessGame.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!game) return res.status(404).json({ error: 'Game not found.' });
    return res.json({ game });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not load game.' });
  }
});

// POST /api/games  (admin)
router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const {
      title, description, type, rules, schedule, status,
      registrationOpen, registrationUrl, announcement, startDate, endDate,
    } = req.body;
    const game = await prisma.businessGame.create({
      data: {
        title, description, type: type || 'SIMULATION', rules, schedule,
        status: status || 'UPCOMING',
        registrationOpen: registrationOpen ?? true,
        registrationUrl, announcement,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    await logActivity({ req, userId: req.user.id, action: 'CREATE', resourceType: 'GAME', resourceId: game.id, description: `Created game "${title}"`, metadata: safeBody(req.body) });
    return res.status(201).json({ game });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create game.' });
  }
});

// PUT /api/games/:id  (admin)
router.put('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    const game = await prisma.businessGame.update({ where: { id: req.params.id }, data });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'GAME', resourceId: game.id, description: `Updated game "${game.title}"`, metadata: safeBody(req.body) });
    return res.json({ game });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not update game.' });
  }
});

// DELETE /api/games/:id  (admin)
router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const game = await prisma.businessGame.findUnique({ where: { id: req.params.id } });
    await prisma.businessGame.delete({ where: { id: req.params.id } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'GAME', resourceId: req.params.id, description: `Deleted game "${game?.title || req.params.id}"` });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not delete game.' });
  }
});

// POST /api/games/:id/register  (student)
router.post('/:id/register', authRequired, async (req, res) => {
  try {
    const game = await prisma.businessGame.findUnique({ where: { id: req.params.id } });
    if (!game) return res.status(404).json({ error: 'Game not found.' });
    if (!game.registrationOpen) return res.status(400).json({ error: 'Registration is closed.' });

    const existing = await prisma.gameRegistration.findUnique({
      where: { userId_gameId: { userId: req.user.id, gameId: game.id } },
    });
    if (existing) return res.json({ registration: existing, already: true });

    const registration = await prisma.gameRegistration.create({
      data: { userId: req.user.id, gameId: game.id },
    });
    return res.status(201).json({ registration });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not register for game.' });
  }
});

export default router;