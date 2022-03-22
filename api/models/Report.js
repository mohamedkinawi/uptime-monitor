const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    owner_email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    tags: [String],
    count: { type: Number, default: 0 },
    status: Number,
    availability:{ type: Number, default: 0 },
    consecutive_outages: { type: Number, default: 0 },
    outages: { type: Number, default: 0 },
    downtime: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    history: [String]
});

module.exports = mongoose.model('Report',reportSchema);