import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, Search, Award, Calendar, Hash, User, BookOpen,
  CheckCircle2, XCircle, ArrowRight, Loader2,
} from 'lucide-react';
import { api } from '../api/client.js';

export default function Verify() {
  const { id: paramId } = useParams();
  const [input, setInput] = useState(paramId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const verify = async (certId) => {
    if (!certId) return;
    setLoading(true);
    setSearched(true);
    try {
      const d = await api.verifyCertificate(certId.trim());
      setResult(d);
    } catch (e) {
      setResult({ valid: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) verify(paramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-950 to-brand-800 text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur">
            <ShieldCheck className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Certificate Verification</h1>
          <p className="text-slate-300 mt-3">
            Enter a certificate ID to verify its authenticity. Every certificate issued by the Business Club
            carries a unique, unforgeable ID and verification hash.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Search */}
        <div className="card p-5 mb-6">
          <form
            onSubmit={(e) => { e.preventDefault(); verify(input); }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                className="input pl-9 font-mono"
                placeholder="e.g. KUE-BC-2024-XXXXXXXX"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading || !input} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify
            </button>
          </form>
        </div>

        {/* Result */}
        {searched && (
          <>
            {loading ? (
              <div className="card p-10 text-center text-slate-500">Verifying...</div>
            ) : result?.valid ? (
              <div className="card p-6 md:p-8 border-emerald-300 bg-emerald-50/40">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-emerald-800">Certificate is valid ✓</h2>
                    <p className="text-sm text-emerald-700">This certificate was issued by the Business Club at Kotebe University of Education.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="rounded-lg bg-white border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide mb-1">
                      <User className="w-3.5 h-3.5" /> Recipient
                    </div>
                    <p className="font-semibold text-brand-950">{result.certificate.recipientName}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide mb-1">
                      <BookOpen className="w-3.5 h-3.5" /> Course
                    </div>
                    <p className="font-semibold text-brand-950">{result.certificate.courseTitle}</p>
                    <p className="text-xs text-slate-500">{result.certificate.courseCategory}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Issued on
                    </div>
                    <p className="font-semibold text-brand-950">
                      {new Date(result.certificate.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide mb-1">
                      <Hash className="w-3.5 h-3.5" /> Certificate ID
                    </div>
                    <p className="font-mono text-sm text-brand-950 font-semibold break-all">{result.certificate.certificateId}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-lg bg-brand-50 border border-brand-100 p-3 text-xs text-slate-600">
                  <span className="font-semibold text-brand-700">Verification hash:</span>{' '}
                  <span className="font-mono break-all">{result.certificate.verificationHash}</span>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center border-red-300 bg-red-50/50">
                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-red-700">Certificate not found</h2>
                <p className="text-sm text-red-600 mt-2">
                  {result?.error || 'No certificate matches this ID. Please check the ID and try again.'}
                </p>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="card p-8 text-center">
            <Award className="w-12 h-12 text-gold-500 mx-auto mb-3" />
            <h3 className="font-bold text-brand-950">How verification works</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Each certificate has a unique ID (format <span className="font-mono text-brand-700">KUE-BC-YYYY-XXXXXXXX</span>) and a cryptographic verification hash.
              Anyone can validate a certificate here without logging in.
            </p>
            <Link to="/" className="btn-secondary mt-4 inline-flex">Back home <ArrowRight className="w-4 h-4" /></Link>
          </div>
        )}
      </div>
    </div>
  );
}
