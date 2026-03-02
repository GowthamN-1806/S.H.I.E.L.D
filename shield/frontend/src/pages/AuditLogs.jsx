import { useState, useEffect } from 'react';
import api from '../config/api';
import AlertBadge from '../components/Alerts/AlertBadge';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [eventFilter, setEventFilter] = useState('');
    const [chainValid, setChainValid] = useState(null);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({ page: String(page), limit: '30' });
            if (eventFilter) params.set('eventType', eventFilter);
            const res = await api.get(`/logs?${params}`);
            setLogs(res.data.data || []);
            setTotal(res.data.pagination?.total || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, [page, eventFilter]);

    const verifyChain = async () => {
        try {
            const res = await api.get('/logs/verify');
            setChainValid(res.data.data);
        } catch (e) { console.error(e); }
    };

    const EVENTS = ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'API_ACCESS', 'ACCESS_DENIED', 'ACCOUNT_LOCKED', 'ALERT_GENERATED', 'MFA_CHALLENGE', 'MFA_SUCCESS', 'MFA_FAILURE', 'ATTACK_SIMULATED'];
    const SEV_MAP = { INFO: 'INFO', WARNING: 'WARNING', CRITICAL: 'CRITICAL' };

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">📋 Immutable Audit Logs</h2>
                <div className="flex gap-2">
                    <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
                        className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300">
                        <option value="">All Events</option>
                        {EVENTS.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
                    </select>
                    <button onClick={verifyChain}
                        className="px-4 py-2 rounded-lg text-xs font-medium border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition">
                        🔗 Verify Chain
                    </button>
                </div>
            </div>

            {chainValid && (
                <div className={`p-4 rounded-xl border ${chainValid.valid ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <p className={`text-sm font-semibold ${chainValid.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {chainValid.valid ? '✅ Log chain integrity verified' : '❌ Integrity issues detected'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {chainValid.totalLogs} logs verified • {new Date(chainValid.verifiedAt).toLocaleString()}
                    </p>
                </div>
            )}

            <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-500">
                            <th className="px-3 py-3 text-left">Severity</th>
                            <th className="px-3 py-3 text-left">Event</th>
                            <th className="px-3 py-3 text-left">User</th>
                            <th className="px-3 py-3 text-left">Resource</th>
                            <th className="px-3 py-3 text-left">Outcome</th>
                            <th className="px-3 py-3 text-left">IP</th>
                            <th className="px-3 py-3 text-left">Time</th>
                            <th className="px-3 py-3 text-left">Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, i) => (
                            <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                <td className="px-3 py-2"><AlertBadge severity={log.severity} /></td>
                                <td className="px-3 py-2 text-gray-300 font-medium">{log.eventType?.replace(/_/g, ' ')}</td>
                                <td className="px-3 py-2 text-gray-400">{log.username}</td>
                                <td className="px-3 py-2 text-gray-500 font-mono truncate max-w-[200px]">{log.resource}</td>
                                <td className="px-3 py-2">
                                    <span className={`text-[10px] font-medium ${log.outcome === 'SUCCESS' ? 'text-green-400' : log.outcome === 'DENIED' ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {log.outcome}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-gray-600 font-mono">{log.ipAddress}</td>
                                <td className="px-3 py-2 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-3 py-2 text-gray-700 font-mono text-[9px] truncate max-w-[80px]" title={log.logHash}>{log.logHash?.substring(0, 12)}...</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{total} total logs</p>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="px-3 py-1 text-xs border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30">← Prev</button>
                    <span className="px-3 py-1 text-xs text-gray-500">Page {page}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 30}
                        className="px-3 py-1 text-xs border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30">Next →</button>
                </div>
            </div>
        </div>
    );
}
