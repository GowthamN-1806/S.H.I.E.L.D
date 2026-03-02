import { useRef, useEffect } from 'react';

const TYPE_COLORS = {
    ATTACK: 'text-red-400', DETECTION: 'text-yellow-400', RESPONSE: 'text-green-400',
    RESOLVED: 'text-cyan-400', PROGRESS: 'text-gray-500', SYSTEM: 'text-blue-400',
    EVENT: 'text-orange-400', START: 'text-purple-400', COMPLETED: 'text-green-300',
    ERROR: 'text-red-500',
};

export default function SimulationLog({ logs = [] }) {
    const endRef = useRef(null);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

    return (
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden h-full flex flex-col">
            <div className="p-3 border-b border-gray-800 flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500">$</span>
                <span className="text-xs font-semibold text-white">Simulation Terminal</span>
                <span className="ml-auto text-[10px] text-gray-600">{logs.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[500px] font-mono text-xs">
                {logs.length === 0 && <p className="text-gray-600">Waiting for simulation...</p>}
                {logs.map((log, i) => (
                    <div key={i} className={`${TYPE_COLORS[log.type] || 'text-gray-400'}`}>
                        <span className="text-gray-600">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}]</span>{' '}
                        <span className="font-semibold">[{log.type}]</span>{' '}
                        {log.event || log.target || ''} {log.attempt ? `#${log.attempt}` : ''}{' '}
                        {log.progress !== undefined ? `${log.progress}%` : ''}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
}
