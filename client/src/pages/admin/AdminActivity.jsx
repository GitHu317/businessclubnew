import { useEffect, useState } from 'react';
import {
  ScrollText, LogIn, PlusCircle, Pencil, Trash2, Eye, RefreshCw, Filter, Search, Loader2, AlertTriangle,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner, EmptyState, ErrorState } from '../../components/Common.jsx';

const ACTION_ICONS = {
  LOGIN: LogIn,
  LOGOUT: LogIn,
  PAGE_VIEW: Eye,
  CREATE: PlusCircle,
  UPDATE: Pencil,
  DELETE: Trash2,
  DELETE_LOG: AlertTriangle,
  DOWNLOAD: Eye,
};

const ACTION_COLORS = {
  LOGIN: 'bg-emerald-100 text-emerald-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  PAGE_VIEW: 'bg-blue-100 text-blue-700',
  CREATE: 'bg-brand-100 text-brand-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  DELETE_LOG: 'bg-red-200 text-red-800',
  DOWNLOAD: 'bg-purple-100 text-purple-700',
};

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function AdminActivity() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterAction) params.action = filterAction;
      if (filterResource) params.resourceType = filterResource;
      const [logData, statData] = await Promise.all([
        api.activityLogs(params),
        api.activityStats().catch(() => ({ total: 0, byAction: [], byUser: [] })),
      ]);
      setLogs(logData.logs);
      setStats(statData);
    } catch (err) {
      setError(err.message || 'Could not load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterAction, filterResource]);

  const filtered = search
    ? logs.filter(
        (l) =>
          l.description?.toLowerCase().includes(search.toLowerCase()) ||
          l.user?.fullName?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const handleDeleteLogs = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.deleteActivityLogs();
      setConfirming(false);
      load();
    } catch (err) {
      setError(err.message || 'Could not delete activity logs.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading activity log..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-950 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-brand-700" /> BOD Activity Log
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit trail of Board of Directors actions: logins, data updates, and deletions.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {/* Delete Log — President (super-admin) only */}
          {user?.bodRole === 'PRESIDENT' && (
            <button
              onClick={() => setConfirming(true)}
              className="btn-danger text-sm"
              title="Delete all activity log entries (President only)"
            >
              <Trash2 className="w-4 h-4" /> Delete Log
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !deleting && setConfirming(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-brand-950">Delete All Activity Logs?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              This will permanently clear <strong>{stats?.total || 'all'} log entries</strong>. A record of this deletion will be logged before the wipe. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDeleteLogs} disabled={deleting} className="btn-danger flex-1">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting...' : 'Yes, delete all logs'}
              </button>
              <button onClick={() => setConfirming(false)} disabled={deleting} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorState message={error} />}

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-2xl font-bold text-brand-950">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total events</p>
          </div>
          {stats.byAction.slice(0, 3).map((a) => (
            <div key={a.action} className="card p-4">
              <p className="text-2xl font-bold text-brand-950">{a._count.id}</p>
              <p className="text-xs text-slate-500 mt-0.5">{a.action.toLowerCase()} actions</p>
            </div>
          ))}
        </div>
      )}

      {/* Top actors */}
      {stats?.byUser?.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Most active BOD members</p>
          <div className="flex flex-wrap gap-2">
            {stats.byUser.slice(0, 6).map((u) => (
              <span key={u.userId} className="inline-flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1 text-xs text-slate-700">
                <span className="font-medium">{u.user?.fullName || 'Unknown'}</span>
                {u.user?.bodRole && (
                  <span className={`px-1.5 rounded-full text-[10px] font-semibold ${u.user.bodRole === 'PRESIDENT' ? 'bg-gold-200 text-gold-800' : 'bg-brand-100 text-brand-700'}`}>
                    {u.user.bodRole}
                  </span>
                )}
                <span className="text-slate-400">{u._count.id}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="input py-1.5 text-sm w-auto"
        >
          <option value="">All actions</option>
          <option value="LOGIN">Login</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="DELETE_LOG">Delete Log</option>
          <option value="DOWNLOAD">Download</option>
        </select>
        <select
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          className="input py-1.5 text-sm w-auto"
        >
          <option value="">All resources</option>
          <option value="BOARD_MEMBER">Board Member</option>
          <option value="COURSE">Course</option>
          <option value="LESSON">Lesson</option>
          <option value="EXAM">Exam</option>
          <option value="GAME">Game</option>
          <option value="ANNOUNCEMENT">Announcement</option>
          <option value="USER">User / Membership</option>
          <option value="APPLICATION">Application</option>
          <option value="CHAT">Chat</option>
          <option value="CREATOR_PROFILE">Creator Profile</option>
          <option value="CERTIFICATE">Certificate</option>
          <option value="LOG">Log</option>
        </select>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by member or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No activity recorded"
          description="BOD actions (logins, course/lesson/exam/game/announcement edits) will appear here as they happen."
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {filtered.map((log) => {
            const Icon = ACTION_ICONS[log.action] || ScrollText;
            const colorCls = ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600';
            return (
              <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-brand-950">{log.user?.fullName || 'Unknown user'}</span>
                    {log.user?.bodRole && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${log.user.bodRole === 'PRESIDENT' ? 'bg-gold-200 text-gold-800' : 'bg-brand-100 text-brand-700'}`}>
                        {log.user.bodRole}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorCls}`}>{log.action}</span>
                    {log.resourceType && (
                      <span className="text-xs text-slate-400">{log.resourceType.replace(/_/g, ' ').toLowerCase()}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{log.description}</p>
                  {log.ipAddress && (
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">IP: {log.ipAddress}</p>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0 text-right">
                  <p className="font-medium">{timeAgo(log.createdAt)}</p>
                  <p className="mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
