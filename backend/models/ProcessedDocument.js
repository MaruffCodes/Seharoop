const mongoose = require('mongoose');

// Define medication sub-schema for structured medication data
const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    purpose: { type: String, default: 'NA' },
    dosage: { type: String, default: 'NA' }
}, { _id: false });

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

    // Extracted medical data
    diagnoses: [{
        type: String,
        default: []
    }],
    medications: [medicationSchema],
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

    // SLM Generated Summaries - Changed to Mixed type to accept objects
    slmSummaries: {
        general: { type: mongoose.Schema.Types.Mixed, default: null },
        cardiology: { type: mongoose.Schema.Types.Mixed, default: null },
        orthopedic: { type: mongoose.Schema.Types.Mixed, default: null }
    },

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
        slmGenerated: Boolean,
        _id: false
    }
}, {
    timestamps: true,
    strict: false
});

// Pre-save middleware to ensure medications are properly formatted
processedDocumentSchema.pre('save', function (next) {
    try {
        if (!Array.isArray(this.medications)) {
            this.medications = [];
        }

        this.medications = this.medications.map(med => {
            if (med && typeof med === 'object') {
                return {
                    name: med.name || 'Unknown Medication',
                    purpose: med.purpose || 'NA',
                    dosage: med.dosage || 'NA'
                };
            }
            if (typeof med === 'string') {
                return {
                    name: med || 'Unknown Medication',
                    purpose: 'NA',
                    dosage: 'NA'
                };
            }
            return {
                name: 'Unknown Medication',
                purpose: 'NA',
                dosage: 'NA'
            };
        });

        next();
    } catch (error) {
        next(error);
    }
});

processedDocumentSchema.pre('validate', function (next) {
    if (this.medications && this.medications.length > 0) {
        console.log(`📊 Pre-validate: Processing ${this.medications.length} medications`);
    }
    next();
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

processedDocumentSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        if (ret.medications) {
            ret.medications = ret.medications.map(med => ({
                name: med.name,
                purpose: med.purpose,
                dosage: med.dosage
            }));
        }
        return ret;
    }
});

processedDocumentSchema.set('toObject', { virtuals: true });

// Static method to find documents by user ID
processedDocumentSchema.statics.findByUserId = function (userId) {
    return this.find({ userId }).sort({ processedAt: -1 });
};

// Static method to find recent documents
processedDocumentSchema.statics.findRecent = function (userId, limit = 10) {
    return this.find({ userId })
        .sort({ processedAt: -1 })
        .limit(limit);
};

module.exports = mongoose.model('ProcessedDocument', processedDocumentSchema);