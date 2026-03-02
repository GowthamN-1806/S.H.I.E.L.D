import { useState, useEffect } from 'react';
import useSocket from '../../hooks/useSocket';

const STATUS_ICON = { SECURE: '🟢', ELEVATED: '🟡', INCIDENT: '🔴', HIGH_LOAD: '🟡' };
const STATUS_BG = {
    SECURE: 'border-green-500/20 bg-green-500/5',
    ELEVATED: 'border-yellow-500/20 bg-yellow-500/5',
    INCIDENT: 'border-red-500/20 bg-red-500/5 animate-pulse',
};

export default function SystemStatus({ systems: initialSystems = [] }) {
    const [systems, setSystems] = useState(initialSystems);
    const { on } = useSocket();

    useEffect(() => { setSystems(initialSystems); }, [initialSystems]);
    useEffect(() => {
        const cleanup = on('system_status_update', (data) => {
            setSystems(prev => prev.map(s => {
                const update = data[s.id];
                return update ? { ...s, ...update } : s;
            }));
        });
        return cleanup;
    }, [on]);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {systems.map(s => (
                <div key={s.id} className={`bg-[#1e293b] rounded-xl p-4 border transition-all ${STATUS_BG[s.status] || STATUS_BG.SECURE}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-lg">{STATUS_ICON[s.status] || '⚪'}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{s.uptime ? `${s.uptime}%` : ''}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{s.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{s.status?.toLowerCase()?.replace('_', ' ')}</p>
                    {s.activeConnections && <p className="text-[11px] text-gray-600 mt-1">{s.activeConnections} connections</p>}
                </div>
            ))}
        </div>
    );
}
