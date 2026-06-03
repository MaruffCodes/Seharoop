// // const express = require('express');
// // const router = express.Router();
// // const { auth, isDoctor } = require('../middleware/auth');
// // const User = require('../models/User');
// // const Doctor = require('../models/Doctor');
// // const PatientMedicalForm = require('../models/PatientMedicalForm');
// // const ProcessedDocument = require('../models/ProcessedDocument');
// // const summaryGenerator = require('../services/summaryGenerator');

// // // Helper function to notify patient and their relative
// // const sendDataAccessNotification = async (patient, doctor) => {
// //   try {
// //     // Safely format the address object to a readable string
// //     let addressString = 'N/A';
// //     if (typeof doctor.address === 'string') {
// //       addressString = doctor.address;
// //     } else if (doctor.address && typeof doctor.address === 'object') {
// //       const { street, city, state, country } = doctor.address;
// //       addressString = [street, city, state, country].filter(Boolean).join(', ') || 'N/A';
// //     }

// //     const message = `SECURITY ALERT: Dr. ${doctor.name} has accessed your medical data. Doctor Contact: ${doctor.phone || 'N/A'}, Address: ${addressString}`;

// //     // Dynamically save the notification to the patient's database record
// //     await User.findByIdAndUpdate(patient._id, {
// //       $push: {
// //         notifications: {
// //           $each: [{ message, date: new Date(), read: false }],
// //           $position: 0 // Insert at the top of the array so newest is first
// //         }
// //       }
// //     });

// //     // TODO: Replace these console.logs with your actual SMS (e.g., Twilio) or Email (e.g., Nodemailer) service
// //     console.log(`\n[NOTIFICATION TO PATIENT - ${patient.email || patient.phone}]: ${message}`);

// //     // Notify relative if contact info exists in your schema
// //     const relativeContact = patient.emergencyContact || patient.relativeContact || patient.relativePhone;
// //     // Ensure relativeContact isn't an empty object {} before logging
// //     if (relativeContact && (typeof relativeContact === 'string' || Object.keys(relativeContact).length > 0)) {
// //       console.log(`[NOTIFICATION TO RELATIVE - ${typeof relativeContact === 'object' ? JSON.stringify(relativeContact) : relativeContact}]: ${message}\n`);
// //     }
// //   } catch (error) {
// //     console.error('Failed to send data access notification:', error);
// //   }
// // };

// // // Get doctor profile
// // router.get('/profile', auth, isDoctor, async (req, res) => {
// //   try {
// //     const doctor = await Doctor.findById(req.user._id).select('-password');

// //     if (!doctor) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Doctor not found'
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       data: doctor
// //     });
// //   } catch (error) {
// //     console.error('Get doctor profile error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Update doctor profile
// // router.put('/profile', auth, isDoctor, async (req, res) => {
// //   try {
// //     const updates = req.body;
// //     delete updates.password;
// //     delete updates.role;
// //     delete updates.doctorId;

// //     const doctor = await Doctor.findByIdAndUpdate(
// //       req.user._id,
// //       updates,
// //       { new: true, runValidators: true }
// //     ).select('-password');

// //     res.json({
// //       success: true,
// //       message: 'Profile updated successfully',
// //       data: doctor
// //     });
// //   } catch (error) {
// //     console.error('Update doctor profile error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Search patient by ID, name, or email
// // router.get('/patient/search', auth, isDoctor, async (req, res) => {
// //   try {
// //     const { q } = req.query;

// //     if (!q) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Search query is required'
// //       });
// //     }

// //     const patients = await User.find({
// //       role: 'patient',
// //       $or: [
// //         { patientId: { $regex: q, $options: 'i' } },
// //         { name: { $regex: q, $options: 'i' } },
// //         { email: { $regex: q, $options: 'i' } }
// //       ]
// //     }).select('name patientId email bloodGroup qrCode phone address');

// //     res.json({
// //       success: true,
// //       data: patients
// //     });
// //   } catch (error) {
// //     console.error('Search patient error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Get patient by QR code data
// // router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
// //   try {
// //     const { qrData } = req.params;

// //     // Try to parse QR data (could be patientId or JSON)
// //     let extractedPatientId = qrData;
// //     try {
// //       const parsed = JSON.parse(qrData);
// //       // Ensure it's an object before extracting properties to prevent numbers/strings from returning undefined
// //       if (parsed && typeof parsed === 'object') {
// //         extractedPatientId = parsed.pid || parsed.patientId || qrData;
// //       }
// //     } catch {
// //       // Keep it as raw qrData if JSON.parse fails
// //     }

// //     const patient = await User.findOne({
// //       patientId: { $regex: new RegExp('^' + String(extractedPatientId).trim() + '$', 'i') },
// //       role: 'patient'
// //     }).select('name patientId email bloodGroup qrCode phone address emergencyContact relativeContact relativePhone');

// //     if (!patient) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Patient not found'
// //       });
// //     }

// //     // Add this patient to doctor's list if not already there
// //     await Doctor.findByIdAndUpdate(
// //       req.user._id,
// //       { $addToSet: { patients: patient._id } }
// //     );

// //     // Notify the patient and relative that their data was accessed via QR Scan
// //     const doctor = await Doctor.findById(req.user._id);
// //     await sendDataAccessNotification(patient, doctor);

// //     res.json({
// //       success: true,
// //       data: patient
// //     });
// //   } catch (error) {
// //     console.error('Get patient by QR error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Get patient general summary for doctor (from stored summaries)
// // router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
// //   try {
// //     const { patientId } = req.params;

// //     const patient = await User.findOne({
// //       patientId,
// //       role: 'patient'
// //     }).select('-password');

// //     if (!patient) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Patient not found'
// //       });
// //     }

// //     const summaryGenerator = require('../services/summaryGenerator');
// //     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

// //     if (!summaries) {
// //       // Generate if not exists
// //       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
// //       const allDocs = await ProcessedDocument.find({ userId: patient._id })
// //         .sort({ processedAt: -1 });

// //       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
// //         patient,
// //         medicalForm,
// //         allDocs
// //       );

// //       return res.json({
// //         success: true,
// //         data: newSummaries.general
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       data: summaries.general
// //     });
// //   } catch (error) {
// //     console.error('Get patient summary error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Get patient cardiology summary for doctor (from stored summaries)
// // router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
// //   try {
// //     const { patientId } = req.params;

// //     const patient = await User.findOne({
// //       patientId,
// //       role: 'patient'
// //     }).select('-password');

// //     if (!patient) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Patient not found'
// //       });
// //     }

// //     const summaryGenerator = require('../services/summaryGenerator');
// //     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

// //     if (!summaries || !summaries.cardiology) {
// //       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
// //       const allDocs = await ProcessedDocument.find({ userId: patient._id })
// //         .sort({ processedAt: -1 });

// //       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
// //         patient,
// //         medicalForm,
// //         allDocs
// //       );

// //       return res.json({
// //         success: true,
// //         data: newSummaries.cardiology
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       data: summaries.cardiology
// //     });
// //   } catch (error) {
// //     console.error('Get cardiology summary error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Get patient orthopedic summary for doctor (from stored summaries)
// // router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
// //   try {
// //     const { patientId } = req.params;

// //     const patient = await User.findOne({
// //       patientId,
// //       role: 'patient'
// //     }).select('-password');

// //     if (!patient) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Patient not found'
// //       });
// //     }

// //     const summaryGenerator = require('../services/summaryGenerator');
// //     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

// //     if (!summaries || !summaries.orthopedic) {
// //       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
// //       const allDocs = await ProcessedDocument.find({ userId: patient._id })
// //         .sort({ processedAt: -1 });

// //       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
// //         patient,
// //         medicalForm,
// //         allDocs
// //       );

// //       return res.json({
// //         success: true,
// //         data: newSummaries.orthopedic
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       data: summaries.orthopedic
// //     });
// //   } catch (error) {
// //     console.error('Get orthopedic summary error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Get all patient summaries for doctor
// // router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
// //   try {
// //     const { patientId } = req.params;

// //     const patient = await User.findOne({
// //       patientId,
// //       role: 'patient'
// //     }).select('-password');

// //     if (!patient) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Patient not found'
// //       });
// //     }

// //     const summaryGenerator = require('../services/summaryGenerator');
// //     const summaries = await summaryGenerator.getPatientSummaries(patient._id);

// //     if (!summaries) {
// //       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
// //       const allDocs = await ProcessedDocument.find({ userId: patient._id })
// //         .sort({ processedAt: -1 });

// //       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
// //         patient,
// //         medicalForm,
// //         allDocs
// //       );

// //       // Notify on initial full summary access
// //       const doctor = await Doctor.findById(req.user._id);
// //       await sendDataAccessNotification(patient, doctor);

// //       return res.json({
// //         success: true,
// //         data: newSummaries
// //       });
// //     }

// //     // Notify on full summary access
// //     const doctor = await Doctor.findById(req.user._id);
// //     await sendDataAccessNotification(patient, doctor);

// //     res.json({
// //       success: true,
// //       data: summaries
// //     });
// //   } catch (error) {
// //     console.error('Get all summaries error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });

// // // Force refresh patient summaries for doctor
// // router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
// //   try {
// //     const { patientId } = req.params;

// //     const patient = await User.findOne({
// //       patientId,
// //       role: 'patient'
// //     }).select('-password');

// //     if (!patient) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Patient not found'
// //       });
// //     }

// //     const summaryGenerator = require('../services/summaryGenerator');
// //     const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
// //     const allDocs = await ProcessedDocument.find({ userId: patient._id })
// //       .sort({ processedAt: -1 });

// //     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
// //       patient,
// //       medicalForm,
// //       allDocs
// //     );

// //     res.json({
// //       success: true,
// //       message: 'Patient summaries refreshed successfully',
// //       data: newSummaries
// //     });
// //   } catch (error) {
// //     console.error('Refresh summaries error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // });
// // module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { auth, isDoctor } = require('../middleware/auth');
// const User = require('../models/User');
// const Doctor = require('../models/Doctor');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');
// const summaryGenerator = require('../services/summaryGenerator');
// const { createSecurityAlert } = require('../services/notification.service');

// // Helper to notify patient & relative – now delegated to service

// // Get doctor profile
// router.get('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).select('-password');
//     if (!doctor) {
//       return res.status(404).json({ success: false, message: 'Doctor not found' });
//     }
//     res.json({ success: true, data: doctor });
//   } catch (error) {
//     console.error('Get doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
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
//     res.json({ success: true, message: 'Profile updated successfully', data: doctor });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Search patient
// router.get('/patient/search', auth, isDoctor, async (req, res) => {
//   try {
//     const { q } = req.query;
//     if (!q) {
//       return res.status(400).json({ success: false, message: 'Search query is required' });
//     }
//     const patients = await User.find({
//       role: 'patient',
//       $or: [
//         { patientId: { $regex: q, $options: 'i' } },
//         { name: { $regex: q, $options: 'i' } },
//         { email: { $regex: q, $options: 'i' } }
//       ]
//     }).select('name patientId email bloodGroup qrCode phone address');
//     res.json({ success: true, data: patients });
//   } catch (error) {
//     console.error('Search patient error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get patient by QR code – send notification
// router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
//   try {
//     const { qrData } = req.params;
//     let extractedPatientId = qrData;
//     try {
//       const parsed = JSON.parse(qrData);
//       if (parsed && typeof parsed === 'object') {
//         extractedPatientId = parsed.pid || parsed.patientId || qrData;
//       }
//     } catch { /* keep as is */ }

//     const patient = await User.findOne({
//       patientId: { $regex: new RegExp('^' + String(extractedPatientId).trim() + '$', 'i') },
//       role: 'patient'
//     }).select('name patientId email bloodGroup qrCode phone address emergencyContact relativeContact relativePhone');

//     if (!patient) {
//       return res.status(404).json({ success: false, message: 'Patient not found' });
//     }

//     await Doctor.findByIdAndUpdate(req.user._id, { $addToSet: { patients: patient._id } });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);  // ✅ sends notification

//     res.json({ success: true, data: patient });
//   } catch (error) {
//     console.error('Get patient by QR error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get patient general summary – send notification
// router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) {
//       return res.status(404).json({ success: false, message: 'Patient not found' });
//     }

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor); // ✅ notify on summary access

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.general });
//     }
//     res.json({ success: true, data: summaries.general });
//   } catch (error) {
//     console.error('Get patient summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get cardiology summary – send notification
// router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) {
//       return res.status(404).json({ success: false, message: 'Patient not found' });
//     }

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.cardiology) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.cardiology });
//     }
//     res.json({ success: true, data: summaries.cardiology });
//   } catch (error) {
//     console.error('Get cardiology summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get orthopedic summary – send notification
// router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) {
//       return res.status(404).json({ success: false, message: 'Patient not found' });
//     }

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.orthopedic) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.orthopedic });
//     }
//     res.json({ success: true, data: summaries.orthopedic });
//   } catch (error) {
//     console.error('Get orthopedic summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get all summaries – send notification
// router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) {
//       return res.status(404).json({ success: false, message: 'Patient not found' });
//     }

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor); // ✅ notify on full access

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries });
//     }
//     res.json({ success: true, data: summaries });
//   } catch (error) {
//     console.error('Get all summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Force refresh summaries – no notification (admin action)
// router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) {
//       return res.status(404).json({ success: false, message: 'Patient not found' });
//     }
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//     const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//     res.json({ success: true, message: 'Patient summaries refreshed successfully', data: newSummaries });
//   } catch (error) {
//     console.error('Refresh summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { auth, isDoctor } = require('../middleware/auth');
// const User = require('../models/User');
// const Doctor = require('../models/Doctor');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');
// const PatientSummary = require('../models/PatientSummary');
// const summaryGenerator = require('../services/summaryGenerator');
// const { createSecurityAlert } = require('../services/notification.service');

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPER – log that a doctor viewed a patient's record
// // Stores the entry in PatientSummary.viewHistory and bumps viewCount.
// // ─────────────────────────────────────────────────────────────────────────────
// async function logDoctorView(patientMongoId, doctor) {
//   try {
//     const viewEntry = {
//       doctorId: doctor._id,
//       doctorName: doctor.name,
//       specialization: doctor.specialization || 'General',
//       viewedAt: new Date(),
//     };

//     // Upsert PatientSummary and push view entry
//     await PatientSummary.findOneAndUpdate(
//       { patientId: patientMongoId },
//       {
//         $push: { viewHistory: { $each: [viewEntry], $slice: -100 } }, // keep last 100
//         $inc: { viewCount: 1 },
//       },
//       { upsert: true, new: true }
//     );
//   } catch (err) {
//     console.error('⚠️ logDoctorView error (non-fatal):', err.message);
//   }
// }

// // ── Get doctor profile ────────────────────────────────────────────────────────
// router.get('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).select('-password');
//     if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
//     res.json({ success: true, data: doctor });
//   } catch (error) {
//     console.error('Get doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Update doctor profile ─────────────────────────────────────────────────────
// router.put('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const updates = req.body;
//     delete updates.password;
//     delete updates.role;
//     delete updates.doctorId;
//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id, updates, { new: true, runValidators: true }
//     ).select('-password');
//     res.json({ success: true, message: 'Profile updated successfully', data: doctor });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Search patient ────────────────────────────────────────────────────────────
// router.get('/patient/search', auth, isDoctor, async (req, res) => {
//   try {
//     const { q } = req.query;
//     if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });
//     const patients = await User.find({
//       role: 'patient',
//       $or: [
//         { patientId: { $regex: q, $options: 'i' } },
//         { name: { $regex: q, $options: 'i' } },
//         { email: { $regex: q, $options: 'i' } },
//       ]
//     }).select('name patientId email bloodGroup qrCode phone address');
//     res.json({ success: true, data: patients });
//   } catch (error) {
//     console.error('Search patient error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient by QR ─────────────────────────────────────────────────────────
// router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
//   try {
//     const { qrData } = req.params;
//     let extractedPatientId = qrData;
//     try {
//       const parsed = JSON.parse(qrData);
//       if (parsed && typeof parsed === 'object') {
//         extractedPatientId = parsed.pid || parsed.patientId || qrData;
//       }
//     } catch { /* keep as is */ }

//     const patient = await User.findOne({
//       patientId: { $regex: new RegExp('^' + String(extractedPatientId).trim() + '$', 'i') },
//       role: 'patient'
//     }).select('name patientId email bloodGroup qrCode phone address emergencyContact');

//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await Doctor.findByIdAndUpdate(req.user._id, { $addToSet: { patients: patient._id } });
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     res.json({ success: true, data: patient });
//   } catch (error) {
//     console.error('Get patient by QR error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient general summary ───────────────────────────────────────────────
// router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.general });
//     }
//     res.json({ success: true, data: summaries.general });
//   } catch (error) {
//     console.error('Get patient summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get cardiology summary ────────────────────────────────────────────────────
// router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.cardiology) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.cardiology });
//     }
//     res.json({ success: true, data: summaries.cardiology });
//   } catch (error) {
//     console.error('Get cardiology summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get orthopedic summary ────────────────────────────────────────────────────
// router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.orthopedic) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.orthopedic });
//     }
//     res.json({ success: true, data: summaries.orthopedic });
//   } catch (error) {
//     console.error('Get orthopedic summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get all summaries ─────────────────────────────────────────────────────────
// router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries });
//     }
//     res.json({ success: true, data: summaries });
//   } catch (error) {
//     console.error('Get all summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Force refresh summaries ───────────────────────────────────────────────────
// router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//     const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//     res.json({ success: true, message: 'Summaries refreshed', data: newSummaries });
//   } catch (error) {
//     console.error('Refresh summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient timeline ──────────────────────────────────────────────────────
// router.get('/patient/:patientId/timeline', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' })
//       .select('medicalHistory name patientId');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     res.json({ success: true, data: patient.medicalHistory || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient's doctor view history (for patient dashboard) ─────────────────
// // Called by the patient (not a doctor) to see who viewed their record.
// // We expose this on /doctor route because it reads PatientSummary data.
// router.get('/patient/:patientId/view-history', auth, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     // Allow patient to query their own view history
//     const patient = await User.findOne({ patientId, role: 'patient' });
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const ps = await PatientSummary.findOne({ patientId: patient._id });
//     if (!ps) return res.json({ success: true, data: { viewCount: 0, viewHistory: [] } });

//     res.json({
//       success: true,
//       data: {
//         viewCount: ps.viewCount || 0,
//         viewHistory: (ps.viewHistory || []).slice(-20).reverse(), // last 20, newest first
//       }
//     });
//   } catch (error) {
//     console.error('View history error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient SLM summary (doctor) ─────────────────────────────────────────
// router.get('/patient/:patientId/slm-summary', auth, isDoctor, async (req, res) => {
//   req.setTimeout(120000);
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' });
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     // Return disabled placeholder (same as patient endpoint)
//     res.json({
//       success: true,
//       data: {
//         success: false,
//         summary: 'AI summary generation temporarily disabled.',
//         type: 'general',
//         timestamp: new Date().toISOString(),
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Dashboard stats ───────────────────────────────────────────────────────────
// router.get('/dashboard/stats', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id);
//     res.json({
//       success: true,
//       data: {
//         totalPatients: doctor?.patients?.length || 0,
//         patientsToday: 0,
//         pendingReports: 0,
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.get('/dashboard/schedule', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// router.get('/dashboard/activity', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// router.get('/patients', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).populate('patients', 'name patientId email bloodGroup');
//     res.json({ success: true, data: doctor?.patients || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });
// // ── Dashboard stats ───────────────────────────────────────────────────────────
// router.get('/dashboard/stats', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id);
//     res.json({
//       success: true,
//       data: {
//         totalPatients: doctor?.patients?.length || 0,
//         patientsToday: 0,
//         pendingReports: 0,
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get doctor dashboard stats (enhanced) ──────────────────────────────────────
// router.get('/dashboard/stats/enhanced', auth, isDoctor, async (req, res) => {
//   try {
//     const doctorId = req.user._id;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     const totalPatients = await DoctorPatientView.countDocuments({ doctorId });
//     const recentPatients = await DoctorPatientView.find({ doctorId })
//       .sort({ lastViewedAt: -1 })
//       .limit(10)
//       .select('patientName patientUniqueId lastViewedAt');

//     res.json({
//       success: true,
//       data: {
//         totalPatients,
//         recentPatients
//       }
//     });
//   } catch (error) {
//     console.error('Get enhanced stats error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get doctor's patient list (recent) ─────────────────────────────────────────
// router.get('/my-patients', auth, isDoctor, async (req, res) => {
//   try {
//     const doctorId = req.user._id;
//     const limit = parseInt(req.query.limit) || 50;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     const patients = await DoctorPatientView.find({ doctorId })
//       .sort({ lastViewedAt: -1 })
//       .limit(limit)
//       .select('patientId patientName patientUniqueId lastViewedAt viewCount');

//     res.json({
//       success: true,
//       data: patients,
//       count: patients.length
//     });
//   } catch (error) {
//     console.error('Get my patients error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Record patient view (when doctor scans QR or searches) ─────────────────────
// router.post('/record-patient-view', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId, patientName, patientUniqueId } = req.body;
//     const doctorId = req.user._id;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     // Find existing record
//     let viewRecord = await DoctorPatientView.findOne({ doctorId, patientId });

//     if (viewRecord) {
//       // Update existing record
//       viewRecord.viewCount += 1;
//       viewRecord.lastViewedAt = new Date();
//       await viewRecord.save();
//     } else {
//       // Create new record
//       viewRecord = new DoctorPatientView({
//         doctorId,
//         patientId,
//         patientName,
//         patientUniqueId,
//         viewCount: 1,
//         firstViewedAt: new Date(),
//         lastViewedAt: new Date()
//       });
//       await viewRecord.save();
//     }

//     res.json({ success: true, data: viewRecord });
//   } catch (error) {
//     console.error('Record patient view error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Update doctor profile (alternative endpoint) ───────────────────────────────
// router.put('/profile/update', auth, isDoctor, async (req, res) => {
//   try {
//     const updates = req.body;
//     const allowedUpdates = ['name', 'email', 'phone', 'specialization', 'qualification',
//       'experience', 'hospitalName', 'hospitalAddress'];

//     const filteredUpdates = {};
//     Object.keys(updates).forEach(key => {
//       if (allowedUpdates.includes(key)) {
//         filteredUpdates[key] = updates[key];
//       }
//     });

//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id,
//       { $set: filteredUpdates },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!doctor) {
//       return res.status(404).json({ success: false, message: 'Doctor not found' });
//     }

//     res.json({ success: true, data: doctor, message: 'Profile updated successfully' });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.get('/dashboard/schedule', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// router.get('/dashboard/activity', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// router.get('/patients', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).populate('patients', 'name patientId email bloodGroup');
//     res.json({ success: true, data: doctor?.patients || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });


// module.exports = router;


// const express = require('express');
// const router = express.Router();
// const { auth, isDoctor } = require('../middleware/auth');
// const User = require('../models/User');
// const Doctor = require('../models/Doctor');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');
// const PatientSummary = require('../models/PatientSummary');
// const summaryGenerator = require('../services/summaryGenerator');
// const { createSecurityAlert } = require('../services/notification.service');
// const DoctorPatientView = require('../models/DoctorPatientView');

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPER – log that a doctor viewed a patient's record
// // Stores the entry in PatientSummary.viewHistory and bumps viewCount.
// // ─────────────────────────────────────────────────────────────────────────────
// async function logDoctorView(patientMongoId, doctor) {
//   try {
//     const viewEntry = {
//       doctorId: doctor._id,
//       doctorName: doctor.name,
//       specialization: doctor.specialization || 'General',
//       viewedAt: new Date(),
//     };

//     // Upsert PatientSummary and push view entry
//     await PatientSummary.findOneAndUpdate(
//       { patientId: patientMongoId },
//       {
//         $push: { viewHistory: { $each: [viewEntry], $slice: -100 } }, // keep last 100
//         $inc: { viewCount: 1 },
//       },
//       { upsert: true, new: true }
//     );
//   } catch (err) {
//     console.error('⚠️ logDoctorView error (non-fatal):', err.message);
//   }
// }

// // ── Get doctor profile ────────────────────────────────────────────────────────
// router.get('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).select('-password');
//     if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
//     res.json({ success: true, data: doctor });
//   } catch (error) {
//     console.error('Get doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Update doctor profile ─────────────────────────────────────────────────────
// router.put('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const updates = req.body;
//     delete updates.password;
//     delete updates.role;
//     delete updates.doctorId;
//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id, updates, { new: true, runValidators: true }
//     ).select('-password');
//     res.json({ success: true, message: 'Profile updated successfully', data: doctor });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Update doctor profile (alternative endpoint) ───────────────────────────────
// router.put('/profile/update', auth, isDoctor, async (req, res) => {
//   try {
//     const updates = req.body;
//     const allowedUpdates = ['name', 'email', 'phone', 'specialization', 'qualification',
//       'experience', 'hospitalName', 'hospitalAddress'];

//     const filteredUpdates = {};
//     Object.keys(updates).forEach(key => {
//       if (allowedUpdates.includes(key)) {
//         filteredUpdates[key] = updates[key];
//       }
//     });

//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id,
//       { $set: filteredUpdates },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!doctor) {
//       return res.status(404).json({ success: false, message: 'Doctor not found' });
//     }

//     res.json({ success: true, data: doctor, message: 'Profile updated successfully' });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Search patient ────────────────────────────────────────────────────────────
// router.get('/patient/search', auth, isDoctor, async (req, res) => {
//   try {
//     const { q } = req.query;
//     if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });
//     const patients = await User.find({
//       role: 'patient',
//       $or: [
//         { patientId: { $regex: q, $options: 'i' } },
//         { name: { $regex: q, $options: 'i' } },
//         { email: { $regex: q, $options: 'i' } },
//       ]
//     }).select('name patientId email bloodGroup qrCode phone address');
//     res.json({ success: true, data: patients });
//   } catch (error) {
//     console.error('Search patient error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient by QR ─────────────────────────────────────────────────────────
// router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
//   try {
//     const { qrData } = req.params;
//     let extractedPatientId = qrData;
//     try {
//       const parsed = JSON.parse(qrData);
//       if (parsed && typeof parsed === 'object') {
//         extractedPatientId = parsed.pid || parsed.patientId || qrData;
//       }
//     } catch { /* keep as is */ }

//     const patient = await User.findOne({
//       patientId: { $regex: new RegExp('^' + String(extractedPatientId).trim() + '$', 'i') },
//       role: 'patient'
//     }).select('name patientId email bloodGroup qrCode phone address emergencyContact');

//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await Doctor.findByIdAndUpdate(req.user._id, { $addToSet: { patients: patient._id } });
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     // Record view in DoctorPatientView for analytics
//     try {
//       await DoctorPatientView.findOneAndUpdate(
//         { doctorId: doctor._id, patientId: patient._id },
//         {
//           $set: {
//             patientName: patient.name,
//             patientUniqueId: patient.patientId,
//             lastViewedAt: new Date()
//           },
//           $inc: { viewCount: 1 },
//           $setOnInsert: { firstViewedAt: new Date() }
//         },
//         { upsert: true, new: true }
//       );
//     } catch (err) {
//       console.error('Error recording view in analytics:', err);
//     }

//     res.json({ success: true, data: patient });
//   } catch (error) {
//     console.error('Get patient by QR error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient general summary ───────────────────────────────────────────────
// router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     // Record view in DoctorPatientView for analytics
//     try {
//       await DoctorPatientView.findOneAndUpdate(
//         { doctorId: doctor._id, patientId: patient._id },
//         {
//           $set: {
//             patientName: patient.name,
//             patientUniqueId: patient.patientId,
//             lastViewedAt: new Date()
//           },
//           $inc: { viewCount: 1 },
//           $setOnInsert: { firstViewedAt: new Date() }
//         },
//         { upsert: true, new: true }
//       );
//     } catch (err) {
//       console.error('Error recording view in analytics:', err);
//     }

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.general });
//     }
//     res.json({ success: true, data: summaries.general });
//   } catch (error) {
//     console.error('Get patient summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get cardiology summary ────────────────────────────────────────────────────
// router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.cardiology) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.cardiology });
//     }
//     res.json({ success: true, data: summaries.cardiology });
//   } catch (error) {
//     console.error('Get cardiology summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get orthopedic summary ────────────────────────────────────────────────────
// router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.orthopedic) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.orthopedic });
//     }
//     res.json({ success: true, data: summaries.orthopedic });
//   } catch (error) {
//     console.error('Get orthopedic summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get all summaries ─────────────────────────────────────────────────────────
// router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries });
//     }
//     res.json({ success: true, data: summaries });
//   } catch (error) {
//     console.error('Get all summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Force refresh summaries ───────────────────────────────────────────────────
// router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//     const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//     res.json({ success: true, message: 'Summaries refreshed', data: newSummaries });
//   } catch (error) {
//     console.error('Refresh summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient timeline ──────────────────────────────────────────────────────
// router.get('/patient/:patientId/timeline', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' })
//       .select('medicalHistory name patientId');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     res.json({ success: true, data: patient.medicalHistory || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient's doctor view history (for patient dashboard) ─────────────────
// // Called by the patient (not a doctor) to see who viewed their record.
// // We expose this on /doctor route because it reads PatientSummary data.
// router.get('/patient/:patientId/view-history', auth, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     // Allow patient to query their own view history
//     const patient = await User.findOne({ patientId, role: 'patient' });
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const ps = await PatientSummary.findOne({ patientId: patient._id });
//     if (!ps) return res.json({ success: true, data: { viewCount: 0, viewHistory: [] } });

//     res.json({
//       success: true,
//       data: {
//         viewCount: ps.viewCount || 0,
//         viewHistory: (ps.viewHistory || []).slice(-20).reverse(), // last 20, newest first
//       }
//     });
//   } catch (error) {
//     console.error('View history error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient SLM summary (doctor) ─────────────────────────────────────────
// router.get('/patient/:patientId/slm-summary', auth, isDoctor, async (req, res) => {
//   req.setTimeout(120000);
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' });
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     // Return disabled placeholder (same as patient endpoint)
//     res.json({
//       success: true,
//       data: {
//         success: false,
//         summary: 'AI summary generation temporarily disabled.',
//         type: 'general',
//         timestamp: new Date().toISOString(),
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Dashboard stats (basic) ───────────────────────────────────────────────────
// router.get('/dashboard/stats', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id);
//     res.json({
//       success: true,
//       data: {
//         totalPatients: doctor?.patients?.length || 0,
//         patientsToday: 0,
//         pendingReports: 0,
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get doctor dashboard stats (enhanced with DoctorPatientView) ──────────────
// router.get('/dashboard/stats/enhanced', auth, isDoctor, async (req, res) => {
//   try {
//     const doctorId = req.user._id;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     const totalPatients = await DoctorPatientView.countDocuments({ doctorId });
//     const recentPatients = await DoctorPatientView.find({ doctorId })
//       .sort({ lastViewedAt: -1 })
//       .limit(10)
//       .populate('patientId', 'name patientId')
//       .select('patientName patientUniqueId lastViewedAt');

//     const formattedRecentPatients = recentPatients.map(record => ({
//       patientName: record.patientName,
//       patientUniqueId: record.patientUniqueId,
//       lastViewedAt: record.lastViewedAt,
//       patientDetails: record.patientId || null
//     }));

//     res.json({
//       success: true,
//       data: {
//         totalPatients,
//         recentPatients: formattedRecentPatients
//       }
//     });
//   } catch (error) {
//     console.error('Get enhanced stats error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get doctor's patient list (recent from analytics) ─────────────────────────
// // ── Get doctor's patient list (recent from analytics) ─────────────────────────
// router.get('/my-patients', auth, isDoctor, async (req, res) => {
//   try {
//     const doctorId = req.user._id;
//     const limit = parseInt(req.query.limit) || 50;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     const patients = await DoctorPatientView.find({ doctorId })
//       .sort({ lastViewedAt: -1 })
//       .limit(limit)
//       .populate('patientId', 'name patientId email bloodGroup')
//       .select('patientId patientName patientUniqueId lastViewedAt viewCount');

//     // Format the response
//     const formattedPatients = patients.map(record => ({
//       id: record._id,
//       patientId: record.patientId?._id || record.patientUniqueId,
//       patientName: record.patientName,
//       patientUniqueId: record.patientUniqueId,
//       lastViewedAt: record.lastViewedAt,
//       viewCount: record.viewCount,
//       patientDetails: record.patientId || null
//     }));

//     res.json({
//       success: true,
//       data: formattedPatients,
//       count: patients.length
//     });
//   } catch (error) {
//     console.error('Get my patients error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Record patient view (when doctor scans QR or searches) ─────────────────────
// // ── Record patient view (when doctor scans QR or searches) ─────────────────────
// router.post('/record-patient-view', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId, patientName, patientUniqueId } = req.body;

//     // Validate required fields
//     if (!patientId || !patientName || !patientUniqueId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: patientId, patientName, patientUniqueId'
//       });
//     }

//     const doctorId = req.user._id;

//     // IMPORTANT: Convert the display patientId (e.g., "00004") to MongoDB ObjectId
//     // First, find the actual patient document using their display patientId
//     const patient = await User.findOne({ patientId: patientUniqueId, role: 'patient' });

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found with ID: ' + patientUniqueId
//       });
//     }

//     const patientObjectId = patient._id;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     // Find existing record using the MongoDB ObjectId
//     let viewRecord = await DoctorPatientView.findOne({ doctorId, patientId: patientObjectId });

//     if (viewRecord) {
//       // Update existing record
//       viewRecord.viewCount += 1;
//       viewRecord.lastViewedAt = new Date();
//       await viewRecord.save();
//     } else {
//       // Create new record with the MongoDB ObjectId
//       viewRecord = new DoctorPatientView({
//         doctorId,
//         patientId: patientObjectId,  // Use MongoDB ObjectId here
//         patientName,
//         patientUniqueId,
//         viewCount: 1,
//         firstViewedAt: new Date(),
//         lastViewedAt: new Date()
//       });
//       await viewRecord.save();
//     }

//     res.json({ success: true, data: viewRecord });
//   } catch (error) {
//     console.error('Record patient view error:', error);
//     res.status(500).json({ success: false, message: 'Server error: ' + error.message });
//   }
// });
// // ── Schedule endpoint (placeholder) ───────────────────────────────────────────
// router.get('/dashboard/schedule', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// // ── Activity endpoint (placeholder) ───────────────────────────────────────────
// router.get('/dashboard/activity', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// // ── Get all patients (from doctor's patients array) ───────────────────────────
// router.get('/patients', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).populate('patients', 'name patientId email bloodGroup');
//     res.json({ success: true, data: doctor?.patients || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { auth, isDoctor } = require('../middleware/auth');
// const User = require('../models/User');
// const Doctor = require('../models/Doctor');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');
// const PatientSummary = require('../models/PatientSummary');
// const summaryGenerator = require('../services/summaryGenerator');
// const { createSecurityAlert } = require('../services/notification.service');
// const DoctorPatientView = require('../models/DoctorPatientView');

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPER – log that a doctor viewed a patient's record
// // Stores the entry in PatientSummary.viewHistory and bumps viewCount.
// // ─────────────────────────────────────────────────────────────────────────────
// async function logDoctorView(patientMongoId, doctor) {
//   try {
//     const viewEntry = {
//       doctorId: doctor._id,
//       doctorName: doctor.name,
//       specialization: doctor.specialization || 'General',
//       viewedAt: new Date(),
//     };

//     // Upsert PatientSummary and push view entry
//     await PatientSummary.findOneAndUpdate(
//       { patientId: patientMongoId },
//       {
//         $push: { viewHistory: { $each: [viewEntry], $slice: -100 } }, // keep last 100
//         $inc: { viewCount: 1 },
//       },
//       { upsert: true, new: true }
//     );
//   } catch (err) {
//     console.error('⚠️ logDoctorView error (non-fatal):', err.message);
//   }
// }

// // ── Get doctor profile ────────────────────────────────────────────────────────
// router.get('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).select('-password');
//     if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
//     res.json({ success: true, data: doctor });
//   } catch (error) {
//     console.error('Get doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Update doctor profile ─────────────────────────────────────────────────────
// router.put('/profile', auth, isDoctor, async (req, res) => {
//   try {
//     const updates = req.body;
//     delete updates.password;
//     delete updates.role;
//     delete updates.doctorId;
//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id, updates, { new: true, runValidators: true }
//     ).select('-password');
//     res.json({ success: true, message: 'Profile updated successfully', data: doctor });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Update doctor profile (alternative endpoint) ───────────────────────────────
// router.put('/profile/update', auth, isDoctor, async (req, res) => {
//   try {
//     const updates = req.body;
//     const allowedUpdates = ['name', 'email', 'phone', 'specialization', 'qualification',
//       'experience', 'hospitalName', 'hospitalAddress'];

//     const filteredUpdates = {};
//     Object.keys(updates).forEach(key => {
//       if (allowedUpdates.includes(key)) {
//         filteredUpdates[key] = updates[key];
//       }
//     });

//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id,
//       { $set: filteredUpdates },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!doctor) {
//       return res.status(404).json({ success: false, message: 'Doctor not found' });
//     }

//     res.json({ success: true, data: doctor, message: 'Profile updated successfully' });
//   } catch (error) {
//     console.error('Update doctor profile error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Search patient ────────────────────────────────────────────────────────────
// router.get('/patient/search', auth, isDoctor, async (req, res) => {
//   try {
//     const { q } = req.query;
//     if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });
//     const patients = await User.find({
//       role: 'patient',
//       $or: [
//         { patientId: { $regex: q, $options: 'i' } },
//         { name: { $regex: q, $options: 'i' } },
//         { email: { $regex: q, $options: 'i' } },
//       ]
//     }).select('name patientId email bloodGroup qrCode phone address');
//     res.json({ success: true, data: patients });
//   } catch (error) {
//     console.error('Search patient error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient by QR ─────────────────────────────────────────────────────────
// router.get('/patient/qr/:qrData', auth, isDoctor, async (req, res) => {
//   try {
//     const { qrData } = req.params;
//     let extractedPatientId = qrData;
//     try {
//       const parsed = JSON.parse(qrData);
//       if (parsed && typeof parsed === 'object') {
//         extractedPatientId = parsed.pid || parsed.patientId || qrData;
//       }
//     } catch { /* keep as is */ }

//     const patient = await User.findOne({
//       patientId: { $regex: new RegExp('^' + String(extractedPatientId).trim() + '$', 'i') },
//       role: 'patient'
//     }).select('name patientId email bloodGroup qrCode phone address emergencyContact');

//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await Doctor.findByIdAndUpdate(req.user._id, { $addToSet: { patients: patient._id } });
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     // Record view in DoctorPatientView for analytics
//     try {
//       await DoctorPatientView.findOneAndUpdate(
//         { doctorId: doctor._id, patientId: patient._id },
//         {
//           $set: {
//             patientName: patient.name,
//             patientUniqueId: patient.patientId,
//             lastViewedAt: new Date()
//           },
//           $inc: { viewCount: 1 },
//           $setOnInsert: { firstViewedAt: new Date() }
//         },
//         { upsert: true, new: true }
//       );
//     } catch (err) {
//       console.error('Error recording view in analytics:', err);
//     }

//     res.json({ success: true, data: patient });
//   } catch (error) {
//     console.error('Get patient by QR error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient general summary ───────────────────────────────────────────────
// router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     // Record view in DoctorPatientView for analytics
//     try {
//       await DoctorPatientView.findOneAndUpdate(
//         { doctorId: doctor._id, patientId: patient._id },
//         {
//           $set: {
//             patientName: patient.name,
//             patientUniqueId: patient.patientId,
//             lastViewedAt: new Date()
//           },
//           $inc: { viewCount: 1 },
//           $setOnInsert: { firstViewedAt: new Date() }
//         },
//         { upsert: true, new: true }
//       );
//     } catch (err) {
//       console.error('Error recording view in analytics:', err);
//     }

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.general });
//     }
//     res.json({ success: true, data: summaries.general });
//   } catch (error) {
//     console.error('Get patient summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get cardiology summary ────────────────────────────────────────────────────
// router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.cardiology) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.cardiology });
//     }
//     res.json({ success: true, data: summaries.cardiology });
//   } catch (error) {
//     console.error('Get cardiology summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get orthopedic summary ────────────────────────────────────────────────────
// router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries || !summaries.orthopedic) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.orthopedic });
//     }
//     res.json({ success: true, data: summaries.orthopedic });
//   } catch (error) {
//     console.error('Get orthopedic summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get all summaries ─────────────────────────────────────────────────────────
// router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const doctor = await Doctor.findById(req.user._id);
//     await createSecurityAlert(patient._id, doctor);
//     await logDoctorView(patient._id, doctor);

//     const summaries = await summaryGenerator.getPatientSummaries(patient._id);
//     if (!summaries) {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//       const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries });
//     }
//     res.json({ success: true, data: summaries });
//   } catch (error) {
//     console.error('Get all summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Force refresh summaries ───────────────────────────────────────────────────
// router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
//     const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
//     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//     res.json({ success: true, message: 'Summaries refreshed', data: newSummaries });
//   } catch (error) {
//     console.error('Refresh summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient timeline ──────────────────────────────────────────────────────
// router.get('/patient/:patientId/timeline', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' })
//       .select('medicalHistory name patientId');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     res.json({ success: true, data: patient.medicalHistory || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient's doctor view history (for patient dashboard) ─────────────────
// // Called by the patient (not a doctor) to see who viewed their record.
// // We expose this on /doctor route because it reads PatientSummary data.
// router.get('/patient/:patientId/view-history', auth, async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     // Allow patient to query their own view history
//     const patient = await User.findOne({ patientId, role: 'patient' });
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     const ps = await PatientSummary.findOne({ patientId: patient._id });
//     if (!ps) return res.json({ success: true, data: { viewCount: 0, viewHistory: [] } });

//     res.json({
//       success: true,
//       data: {
//         viewCount: ps.viewCount || 0,
//         viewHistory: (ps.viewHistory || []).slice(-20).reverse(), // last 20, newest first
//       }
//     });
//   } catch (error) {
//     console.error('View history error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get patient SLM summary (doctor) ─────────────────────────────────────────
// router.get('/patient/:patientId/slm-summary', auth, isDoctor, async (req, res) => {
//   req.setTimeout(120000);
//   try {
//     const { patientId } = req.params;
//     const patient = await User.findOne({ patientId, role: 'patient' });
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

//     // Return disabled placeholder (same as patient endpoint)
//     res.json({
//       success: true,
//       data: {
//         success: false,
//         summary: 'AI summary generation temporarily disabled.',
//         type: 'general',
//         timestamp: new Date().toISOString(),
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Dashboard stats (basic) ───────────────────────────────────────────────────
// router.get('/dashboard/stats', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id);
//     res.json({
//       success: true,
//       data: {
//         totalPatients: doctor?.patients?.length || 0,
//         patientsToday: 0,
//         pendingReports: 0,
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get doctor dashboard stats (enhanced with DoctorPatientView) ──────────────
// router.get('/dashboard/stats/enhanced', auth, isDoctor, async (req, res) => {
//   try {
//     const doctorId = req.user._id;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     const totalPatients = await DoctorPatientView.countDocuments({ doctorId });
//     const recentPatients = await DoctorPatientView.find({ doctorId })
//       .sort({ lastViewedAt: -1 })
//       .limit(10)
//       .populate('patientId', 'name patientId')
//       .select('patientName patientUniqueId lastViewedAt');

//     const formattedRecentPatients = recentPatients.map(record => ({
//       patientName: record.patientName,
//       patientUniqueId: record.patientUniqueId,
//       lastViewedAt: record.lastViewedAt,
//       patientDetails: record.patientId || null
//     }));

//     res.json({
//       success: true,
//       data: {
//         totalPatients,
//         recentPatients: formattedRecentPatients
//       }
//     });
//   } catch (error) {
//     console.error('Get enhanced stats error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Get doctor's patient list (recent from analytics) ─────────────────────────
// router.get('/my-patients', auth, isDoctor, async (req, res) => {
//   try {
//     const doctorId = req.user._id;
//     const limit = parseInt(req.query.limit) || 50;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     const patients = await DoctorPatientView.find({ doctorId })
//       .sort({ lastViewedAt: -1 })
//       .limit(limit)
//       .populate('patientId', 'name patientId email bloodGroup')
//       .select('patientId patientName patientUniqueId lastViewedAt viewCount');

//     // Format the response
//     const formattedPatients = patients.map(record => ({
//       id: record._id,
//       patientId: record.patientId?._id || record.patientUniqueId,
//       patientName: record.patientName,
//       patientUniqueId: record.patientUniqueId,
//       lastViewedAt: record.lastViewedAt,
//       viewCount: record.viewCount,
//       patientDetails: record.patientId || null
//     }));

//     res.json({
//       success: true,
//       data: formattedPatients,
//       count: patients.length
//     });
//   } catch (error) {
//     console.error('Get my patients error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Record patient view (when doctor scans QR or searches) ─────────────────────
// router.post('/record-patient-view', auth, isDoctor, async (req, res) => {
//   try {
//     const { patientId, patientName, patientUniqueId } = req.body;

//     // Validate required fields
//     if (!patientId || !patientName || !patientUniqueId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: patientId, patientName, patientUniqueId'
//       });
//     }

//     const doctorId = req.user._id;

//     // IMPORTANT: Convert the display patientId (e.g., "00004") to MongoDB ObjectId
//     // First, find the actual patient document using their display patientId
//     const patient = await User.findOne({ patientId: patientUniqueId, role: 'patient' });

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found with ID: ' + patientUniqueId
//       });
//     }

//     const patientObjectId = patient._id;
//     const DoctorPatientView = require('../models/DoctorPatientView');

//     // Find existing record using the MongoDB ObjectId
//     let viewRecord = await DoctorPatientView.findOne({ doctorId, patientId: patientObjectId });

//     if (viewRecord) {
//       // Update existing record
//       viewRecord.viewCount += 1;
//       viewRecord.lastViewedAt = new Date();
//       await viewRecord.save();
//     } else {
//       // Create new record with the MongoDB ObjectId
//       viewRecord = new DoctorPatientView({
//         doctorId,
//         patientId: patientObjectId,  // Use MongoDB ObjectId here
//         patientName,
//         patientUniqueId,
//         viewCount: 1,
//         firstViewedAt: new Date(),
//         lastViewedAt: new Date()
//       });
//       await viewRecord.save();
//     }

//     // Also record in the doctor's patients array if not already there
//     await Doctor.findByIdAndUpdate(doctorId, { $addToSet: { patients: patientObjectId } });

//     res.json({ success: true, data: viewRecord });
//   } catch (error) {
//     console.error('Record patient view error:', error);
//     res.status(500).json({ success: false, message: 'Server error: ' + error.message });
//   }
// });

// // ── Schedule endpoint (placeholder) ───────────────────────────────────────────
// router.get('/dashboard/schedule', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// // ── Activity endpoint (placeholder) ───────────────────────────────────────────
// router.get('/dashboard/activity', auth, isDoctor, async (req, res) => {
//   res.json({ success: true, data: [] });
// });

// // ── Get all patients (from doctor's patients array) ───────────────────────────
// router.get('/patients', auth, isDoctor, async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).populate('patients', 'name patientId email bloodGroup');
//     res.json({ success: true, data: doctor?.patients || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
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
const PatientSummary = require('../models/PatientSummary');
const summaryGenerator = require('../services/summaryGenerator');
const { createSecurityAlert } = require('../services/notification.service');
const DoctorPatientView = require('../models/DoctorPatientView');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER – log that a doctor viewed a patient's record
// Stores the entry in PatientSummary.viewHistory and bumps viewCount.
// ─────────────────────────────────────────────────────────────────────────────
async function logDoctorView(patientMongoId, doctor) {
  try {
    const viewEntry = {
      doctorId: doctor._id,
      doctorName: doctor.name,
      specialization: doctor.specialization || 'General',
      viewedAt: new Date(),
    };

    // Upsert PatientSummary and push view entry
    await PatientSummary.findOneAndUpdate(
      { patientId: patientMongoId },
      {
        $push: { viewHistory: { $each: [viewEntry], $slice: -100 } },
        $inc: { viewCount: 1 },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('⚠️ logDoctorView error (non-fatal):', err.message);
  }
}

// ── Get doctor profile ────────────────────────────────────────────────────────
router.get('/profile', auth, isDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id).select('-password');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Update doctor profile ─────────────────────────────────────────────────────
router.put('/profile', auth, isDoctor, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.role;
    delete updates.doctorId;
    const doctor = await Doctor.findByIdAndUpdate(
      req.user._id, updates, { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, message: 'Profile updated successfully', data: doctor });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Update doctor profile (alternative endpoint) ───────────────────────────────
router.put('/profile/update', auth, isDoctor, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'email', 'phone', 'specialization', 'qualification',
      'experience', 'hospitalName', 'hospitalAddress'];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const doctor = await Doctor.findByIdAndUpdate(
      req.user._id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, data: doctor, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Search patient ────────────────────────────────────────────────────────────
router.get('/patient/search', auth, isDoctor, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });
    const patients = await User.find({
      role: 'patient',
      $or: [
        { patientId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }).select('name patientId email bloodGroup qrCode phone address');
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Get patient by QR ─────────────────────────────────────────────────────────
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
    }).select('name patientId email bloodGroup qrCode phone address emergencyContact');

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = await Doctor.findById(req.user._id);
    await Doctor.findByIdAndUpdate(req.user._id, { $addToSet: { patients: patient._id } });
    await createSecurityAlert(patient._id, doctor);
    await logDoctorView(patient._id, doctor);

    // Record view in DoctorPatientView for analytics
    try {
      await DoctorPatientView.findOneAndUpdate(
        { doctorId: doctor._id, patientId: patient._id },
        {
          $set: {
            patientName: patient.name,
            patientUniqueId: patient.patientId,
            lastViewedAt: new Date()
          },
          $inc: { viewCount: 1 },
          $setOnInsert: { firstViewedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('Error recording view in analytics:', err);
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Get patient by QR error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Get patient general summary (FIXED: removed duplicate DoctorPatientView update) ──
router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor);
    await logDoctorView(patient._id, doctor);

    // ✅ REMOVED duplicate DoctorPatientView update - view count only increments once in search/QR

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

// ── Get cardiology summary (FIXED: removed duplicate DoctorPatientView update) ──
router.get('/patient/:patientId/cardiology-summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor);
    await logDoctorView(patient._id, doctor);

    // ✅ REMOVED duplicate DoctorPatientView update

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

// ── Get orthopedic summary (FIXED: removed duplicate DoctorPatientView update) ──
router.get('/patient/:patientId/orthopedic-summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor);
    await logDoctorView(patient._id, doctor);

    // ✅ REMOVED duplicate DoctorPatientView update

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

// ── Get all summaries ─────────────────────────────────────────────────────────
router.get('/patient/:patientId/all-summaries', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = await Doctor.findById(req.user._id);
    await createSecurityAlert(patient._id, doctor);
    await logDoctorView(patient._id, doctor);

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

// ── Force refresh summaries ───────────────────────────────────────────────────
router.post('/patient/:patientId/refresh-summaries', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' }).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
    const allDocs = await ProcessedDocument.find({ userId: patient._id }).sort({ processedAt: -1 });
    const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
    res.json({ success: true, message: 'Summaries refreshed', data: newSummaries });
  } catch (error) {
    console.error('Refresh summaries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Get patient timeline ──────────────────────────────────────────────────────
router.get('/patient/:patientId/timeline', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' })
      .select('medicalHistory name patientId');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient.medicalHistory || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Get patient's doctor view history (for patient dashboard) ─────────────────
router.get('/patient/:patientId/view-history', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const ps = await PatientSummary.findOne({ patientId: patient._id });
    if (!ps) return res.json({ success: true, data: { viewCount: 0, viewHistory: [] } });

    res.json({
      success: true,
      data: {
        viewCount: ps.viewCount || 0,
        viewHistory: (ps.viewHistory || []).slice(-20).reverse(),
      }
    });
  } catch (error) {
    console.error('View history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Get patient SLM summary (doctor) ─────────────────────────────────────────
router.get('/patient/:patientId/slm-summary', auth, isDoctor, async (req, res) => {
  req.setTimeout(120000);
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ patientId, role: 'patient' });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.json({
      success: true,
      data: {
        success: false,
        summary: 'AI summary generation temporarily disabled.',
        type: 'general',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Dashboard stats (basic) ───────────────────────────────────────────────────
router.get('/dashboard/stats', auth, isDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    res.json({
      success: true,
      data: {
        totalPatients: doctor?.patients?.length || 0,
        patientsToday: 0,
        pendingReports: 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Get doctor dashboard stats (enhanced with DoctorPatientView) ──────────────
router.get('/dashboard/stats/enhanced', auth, isDoctor, async (req, res) => {
  try {
    const doctorId = req.user._id;

    const totalPatients = await DoctorPatientView.countDocuments({ doctorId });
    const recentPatients = await DoctorPatientView.find({ doctorId })
      .sort({ lastViewedAt: -1 })
      .limit(10)
      .populate('patientId', 'name patientId')
      .select('patientName patientUniqueId lastViewedAt viewCount');

    const formattedRecentPatients = recentPatients.map(record => ({
      patientName: record.patientName,
      patientUniqueId: record.patientUniqueId,
      lastViewedAt: record.lastViewedAt,
      viewCount: record.viewCount,
      patientDetails: record.patientId || null
    }));

    res.json({
      success: true,
      data: {
        totalPatients,
        recentPatients: formattedRecentPatients
      }
    });
  } catch (error) {
    console.error('Get enhanced stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Get doctor's patient list ─────────────────────────────────────────────────
router.get('/my-patients', auth, isDoctor, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;

    const patients = await DoctorPatientView.find({ doctorId })
      .sort({ lastViewedAt: -1 })
      .limit(limit)
      .populate('patientId', 'name patientId email bloodGroup')
      .select('patientId patientName patientUniqueId lastViewedAt viewCount');

    const formattedPatients = patients.map(record => ({
      id: record._id,
      patientId: record.patientId?._id || record.patientUniqueId,
      patientName: record.patientName,
      patientUniqueId: record.patientUniqueId,
      lastViewedAt: record.lastViewedAt,
      viewCount: record.viewCount,
      patientDetails: record.patientId || null
    }));

    res.json({
      success: true,
      data: formattedPatients,
      count: patients.length
    });
  } catch (error) {
    console.error('Get my patients error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Record patient view (when doctor scans QR or searches) ─────────────────────
router.post('/record-patient-view', auth, isDoctor, async (req, res) => {
  try {
    const { patientId, patientName, patientUniqueId } = req.body;

    if (!patientId || !patientName || !patientUniqueId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientId, patientName, patientUniqueId'
      });
    }

    const doctorId = req.user._id;

    // Convert display patientId to MongoDB ObjectId
    const patient = await User.findOne({ patientId: patientUniqueId, role: 'patient' });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with ID: ' + patientUniqueId
      });
    }

    const patientObjectId = patient._id;

    let viewRecord = await DoctorPatientView.findOne({ doctorId, patientId: patientObjectId });

    if (viewRecord) {
      viewRecord.viewCount += 1;
      viewRecord.lastViewedAt = new Date();
      await viewRecord.save();
    } else {
      viewRecord = new DoctorPatientView({
        doctorId,
        patientId: patientObjectId,
        patientName,
        patientUniqueId,
        viewCount: 1,
        firstViewedAt: new Date(),
        lastViewedAt: new Date()
      });
      await viewRecord.save();
    }

    await Doctor.findByIdAndUpdate(doctorId, { $addToSet: { patients: patientObjectId } });

    res.json({ success: true, data: viewRecord });
  } catch (error) {
    console.error('Record patient view error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── Schedule endpoint ─────────────────────────────────────────────────────────
router.get('/dashboard/schedule', auth, isDoctor, async (req, res) => {
  res.json({ success: true, data: [] });
});

// ── Activity endpoint ─────────────────────────────────────────────────────────
router.get('/dashboard/activity', auth, isDoctor, async (req, res) => {
  res.json({ success: true, data: [] });
});

// ── Get all patients (from doctor's patients array) ───────────────────────────
router.get('/patients', auth, isDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id).populate('patients', 'name patientId email bloodGroup');
    res.json({ success: true, data: doctor?.patients || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;