// Gamification utility — Khan Academy-style XP, levels, badges, and collectibles.
// Used across enroll, lesson-complete, course-complete, certificate-issue, and game-register flows.
import prisma from './prisma.js';

// XP required to reach a given level (cumulative). Level 1 = 0 XP.
// Curve: level N requires 100 * (N-1) XP (linear, easy to reason about).
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return 100 * (level - 1);
}

export function levelForXp(xp) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

/**
 * Award XP to a user, recompute level, and auto-grant badges whose xpRequired is met.
 * @param {string} userId
 * @param {number} xpAmount
 * @param {object} [opts] - { badgeKey, collectibleKey } optional direct awards
 */
export async function awardXp(userId, xpAmount, opts = {}) {
  if (!userId || !xpAmount || xpAmount <= 0) return null;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const newXp = (user.xp || 0) + xpAmount;
    const newLevel = levelForXp(newXp);
    const leveledUp = newLevel > (user.level || 1);

    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    });

    // Auto-grant badges whose xpRequired threshold is now met.
    const eligibleBadges = await prisma.badge.findMany({
      where: { xpRequired: { lte: newXp } },
    });
    for (const badge of eligibleBadges) {
      const existing = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });
      if (!existing) {
        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      }
    }

    // Direct badge award (e.g. course_graduate on completion).
    if (opts.badgeKey) {
      const badge = await prisma.badge.findUnique({ where: { key: opts.badgeKey } });
      if (badge) {
        const existing = await prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
        });
        if (!existing) {
          await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        }
      }
    }

    // Direct collectible award (e.g. crown_gold on certificate).
    if (opts.collectibleKey) {
      const collectible = await prisma.collectible.findUnique({ where: { key: opts.collectibleKey } });
      if (collectible) {
        const existing = await prisma.userCollectible.findUnique({
          where: { userId_collectibleId: { userId, collectibleId: collectible.id } },
        });
        if (!existing) {
          await prisma.userCollectible.create({ data: { userId, collectibleId: collectible.id } });
        }
      }
    }

    return { xp: newXp, level: newLevel, leveledUp };
  } catch (err) {
    console.error('awardXp error:', err.message);
    return null;
  }
}

// XP reward constants (Khan Academy-style small frequent rewards).
export const XP_REWARDS = {
  ENROLL_COURSE: 15,
  COMPLETE_LESSON: 10,
  COMPLETE_COURSE: 50,
  EARN_CERTIFICATE: 75,
  REGISTER_GAME: 20,
};
