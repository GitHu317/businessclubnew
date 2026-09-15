import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { logActivity, safeBody } from '../utils/activityLog.js';

// Dynamic, expandable FAQ accessible to all users.
const router = Router();

// GET /api/faq  (public — all FAQs ordered)
router.get('/', async (req, res) => {
  try {
    const faqs = await prisma.fAQ.findMany({ orderBy: { order: 'asc' } });
    return res.json({ faqs });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load FAQ.' });
  }
});
// POST /api/faq  (admin)
router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required.' });
    }
    const faq = await prisma.faq.create({
      data: { question, answer, category: category || 'General', order: order || 0 },
    });
    await logActivity({ req, userId: req.user.id, action: 'CREATE', resourceType: 'FAQ', resourceId: faq.id, description: `Created FAQ "${question}"`, metadata: safeBody(req.body) });
    return res.status(201).json({ faq });
  } catch (err) {
    return res.status(500).json({ error: 'Could not create FAQ.' });
  }
});

// PUT /api/faq/:id  (admin)
router.put('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Question and answer are required.' });
    }
    const existing = await prisma.fAQ.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'FAQ entry not found.' });
    const faq = await prisma.fAQ.update({
      where: { id: req.params.id },
      data: { question: question.trim(), answer: answer.trim(), category: category?.trim() || 'General', order: Number.isFinite(Number(order)) ? Number(order) : 0 },
    });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'FAQ', resourceId: faq.id, description: `Updated FAQ`, metadata: safeBody(req.body) });
    return res.json({ faq });
  } catch (err) {
    console.error('update FAQ error:', err);
    return res.status(500).json({ error: 'Could not update FAQ.' });
  }
});

// DELETE /api/faq/:id  (admin)
router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const existing = await prisma.fAQ.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'FAQ entry not found.' });
    await prisma.fAQ.delete({ where: { id: req.params.id } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'FAQ', resourceId: req.params.id, description: 'Deleted FAQ' });
    return res.json({ success: true });
  } catch (err) {
    console.error('delete FAQ error:', err);
    return res.status(500).json({ error: 'Could not delete FAQ.' });
  }
});

export default router;
