const mongoose = require('mongoose');

// Define medication sub-schema for structured medication data
const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    purpose: { type: String, default: 'NA' },
    dosage: { type: String, default: 'NA' }
}, { _id: false });

// Define allergy sub-schema (to match Python output)
const allergySchema = new mongoose.Schema({
    name: { type: String, required: true },
    reaction: { type: String, default: '' },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], default: 'Moderate' }
}, { _id: false });

// Define blood thinner sub-schema (FIXED)
const bloodThinnerSchema = new mongoose.Schema({
    name: { type: String, default: 'NA' },
    type: { type: String, default: 'NA' },
    duration: { type: String, default: 'NA' },
    reason: { type: String, default: 'NA' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' }
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
    allergies: [allergySchema],
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

    // Structured fields from new extractor
    comorbidConditions: [allergySchema],
    chronicDiseases: [allergySchema],
    pastSurgeries: [{
        name: String,
        date: String,
        hospital: String,
        surgeon: String,
        indication: String,
        _id: false
    }],
    majorIllnesses: [{
        name: String,
        date: String,
        hospital: String,
        notes: String,
        _id: false
    }],
    interventions: [{
        name: String,
        date: String,
        hospital: String,
        outcome: String,
        _id: false
    }],
    // FIXED: bloodThinner now uses proper sub-schema
    bloodThinner: [bloodThinnerSchema],
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        alternatePhone: String,
        _id: false
    },
    parsedMedicalHistory: [{
        year: String,
        month: String,
        day: Number,
        type: String,
        description: String,
        _id: false
    }],

    // SLM Generated Summaries - Mixed type to accept objects
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
        // Fix medications
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

        // Fix allergies
        if (!Array.isArray(this.allergies)) {
            this.allergies = [];
        }

        this.allergies = this.allergies.map(allergy => {
            if (allergy && typeof allergy === 'object') {
                return {
                    name: allergy.name || 'Unknown Allergy',
                    reaction: allergy.reaction || '',
                    severity: allergy.severity || 'Moderate'
                };
            }
            if (typeof allergy === 'string') {
                return {
                    name: allergy,
                    reaction: '',
                    severity: 'Moderate'
                };
            }
            return {
                name: 'Unknown Allergy',
                reaction: '',
                severity: 'Moderate'
            };
        });

        // FIXED: Ensure bloodThinner is properly formatted as array of objects
        if (!Array.isArray(this.bloodThinner)) {
            this.bloodThinner = [];
        }

        this.bloodThinner = this.bloodThinner.map(bt => {
            // If bt is already an object, ensure it has the right structure
            if (bt && typeof bt === 'object') {
                return {
                    name: bt.name || bt.medication_name || 'NA',
                    type: bt.type || 'NA',
                    duration: bt.duration || 'NA',
                    reason: bt.reason || 'NA',
                    startDate: bt.startDate || '',
                    endDate: bt.endDate || ''
                };
            }
            // If bt is a string, create a proper object
            if (typeof bt === 'string') {
                return {
                    name: bt,
                    type: 'NA',
                    duration: 'NA',
                    reason: 'NA',
                    startDate: '',
                    endDate: ''
                };
            }
            // Default case
            return {
                name: 'NA',
                type: 'NA',
                duration: 'NA',
                reason: 'NA',
                startDate: '',
                endDate: ''
            };
        });

        // Fix comorbidConditions and chronicDiseases
        const fixConditionArray = (arr) => {
            if (!Array.isArray(arr)) return [];
            return arr.map(item => {
                if (item && typeof item === 'object') {
                    return { name: item.name || 'Unknown' };
                }
                if (typeof item === 'string') {
                    return { name: item };
                }
                return { name: 'Unknown' };
            });
        };

        this.comorbidConditions = fixConditionArray(this.comorbidConditions);
        this.chronicDiseases = fixConditionArray(this.chronicDiseases);

        next();
    } catch (error) {
        console.error('Pre-save error:', error);
        next(error);
    }
});

// Pre-validate middleware for debugging
processedDocumentSchema.pre('validate', function (next) {
    if (this.medications && this.medications.length > 0) {
        console.log(`📊 Pre-validate: Processing ${this.medications.length} medications`);
    }
    if (this.bloodThinner && this.bloodThinner.length > 0) {
        console.log(`📊 Pre-validate: Processing ${this.bloodThinner.length} blood thinners`);
        // Log first blood thinner for debugging
        console.log(`📊 First blood thinner:`, JSON.stringify(this.bloodThinner[0]));
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
        if (ret.allergies) {
            ret.allergies = ret.allergies.map(a => ({ name: a.name, reaction: a.reaction, severity: a.severity }));
        }
        if (ret.bloodThinner) {
            ret.bloodThinner = ret.bloodThinner.map(bt => ({
                name: bt.name,
                type: bt.type,
                duration: bt.duration,
                reason: bt.reason
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