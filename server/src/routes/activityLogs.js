import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, presidentRequired } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();

/**
 * GET /api/activity-logs
 * President-only audit trail of BOD / admin actions across the platform.
 * Supports optional filtering: ?action=CREATE&resourceType=COURSE&userId=...&limit=100
 */
router.get('/', authRequired, presidentRequired, async (req, res) => {
  try {
    const { action, resourceType, userId } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const where = {};
    if (action) where.action = String(action).toUpperCase();
    if (resourceType) where.resourceType = String(resourceType).toUpperCase();
    if (userId) where.userId = String(userId);

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true, bodRole: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json({ logs, count: logs.length });
  } catch (err) {
    console.error('activity-logs error', err);
    return res.status(500).json({ error: 'Could not load activity logs.' });
  }
});

/**
 * GET /api/activity-logs/stats
 * President-only summary counts grouped by action and user (for the dashboard widget).
 */
router.get('/stats', authRequired, presidentRequired, async (req, res) => {
  try {
    const total = await prisma.activityLog.count();

    const byAction = await prisma.activityLog.groupBy({
      by: ['action'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const byUser = await prisma.activityLog.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // attach user details to the byUser grouping
    const userIds = byUser.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true, bodRole: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const byUserNamed = byUser.map((u) => ({
      ...u,
      user: userMap.get(u.userId) || null,
    }));

    return res.json({ total, byAction, byUser: byUserNamed });
  } catch (err) {
    console.error('activity-logs stats error', err);
    return res.status(500).json({ error: 'Could not load activity stats.' });
  }
});

/**
 * DELETE /api/activity-logs
 * President-only "Delete Log" function for super-admins.
 * Clears all activity log entries. The deletion action itself is recorded first
 * (so there is a trace that a wipe occurred), then all prior logs are removed.
 */
router.delete('/', authRequired, presidentRequired, async (req, res) => {
  try {
    // record the wipe action before clearing
    await logActivity({
      req,
      userId: req.user.id,
      action: 'DELETE_LOG',
      resourceType: 'LOG',
      description: `${req.user.fullName} (PRESIDENT) deleted the entire activity log`,
    });
    // delete all logs
    const result = await prisma.activityLog.deleteMany({});
    return res.json({ success: true, deleted: result.count });
  } catch (err) {
    console.error('activity-logs delete error', err);
    return res.status(500).json({ error: 'Could not delete activity logs.' });
  }
});

export default router;