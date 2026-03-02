import { useState, useEffect } from 'react';
import api from '../config/api';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users?limit=50');
                setUsers(res.data.data || []);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const lockUser = async (id) => {
        try { await api.post(`/users/${id}/lock`); setUsers(prev => prev.map(u => u._id === id ? { ...u, isLocked: true } : u)); } catch (e) { console.error(e); }
    };
    const unlockUser = async (id) => {
        try { await api.post(`/users/${id}/unlock`); setUsers(prev => prev.map(u => u._id === id ? { ...u, isLocked: false } : u)); } catch (e) { console.error(e); }
    };

    const filtered = filter ? users.filter(u => u.role === filter) : users;

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">👥 User Management</h2>
                <div className="flex gap-2">
                    <select value={filter} onChange={e => setFilter(e.target.value)}
                        className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300">
                        <option value="">All Roles</option>
                        {['super_admin', 'city_admin', 'traffic_officer', 'water_operator', 'power_controller', 'emergency_services', 'maintenance', 'citizen', 'api_partner', 'security_analyst'].map(r =>
                            <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        )}
                    </select>
                </div>
            </div>
            <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-500">
                            <th className="px-4 py-3 text-left">User</th>
                            <th className="px-4 py-3 text-left">Role</th>
                            <th className="px-4 py-3 text-left">Department</th>
                            <th className="px-4 py-3 text-left">Risk</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Last Login</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="text-white font-medium">{u.username}</p>
                                        <p className="text-gray-600 text-[10px]">{u.email}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-medium capitalize">
                                        {u.role?.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400">{u.department}</td>
                                <td className="px-4 py-3">
                                    <span className={`font-mono font-bold ${u.riskScore > 50 ? 'text-red-400' : u.riskScore > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {u.riskScore}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {u.isLocked ? <span className="text-red-400 text-[10px] font-bold">🔒 LOCKED</span>
                                        : u.isActive ? <span className="text-green-400 text-[10px]">✅ Active</span>
                                            : <span className="text-gray-500 text-[10px]">Inactive</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    {u.isLocked
                                        ? <button onClick={() => unlockUser(u._id)} className="text-green-400 hover:underline text-[10px]">Unlock</button>
                                        : <button onClick={() => lockUser(u._id)} className="text-red-400 hover:underline text-[10px]">Lock</button>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
