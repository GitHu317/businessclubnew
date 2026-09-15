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
  // SHORT_ANSWER — cannot auto-grade
  return { isCorrect: false, awarded: 0, autoGraded: false };
}

// GET /api/exams/pending-grades  (admin — list attempts needing manual grading)
// Placed BEFORE /:id to prevent route collision
router.get('/pending-grades/all', authRequired, adminRequired, async (req, res) => {
  try {
    const attempts = await prisma.examAttempt.findMany({
      where: { status: 'PENDING_GRADE' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        exam: { include: { course: true, questions: true } },
        grades: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Map questions to each grade result for frontend compatibility
    const formattedAttempts = attempts.map(attempt => {
      const questionMap = new Map(attempt.exam.questions.map(q => [q.id, q]));
      return {
        ...attempt,
        grades: (attempt.grades || []).map(g => ({
          ...g,
          question: questionMap.get(g.questionId) || null
        }))
      };
    });

    return res.json({ attempts: formattedAttempts });
  } catch (err) {
    console.error('pending-grades error:', err);
    return res.status(500).json({ error: 'Could not load pending grades.', details: err.message });
  }
});

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
    const approvedProject = exam.course.projectRequired ? await prisma.projectSubmission.findFirst({ where: { userId: req.user.id, courseId: exam.courseId, status: 'APPROVED' } }) : true;
    const canTake = Boolean(enrollment?.completed && approvedProject);
    const examGateReason = !enrollment?.completed ? 'Complete all lessons and lesson quizzes before taking the final exam.' : (!approvedProject ? 'Submit your project and wait for instructor approval before taking the final exam.' : null);

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
        projectRequired: exam.course.projectRequired,
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
    if (exam.course.projectRequired) {
      const approvedProject = await prisma.projectSubmission.findFirst({ where: { userId: req.user.id, courseId: exam.courseId, status: 'APPROVED' } });
      if (!approvedProject) return res.status(403).json({ error: 'Submit your project and wait for instructor approval before taking the final exam.' });
    }

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
    let needsManualGrading = false;
    const detailedResults = [];
    const pendingGrades = [];

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
      } else {
        // SHORT_ANSWER
        needsManualGrading = true;
        pendingGrades.push({ questionId: q.id, value: studentValue, maxPoints: q.points });
        totalAutoPoints += q.points;
      }
    }

    // If no manual grading needed: compute final score & certificate eligibility
    const hasManual = needsManualGrading;
    let score;
    let passed;
    let status;
    if (!hasManual) {
      score = totalAutoPoints > 0 ? Math.round((autoPoints / totalAutoPoints) * 100) : 0;
      passed = score >= exam.passingScore;
      status = 'AUTO_GRADED';
    } else {
      // provisional score from auto-graded portion; final pending admin grade
      const autoPct = totalAutoPoints > 0 ? Math.round((autoPoints / totalAutoPoints) * 100) : 0;
      score = autoPct;
      passed = false;
      status = 'PENDING_GRADE';
    }

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

    // create pending grade records for manual questions
    if (hasManual) {
      await prisma.gradeResult.createMany({
        data: pendingGrades.map((p) => ({
          attemptId: attempt.id,
          questionId: p.questionId,
          awarded: 0,
        })),
      });
    }

    let certificate = null;
    if (passed && !hasManual) {
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
      needsManualGrading: hasManual,
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

// POST /api/exams/grade/:attemptId  (admin — grade short-answer questions & finalise)
router.post('/grade/:attemptId', authRequired, adminRequired, async (req, res) => {
  try {
    const { grades } = req.body; // array of { questionId, awarded, feedback }
    if (!Array.isArray(grades)) {
      return res.status(400).json({ error: 'grades array required.' });
    }
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: req.params.attemptId },
      include: { exam: { include: { questions: true } } },
    });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

    // update grade results
    for (const g of grades) {
      await prisma.gradeResult.update({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: g.questionId } },
        data: { awarded: g.awarded, feedback: g.feedback || null, gradedBy: req.user.id, gradedAt: new Date() },
      });
    }

    // recompute total score across all questions
    const allGrades = await prisma.gradeResult.findMany({ where: { attemptId: attempt.id } });
    const totalPoints = attempt.exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    // For auto-graded questions we need their points too. Re-derive:
    const autoAnswers = JSON.parse(attempt.answers);
    const answerMap = new Map(autoAnswers.map((a) => [a.questionId, a.value]));
    let earned = 0;
    for (const q of attempt.exam.questions) {
      const gradeRow = allGrades.find((gr) => gr.questionId === q.id);
      if (gradeRow) {
        earned += gradeRow.awarded;
      } else {
        // auto-graded — recompute
        const r = gradeQuestion(q, answerMap.get(q.id));
        earned += r.awarded;
      }
    }
    const finalScore = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
    const passed = finalScore >= attempt.exam.passingScore;

    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { score: finalScore, passed, status: 'GRADED' },
    });

    let certificate = null;
    if (passed) {
      const existing = await prisma.certificate.findFirst({
        where: { userId: attempt.userId, courseId: attempt.exam.courseId },
      });
      if (!existing) {
        const certificateId = generateCertificateId();
        const issuedAt = new Date();
        const verificationHash = generateVerificationHash(certificateId, attempt.userId, attempt.exam.courseId, issuedAt.toISOString());
        certificate = await prisma.certificate.create({
          data: {
            certificateId,
            userId: attempt.userId,
            courseId: attempt.exam.courseId,
            examAttemptId: attempt.id,
            type: 'PROFESSIONAL',
            verificationHash,
          },
          include: { course: true, user: true },
        });
        await awardXp(attempt.userId, XP_REWARDS.EARN_CERTIFICATE, { badgeKey: 'certified', collectibleKey: 'crown_gold' });
      } else {
        certificate = await prisma.certificate.findUnique({ where: { id: existing.id }, include: { course: true, user: true } });
      }
    }

    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'EXAM', resourceId: attempt.id, description: `Graded attempt ${attempt.id}: score ${finalScore}, ${passed ? 'passed' : 'failed'}` });
    return res.json({ attempt: { id: attempt.id, score: finalScore, passed, status: 'GRADED' }, certificate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not grade attempt.' });
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
