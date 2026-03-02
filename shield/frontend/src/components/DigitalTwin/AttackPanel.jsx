import { useState } from 'react';

const ATTACKS = [
    { id: 'brute_force', label: 'Brute Force', icon: '🔨' },
    { id: 'credential_stuffing', label: 'Credential Stuffing', icon: '🔐' },
    { id: 'api_flood', label: 'API Flood', icon: '🌊' },
    { id: 'insider_threat', label: 'Insider Threat', icon: '🕵️' },
];
const TARGETS = ['traffic', 'water', 'power', 'emergency'];
const INTENSITIES = ['LOW', 'MEDIUM', 'HIGH'];
const DURATIONS = [30, 60, 120];

export default function AttackPanel({ onLaunch, running }) {
    const [attackType, setAttackType] = useState('brute_force');
    const [target, setTarget] = useState('water');
    const [intensity, setIntensity] = useState('MEDIUM');
    const [duration, setDuration] = useState(30);

    return (
        <div className="bg-[#1e293b] border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">⚔️ Attack Configuration</h3>
            <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Attack Type</label>
                <div className="grid grid-cols-2 gap-2">
                    {ATTACKS.map(a => (
                        <button key={a.id} onClick={() => setAttackType(a.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${attackType === a.id ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}>{a.icon} {a.label}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Target System</label>
                <div className="flex gap-2">
                    {TARGETS.map(t => (
                        <button key={t} onClick={() => setTarget(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition ${target === t ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}>{t}</button>
                    ))}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1.5 block">Intensity</label>
                    <div className="flex gap-2">
                        {INTENSITIES.map(i => (
                            <button key={i} onClick={() => setIntensity(i)}
                                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border transition ${intensity === i ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-400'
                                    }`}>{i}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Duration</label>
                    <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                        {DURATIONS.map(d => <option key={d} value={d}>{d}s</option>)}
                    </select>
                </div>
            </div>
            <button onClick={() => onLaunch({ attackType, targetSystem: target, intensity, duration })} disabled={running}
                className={`w-full py-3 rounded-lg text-sm font-bold transition-all ${running ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/20'
                    }`}>
                {running ? '⏳ Simulation Running...' : '🚀 LAUNCH SIMULATION'}
            </button>
        </div>
    );
}
