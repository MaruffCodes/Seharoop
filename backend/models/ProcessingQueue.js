const mongoose = require('mongoose');

const processingQueueSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },

    // Queue status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    attempts: {
        type: Number,
        default: 0
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    startedAt: Date,
    completedAt: Date,
    failedAt: Date,

    // Results
    result: mongoose.Schema.Types.Mixed,
    errorMessage: String
});

// Indexes
processingQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });
processingQueueSchema.index({ userId: 1 });
processingQueueSchema.index({ fileId: 1 });

module.exports = mongoose.model('ProcessingQueue', processingQueueSchema);