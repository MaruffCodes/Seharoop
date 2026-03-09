const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const medicalHistorySchema = new mongoose.Schema({
  year: { type: String, required: true },
  months: [{
    month: { type: String, required: true },
    records: [{
      date: { type: Date, required: true },
      description: { type: String, required: true },
      type: {
        type: String,
        enum: ['lab', 'imaging', 'exam', 'prescription', 'surgery', 'consultation'],
        required: true
      },
      documents: [{
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadDate: { type: Date, default: Date.now }
      }],
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
      }
    }]
  }]
});

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['patient'],
    default: 'patient',
    required: true
  },
  patientId: { type: String, unique: true, required: true },
  qrCode: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null
  },
  hasMedicalForm: { type: Boolean, default: false }, // Add this field

  // Existing fields
  isDiabetic: { type: Boolean, default: false },
  diabetesType: {
    type: String,
    enum: ['Type 1', 'Type 2', 'Gestational', null],
    default: null
  },
  hasThyroid: { type: Boolean, default: false },
  thyroidCondition: {
    type: String,
    enum: ['Hypothyroid', 'Hyperthyroid', 'Goiter', null],
    default: null
  },

  pastSurgeries: [{
    surgery: String,
    date: Date,
    hospital: String,
    surgeon: String
  }],

  medicalHistory: [medicalHistorySchema],

  medicationAllergies: [{ type: String }],
  comorbidConditions: [{ type: String }],
  chronicDiseases: [{ type: String }],
  previousInterventions: [{
    name: String,
    date: Date,
    hospital: String
  }],
  majorSurgeriesOrIllness: [{
    name: String,
    date: Date,
    hospital: String,
    notes: String
  }],
  currentMedications: [{
    name: String,
    for: String,
    dosage: String
  }],
  bloodThinnerHistory: [{
    name: String,
    type: { type: String },
    duration: String,
    reason: String
  }],

  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  }
}, { timestamps: true });

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 🚫 Remove password from output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);