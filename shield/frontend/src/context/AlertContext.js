import { createContext, useState, useCallback } from 'react';

export const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addAlert = useCallback((alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 100));
        setUnreadCount(prev => prev + 1);
    }, []);

    const clearUnread = useCallback(() => setUnreadCount(0), []);

    const setInitialAlerts = useCallback((list) => {
        setAlerts(list);
        setUnreadCount(list.filter(a => a.status === 'OPEN').length);
    }, []);

    return (
        <AlertContext.Provider value={{ alerts, unreadCount, addAlert, clearUnread, setInitialAlerts }}>
            {children}
        </AlertContext.Provider>
    );
}
