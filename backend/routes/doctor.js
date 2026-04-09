// const express = require('express');
// const router = express.Router();
// const { auth, isDoctor } = require('../middleware/auth');
// const User = require('../models/User');
// const Doctor = require('../models/Doctor');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');
// const summaryGenerator = require('../services/summaryGenerator');

// // Helper function to notify patient and their relative
// const sendDataAccessNotification = async (patient, doctor) => {
//   try {
//     // Safely format the address object to a readable string
//     let addressString = 'N/A';
//     if (typeof doctor.address === 'string') {
//       addressString = doctor.address;
//     } else if (doctor.address && typeof doctor.address === 'object') {
//       const { street, city, state, country } = doctor.address;
//       addressString = [street, city, state, country].filter(Boolean).join(', ') || 'N/A';
//     }

//     const message = `SECURITY ALERT: Dr. ${doctor.name} has accessed your medical data. Doctor Contact: ${doctor.phone || 'N/A'}, Address: ${addressString}`;

//     // Dynamically save the notification to the patient's database record
//     await User.findByIdAndUpdate(patient._id, {
//       $push: {
//         notifications: {
//           $each: [{ message, date: new Date(), read: false }],
//           $position: 0 // Insert at the top of the array so newest is first
//         }
//       }
//     });

//     // TODO: Replace these console.logs with your actual SMS (e.g., Twilio) or Email (e.g., Nodemailer) service
//     console.log(`\n[NOTIFICATION TO PATIENT - ${patient.email || patient.phone}]: ${message}`);
    
//     // Notify relative if contact info exists in your schema
//     const relativeContact = patient.emergencyContact || patient.relativeContact || patient.relativePhone;
//     // Ensure relativeContact isn't an empty object {} before logging
//     if (relativeContact && (typeof relativeContact === 'string' || Object.keys(relativeContact).length > 0)) {
//       console.log(`[NOTIFICATION TO RELATIVE - ${typeof relativeContact === 'object' ? JSON.stringify(relativeContact) : relativeContact}]: ${message}\n`);
//     }
//   } catch (error) {
//     console.error('Failed to send data access notification:', error);
//   }
// };

// // Get doctor profile
// router.get('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).select('-password');

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Doctor not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: doctor
//     });
//   } catch (error) {
//     console.error('Get doctor profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Update doctor profile
// router.put('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const updates = req.body;
//     delete updates.password;
//     delete updates.role;
//     delete updates.doctorId;

//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id,
//       updates,
//       { new: true, runValidators: true }
//     ).select('-password');

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: doctor
//     });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Search patient by ID, name, or email
// router.get('/patient/search', auth, isDoctor, async (req, res) => {
//   try {
//     const { q } = req.query;

//     if (!q) {
//       return res.status(400).json({
//         success: false,
//         message: 'Search query is required'
//       });
//     }

//     const patients = await User.find({
//       role: 'patient',
//       $or: [
//         { patientId: { $regex: q, $options: 'i' } },
//         { name: { $regex: q, $options: 'i' } },
//         { email: { $regex: q, $options: 'i' } }
//       ]
//     }).select('name patientId email bloodGroup qrCode phone address');

//     res.json({
//       success: true,
//       data: patients
//     });
//   } catch (error) {
//     console.error('Search patient error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get patient by QR code data
// router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
//   try {
//     const { qrData } = req.params;

//     // Try to parse QR data (could be patientId or JSON)
//     let extractedPatientId = qrData;
//     try {
//       const parsed = JSON.parse(qrData);
//       // Ensure it's an object before extracting properties to prevent numbers/strings from returning undefined
//       if (parsed && typeof parsed === 'object') {
//         extractedPatientId = parsed.pid || parsed.patientId || qrData;
//       }
//     } catch {
//       // Keep it as raw qrData if JSON.parse fails
//     }

//     const patient = await User.findOne({
//       patientId: { $regex: new RegExp('^' + String(extractedPatientId).trim() + '$', 'i') },
//       role: 'patient'
//     }).select('name patientId email bloodGroup qrCode phone address emergencyContact relativeContact relativePhone');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     // Add this patient to doctor's list if not already there
//     await Doctor.findByIdAndUpdate(
//       req.user._id,
//       { $addToSet: { patients: patient._id } }
//     );

//     // Notify the patient and relative that their data was accessed via QR Scan
//     const doctor = await Doctor.findById(req.user._id);
//     await sendDataAccessNotification(patient, doctor);

//     res.json({
//       success: true,
//       data: patient
//     });
//   } catch (error) {
//     console.error('Get patient by QR error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get patient general summary for doctor (from stored summaries)
// router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;

//     const patient = await User.findOne({
//       patientId,
//       role: 'patient'
//     }).select('-password');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     const summaryGenerator = require('../services/summaryGenerator');
//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

//     if (!summaries) {
//       // Generate if not exists
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id })
//         .sort({ processedAt: -1 });

//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//         patient,
//         medicalForm,
//         allDocs
//       );

//       return res.json({
//         success: true,
//         data: newSummaries.general
//       });
//     }

//     res.json({
//       success: true,
//       data: summaries.general
//     });
//   } catch (error) {
//     console.error('Get patient summary error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get patient cardiology summary for doctor (from stored summaries)
// router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;

//     const patient = await User.findOne({
//       patientId,
//       role: 'patient'
//     }).select('-password');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     const summaryGenerator = require('../services/summaryGenerator');
//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

//     if (!summaries || !summaries.cardiology) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id })
//         .sort({ processedAt: -1 });

//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//         patient,
//         medicalForm,
//         allDocs
//       );

//       return res.json({
//         success: true,
//         data: newSummaries.cardiology
//       });
//     }

//     res.json({
//       success: true,
//       data: summaries.cardiology
//     });
//   } catch (error) {
//     console.error('Get cardiology summary error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get patient orthopedic summary for doctor (from stored summaries)
// router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;

//     const patient = await User.findOne({
//       patientId,
//       role: 'patient'
//     }).select('-password');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     const summaryGenerator = require('../services/summaryGenerator');
//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

//     if (!summaries || !summaries.orthopedic) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id })
//         .sort({ processedAt: -1 });

//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//         patient,
//         medicalForm,
//         allDocs
//       );

//       return res.json({
//         success: true,
//         data: newSummaries.orthopedic
//       });
//     }

//     res.json({
//       success: true,
//       data: summaries.orthopedic
//     });
//   } catch (error) {
//     console.error('Get orthopedic summary error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get all patient summaries for doctor
// router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;

//     const patient = await User.findOne({
//       patientId,
//       role: 'patient'
//     }).select('-password');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     const summaryGenerator = require('../services/summaryGenerator');
//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id })
//         .sort({ processedAt: -1 });

//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//         patient,
//         medicalForm,
//         allDocs
//       );

//       // Notify on initial full summary access
//       const doctor = await Doctor.findById(req.user._id);
//       await sendDataAccessNotification(patient, doctor);

//       return res.json({
//         success: true,
//         data: newSummaries
//       });
//     }

//     // Notify on full summary access
//     const doctor = await Doctor.findById(req.user._id);
//     await sendDataAccessNotification(patient, doctor);

//     res.json({
//       success: true,
//       data: summaries
//     });
//   } catch (error) {
//     console.error('Get all summaries error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Force refresh patient summaries for doctor
// router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;

//     const patient = await User.findOne({
//       patientId,
//       role: 'patient'
//     }).select('-password');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     const summaryGenerator = require('../services/summaryGenerator');
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//     const allDocs = await ProcessedDocument.find({ userId: patient._id })
//       .sort({ processedAt: -1 });

//     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//       patient,
//       medicalForm,
//       allDocs
//     );

//     res.json({
//       success: true,
//       message: 'Patient summaries refreshed successfully',
//       data: newSummaries
//     });
//   } catch (error) {
//     console.error('Refresh summaries error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });
// module.exports = router;

const express = require('express');
const router = express.Router();
const { auth, isDoctor } = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');
const summaryGenerator = require('../services/summaryGenerator');
const { createSecurityAlert } = require('../services/notification.service');

// Helper to notify patient & relative – now delegated to service

// Get doctor profile
router.get('/profile', auth, isDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id).select('-password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.json({ success: true, message: 'Profile updated successfully', data: doctor });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search patient
router.get('/patient/search', auth, isDoctor, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    const patients = await User.find({
      role: 'patient',
      $or: [
        { patientId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('name patientId email bloodGroup qrCode phone address');
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get patient by QR code – send notification
router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
  try {
    const { qrData } = req.params;
    let extractedPatientId = qrData;
    try {
      const parsed = JSON.parse(qrData);
      if (parsed && typeof parsed === 'object') {
        extractedPatientId = parsed.pid || parsed.patientId || qrData;
      }
    } catch { /* keep as is */ }

    const patient = await User.findOne({
      patientId: { $regex: new RegExp('^' + String(extractedPatientId).trim() + '$', 'i') },
      role: 'patient'
    }).select('name patientId email bloodGroup qrCode phone address emergencyContact relativeContact relativePhone');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    await Doctor.findByIdAndUpdate(req.user._id, { $addToSet: { patients: patient._id } });

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor);  // ✅ sends notification

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Get patient by QR error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get patient general summary – send notification
router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor); // ✅ notify on summary access

    const summaries = await summaryGenerator.getPatientSummaries(patient._id);
    if (!summaries) {
      const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
      const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries.general });
    }
    res.json({ success: true, data: summaries.general });
  } catch (error) {
    console.error('Get patient summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get cardiology summary – send notification
router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor);

    const summaries = await summaryGenerator.getPatientSummaries(patient._id);
    if (!summaries || !summaries.cardiology) {
      const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
      const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries.cardiology });
    }
    res.json({ success: true, data: summaries.cardiology });
  } catch (error) {
    console.error('Get cardiology summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get orthopedic summary – send notification
router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor);

    const summaries = await summaryGenerator.getPatientSummaries(patient._id);
    if (!summaries || !summaries.orthopedic) {
      const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
      const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries.orthopedic });
    }
    res.json({ success: true, data: summaries.orthopedic });
  } catch (error) {
    console.error('Get orthopedic summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all summaries – send notification
router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor); // ✅ notify on full access

    const summaries = await summaryGenerator.getPatientSummaries(patient._id);
    if (!summaries) {
      const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
      const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries });
    }
    res.json({ success: true, data: summaries });
  } catch (error) {
    console.error('Get all summaries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Force refresh summaries – no notification (admin action)
router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
    const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
    const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
    res.json({ success: true, message: 'Patient summaries refreshed successfully', data: newSummaries });
  } catch (error) {
    console.error('Refresh summaries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;