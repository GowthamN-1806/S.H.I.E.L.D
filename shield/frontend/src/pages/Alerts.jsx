import { useState, useEffect } from 'react';
import api from '../config/api';
import useSocket from '../hooks/useSocket';
import AlertCard from '../components/Alerts/AlertCard';

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const { on } = useSocket();

    const fetchAlerts = async () => {
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (filter) params.set('severity', filter);
            const res = await api.get(`/alerts?${params}`);
            setAlerts(res.data.data || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchAlerts(); }, [filter]);
    useEffect(() => {
        const cleanup = on('new_alert', (alert) => { setAlerts(prev => [alert, ...prev]); });
        return cleanup;
    }, [on]);

    const acknowledge = async (alertId) => {
        try { await api.post(`/alerts/${alertId}/acknowledge`); setAlerts(prev => prev.map(a => a.alertId === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a)); } catch (e) { console.error(e); }
    };
    const resolve = async (alertId) => {
        try { await api.post(`/alerts/${alertId}/resolve`, { notes: 'Resolved by analyst' }); setAlerts(prev => prev.map(a => a.alertId === alertId ? { ...a, status: 'RESOLVED' } : a)); } catch (e) { console.error(e); }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">🚨 Security Alerts</h2>
                <div className="flex gap-2">
                    {['', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filter === s ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}>{s || 'ALL'}</button>
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                {alerts.length === 0 && <p className="text-gray-600 text-center py-16">No alerts to display</p>}
                {alerts.map((a, i) => <AlertCard key={a.alertId || i} alert={a} onAcknowledge={acknowledge} onResolve={resolve} />)}
            </div>
        </div>
    );
}
