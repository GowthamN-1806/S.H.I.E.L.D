require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json()); // Parse incoming JSON payloads

// Health Check Route (To verify the gateway is alive)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Online', service: 'S.H.I.E.L.D Gateway' });
});

// Authentication Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Infrastructure API Routes (Protected)
app.use('/api/traffic', require('./routes/trafficRoutes'));
app.use('/api/water', require('./routes/waterRoutes'));
app.use('/api/power', require('./routes/powerRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));

// Admin & Governance Routes (Protected)
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🛡️ S.H.I.E.L.D. API Gateway Active on port ${PORT}`);
});
