import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { logActivity, safeBody } from '../utils/activityLog.js';

const router = Router();

// GET /api/dashboard
router.get('/', authRequired, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: {
        course: { include: { lessons: { orderBy: { order: 'asc' } } } },
        lessonProgress: true,
      },
    });

    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user.id },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    });

    const gameRegs = await prisma.gameRegistration.findMany({
      where: { userId: req.user.id },
      include: { game: true },
    });

    const stats = {
      enrolledCourses: enrollments.length,
      completedCourses: enrollments.filter((e) => e.completed).length,
      certificatesEarned: certificates.length,
      gamesRegistered: gameRegs.length,
      avgProgress: enrollments.length
        ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
        : 0,
    };

    return res.json({
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        membershipStatus: req.user.membershipStatus,
        membershipTier: req.user.membershipTier,
        department: req.user.department,
        studentId: req.user.studentId,
        joinedAt: req.user.joinedAt,
      },
      enrollments,
      certificates,
      gameRegistrations: gameRegs,
      stats,
    });
  } catch (err) {
    console.error('dashboard error', err);
    return res.status(500).json({ error: 'Could not load dashboard.' });
  }
});

// POST /api/dashboard/instructor-application - Submit or update instructor application
router.post('/instructor-application', authRequired, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      department,
      photoUrl,
      qualifications,
      experience,
      proposedCourse,
      website,
      bio,
      expertise,
    } = req.body;

    if (!qualifications || !experience) {
      return res.status(400).json({ error: 'Qualifications and experience are required.' });
    }

    let app = await prisma.instructorApplication.findFirst({
      where: { userId: req.user.id },
    });

    const expertiseJson = JSON.stringify(
      Array.isArray(expertise) ? expertise : expertise ? [expertise] : []
    );

    if (app) {
      app = await prisma.instructorApplication.update({
        where: { id: app.id },
        data: {
          fullName: fullName || req.user.fullName,
          email: email || req.user.email,
          phone: phone || null,
          department: department || null,
          photoUrl: photoUrl || null,
          qualifications,
          experience,
          proposedCourse: proposedCourse || null,
          website: website || null,
          bio: bio || null,
          expertise: expertiseJson,
          status: 'PENDING',
        },
      });
    } else {
      app = await prisma.instructorApplication.create({
        data: {
          userId: req.user.id,
          fullName: fullName || req.user.fullName,
          email: email || req.user.email,
          phone: phone || null,
          department: department || null,
          photoUrl: photoUrl || null,
          qualifications,
          experience,
          proposedCourse: proposedCourse || null,
          website: website || null,
          bio: bio || null,
          expertise: expertiseJson,
          status: 'PENDING',
        },
      });
    }

    await logActivity({
      req,
      userId: req.user.id,
      action: app ? 'UPDATE' : 'CREATE',
      resourceType: 'INSTRUCTOR_APPLICATION',
      resourceId: app.id,
      description: `Submitted/Updated instructor application for ${app.fullName}`,
      metadata: safeBody(req.body),
    });

    return res.json({ success: true, application: app });
  } catch (err) {
    console.error('instructor application error:', err);
    return res.status(500).json({ error: 'Could not submit instructor application.' });
  }
});

// GET /api/dashboard/instructor-applications - List applications (Admin)
router.get('/instructor-applications', authRequired, adminRequired, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const applications = await prisma.instructorApplication.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ applications });
  } catch (err) {
    console.error('list applications error:', err);
    return res.status(500).json({ error: 'Could not fetch applications.' });
  }
});

// PUT /api/dashboard/instructor-applications/:id/review - Review application (Admin)
router.put('/instructor-applications/:id/review', authRequired, adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const app = await prisma.instructorApplication.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const updated = await prisma.instructorApplication.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || null,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
    });

    if (status === 'APPROVED') {
      await prisma.creatorProfile.upsert({
        where: { userId: app.userId },
        update: { approved: true, approvedAt: new Date() },
        create: {
          userId: app.userId,
          fullName: app.fullName,
          headline: app.proposedCourse || 'Course Instructor',
          bio: app.bio || 'Instructor at Business Club',
          expertise: app.expertise,
          credentials: app.qualifications,
          approved: true,
          approvedAt: new Date(),
        },
      });
    }

    await logActivity({
      req,
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'INSTRUCTOR_APPLICATION',
      resourceId: id,
      description: `Reviewed instructor application for ${app.fullName}: ${status}`,
      metadata: safeBody(req.body),
    });

    return res.json({ success: true, application: updated });
  } catch (err) {
    console.error('review application error:', err);
    return res.status(500).json({ error: 'Could not review application.' });
  }
});

// DELETE /api/dashboard/instructor-applications/user/:userId - Delete instructor / application (Admin)
router.delete('/instructor-applications/user/:userId', authRequired, adminRequired, async (req, res) => {
  try {
    const { userId } = req.params;
    await prisma.instructorApplication.deleteMany({ where: { userId } });
    await prisma.creatorProfile.deleteMany({ where: { userId } });

    await logActivity({
      req,
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'INSTRUCTOR_APPLICATION',
      resourceId: userId,
      description: `Deleted instructor records for user ${userId}`,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('delete instructor error:', err);
    return res.status(500).json({ error: 'Could not delete instructor records.' });
  }
});

// PUT /api/dashboard/membership-status  (admin updates a user's membership)
router.put('/membership-status', authRequired, adminRequired, async (req, res) => {
  try {
    const { userId, status, tier } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ error: 'userId and status required.' });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        membershipStatus: status,
        ...(tier ? { membershipTier: tier } : {}),
      },
    });
    const { passwordHash: _ph, ...safe } = updated;
    await logActivity({
      req,
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: userId,
      description: `Updated membership for ${updated.fullName} → status: ${status}${tier ? `, tier: ${tier}` : ''}`,
      metadata: safeBody(req.body),
    });
    return res.json({ user: safe });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update membership.' });
  }
});

// GET /api/dashboard/admin/users  (admin - list all users for membership management)
router.get('/admin/users', authRequired, adminRequired, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { joinedAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        membershipStatus: true,
        membershipTier: true,
        department: true,
        studentId: true,
        joinedAt: true,
      },
    });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load users.' });
  }
});

export default router;