const mongoose = require('mongoose');

const medicalFormSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal Information
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', '']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    }
  },

  // Medical Conditions
  medicalConditions: {
    isDiabetic: { type: Boolean, default: false },
    diabetesType: {
      type: String,
      enum: ['Type 1', 'Type 2', 'Gestational', 'Pre-diabetic', null]
    },
    hasThyroid: { type: Boolean, default: false },
    thyroidCondition: {
      type: String,
      enum: ['Hypothyroid', 'Hyperthyroid', 'Goiter', 'Thyroid Nodules', null]
    },
    comorbidConditions: [String],
    chronicDiseases: [String],
    medicationAllergies: [{
      medication: String,
      reaction: String,
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe', '']
      }
    }]
  },

  // Medications
  medications: {
    currentMedications: [{
      name: String,
      dosage: String,
      frequency: String,
      isActive: { type: Boolean, default: true }
    }],
    bloodThinnerHistory: [{
      name: String,
      type: String,
      duration: String,
      reason: String
    }]
  },

  // Surgical History
  surgicalHistory: {
    pastSurgeries: [{
      surgery: String,
      date: Date,
      hospital: String,
      surgeon: String
    }],
    majorIllnesses: [{
      illness: String,
      year: String,
      hospital: String,
      notes: String
    }],
    previousInterventions: [{
      name: String,
      date: Date,
      hospital: String
    }]
  },

  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  // Form completion tracking
  completionStatus: {
    isComplete: { type: Boolean, default: false },
    completionDate: Date,
    lastUpdated: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Index for faster queries
medicalFormSchema.index({ patientId: 1 });

module.exports = mongoose.model('PatientMedicalForm', medicalFormSchema);