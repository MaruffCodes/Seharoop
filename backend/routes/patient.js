const express = require('express');
const router = express.Router();
const { auth, isPatient } = require('../middleware/auth');
const User = require('../models/User');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');
const QRCode = require('qrcode');

// Get patient profile
router.get('/profile', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if medical form exists
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

    res.json({
      success: true,
      data: {
        ...patient.toObject(),
        hasMedicalForm: !!medicalForm,
        medicalFormStatus: medicalForm?.completionStatus
      }
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update patient profile
router.put('/profile', auth, isPatient, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.role;
    delete updates.patientId;

    const patient = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient history/timeline
router.get('/history', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id)
      .select('medicalHistory name patientId');

    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

    const timeline = [];

    if (medicalForm?.completionStatus?.completionDate) {
      timeline.push({
        date: medicalForm.completionStatus.completionDate,
        type: 'form_submission',
        title: 'Medical Form Completed',
        description: 'Initial medical information submitted',
        data: medicalForm
      });
    }

    if (patient?.medicalHistory) {
      patient.medicalHistory.forEach(yearData => {
        yearData.months?.forEach(monthData => {
          monthData.records?.forEach(record => {
            timeline.push({
              date: record.date,
              type: record.type,
              title: record.description,
              description: `${monthData.month} ${yearData.year}`,
              documents: record.documents,
              data: record
            });
          });
        });
      });
    }

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient summary (for QR code)
router.get('/summary', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const recentDocs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .limit(10);

    // Collect all diagnoses, medications, allergies from processed docs
    const allDiagnoses = new Set();
    const allMedications = new Set();
    const allAllergies = new Set();

    recentDocs.forEach(doc => {
      doc.diagnoses?.forEach(d => allDiagnoses.add(d));
      doc.medications?.forEach(m => allMedications.add(m));
      doc.allergies?.forEach(a => allAllergies.add(a));
    });

    const summary = {
      patientInfo: {
        name: patient.name,
        patientId: patient.patientId,
        bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup,
        age: medicalForm?.personalInfo?.dateOfBirth
          ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
          : null,
        gender: medicalForm?.personalInfo?.gender
      },
      emergencyContact: medicalForm?.emergencyContact || patient.emergencyContact,
      criticalInfo: {
        allergies: Array.from(allAllergies),
        medicationAllergies: medicalForm?.medicalConditions?.medicationAllergies || [],
        chronicConditions: medicalForm?.medicalConditions?.chronicDiseases || [],
        bloodThinners: medicalForm?.medications?.bloodThinnerHistory || []
      },
      currentMedications: Array.from(allMedications),
      diagnoses: Array.from(allDiagnoses),
      pastSurgeries: medicalForm?.surgicalHistory?.pastSurgeries || [],
      documentCount: recentDocs.length,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get patient summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update patient QR code with rich medical data
router.post('/refresh-qr', auth, isPatient, async (req, res) => {
  try {
    // Get patient data with all medical information
    const patient = await User.findById(req.user._id).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const recentDocs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .limit(20);

    // Collect all medical data
    const allDiagnoses = new Set();
    const allMedications = new Set();
    const allAllergies = new Set();
    const allLabResults = new Set();

    recentDocs.forEach(doc => {
      doc.diagnoses?.forEach(d => allDiagnoses.add(d));
      doc.medications?.forEach(m => allMedications.add(m));
      doc.allergies?.forEach(a => allAllergies.add(a));
      doc.labResults?.forEach(l => allLabResults.add(l));
    });

    // Create comprehensive QR data
    const qrData = {
      patientId: patient.patientId,
      name: patient.name,
      bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'Unknown',
      lastUpdated: new Date().toISOString(),
      stats: {
        documents: recentDocs.length,
        diagnoses: Array.from(allDiagnoses).slice(0, 10),
        medications: Array.from(allMedications).slice(0, 10),
        allergies: Array.from(allAllergies),
        labResults: Array.from(allLabResults).slice(0, 5)
      },
      emergencyContact: medicalForm?.emergencyContact || null,
      criticalInfo: {
        allergies: Array.from(allAllergies),
        chronicConditions: medicalForm?.medicalConditions?.chronicDiseases || []
      }
    };

    // Generate QR code with rich data
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData, null, 0));

    // Update user with new QR code
    const patient_updated = await User.findByIdAndUpdate(
      req.user._id,
      { qrCode },
      { new: true }
    ).select('-password');

    console.log('✅ QR code refreshed with medical data');

    res.json({
      success: true,
      message: 'QR code refreshed successfully',
      data: {
        qrCode: patient_updated.qrCode,
        summary: qrData
      }
    });
  } catch (error) {
    console.error('Refresh QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get cardiology summary
router.get('/summary/cardiology', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const recentDocs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .limit(50);

    const summaryGenerator = require('../services/summaryGenerator');
    const cardiologySummary = summaryGenerator.generateCardiologySummary(
      patient,
      medicalForm,
      recentDocs
    );

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

// Get orthopedic summary
router.get('/summary/orthopedic', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const recentDocs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .limit(50);

    const summaryGenerator = require('../services/summaryGenerator');
    const orthopedicSummary = summaryGenerator.generateOrthopedicSummary(
      patient,
      medicalForm,
      recentDocs
    );

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

// Get QR code for specific specialty
router.post('/qr/:specialty', auth, isPatient, async (req, res) => {
  try {
    const { specialty } = req.params;
    const QRCode = require('qrcode');

    const patient = await User.findById(req.user._id).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const recentDocs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .limit(50);

    const summaryGenerator = require('../services/summaryGenerator');
    let summary;

    switch (specialty) {
      case 'cardiology':
        summary = summaryGenerator.generateCardiologySummary(patient, medicalForm, recentDocs);
        break;
      case 'orthopedic':
        summary = summaryGenerator.generateOrthopedicSummary(patient, medicalForm, recentDocs);
        break;
      default:
        summary = summaryGenerator.generateGeneralSummary(patient, medicalForm, recentDocs);
    }

    // Add metadata
    summary.specialty = specialty;
    summary.generatedFor = specialty === 'general' ? 'All Doctors' : `${specialty} Specialist`;

    const qrCode = await QRCode.toDataURL(JSON.stringify(summary));

    res.json({
      success: true,
      data: {
        qrCode,
        summary,
        specialty
      }
    });
  } catch (error) {
    console.error('Generate specialty QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;