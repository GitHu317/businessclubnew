import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';
import { authRequired } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';
import { awardXp, XP_REWARDS } from '../utils/gamification.js';

const router = Router();

// Lazily initialise Firebase Admin for Google ID-token verification.
let firebaseAuth = null;
async function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;
  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Firebase env variables missing from process.env');
      return null;
    }

    // Strip surrounding quotes if present
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }

    // Sanitize missing 'n' typos and convert escaped newlines
    privateKey = privateKey.replace(/\\90/g, '\\n90').replace(/\\n/g, '\n');

    if (getApps().length === 0) {
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    }
    firebaseAuth = getAuth();
    return firebaseAuth;
  } catch (err) {
    console.error('Firebase init error:', err.message);
    return null;
  }
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, studentId, department } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!fullName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Full name, email and password are required.' });
    }
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        passwordHash,
        studentId: studentId || null,
        department: department || null,
        role: 'STUDENT',
        membershipStatus: 'PENDING',
        membershipTier: 'BASIC',
        authProvider: 'EMAIL',
      },
    });
    const token = signToken(user);
    const { passwordHash: _ph, ...safe } = user;
    return res.status(201).json({ user: safe, token });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = signToken(user);
    const { passwordHash: _ph, ...safe } = user;
    await logActivity({
      req,
      userId: user.id,
      action: 'LOGIN',
      description: `${user.fullName} signed in with email and password`,
      metadata: JSON.stringify({ provider: 'EMAIL' }),
    });
    return res.json({ user: safe, token });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/google  — Firebase Google sign-in/sign-up.
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required.' });
    }
    const adminAuth = await getFirebaseAuth();
    if (!adminAuth) {
      return res.status(503).json({
        error:
          'Google sign-in is not configured on the server. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables to enable it. Email/password auth still works.',
      });
    }
    const decoded = await adminAuth.verifyIdToken(idToken);
    const googleId = decoded.uid;
    const email = (decoded.email || '').toLowerCase();
    const fullName = decoded.name || email.split('@')[0];
    const avatarUrl = decoded.picture || null;
    if (!email) {
      return res.status(400).json({ error: 'Google account has no email associated.' });
    }

    // Find by googleId or email.
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });
    const isNewUser = !user;
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, authProvider: 'GOOGLE', avatarUrl: avatarUrl || user.avatarUrl },
      });
    } else {
      user = await prisma.user.create({
        data: {
          fullName,
          email,
          googleId,
          avatarUrl,
          role: 'STUDENT',
          membershipStatus: 'PENDING',
          membershipTier: 'BASIC',
          authProvider: 'GOOGLE',
        },
      });
    }

    if (isNewUser) {
      await awardXp(user.id, XP_REWARDS.ENROLL_COURSE, { badgeKey: 'first_step' });
    }

    const token = signToken(user);
    await logActivity({
      req,
      userId: user.id,
      action: 'LOGIN',
      description: `${user.fullName} signed in with Google`,
      metadata: JSON.stringify({ provider: 'GOOGLE' }),
    });
    const { passwordHash: _ph, ...safe } = user;
    return res.json({ user: safe, token, isNewUser });
  } catch (err) {
    console.error('google auth error', err);
    return res.status(401).json({ error: 'Google authentication failed: ' + (err.message || 'invalid token') });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { creatorProfile: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { passwordHash: _ph, ...safe } = user;
    return res.json({ user: safe });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ error: 'Could not load user.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authRequired, async (req, res) => {
  try {
    const { fullName, department, studentId, avatarUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(department ? { department } : {}),
        ...(studentId ? { studentId } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    });
    const { passwordHash: _ph, ...safe } = updated;
    return res.json({ user: safe });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update profile.' });
  }
});

// PUT /api/auth/onboarding — collect the welcome questionnaire on first sign-in.
router.put('/onboarding', authRequired, async (req, res) => {
  try {
    const { fullName, heardAbout, institution, usageGoals } = req.body;
    if (!heardAbout || !institution) {
      return res.status(400).json({ error: 'Please tell us how you heard about us and your institution.' });
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        hasOnboarded: true,
        heardAbout,
        institution,
        usageGoals: usageGoals || null,
        ...(fullName ? { fullName } : {}),
      },
    });
    await awardXp(req.user.id, XP_REWARDS.ENROLL_COURSE, { badgeKey: 'first_step' });
    const { passwordHash: _ph, ...safe } = updated;
    return res.json({ user: safe });
  } catch (err) {
    console.error('onboarding error', err);
    return res.status(500).json({ error: 'Could not save onboarding data.' });
  }
});

export default router;
