import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { EmptyState, Spinner } from '../../components/Common.jsx';
import { Calendar, Download, Gamepad2, Mail, UserRound } from 'lucide-react';

export default function AdminGameRegistrations() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listGames()
      .then((data) => {
        const nextGames = data.games || [];
        setGames(nextGames);
        if (nextGames.length) setSelectedGameId(nextGames[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingGames(false));
  }, []);

  useEffect(() => {
    if (!selectedGameId) {
      setRegistrations([]);
      return;
    }
    setLoadingRegistrations(true);
    setError('');
    api.gameRegistrations(selectedGameId)
      .then((data) => setRegistrations(data.registrations || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingRegistrations(false));
  }, [selectedGameId]);

  const selectedGame = games.find((game) => game.id === selectedGameId);

  if (loadingGames) return <Spinner label="Loading games..." />;
  if (!games.length) return <EmptyState icon={Gamepad2} title="No games yet" description="Create a business game first to view registrations." />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><UserRound className="w-5 h-5" /> Game Registrations</h2>
          <p className="text-sm text-slate-500 mt-1">See which members registered for each business game.</p>
        </div>
        <select className="input sm:max-w-xs" value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}>
          {games.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-semibold text-brand-950">{selectedGame?.title}</h3>
            <p className="text-xs text-slate-500">{registrations.length} registered member{registrations.length === 1 ? '' : 's'}</p>
          </div>
          <button type="button" className="btn-ghost text-sm" onClick={() => window.print()} title="Print or save this list"><Download className="w-4 h-4" /> Print list</button>
        </div>
        {loadingRegistrations ? <div className="p-6"><Spinner label="Loading registrations..." /></div> : registrations.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No members have registered for this game yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {registrations.map((registration, index) => (
              <div key={registration.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-semibold">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-brand-950">{registration.user.fullName}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{registration.user.email}</span>
                    {registration.user.studentId && <span>Student ID: {registration.user.studentId}</span>}
                    {registration.user.department && <span>{registration.user.department}</span>}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400"><Calendar className="w-3.5 h-3.5" />{new Date(registration.registeredAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
