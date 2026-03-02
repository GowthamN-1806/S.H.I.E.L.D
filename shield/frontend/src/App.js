import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Alerts from './pages/Alerts';
import AuditLogs from './pages/AuditLogs';
import DigitalTwin from './pages/DigitalTwin';
import ApiKeys from './pages/ApiKeys';

function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#0f172a]">
            <Sidebar />
            <div className="ml-64">
                <Header />
                <main className="pt-16 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AlertProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute><AppLayout><Users /></AppLayout></ProtectedRoute>} />
                        <Route path="/alerts" element={<ProtectedRoute><AppLayout><Alerts /></AppLayout></ProtectedRoute>} />
                        <Route path="/audit-logs" element={<ProtectedRoute><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />
                        <Route path="/digital-twin" element={<ProtectedRoute><AppLayout><DigitalTwin /></AppLayout></ProtectedRoute>} />
                        <Route path="/api-keys" element={<ProtectedRoute><AppLayout><ApiKeys /></AppLayout></ProtectedRoute>} />
                    </Routes>
                </AlertProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
