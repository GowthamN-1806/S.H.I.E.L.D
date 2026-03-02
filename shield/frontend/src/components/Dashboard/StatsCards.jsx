const CARDS = [
    { key: 'totalEvents', label: 'Events Today', icon: '📈', color: 'from-cyan-500 to-blue-600' },
    { key: 'activeSessions', label: 'Active Sessions', icon: '🔗', color: 'from-green-500 to-emerald-600' },
    { key: 'blockedAttempts', label: 'Blocked', icon: '🚫', color: 'from-red-500 to-rose-600' },
    { key: 'totalApiCalls', label: 'API Calls', icon: '🔄', color: 'from-purple-500 to-violet-600' },
    { key: 'activeAlerts', label: 'Active Alerts', icon: '🚨', color: 'from-orange-500 to-amber-600' },
    { key: 'criticalAlerts', label: 'Critical', icon: '⚠️', color: 'from-red-600 to-pink-600' },
];

export default function StatsCards({ stats }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {CARDS.map(c => (
                <div key={c.key} className="bg-[#1e293b] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{c.icon}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${c.color} text-white font-medium`}>LIVE</span>
                    </div>
                    <p className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {stats?.[c.key] ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                </div>
            ))}
        </div>
    );
}
