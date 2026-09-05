import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

// Reviews are also exposed through the courses route, but this module provides
// a dedicated admin moderation view and a public testimonial feed.
const router = Router();

// GET /api/reviews/course/:courseId  (public testimonials for a course)
router.get('/course/:courseId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { courseId: req.params.courseId, published: true },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const ratings = reviews.map((r) => r.rating);
    const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    return res.json({ reviews, avgRating, reviewCount: reviews.length });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load reviews.' });
  }
});

// GET /api/reviews/all  (admin — all reviews for moderation)
router.get('/all', authRequired, adminRequired, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { id: true, fullName: true, email: true } }, course: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load reviews.' });
  }
});

// PUT /api/reviews/:id/moderate  (admin — toggle published)
router.put('/:id/moderate', authRequired, adminRequired, async (req, res) => {
  try {
    const { published } = req.body;
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { published } });
    return res.json({ review });
  } catch (err) {
    return res.status(500).json({ error: 'Could not moderate review.' });
  }
});

// DELETE /api/reviews/:id  (admin)
router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete review.' });
  }
});

export default router;
