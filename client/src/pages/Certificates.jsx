import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Award, ArrowLeft, Download, Printer, ShieldCheck, ExternalLink, Loader2,
  Calendar, Crown, Lock, Eye, FileText,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, EmptyState } from '../components/Common.jsx';

/* ============================================================
   Certificate Sheet — dual mode renderer
   mode: 'online'   → read-only, shows unique Certificate ID, download disabled
   mode: 'printable'→ omits Certificate ID, shows signature bars with names
   type: 'PROFESSIONAL' (navy) | 'MEMBER_ONLY' (gold)
   ============================================================ */
const SIGNATURES = {
  president: 'Lincoln Alexyv',
  vicePrincipal: 'Abrham Durresso',
};

function CertificateSheet({ cert, mode = 'online' }) {
  const isMember = cert.type === 'MEMBER_ONLY';
  const isPrint = mode === 'printable';

  // Theme tokens per certificate type
  const theme = isMember
    ? { border: 'border-gold-500', bg: 'bg-gradient-to-br from-amber-50 via-white to-amber-50', accent: 'text-gold-700', ribbon: 'bg-gold-500', ribbonText: 'text-brand-950', ring: 'bg-gold-500/20 text-gold-600 border-gold-500' }
    : { border: 'border-brand-900', bg: 'bg-gradient-to-br from-brand-50 via-white to-brand-50', accent: 'text-brand-800', ribbon: 'bg-brand-800', ribbonText: 'text-gold-400', ring: 'bg-brand-900 text-gold-400 border-brand-900' };

  return (
    <div className={`certificate-sheet ${theme.bg} border-8 border-double ${theme.border} rounded-lg p-8 md:p-12 relative overflow-hidden`}>
      {/* decorative corners */}
      <div className={`absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 ${isMember ? 'border-gold-500' : 'border-gold-400'}`} />
      <div className={`absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 ${isMember ? 'border-gold-500' : 'border-gold-400'}`} />
      <div className={`absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 ${isMember ? 'border-gold-500' : 'border-gold-400'}`} />
      <div className={`absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 ${isMember ? 'border-gold-500' : 'border-gold-400'}`} />

      {/* MEMBER ONLY ribbon badge (online mode only — printable has no special ribbon) */}
      {isMember && !isPrint && (
        <div className={`absolute top-6 right-1/2 translate-x-1/2 ${theme.ribbon} ${theme.ribbonText} text-[10px] font-bold tracking-widest uppercase px-4 py-1 rounded-full shadow`}>
          ★ Member Only ★
        </div>
      )}

      <div className="text-center pt-4">
        {/* Seal / icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full ${theme.ring} border-2 flex items-center justify-center`}>
            <img src="/business-club-icon.jpg" alt="Business Club of SSC" className="h-full w-full rounded-full object-cover" />
          </div>
        </div>
        <p className={`text-sm tracking-[0.3em] ${theme.accent} font-semibold uppercase`}>Business Club</p>
        <p className="text-xs text-slate-500 mt-1">Kotebe University of Education | Science Shared Campus</p>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-950 mt-6">
          {isMember ? 'Certificate of Membership' : 'Certificate of Completion'}
        </h1>
        <div className={`w-24 h-1 ${theme.ribbon} mx-auto mt-3`} />

        <p className="text-slate-500 mt-6 text-sm">This is to certify that</p>
        <p className="font-serif text-2xl md:text-3xl font-bold text-brand-950 mt-2">{cert.recipientName}</p>
        <p className="text-slate-500 mt-4 text-sm max-w-lg mx-auto">
          {isMember
            ? 'has been recognized as a valued Member of the Business Club and has successfully completed the course'
            : 'has successfully completed the course and passed the required examination for'}
        </p>
        <p className="font-serif text-xl md:text-2xl font-bold text-brand-800 mt-2 px-4">{cert.courseTitle}</p>
        {cert.courseCategory && (
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{cert.courseCategory}</p>
        )}

        {/* Meta grid */}
        <div className={`grid ${isPrint ? 'grid-cols-1' : 'grid-cols-2'} gap-8 mt-10 text-left max-w-md mx-auto`}>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Date Issued</p>
            <p className="font-semibold text-brand-950 text-sm flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5" /> {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {/* ONLINE mode shows Certificate ID; PRINTABLE mode omits it */}
          {!isPrint && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Certificate ID</p>
              <p className="font-mono text-xs text-brand-950 font-semibold mt-1 break-all">{cert.certificateId}</p>
            </div>
          )}
        </div>

        {/* Verification note (online only) */}
        {!isPrint && (
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verify authenticity at /verify/{cert.certificateId}
          </div>
        )}

        {/* Signature bars */}
        <div className="mt-8 flex justify-between items-end max-w-md mx-auto">
          <div className="text-center">
            <div className="w-32 border-b border-slate-400 mb-1" />
            {/* PRINTABLE mode shows the names; online mode shows the role only */}
            <p className="text-xs text-slate-500">{isPrint ? SIGNATURES.president : 'President, Business Club'}</p>
            {isPrint && <p className="text-[10px] text-slate-400">President</p>}
          </div>
          <div className={`w-14 h-14 rounded-full ${theme.ring} border-2 flex items-center justify-center`}>
            {isMember ? <Crown className="w-7 h-7" /> : <Award className="w-7 h-7" />}
          </div>
          <div className="text-center">
            <div className="w-32 border-b border-slate-400 mb-1" />
            <p className="text-xs text-slate-500">{isPrint ? SIGNATURES.vicePrincipal : 'Vice Principal'}</p>
            {isPrint && <p className="text-[10px] text-slate-400">Vice Principal</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Certificates() {
  const { id } = useParams();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);        // online view payload
  const [rawCert, setRawCert] = useState(null);           // raw cert from /mine (for list metadata)
  const [mode, setMode] = useState('online');             // 'online' | 'printable'
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch the online view AND the user's cert list (to find the matching raw cert with type)
      Promise.all([
        api.certificateOnline(id).catch(() => null),
        api.myCertificates().then((d) => d.certificates).catch(() => []),
      ]).then(([online, certs]) => {
        if (online?.certificate) {
          setSelected(online.certificate);
          const match = certs.find((c) => c.certificateId === id);
          setRawCert(match || null);
        }
        setLoading(false);
      });
    } else {
      api.myCertificates().then((d) => setList(d.certificates)).finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => window.print();

  // Download the PRINTABLE certificate as a PDF (server endpoint omits cert ID, includes signatures).
  const handleDownloadPdf = async (certId) => {
    setDownloading(true);
    try {
      const url = api.certificatePdfUrl(certId);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `certificate-${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Sorry, the PDF could not be downloaded. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Spinner label="Loading certificates..." />;

  /* ---------- Single certificate view ---------- */
  if (id || selected) {
    if (!selected) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <EmptyState icon={Award} title="Certificate not found" description="This certificate may not belong to your account."
            action={<Link to="/certificates" className="btn-primary">Back to my certificates</Link>} />
        </div>
      );
    }

    const certType = selected.type || rawCert?.type || 'PROFESSIONAL';
    const isMember = certType === 'MEMBER_ONLY';

    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Toolbar (hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link to="/certificates" className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-700 text-sm">
            <ArrowLeft className="w-4 h-4" /> My certificates
          </Link>

          {/* Mode toggle: Online (read-only) vs Printable */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setMode('online')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${mode === 'online' ? 'bg-brand-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Eye className="w-3.5 h-3.5" /> Online
            </button>
            <button
              onClick={() => setMode('printable')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${mode === 'printable' ? 'bg-brand-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Printable
            </button>
          </div>

          <div className="flex gap-2">
            <Link to={`/verify/${selected.certificateId}`} target="_blank" className="btn-secondary text-sm">
              <ExternalLink className="w-4 h-4" /> Verify
            </Link>
            <button onClick={handlePrint} className="btn-secondary text-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            {/* Download disabled in ONLINE mode (read-only); enabled only in PRINTABLE mode */}
            <button
              onClick={() => mode === 'printable' && handleDownloadPdf(selected.certificateId)}
              disabled={mode === 'online' || downloading}
              title={mode === 'online' ? 'Download is disabled in online read-only mode — switch to Printable' : 'Download printable PDF'}
              className={`btn-primary text-sm ${(mode === 'online' || downloading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'online' ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />)}
              {downloading ? 'Generating...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Mode info banner */}
        <div className="no-print mb-4">
          {mode === 'online' ? (
            <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-2.5 text-xs text-brand-800 flex items-center gap-2">
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span><strong>Online read-only view.</strong> Shows your unique verifiable Certificate ID. Download is disabled to preserve authenticity — use the public verification link to share.</span>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center gap-2">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span><strong>Printable version.</strong> Omits the Certificate ID and includes signature bars for President <em>{SIGNATURES.president}</em> and Vice Principal <em>{SIGNATURES.vicePrincipal}</em>. Optimized for printing or PDF export.</span>
            </div>
          )}
        </div>

        {/* The certificate sheet — only this renders when printing */}
        <CertificateSheet
          cert={{ ...selected, type: certType }}
          mode={mode}
        />

        {/* Type badge below sheet */}
        <div className="no-print mt-4 flex items-center justify-center">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 ${isMember ? 'bg-gold-500/20 text-gold-700' : 'bg-brand-100 text-brand-800'}`}>
            {isMember ? <Crown className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
            {isMember ? 'Member Only Certificate' : 'Professional Certificate'}
          </span>
        </div>
      </div>
    );
  }

  /* ---------- List view ---------- */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 text-brand-700 text-sm mb-2">
        <Award className="w-4 h-4" /> Your achievements
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-950 mb-6">My Certificates</h1>

      {list.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet"
          description="Complete a course exam with a passing score to earn your first verifiable certificate."
          action={<Link to="/courses" className="btn-primary">Browse courses</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {list.map((c) => {
            const isMember = c.type === 'MEMBER_ONLY';
            return (
              <div key={c.id} className={`card p-6 hover:shadow-lg transition group flex flex-col justify-between border-l-4 ${isMember ? 'border-l-gold-500' : 'border-l-brand-700'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isMember ? 'bg-gold-500/20 text-gold-600' : 'bg-brand-100 text-brand-700'}`}>
                    {isMember ? <Crown className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-brand-950 truncate group-hover:text-brand-700 transition">{c.course.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">Issued {new Date(c.issuedAt).toLocaleDateString()}</p>
                    <p className="text-xs font-mono text-brand-700 mt-2 bg-brand-50 rounded px-2 py-1 inline-block">{c.certificateId}</p>
                    {isMember && (
                      <span className="ml-2 text-[10px] font-bold text-gold-700 bg-gold-500/20 rounded px-1.5 py-0.5 inline-block">MEMBER ONLY</span>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/certificates/${c.certificateId}`} className="btn-secondary text-xs flex-1 text-center">
                    View certificate
                  </Link>
                  <Link to={`/verify/${c.certificateId}`} target="_blank" className="btn-ghost text-xs">
                    Verify
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
