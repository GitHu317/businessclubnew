import { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../../components/Common.jsx';
import { MessageSquare, Send, Trash2, Users, CheckSquare } from 'lucide-react';

export default function AdminChat() {
  const { user } = useAuth();
  const isPresident = user?.bodRole === 'PRESIDENT';
  const [channel, setChannel] = useState('board');
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const endRef = useRef(null);

  const load = () => {
    setLoading(true);
    setSelected([]);
    api.listChatMessages(channel).then((d) => setMessages(d.messages || [])).catch(() => setMessages([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [channel]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!isPresident) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Delete' || !selected.length || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      event.preventDefault();
      deleteSelected();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPresident, selected]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try { const { message } = await api.sendChatMessage(channel, text.trim()); setMessages((m) => [...m, message]); setText(''); }
    catch (err) { alert(err.message); } finally { setSending(false); }
  };

  const deleteSelected = async () => {
    if (!isPresident || !selected.length || deleting) return;
    const confirmed = window.confirm(`Do you really want to delete ${selected.length} selected message${selected.length === 1 ? '' : 's'}?`);
    if (!confirmed) return;
    setDeleting(true);
    try { await api.deleteChatMessages(selected); setMessages((all) => all.filter((message) => !selected.includes(message.id))); setSelected([]); }
    catch (err) { alert(err.message); } finally { setDeleting(false); }
  };

  const toggleSelected = (id) => setSelected((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

  return <div className="space-y-4">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div><h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Board Chat</h2><p className="text-sm text-slate-500 mt-0.5">Internal communication between Board of Directors &amp; Admins.</p></div>
      <div className="flex items-center gap-2">
        {isPresident && <button onClick={deleteSelected} disabled={!selected.length || deleting} className="btn-secondary text-red-700 disabled:opacity-40"><Trash2 className="w-4 h-4" /> Delete selected {selected.length ? `(${selected.length})` : ''}</button>}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"><button onClick={() => setChannel('board')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${channel === 'board' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>#board</button><button onClick={() => setChannel('bod')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${channel === 'bod' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>#bod</button></div>
      </div>
    </div>
    {isPresident && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Select messages, then press Delete. You will be asked to confirm before removal.</div>}
    <div className="card flex flex-col" style={{ height: '60vh', minHeight: 400 }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? <Spinner label="Loading messages..." /> : messages.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-400"><Users className="w-10 h-10 mb-2" /><p className="text-sm">No messages yet. Start the conversation!</p></div> : messages.map((m) => {
          const isMe = m.user?.id === user?.id; const checked = selected.includes(m.id);
          return <div key={m.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} ${checked ? 'rounded-xl bg-red-50/60 p-1 ring-1 ring-red-200' : ''}`}>
            {isPresident && <input type="checkbox" checked={checked} onChange={() => toggleSelected(m.id)} aria-label={`Select message from ${m.user?.fullName || 'user'}`} className="mt-2 h-4 w-4 accent-red-600" />}
            <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{m.user?.fullName?.charAt(0).toUpperCase() || '?'}</div>
            <div className={`max-w-[75%] ${isMe ? 'items-end' : ''}`}><div className="flex items-center gap-1.5 mb-0.5"><span className="text-xs font-semibold text-brand-950">{m.user?.fullName || 'Unknown'}</span>{m.user?.bodRole && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-brand-100 text-brand-700">{m.user.bodRole}</span>}<span className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div className={`rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-800'}`}>{m.body}</div></div>
          </div>;
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t border-slate-100 p-3 flex gap-2"><input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message #${channel}...`} className="input flex-1" disabled={sending} /><button type="submit" disabled={sending || !text.trim()} className="btn-primary disabled:opacity-50"><Send className="w-4 h-4" /> Send</button></form>
    </div>
  </div>;
}
