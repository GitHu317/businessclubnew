import { randomBytes, createHash } from 'crypto';

// Generates a human-readable, unforgeable certificate id like: KUE-BC-2024-7F3K9A2X
export function generateCertificateId() {
  const year = new Date().getFullYear();
  const rand = randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
  return `KUE-BC-${year}-${rand}`;
}

// Verification hash binds user, course, attempt and a secret so it cannot be forged.
export function generateVerificationHash(certificateId, userId, courseId, issuedAt) {
  const payload = `${certificateId}|${userId}|${courseId}|${issuedAt}|${process.env.JWT_SECRET}`;
  return createHash('sha256').update(payload).digest('hex');
}
