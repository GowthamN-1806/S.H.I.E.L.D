import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#0f172a]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
                <span className="text-gray-400 text-sm">Initializing S.H.I.E.L.D...</span>
            </div>
        </div>
    );
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}
