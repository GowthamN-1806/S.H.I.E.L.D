import { useState, useEffect } from 'react';
import api from '../config/api';

export default function ApiKeys() {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', partnerName: '', scopes: '', expiresInDays: 365 });
    const [newKey, setNewKey] = useState(null);

    useEffect(() => {
        api.get('/api-keys').then(res => { setKeys(res.data.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const create = async () => {
        try {
            const res = await api.post('/api-keys', {
                ...form, scopes: form.scopes.split(',').map(s => s.trim()).filter(Boolean),
            });
            setNewKey(res.data.data.rawKey);
            setKeys(prev => [res.data.data, ...prev]);
            setShowCreate(false);
        } catch (e) { console.error(e); }
    };

    const revoke = async (keyId) => {
        try { await api.post(`/api-keys/${keyId}/revoke`); setKeys(prev => prev.map(k => k.keyId === keyId ? { ...k, isActive: false } : k)); } catch (e) { console.error(e); }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">🔑 API Key Management</h2>
                <button onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition">
                    + Create Key
                </button>
            </div>

            {newKey && (
                <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                    <p className="text-sm text-green-400 font-semibold mb-2">🔐 New API Key Created — Copy Now!</p>
                    <code className="block p-3 bg-black/50 rounded text-xs text-green-300 font-mono break-all">{newKey}</code>
                    <p className="text-[10px] text-gray-500 mt-2">This key will not be shown again.</p>
                    <button onClick={() => setNewKey(null)} className="text-xs text-gray-500 mt-2 hover:text-white">Dismiss</button>
                </div>
            )}

            {showCreate && (
                <div className="bg-[#1e293b] border border-gray-800 rounded-xl p-5 space-y-3">
                    <input placeholder="Key Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white" />
                    <input placeholder="Partner Name" value={form.partnerName} onChange={e => setForm({ ...form, partnerName: e.target.value })}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white" />
                    <input placeholder="Scopes (comma-separated)" value={form.scopes} onChange={e => setForm({ ...form, scopes: e.target.value })}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white" />
                    <button onClick={create} className="px-4 py-2 rounded-lg text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition">Create</button>
                </div>
            )}

            <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-500">
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Partner</th>
                            <th className="px-4 py-3 text-left">Prefix</th>
                            <th className="px-4 py-3 text-left">Scopes</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Expires</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keys.map(k => (
                            <tr key={k.keyId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                <td className="px-4 py-3 text-white font-medium">{k.name}</td>
                                <td className="px-4 py-3 text-gray-400">{k.partnerName}</td>
                                <td className="px-4 py-3 font-mono text-gray-500">{k.prefix}...</td>
                                <td className="px-4 py-3 text-gray-500">{(k.scopes || []).join(', ') || '—'}</td>
                                <td className="px-4 py-3">
                                    {k.isActive ? <span className="text-green-400 text-[10px]">✅ Active</span> : <span className="text-red-400 text-[10px]">🚫 Revoked</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-500">{new Date(k.expiresAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right">
                                    {k.isActive && <button onClick={() => revoke(k.keyId)} className="text-red-400 hover:underline text-[10px]">Revoke</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
