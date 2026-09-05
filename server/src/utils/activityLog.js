// Activity logging utility for the BOD audit trail (Task 4).
// Captures Board of Directors actions: logins, page views, data updates/deletions.
import prisma from './prisma.js';

/**
 * Persist an activity log entry.
 * @param {object} params
 * @param {object} [params.req] - Express request (used to extract ip + userAgent). Optional.
 * @param {string} params.userId
 * @param {string} params.action - LOGIN | LOGOUT | PAGE_VIEW | CREATE | UPDATE | DELETE
 * @param {string} [params.resourceType]
 * @param {string} [params.resourceId]
 * @param {string} [params.description]
 * @param {object} [params.metadata] - arbitrary JSON-serialisable context
 */
export async function logActivity({ req, userId, action, resourceType, resourceId, description, metadata }) {
  if (!userId || !action) return;
  try {
    const ipAddress = req?.ip || req?.socket?.remoteAddress || null;
    const userAgent = req?.get?.('user-agent') || null;
    await prisma.activityLog.create({
      data: {
        userId,
        action: String(action).toUpperCase(),
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        description: description || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    // Logging must never break the main request flow.
    console.error('activityLog error:', err.message);
  }
}

/**
 * Sanitise a request body for storage in the audit metadata so we never
 * persist passwords or other secrets.
 */
export function safeBody(body) {
  if (!body || typeof body !== 'object') return undefined;
  const clone = { ...body };
  for (const key of ['password', 'passwordHash', 'token', 'secret']) {
    if (key in clone) clone[key] = '[REDACTED]';
  }
  return clone;
}
