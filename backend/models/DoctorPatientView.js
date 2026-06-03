const mongoose = require('mongoose');

const doctorPatientViewSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientUniqueId: {
        type: String,
        required: true
    },
    lastViewedAt: {
        type: Date,
        default: Date.now
    },
    viewCount: {
        type: Number,
        default: 1
    },
    firstViewedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index to ensure unique doctor-patient pairs
doctorPatientViewSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('DoctorPatientView', doctorPatientViewSchema);