import { useState, useEffect } from 'react';
import api from '../config/api';
import useSocket from '../hooks/useSocket';
import StatsCards from '../components/Dashboard/StatsCards';
import LiveFeed from '../components/Dashboard/LiveFeed';
import ThreatMap from '../components/Dashboard/ThreatMap';
import RiskGauge from '../components/Dashboard/RiskGauge';
import SystemStatus from '../components/Dashboard/SystemStatus';

export default function Dashboard() {
    const [stats, setStats] = useState({});
    const [events, setEvents] = useState([]);
    const [systems, setSystems] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { on } = useSocket();

    const fetchData = async () => {
        try {
            const [statsRes, eventsRes, healthRes, sessionsRes, alertsRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/recent-events'),
                api.get('/dashboard/system-health'),
                api.get('/dashboard/sessions'),
                api.get('/alerts?limit=10'),
            ]);
            setStats(statsRes.data.data);
            setEvents(eventsRes.data.data);
            setSystems(healthRes.data.data);
            setSessions(sessionsRes.data.data);
            setAlerts(alertsRes.data.data || []);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); const interval = setInterval(fetchData, 30000); return () => clearInterval(interval); }, []);

    useEffect(() => {
        const cleanup = on('new_alert', (alert) => {
            setAlerts(prev => [alert, ...prev].slice(0, 10));
            setStats(prev => ({ ...prev, activeAlerts: (prev.activeAlerts || 0) + 1 }));
        });
        return cleanup;
    }, [on]);

    const terminateSession = async (sessionId) => {
        try {
            await api.post(`/dashboard/sessions/${sessionId}/terminate`);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
    );

    const avgRisk = stats.criticalAlerts > 0 ? 75 : stats.highAlerts > 0 ? 50 : stats.activeAlerts > 2 ? 35 : 15;

    return (
        <div className="space-y-6">
            {/* System Health */}
            <SystemStatus systems={systems} />

            {/* Stats */}
            <StatsCards stats={stats} />

            {/* Main Grid: Feed + Map + Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <LiveFeed events={events} />
                </div>
                <div className="lg:col-span-5">
                    <ThreatMap alerts={alerts} />
                </div>
                <div className="lg:col-span-3">
                    <RiskGauge score={avgRisk} />
                </div>
            </div>

            {/* Bottom: Sessions */}
            <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-white">🔗 Active Sessions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500">
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">IP</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3 text-left">Risk</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.slice(0, 10).map((s, i) => (
                                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                    <td className="px-4 py-3 text-white font-medium">{s.username}</td>
                                    <td className="px-4 py-3 text-gray-400 capitalize">{s.role?.replace('_', ' ')}</td>
                                    <td className="px-4 py-3 text-gray-500 font-mono">{s.ipAddress}</td>
                                    <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.riskScoreAtCreation > 50 ? 'bg-red-500/10 text-red-400' : s.riskScoreAtCreation > 25 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                                            }`}>{s.riskScoreAtCreation}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => terminateSession(s.sessionId)}
                                            className="text-red-400 hover:text-red-300 text-[10px] font-medium px-2 py-1 border border-red-500/20 rounded hover:bg-red-500/10 transition">
                                            TERMINATE
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">No active sessions</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
