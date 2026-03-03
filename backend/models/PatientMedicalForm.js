const mongoose = require('mongoose');

const PatientMedicalFormSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medicationAllergy: {
    type: String,
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  coMorbidCondition: {
    diabetes: { type: Boolean, required: true },
    diabetesType: { type: String },
    hypertension: { type: Boolean, required: true },
    asthma: { type: Boolean, required: true },
    thyroid: { type: Boolean, required: true },
  },
  previousIntervention: {
    type: String,
    required: true,
  },
  majorSurgeries: {
    type: String,
    required: true,
  },
  currentMedication: {
    type: String,
    required: true,
  },
  bloodThinner: {
    type: Boolean,
    required: true,
  },
  bloodThinnerDetails: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('PatientMedicalForm', PatientMedicalFormSchema);