const axios = require('axios');
const { calculateRiskScore, buildEventFromRequest } = require('./riskScoring');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const analyzeEvent = async (eventData) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/analyze`, eventData, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' },
        });
        return response.data;
    } catch (err) {
        console.warn('[ANOMALY] AI service unavailable, falling back to rule-based scoring:', err.message);
        const ruleResult = calculateRiskScore(eventData);
        return {
            risk_score: ruleResult.score,
            anomaly_detected: ruleResult.score > 50,
            anomaly_type: ruleResult.level,
            confidence: 0.7,
            explanation: `Rule-based fallback: ${ruleResult.factors.map(f => f.factor).join(', ')}`,
            factors: ruleResult.factors,
            recommendation: ruleResult.recommendation,
            source: 'rule_engine',
        };
    }
};

const trainModel = async (trainingData) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/train`, { events: trainingData }, {
            timeout: 30000,
        });
        return response.data;
    } catch (err) {
        console.warn('[ANOMALY] AI training unavailable:', err.message);
        return { status: 'unavailable', message: err.message };
    }
};

module.exports = { analyzeEvent, trainModel };
