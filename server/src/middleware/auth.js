import { verifyToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * Restrict a route to the President of the Board of Directors only.
 * The user must already be authenticated (authRequired runs first) and
 * have role === 'ADMIN' and bodRole === 'PRESIDENT'.
 * Used by the Board Members management routes (Task 3 RBAC).
 */
export function presidentRequired(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  if (req.user.bodRole !== 'PRESIDENT') {
    return res.status(403).json({ error: 'President access required. Only the President can manage Board Members.' });
  }
  next();
}
