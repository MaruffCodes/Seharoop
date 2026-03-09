const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Generate unique patient ID
const generatePatientId = async () => {
  const lastPatient = await User.findOne().sort({ patientId: -1 });
  let nextId = 1;

  if (lastPatient && lastPatient.patientId) {
    nextId = parseInt(lastPatient.patientId) + 1;
  }

  return nextId.toString().padStart(5, '0');
};

// Generate unique doctor ID
const generateDoctorId = async () => {
  const lastDoctor = await Doctor.findOne().sort({ doctorId: -1 });
  let nextId = 1;

  if (lastDoctor && lastDoctor.doctorId) {
    const numericPart = lastDoctor.doctorId.replace('DR', '');
    nextId = parseInt(numericPart) + 1;
  }

  return `DR${nextId.toString().padStart(4, '0')}`;
};

// Patient Registration
router.post('/register/patient', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate patient ID and QR code
    const patientId = await generatePatientId();
    const qrCodeData = await QRCode.toDataURL(patientId);

    // Create new patient
    const patient = new User({
      name,
      email,
      password,
      patientId,
      qrCode: qrCodeData,
      role: 'patient',
      hasMedicalForm: false
    });

    await patient.save();

    // Generate token
    const token = generateToken(patient._id, 'patient');

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        token,
        user: {
          ...patient.toJSON(),
          hasMedicalForm: false
        },
        patientId
      }
    });

  } catch (error) {
    console.error('❌ Patient registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Doctor Registration
router.post('/register/doctor', async (req, res) => {
  try {
    const { name, email, password, specialization, qualification, experience } = req.body;

    // Validation
    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and specialization'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email already exists'
      });
    }

    // Generate doctor ID
    const doctorId = await generateDoctorId();

    // Create new doctor
    const doctor = new Doctor({
      name,
      email,
      password,
      specialization,
      qualification,
      experience: experience || 0,
      doctorId,
      role: 'doctor'
    });

    await doctor.save();

    // Generate token
    const token = generateToken(doctor._id, 'doctor');

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      data: {
        token,
        user: doctor.toJSON(),
        doctorId
      }
    });

  } catch (error) {
    console.error('❌ Doctor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Patient Login
router.post('/login/patient', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find patient
    const patient = await User.findOne({ email, role: 'patient' });
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await patient.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(patient._id, 'patient');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          ...patient.toJSON(),
          hasMedicalForm: patient.hasMedicalForm || false
        }
      }
    });

  } catch (error) {
    console.error('❌ Patient login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Doctor Login
router.post('/login/doctor', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find doctor
    const doctor = await Doctor.findOne({ email, role: 'doctor' });
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await doctor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(doctor._id, 'doctor');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: doctor.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Doctor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Logout endpoint
router.post('/logout', auth, async (req, res) => {
  try {
    // In a stateless JWT setup, we don't need to do anything server-side
    // The client will remove the token
    // For enhanced security, you could implement a token blacklist here

    console.log(`👋 User logged out: ${req.user._id} (${req.userRole})`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// Optional: Token refresh endpoint
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id, req.userRole);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
});

module.exports = router;