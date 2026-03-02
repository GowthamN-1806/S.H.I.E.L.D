import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import api from '../../config/api';
import { useState } from 'react';

export default function Header() {
    const { user, logout } = useAuth();
    const { connected } = useSocket();
    const [demoRunning, setDemoRunning] = useState(false);

    const triggerDemo = async () => {
        setDemoRunning(true);
        try {
            await api.post('/demo/trigger-attack');
            setTimeout(() => setDemoRunning(false), 10000);
        } catch { setDemoRunning(false); }
    };

    return (
        <header className="h-16 bg-[#0d1117]/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-30">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-white">Security Operations Center</h2>
                <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                    {connected ? 'LIVE' : 'OFFLINE'}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={triggerDemo} disabled={demoRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${demoRunning
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/20'
                        }`}>
                    {demoRunning ? '⚡ Attack in progress...' : '🎯 SIMULATE ATTACK'}
                </button>
                <div className="text-right">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-[11px] text-gray-500">{user?.department}</p>
                </div>
                <button onClick={logout} className="text-gray-400 hover:text-red-400 transition text-sm px-3 py-1 border border-gray-700 rounded-lg hover:border-red-500/30">
                    Logout
                </button>
            </div>
        </header>
    );
}
