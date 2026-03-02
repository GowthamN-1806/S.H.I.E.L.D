/**
 * S.H.I.E.L.D — Enterprise Admin Control Panel Logic
 */

const API_BASE = 'http://localhost:5000/api';
let STATE = {
    token: localStorage.getItem('shield_token'),
    user: localStorage.getItem('shield_user') ? JSON.parse(localStorage.getItem('shield_user')) : null,
    statsInterval: null,
    logsInterval: null
};

// UI Elements configuration for sidebar based on role
const MENU_ITEMS = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard', roles: ['Super Admin'] },
    { id: 'security-monitoring', icon: 'fa-shield-halved', label: 'Security Monitoring', roles: ['Super Admin'] },
    { id: 'infrastructure', icon: 'fa-server', label: 'Infrastructure Control', roles: ['Super Admin', 'Traffic Department Officer', 'Field Agent'] },
    { id: 'access-approvals', icon: 'fa-clipboard-check', label: 'Access Approvals', roles: ['Super Admin'] },
    { id: 'active-sessions', icon: 'fa-network-wired', label: 'Active Sessions', roles: ['Super Admin'] },
    { id: 'user-management', icon: 'fa-users-gear', label: 'User Management', roles: ['Super Admin'] },
    { id: 'settings', icon: 'fa-sliders', label: 'Settings', roles: ['Super Admin', 'Traffic Department Officer'] }
];

document.addEventListener('DOMContentLoaded', initApp);

function $(id) { return document.getElementById(id); }

function initApp() {
    startClock();

    if (STATE.token && STATE.user) {
        completeLoginSequence();
    } else {
        $('auth-overlay').classList.remove('hidden-section');
    }

    $('btn-auth').addEventListener('click', handleLogin);
    $('login-pass').addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
    $('btn-logout').addEventListener('click', handleLogout);
}

async function handleLogin() {
    const userIn = $('login-user').value.trim();
    const passIn = $('login-pass').value.trim();
    const errEl = $('login-err');
    const btn = $('btn-auth');

    if (!userIn || !passIn) {
        errEl.textContent = 'CREDENTIALS REQUIRED';
        return;
    }

    errEl.textContent = '';
    btn.innerHTML = '<div class="loader"></div> VALIDATING...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userIn, password: passIn })
        });

        const data = await res.json();

        if (res.ok) {
            STATE.token = data.token;
            STATE.user = data;
            localStorage.setItem('shield_token', data.token);
            localStorage.setItem('shield_user', JSON.stringify(data));

            showToast(`Authentication successful. Role: ${data.role}`, 'success');
            setTimeout(completeLoginSequence, 800);
        } else {
            errEl.textContent = `[401] ${data.message || 'ACCESS DENIED'}`;
            showToast('Authentication Failed', 'error');
        }
    } catch (err) {
        errEl.textContent = '[503] GATEWAY UNREACHABLE';
        showToast('API Connection Error', 'error');
    } finally {
        setTimeout(() => {
            btn.innerHTML = '<span>Initialize Session</span><i class="fa-solid fa-arrow-right-to-bracket"></i>';
            btn.disabled = false;
        }, 500);
    }
}

function completeLoginSequence() {
    $('auth-overlay').style.opacity = '0';
    setTimeout(() => {
        $('auth-overlay').classList.add('hidden-section');
        const app = $('app-container');
        app.classList.remove('hidden-section');
        setTimeout(() => app.style.opacity = '1', 50);

        buildSidebar();
        updateUserProfile();

        // Auto-navigate based on role
        if (STATE.user.role === 'Super Admin') {
            navigate('dashboard');
        } else {
            navigate('infrastructure');
        }
    }, 500);
}

function handleLogout() {
    localStorage.removeItem('shield_token');
    localStorage.removeItem('shield_user');
    STATE.token = null;
    STATE.user = null;

    clearInterval(STATE.statsInterval);
    clearInterval(STATE.logsInterval);

    $('app-container').style.opacity = '0';
    setTimeout(() => {
        $('app-container').classList.add('hidden-section');
        $('auth-overlay').classList.remove('hidden-section');
        $('auth-overlay').style.opacity = '1';
        $('login-pass').value = '';
        $('login-err').textContent = '';
        showToast('Session Terminated', 'info');
    }, 500);
}

function buildSidebar() {
    const nav = $('nav-menu');
    nav.innerHTML = '';

    MENU_ITEMS.forEach(item => {
        if (item.roles.includes(STATE.user.role) || item.roles.includes('All')) {
            const el = document.createElement('button');
            el.className = 'w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-brand-panel rounded transition-colors group text-left';
            el.innerHTML = `<i class="fa-solid ${item.icon} w-5 text-center group-hover:text-brand-accent transition-colors"></i> <span>${item.label}</span>`;
            el.dataset.id = item.id;
            el.addEventListener('click', () => navigate(item.id, el));
            nav.appendChild(el);
        }
    });
}

function updateUserProfile() {
    $('user-name').textContent = STATE.user.username.toUpperCase();
    $('user-role').textContent = STATE.user.role.toUpperCase();
    $('user-initials').textContent = STATE.user.username.substring(0, 2).toUpperCase();
}

function navigate(pageId, navButton = null) {
    // Update active state in sidebar
    document.querySelectorAll('#nav-menu button').forEach(b => {
        b.classList.remove('bg-brand-panel', 'text-white', 'border-l-2', 'border-brand-accent');
        b.classList.add('text-gray-400');
    });

    if (navButton) {
        navButton.classList.add('bg-brand-panel', 'text-white', 'border-l-2', 'border-brand-accent');
        navButton.classList.remove('text-gray-400');
        $('current-page-title').textContent = navButton.querySelector('span').textContent;
    } else {
        const btn = document.querySelector(`#nav-menu button[data-id="${pageId}"]`);
        if (btn) {
            btn.classList.add('bg-brand-panel', 'text-white', 'border-l-2', 'border-brand-accent');
            $('current-page-title').textContent = btn.querySelector('span').textContent;
        }
    }

    // Hide all views
    document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden-section'));

    // Cleanup intervals
    clearInterval(STATE.statsInterval);
    clearInterval(STATE.logsInterval);

    // Show selected view or fallback
    const view = $(`view-${pageId}`);
    if (view) {
        view.classList.remove('hidden-section');
        initPageLogic(pageId);
    } else {
        $('view-fallback').classList.remove('hidden-section');
    }
}

function initPageLogic(pageId) {
    if (pageId === 'dashboard') {
        fetchStats();
        STATE.statsInterval = setInterval(fetchStats, 10000);
    } else if (pageId === 'security-monitoring') {
        fetchLogs();
        STATE.logsInterval = setInterval(fetchLogs, 5000);
    }
}

// --- API ACTIONS ---

async function authFetch(path, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${STATE.token}`,
        'Content-Type': 'application/json'
    };
    const res = await fetch(`${API_BASE}${path}`, options);
    // JWT Expired or Invalid handling
    if (res.status === 401) {
        showToast('Session expired or invalid', 'error');
        handleLogout();
        throw new Error('401 Unauthorized');
    }
    return res;
}

async function fetchStats() {
    try {
        const [statsRes, sysRes] = await Promise.all([
            authFetch('/admin/stats'),
            authFetch('/admin/system-status')
        ]);

        if (statsRes.ok) {
            const data = await statsRes.json();
            $('stat-users').textContent = data.stats.totalUsers || 0;
            $('stat-sessions').textContent = data.stats.activeSessions || 0;
            $('stat-blocked').textContent = data.stats.deniedRequestsCount || 0;
            $('stat-alerts').textContent = data.stats.rbacDeniedCount || 0;
        }

        if (sysRes.ok) {
            const data = await sysRes.json();
            $('sys-api').textContent = data.status.gateway;
            $('sys-db').textContent = data.status.database;
            $('sys-uptime').textContent = data.status.uptime;

            $('sys-api').className = data.status.gateway === 'Operational' ? 'py-3 text-right text-brand-neon' : 'py-3 text-right text-brand-danger';
            $('sys-db').className = data.status.database === 'Connected' ? 'py-3 text-right text-brand-neon' : 'py-3 text-right text-brand-warning';
        }
    } catch (e) {
        console.warn('Failed to fetch dashboard stats', e);
    }
}

async function fetchLogs() {
    try {
        const res = await authFetch('/admin/logs');
        if (res.ok) {
            const data = await res.json();
            renderLogsTable(data.logs);
        }
    } catch (e) {
        $('live-logs-body').innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-brand-danger">Error retrieving audit chain.</td></tr>`;
    }
}

function renderLogsTable(logs) {
    const tbody = $('live-logs-body');
    if (!logs || logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No activity recorded.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    logs.forEach(l => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-brand-nav transition-colors';

        // Color coding
        let outcomeColors = 'text-gray-400';
        let actionColor = 'text-gray-400';

        if (l.outcome === 'SUCCESS') outcomeColors = 'text-brand-neon font-bold';
        else if (l.outcome === 'DENIED' || l.outcome === 'BLOCKED') outcomeColors = 'text-brand-danger font-bold';
        else if (l.outcome === 'FAILURE') outcomeColors = 'text-brand-warning font-bold';

        if (l.action.includes('DENIED') || l.action.includes('FAILURE')) actionColor = 'text-brand-warning';

        tr.innerHTML = `
            <td class="px-4 py-2 text-gray-500 text-xs">${new Date(l.createdAt).toLocaleString()}</td>
            <td class="px-4 py-2 text-white">${l.username || l.ipAddress || 'Anonymous'}</td>
            <td class="px-4 py-2 text-brand-accent text-xs">${l.role || 'N/A'}</td>
            <td class="px-4 py-2 ${actionColor}">${l.action}</td>
            <td class="px-4 py-2 text-gray-400 truncate max-w-[200px]" title="${l.endpoint}">${l.endpoint}</td>
            <td class="px-4 py-2 ${outcomeColors}">${l.outcome}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function infraAction(system, method) {
    const resEl = $(`res-${system}`);
    resEl.classList.remove('hidden');
    resEl.innerHTML = '<div class="loader"></div> Processing...';
    resEl.className = 'text-xs font-mono p-2 rounded mt-2 border border-gray-600 bg-gray-800 text-gray-300';

    let path = '';
    let body = null;

    if (system === 'traffic') { path = '/traffic/controlSignal'; body = { signalId: 'N1-Beta', status: 'Red' }; }
    if (system === 'power') { path = '/power/gridStatus'; }
    if (system === 'water') { path = '/water/status'; } // Updated to actual endpoint pattern

    try {
        const res = await authFetch(path, {
            method: method,
            body: body ? JSON.stringify(body) : null
        });
        const data = await res.json();

        if (res.ok) {
            resEl.textContent = `[200 OK] ${JSON.stringify(data.data || data.message)}`;
            resEl.className = 'text-xs font-mono p-2 rounded mt-2 border border-brand-neon text-brand-neon bg-brand-neon/10';
            showToast(`${system.toUpperCase()} Action Successful`, 'success');
        } else {
            resEl.textContent = `[${res.status} FORBIDDEN] ${data.message || data.reason || 'Access Denied'}`;
            resEl.className = 'text-xs font-mono p-2 rounded mt-2 border border-brand-danger text-brand-danger bg-brand-danger/10';
            showToast('Authorization Denied', 'error');
        }
    } catch (e) {
        if (e.message !== '401 Unauthorized') {
            resEl.textContent = '[ERROR] Gateway Communication Failed';
            resEl.className = 'text-xs font-mono p-2 rounded mt-2 border border-brand-warning text-brand-warning bg-brand-warning/10';
        }
    }
}

// --- UTILITIES ---

function startClock() {
    setInterval(() => {
        const now = new Date();
        const t = [now.getHours(), now.getMinutes(), now.getSeconds()]
            .map(n => n.toString().padStart(2, '0')).join(':');
        $('live-clock').textContent = t;
    }, 1000);
}

function showToast(msg, type = 'info') {
    const cont = $('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = msg;
    cont.appendChild(t);
    setTimeout(() => { if (t.parentElement) t.remove(); }, 5000);
}
