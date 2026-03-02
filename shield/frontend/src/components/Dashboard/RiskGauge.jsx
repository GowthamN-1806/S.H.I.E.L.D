export default function RiskGauge({ score = 0 }) {
    const getColor = (s) => {
        if (s <= 25) return { text: 'text-green-400', bg: 'bg-green-500', label: 'LOW' };
        if (s <= 50) return { text: 'text-yellow-400', bg: 'bg-yellow-500', label: 'MEDIUM' };
        if (s <= 75) return { text: 'text-orange-400', bg: 'bg-orange-500', label: 'HIGH' };
        return { text: 'text-red-400', bg: 'bg-red-500', label: 'CRITICAL' };
    };
    const color = getColor(score);
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-[#1e293b] border border-gray-800 rounded-xl p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">System Risk Level</h3>
            <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="60" stroke="#1f2937" strokeWidth="12" fill="none" />
                    <circle cx="70" cy="70" r="60" stroke="currentColor" strokeWidth="12" fill="none"
                        className={color.text} strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${color.text}`}>{score}</span>
                    <span className="text-xs text-gray-500">/100</span>
                </div>
            </div>
            <span className={`mt-3 text-sm font-bold ${color.text}`}>{color.label}</span>
        </div>
    );
}
