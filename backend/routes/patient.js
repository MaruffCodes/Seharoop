// const express = require('express');
// const router = express.Router();
// const { auth, isPatient } = require('../middleware/auth');
// const User = require('../models/User');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');
// const PatientSummary = require('../models/PatientSummary');
// const QRCode = require('qrcode');
// const summaryGenerator = require('../services/summaryGenerator');
// const Notification = require('../models/Notification');

// // Helper function to optimize summary for QR code
// function optimizeSummaryForQR(summary, specialty) {
//   if (!summary) return { error: 'No summary data' };

//   try {
//     // Create a minimal version of the summary for QR code
//     const optimized = {
//       pid: summary.patientDemographics?.patientId || summary.patientInfo?.patientId,
//       n: summary.patientDemographics?.name || summary.patientInfo?.name,
//       bg: summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup,
//       lu: new Date().toISOString().split('T')[0], // Just date, not full timestamp
//       type: specialty
//     };

//     // Add minimal medical data based on specialty
//     if (specialty === 'general') {
//       optimized.dx = (summary.diagnoses || []).slice(0, 5);
//       optimized.rx = (summary.currentMedications || []).slice(0, 5);
//       optimized.alg = (summary.allergies || []).map(a => typeof a === 'string' ? a : a.name).slice(0, 5);
//     } else if (specialty === 'cardiology') {
//       optimized.cdx = (summary.cardiacDiagnoses || []).slice(0, 5);
//       optimized.crx = (summary.cardiacMedications || []).slice(0, 5);
//       if (summary.vitals) {
//         optimized.v = {
//           bp: summary.vitals.bloodPressure,
//           hr: summary.vitals.heartRate
//         };
//       }
//     } else if (specialty === 'orthopedic') {
//       optimized.odx = (summary.orthopedicDiagnoses || []).slice(0, 5);
//       optimized.om = (summary.orthopedicMedications || []).slice(0, 5);
//       optimized.ms = summary.mobilityStatus;
//     }

//     return optimized;
//   } catch (error) {
//     console.error('Error optimizing summary for QR:', error);
//     return { error: 'Failed to optimize summary' };
//   }
// }

// // Get patient profile
// router.get('/profile', auth, isPatient, async (req, res) => {
//   try {
//     const patient = await User.findById(req.user._id).select('-password');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

//     res.json({
//       success: true,
//       data: {
//         ...patient.toObject(),
//         hasMedicalForm: !!medicalForm,
//         medicalFormStatus: medicalForm?.completionStatus
//       }
//     });
//   } catch (error) {
//     console.error('Get patient profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Update patient profile
// // Update patient profile
// router.put('/profile', auth, isPatient, async (req, res) => {
//   try {
//     const updates = req.body;

//     // Remove fields that shouldn't be updated
//     delete updates.password;
//     delete updates.role;
//     delete updates.patientId;
//     delete updates._id;
//     delete updates.__v;
//     delete updates.createdAt;
//     delete updates.updatedAt;

//     // Handle empty strings for enum fields
//     if (updates.gender === '') {
//       updates.gender = null;
//     }
//     if (updates.bloodGroup === '') {
//       updates.bloodGroup = null;
//     }
//     if (updates.diabetesType === '') {
//       updates.diabetesType = null;
//     }
//     if (updates.thyroidCondition === '') {
//       updates.thyroidCondition = null;
//     }

//     // Handle address object if present
//     if (updates.address) {
//       Object.keys(updates.address).forEach(key => {
//         if (updates.address[key] === '') {
//           updates.address[key] = null;
//         }
//       });
//     }

//     const patient = await User.findByIdAndUpdate(
//       req.user._id,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: 'Patient not found'
//       });
//     }

//     // Refresh QR code after profile update
//     try {
//       const QRCode = require('qrcode');
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

//       const qrData = {
//         pid: patient.patientId,
//         n: patient.name,
//         bg: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'U',
//         lu: new Date().toISOString().split('T')[0]
//       };

//       const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
//       patient.qrCode = qrCode;
//       await patient.save();
//     } catch (qrError) {
//       console.log('QR refresh after profile update failed:', qrError.message);
//     }

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: patient
//     });
//   } catch (error) {
//     console.error('Update patient profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error: ' + error.message
//     });
//   }
// });

// // Get patient history/timeline
// router.get('/history', auth, isPatient, async (req, res) => {
//   try {
//     const patient = await User.findById(req.user._id)
//       .select('medicalHistory name patientId');

//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

//     const timeline = [];

//     if (medicalForm?.completionStatus?.completionDate) {
//       timeline.push({
//         date: medicalForm.completionStatus.completionDate,
//         type: 'form_submission',
//         title: 'Medical Form Completed',
//         description: 'Initial medical information submitted',
//         data: medicalForm
//       });
//     }

//     if (patient?.medicalHistory) {
//       patient.medicalHistory.forEach(yearData => {
//         yearData.months?.forEach(monthData => {
//           monthData.records?.forEach(record => {
//             timeline.push({
//               date: record.date,
//               type: record.type,
//               title: record.description,
//               description: `${monthData.month} ${yearData.year}`,
//               documents: record.documents,
//               data: record
//             });
//           });
//         });
//       });
//     }

//     timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

//     res.json({
//       success: true,
//       data: timeline
//     });
//   } catch (error) {
//     console.error('Get patient history error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get all summaries for patient (consolidated endpoint)
// router.get('/summaries', auth, isPatient, async (req, res) => {
//   try {
//     let patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

//     if (!patientSummary) {
//       // Generate fresh summaries if none exist
//       console.log('📊 No cached summaries found, generating fresh ones...');
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const documents = await ProcessedDocument.find({ userId: req.user._id })
//         .sort({ processedAt: -1 });

//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//         patient,
//         medicalForm,
//         documents
//       );

//       return res.json({
//         success: true,
//         data: newSummaries
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         general: patientSummary.generalSummary,
//         cardiology: patientSummary.cardiologySummary,
//         orthopedic: patientSummary.orthopedicSummary,
//         slmSummaries: patientSummary.slmSummaries,
//         lastUpdated: patientSummary.lastUpdated,
//         documentCount: patientSummary.documentCount,
//         version: patientSummary.version
//       }
//     });
//   } catch (error) {
//     console.error('Error getting summaries:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get patient general summary
// router.get('/summary', auth, isPatient, async (req, res) => {
//   try {
//     const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

//     if (!patientSummary || !patientSummary.generalSummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id })
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
//       data: patientSummary.generalSummary
//     });
//   } catch (error) {
//     console.error('Get patient summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get cardiology summary
// router.get('/summary/cardiology', auth, isPatient, async (req, res) => {
//   try {
//     const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

//     if (!patientSummary || !patientSummary.cardiologySummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id })
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
//       data: patientSummary.cardiologySummary
//     });
//   } catch (error) {
//     console.error('Get cardiology summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get orthopedic summary
// router.get('/summary/orthopedic', auth, isPatient, async (req, res) => {
//   try {
//     const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

//     if (!patientSummary || !patientSummary.orthopedicSummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id })
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
//       data: patientSummary.orthopedicSummary
//     });
//   } catch (error) {
//     console.error('Get orthopedic summary error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Get all summaries at once (alias for /summaries)
// router.get('/all-summaries', auth, isPatient, async (req, res) => {
//   try {
//     const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

//     if (!patientSummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id })
//         .sort({ processedAt: -1 });

//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//         patient,
//         medicalForm,
//         allDocs
//       );

//       return res.json({
//         success: true,
//         data: newSummaries
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         general: patientSummary.generalSummary,
//         cardiology: patientSummary.cardiologySummary,
//         orthopedic: patientSummary.orthopedicSummary,
//         slmSummaries: patientSummary.slmSummaries
//       }
//     });
//   } catch (error) {
//     console.error('Get all summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Force refresh summaries
// router.post('/refresh-summaries', auth, isPatient, async (req, res) => {
//   try {
//     console.log(`🔄 Force refreshing summaries for user: ${req.user._id}`);

//     const patient = await User.findById(req.user._id);
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//     const allDocs = await ProcessedDocument.find({ userId: req.user._id })
//       .sort({ processedAt: -1 });

//     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//       patient,
//       medicalForm,
//       allDocs
//     );

//     res.json({
//       success: true,
//       message: 'Summaries refreshed successfully',
//       data: newSummaries
//     });
//   } catch (error) {
//     console.error('Refresh summaries error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Update patient QR code with rich medical data
// router.post('/refresh-qr', auth, isPatient, async (req, res) => {
//   try {
//     const patient = await User.findById(req.user._id).select('-password');
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//     const recentDocs = await ProcessedDocument.find({ userId: req.user._id })
//       .sort({ processedAt: -1 })
//       .limit(20);

//     const allDiagnoses = new Set();
//     const allMedications = new Set();
//     const allAllergies = new Set();
//     const allLabResults = new Set();

//     recentDocs.forEach(doc => {
//       doc.diagnoses?.forEach(d => allDiagnoses.add(d));
//       doc.medications?.forEach(m => allMedications.add(m));
//       doc.allergies?.forEach(a => allAllergies.add(a));
//       doc.labResults?.forEach(l => allLabResults.add(l));
//     });

//     const qrData = {
//       pid: patient.patientId,
//       n: patient.name,
//       bg: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'U',
//       lu: new Date().toISOString().split('T')[0],
//       stats: {
//         d: recentDocs.length,
//         dx: Array.from(allDiagnoses).slice(0, 5),
//         rx: Array.from(allMedications).slice(0, 5),
//         alg: Array.from(allAllergies).slice(0, 5)
//       }
//     };

//     let qrCode;
//     try {
//       qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
//         errorCorrectionLevel: 'L',
//         margin: 1,
//         width: 300
//       });
//     } catch (qrError) {
//       console.log('QR too large, creating even smaller version');
//       const smallerData = {
//         pid: patient.patientId,
//         n: patient.name.substring(0, 15),
//         bg: patient.bloodGroup || 'U',
//         lu: new Date().toISOString().split('T')[0],
//         dc: recentDocs.length
//       };
//       qrCode = await QRCode.toDataURL(JSON.stringify(smallerData));
//     }

//     const patient_updated = await User.findByIdAndUpdate(
//       req.user._id,
//       { qrCode },
//       { new: true }
//     ).select('-password');

//     console.log('✅ QR code refreshed with medical data');

//     res.json({
//       success: true,
//       message: 'QR code refreshed successfully',
//       data: {
//         qrCode: patient_updated.qrCode,
//         summary: qrData
//       }
//     });
//   } catch (error) {
//     console.error('Refresh QR code error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Get QR code for specific specialty
// router.post('/qr/:specialty', auth, isPatient, async (req, res) => {
//   try {
//     const { specialty } = req.params;
//     const patientSummary = await PatientSummary.findOne({ patientId: req.user._id });

//     if (!patientSummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id })
//         .sort({ processedAt: -1 });

//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(
//         patient,
//         medicalForm,
//         allDocs
//       );

//       let summary;
//       switch (specialty) {
//         case 'cardiology':
//           summary = newSummaries.cardiology;
//           break;
//         case 'orthopedic':
//           summary = newSummaries.orthopedic;
//           break;
//         default:
//           summary = newSummaries.general;
//       }

//       const optimizedSummary = optimizeSummaryForQR(summary, specialty);

//       const qrCode = await QRCode.toDataURL(JSON.stringify(optimizedSummary), {
//         errorCorrectionLevel: 'L',
//         margin: 1,
//         width: 300
//       });

//       return res.json({
//         success: true,
//         data: { qrCode, summary: optimizedSummary, specialty }
//       });
//     }

//     let summary;
//     switch (specialty) {
//       case 'cardiology':
//         summary = patientSummary.cardiologySummary;
//         break;
//       case 'orthopedic':
//         summary = patientSummary.orthopedicSummary;
//         break;
//       default:
//         summary = patientSummary.generalSummary;
//     }

//     const optimizedSummary = optimizeSummaryForQR(summary, specialty);

//     const qrCode = await QRCode.toDataURL(JSON.stringify(optimizedSummary), {
//       errorCorrectionLevel: 'L',
//       margin: 1,
//       width: 300
//     });

//     res.json({
//       success: true,
//       data: {
//         qrCode,
//         summary: optimizedSummary,
//         specialty
//       }
//     });
//   } catch (error) {
//     console.error('Generate specialty QR error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error: ' + error.message
//     });
//   }
// });

// // Get patient's own SLM-generated summary
// router.get('/slm-summary', auth, isPatient, async (req, res) => {
//   req.setTimeout(120000); // Increase to 120 seconds

//   try {
//     const patientId = req.user._id;
//     const patient = await User.findById(patientId).select('-password');
//     const medicalForm = await PatientMedicalForm.findOne({ patientId });

//     const recentDocs = await ProcessedDocument.find({ userId: patientId })
//       .sort({ processedAt: -1 })
//       .limit(50);

//     const patientData = {
//       name: patient.name,
//       patientId: patient.patientId,
//       age: medicalForm?.personalInfo?.dateOfBirth
//         ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
//         : null,
//       gender: medicalForm?.personalInfo?.gender || null,
//       bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || null,
//       email: patient.email,
//       phone: medicalForm?.personalInfo?.phone || null,
//       address: medicalForm?.personalInfo?.address ?
//         `${medicalForm.personalInfo.address.street || ''}, ${medicalForm.personalInfo.address.city || ''}, ${medicalForm.personalInfo.address.state || ''} ${medicalForm.personalInfo.address.pincode || ''}`.trim() : null
//     };

//     const allDiagnoses = new Set();
//     const allMedications = new Set();
//     const allLabResults = new Set();
//     const allAllergies = new Set();
//     const allChronicDiseases = new Set();
//     const allComorbidConditions = new Set();
//     const allPastSurgeries = [];

//     recentDocs.forEach(doc => {
//       if (doc.diagnoses) doc.diagnoses.forEach(d => allDiagnoses.add(d));
//       if (doc.medications) doc.medications.forEach(m => allMedications.add(m));
//       if (doc.labResults) doc.labResults.forEach(l => allLabResults.add(l));
//       if (doc.allergies) doc.allergies.forEach(a => allAllergies.add(a));
//     });

//     if (medicalForm) {
//       if (medicalForm.medicalConditions?.chronicDiseases) {
//         medicalForm.medicalConditions.chronicDiseases.forEach(d => allChronicDiseases.add(d));
//       }
//       if (medicalForm.medicalConditions?.comorbidConditions) {
//         medicalForm.medicalConditions.comorbidConditions.forEach(c => allComorbidConditions.add(c));
//       }
//       if (medicalForm.medicalConditions?.medicationAllergies) {
//         medicalForm.medicalConditions.medicationAllergies.forEach(a => allAllergies.add(a.medication));
//       }
//       if (medicalForm.surgicalHistory?.pastSurgeries) {
//         medicalForm.surgicalHistory.pastSurgeries.forEach(s => {
//           allPastSurgeries.push({
//             name: s.surgery,
//             date: s.date ? new Date(s.date).toLocaleDateString() : null,
//             hospital: s.hospital
//           });
//         });
//       }
//     }

//     const extractedData = {
//       diagnoses: Array.from(allDiagnoses),
//       medications: Array.from(allMedications),
//       labResults: Array.from(allLabResults),
//       allergies: Array.from(allAllergies),
//       chronicDiseases: Array.from(allChronicDiseases),
//       comorbidConditions: Array.from(allComorbidConditions),
//       pastSurgeries: allPastSurgeries
//     };

//     const slmClient = require('../services/slmClient');

//     const timeoutPromise = new Promise((_, reject) => {
//       setTimeout(() => reject(new Error('SLM generation timeout')), 110000);
//     });

//     const slmSummary = await Promise.race([
//       slmClient.generateSummary(patientData, extractedData, 'general'),
//       timeoutPromise
//     ]);

//     res.json({
//       success: true,
//       data: slmSummary
//     });

//   } catch (error) {
//     console.error('Error generating SLM summary:', error);

//     res.json({
//       success: true,
//       data: {
//         success: false,
//         summary: "AI summary generation is taking longer than expected. Please try again in a few moments.",
//         type: "general",
//         timestamp: new Date().toISOString()
//       }
//     });
//   }
// });

// router.get('/notifications', auth, isPatient, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ userId: req.user._id })
//       .sort({ createdAt: -1 })
//       .limit(50)
//       .lean();

//     res.json({ success: true, data: notifications });
//   } catch (error) {
//     console.error('Get notifications error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Mark notification as read
// router.put('/notifications/:id/read', auth, isPatient, async (req, res) => {
//   try {
//     const result = await Notification.updateOne(
//       { _id: req.params.id, userId: req.user._id },
//       { $set: { read: true } }
//     );
//     if (result.matchedCount === 0) {
//       return res.status(404).json({ success: false, message: 'Notification not found' });
//     }
//     res.json({ success: true, message: 'Notification marked as read' });
//   } catch (error) {
//     console.error('Mark notification read error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const path = require('path');
// const { auth, isPatient } = require('../middleware/auth');
// const User = require('../models/User');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');
// const PatientSummary = require('../models/PatientSummary');
// const ProcessingQueue = require('../models/ProcessingQueue');
// const QRCode = require('qrcode');
// const summaryGenerator = require('../services/summaryGenerator');
// const Notification = require('../models/Notification');

// // ── Helper ────────────────────────────────────────────────────────────────────
// function optimizeSummaryForQR(summary, specialty) {
//   if (!summary) return { error: 'No summary data' };
//   try {
//     const optimized = {
//       pid: summary.patientDemographics?.patientId || summary.patientInfo?.patientId,
//       n: summary.patientDemographics?.name || summary.patientInfo?.name,
//       bg: summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup,
//       lu: new Date().toISOString().split('T')[0],
//       type: specialty
//     };
//     if (specialty === 'general') {
//       optimized.dx = (summary.diagnoses || []).slice(0, 5);
//       optimized.rx = (summary.currentMedications || []).slice(0, 5);
//       optimized.alg = (summary.allergies || []).map(a => typeof a === 'string' ? a : a.name).slice(0, 5);
//     } else if (specialty === 'cardiology') {
//       optimized.cdx = (summary.cardiacDiagnoses || []).slice(0, 5);
//       optimized.crx = (summary.cardiacMedications || []).slice(0, 5);
//       if (summary.vitals) optimized.v = { bp: summary.vitals.bloodPressure, hr: summary.vitals.heartRate };
//     } else if (specialty === 'orthopedic') {
//       optimized.odx = (summary.orthopedicDiagnoses || []).slice(0, 5);
//       optimized.om = (summary.orthopedicMedications || []).slice(0, 5);
//       optimized.ms = summary.mobilityStatus;
//     }
//     return optimized;
//   } catch (error) {
//     return { error: 'Failed to optimize summary' };
//   }
// }

// // ── Profile ───────────────────────────────────────────────────────────────────
// router.get('/profile', auth, isPatient, async (req, res) => {
//   try {
//     const patient = await User.findById(req.user._id).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//     res.json({
//       success: true,
//       data: { ...patient.toObject(), hasMedicalForm: !!medicalForm, medicalFormStatus: medicalForm?.completionStatus }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.put('/profile', auth, isPatient, async (req, res) => {
//   try {
//     const updates = req.body;
//     delete updates.password; delete updates.role; delete updates.patientId;
//     delete updates._id; delete updates.__v; delete updates.createdAt; delete updates.updatedAt;
//     if (updates.gender === '') updates.gender = null;
//     if (updates.bloodGroup === '') updates.bloodGroup = null;
//     if (updates.diabetesType === '') updates.diabetesType = null;
//     if (updates.thyroidCondition === '') updates.thyroidCondition = null;
//     if (updates.address) {
//       Object.keys(updates.address).forEach(k => { if (updates.address[k] === '') updates.address[k] = null; });
//     }
//     const patient = await User.findByIdAndUpdate(
//       req.user._id, { $set: updates }, { new: true, runValidators: true }
//     ).select('-password');
//     if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
//     try {
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const qrData = { pid: patient.patientId, n: patient.name, bg: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'U', lu: new Date().toISOString().split('T')[0] };
//       patient.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
//       await patient.save();
//     } catch { }
//     res.json({ success: true, message: 'Profile updated successfully', data: patient });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error: ' + error.message });
//   }
// });

// // ── History / Timeline ────────────────────────────────────────────────────────
// router.get('/history', auth, isPatient, async (req, res) => {
//   try {
//     const patient = await User.findById(req.user._id).select('medicalHistory name patientId');
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//     const timeline = [];
//     if (medicalForm?.completionStatus?.completionDate) {
//       timeline.push({ date: medicalForm.completionStatus.completionDate, type: 'form_submission', title: 'Medical Form Completed', description: 'Initial medical information submitted', data: medicalForm });
//     }
//     if (patient?.medicalHistory) {
//       patient.medicalHistory.forEach(yr =>
//         yr.months?.forEach(mo =>
//           mo.records?.forEach(rec => {
//             timeline.push({ date: rec.date, type: rec.type, title: rec.description, description: `${mo.month} ${yr.year}`, documents: rec.documents, data: rec });
//           })
//         )
//       );
//     }
//     timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
//     res.json({ success: true, data: timeline });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Reports (list of uploaded documents with file URL) ────────────────────────
// // Returns all ProcessedDocuments for the patient — richer than history records.
// router.get('/my-reports', auth, isPatient, async (req, res) => {
//   try {
//     const docs = await ProcessedDocument.find({ userId: req.user._id })
//       .sort({ processedAt: -1 })
//       .select('fileName fileType fileSize fileId processingStatus processedAt summary diagnoses medications allergies');

//     const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

//     const reports = docs.map(doc => {
//       const ext = doc.fileName ? doc.fileName.split('.').pop() : '';
//       const fileUrl = `${BASE_URL}/api/files/${doc.fileId}`;
//       return {
//         id: doc._id,
//         fileId: doc.fileId,
//         name: doc.fileName,
//         type: doc.fileType,
//         size: doc.fileSize,
//         status: doc.processingStatus,
//         uploadDate: doc.processedAt,
//         fileUrl,                          // ← use this to open/view the file
//         summary: doc.summary || '',
//         extractedData: {
//           diagnoses: doc.diagnoses || [],
//           medications: (doc.medications || []).map(m => m?.name || m),
//           allergies: (doc.allergies || []).map(a => a?.name || a),
//         },
//       };
//     });

//     res.json({ success: true, data: reports });
//   } catch (error) {
//     console.error('my-reports error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Upload count (real-time, includes queued + processed) ────────────────────
// router.get('/upload-count', auth, isPatient, async (req, res) => {
//   try {
//     const [processed, queued] = await Promise.all([
//       ProcessedDocument.countDocuments({ userId: req.user._id }),
//       ProcessingQueue.countDocuments({
//         userId: req.user._id,
//         status: { $in: ['pending', 'processing'] }
//       }),
//     ]);
//     res.json({ success: true, data: { processed, queued, total: processed + queued } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Doctor view history (patient reads who viewed their record) ───────────────
// router.get('/view-history', auth, isPatient, async (req, res) => {
//   try {
//     const ps = await PatientSummary.findOne({ patientId: req.user._id });
//     if (!ps) return res.json({ success: true, data: { viewCount: 0, viewHistory: [] } });
//     res.json({
//       success: true,
//       data: {
//         viewCount: ps.viewCount || 0,
//         viewHistory: (ps.viewHistory || []).slice(-20).reverse(),
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Summaries ─────────────────────────────────────────────────────────────────
// router.get('/summaries', auth, isPatient, async (req, res) => {
//   try {
//     let ps = await PatientSummary.findOne({ patientId: req.user._id });
//     if (!ps) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const documents = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, documents);
//       return res.json({ success: true, data: newSummaries });
//     }
//     res.json({ success: true, data: { general: ps.generalSummary, cardiology: ps.cardiologySummary, orthopedic: ps.orthopedicSummary, slmSummaries: ps.slmSummaries, lastUpdated: ps.lastUpdated, documentCount: ps.documentCount, version: ps.version } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.get('/summary', auth, isPatient, async (req, res) => {
//   try {
//     const ps = await PatientSummary.findOne({ patientId: req.user._id });
//     if (!ps || !ps.generalSummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.general });
//     }
//     res.json({ success: true, data: ps.generalSummary });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.get('/summary/cardiology', auth, isPatient, async (req, res) => {
//   try {
//     const ps = await PatientSummary.findOne({ patientId: req.user._id });
//     if (!ps || !ps.cardiologySummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.cardiology });
//     }
//     res.json({ success: true, data: ps.cardiologySummary });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.get('/summary/orthopedic', auth, isPatient, async (req, res) => {
//   try {
//     const ps = await PatientSummary.findOne({ patientId: req.user._id });
//     if (!ps || !ps.orthopedicSummary) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries.orthopedic });
//     }
//     res.json({ success: true, data: ps.orthopedicSummary });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.get('/all-summaries', auth, isPatient, async (req, res) => {
//   try {
//     const ps = await PatientSummary.findOne({ patientId: req.user._id });
//     if (!ps) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       return res.json({ success: true, data: newSummaries });
//     }
//     res.json({ success: true, data: { general: ps.generalSummary, cardiology: ps.cardiologySummary, orthopedic: ps.orthopedicSummary, slmSummaries: ps.slmSummaries } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.post('/refresh-summaries', auth, isPatient, async (req, res) => {
//   try {
//     console.log(`🔄 Force refreshing summaries for user: ${req.user._id}`);
//     const patient = await User.findById(req.user._id);
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//     const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
//     const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//     res.json({ success: true, message: 'Summaries refreshed successfully', data: newSummaries });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── QR Code ───────────────────────────────────────────────────────────────────
// router.post('/refresh-qr', auth, isPatient, async (req, res) => {
//   try {
//     const patient = await User.findById(req.user._id).select('-password');
//     const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//     const recentDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 }).limit(20);

//     const allDiagnoses = new Set(), allMeds = new Map(), allAllergies = new Set(), allLab = new Set();
//     recentDocs.forEach(doc => {
//       doc.diagnoses?.forEach(d => allDiagnoses.add(d));
//       doc.medications?.forEach(m => { const n = m?.name || m; if (!allMeds.has(n)) allMeds.set(n, { name: n, purpose: m?.purpose || 'NA', dosage: m?.dosage || 'NA' }); });
//       doc.allergies?.forEach(a => allAllergies.add(a?.name || a));
//       doc.labResults?.forEach(l => allLab.add(l));
//     });

//     const qrData = {
//       patientId: patient.patientId, name: patient.name,
//       bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'Unknown',
//       lastUpdated: new Date().toISOString().split('T')[0],
//       stats: { documents: recentDocs.length, diagnoses: Array.from(allDiagnoses).slice(0, 5), medications: Array.from(allMeds.values()).slice(0, 5), allergies: Array.from(allAllergies).slice(0, 5), labResults: Array.from(allLab).slice(0, 3) },
//       emergencyContact: medicalForm?.emergencyContact || null,
//       criticalInfo: { allergies: Array.from(allAllergies).slice(0, 5), chronicConditions: medicalForm?.medicalConditions?.chronicDiseases?.slice(0, 5) || [] }
//     };

//     let qrCode;
//     try {
//       qrCode = await QRCode.toDataURL(JSON.stringify(qrData), { errorCorrectionLevel: 'L', margin: 1, width: 300 });
//     } catch {
//       qrCode = await QRCode.toDataURL(JSON.stringify({ pid: patient.patientId, n: patient.name.substring(0, 15), bg: patient.bloodGroup || 'U', lu: new Date().toISOString().split('T')[0], dc: recentDocs.length }));
//     }

//     const updated = await User.findByIdAndUpdate(req.user._id, { qrCode }, { new: true }).select('-password');
//     res.json({ success: true, message: 'QR code refreshed successfully', data: { qrCode: updated.qrCode, summary: qrData } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.post('/qr/:specialty', auth, isPatient, async (req, res) => {
//   try {
//     const { specialty } = req.params;
//     let ps = await PatientSummary.findOne({ patientId: req.user._id });
//     if (!ps) {
//       const patient = await User.findById(req.user._id);
//       const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
//       const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
//       const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
//       const summaryData = specialty === 'cardiology' ? newSummaries.cardiology : specialty === 'orthopedic' ? newSummaries.orthopedic : newSummaries.general;
//       const optimized = optimizeSummaryForQR(summaryData, specialty);
//       const qrCode = await QRCode.toDataURL(JSON.stringify(optimized), { errorCorrectionLevel: 'L', margin: 1, width: 300 });
//       return res.json({ success: true, data: { qrCode, summary: optimized, specialty } });
//     }
//     const summaryData = specialty === 'cardiology' ? ps.cardiologySummary : specialty === 'orthopedic' ? ps.orthopedicSummary : ps.generalSummary;
//     const optimized = optimizeSummaryForQR(summaryData, specialty);
//     const qrCode = await QRCode.toDataURL(JSON.stringify(optimized), { errorCorrectionLevel: 'L', margin: 1, width: 300 });
//     res.json({ success: true, data: { qrCode, summary: optimized, specialty } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error: ' + error.message });
//   }
// });

// // ── SLM Summary ───────────────────────────────────────────────────────────────
// router.get('/slm-summary', auth, isPatient, async (req, res) => {
//   req.setTimeout(120000);
//   try {
//     res.json({ success: true, data: { success: false, summary: 'AI summary generation temporarily disabled.', type: 'general', timestamp: new Date().toISOString() } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ── Notifications ─────────────────────────────────────────────────────────────
// router.get('/notifications', auth, isPatient, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
//     res.json({ success: true, data: notifications });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// router.put('/notifications/:id/read', auth, isPatient, async (req, res) => {
//   try {
//     const result = await Notification.updateOne({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } });
//     if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
//     res.json({ success: true, message: 'Notification marked as read' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ADD THIS ENDPOINT to patient.js (backend/routes/patient.js)
// // Place it after the /history endpoint and before /my-reports

// // GET /api/patient/my-documents
// // Returns ProcessedDocuments directly (more reliable than pulling from medicalHistory)
// router.get('/my-documents', auth, isPatient, async (req, res) => {
//   try {
//     const docs = await ProcessedDocument.find({ userId: req.user._id })
//       .sort({ processedAt: -1 })
//       .select('fileName fileType fileSize fileId processingStatus processedAt summary diagnoses medications allergies');

//     const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

//     const data = docs.map(doc => ({
//       id: doc._id,
//       fileId: doc.fileId,
//       name: doc.fileName,
//       type: doc.fileType,
//       size: doc.fileSize,
//       status: doc.processingStatus,
//       uploadDate: doc.processedAt,
//       fileUrl: `${BASE_URL}/api/files/${doc.fileId}`,
//       summary: doc.summary || '',
//       extractedData: {
//         diagnoses: doc.diagnoses || [],
//         medications: (doc.medications || []).map(m => m?.name || m).filter(Boolean),
//         allergies: (doc.allergies || []).map(a => a?.name || a).filter(Boolean),
//       },
//     }));

//     res.json({ success: true, data });
//   } catch (error) {
//     console.error('my-documents error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // ADD THIS ROUTE to backend/routes/patient.js
// //
// // Place it anywhere after the router is defined and before module.exports.
// // It needs: ProcessedDocument, MedicalReport, PatientMedicalForm already
// // imported (they are in the full patient.js we gave you earlier).
// // ─────────────────────────────────────────────────────────────────────────────

// // GET /api/patient/timeline
// // Returns a unified chronological list of all medical events for the patient.
// // Each event has: id, type, title, subtitle, date, category, fileId, fileUrl, meta
// router.get('/timeline', auth, isPatient, async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

//     const events = [];

//     // ── 1. Processed Documents (OCR pipeline) ────────────────────────────────
//     const docs = await ProcessedDocument.find({ userId })
//       .sort({ processedAt: -1 })
//       .select('fileName fileType fileSize fileId processingStatus processedAt summary diagnoses medications allergies');

//     for (const doc of docs) {
//       const diagnoses = (doc.diagnoses || []).slice(0, 3);
//       const medications = (doc.medications || []).map(m => m?.name || m).filter(Boolean).slice(0, 3);
//       const allergies = (doc.allergies || []).map(a => a?.name || a).filter(Boolean).slice(0, 3);

//       events.push({
//         id: `doc-${doc._id}`,
//         type: 'document',
//         title: doc.fileName,
//         subtitle: doc.processingStatus === 'completed'
//           ? diagnoses.length > 0 ? `Diagnoses: ${diagnoses.join(', ')}` : 'Processed successfully'
//           : doc.processingStatus === 'failed' ? 'Processing failed' : 'Processing…',
//         date: doc.processedAt || doc.createdAt,
//         status: doc.processingStatus,
//         fileId: doc.fileId,
//         fileUrl: `${BASE}/api/files/${doc.fileId}`,
//         fileType: doc.fileType,
//         fileSize: doc.fileSize,
//         meta: {
//           diagnoses,
//           medications,
//           allergies,
//           summary: doc.summary || '',
//         },
//       });
//     }

//     // ── 2. Lab Reports (MedicalReport collection) ─────────────────────────────
//     let MedicalReport;
//     try { MedicalReport = require('../models/MedicalReport'); } catch { MedicalReport = null; }

//     if (MedicalReport) {
//       const reports = await MedicalReport.find({ userId })
//         .sort({ uploadedAt: -1 })
//         .select('fileName fileType fileSize fileId reportCategory notes uploadedAt filePath');

//       for (const report of reports) {
//         events.push({
//           id: `report-${report._id}`,
//           type: 'report',
//           title: report.fileName,
//           subtitle: report.reportCategory !== 'Other'
//             ? `${report.reportCategory} Lab Report`
//             : 'Lab Report',
//           date: report.uploadedAt || report.createdAt,
//           status: 'completed',
//           fileId: report.fileId,
//           fileUrl: `${BASE}/api/reports/file/${report.fileId}`,
//           fileType: report.fileType,
//           fileSize: report.fileSize,
//           reportCategory: report.reportCategory,
//           meta: { notes: report.notes || '' },
//         });
//       }
//     }

//     // ── 3. Medical Form submission ────────────────────────────────────────────
//     const form = await PatientMedicalForm.findOne({ patientId: userId })
//       .select('completionStatus createdAt');

//     if (form && (form.completionStatus?.completionDate || form.createdAt)) {
//       events.push({
//         id: `form-${form._id}`,
//         type: 'form',
//         title: 'Medical Form Completed',
//         subtitle: 'Initial medical information submitted',
//         date: form.completionStatus?.completionDate || form.createdAt,
//         status: 'completed',
//         fileId: null,
//         fileUrl: null,
//         fileType: null,
//         fileSize: null,
//         meta: {},
//       });
//     }

//     // ── Sort all events newest-first ─────────────────────────────────────────
//     events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

//     res.json({ success: true, data: events });
//   } catch (error) {
//     console.error('Timeline error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const { auth, isPatient } = require('../middleware/auth');
const User = require('../models/User');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');
const PatientSummary = require('../models/PatientSummary');
const ProcessingQueue = require('../models/ProcessingQueue');
const QRCode = require('qrcode');
const summaryGenerator = require('../services/summaryGenerator');
const Notification = require('../models/Notification');

// ── Helper ────────────────────────────────────────────────────────────────────
function optimizeSummaryForQR(summary, specialty) {
  if (!summary) return { error: 'No summary data' };
  try {
    const optimized = {
      pid: summary.patientDemographics?.patientId || summary.patientInfo?.patientId,
      n: summary.patientDemographics?.name || summary.patientInfo?.name,
      bg: summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup,
      lu: new Date().toISOString().split('T')[0],
      type: specialty
    };
    if (specialty === 'general') {
      optimized.dx = (summary.diagnoses || []).slice(0, 5);
      optimized.rx = (summary.currentMedications || []).slice(0, 5);
      optimized.alg = (summary.allergies || []).map(a => typeof a === 'string' ? a : a.name).slice(0, 5);
    } else if (specialty === 'cardiology') {
      optimized.cdx = (summary.cardiacDiagnoses || []).slice(0, 5);
      optimized.crx = (summary.cardiacMedications || []).slice(0, 5);
      if (summary.vitals) optimized.v = { bp: summary.vitals.bloodPressure, hr: summary.vitals.heartRate };
    } else if (specialty === 'orthopedic') {
      optimized.odx = (summary.orthopedicDiagnoses || []).slice(0, 5);
      optimized.om = (summary.orthopedicMedications || []).slice(0, 5);
      optimized.ms = summary.mobilityStatus;
    }
    return optimized;
  } catch (error) {
    return { error: 'Failed to optimize summary' };
  }
}

// ── Profile ───────────────────────────────────────────────────────────────────
// FIXED: Now includes medical conditions from PatientMedicalForm
router.get('/profile', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

    // Convert patient to plain object
    const patientData = patient.toObject();

    // Merge medical form data if it exists
    if (medicalForm) {
      patientData.hasMedicalForm = true;
      patientData.medicalFormStatus = medicalForm.completionStatus;

      // Add medical conditions from the form
      patientData.isDiabetic = medicalForm.medicalConditions?.isDiabetic || false;
      patientData.diabetesType = medicalForm.medicalConditions?.diabetesType || null;
      patientData.hasThyroid = medicalForm.medicalConditions?.hasThyroid || false;
      patientData.thyroidCondition = medicalForm.medicalConditions?.thyroidCondition || null;

      // Also add blood group from medical form if not in user profile
      if (!patientData.bloodGroup && medicalForm.personalInfo?.bloodGroup) {
        patientData.bloodGroup = medicalForm.personalInfo.bloodGroup;
      }
    } else {
      patientData.hasMedicalForm = false;
      patientData.isDiabetic = false;
      patientData.diabetesType = null;
      patientData.hasThyroid = false;
      patientData.thyroidCondition = null;
    }

    res.json({
      success: true,
      data: patientData
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Update Profile ────────────────────────────────────────────────────────────
router.put('/profile', auth, isPatient, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; delete updates.role; delete updates.patientId;
    delete updates._id; delete updates.__v; delete updates.createdAt; delete updates.updatedAt;
    if (updates.gender === '') updates.gender = null;
    if (updates.bloodGroup === '') updates.bloodGroup = null;
    if (updates.diabetesType === '') updates.diabetesType = null;
    if (updates.thyroidCondition === '') updates.thyroidCondition = null;
    if (updates.address) {
      Object.keys(updates.address).forEach(k => { if (updates.address[k] === '') updates.address[k] = null; });
    }

    // Update User model
    const patient = await User.findByIdAndUpdate(
      req.user._id, { $set: updates }, { new: true, runValidators: true }
    ).select('-password');

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Also update medical form if these fields are being updated
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    if (medicalForm) {
      let needsUpdate = false;

      if (updates.isDiabetic !== undefined || updates.diabetesType !== undefined) {
        if (!medicalForm.medicalConditions) medicalForm.medicalConditions = {};
        if (updates.isDiabetic !== undefined) {
          medicalForm.medicalConditions.isDiabetic = updates.isDiabetic;
          needsUpdate = true;
        }
        if (updates.diabetesType !== undefined) {
          medicalForm.medicalConditions.diabetesType = updates.diabetesType;
          needsUpdate = true;
        }
      }

      if (updates.hasThyroid !== undefined || updates.thyroidCondition !== undefined) {
        if (!medicalForm.medicalConditions) medicalForm.medicalConditions = {};
        if (updates.hasThyroid !== undefined) {
          medicalForm.medicalConditions.hasThyroid = updates.hasThyroid;
          needsUpdate = true;
        }
        if (updates.thyroidCondition !== undefined) {
          medicalForm.medicalConditions.thyroidCondition = updates.thyroidCondition;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await medicalForm.save();
      }
    }

    // Refresh QR code
    try {
      const qrData = {
        pid: patient.patientId,
        n: patient.name,
        bg: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'U',
        lu: new Date().toISOString().split('T')[0]
      };
      patient.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
      await patient.save();
    } catch { }

    // Return merged data
    const patientData = patient.toObject();
    if (medicalForm) {
      patientData.isDiabetic = medicalForm.medicalConditions?.isDiabetic || false;
      patientData.diabetesType = medicalForm.medicalConditions?.diabetesType || null;
      patientData.hasThyroid = medicalForm.medicalConditions?.hasThyroid || false;
      patientData.thyroidCondition = medicalForm.medicalConditions?.thyroidCondition || null;
    }

    res.json({ success: true, message: 'Profile updated successfully', data: patientData });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── Get Medical Profile (separate endpoint for medical conditions) ───────────
router.get('/medical-profile', auth, isPatient, async (req, res) => {
  try {
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });

    if (!medicalForm) {
      return res.json({
        success: true,
        data: {
          hasMedicalForm: false,
          isDiabetic: false,
          diabetesType: null,
          hasThyroid: false,
          thyroidCondition: null,
          bloodGroup: null,
          allergies: [],
          medications: [],
          chronicDiseases: [],
          comorbidConditions: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasMedicalForm: true,
        isDiabetic: medicalForm.medicalConditions?.isDiabetic || false,
        diabetesType: medicalForm.medicalConditions?.diabetesType || null,
        hasThyroid: medicalForm.medicalConditions?.hasThyroid || false,
        thyroidCondition: medicalForm.medicalConditions?.thyroidCondition || null,
        bloodGroup: medicalForm.personalInfo?.bloodGroup || null,
        allergies: medicalForm.medicalConditions?.medicationAllergies || [],
        medications: medicalForm.medications?.currentMedications || [],
        chronicDiseases: medicalForm.medicalConditions?.chronicDiseases || [],
        comorbidConditions: medicalForm.medicalConditions?.comorbidConditions || []
      }
    });
  } catch (error) {
    console.error('Medical profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── History / Timeline ────────────────────────────────────────────────────────
router.get('/history', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('medicalHistory name patientId');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const timeline = [];
    if (medicalForm?.completionStatus?.completionDate) {
      timeline.push({ date: medicalForm.completionStatus.completionDate, type: 'form_submission', title: 'Medical Form Completed', description: 'Initial medical information submitted', data: medicalForm });
    }
    if (patient?.medicalHistory) {
      patient.medicalHistory.forEach(yr =>
        yr.months?.forEach(mo =>
          mo.records?.forEach(rec => {
            timeline.push({ date: rec.date, type: rec.type, title: rec.description, description: `${mo.month} ${yr.year}`, documents: rec.documents, data: rec });
          })
        )
      );
    }
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Reports (list of uploaded documents with file URL) ────────────────────────
router.get('/my-reports', auth, isPatient, async (req, res) => {
  try {
    const docs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .select('fileName fileType fileSize fileId processingStatus processedAt summary diagnoses medications allergies');

    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

    const reports = docs.map(doc => {
      const ext = doc.fileName ? doc.fileName.split('.').pop() : '';
      const fileUrl = `${BASE_URL}/api/files/${doc.fileId}`;
      return {
        id: doc._id,
        fileId: doc.fileId,
        name: doc.fileName,
        type: doc.fileType,
        size: doc.fileSize,
        status: doc.processingStatus,
        uploadDate: doc.processedAt,
        fileUrl,
        summary: doc.summary || '',
        extractedData: {
          diagnoses: doc.diagnoses || [],
          medications: (doc.medications || []).map(m => m?.name || m),
          allergies: (doc.allergies || []).map(a => a?.name || a),
        },
      };
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('my-reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Upload count (real-time, includes queued + processed) ────────────────────
router.get('/upload-count', auth, isPatient, async (req, res) => {
  try {
    const [processed, queued] = await Promise.all([
      ProcessedDocument.countDocuments({ userId: req.user._id }),
      ProcessingQueue.countDocuments({
        userId: req.user._id,
        status: { $in: ['pending', 'processing'] }
      }),
    ]);
    res.json({ success: true, data: { processed, queued, total: processed + queued } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Doctor view history (patient reads who viewed their record) ───────────────
router.get('/view-history', auth, isPatient, async (req, res) => {
  try {
    const ps = await PatientSummary.findOne({ patientId: req.user._id });
    if (!ps) return res.json({ success: true, data: { viewCount: 0, viewHistory: [] } });
    res.json({
      success: true,
      data: {
        viewCount: ps.viewCount || 0,
        viewHistory: (ps.viewHistory || []).slice(-20).reverse(),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Summaries ─────────────────────────────────────────────────────────────────
router.get('/summaries', auth, isPatient, async (req, res) => {
  try {
    let ps = await PatientSummary.findOne({ patientId: req.user._id });
    if (!ps) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const documents = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, documents);
      return res.json({ success: true, data: newSummaries });
    }
    res.json({ success: true, data: { general: ps.generalSummary, cardiology: ps.cardiologySummary, orthopedic: ps.orthopedicSummary, slmSummaries: ps.slmSummaries, lastUpdated: ps.lastUpdated, documentCount: ps.documentCount, version: ps.version } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/summary', auth, isPatient, async (req, res) => {
  try {
    const ps = await PatientSummary.findOne({ patientId: req.user._id });
    if (!ps || !ps.generalSummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries.general });
    }
    res.json({ success: true, data: ps.generalSummary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/summary/cardiology', auth, isPatient, async (req, res) => {
  try {
    const ps = await PatientSummary.findOne({ patientId: req.user._id });
    if (!ps || !ps.cardiologySummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries.cardiology });
    }
    res.json({ success: true, data: ps.cardiologySummary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/summary/orthopedic', auth, isPatient, async (req, res) => {
  try {
    const ps = await PatientSummary.findOne({ patientId: req.user._id });
    if (!ps || !ps.orthopedicSummary) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries.orthopedic });
    }
    res.json({ success: true, data: ps.orthopedicSummary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/all-summaries', auth, isPatient, async (req, res) => {
  try {
    const ps = await PatientSummary.findOne({ patientId: req.user._id });
    if (!ps) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      return res.json({ success: true, data: newSummaries });
    }
    res.json({ success: true, data: { general: ps.generalSummary, cardiology: ps.cardiologySummary, orthopedic: ps.orthopedicSummary, slmSummaries: ps.slmSummaries } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/refresh-summaries', auth, isPatient, async (req, res) => {
  try {
    console.log(`🔄 Force refreshing summaries for user: ${req.user._id}`);
    const patient = await User.findById(req.user._id);
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
    const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
    res.json({ success: true, message: 'Summaries refreshed successfully', data: newSummaries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── QR Code ───────────────────────────────────────────────────────────────────
router.post('/refresh-qr', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');
    const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
    const recentDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 }).limit(20);

    const allDiagnoses = new Set(), allMeds = new Map(), allAllergies = new Set(), allLab = new Set();
    recentDocs.forEach(doc => {
      doc.diagnoses?.forEach(d => allDiagnoses.add(d));
      doc.medications?.forEach(m => { const n = m?.name || m; if (!allMeds.has(n)) allMeds.set(n, { name: n, purpose: m?.purpose || 'NA', dosage: m?.dosage || 'NA' }); });
      doc.allergies?.forEach(a => allAllergies.add(a?.name || a));
      doc.labResults?.forEach(l => allLab.add(l));
    });

    const qrData = {
      patientId: patient.patientId, name: patient.name,
      bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'Unknown',
      lastUpdated: new Date().toISOString().split('T')[0],
      stats: { documents: recentDocs.length, diagnoses: Array.from(allDiagnoses).slice(0, 5), medications: Array.from(allMeds.values()).slice(0, 5), allergies: Array.from(allAllergies).slice(0, 5), labResults: Array.from(allLab).slice(0, 3) },
      emergencyContact: medicalForm?.emergencyContact || null,
      criticalInfo: { allergies: Array.from(allAllergies).slice(0, 5), chronicConditions: medicalForm?.medicalConditions?.chronicDiseases?.slice(0, 5) || [] }
    };

    let qrCode;
    try {
      qrCode = await QRCode.toDataURL(JSON.stringify(qrData), { errorCorrectionLevel: 'L', margin: 1, width: 300 });
    } catch {
      qrCode = await QRCode.toDataURL(JSON.stringify({ pid: patient.patientId, n: patient.name.substring(0, 15), bg: patient.bloodGroup || 'U', lu: new Date().toISOString().split('T')[0], dc: recentDocs.length }));
    }

    const updated = await User.findByIdAndUpdate(req.user._id, { qrCode }, { new: true }).select('-password');
    res.json({ success: true, message: 'QR code refreshed successfully', data: { qrCode: updated.qrCode, summary: qrData } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/qr/:specialty', auth, isPatient, async (req, res) => {
  try {
    const { specialty } = req.params;
    let ps = await PatientSummary.findOne({ patientId: req.user._id });
    if (!ps) {
      const patient = await User.findById(req.user._id);
      const medicalForm = await PatientMedicalForm.findOne({ patientId: req.user._id });
      const allDocs = await ProcessedDocument.find({ userId: req.user._id }).sort({ processedAt: -1 });
      const newSummaries = await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
      const summaryData = specialty === 'cardiology' ? newSummaries.cardiology : specialty === 'orthopedic' ? newSummaries.orthopedic : newSummaries.general;
      const optimized = optimizeSummaryForQR(summaryData, specialty);
      const qrCode = await QRCode.toDataURL(JSON.stringify(optimized), { errorCorrectionLevel: 'L', margin: 1, width: 300 });
      return res.json({ success: true, data: { qrCode, summary: optimized, specialty } });
    }
    const summaryData = specialty === 'cardiology' ? ps.cardiologySummary : specialty === 'orthopedic' ? ps.orthopedicSummary : ps.generalSummary;
    const optimized = optimizeSummaryForQR(summaryData, specialty);
    const qrCode = await QRCode.toDataURL(JSON.stringify(optimized), { errorCorrectionLevel: 'L', margin: 1, width: 300 });
    res.json({ success: true, data: { qrCode, summary: optimized, specialty } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── SLM Summary ───────────────────────────────────────────────────────────────
router.get('/slm-summary', auth, isPatient, async (req, res) => {
  req.setTimeout(120000);
  try {
    res.json({ success: true, data: { success: false, summary: 'AI summary generation temporarily disabled.', type: 'general', timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications', auth, isPatient, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/notifications/:id/read', auth, isPatient, async (req, res) => {
  try {
    const result = await Notification.updateOne({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } });
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/patient/my-documents
router.get('/my-documents', auth, isPatient, async (req, res) => {
  try {
    const docs = await ProcessedDocument.find({ userId: req.user._id })
      .sort({ processedAt: -1 })
      .select('fileName fileType fileSize fileId processingStatus processedAt summary diagnoses medications allergies');

    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

    const data = docs.map(doc => ({
      id: doc._id,
      fileId: doc.fileId,
      name: doc.fileName,
      type: doc.fileType,
      size: doc.fileSize,
      status: doc.processingStatus,
      uploadDate: doc.processedAt,
      fileUrl: `${BASE_URL}/api/files/${doc.fileId}`,
      summary: doc.summary || '',
      extractedData: {
        diagnoses: doc.diagnoses || [],
        medications: (doc.medications || []).map(m => m?.name || m).filter(Boolean),
        allergies: (doc.allergies || []).map(a => a?.name || a).filter(Boolean),
      },
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('my-documents error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/patient/timeline
router.get('/timeline', auth, isPatient, async (req, res) => {
  try {
    const userId = req.user._id;
    const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

    const events = [];

    const docs = await ProcessedDocument.find({ userId })
      .sort({ processedAt: -1 })
      .select('fileName fileType fileSize fileId processingStatus processedAt summary diagnoses medications allergies');

    for (const doc of docs) {
      const diagnoses = (doc.diagnoses || []).slice(0, 3);
      const medications = (doc.medications || []).map(m => m?.name || m).filter(Boolean).slice(0, 3);
      const allergies = (doc.allergies || []).map(a => a?.name || a).filter(Boolean).slice(0, 3);

      events.push({
        id: `doc-${doc._id}`,
        type: 'document',
        title: doc.fileName,
        subtitle: doc.processingStatus === 'completed'
          ? diagnoses.length > 0 ? `Diagnoses: ${diagnoses.join(', ')}` : 'Processed successfully'
          : doc.processingStatus === 'failed' ? 'Processing failed' : 'Processing…',
        date: doc.processedAt || doc.createdAt,
        status: doc.processingStatus,
        fileId: doc.fileId,
        fileUrl: `${BASE}/api/files/${doc.fileId}`,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        meta: {
          diagnoses,
          medications,
          allergies,
          summary: doc.summary || '',
        },
      });
    }

    let MedicalReport;
    try { MedicalReport = require('../models/MedicalReport'); } catch { MedicalReport = null; }

    if (MedicalReport) {
      const reports = await MedicalReport.find({ userId })
        .sort({ uploadedAt: -1 })
        .select('fileName fileType fileSize fileId reportCategory notes uploadedAt filePath');

      for (const report of reports) {
        events.push({
          id: `report-${report._id}`,
          type: 'report',
          title: report.fileName,
          subtitle: report.reportCategory !== 'Other'
            ? `${report.reportCategory} Lab Report`
            : 'Lab Report',
          date: report.uploadedAt || report.createdAt,
          status: 'completed',
          fileId: report.fileId,
          fileUrl: `${BASE}/api/reports/file/${report.fileId}`,
          fileType: report.fileType,
          fileSize: report.fileSize,
          reportCategory: report.reportCategory,
          meta: { notes: report.notes || '' },
        });
      }
    }

    const form = await PatientMedicalForm.findOne({ patientId: userId })
      .select('completionStatus createdAt');

    if (form && (form.completionStatus?.completionDate || form.createdAt)) {
      events.push({
        id: `form-${form._id}`,
        type: 'form',
        title: 'Medical Form Completed',
        subtitle: 'Initial medical information submitted',
        date: form.completionStatus?.completionDate || form.createdAt,
        status: 'completed',
        fileId: null,
        fileUrl: null,
        fileType: null,
        fileSize: null,
        meta: {},
      });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;