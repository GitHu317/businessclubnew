import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired, presidentRequired } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

// Board / Admin internal chat ("chat bt/n bod's").
const router = Router();

// GET /api/chat/:channel  (admin — fetch messages in a channel)
router.get('/:channel', authRequired, adminRequired, async (req, res) => {
  try {
    const channel = req.params.channel;
    if (!['board', 'bod'].includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel. Use board or bod.' });
    }
    const messages = await prisma.chatMessage.findMany({
      where: { channel },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true, bodRole: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load messages.' });
  }
});

// POST /api/chat/:channel  (admin — post a message)
router.post('/:channel', authRequired, adminRequired, async (req, res) => {
  try {
    const channel = req.params.channel;
    if (!['board', 'bod'].includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel.' });
    }
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Message body is required.' });
    }
    const message = await prisma.chatMessage.create({
      data: { userId: req.user.id, channel, body: body.trim() },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true, bodRole: true } } },
    });
    return res.status(201).json({ message });
  } catch (err) {
    return res.status(500).json({ error: 'Could not send message.' });
  }
});

// DELETE /api/chat/messages (President-only bulk deletion)
router.delete('/messages', authRequired, presidentRequired, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ error: 'Select at least one message.' });
    const result = await prisma.chatMessage.deleteMany({ where: { id: { in: ids } } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'CHAT', description: `Deleted ${result.count} chat message(s)` });
    return res.json({ success: true, deleted: result.count });
  } catch (err) { return res.status(500).json({ error: 'Could not delete messages.' });
  }
});

export default router;
