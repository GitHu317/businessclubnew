import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { GraduationCap, Check, X, Clock, Mail, Briefcase, FileText, Loader2, UserX, Trash2, Eye, Phone, Globe, BookOpen, Image as ImageIcon } from 'lucide-react';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    setLoading(true);
    api.listApplications(filter ? { status: filter } : {})
      .then((d) => setApps(d.applications || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const review = async (app, status) => {
    const adminNote = status === 'REJECTED' ? prompt('Reason for rejection (optional):') || '' : '';
    setBusy(app.id);
    try {
      await api.reviewApplication(app.id, { status, adminNote });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleRevoke = async (userId, name) => {
    if (!confirm(`Are you sure you want to revoke instructor privileges for ${name}?`)) return;
    setBusy(userId);
    try {
      await api.revokeInstructor(userId);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Are you sure you want to delete the application and profile for ${name}?`)) return;
    setBusy(userId);
    try {
      await api.deleteInstructor(userId);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Spinner label="Loading applications..." />;

  const pendingCount = apps.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Instructor Applications</h2>
          <p className="text-sm text-slate-500 mt-0.5">Review and approve course creator requests. {pendingCount > 0 && <span className="text-amber-600 font-semibold">{pendingCount} pending</span>}</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input py-1.5 text-sm w-auto">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No applications" description="Instructor applications will appear here for review." />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const targetUserId = app.userId || app.user?.id;
            const displayName = app.fullName || app.user?.fullName || 'User';
            const phoneVal = app.phone || app.user?.phone || '—';
            const deptVal = app.department || app.user?.department || '—';
            const photoSrc = app.photoUrl || app.photo || app.attachmentUrl || app.user?.avatar || app.user?.photo;
            const isBusy = busy === app.id || busy === targetUserId;
            const isExpanded = expandedId === app.id;

            let expertiseList = [];
            try {
              expertiseList = typeof app.expertise === 'string' ? JSON.parse(app.expertise) : (app.expertise || []);
            } catch {
              expertiseList = app.expertise ? [app.expertise] : [];
            }

            return (
              <div key={app.id} className="card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {photoSrc ? (
                      <img 
                        src={photoSrc} 
                        alt={displayName} 
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-brand-950">{displayName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[app.status] || 'bg-slate-100 text-slate-600'}`}>{app.status}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {app.email || app.user?.email || '—'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {phoneVal}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Department / Major: {deptVal}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Applied {new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    {isBusy ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                    ) : (
                      <>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : app.id)}
                          className="btn-secondary text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> {isExpanded ? 'Hide Details' : 'View All Details'}
                        </button>

                        {app.status === 'PENDING' && (
                          <>
                            <button onClick={() => review(app, 'APPROVED')} className="btn-primary text-xs flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approve</button>
                            <button onClick={() => review(app, 'REJECTED')} className="btn-danger text-xs flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reject</button>
                          </>
                        )}

                        {app.status === 'APPROVED' && targetUserId && (
                          <button
                            onClick={() => handleRevoke(targetUserId, displayName)}
                            className="btn-secondary text-xs text-amber-600 border-amber-300 hover:bg-amber-50 flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" /> Revoke
                          </button>
                        )}

                        {targetUserId && (
                          <button
                            onClick={() => handleDelete(targetUserId, displayName)}
                            className="btn-danger text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Summary Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1"><Briefcase className="w-3 h-3" /> Qualifications</div>
                    <p className="text-slate-700 whitespace-pre-wrap">{app.qualifications || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1"><FileText className="w-3 h-3" /> Experience</div>
                    <p className="text-slate-700 whitespace-pre-wrap">{app.experience || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1"><BookOpen className="w-3 h-3" /> Proposed Course</div>
                    <p className="text-slate-700 whitespace-pre-wrap">{app.proposedCourse || '—'}</p>
                  </div>
                </div>

                {/* Expanded Full Details Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-slate-50/70 p-4 rounded-xl">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900">Complete Applicant Information</h4>
                    
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-semibold text-slate-600 block">Full Name:</span>
                        <span className="text-slate-800">{displayName}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 block">Email Address:</span>
                        <span className="text-slate-800">{app.email || app.user?.email || '—'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 block">Phone Number:</span>
                        <span className="text-slate-800">{phoneVal}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 block">Department / Major:</span>
                        <span className="text-slate-800">{deptVal}</span>
                      </div>

                      {photoSrc && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> Applicant Photo Attachment:
                          </span>
                          <div className="mt-1 flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 w-fit">
                            <img src={photoSrc} alt="Applicant Attachment" className="w-16 h-16 object-cover rounded-md border border-slate-200" />
                            <div>
                              <a 
                                href={photoSrc} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-brand-600 hover:underline font-medium block text-xs break-all"
                              >
                                Open Full Image in New Tab
                              </a>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Click thumbnail or link to view full size</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {app.website || app.portfolioUrl ? (
                        <div className="sm:col-span-2 min-w-0">
                          <span className="font-semibold text-slate-600 block">Certificate / Portfolio Link:</span>
                          <a 
                            href={app.website || app.portfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-brand-600 hover:underline flex items-center gap-1.5 mt-0.5 break-all"
                          >
                            <Globe className="w-3.5 h-3.5 flex-shrink-0" /> 
                            <span>{app.website || app.portfolioUrl}</span>
                          </a>
                        </div>
                      ) : null}

                      {app.bio && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-slate-600 block mb-1">Biography / About:</span>
                          <p className="text-slate-700 bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap">{app.bio}</p>
                        </div>
                      )}

                      {expertiseList.length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-slate-600 block mb-1">Expertise / Skills:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {expertiseList.map((exp, idx) => (
                              <span key={idx} className="bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {app.adminNote && (
                  <div className="mt-3 text-xs text-slate-500 italic">Admin note: {app.adminNote}</div>
                )}
                {app.reviewedAt && (
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Reviewed {new Date(app.reviewedAt).toLocaleDateString()}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}