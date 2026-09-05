import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { logActivity, safeBody } from '../utils/activityLog.js';
import { awardXp, XP_REWARDS } from '../utils/gamification.js';

const router = Router();

// ---- Instructor Applications ----

// POST /api/instructors/apply  (any authenticated user submits an application)
router.post('/apply', authRequired, async (req, res) => {
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
      certificateUrl,
    } = req.body;

    if (!qualifications || !experience) {
      return res.status(400).json({ error: 'Qualifications and experience are required.' });
    }
    // Prevent duplicate pending applications
    const existingPending = await prisma.instructorApplication.findFirst({
      where: { userId: req.user.id, status: 'PENDING' },
    });
    if (existingPending) {
      return res.status(409).json({ error: 'You already have a pending application. Please wait for review.' });
    }

    // Append certificate link to qualifications if provided
    const fullQualifications = certificateUrl 
      ? `${qualifications}\n\nCertificate / Portfolio Link: ${certificateUrl}` 
      : qualifications;

    const expertiseJson = JSON.stringify(
      Array.isArray(expertise) ? expertise : expertise ? [expertise] : []
    );

    const application = await prisma.instructorApplication.create({
      data: {
        userId: req.user.id,
        fullName: fullName || req.user.fullName,
        email: email || req.user.email,
        phone: phone || null,
        department: department || null,
        photoUrl: photoUrl || null,
        qualifications: fullQualifications,
        experience,
        proposedCourse: proposedCourse || null,
        website: website || null,
        bio: bio || null,
        expertise: expertiseJson,
        status: 'PENDING',
      },
    });

    await logActivity({
      req,
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'APPLICATION',
      resourceId: application.id,
      description: `Submitted instructor application`,
      metadata: safeBody(req.body),
    });

    return res.status(201).json({ application });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not submit application.' });
  }
});

// GET /api/instructors/applications  (admin — list all applications)
router.get('/applications', authRequired, adminRequired, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const applications = await prisma.instructorApplication.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ applications });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load applications.' });
  }
});

// POST /api/instructors/applications/:id/review  (admin — approve or reject)
router.post('/applications/:id/review', authRequired, adminRequired, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'status must be APPROVED or REJECTED.' });
    }
    const application = await prisma.instructorApplication.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    const updated = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: { status, adminNote: adminNote || null, reviewedBy: req.user.id, reviewedAt: new Date() },
    });

    // On approval: create or activate a CreatorProfile for the user and update user role to reflect instructor privileges if applicable.
    if (status === 'APPROVED') {
      const existingProfile = await prisma.creatorProfile.findUnique({ where: { userId: application.userId } });
      if (existingProfile) {
        await prisma.creatorProfile.update({ where: { id: existingProfile.id }, data: { approved: true, approvedAt: new Date() } });
      } else {
        await prisma.creatorProfile.create({
          data: {
            userId: application.userId,
            fullName: application.fullName,
            headline: application.proposedCourse || 'Approved Course Creator',
            bio: application.bio || application.experience,
            expertise: application.expertise,
            credentials: application.qualifications,
            avatarUrl: application.photoUrl || null,
            approved: true,
            approvedAt: new Date(),
          },
        });
      }
      await awardXp(application.userId, XP_REWARDS.EARN_CERTIFICATE, { badgeKey: 'certified' });
    }

    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'APPLICATION', resourceId: application.id, description: `${status} instructor application from ${application.user?.fullName}`, metadata: { status, adminNote } });
    return res.json({ application: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not review application.' });
  }
});

// GET /api/instructors/my-application  (user — check own application status)
router.get('/my-application', authRequired, async (req, res) => {
  try {
    const application = await prisma.instructorApplication.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
    return res.json({ application, creatorProfile });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load application status.' });
  }
});

// ---- Creator Profiles & Admin Instructor Management ----

// PUT /api/instructors/profile  (approved creator — update their public profile)
router.put('/profile', authRequired, async (req, res) => {
  try {
    const { fullName, headline, bio, expertise, avatarUrl, credentials } = req.body;
    const existing = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
    if (!existing) {
      return res.status(404).json({ error: 'No creator profile found. You must be approved first.' });
    }
    const profile = await prisma.creatorProfile.update({
      where: { id: existing.id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(headline ? { headline } : {}),
        ...(bio ? { bio } : {}),
        ...(expertise ? { expertise: JSON.stringify(expertise) } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(credentials ? { credentials } : {}),
      },
    });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'CREATOR_PROFILE', resourceId: profile.id, description: `Updated creator profile`, metadata: safeBody(req.body) });
    return res.json({ profile });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update creator profile.' });
  }
});

// PUT /api/instructors/:userId/revoke  (admin — revoke instructor privileges)
router.put('/:userId/revoke', authRequired, adminRequired, async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.creatorProfile.updateMany({
      where: { userId },
      data: { approved: false },
    });

    await prisma.instructorApplication.updateMany({
      where: { userId },
      data: { status: 'REJECTED', adminNote: 'Instructor privileges revoked by administrator.' },
    });

    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'CREATOR_PROFILE', resourceId: userId, description: `Revoked instructor privileges for user ${userId}` });
    return res.json({ success: true, message: 'Instructor privileges revoked successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not revoke instructor privileges.' });
  }
});

// DELETE /api/instructors/:userId  (admin — completely delete instructor profile and application)
router.delete('/:userId', authRequired, adminRequired, async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.creatorProfile.deleteMany({ where: { userId } });
    await prisma.instructorApplication.deleteMany({ where: { userId } });

    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'CREATOR_PROFILE', resourceId: userId, description: `Deleted instructor profile and application for user ${userId}` });
    return res.json({ success: true, message: 'Instructor profile and application deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not delete instructor.' });
  }
});

// GET /api/instructors/:id  (public — view a creator's full profile)
router.get('/:id', async (req, res) => {
  try {
    const profile = await prisma.creatorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        courses: { where: { published: true }, select: { id: true, title: true, slug: true, thumbnailUrl: true, category: true, level: true } },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Instructor not found.' });
    let expertise = [];
    try { expertise = JSON.parse(profile.expertise || '[]'); } catch { expertise = []; }
    return res.json({ profile: { ...profile, expertise } });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load instructor profile.' });
  }
});

// GET /api/instructors  (admin — list all creator profiles)
router.get('/', authRequired, adminRequired, async (req, res) => {
  try {
    const profiles = await prisma.creatorProfile.findMany({
      include: {
        user: { select: { id: true, email: true, department: true } },
        _count: { select: { courses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ profiles });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load instructors.' });
  }
});

export default router;