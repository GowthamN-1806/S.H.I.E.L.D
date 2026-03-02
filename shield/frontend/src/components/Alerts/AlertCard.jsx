const SEV = {
    INFO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    WARNING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

export default function AlertCard({ alert, onAcknowledge, onResolve }) {
    const s = SEV[alert.severity] || SEV.INFO;
    return (
        <div className={`${s.bg} border ${s.border} rounded-xl p-4 transition-all hover:scale-[1.01]`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.bg} ${s.text} border ${s.border}`}>{alert.severity}</span>
                        <span className="text-[10px] text-gray-500 capitalize">{alert.targetSystem || 'general'}</span>
                        {alert.isDemo && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">DEMO</span>}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">{alert.title}</h4>
                    <p className="text-xs text-gray-400">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                        {alert.username && <span>👤 {alert.username}</span>}
                        {alert.riskScore > 0 && <span>📊 Risk: {alert.riskScore}</span>}
                        <span>🕐 {new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 ml-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${alert.status === 'RESOLVED' ? 'bg-green-500/10 text-green-400' :
                            alert.status === 'ACKNOWLEDGED' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                        }`}>{alert.status?.toLowerCase()}</span>
                    {alert.status === 'OPEN' && onAcknowledge && (
                        <button onClick={() => onAcknowledge(alert.alertId)} className="text-[10px] text-cyan-400 hover:underline">ACK</button>
                    )}
                    {(alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED') && onResolve && (
                        <button onClick={() => onResolve(alert.alertId)} className="text-[10px] text-green-400 hover:underline">RESOLVE</button>
                    )}
                </div>
            </div>
        </div>
    );
}
