# 🛡️ S.H.I.E.L.D — Secure Hybrid Infrastructure Enforcement & Logging Defense

> **Unified Urban Security Fabric for Smart City Infrastructure Protection**

A government-grade cybersecurity platform that protects smart city infrastructure through Zero Trust architecture, AI-powered anomaly detection, and immutable audit logging.

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Frontend   │────▶│   Backend    │────▶│  AI Service   │
│  React+Vite  │     │  Express.js  │     │   FastAPI +   │
│  Port 5173   │     │  Port 3000   │     │ IsolationForest│
└─────────────┘     └──────┬───────┘     │   Port 8000   │
                           │             └───────────────┘
                    ┌──────┴───────┐
                    │   MongoDB    │     ┌───────────────┐
                    │   Port 27017 │     │ Digital Twin  │
                    ├──────────────┤     │  Simulation   │
                    │    Redis     │     │   Port 3002   │
                    │   Port 6379  │     └───────────────┘
                    └──────────────┘
```

## 🚀 Quick Start

### Option 1 — Docker Compose (Recommended)

```bash
cd shield
cp .env.example .env
docker compose up --build
```

### Option 2 — Manual (Development)

**Prerequisites:** Node.js 20+, Python 3.12+, MongoDB 7+, Redis 7+

```bash
# 1. Backend
cd shield/backend
npm install
npm run seed      # Seeds 10 demo users + sample data
npm run dev

# 2. AI Service
cd shield/ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# 3. Digital Twin
cd shield/digital-twin
npm install
npm run dev

# 4. Frontend
cd shield/frontend
npm install
npm run dev
```

## 🔐 Demo Credentials

| Username | Role | Password |
|---|---|---|
| `alex.chen` | Super Admin | `Shield@2024!` |
| `priya.sharma` | City Admin | `Shield@2024!` |
| `marcus.webb` | Traffic Officer | `Shield@2024!` |
| `fatima.alhassan` | Water Operator | `Shield@2024!` |
| `james.okafor` | Power Controller | `Shield@2024!` |
| `sarah.kowalski` | Emergency Services | `Shield@2024!` |
| `raj.patel` | Maintenance | `Shield@2024!` |
| `emily.santos` | Citizen | `Shield@2024!` |
| `datastream.inc` | API Partner | `Shield@2024!` |
| `kai.nakamura` | Security Analyst | `Shield@2024!` |

**MFA Test Secret (TOTP):** `JBSWY3DPEHPK3PXP`

## 🎯 Hackathon Demo Flow

1. **Login** → `alex.chen / Shield@2024!` → Full SOC Dashboard
2. **Dashboard** → Live threat feed, city map, system health panels
3. **Click "🎯 SIMULATE ATTACK"** → Watch S.H.I.E.L.D detect and block in real time
4. **Digital Twin** → Run brute force simulation → See terminal-style attack visualization
5. **Audit Logs** → Click "Verify Chain" → Prove immutable log integrity
6. **Users** → View risk scores per operator → Lock/unlock accounts

## 📦 Seven Core Modules

| Module | Acronym | Purpose |
|---|---|---|
| Identity & Adaptive Auth | IAAL | MFA, risk-adaptive login, device fingerprinting |
| Hybrid Access Control | HACE | RBAC + ABAC policy engine |
| Secure API Gateway | SAPG | Rate limiting, threat detection per API call |
| AI Suspicious Activity Detection | SADE | Isolation Forest anomaly detection |
| Account Protection & Brute-Force Defense | APBDS | Progressive lockout, credential stuffing defense |
| Digital Twin Simulation | DTCDSP | City infrastructure simulation + attack runners |
| Immutable Monitoring & Logging | IMLCEL | SHA-256 hash-chained audit logs |

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` — Login with progressive lockout
- `POST /api/auth/verify-mfa` — TOTP MFA verification
- `POST /api/auth/refresh` — Token refresh with rotation
- `POST /api/auth/logout` — Logout with token blacklisting
- `GET  /api/auth/me` — Current user profile

### City Infrastructure (Protected)
- `GET  /api/city/traffic/status` — Traffic signals + congestion
- `GET  /api/city/water/status` — Flow rates, pressure, pH
- `GET  /api/city/power/status` — Grid load, voltage, sectors
- `GET  /api/city/emergency/incidents` — Active incidents

### Demo
- `POST /api/demo/trigger-attack` — Simulate credential stuffing attack
- `POST /api/demo/reset` — Reset all demo state

## 📡 Socket.IO Events

| Event | Description |
|---|---|
| `new_alert` | Security alert generated |
| `session_terminated` | Session forcefully ended |
| `system_status_update` | Periodic infrastructure health |
| `attack_simulation_event` | Digital Twin simulation progress |
| `risk_score_update` | User risk score changed |
| `demo_event` | Demo attack sequence step |

## 🧠 AI Service

- **Model:** Isolation Forest (scikit-learn)
- **Features:** 12 numeric features (time encoding, device trust, rate ratios, location distance, role sensitivity)
- **Auto-trains** on synthetic normal data at startup
- **Fallback:** Rule-based scoring when model unavailable

## 🛡️ Security Features

- bcrypt password hashing (salt rounds: 12)
- JWT with 15-minute expiry + refresh token rotation
- Redis-backed token blacklisting
- Progressive account lockout (5→15min, 8→60min, 10+→indefinite)
- SHA-256 hash-chained immutable audit logs
- RBAC + ABAC policy enforcement
- Rate limiting on all endpoints
- Helmet.js security headers + CORS

---

**Built for the Smart City Cybersecurity Hackathon** 🏆
