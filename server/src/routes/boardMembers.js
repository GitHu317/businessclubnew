import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, presidentRequired } from '../middleware/auth.js';
import { logActivity, safeBody } from '../utils/activityLog.js';

const router = Router();

// GET /api/board-members  (public — the public Board Members page stays open)
router.get('/', async (req, res) => {
  try {
    const members = await prisma.boardMember.findMany({ orderBy: { order: 'asc' } });
    return res.json({ members });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load board members.' });
  }
});

// POST /api/board-members  (President only — Task 3 RBAC)
router.post('/', authRequired, presidentRequired, async (req, res) => {
  try {
    const { fullName, title, bio, photoUrl, email, linkedin, twitter, instagram, order } = req.body;
    const member = await prisma.boardMember.create({
      data: { fullName, title, bio, photoUrl, email, linkedin, twitter, instagram, order: order || 0 },
    });
    await logActivity({
      req,
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'BOARD_MEMBER',
      resourceId: member.id,
      description: `Created board member "${fullName}" (${title})`,
      metadata: safeBody(req.body),
    });
    return res.status(201).json({ member });
  } catch (err) {
    return res.status(500).json({ error: 'Could not create board member.' });
  }
});

// PUT /api/board-members/:id  (President only — Task 3 RBAC)
router.put('/:id', authRequired, presidentRequired, async (req, res) => {
  try {
    const member = await prisma.boardMember.update({
      where: { id: req.params.id },
      data: { ...req.body },
    });
    await logActivity({
      req,
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'BOARD_MEMBER',
      resourceId: member.id,
      description: `Updated board member "${member.fullName}" (${member.title})`,
      metadata: safeBody(req.body),
    });
    return res.json({ member });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update board member.' });
  }
});

// DELETE /api/board-members/:id  (President only — Task 3 RBAC)
router.delete('/:id', authRequired, presidentRequired, async (req, res) => {
  try {
    const member = await prisma.boardMember.findUnique({ where: { id: req.params.id } });
    await prisma.boardMember.delete({ where: { id: req.params.id } });
    await logActivity({
      req,
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'BOARD_MEMBER',
      resourceId: req.params.id,
      description: `Deleted board member "${member?.fullName || req.params.id}"`,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete board member.' });
  }
});

export default router;
