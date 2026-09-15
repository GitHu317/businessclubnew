import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

// Admin analytics dashboard — real-time charts data.
const router = Router();

// GET /api/analytics/overview
router.get('/overview', authRequired, adminRequired, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();
    const totalCertificates = await prisma.certificate.count();
    const totalExams = await prisma.exam.count();
    const totalGames = await prisma.businessGame.count();
    const totalReviews = await prisma.review.count();
    const totalActivityEvents = await prisma.activityLog.count();
    const totalGameRegistrations = await prisma.gameRegistration.count();
    const completedEnrollments = await prisma.enrollment.count({ where: { completed: true } });
    const examAttempts = await prisma.examAttempt.findMany({ select: { score: true, passed: true, submittedAt: true } });
    const courseRows = await prisma.course.findMany({ select: { id: true, title: true, _count: { select: { enrollments: true, certificates: true } }, enrollments: { select: { completed: true } } } });
    const gameRows = await prisma.businessGame.findMany({ select: { id: true, title: true, _count: { select: { registrations: true } } } });
    const loginEvents = await prisma.activityLog.count({ where: { action: 'LOGIN' } });

    // Membership status breakdown
    const pendingMembers = await prisma.user.count({ where: { membershipStatus: 'PENDING' } });
    const activeMembers = await prisma.user.count({ where: { membershipStatus: 'ACTIVE' } });
    const verifiedMembers = await prisma.user.count({ where: { membershipStatus: 'VERIFIED' } });

    // Certificate type breakdown
    const professionalCerts = await prisma.certificate.count({ where: { type: 'PROFESSIONAL' } });
    const memberOnlyCerts = await prisma.certificate.count({ where: { type: 'MEMBER_ONLY' } });

    return res.json({
      totals: {
        users: totalUsers,
        students: totalStudents,
        admins: totalAdmins,
        courses: totalCourses,
        enrollments: totalEnrollments,
        certificates: totalCertificates,
        exams: totalExams,
        games: totalGames,
        reviews: totalReviews,
      },
      membership: { pending: pendingMembers, active: activeMembers, verified: verifiedMembers },
      certificates: { professional: professionalCerts, memberOnly: memberOnlyCerts },
      engagement: { activityEvents: totalActivityEvents, loginEvents, gameRegistrations: totalGameRegistrations },
      courses: { completedEnrollments, completionRate: totalEnrollments ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0, data: courseRows.map((course) => ({ title: course.title, enrollments: course.enrollments.length, completed: course.enrollments.filter((e) => e.completed).length, certificates: course._count.certificates })) },
      exams: { attempts: examAttempts.length, passed: examAttempts.filter((a) => a.passed).length, averageScore: examAttempts.length ? Math.round(examAttempts.reduce((sum, a) => sum + a.score, 0) / examAttempts.length) : 0, data: examAttempts },
      games: { registrations: totalGameRegistrations, data: gameRows.map((game) => ({ title: game.title, registrations: game._count.registrations })) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not load analytics overview.' });
  }
});

// GET /api/analytics/registrations  (user registrations over time — grouped by day)
router.get('/registrations', authRequired, adminRequired, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { createdAt: true, membershipStatus: true },
      orderBy: { createdAt: 'asc' },
    });
    // group by date (YYYY-MM-DD)
    const byDay = {};
    for (const u of users) {
      const d = new Date(u.createdAt).toISOString().slice(0, 10);
      if (!byDay[d]) byDay[d] = { date: d, total: 0, pending: 0, active: 0, verified: 0 };
      byDay[d].total += 1;
      const status = (u.membershipStatus || 'PENDING').toLowerCase();
      if (byDay[d][status] !== undefined) byDay[d][status] += 1;
    }
    const series = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
    return res.json({ series });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load registration series.' });
  }
});

// GET /api/analytics/enrollments-by-course
router.get('/enrollments-by-course', authRequired, adminRequired, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, _count: { select: { enrollments: true } } },
    });
    const data = courses.map((c) => ({ title: c.title, enrollments: c._count.enrollments }));
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load enrollments by course.' });
  }
});

// GET /api/analytics/registration-screening  (new signers + onboarding answers for review)
router.get('/registration-screening', authRequired, adminRequired, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        fullName: true,
        email: true,
        studentId: true,
        department: true,
        membershipStatus: true,
        membershipTier: true,
        joinedAt: true,
        hasOnboarded: true,
        heardAbout: true,
        institution: true,
        usageGoals: true,
        avatarUrl: true,
        googleId: true,
      },
      orderBy: { joinedAt: 'desc' },
    });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load registration screening data.' });
  }
});

export default router;
