import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';
import { awardXp, XP_REWARDS } from '../utils/gamification.js';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const router = Router();

const SERIF = 'Times-Roman';
const SERIF_BOLD = 'Times-Bold';
const SANS = 'Helvetica';
const SANS_BOLD = 'Helvetica-Bold';
const MONO = 'Courier';

const COLORS = {
  brand950: '#1a1a2e',
  brand900: '#22223b',
  brand800: '#37306b',
  brand700: '#4a4e69',
  gold500: '#c9a227',
  gold600: '#b8860b',
  gold400: '#e0c252',
  slate400: '#94a3b8',
  slate500: '#64748b',
  emerald600: '#059669',
  memberGold: '#a67c00',
};

// Signature names required by spec.
const SIGNATURES = {
  president: 'Lincoln Alexyv',
  vicePrincipal: 'Abrham Durresso',
};

// GET /api/certificates/mine  (authenticated user's certificates — online read-only data)
router.get('/mine', authRequired, async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user.id },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    });
    // Online mode: expose certificate ID for verification, download disabled on client.
    return res.json({ certificates });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load certificates.' });
  }
});

// GET /api/certificates/:certificateId/online  (online read-only view — has cert ID, download disabled)
router.get('/:certificateId/online', authRequired, async (req, res) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: req.params.certificateId },
      include: { course: true, user: true },
    });
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });
    // Only the owner or an admin can view the online read-only version.
    if (cert.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorised to view this certificate.' });
    }
    return res.json({
      mode: 'online',
      downloadDisabled: true,
      certificate: {
        certificateId: cert.certificateId,
        type: cert.type,
        recipientName: cert.user.fullName,
        courseTitle: cert.course.title,
        courseCategory: cert.course.category,
        issuedAt: cert.issuedAt,
        verificationHash: cert.verificationHash,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load certificate.' });
  }
});

// Build a PRINTABLE PDF for a certificate.
// Printable mode: OMITS the certificate ID, but INCLUDES dynamic signature bars
// for President "Lincoln Alexyv" and Vice Principal "Abrham Durresso".
async function streamPrintableCertificatePdf(cert, res) {
  const recipientName = cert.user?.fullName || 'Recipient';
  const courseTitle = cert.course?.title || 'Course';
  const issued = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const certType = cert.type || 'PROFESSIONAL';
  const isMember = certType === 'MEMBER_ONLY';

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.certificateId}.pdf"`);
  res.setHeader('Cache-Control', 'no-store');
  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Member-only certificates use a richer gold palette; Professional uses brand navy.
  const primary = isMember ? COLORS.memberGold : COLORS.brand950;
  const accent = COLORS.gold500;

  // ----- Outer double border -----
  const outerInset = 24;
  doc.lineWidth(6).rect(outerInset, outerInset, pageW - outerInset * 2, pageH - outerInset * 2).strokeColor(primary).stroke();
  const innerInset = 32;
  doc.lineWidth(1.5).rect(innerInset, innerInset, pageW - innerInset * 2, pageH - innerInset * 2).strokeColor(accent).stroke();

  // Decorative gold corners
  const cornerLen = 36, cornerOff = 44;
  function corner(x, y, dx, dy) {
    doc.lineWidth(3).moveTo(x, y).lineTo(x + dx, y).moveTo(x, y).lineTo(x, y + dy).strokeColor(accent).stroke();
  }
  corner(cornerOff, cornerOff, cornerLen, cornerLen);
  corner(pageW - cornerOff, cornerOff, -cornerLen, cornerLen);
  corner(cornerOff, pageH - cornerOff, cornerLen, -cornerLen);
  corner(pageW - cornerOff, pageH - cornerOff, -cornerLen, -cornerLen);

  const cx = pageW / 2;

  // Emblem
  const emblemY = 86, emblemR = 26;
  const iconPath = fileURLToPath(new URL('../../../client/public/business-club-icon.jpg', import.meta.url));
  doc.save();
  doc.circle(cx, emblemY, emblemR - 1).clip();
  doc.image(iconPath, cx - emblemR + 1, emblemY - emblemR + 1, { width: (emblemR - 1) * 2, height: (emblemR - 1) * 2 });
  doc.restore();
  doc.circle(cx, emblemY, emblemR).lineWidth(2).strokeColor(accent).stroke();

  // Header
  doc.fillColor(COLORS.brand700).font(SANS_BOLD).fontSize(12).text('BUSINESS  CLUB', cx - 120, emblemY + emblemR + 8, { width: 240, align: 'center', characterSpacing: 4 });
  doc.fillColor(COLORS.slate500).font(SANS).fontSize(8).text('Kotebe University of Education  |  Science Shared Campus', cx - 200, emblemY + emblemR + 24, { width: 400, align: 'center' });

  // Title — differs by type
  const titleY = 168;
  const titleText = isMember ? 'Certificate of Membership' : 'Certificate of Completion';
  doc.fillColor(primary).font(SERIF_BOLD).fontSize(32).text(titleText, cx - 250, titleY, { width: 500, align: 'center' });
  doc.lineWidth(2).moveTo(cx - 48, titleY + 44).lineTo(cx + 48, titleY + 44).strokeColor(accent).stroke();

  // Type ribbon for member-only
  if (isMember) {
    doc.fillColor(COLORS.memberGold).font(SANS_BOLD).fontSize(10).text('MEMBER  ONLY', cx - 80, titleY + 48, { width: 160, align: 'center', characterSpacing: 3 });
  }

  // Body
  let y = titleY + (isMember ? 70 : 64);
  doc.fillColor(COLORS.slate500).font(SANS).fontSize(11).text(isMember ? 'This is to certify that' : 'This is to certify that', cx - 200, y, { width: 400, align: 'center' });
  y += 22;
  doc.fillColor(primary).font(SERIF_BOLD).fontSize(26).text(recipientName, cx - 280, y, { width: 560, align: 'center' });
  y += 38;
  const statement = isMember
    ? 'is a verified Member of the Business Club, recognised for commitment and contribution to the club community, having completed'
    : 'has successfully completed the course and passed the required examination for';
  doc.fillColor(COLORS.slate500).font(SANS).fontSize(11).text(statement, cx - 280, y, { width: 560, align: 'center' });
  y += isMember ? 30 : 22;
  doc.fillColor(COLORS.brand800).font(SERIF_BOLD).fontSize(20).text(courseTitle, cx - 300, y, { width: 600, align: 'center' });

  // ----- Date only (NO certificate ID in printable mode) -----
  const metaY = y + 70;
  doc.fillColor(COLORS.slate400).font(SANS_BOLD).fontSize(8).text('DATE ISSUED', cx - 80, metaY, { width: 160, align: 'center', characterSpacing: 1 });
  doc.fillColor(primary).font(SANS_BOLD).fontSize(11).text(issued, cx - 80, metaY + 14, { width: 160, align: 'center' });

  // ----- Dynamic signature bars (printable mode only) -----
  const sigY = pageH - 92;
  const sigLineW = 150;
  const sigLeftX = cx - 175;
  const sigRightX = cx + 175 - sigLineW;

  // President: Lincoln Alexyv
  doc.lineWidth(1).moveTo(sigLeftX, sigY).lineTo(sigLeftX + sigLineW, sigY).strokeColor(COLORS.slate400).stroke();
  doc.fillColor(primary).font(SERIF_BOLD).fontSize(11).text(SIGNATURES.president, sigLeftX, sigY - 16, { width: sigLineW, align: 'center' });
  doc.fillColor(COLORS.slate500).font(SANS).fontSize(8).text('President, Business Club', sigLeftX, sigY + 5, { width: sigLineW, align: 'center' });

  // Vice Principal: Abrham Durresso
  doc.lineWidth(1).moveTo(sigRightX, sigY).lineTo(sigRightX + sigLineW, sigY).strokeColor(COLORS.slate400).stroke();
  doc.fillColor(primary).font(SERIF_BOLD).fontSize(11).text(SIGNATURES.vicePrincipal, sigRightX, sigY - 16, { width: sigLineW, align: 'center' });
  doc.fillColor(COLORS.slate500).font(SANS).fontSize(8).text('Vice Principal, Kotebe University', sigRightX, sigY + 5, { width: sigLineW, align: 'center' });

  // Center seal
  const sealR = 22;
  doc.save();
  doc.circle(cx, sigY - 6, sealR - 1).clip();
  doc.image(iconPath, cx - sealR + 1, sigY - 6 - sealR + 1, { width: (sealR - 1) * 2, height: (sealR - 1) * 2 });
  doc.restore();
  doc.circle(cx, sigY - 6, sealR).lineWidth(2).strokeColor(accent).stroke();

  doc.end();
}

// GET /api/certificates/:certificateId/pdf  (PRINTABLE version — omits cert ID, has signature bars)
router.get('/:certificateId/pdf', async (req, res) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: req.params.certificateId },
      include: { course: true, user: true, examAttempt: true },
    });
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });
    if (req.user) {
      await logActivity({ req, userId: req.user.id, action: 'DOWNLOAD', resourceType: 'CERTIFICATE', resourceId: cert.id, description: `Printed certificate PDF (${cert.certificateId}) for ${cert.user?.fullName}` });
    }
    return await streamPrintableCertificatePdf(cert, res);
  } catch (err) {
    console.error('Certificate PDF error:', err);
    if (!res.headersSent) return res.status(500).json({ error: 'Could not generate certificate PDF.' });
  }
});

// POST /api/certificates/:certificateId/type  (admin — upgrade certificate type, e.g. to MEMBER_ONLY)
router.post('/:certificateId/type', authRequired, adminRequired, async (req, res) => {
  try {
    const { type } = req.body;
    if (!['PROFESSIONAL', 'MEMBER_ONLY'].includes(type)) {
      return res.status(400).json({ error: 'Type must be PROFESSIONAL or MEMBER_ONLY.' });
    }
    const cert = await prisma.certificate.update({
      where: { certificateId: req.params.certificateId },
      data: { type },
      include: { course: true, user: true },
    });
    await logActivity({ req, userId: req.user.id, action: 'UPDATE', resourceType: 'CERTIFICATE', resourceId: cert.id, description: `Set certificate ${cert.certificateId} type to ${type}` });
    // Award XP for member-only upgrade
    if (type === 'MEMBER_ONLY') {
      await awardXp(cert.userId, XP_REWARDS.EARN_CERTIFICATE, { collectibleKey: 'crown_gold' });
    }
    return res.json({ certificate: cert });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update certificate type.' });
  }
});

// GET /api/certificates/:certificateId  (PUBLIC verification lookup — online mode shows cert ID)
router.get('/:certificateId', async (req, res) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: req.params.certificateId },
      include: { course: true, user: true, examAttempt: true },
    });
    if (!cert) return res.status(404).json({ valid: false, error: 'Certificate not found.' });
    return res.json({
      valid: true,
      mode: 'online',
      certificate: {
        certificateId: cert.certificateId,
        type: cert.type,
        recipientName: cert.user.fullName,
        courseTitle: cert.course.title,
        courseCategory: cert.course.category,
        issuedAt: cert.issuedAt,
        verificationHash: cert.verificationHash,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not verify certificate.' });
  }
});

export default router;
