import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { logActivity, safeBody } from '../utils/activityLog.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ announcements });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load announcements.' });
  }
});

router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const { title, content, category, pinned } = req.body;
    const announcement = await prisma.announcement.create({
      data: { title, content, category: category || 'GENERAL', pinned: pinned || false },
    });
    await logActivity({ req, userId: req.user.id, action: 'CREATE', resourceType: 'ANNOUNCEMENT', resourceId: announcement.id, description: `Created announcement "${title}"`, metadata: safeBody(req.body) });
    return res.status(201).json({ announcement });
  } catch (err) {
    return res.status(500).json({ error: 'Could not create announcement.' });
  }
});

router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const ann = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    await prisma.announcement.delete({ where: { id: req.params.id } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'ANNOUNCEMENT', resourceId: req.params.id, description: `Deleted announcement "${ann?.title || req.params.id}"` });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete announcement.' });
  }
});

export default router;
