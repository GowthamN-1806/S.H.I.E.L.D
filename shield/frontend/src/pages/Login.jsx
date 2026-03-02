import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { login, verifyMfa } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [tempToken, setTempToken] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMfa, setShowMfa] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const result = await login(username, password);
            if (result.requiresMfa) {
                setTempToken(result.tempToken);
                setShowMfa(true);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
        setLoading(false);
    };

    const handleMfa = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await verifyMfa(tempToken, mfaCode);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'MFA verification failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]"></div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 mb-4">
                        <span className="text-4xl">🛡️</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">S.H.I.E.L.D</h1>
                    <p className="text-xs text-gray-500 tracking-[0.3em] mt-1">SECURE HYBRID INFRASTRUCTURE</p>
                    <p className="text-xs text-gray-600 tracking-[0.3em]">ENFORCEMENT & LOGGING DEFENSE</p>
                </div>

                {/* Login Form */}
                <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                        <span className="text-xs text-gray-400 font-medium tracking-wider">
                            {showMfa ? 'MFA VERIFICATION' : 'AUTHORIZED PERSONNEL ONLY'}
                        </span>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
                    )}

                    {!showMfa ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block font-medium">USERNAME</label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition"
                                    placeholder="Enter your username" required />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block font-medium">PASSWORD</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition"
                                    placeholder="Enter your password" required />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-sm hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM →'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleMfa} className="space-y-4">
                            <p className="text-xs text-gray-400 mb-2">Enter the 6-digit code from your authenticator app.</p>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block font-medium">MFA CODE</label>
                                <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white text-center tracking-[0.5em] font-mono text-xl focus:border-cyan-500 outline-none transition"
                                    placeholder="000000" maxLength={6} required autoFocus />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-sm hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                                {loading ? 'VERIFYING...' : 'VERIFY & ACCESS →'}
                            </button>
                            <button type="button" onClick={() => { setShowMfa(false); setTempToken(null); }}
                                className="w-full text-xs text-gray-500 hover:text-gray-300 transition">← Back to login</button>
                        </form>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-800">
                        <p className="text-[10px] text-gray-600 text-center">
                            Demo: <span className="text-gray-400">alex.chen</span> / <span className="text-gray-400">Shield@2024!</span>
                        </p>
                        <p className="text-[10px] text-gray-700 text-center mt-1">
                            MFA Test Secret: JBSWY3DPEHPK3PXP
                        </p>
                    </div>
                </div>

                <p className="text-center text-[10px] text-gray-700 mt-6">
                    S.H.I.E.L.D v1.0.0 • Government-Grade Urban Security Platform
                </p>
            </div>
        </div>
    );
}
