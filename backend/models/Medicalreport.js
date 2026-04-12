const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileId: {
        type: String,
        required: true,
        unique: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    // e.g. "KFT", "LFT", "CBC", "Lipid Profile", "Other"
    reportCategory: {
        type: String,
        default: 'Other',
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    // permanent storage path (after move from temp)
    filePath: {
        type: String,
        default: '',
    },
    notes: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

medicalReportSchema.index({ userId: 1, uploadedAt: -1 });
medicalReportSchema.index({ fileId: 1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);