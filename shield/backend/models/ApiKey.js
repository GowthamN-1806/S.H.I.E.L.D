const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    keyId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    hashedKey: { type: String, required: true },
    prefix: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    partnerName: { type: String, required: true },
    scopes: {
        type: [String],
        default: [],
    },
    rateLimitPerMinute: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: null },
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

apiKeySchema.index({ hashedKey: 1 });
apiKeySchema.index({ userId: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);
