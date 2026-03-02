export default function AlertBadge({ severity }) {
    const colors = {
        INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        WARNING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[severity] || colors.INFO}`}>
            {severity}
        </span>
    );
}
