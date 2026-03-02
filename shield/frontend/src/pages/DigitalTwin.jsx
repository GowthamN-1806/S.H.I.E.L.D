import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { twinApi } from '../config/api';
import AttackPanel from '../components/DigitalTwin/AttackPanel';
import SimulationLog from '../components/DigitalTwin/SimulationLog';

const TWIN_SOCKET_URL = import.meta.env.VITE_TWIN_URL || 'http://localhost:3002';

export default function DigitalTwin() {
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState('IDLE');

    useEffect(() => {
        const socket = io(TWIN_SOCKET_URL, { transports: ['websocket', 'polling'] });
        socket.on('attack_simulation_event', (event) => {
            setLogs(prev => [...prev, event].slice(-200));
            if (event.type === 'PROGRESS') setProgress(event.progress || 0);
            if (event.type === 'COMPLETED') {
                setRunning(false); setStatus('COMPLETED'); setProgress(100);
                setResult(event);
            }
            if (event.type === 'ERROR') { setRunning(false); setStatus('ERROR'); }
            if (event.type === 'START') { setStatus('RUNNING'); }
        });
        return () => socket.disconnect();
    }, []);

    const launchSimulation = async (config) => {
        setRunning(true); setLogs([]); setResult(null); setProgress(0); setStatus('RUNNING');
        try {
            await twinApi.post('/simulate', config);
        } catch (err) {
            setRunning(false); setStatus('ERROR');
            setLogs(prev => [...prev, { type: 'ERROR', event: err.message, timestamp: new Date().toISOString() }]);
        }
    };

    const resetSim = async () => {
        try { await twinApi.post('/reset'); } catch (e) { }
        setLogs([]); setResult(null); setProgress(0); setStatus('IDLE'); setRunning(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">🔬 Digital Twin Simulation</h2>
                <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${status === 'RUNNING' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse' :
                            status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                'bg-gray-500/10 text-gray-400 border border-gray-700'
                        }`}>{status}</span>
                    <button onClick={resetSim} className="px-3 py-1.5 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-white transition">
                        🔄 Reset
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {status === 'RUNNING' && (
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AttackPanel onLaunch={launchSimulation} running={running} />
                <SimulationLog logs={logs} />
            </div>

            {/* Results */}
            {result && (
                <div className="bg-[#1e293b] border border-green-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-green-400 mb-4">✅ Simulation Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Events Generated', value: result.eventsGenerated || 0 },
                            { label: 'Alerts Triggered', value: result.alertsTriggered || 0 },
                            { label: 'Attacks Blocked', value: result.blocked || 0 },
                            { label: 'Detection Rate', value: result.detectionRate || '0%' },
                            { label: 'Resilience Score', value: `${result.resilienceScore || 0}/100` },
                        ].map(m => (
                            <div key={m.label} className="text-center">
                                <p className="text-2xl font-bold text-white">{m.value}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
