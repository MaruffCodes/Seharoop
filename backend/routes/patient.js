const express = require('express');
const router = express.Router();
const { auth, isPatient } = require('../middleware/auth');
const User = require('../models/User');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');
const PatientSummary = require('../models/PatientSummary');
const QRCode = require('qrcode');
const summaryGenerator = require('../services/summaryGenerator');

// Helper function to optimize summary for QR code
function optimizeSummaryForQR(summary, specialty) {
  if (!summary) return { error: 'No summary data' };

  try {
    // Create a minimal version of the summary for QR code
    const optimized = {
      pid: summary.patientDemographics?.patientId || summary.patientInfo?.patientId,
      n: summary.patientDemographics?.name || summary.patientInfo?.name,
      bg: summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup,
      lu: new Date().toISOString().split('T')[0], // Just date, not full timestamp
      type: specialty
    };

    // Add minimal medical data based on specialty
    if (specialty === 'general') {
      optimized.dx = (summary.diagnoses || []).slice(0, 5);
      optimized.rx = (summary.currentMedications || []).slice(0, 5);
      optimized.alg = (summary.allergies || []).map(a => typeof a === 'string' ? a : a.name).slice(0, 5);
    } else if (specialty === 'cardiology') {
      optimized.cdx = (summary.cardiacDiagnoses || []).slice(0, 5);
      optimized.crx = (summary.cardiacMedications || []).slice(0, 5);
      if (summary.vitals) {
        optimized.v = {
          bp: summary.vitals.bloodPressure,
          hr: summary.vitals.heartRate
        };
      }
    } else if (specialty === 'orthopedic') {
      optimized.odx = (summary.orthopedicDiagnoses || []).slice(0, 5);
      optimized.om = (summary.orthopedicMedications || []).slice(0, 5);
      optimized.ms = summary.mobilityStatus;
    }

    return optimized;
  } catch (error) {
    console.error('Error optimizing summary for QR:', error);
    return { error: 'Failed to optimize summary' };
  }
}

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
// Update patient profile
router.put('/profile', auth, isPatient, async (req, res) => {
  try {
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.password;
    delete updates.role;
    delete updates.patientId;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Handle empty strings for enum fields
    if (updates.gender === '') {
      updates.gender = null;
    }
    if (updates.bloodGroup === '') {
      updates.bloodGroup = null;
    }
    if (updates.diabetesType === '') {
      updates.diabetesType = null;
    }
    if (updates.thyroidCondition === '') {
      updates.thyroidCondition = null;
    }

    // Handle address object if present
    if (updates.address) {
      Object.keys(updates.address).forEach(key => {
        if (updates.address[key] === '') {
          updates.address[key] = null;
        }
      });
    }

    const patient = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Refresh QR code after profile update
    try {
      const QRCode = require('qrcode');
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

      const qrData = {
        pid: patient.patientId,
        n: patient.name,
        bg: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'U',
        lu: new Date().toISOString().split('T')[0]
      };

      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
      patient.qrCode = qrCode;
      await patient.save();
    } catch (qrError) {
      console.log('QR refresh after profile update failed:', qrError.message);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
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

// Get all summaries for patient (consolidated endpoint)
router.get('/summaries', auth, isPatient, async (req, res) => {
  try {
    let patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

    if (!patientSummary) {
      // Generate fresh summaries if none exist
      console.log('📊 No cached summaries found, generating fresh ones...');
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const documents = await ProcessedDocument.find({ userId: req.user._id })
        .sort({ processedAt: -1 });

      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
        patient,
        medicalForm,
        documents
      );

      return res.json({
        success: true,
        data: newSummaries
      });
    }

    res.json({
      success: true,
      data: {
        general: patientSummary.generalSummary,
        cardiology: patientSummary.cardiologySummary,
        orthopedic: patientSummary.orthopedicSummary,
        slmSummaries: patientSummary.slmSummaries,
        lastUpdated: patientSummary.lastUpdated,
        documentCount: patientSummary.documentCount,
        version: patientSummary.version
      }
    });
  } catch (error) {
    console.error('Error getting summaries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient general summary
router.get('/summary', auth, isPatient, async (req, res) => {
  try {
    const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

    if (!patientSummary || !patientSummary.generalSummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id })
        .sort({ processedAt: -1 });

      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
        patient,
        medicalForm,
        allDocs
      );

      return res.json({
        success: true,
        data: newSummaries.general
      });
    }

    res.json({
      success: true,
      data: patientSummary.generalSummary
    });
  } catch (error) {
    console.error('Get patient summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get cardiology summary
router.get('/summary/cardiology', auth, isPatient, async (req, res) => {
  try {
    const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

    if (!patientSummary || !patientSummary.cardiologySummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id })
        .sort({ processedAt: -1 });

      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
        patient,
        medicalForm,
        allDocs
      );

      return res.json({
        success: true,
        data: newSummaries.cardiology
      });
    }

    res.json({
      success: true,
      data: patientSummary.cardiologySummary
    });
  } catch (error) {
    console.error('Get cardiology summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get orthopedic summary
router.get('/summary/orthopedic', auth, isPatient, async (req, res) => {
  try {
    const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

    if (!patientSummary || !patientSummary.orthopedicSummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id })
        .sort({ processedAt: -1 });

      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
        patient,
        medicalForm,
        allDocs
      );

      return res.json({
        success: true,
        data: newSummaries.orthopedic
      });
    }

    res.json({
      success: true,
      data: patientSummary.orthopedicSummary
    });
  } catch (error) {
    console.error('Get orthopedic summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all summaries at once (alias for /summaries)
router.get('/all-summaries', auth, isPatient, async (req, res) => {
  try {
    const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

    if (!patientSummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id })
        .sort({ processedAt: -1 });

      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
        patient,
        medicalForm,
        allDocs
      );

      return res.json({
        success: true,
        data: newSummaries
      });
    }

    res.json({
      success: true,
      data: {
        general: patientSummary.generalSummary,
        cardiology: patientSummary.cardiologySummary,
        orthopedic: patientSummary.orthopedicSummary,
        slmSummaries: patientSummary.slmSummaries
      }
    });
  } catch (error) {
    console.error('Get all summaries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Force refresh summaries
router.post('/refresh-summaries', auth, isPatient, async (req, res) => {
  try {
    console.log(`🔄 Force refreshing summaries for user: ${req.user._id}`);

    const patient = await User.findById(req.user._id);
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const allDocs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 });

    const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
      patient,
      medicalForm,
      allDocs
    );

    res.json({
      success: true,
      message: 'Summaries refreshed successfully',
      data: newSummaries
    });
  } catch (error) {
    console.error('Refresh summaries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update patient QR code with rich medical data
router.post('/refresh-qr', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const recentDocs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .limit(20);

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

    const qrData = {
      pid: patient.patientId,
      n: patient.name,
      bg: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'U',
      lu: new Date().toISOString().split('T')[0],
      stats: {
        d: recentDocs.length,
        dx: Array.from(allDiagnoses).slice(0, 5),
        rx: Array.from(allMedications).slice(0, 5),
        alg: Array.from(allAllergies).slice(0, 5)
      }
    };

    let qrCode;
    try {
      qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'L',
        margin: 1,
        width: 300
      });
    } catch (qrError) {
      console.log('QR too large, creating even smaller version');
      const smallerData = {
        pid: patient.patientId,
        n: patient.name.substring(0, 15),
        bg: patient.bloodGroup || 'U',
        lu: new Date().toISOString().split('T')[0],
        dc: recentDocs.length
      };
      qrCode = await QRCode.toDataURL(JSON.stringify(smallerData));
    }

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

// Get QR code for specific specialty
router.post('/qr/:specialty', auth, isPatient, async (req, res) => {
  try {
    const { specialty } = req.params;
    const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

    if (!patientSummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id })
        .sort({ processedAt: -1 });

      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
        patient,
        medicalForm,
        allDocs
      );

      let summary;
      switch (specialty) {
        case 'cardiology':
          summary = newSummaries.cardiology;
          break;
        case 'orthopedic':
          summary = newSummaries.orthopedic;
          break;
        default:
          summary = newSummaries.general;
      }

      const optimizedSummary = optimizeSummaryForQR(summary, specialty);

      const qrCode = await QRCode.toDataURL(JSON.stringify(optimizedSummary), {
        errorCorrectionLevel: 'L',
        margin: 1,
        width: 300
      });

      return res.json({
        success: true,
        data: { qrCode, summary: optimizedSummary, specialty }
      });
    }

    let summary;
    switch (specialty) {
      case 'cardiology':
        summary = patientSummary.cardiologySummary;
        break;
      case 'orthopedic':
        summary = patientSummary.orthopedicSummary;
        break;
      default:
        summary = patientSummary.generalSummary;
    }

    const optimizedSummary = optimizeSummaryForQR(summary, specialty);

    const qrCode = await QRCode.toDataURL(JSON.stringify(optimizedSummary), {
      errorCorrectionLevel: 'L',
      margin: 1,
      width: 300
    });

    res.json({
      success: true,
      data: {
        qrCode,
        summary: optimizedSummary,
        specialty
      }
    });
  } catch (error) {
    console.error('Generate specialty QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get patient's own SLM-generated summary
router.get('/slm-summary', auth, isPatient, async (req, res) => {
  req.setTimeout(120000); // Increase to 120 seconds

  try {
    const patientId = req.user._id;
    const patient = await User.findById(patientId).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId });

    const recentDocs = await ProcessedDocument.find({ userId: patientId })
      .sort({ processedAt: -1 })
      .limit(50);

    const patientData = {
      name: patient.name,
      patientId: patient.patientId,
      age: medicalForm?.personalInfo?.dateOfBirth
        ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
        : null,
      gender: medicalForm?.personalInfo?.gender || null,
      bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || null,
      email: patient.email,
      phone: medicalForm?.personalInfo?.phone || null,
      address: medicalForm?.personalInfo?.address ?
        `${medicalForm.personalInfo.address.street || ''}, ${medicalForm.personalInfo.address.city || ''}, ${medicalForm.personalInfo.address.state || ''} ${medicalForm.personalInfo.address.pincode || ''}`.trim() : null
    };

    const allDiagnoses = new Set();
    const allMedications = new Set();
    const allLabResults = new Set();
    const allAllergies = new Set();
    const allChronicDiseases = new Set();
    const allComorbidConditions = new Set();
    const allPastSurgeries = [];

    recentDocs.forEach(doc => {
      if (doc.diagnoses) doc.diagnoses.forEach(d => allDiagnoses.add(d));
      if (doc.medications) doc.medications.forEach(m => allMedications.add(m));
      if (doc.labResults) doc.labResults.forEach(l => allLabResults.add(l));
      if (doc.allergies) doc.allergies.forEach(a => allAllergies.add(a));
    });

    if (medicalForm) {
      if (medicalForm.medicalConditions?.chronicDiseases) {
        medicalForm.medicalConditions.chronicDiseases.forEach(d => allChronicDiseases.add(d));
      }
      if (medicalForm.medicalConditions?.comorbidConditions) {
        medicalForm.medicalConditions.comorbidConditions.forEach(c => allComorbidConditions.add(c));
      }
      if (medicalForm.medicalConditions?.medicationAllergies) {
        medicalForm.medicalConditions.medicationAllergies.forEach(a => allAllergies.add(a.medication));
      }
      if (medicalForm.surgicalHistory?.pastSurgeries) {
        medicalForm.surgicalHistory.pastSurgeries.forEach(s => {
          allPastSurgeries.push({
            name: s.surgery,
            date: s.date ? new Date(s.date).toLocaleDateString() : null,
            hospital: s.hospital
          });
        });
      }
    }

    const extractedData = {
      diagnoses: Array.from(allDiagnoses),
      medications: Array.from(allMedications),
      labResults: Array.from(allLabResults),
      allergies: Array.from(allAllergies),
      chronicDiseases: Array.from(allChronicDiseases),
      comorbidConditions: Array.from(allComorbidConditions),
      pastSurgeries: allPastSurgeries
    };

    const slmClient = require('../services/slmClient');

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SLM generation timeout')), 110000);
    });

    const slmSummary = await Promise.race([
      slmClient.generateSummary(patientData, extractedData, 'general'),
      timeoutPromise
    ]);

    res.json({
      success: true,
      data: slmSummary
    });

  } catch (error) {
    console.error('Error generating SLM summary:', error);

    res.json({
      success: true,
      data: {
        success: false,
        summary: "AI summary generation is taking longer than expected. Please try again in a few moments.",
        type: "general",
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;