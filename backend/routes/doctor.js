const express = require('express');
const router = express.Router();
const { auth, isDoctor } = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');
const summaryGenerator = require('../services/summaryGenerator');

// Get doctor profile
router.get('/profile', auth, isDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update doctor profile
router.put('/profile', auth, isDoctor, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.role;
    delete updates.doctorId;

    const doctor = await Doctor.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Search patient by ID, name, or email
router.get('/patient/search', auth, isDoctor, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const patients = await User.find({
      role: 'patient',
      $or: [
        { patientId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('name patientId email bloodGroup qrCode phone address');

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient by QR code data
router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
  try {
    const { qrData } = req.params;

    // Try to parse QR data (could be patientId or JSON)
    let patientId;
    try {
      const parsed = JSON.parse(qrData);
      patientId = parsed.patientId;
    } catch {
      patientId = qrData; // Assume it's the patientId directly
    }

    const patient = await User.findOne({
      patientId,
      role: 'patient'
    }).select('name patientId email bloodGroup qrCode phone address');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Add this patient to doctor's list if not already there
    await Doctor.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { patients: patient._id } }
    );

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient by QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient general summary for doctor
router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOne({
      patientId,
      role: 'patient'
    }).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalForm = await PatientMedicalForm.findOne({
      patientId: patient._id
    });

    const recentDocs = await ProcessedDocument.find({ userId: patient._id })
      .sort({ processedAt: -1 })
      .limit(50);

    // Generate general summary
    const generalSummary = summaryGenerator.generateGeneralSummary(patient, medicalForm, recentDocs);

    res.json({
      success: true,
      data: generalSummary
    });
  } catch (error) {
    console.error('Get patient summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient cardiology summary for doctor
router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOne({
      patientId,
      role: 'patient'
    }).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalForm = await PatientMedicalForm.findOne({
      patientId: patient._id
    });

    const recentDocs = await ProcessedDocument.find({ userId: patient._id })
      .sort({ processedAt: -1 })
      .limit(50);

    // Generate cardiology summary
    const cardiologySummary = summaryGenerator.generateCardiologySummary(patient, medicalForm, recentDocs);

    res.json({
      success: true,
      data: cardiologySummary
    });
  } catch (error) {
    console.error('Get cardiology summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient orthopedic summary for doctor
router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOne({
      patientId,
      role: 'patient'
    }).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalForm = await PatientMedicalForm.findOne({
      patientId: patient._id
    });

    const recentDocs = await ProcessedDocument.find({ userId: patient._id })
      .sort({ processedAt: -1 })
      .limit(50);

    // Generate orthopedic summary
    const orthopedicSummary = summaryGenerator.generateOrthopedicSummary(patient, medicalForm, recentDocs);

    res.json({
      success: true,
      data: orthopedicSummary
    });
  } catch (error) {
    console.error('Get orthopedic summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient timeline
router.get('/patient/:patientId/timeline', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOne({
      patientId,
      role: 'patient'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalForm = await PatientMedicalForm.findOne({
      patientId: patient._id
    });

    const timeline = [];

    // Add medical records from patient history
    if (patient.medicalHistory) {
      patient.medicalHistory.forEach(yearData => {
        yearData.months?.forEach(monthData => {
          monthData.records?.forEach(record => {
            timeline.push({
              date: record.date,
              type: record.type,
              title: record.description,
              description: `${monthData.month} ${yearData.year}`,
              source: 'medical_record'
            });
          });
        });
      });
    }

    // Add medical form creation to timeline
    if (medicalForm?.createdAt) {
      timeline.push({
        date: medicalForm.createdAt,
        type: 'form_creation',
        title: 'Medical Form Created',
        description: 'Initial medical information recorded',
        source: 'medical_form'
      });
    }

    // Add form updates to timeline
    if (medicalForm?.completionStatus?.lastUpdated) {
      timeline.push({
        date: medicalForm.completionStatus.lastUpdated,
        type: 'form_update',
        title: 'Medical Form Updated',
        description: 'Medical information was updated',
        source: 'medical_form'
      });
    }

    // Sort by date (newest first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get patient timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get doctor's patient list
router.get('/patients', auth, isDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id)
      .populate('patients', 'name patientId bloodGroup email phone');

    res.json({
      success: true,
      data: doctor?.patients || []
    });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;