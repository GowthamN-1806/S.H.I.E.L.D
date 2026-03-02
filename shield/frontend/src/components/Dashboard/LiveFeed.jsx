import { useState, useEffect, useRef } from 'react';
import useSocket from '../../hooks/useSocket';

const SEVERITY_COLORS = {
    INFO: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    WARNING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

export default function LiveFeed({ events: initialEvents = [] }) {
    const [events, setEvents] = useState(initialEvents);
    const [filter, setFilter] = useState('ALL');
    const listRef = useRef(null);
    const { on } = useSocket();

    useEffect(() => { setEvents(initialEvents); }, [initialEvents]);

    useEffect(() => {
        const cleanup1 = on('new_alert', (alert) => {
            setEvents(prev => [{ ...alert, severity: alert.severity || 'WARNING', eventType: 'ALERT', timestamp: alert.createdAt }, ...prev].slice(0, 100));
        });
        const cleanup2 = on('demo_event', (ev) => {
            setEvents(prev => [{
                eventType: 'DEMO', severity: ev.type === 'ATTACK' ? 'CRITICAL' : ev.type === 'DETECTION' ? 'WARNING' : 'INFO',
                action: ev.event, timestamp: ev.timestamp, isDemo: true,
            }, ...prev].slice(0, 100));
        });
        return () => { cleanup1?.(); cleanup2?.(); };
    }, [on]);

    const filtered = filter === 'ALL' ? events : events.filter(e => e.severity === filter);

    return (
        <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Live Threat Feed
                </h3>
                <div className="flex gap-1">
                    {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-2 py-0.5 text-[10px] rounded font-medium transition ${filter === f ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[400px]">
                {filtered.length === 0 && <p className="text-gray-600 text-xs text-center py-8">No events to display</p>}
                {filtered.map((e, i) => (
                    <div key={i} className={`p-2.5 rounded-lg border text-xs animate-fade-in ${SEVERITY_COLORS[e.severity] || SEVERITY_COLORS.INFO}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{e.eventType || e.title || 'EVENT'}</span>
                            <span className="text-[10px] opacity-60">{e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''}</span>
                        </div>
                        <p className="opacity-80 truncate">{e.action || e.description || e.username || ''}</p>
                        {e.isDemo && <span className="inline-block mt-1 text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">DEMO</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
