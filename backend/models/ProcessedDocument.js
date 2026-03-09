const mongoose = require('mongoose');

const processedDocumentSchema = new mongoose.Schema({
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
    extractedText: {
        type: String,
        default: ''
    },

    // Extracted medical data - make sure these are arrays with defaults
    diagnoses: [{
        type: String,
        default: []
    }],
    medications: [{
        type: String,
        default: []
    }],
    labResults: [{
        type: String,
        default: []
    }],
    allergies: [{
        type: String,
        default: []
    }],
    dates: [{
        text: String,
        normalized: String,
        _id: false
    }],
    doctors: [{
        type: String,
        default: []
    }],
    hospitals: [{
        type: String,
        default: []
    }],

    // Entities extracted
    entities: [{
        type: { type: String },
        value: String,
        _id: false
    }],

    // Vitals as a Map (more flexible)
    vitals: {
        type: Map,
        of: String,
        default: {}
    },

    // Summary
    summary: {
        type: String,
        default: ''
    },

    // Confidence scores
    confidence: {
        textLength: { type: Number, default: 0 },
        entityCount: { type: Number, default: 0 },
        overall: { type: Number, default: 0 }
    },

    // Processing metadata
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    processingStartedAt: Date,
    processedAt: Date,
    errorMessage: String,

    // Additional metadata
    metadata: {
        fileName: String,
        fileType: String,
        fileSize: Number,
        processingDate: Date,
        textLength: Number,
        ocrConfidence: Number,
        _id: false
    }
}, {
    timestamps: true,
    strict: false // Allow additional fields if needed
});

// Indexes for faster queries
processedDocumentSchema.index({ userId: 1, processedAt: -1 });
processedDocumentSchema.index({ fileId: 1 });
processedDocumentSchema.index({ processingStatus: 1 });

// Virtual for document URL
processedDocumentSchema.virtual('documentUrl').get(function () {
    const ext = this.fileName ? this.fileName.split('.').pop() : '';
    return `/uploads/${this.fileId}.${ext}`;
});

// Ensure virtuals are included in JSON
processedDocumentSchema.set('toJSON', { virtuals: true });
processedDocumentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProcessedDocument', processedDocumentSchema);