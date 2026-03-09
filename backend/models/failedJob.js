const mongoose = require('mongoose');

const failedJobSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProcessingQueue',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    error: {
        type: String,
        required: true
    },
    stackTrace: String,
    failedAt: {
        type: Date,
        default: Date.now
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedAt: Date,
    resolvedBy: String,
    notes: String
}, {
    timestamps: true
});

// Index for querying
failedJobSchema.index({ userId: 1, failedAt: -1 });
failedJobSchema.index({ resolved: 1 });

module.exports = mongoose.model('FailedJob', failedJobSchema);