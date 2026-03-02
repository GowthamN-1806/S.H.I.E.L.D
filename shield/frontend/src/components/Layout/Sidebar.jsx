import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useAlerts from '../../hooks/useAlerts';

const NAV = [
    { to: '/', icon: '📊', label: 'Dashboard', roles: null },
    { to: '/alerts', icon: '🚨', label: 'Alerts', roles: null },
    { to: '/users', icon: '👥', label: 'Users', roles: ['super_admin', 'city_admin', 'security_analyst'] },
    { to: '/audit-logs', icon: '📋', label: 'Audit Logs', roles: ['super_admin', 'security_analyst', 'city_admin'] },
    { to: '/digital-twin', icon: '🔬', label: 'Digital Twin', roles: ['super_admin', 'security_analyst'] },
    { to: '/api-keys', icon: '🔑', label: 'API Keys', roles: ['super_admin', 'city_admin', 'security_analyst'] },
];

export default function Sidebar() {
    const { user } = useAuth();
    const { unreadCount } = useAlerts();

    const filtered = NAV.filter(n => !n.roles || n.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-[#0d1117] border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-40">
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🛡️</span>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">S.H.I.E.L.D</h1>
                        <p className="text-[10px] text-gray-500 tracking-widest">SMART CITY SECURITY</p>
                    </div>
                </div>
            </div>
            <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
                {filtered.map(n => (
                    <NavLink key={n.to} to={n.to} end={n.to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}>
                        <span className="text-lg">{n.icon}</span>
                        <span>{n.label}</span>
                        {n.label === 'Alerts' && unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold">
                        {user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
