import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../config/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('shield_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/auth/me')
                .then(res => { setUser(res.data.data); setLoading(false); })
                .catch(() => { setToken(null); localStorage.removeItem('shield_token'); setLoading(false); });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = useCallback(async (username, password) => {
        const res = await api.post('/auth/login', { username, password, deviceFingerprint: 'dashboard-web' });
        const data = res.data.data;
        if (data.requiresMfa) {
            return { requiresMfa: true, tempToken: data.tempToken };
        }
        localStorage.setItem('shield_token', data.accessToken);
        localStorage.setItem('shield_user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
        return { requiresMfa: false };
    }, []);

    const verifyMfa = useCallback(async (tempToken, code) => {
        const res = await api.post('/auth/verify-mfa', { tempToken, mfaCode: code });
        const data = res.data.data;
        localStorage.setItem('shield_token', data.accessToken);
        localStorage.setItem('shield_user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
    }, []);

    const logout = useCallback(async () => {
        try { await api.post('/auth/logout'); } catch (e) { /* ignore */ }
        localStorage.removeItem('shield_token');
        localStorage.removeItem('shield_user');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, verifyMfa, logout, isAuthenticated: !!token && !!user }}>
            {children}
        </AuthContext.Provider>
    );
}
