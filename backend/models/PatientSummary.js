const mongoose = require('mongoose');

const patientSummarySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // General summary
    generalSummary: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Cardiology summary
    cardiologySummary: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Orthopedic summary
    orthopedicSummary: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // SLM AI summaries
    slmSummaries: {
        general: { type: mongoose.Schema.Types.Mixed, default: null },
        cardiology: { type: mongoose.Schema.Types.Mixed, default: null },
        orthopedic: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    // Metadata
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    documentCount: {
        type: Number,
        default: 0
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    strict: false // Allow additional fields if needed
});

// Indexes for faster queries
patientSummarySchema.index({ patientId: 1 });
patientSummarySchema.index({ lastUpdated: -1 });

// Method to update all summaries at once
patientSummarySchema.methods.updateAllSummaries = async function (
    generalSummary,
    cardiologySummary,
    orthopedicSummary,
    slmSummaries
) {
    if (generalSummary) this.generalSummary = generalSummary;
    if (cardiologySummary) this.cardiologySummary = cardiologySummary;
    if (orthopedicSummary) this.orthopedicSummary = orthopedicSummary;
    if (slmSummaries) {
        this.slmSummaries = {
            ...this.slmSummaries,
            ...slmSummaries
        };
    }
    this.lastUpdated = new Date();
    this.version += 1;
    return this.save();
};

// Static method to find or create by patient ID
patientSummarySchema.statics.findOrCreate = async function (patientId) {
    let summary = await this.findOne({ patientId });
    if (!summary) {
        summary = new this({ patientId });
        await summary.save();
    }
    return summary;
};

module.exports = mongoose.model('PatientSummary', patientSummarySchema);