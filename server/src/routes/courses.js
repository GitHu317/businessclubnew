import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired, presidentRequired } from '../middleware/auth.js';
import { logActivity, safeBody } from '../utils/activityLog.js';
import { awardXp, XP_REWARDS } from '../utils/gamification.js';

const router = Router();

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function detectVideoType(url) {
  if (!url) return 'none';
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  if (/\.(mp4|webm|ogg)$/i.test(url)) return 'mp4';
  return 'none';
}

// helper: can a user access a course (considers prerequisites + enrollment)
async function userHasPrerequisiteCert(userId, course) {
  if (!course.prerequisiteId) return true;
  const cert = await prisma.certificate.findFirst({
    where: { userId, courseId: course.prerequisiteId },
  });
  return !!cert;
}

// GET /api/courses  (public list of published courses) — supports tag filter + search + ordering
router.get('/', async (req, res) => {
  try {
    const { tag, search } = req.query;
    const where = { published: true };
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
   if (tag) {
      const all = await prisma.course.findMany({
        where: { published: true },
        include: { _count: { select: { lessons: true, exams: true } } },
        orderBy: { cardOrder: 'asc' },
      });
      const filtered = all.filter((c) => {
        let tags = [];
        try { tags = JSON.parse(c.tags || '[]'); } catch { tags = []; }
        return tags.includes(tag);
      });
      const withCreator = await Promise.all(
        filtered.map(async (c) => {
          let creator = null;
          if (c.creatorId) {
            creator = await prisma.creatorProfile.findUnique({
              where: { id: c.creatorId },
              select: { id: true, fullName: true, headline: true, avatarUrl: true },
            });
          }
          let parsedTags = [];
          try { parsedTags = JSON.parse(c.tags || '[]'); } catch { parsedTags = []; }
          return { ...c, tags: parsedTags, creator };
        })
      );
      return res.json({ courses: withCreator });
    }
// Inside GET /api/courses route [source: 6]
    const courses = await prisma.course.findMany({
      where,
      include: { _count: { select: { lessons: true, exams: true } } },
      orderBy: { cardOrder: 'asc' },
    });
    // attach creator profile summary and parse tags array
    const withCreator = await Promise.all(
      courses.map(async (c) => {
        let creator = null;
        if (c.creatorId) {
          creator = await prisma.creatorProfile.findUnique({
            where: { id: c.creatorId },
            select: { id: true, fullName: true, headline: true, avatarUrl: true },
          });
        }
        let parsedTags = [];
        try { parsedTags = JSON.parse(c.tags || '[]'); } catch { parsedTags = []; }
        return { ...c, tags: parsedTags, creator };
      })
    );
    return res.json({ courses: withCreator });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not load courses.' });
  }
});

// GET /api/courses/tags/all  (dynamic tag list derived from all courses)
router.get('/tags/all', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({ where: { published: true }, select: { tags: true } });
    const tagSet = new Set();
    for (const c of courses) {
      let tags = [];
      try { tags = JSON.parse(c.tags || '[]'); } catch { tags = []; }
      for (const t of tags) tagSet.add(t);
    }
    return res.json({ tags: Array.from(tagSet).sort() });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load tags.' });
  }
});

// GET /api/courses/project/:courseId  (student's project status or instructor submissions)
router.get('/project/:courseId', authRequired, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, include: { creator: true } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    const isManager = req.user.role === 'ADMIN' || course.creator?.userId === req.user.id;
    if (isManager) {
      const submissions = await prisma.projectSubmission.findMany({ where: { courseId: course.id }, include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { submittedAt: 'desc' } });
      return res.json({ course: { id: course.id, title: course.title, projectRequired: course.projectRequired, projectSubmissionType: course.projectSubmissionType, projectRequirements: course.projectRequirements }, submissions });
    }
    const submission = await prisma.projectSubmission.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId: course.id } } });
    return res.json({ course: { id: course.id, title: course.title, projectRequired: course.projectRequired, projectSubmissionType: course.projectSubmissionType, projectRequirements: course.projectRequirements }, submission });
  } catch (err) { console.error('project status error:', err); return res.status(500).json({ error: 'Could not load project information.' }); }
});

// POST /api/courses/project/:courseId  (student submits URL or a small ZIP as base64)
router.post('/project/:courseId', authRequired, async (req, res) => {
  try {
    const { projectUrl, fileName, fileData } = req.body;
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    const submissionType = course.projectSubmissionType || 'BOTH';
    if (submissionType === 'URL' && !projectUrl) return res.status(400).json({ error: 'This course accepts a project URL.' });
    if (submissionType === 'ZIP' && !fileData) return res.status(400).json({ error: 'This course accepts a ZIP file.' });
    if (!projectUrl && !fileData) return res.status(400).json({ error: 'Submit a valid project URL or a ZIP file.' });
    if (projectUrl && fileData) return res.status(400).json({ error: 'Submit either a URL or a ZIP file, not both.' });
    if (projectUrl && !/^https?:\/\//i.test(projectUrl)) return res.status(400).json({ error: 'Project URL must begin with http:// or https://.' });
    if (fileData && (!fileName?.toLowerCase().endsWith('.zip') || fileData.length > 7_000_000)) return res.status(400).json({ error: 'Upload a ZIP file smaller than 5 MB.' });
    const submission = await prisma.projectSubmission.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      create: { userId: req.user.id, courseId: course.id, projectUrl: projectUrl || null, fileName: fileName || null, fileData: fileData || null, status: 'PENDING' },
      update: { projectUrl: projectUrl || null, fileName: fileName || null, fileData: fileData || null, status: 'PENDING', feedback: null, evaluation: null, gradedBy: null, gradedAt: null, submittedAt: new Date() },
    });
    await logActivity({ req, userId: req.user.id, action: 'CREATE', resourceType: 'PROJECT', resourceId: submission.id, description: `Submitted project for ${course.title}` });
    return res.status(201).json({ submission: { ...submission, fileData: undefined } });
  } catch (err) { console.error('project submission error:', err); return res.status(500).json({ error: 'Could not submit project.' }); }
});

// POST /api/courses/project/:courseId/:submissionId/grade (course instructor or admin)
router.post('/project/:courseId/:submissionId/grade', authRequired, async (req, res) => {
  try {
    const { status, feedback, evaluation, attachments } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Choose APPROVED or REJECTED.' });
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, include: { creator: true } });
    if (!course || (req.user.role !== 'ADMIN' && course.creator?.userId !== req.user.id)) return res.status(403).json({ error: 'Only the assigned instructor or an admin can grade this project.' });
    const rejectionMessage = "Your project didn't qualify the criteria of the project. Please review the requirements and send your project again.";
    const submission = await prisma.projectSubmission.update({ where: { id: req.params.submissionId }, data: { status, feedback: feedback || (status === 'REJECTED' ? rejectionMessage : null), evaluation: JSON.stringify(evaluation || {}), attachments: JSON.stringify(attachments || []), gradedBy: req.user.id, gradedAt: new Date() }, include: { user: { select: { id: true, fullName: true, email: true } } } });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'PROJECT', resourceId: submission.id, description: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} project for ${submission.user.fullName}` });
    return res.json({ submission: { ...submission, fileData: undefined } });
  } catch (err) { console.error('project grading error:', err); return res.status(500).json({ error: 'Could not grade project.' }); }
});

// GET /api/courses/project/:courseId/:submissionId/file (instructor download)
router.get('/project/:courseId/:submissionId/file', authRequired, async (req, res) => {
  try {
    const submission = await prisma.projectSubmission.findUnique({ where: { id: req.params.submissionId }, include: { course: { include: { creator: true } } } });
    if (!submission || (req.user.role !== 'ADMIN' && submission.course.creator?.userId !== req.user.id)) return res.status(403).json({ error: 'Not authorised.' });
    if (!submission.fileData) return res.status(404).json({ error: 'No ZIP file attached.' });
    const base64 = submission.fileData.split(',').pop();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${(submission.fileName || 'project.zip').replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
    return res.send(Buffer.from(base64, 'base64'));
  } catch (err) { return res.status(500).json({ error: 'Could not download project file.' }); }
});

// GET /api/courses/:slug  (course detail with lessons + exams + creator + reviews + prereq)
router.get('/:slug', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: { media: { orderBy: { order: 'asc' } }, quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
        },
        exams: { include: { _count: { select: { questions: true } } } },
        creator: true,
        prerequisite: { select: { id: true, title: true, slug: true } },
        reviews: {
          where: { published: true },
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    // compute average rating
    const ratings = course.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

    return res.json({ course: { ...course, avgRating, reviewCount: ratings.length } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not load course.' });
  }
});

// POST /api/courses  (admin or approved creator)
router.post('/', authRequired, async (req, res) => {
  try {
    const { title, description, category, level, thumbnailUrl, published, tags, cardOrder, prerequisiteId, projectRequired, projectSubmissionType, projectRequirements } = req.body;
    const isAdmin = req.user.role === 'ADMIN';
    const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
    if (!isAdmin && !(creator && creator.approved)) {
      return res.status(403).json({ error: 'Only admins or approved course creators can create courses. Submit an instructor application first.' });
    }
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    const course = await prisma.course.create({
      data: {
        title,
        slug: slugify(title) + '-' + Date.now().toString(36),
        description,
        category: category || 'Entrepreneurship',
        level: level || 'Beginner',
        thumbnailUrl: thumbnailUrl || null,
        published: published ?? true,
        tags: JSON.stringify(tags || []),
        cardOrder: cardOrder || 0,
        prerequisiteId: prerequisiteId || null,
        projectRequired: Boolean(projectRequired),
        projectSubmissionType: ['URL', 'ZIP', 'BOTH'].includes(projectSubmissionType) ? projectSubmissionType : 'BOTH',
        projectRequirements: projectRequirements || '',
        creatorId: creator ? creator.id : null,
      },
    });
    await logActivity({ req, userId: req.user.id, action: 'CREATE', resourceType: 'COURSE', resourceId: course.id, description: `Created course "${title}"`, metadata: safeBody(req.body) });
    return res.status(201).json({ course });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create course.' });
  }
});

// PUT /api/courses/:id  (admin or the course's creator)
router.put('/:id', authRequired, async (req, res) => {
  try {
    const { title, description, category, level, thumbnailUrl, published, tags, cardOrder, prerequisiteId, projectRequired, projectSubmissionType, projectRequirements } = req.body;
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Course not found.' });
    const isAdmin = req.user.role === 'ADMIN';
    const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
    if (!isAdmin && !(creator && creator.id === existing.creatorId)) {
      return res.status(403).json({ error: 'Not authorised to edit this course.' });
    }
    const data = { description, category, level, thumbnailUrl, published, prerequisiteId, projectRequired: Boolean(projectRequired), projectSubmissionType: ['URL', 'ZIP', 'BOTH'].includes(projectSubmissionType) ? projectSubmissionType : 'BOTH', projectRequirements: projectRequirements || '' };
    if (title) {
      data.title = title;
      data.slug = slugify(title) + '-' + Date.now().toString(36);
    }
    if (tags) data.tags = JSON.stringify(tags);
    if (cardOrder !== undefined) data.cardOrder = cardOrder;
    const course = await prisma.course.update({ where: { id: req.params.id }, data });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'COURSE', resourceId: course.id, description: `Updated course "${course.title}"`, metadata: safeBody(req.body) });
    return res.json({ course });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not update course.' });
  }
});

// DELETE /api/courses/:id  (admin)
router.delete('/:id', authRequired, presidentRequired, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    await prisma.course.delete({ where: { id: req.params.id } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'COURSE', resourceId: req.params.id, description: `Deleted course "${course?.title || req.params.id}"` });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete course.' });
  }
});

// ---- Lessons (rich media + reorder + embedded quiz) ----

// POST /api/courses/:courseId/lessons  (admin or creator)
router.post('/:courseId/lessons', authRequired, async (req, res) => {
  try {
    const { title, content, videoUrl, order, durationMins, media, quiz } = req.body;
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    const isAdmin = req.user.role === 'ADMIN';
    const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
    if (!isAdmin && !(creator && creator.id === course.creatorId)) {
      return res.status(403).json({ error: 'Not authorised.' });
    }
    if (!title) return res.status(400).json({ error: 'Lesson title is required.' });

    const lesson = await prisma.lesson.create({
      data: {
        courseId: req.params.courseId,
        title,
        content: content || '',
        videoUrl: videoUrl || null,
        videoType: detectVideoType(videoUrl),
        order: order || 0,
        durationMins: durationMins || 10,
        media: media && media.length ? {
          create: media.map((m, i) => ({ type: m.type, url: m.url, filename: m.filename || null, caption: m.caption || null, order: m.order || i + 1 })),
        } : undefined,
        quiz: quiz && quiz.questions && quiz.questions.length ? {
          create: {
            title: quiz.title || 'Quick Check',
            questions: { create: quiz.questions.map((q, i) => ({ text: q.text, type: q.type || 'MCQ', options: JSON.stringify(q.options || []), answer: q.answer || '', order: q.order || i + 1 })) },
          },
        } : undefined,
      },
      include: { media: true, quiz: { include: { questions: true } } },
    });
    await logActivity({ req, userId: req.user.id, action: 'CREATE', resourceType: 'LESSON', resourceId: lesson.id, description: `Created lesson "${title}"`, metadata: safeBody(req.body) });
    return res.status(201).json({ lesson });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create lesson.' });
  }
});

// PUT /api/courses/:courseId/lessons/:lessonId  (admin or creator) — supports full rich-media update + reorder
router.put('/:courseId/lessons/:lessonId', authRequired, async (req, res) => {
  try {
    const { title, content, videoUrl, order, durationMins, media, quiz } = req.body;
    const lessonId = req.params.lessonId;
    const existing = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { media: true, quiz: true } });
    if (!existing || existing.courseId !== req.params.courseId) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    const isAdmin = req.user.role === 'ADMIN';
    const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
    if (!isAdmin && !(creator && creator.id === course.creatorId)) {
      return res.status(403).json({ error: 'Not authorised.' });
    }

    // Update base fields
    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (videoUrl !== undefined) { data.videoUrl = videoUrl; data.videoType = detectVideoType(videoUrl); }
    if (order !== undefined) data.order = order;
    if (durationMins !== undefined) data.durationMins = durationMins;

    // Replace media attachments if provided
    if (media) {
      await prisma.mediaAttachment.deleteMany({ where: { lessonId } });
      if (media.length) {
        await prisma.mediaAttachment.createMany({
          data: media.map((m, i) => ({ lessonId, type: m.type, url: m.url, filename: m.filename || null, caption: m.caption || null, order: m.order || i + 1 })),
        });
      }
    }

    // Replace embedded quiz if provided
    if (quiz) {
      if (existing.quiz) {
        await prisma.lessonQuizQuestion.deleteMany({ where: { quizId: existing.quiz.id } });
        await prisma.lessonQuiz.delete({ where: { id: existing.quiz.id } });
      }
      if (quiz.questions && quiz.questions.length) {
        await prisma.lessonQuiz.create({
          data: {
            lessonId,
            title: quiz.title || 'Quick Check',
            questions: { create: quiz.questions.map((q, i) => ({ text: q.text, type: q.type || 'MCQ', options: JSON.stringify(q.options || []), answer: q.answer || '', order: q.order || i + 1 })) },
          },
        });
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data,
      include: { media: { orderBy: { order: 'asc' } }, quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
    });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'LESSON', resourceId: lesson.id, description: `Updated lesson "${lesson.title}"`, metadata: safeBody(req.body) });
    return res.json({ lesson });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not update lesson.' });
  }
});

// DELETE /api/courses/:courseId/lessons/:lessonId  (admin or creator)
router.delete('/:courseId/lessons/:lessonId', authRequired, async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson || lesson.courseId !== req.params.courseId) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    const isAdmin = req.user.role === 'ADMIN';
    const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
    if (!isAdmin && !(creator && creator.id === course.creatorId)) {
      return res.status(403).json({ error: 'Not authorised.' });
    }
    await prisma.lesson.delete({ where: { id: req.params.lessonId } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'LESSON', resourceId: req.params.lessonId, description: `Deleted lesson "${lesson?.title || req.params.lessonId}"` });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete lesson.' });
  }
});

// POST /api/courses/:courseId/lessons/reorder  (admin or creator) — bulk update order
router.post('/:courseId/lessons/reorder', authRequired, async (req, res) => {
  try {
    const { orderedIds } = req.body; // array of lesson ids in desired sequence
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required.' });
    const tx = orderedIds.map((id, index) =>
      prisma.lesson.update({ where: { id }, data: { order: index + 1 } })
    );
    await prisma.$transaction(tx);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not reorder lessons.' });
  }
});

// POST /api/courses/:slug/enroll  (student) — checks prerequisite
router.post('/:slug/enroll', authRequired, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    // Prerequisite check: user must hold a certificate for the prerequisite course
    const hasPrereq = await userHasPrerequisiteCert(req.user.id, course);
    if (!hasPrereq) {
      const prereq = await prisma.course.findUnique({ where: { id: course.prerequisiteId }, select: { title: true } });
      return res.status(403).json({ error: `This course requires completing "${prereq?.title || 'the prerequisite course'}" and earning its certificate first.` });
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
    });
    if (existing) return res.json({ enrollment: existing });

    const enrollment = await prisma.enrollment.create({
      data: { userId: req.user.id, courseId: course.id },
    });
    await awardXp(req.user.id, XP_REWARDS.ENROLL_COURSE, { badgeKey: 'first_step' });
    return res.status(201).json({ enrollment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not enroll.' });
  }
});

// GET /api/courses/:slug/enrollment-status  (student) — prereq lock + progress
router.get('/:slug/enrollment-status', authRequired, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    const hasPrereq = await userHasPrerequisiteCert(req.user.id, course);
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      include: { lessonProgress: true },
    });
    let prereqCertificate = null;
    if (course.prerequisiteId) {
      prereqCertificate = await prisma.certificate.findFirst({ where: { userId: req.user.id, courseId: course.prerequisiteId } });
    }
    return res.json({ hasPrereq, enrollment, prereqCertificate });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load enrollment status.' });
  }
});

// POST /api/courses/:slug/lessons/:lessonId/complete
router.post('/:slug/lessons/:lessonId/complete', authRequired, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
    });
    if (!enrollment) return res.status(400).json({ error: 'Not enrolled in this course.' });

    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson || lesson.courseId !== course.id) {
      return res.status(404).json({ error: 'Lesson not found in this course.' });
    }

    let progress = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
    });
    let awardedXp = false;
    if (!progress) {
      progress = await prisma.lessonProgress.create({
        data: { enrollmentId: enrollment.id, lessonId: lesson.id, completed: true, completedAt: new Date(), xpAwarded: true },
      });
      awardedXp = true;
    } else if (!progress.completed) {
      progress = await prisma.lessonProgress.update({
        where: { id: progress.id },
        data: { completed: true, completedAt: new Date(), xpAwarded: true },
      });
      awardedXp = true;
    }
    if (awardedXp) {
      await awardXp(req.user.id, XP_REWARDS.COMPLETE_LESSON, { badgeKey: 'lesson_master' });
    }

    // recompute course progress
    const total = await prisma.lesson.count({ where: { courseId: course.id } });
    const done = await prisma.lessonProgress.count({
      where: { enrollmentId: enrollment.id, completed: true },
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    let updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progress: pct, completed: pct >= 100 },
    });

    // Award course-completion XP once
    if (pct >= 100 && !enrollment.completed && !enrollment.xpAwarded) {
      updated = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: new Date(), xpAwarded: true },
      });
      await awardXp(req.user.id, XP_REWARDS.COMPLETE_COURSE, { badgeKey: 'course_graduate' });
    }

    return res.json({ enrollment: updated, lessonProgress: progress });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not mark lesson complete.' });
  }
});

// ---- Reviews ----

// GET /api/courses/:slug/reviews
router.get('/:slug/reviews', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    const reviews = await prisma.review.findMany({
      where: { courseId: course.id, published: true },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const ratings = reviews.map((r) => r.rating);
    const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    return res.json({ reviews, avgRating, reviewCount: reviews.length });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load reviews.' });
  }
});

// POST /api/courses/:slug/reviews  (student — on completion)
router.post('/:slug/reviews', authRequired, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }
    const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
    });
    if (!enrollment || !enrollment.completed) {
      return res.status(403).json({ error: 'You can only review a course after completing it.' });
    }
    const existing = await prisma.review.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
    });
    if (existing) {
      const updated = await prisma.review.update({ where: { id: existing.id }, data: { rating, comment } });
      return res.json({ review: updated });
    }
    const review = await prisma.review.create({
      data: { userId: req.user.id, courseId: course.id, rating, comment, published: true },
    });
    return res.status(201).json({ review });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not submit review.' });
  }
});

export default router;
