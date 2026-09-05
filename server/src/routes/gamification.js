import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// GET /api/gamification/me  (current user's XP, level, badges, collectibles)
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, xp: true, level: true },
    });
    const badges = await prisma.userBadge.findMany({
      where: { userId: req.user.id },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
    const collectibles = await prisma.userCollectible.findMany({
      where: { userId: req.user.id },
      include: { collectible: true },
      orderBy: { awardedAt: 'desc' },
    });
    const allBadges = await prisma.badge.findMany({ orderBy: { xpRequired: 'asc' } });
    return res.json({
      xp: user.xp,
      level: user.level,
      badges: badges.map((ub) => ({ ...ub.badge, awardedAt: ub.awardedAt })),
      collectibles: collectibles.map((uc) => ({ ...uc.collectible, awardedAt: uc.awardedAt })),
      allBadges,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load gamification data.' });
  }
});

// GET /api/gamification/badges  (public catalog of all badges)
router.get('/badges', async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({ orderBy: { xpRequired: 'asc' } });
    return res.json({ badges });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load badges.' });
  }
});

// GET /api/gamification/collectibles  (public catalog of all collectibles)
router.get('/collectibles', async (req, res) => {
  try {
    const collectibles = await prisma.collectible.findMany({ orderBy: { rarity: 'asc' } });
    return res.json({ collectibles });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load collectibles.' });
  }
});

export default router;
