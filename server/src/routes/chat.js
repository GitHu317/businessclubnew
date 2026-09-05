import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
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

// DELETE /api/chat/message/:id  (president/admin — delete a message)
router.delete('/message/:id', authRequired, adminRequired, async (req, res) => {
  try {
    await prisma.chatMessage.delete({ where: { id: req.params.id } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'CHAT', resourceId: req.params.id, description: 'Deleted a chat message' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete message.' });
  }
});

export default router;
