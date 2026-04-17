// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const doctorSchema = new mongoose.Schema({
//   role: {
//     type: String,
//     enum: ['doctor'],
//     default: 'doctor',
//     required: true
//   },
//   doctorId: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6
//   },
//   specialization: {
//     type: String,
//     required: true
//   },
//   qualification: {
//     type: String
//   },
//   experience: {
//     type: Number,
//     default: 0
//   },
//   licenseNumber: {
//     type: String
//   },
//   phone: {
//     type: String
//   },
//   address: {
//     clinic: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: { type: String, default: 'India' }
//   },
//   consultationFee: {
//     type: Number,
//     default: 0
//   },
//   availability: [{
//     day: {
//       type: String,
//       enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
//     },
//     slots: [{
//       startTime: String,
//       endTime: String,
//       isAvailable: { type: Boolean, default: true }
//     }]
//   }],
//   patients: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }],
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   lastLogin: Date
// }, { timestamps: true });

// // 🔐 Hash password before saving
// doctorSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // 🔐 Compare password
// doctorSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // 🚫 Remove password from output
// doctorSchema.methods.toJSON = function () {
//   const doctorObject = this.toObject();
//   delete doctorObject.password;
//   return doctorObject;
// };

// // Generate doctor ID if not provided
// doctorSchema.pre('save', async function (next) {
//   if (!this.doctorId) {
//     const count = await mongoose.model('Doctor').countDocuments();
//     this.doctorId = `DR${(count + 1).toString().padStart(4, '0')}`;
//   }
//   next();
// });

// module.exports = mongoose.model('Doctor', doctorSchema);

//new

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  role: { type: String, enum: ['doctor'], default: 'doctor', required: true },
  doctorId: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  specialization: { type: String, required: true },
  qualification: { type: String, default: '' },
  experience: { type: Number, default: 0 },

  // ── Medical credentials ─────────────────────────────────────────────────
  licenseNumber: { type: String, default: '', trim: true },   // Registration Number from degree
  medicalCouncilId: { type: String, default: '', trim: true },   // MCI / State Council ID

  // ── Hospital / Clinic ───────────────────────────────────────────────────
  hospitalName: { type: String, default: '', trim: true },
  address: {
    clinic: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' },
  },

  phone: { type: String, default: '' },
  consultationFee: { type: Number, default: 0 },

  availability: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    slots: [{ startTime: String, endTime: String, isAvailable: { type: Boolean, default: true } }],
  }],

  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

// ── Password hashing ──────────────────────────────────────────────────────────
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});

// ── Auto-generate doctorId ────────────────────────────────────────────────────
doctorSchema.pre('save', async function (next) {
  if (!this.doctorId) {
    const count = await mongoose.model('Doctor').countDocuments();
    this.doctorId = `DR${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Doctor', doctorSchema);