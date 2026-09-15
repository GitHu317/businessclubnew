import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired, presidentRequired } from '../middleware/auth.js';
import { generateCertificateId, generateVerificationHash } from '../utils/certificate.js';
import { logActivity, safeBody } from '../utils/activityLog.js';
import { awardXp, XP_REWARDS } from '../utils/gamification.js';

const router = Router();

// grade a single question based on type
// returns { isCorrect, awarded, autoGraded }
function gradeQuestion(question, studentValue) {
  const type = question.type || 'MCQ';
  // MCQ
  if (type === 'MCQ') {
    const selected = Number(studentValue);
    const correct = Number(question.correctIndex);
    const isCorrect = selected === correct;
    return { isCorrect, awarded: isCorrect ? question.points : 0, autoGraded: true };
  }
  // TRUE_FALSE
  if (type === 'TRUE_FALSE') {
    const isCorrect = String(studentValue).toLowerCase() === String(question.answer).toLowerCase();
    return { isCorrect, awarded: isCorrect ? question.points : 0, autoGraded: true };
  }
  // FILL_BLANK
  if (type === 'FILL_BLANK') {
    const norm = (s) => String(s || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    const isCorrect = norm(studentValue) === norm(question.answer);
    return { isCorrect, awarded: isCorrect ? question.points : 0, autoGraded: true };
  }
  // SHORT_ANSWER — automatically grade an exact normalized answer.
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s+/g, ' ');
  const isCorrect = norm(studentValue) === norm(question.answer);
  return { isCorrect, awarded: isCorrect ? question.points : 0, autoGraded: true };
}

// GET /api/exams/:id  (fetch exam with questions, hides answers for students but reveals for admins)
router.get('/:id', authRequired, async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { orderBy: { createdAt: 'asc' } },
        course: true,
      },
    });
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId: exam.courseId } } });
    const canTake = Boolean(enrollment?.completed);
    const examGateReason = !enrollment?.completed ? 'Complete all lessons and lesson quizzes before taking the final exam.' : null;

    const isAdmin = req.user && req.user.role === 'ADMIN';

    const safeQuestions = exam.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.type === 'MCQ' ? JSON.parse(q.options) : [],
      points: q.points,
      ...(isAdmin ? { correctIndex: q.correctIndex, answer: q.answer } : {}),
    }));

    return res.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        passingScore: exam.passingScore,
        durationMins: exam.durationMins,
        courseId: exam.courseId,
        course: exam.course,
        questions: safeQuestions,
        canTake,
        examGateReason,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load exam.' });
  }
});

// POST /api/exams  (admin - create exam with multi-type questions)
router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const { courseId, title, description, passingScore, durationMins, questions } = req.body;
    if (!courseId || !title || !questions || !questions.length) {
      return res.status(400).json({ error: 'courseId, title and questions are required.' });
    }
    const exam = await prisma.exam.create({
      data: {
        courseId,
        title,
        description: description || '',
        passingScore: passingScore || 70,
        durationMins: durationMins || 30,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            type: q.type || 'MCQ',
            options: JSON.stringify(q.options || []),
            correctIndex: q.type === 'MCQ' ? Number(q.correctIndex) : null,
            answer: q.type !== 'MCQ' ? (q.answer || '') : null,
            points: q.points || 1,
          })),
        },
      },
      include: { questions: true },
    });
    await logActivity({ req, userId: req.user.id, action: 'CREATE', resourceType: 'EXAM', resourceId: exam.id, description: `Created exam "${title}" with ${questions.length} questions`, metadata: { questionCount: questions.length } });
    return res.status(201).json({ exam });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create exam.' });
  }
});

// PUT /api/exams/:id  (admin — update meta + replace questions)
router.put('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { title, description, passingScore, durationMins, questions } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (passingScore !== undefined) data.passingScore = Number(passingScore);
    if (durationMins !== undefined) data.durationMins = Number(durationMins);

    if (questions && Array.isArray(questions)) {
      // replace questions
      await prisma.question.deleteMany({ where: { examId: req.params.id } });
      await prisma.question.createMany({
        data: questions.map((q) => ({
          examId: req.params.id,
          text: q.text,
          type: q.type || 'MCQ',
          options: JSON.stringify(q.options || []),
          correctIndex: q.type === 'MCQ' ? Number(q.correctIndex) : null,
          answer: q.type !== 'MCQ' ? (q.answer || '') : null,
          points: q.points || 1,
        })),
      });
    }

    const exam = await prisma.exam.update({ where: { id: req.params.id }, data, include: { questions: true } });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'EXAM', resourceId: exam.id, description: `Updated exam "${exam.title}"`, metadata: safeBody(req.body) });
    return res.json({ exam });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not update exam.' });
  }
});

// DELETE /api/exams/:id  (admin)
router.delete('/:id', authRequired, presidentRequired, async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    await prisma.exam.delete({ where: { id: req.params.id } });
    await logActivity({ req, userId: req.user.id, action: 'DELETE', resourceType: 'EXAM', resourceId: req.params.id, description: `Deleted exam "${exam?.title || req.params.id}"` });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete exam.' });
  }
});

// POST /api/exams/:id/submit  (student - submit answers, auto-grade what's possible, issue certificate if fully passed)
router.post('/:id/submit', authRequired, async (req, res) => {
  try {
    const { answers } = req.body; // array of { questionId, value }
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers must be an array.' });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { questions: true, course: true },
    });
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId: exam.courseId } } });
    if (!enrollment?.completed) return res.status(403).json({ error: 'Complete all lessons and lesson quizzes before taking the final exam.' });
    const answerMap = new Map(
      answers.map((a) => [
        a.questionId,
        a.value !== undefined
          ? a.value
          : a.selectedIndex !== undefined
          ? a.selectedIndex
          : a.textAnswer,
      ])
    );
    let autoPoints = 0;
    let totalAutoPoints = 0;
    const detailedResults = [];

    for (const q of exam.questions) {
      const studentValue = answerMap.get(q.id);
      const result = gradeQuestion(q, studentValue);
      if (result.autoGraded) {
        autoPoints += result.awarded;
        totalAutoPoints += q.points;
        detailedResults.push({
          questionId: q.id,
          type: q.type,
          value: studentValue,
          answer: q.type === 'MCQ' ? q.correctIndex : q.answer,
          isCorrect: result.isCorrect,
          points: result.awarded,
          maxPoints: q.points,
        });
      }
    }

    // All exam question types are automatically graded.
    const score = totalAutoPoints > 0 ? Math.round((autoPoints / totalAutoPoints) * 100) : 0;
    const passed = score >= exam.passingScore;
    const status = 'AUTO_GRADED';

    const attempt = await prisma.examAttempt.create({
      data: {
        userId: req.user.id,
        examId: exam.id,
        answers: JSON.stringify(answers),
        score,
        passed,
        status,
      },
    });

    let certificate = null;
    if (passed) {
      const existing = await prisma.certificate.findFirst({
        where: { userId: req.user.id, courseId: exam.courseId },
      });
      if (!existing) {
        const certificateId = generateCertificateId();
        const issuedAt = new Date();
        const verificationHash = generateVerificationHash(
          certificateId,
          req.user.id,
          exam.courseId,
          issuedAt.toISOString()
        );
        // Determine certificate type — default PROFESSIONAL
        const certType = 'PROFESSIONAL';
        certificate = await prisma.certificate.create({
          data: {
            certificateId,
            userId: req.user.id,
            courseId: exam.courseId,
            examAttemptId: attempt.id,
            type: certType,
            verificationHash,
          },
          include: { course: true, user: true },
        });
        await awardXp(req.user.id, XP_REWARDS.EARN_CERTIFICATE, { badgeKey: 'certified', collectibleKey: 'crown_gold' });
      } else {
        certificate = await prisma.certificate.findUnique({
          where: { id: existing.id },
          include: { course: true, user: true },
        });
      }
    }

    return res.json({
      attempt: { id: attempt.id, score, passed, status, submittedAt: attempt.submittedAt },
      detailedResults,
      certificate: certificate
        ? {
            certificateId: certificate.certificateId,
            type: certificate.type,
            courseId: certificate.courseId,
            courseTitle: certificate.course.title,
            issuedAt: certificate.issuedAt,
          }
        : null,
    });
  } catch (err) {
    console.error('submit error', err);
    return res.status(500).json({ error: 'Could not submit exam.' });
  }
});

// GET /api/exams/my-attempts  (student)
router.get('/my-attempts/all', authRequired, async (req, res) => {
  try {
    const attempts = await prisma.examAttempt.findMany({
      where: { userId: req.user.id },
      include: { exam: { include: { course: true } } },
      orderBy: { submittedAt: 'desc' },
    });
    return res.json({ attempts });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load attempts.' });
  }
});

export default router;
