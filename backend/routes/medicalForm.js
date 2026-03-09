const express = require('express');
const router = express.Router();
const { auth, isPatient } = require('../middleware/auth');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const User = require('../models/User');

// Submit medical form (first login or update)
router.post('/submit', auth, isPatient, async (req, res) => {
  try {
    const patientId = req.user._id;

    console.log('📝 Submitting medical form for patient:', patientId);
    console.log('Form data received keys:', Object.keys(req.body));

    // Validate required fields
    if (!req.body.personalInfo || !req.body.personalInfo.bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Blood group is required'
      });
    }

    // Check if form already exists
    let medicalForm = await PatientMedicalForm.findOne({ patientId });

    // Prepare the form data with proper structure
    const formData = {
      patientId,
      personalInfo: {
        fullName: req.body.personalInfo?.fullName || req.user.name,
        email: req.body.personalInfo?.email || req.user.email,
        phone: req.body.personalInfo?.phone || '',
        dateOfBirth: req.body.personalInfo?.dateOfBirth || null,
        gender: req.body.personalInfo?.gender || '',
        bloodGroup: req.body.personalInfo?.bloodGroup,
        address: req.body.personalInfo?.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        }
      },
      medicalConditions: {
        isDiabetic: req.body.medicalConditions?.isDiabetic || false,
        diabetesType: req.body.medicalConditions?.diabetesType || null,
        hasThyroid: req.body.medicalConditions?.hasThyroid || false,
        thyroidCondition: req.body.medicalConditions?.thyroidCondition || null,
        comorbidConditions: req.body.medicalConditions?.comorbidConditions || [],
        chronicDiseases: req.body.medicalConditions?.chronicDiseases || [],
        medicationAllergies: req.body.medicalConditions?.medicationAllergies || []
      },
      medications: {
        currentMedications: req.body.medications?.currentMedications || [],
        bloodThinnerHistory: req.body.medications?.bloodThinnerHistory || []
      },
      surgicalHistory: {
        pastSurgeries: req.body.surgicalHistory?.pastSurgeries || [],
        majorIllnesses: req.body.surgicalHistory?.majorIllnesses || [],
        previousInterventions: req.body.surgicalHistory?.previousInterventions || []
      },
      emergencyContact: req.body.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      }
    };

    if (medicalForm) {
      // Update existing form - use $set to avoid conflicts
      medicalForm = await PatientMedicalForm.findOneAndUpdate(
        { patientId },
        {
          $set: {
            'personalInfo': formData.personalInfo,
            'medicalConditions': formData.medicalConditions,
            'medications': formData.medications,
            'surgicalHistory': formData.surgicalHistory,
            'emergencyContact': formData.emergencyContact,
            'completionStatus.isComplete': true,
            'completionStatus.lastUpdated': new Date()
          }
        },
        { new: true, runValidators: true }
      );
      console.log('✅ Medical form updated successfully');
    } else {
      // Create new form with completion status
      formData.completionStatus = {
        isComplete: true,
        completionDate: new Date(),
        lastUpdated: new Date()
      };
      medicalForm = new PatientMedicalForm(formData);
      await medicalForm.save();
      console.log('✅ New medical form created successfully');
    }

    // Update user to indicate medical form is complete
    await User.findByIdAndUpdate(patientId, {
      $set: {
        hasMedicalForm: true,
        bloodGroup: formData.personalInfo.bloodGroup,
        phone: formData.personalInfo.phone,
        dateOfBirth: formData.personalInfo.dateOfBirth,
        gender: formData.personalInfo.gender
      }
    });

    // Refresh QR code with updated data (non-critical, don't fail if it errors)
    try {
      const QRCode = require('qrcode');
      const ProcessedDocument = require('../models/ProcessedDocument');
      const recentDocs = await ProcessedDocument.find({ userId: patientId })
        .sort({ processedAt: -1 })
        .limit(10);

      // Collect all medical data for QR
      const allDiagnoses = new Set();
      const allMedications = new Set();
      const allAllergies = new Set();

      recentDocs.forEach(doc => {
        doc.diagnoses?.forEach(d => allDiagnoses.add(d));
        doc.medications?.forEach(m => allMedications.add(m));
        doc.allergies?.forEach(a => allAllergies.add(a));
      });

      // Add data from medical form
      if (formData.medicalConditions.medicationAllergies) {
        formData.medicalConditions.medicationAllergies.forEach(a => {
          if (a.medication) allAllergies.add(a.medication);
        });
      }
      if (formData.medicalConditions.chronicDiseases) {
        formData.medicalConditions.chronicDiseases.forEach(d => allDiagnoses.add(d));
      }

      const qrData = {
        patientId: req.user.patientId,
        name: req.user.name,
        bloodGroup: formData.personalInfo.bloodGroup,
        lastUpdated: new Date().toISOString(),
        stats: {
          documents: recentDocs.length,
          diagnoses: Array.from(allDiagnoses).slice(0, 10),
          medications: Array.from(allMedications).slice(0, 10),
          allergies: Array.from(allAllergies)
        }
      };

      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
      await User.findByIdAndUpdate(patientId, { $set: { qrCode } });
      console.log('✅ QR code refreshed with updated medical data');
    } catch (qrError) {
      console.error('QR refresh error (non-critical):', qrError.message);
      // Don't fail the whole request if QR refresh fails
    }

    res.status(200).json({
      success: true,
      message: medicalForm ? 'Medical form updated successfully' : 'Medical form submitted successfully',
      data: medicalForm
    });

  } catch (error) {
    console.error('❌ Medical form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during form submission',
      error: error.message
    });
  }
});

// Get medical form
router.get('/', auth, isPatient, async (req, res) => {
  try {
    const patientId = req.user._id;
    const medicalForm = await PatientMedicalForm.findOne({ patientId });

    if (!medicalForm) {
      return res.status(404).json({
        success: false,
        message: 'Medical form not found'
      });
    }

    res.json({
      success: true,
      data: medicalForm
    });
  } catch (error) {
    console.error('❌ Get medical form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update medical form (alternative endpoint)
router.put('/update', auth, isPatient, async (req, res) => {
  try {
    const patientId = req.user._id;

    const medicalForm = await PatientMedicalForm.findOneAndUpdate(
      { patientId },
      {
        $set: {
          ...req.body,
          'completionStatus.lastUpdated': new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!medicalForm) {
      return res.status(404).json({
        success: false,
        message: 'Medical form not found'
      });
    }

    res.json({
      success: true,
      message: 'Medical form updated successfully',
      data: medicalForm
    });
  } catch (error) {
    console.error('❌ Update medical form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Check if patient has completed medical form
router.get('/status', auth, isPatient, async (req, res) => {
  try {
    const patientId = req.user._id;
    const medicalForm = await PatientMedicalForm.findOne({ patientId });

    res.json({
      success: true,
      data: {
        hasForm: !!medicalForm,
        isComplete: medicalForm?.completionStatus?.isComplete || false
      }
    });
  } catch (error) {
    console.error('❌ Check form status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;