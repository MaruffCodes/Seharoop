// /**
//  * Medical Summary Generator — SEHAROOP
//  *
//  * Key behaviours:
//  *  1. generateGeneralSummary reads structured sub-fields from ProcessedDocument
//  *     emitted by the new MedicalEntityExtractor.
//  *  2. LOCKED FIELDS (patientDemographics, address, medicalProfile) are always
//  *     sourced from PatientMedicalForm / User — never overwritten by doc extraction.
//  *  3. Appendable fields (allergies, medications, surgeries, …) are MERGED across
//  *     all uploaded documents using Maps for deduplication.
//  *  4. Placeholders ([{ name: 'NA' }]) are only emitted when the field is truly
//  *     empty — they are never shown alongside real data.
//  *  5. parseExtractedTextWithDeduplication is kept as a safe fallback for legacy
//  *     documents; medications are never populated from it.
//  */

// const PatientSummary = require('../models/PatientSummary');
// const User = require('../models/User');
// const PatientMedicalForm = require('../models/PatientMedicalForm');
// const ProcessedDocument = require('../models/ProcessedDocument');

// const ALL_SECTION_HEADERS = new Set([
//     'PATIENT DEMOGRAPHICS', 'ADDRESS', 'MEDICAL PROFILE',
//     'ALLERGIES', 'COMORBID CONDITIONS', 'CHRONIC DISEASES',
//     'CURRENT MEDICATIONS', 'PAST SURGERIES',
//     'MAJOR SURGERIES', 'MAJOR SURGERIES / ILLNESS',
//     'PREVIOUS INTERVENTIONS', 'BLOOD THINNER HISTORY',
//     'EMERGENCY CONTACT', 'MEDICAL HISTORY', 'DIAGNOSES',
// ]);

// class SummaryGenerator {

//     // ─────────────────────────────────────────────────────────────────────────
//     // PUBLIC API
//     // ─────────────────────────────────────────────────────────────────────────

//     async generateAndSaveAllSummaries(patient, medicalForm, documents) {
//         console.log(`🔄 Generating all summaries for patient: ${patient.patientId}`);
//         try {
//             const generalSummary = this.generateGeneralSummary(patient, medicalForm, documents);
//             const cardiologySummary = this.generateCardiologySummary(patient, medicalForm, documents);
//             const orthopedicSummary = this.generateOrthopedicSummary(patient, medicalForm, documents);

//             let patientSummary = await PatientSummary.findOne({ patientId: patient._id });
//             if (!patientSummary) patientSummary = new PatientSummary({ patientId: patient._id });

//             // ── LOCKED FIELD PROTECTION ────────────────────────────────────────
//             // If a summary already existed, re-apply locked fields from the
//             // stored version (which came from the medical form or profile).
//             if (patientSummary.generalSummary) {
//                 const existing = patientSummary.generalSummary;
//                 for (const field of ['patientDemographics', 'address', 'medicalProfile']) {
//                     if (existing[field] !== undefined && existing[field] !== null) {
//                         generalSummary[field] = existing[field];
//                     }
//                 }
//             }

//             patientSummary.generalSummary = generalSummary;
//             patientSummary.cardiologySummary = cardiologySummary;
//             patientSummary.orthopedicSummary = orthopedicSummary;
//             patientSummary.lastUpdated = new Date();
//             patientSummary.documentCount = documents.length;
//             patientSummary.version = (patientSummary.version || 0) + 1;

//             await patientSummary.save();
//             console.log(`✅ All summaries saved for patient: ${patient.patientId}`);
//             return { general: generalSummary, cardiology: cardiologySummary, orthopedic: orthopedicSummary };
//         } catch (error) {
//             console.error('❌ Error generating all summaries:', error);
//             throw error;
//         }
//     }

//     async getPatientSummaries(patientId) {
//         try {
//             const ps = await PatientSummary.findOne({ patientId });
//             if (!ps) return null;
//             return {
//                 general: ps.generalSummary,
//                 cardiology: ps.cardiologySummary,
//                 orthopedic: ps.orthopedicSummary,
//                 lastUpdated: ps.lastUpdated,
//                 documentCount: ps.documentCount,
//                 version: ps.version
//             };
//         } catch (error) {
//             console.error('Error getting patient summaries:', error);
//             throw error;
//         }
//     }

//     async refreshSummaries(userId) {
//         try {
//             console.log(`🔄 Refreshing summaries for user: ${userId}`);
//             const patient = await User.findById(userId);
//             if (!patient) throw new Error('Patient not found');
//             const medicalForm = await PatientMedicalForm.findOne({ patientId: userId });
//             const allDocuments = await ProcessedDocument.find({ userId }).sort({ processedAt: -1 });
//             return await this.generateAndSaveAllSummaries(patient, medicalForm, allDocuments);
//         } catch (error) {
//             console.error('❌ Error refreshing summaries:', error);
//             throw error;
//         }
//     }

//     // ─────────────────────────────────────────────────────────────────────────
//     // GENERAL SUMMARY
//     // ─────────────────────────────────────────────────────────────────────────

//     generateGeneralSummary(patient, medicalForm, documents) {
//         console.log(`📊 Generating general summary — ${documents.length} docs`);

//         // ── LOCKED: Demographics (always from medicalForm / User) ─────────────
//         const dob = medicalForm?.personalInfo?.dateOfBirth
//             ? new Date(medicalForm.personalInfo.dateOfBirth) : null;
//         const age = dob ? new Date().getFullYear() - dob.getFullYear() : null;
//         const formattedDob = dob
//             ? dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
//             : 'NA';

//         const address = medicalForm?.personalInfo?.address || {};
//         const formattedAddress = [
//             address.street, address.city, address.state,
//             address.pincode ? `- ${address.pincode}` : null,
//             address.country
//         ].filter(Boolean).join(', ') || 'NA';

//         // ── APPENDABLE: Dedup collections ─────────────────────────────────────
//         const allergiesMap = new Map(); // key → name string
//         const medicationsMap = new Map(); // key → { name, purpose, dosage }
//         const comorbidMap = new Map(); // key → name string
//         const chronicMap = new Map(); // key → name string
//         const pastSurgeriesMap = new Map(); // key → surgery object
//         const majorIllnessesMap = new Map(); // key → illness object
//         const previousInterventionsMap = new Map(); // key → intervention object
//         const bloodThinnerMap = new Map(); // key → bt object
//         const hospitalsSet = new Set();
//         const doctorsSet = new Set();
//         const medicalHistoryMap = new Map();

//         // ── Process each document ─────────────────────────────────────────────
//         documents.forEach(doc => {
//             console.log(`📄 Processing document: ${doc.fileName}`);

//             // ALLERGIES — only from doc.allergies (section-isolated)
//             if (Array.isArray(doc.allergies)) {
//                 doc.allergies.forEach(a => {
//                     const name = typeof a === 'string' ? a : a?.name;
//                     if (name && name !== 'NA') {
//                         allergiesMap.set(name.toLowerCase().trim(), name);
//                     }
//                 });
//             }

//             // MEDICATIONS — only from doc.medications
//             if (Array.isArray(doc.medications)) {
//                 doc.medications.forEach(m => {
//                     const name = typeof m === 'object' ? m?.name : m;
//                     if (name && name !== 'NA') {
//                         const key = name.toLowerCase().trim();
//                         if (!medicationsMap.has(key)) {
//                             medicationsMap.set(key, {
//                                 name,
//                                 purpose: m?.purpose || 'NA',
//                                 dosage: m?.dosage || 'NA'
//                             });
//                         }
//                     }
//                 });
//             }

//             // PAST SURGERIES
//             if (Array.isArray(doc.pastSurgeries)) {
//                 doc.pastSurgeries.forEach(s => {
//                     if (s?.name && s.name !== 'NA') {
//                         const key = s.name.toLowerCase().trim();
//                         if (!pastSurgeriesMap.has(key)) {
//                             pastSurgeriesMap.set(key, {
//                                 name: s.name,
//                                 date: s.date || 'NA',
//                                 hospital: s.hospital || 'NA',
//                                 surgeon: s.surgeon || 'NA'
//                             });
//                         } else {
//                             // Append missing sub-fields if a later doc fills them in
//                             const existing = pastSurgeriesMap.get(key);
//                             if (existing.date === 'NA' && s.date && s.date !== 'NA') existing.date = s.date;
//                             if (existing.hospital === 'NA' && s.hospital && s.hospital !== 'NA') existing.hospital = s.hospital;
//                             if (existing.surgeon === 'NA' && s.surgeon && s.surgeon !== 'NA') existing.surgeon = s.surgeon;
//                         }
//                     }
//                 });
//             }

//             // MAJOR ILLNESSES
//             if (Array.isArray(doc.majorIllnesses)) {
//                 doc.majorIllnesses.forEach(ill => {
//                     if (ill?.name && ill.name !== 'NA') {
//                         const key = ill.name.toLowerCase().trim();
//                         if (!majorIllnessesMap.has(key)) {
//                             majorIllnessesMap.set(key, {
//                                 name: ill.name,
//                                 date: ill.date || 'NA',
//                                 hospital: ill.hospital || 'NA',
//                                 notes: ill.notes || 'NA'
//                             });
//                         } else {
//                             const existing = majorIllnessesMap.get(key);
//                             if (existing.date === 'NA' && ill.date && ill.date !== 'NA') existing.date = ill.date;
//                             if (existing.hospital === 'NA' && ill.hospital && ill.hospital !== 'NA') existing.hospital = ill.hospital;
//                             if (existing.notes === 'NA' && ill.notes && ill.notes !== 'NA') existing.notes = ill.notes;
//                         }
//                     }
//                 });
//             }

//             // INTERVENTIONS
//             if (Array.isArray(doc.interventions)) {
//                 doc.interventions.forEach(iv => {
//                     if (iv?.name && iv.name !== 'NA') {
//                         const key = iv.name.toLowerCase().trim();
//                         if (!previousInterventionsMap.has(key)) {
//                             previousInterventionsMap.set(key, {
//                                 name: iv.name,
//                                 date: iv.date || 'NA',
//                                 hospital: iv.hospital || 'NA'
//                             });
//                         } else {
//                             const existing = previousInterventionsMap.get(key);
//                             if (existing.date === 'NA' && iv.date && iv.date !== 'NA') existing.date = iv.date;
//                             if (existing.hospital === 'NA' && iv.hospital && iv.hospital !== 'NA') existing.hospital = iv.hospital;
//                         }
//                     }
//                 });
//             }

//             // BLOOD THINNER
//             if (Array.isArray(doc.bloodThinner)) {
//                 doc.bloodThinner.forEach(bt => {
//                     if (bt?.name && bt.name !== 'NA') {
//                         const key = bt.name.toLowerCase().trim();
//                         if (!bloodThinnerMap.has(key)) {
//                             bloodThinnerMap.set(key, {
//                                 name: bt.name,
//                                 type: bt.type || 'NA',
//                                 duration: bt.duration || 'NA',
//                                 reason: bt.reason || 'NA'
//                             });
//                         }
//                     }
//                 });
//             }

//             // COMORBID / CHRONIC from dedicated doc fields
//             if (Array.isArray(doc.comorbidConditions)) {
//                 doc.comorbidConditions.forEach(c => {
//                     const name = typeof c === 'string' ? c : c?.name;
//                     if (name && name !== 'NA') comorbidMap.set(name.toLowerCase().trim(), name);
//                 });
//             }
//             if (Array.isArray(doc.chronicDiseases)) {
//                 doc.chronicDiseases.forEach(c => {
//                     const name = typeof c === 'string' ? c : c?.name;
//                     if (name && name !== 'NA') chronicMap.set(name.toLowerCase().trim(), name);
//                 });
//             }

//             // DIAGNOSES → comorbid / chronic buckets
//             if (Array.isArray(doc.diagnoses)) {
//                 doc.diagnoses.forEach(d => {
//                     if (d && d !== 'NA' && typeof d === 'string') {
//                         const key = d.toLowerCase().trim();
//                         if (this.isChronicDisease(d)) chronicMap.set(key, d);
//                         if (this.isComorbidCondition(d)) comorbidMap.set(key, d);
//                     }
//                 });
//             }

//             // HOSPITALS & DOCTORS
//             if (Array.isArray(doc.hospitals)) doc.hospitals.forEach(h => h && h !== 'NA' && hospitalsSet.add(h));
//             if (Array.isArray(doc.doctors)) doc.doctors.forEach(d => d && d !== 'NA' && doctorsSet.add(d));

//             // PARSED MEDICAL HISTORY
//             if (Array.isArray(doc.parsedMedicalHistory)) {
//                 doc.parsedMedicalHistory.forEach(record => {
//                     const key = `${record.year}-${record.month}-${record.day}-${record.type}`;
//                     if (!medicalHistoryMap.has(key)) medicalHistoryMap.set(key, record);
//                 });
//             }

//             // Fallback history entry from processedAt
//             if (doc.processedAt) {
//                 const date = new Date(doc.processedAt);
//                 const year = date.getFullYear();
//                 const month = date.toLocaleString('default', { month: 'long' });
//                 const day = date.getDate();
//                 const key = `${year}-${month}-${day}-${doc.fileId}`;
//                 if (!medicalHistoryMap.has(key)) {
//                     medicalHistoryMap.set(key, {
//                         year, month, day,
//                         type: this.getRecordType(doc),
//                         description: doc.summary || `Document uploaded: ${doc.fileName}`,
//                         documentId: doc.fileId
//                     });
//                 }
//             }

//             // Legacy fallback: parse extractedText (section-safe, no medications)
//             if (doc.extractedText && typeof doc.extractedText === 'string') {
//                 this.parseExtractedTextWithDeduplication(doc.extractedText, {
//                     pastSurgeriesMap, majorIllnessesMap, previousInterventionsMap,
//                     bloodThinnerMap, allergiesMap, hospitalsSet, doctorsSet
//                 });
//             }
//         });

//         // ── medicalForm supplements (never overwrite, only fill gaps) ─────────
//         if (medicalForm) {
//             medicalForm.surgicalHistory?.pastSurgeries?.forEach(s => {
//                 if (s.surgery && s.surgery !== 'NA') {
//                     const key = s.surgery.toLowerCase().trim();
//                     if (!pastSurgeriesMap.has(key)) {
//                         pastSurgeriesMap.set(key, {
//                             name: s.surgery,
//                             date: s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
//                             hospital: s.hospital || 'NA',
//                             surgeon: s.surgeon || 'NA'
//                         });
//                     }
//                 }
//             });

//             medicalForm.surgicalHistory?.majorIllnesses?.forEach(ill => {
//                 if (ill.illness && ill.illness !== 'NA') {
//                     const key = ill.illness.toLowerCase().trim();
//                     if (!majorIllnessesMap.has(key)) {
//                         majorIllnessesMap.set(key, {
//                             name: ill.illness,
//                             date: ill.year || 'NA',
//                             hospital: ill.hospital || 'NA',
//                             notes: ill.notes || 'NA'
//                         });
//                     }
//                 }
//             });

//             medicalForm.surgicalHistory?.previousInterventions?.forEach(iv => {
//                 if (iv.name && iv.name !== 'NA') {
//                     const key = iv.name.toLowerCase().trim();
//                     if (!previousInterventionsMap.has(key)) {
//                         previousInterventionsMap.set(key, {
//                             name: iv.name,
//                             date: iv.date ? new Date(iv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
//                             hospital: iv.hospital || 'NA'
//                         });
//                     }
//                 }
//             });

//             medicalForm.medications?.bloodThinnerHistory?.forEach(bt => {
//                 if (bt.name && bt.name !== 'NA') {
//                     const key = bt.name.toLowerCase().trim();
//                     if (!bloodThinnerMap.has(key)) {
//                         bloodThinnerMap.set(key, {
//                             name: bt.name,
//                             type: bt.type || 'NA',
//                             duration: bt.duration || 'NA',
//                             reason: bt.reason || 'NA'
//                         });
//                     }
//                 }
//             });

//             // Also supplement comorbid / chronic from medical form
//             medicalForm.medicalConditions?.comorbidConditions?.forEach(c => {
//                 if (c && c !== 'NA') comorbidMap.set(c.toLowerCase().trim(), c);
//             });
//             medicalForm.medicalConditions?.chronicDiseases?.forEach(c => {
//                 if (c && c !== 'NA') chronicMap.set(c.toLowerCase().trim(), c);
//             });
//         }

//         // ── Emergency contact ─────────────────────────────────────────────────
//         let emergencyContact = { name: 'NA', relationship: 'NA', phone: 'NA' };
//         if (medicalForm?.emergencyContact?.name && medicalForm.emergencyContact.name !== 'NA') {
//             emergencyContact = {
//                 name: medicalForm.emergencyContact.name || 'NA',
//                 relationship: medicalForm.emergencyContact.relationship || 'NA',
//                 phone: medicalForm.emergencyContact.phone || 'NA'
//             };
//         } else {
//             for (const doc of documents) {
//                 if (doc.emergencyContact?.name && doc.emergencyContact.name !== 'NA') {
//                     emergencyContact = doc.emergencyContact;
//                     break;
//                 }
//             }
//         }

//         // ── Build year→month history ──────────────────────────────────────────
//         const medicalHistoryByYear = {};
//         medicalHistoryMap.forEach(record => {
//             if (!medicalHistoryByYear[record.year]) medicalHistoryByYear[record.year] = {};
//             if (!medicalHistoryByYear[record.year][record.month]) medicalHistoryByYear[record.year][record.month] = [];
//             medicalHistoryByYear[record.year][record.month].push({
//                 day: record.day,
//                 type: record.type,
//                 description: record.description
//             });
//         });

//         // ── Helper: convert map to array, or placeholder if empty ────────────
//         const mapToArray = (map) => map.size > 0 ? Array.from(map.values()) : null;
//         const setToArray = (set) => set.size > 0 ? Array.from(set) : null;
//         const naOrArray = (arr, naObj) => arr && arr.length > 0 ? arr : [naObj];

//         const allergiesArr = mapToArray(allergiesMap)?.map(n => ({ name: n }));
//         const medicationsArr = mapToArray(medicationsMap);
//         const comorbidArr = mapToArray(comorbidMap)?.map(n => ({ name: n }));
//         const chronicArr = mapToArray(chronicMap)?.map(n => ({ name: n }));
//         const surgeriesArr = mapToArray(pastSurgeriesMap);
//         const illnessesArr = mapToArray(majorIllnessesMap);
//         const interventionsArr = mapToArray(previousInterventionsMap);
//         const btArr = mapToArray(bloodThinnerMap);
//         const hospitalsArr = setToArray(hospitalsSet);
//         const doctorsArr = setToArray(doctorsSet);

//         // ── LOCKED: demographics from medicalForm / User ──────────────────────
//         const summary = {
//             patientDemographics: {   // ← LOCKED FIELD
//                 name: patient.name || 'NA',
//                 patientId: patient.patientId || 'NA',
//                 dateOfBirth: formattedDob,
//                 age: age ? `${age} years` : 'NA',
//                 gender: medicalForm?.personalInfo?.gender || patient.gender || 'NA',
//                 email: patient.email || 'NA',
//                 phone: medicalForm?.personalInfo?.phone || patient.phone || 'NA'
//             },
//             address: formattedAddress,    // ← LOCKED FIELD
//             medicalProfile: {             // ← LOCKED FIELD
//                 bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA',
//                 isDiabetic: medicalForm?.medicalConditions?.isDiabetic ? 'Yes' : 'No',
//                 diabetesType: medicalForm?.medicalConditions?.diabetesType || 'NA',
//                 hasThyroid: medicalForm?.medicalConditions?.hasThyroid ? 'Yes' : 'No',
//                 thyroidCondition: medicalForm?.medicalConditions?.thyroidCondition || 'NA'
//             },

//             // ── APPENDABLE fields ─────────────────────────────────────────────
//             allergies: naOrArray(allergiesArr, { name: 'NA' }),
//             comorbidConditions: naOrArray(comorbidArr, { name: 'NA' }),
//             chronicDiseases: naOrArray(chronicArr, { name: 'NA' }),
//             currentMedications: naOrArray(medicationsArr, { name: 'NA', purpose: 'NA', dosage: 'NA' }),
//             pastSurgeries: naOrArray(surgeriesArr, { name: 'NA', date: 'NA', hospital: 'NA', surgeon: 'NA' }),
//             majorSurgeriesOrIllness: naOrArray(illnessesArr, { name: 'NA', date: 'NA', hospital: 'NA', notes: 'NA' }),
//             previousInterventions: naOrArray(interventionsArr, { name: 'NA', date: 'NA', hospital: 'NA' }),
//             bloodThinnerHistory: naOrArray(btArr, { name: 'NA', type: 'NA', duration: 'NA', reason: 'NA' }),
//             emergencyContact,
//             hospitals: hospitalsArr || [],
//             doctors: doctorsArr || [],
//             medicalHistory: this.formatMedicalHistory(medicalHistoryByYear),
//             lastUpdated: new Date().toISOString()
//         };

//         console.log('📊 FINAL SUMMARY STATS:');
//         console.log(`  - Allergies: ${allergiesMap.size}`);
//         console.log(`  - Medications: ${medicationsMap.size}`);
//         console.log(`  - Past Surgeries: ${pastSurgeriesMap.size}`);
//         console.log(`  - Major Illnesses: ${majorIllnessesMap.size}`);
//         console.log(`  - Interventions: ${previousInterventionsMap.size}`);
//         console.log(`  - Blood Thinners: ${bloodThinnerMap.size}`);
//         console.log(`  - Hospitals: ${hospitalsSet.size}`);

//         return summary;
//     }

//     // ─────────────────────────────────────────────────────────────────────────
//     // LEGACY EXTRACTED-TEXT PARSER (section-safe fallback)
//     // ─────────────────────────────────────────────────────────────────────────

//     parseExtractedTextWithDeduplication(text, collections) {
//         const {
//             pastSurgeriesMap, majorIllnessesMap, previousInterventionsMap,
//             bloodThinnerMap, allergiesMap, hospitalsSet, doctorsSet
//         } = collections;

//         const lines = text.split('\n');
//         let currentSection = null;
//         let currentItem = null;

//         for (let i = 0; i < lines.length; i++) {
//             const line = lines[i].trim();
//             const lineUp = line.toUpperCase();
//             if (!line) continue;

//             if (ALL_SECTION_HEADERS.has(lineUp)) {
//                 currentItem = null;
//                 if (lineUp === 'PAST SURGERIES') currentSection = 'surgeries';
//                 else if (lineUp.startsWith('MAJOR SURGERIES')) currentSection = 'major';
//                 else if (lineUp === 'PREVIOUS INTERVENTIONS') currentSection = 'interventions';
//                 else if (lineUp === 'BLOOD THINNER HISTORY') currentSection = 'bloodThinner';
//                 else if (lineUp === 'ALLERGIES') currentSection = 'allergies';
//                 else currentSection = null;
//                 continue;
//             }

//             if (!currentSection) continue;

//             if (/^[•*\-–¢+►→▪✓❯›]/.test(line)) {
//                 const rawName = line.replace(/^[•*\-–¢+►→▪✓❯›]\s*/, '');

//                 if (currentSection === 'surgeries') {
//                     const key = rawName.toLowerCase().trim();
//                     if (!pastSurgeriesMap.has(key)) {
//                         currentItem = { name: rawName, date: 'NA', hospital: 'NA', surgeon: 'NA' };
//                         pastSurgeriesMap.set(key, currentItem);
//                     } else { currentItem = pastSurgeriesMap.get(key); }

//                 } else if (currentSection === 'major') {
//                     const key = rawName.toLowerCase().trim();
//                     if (!majorIllnessesMap.has(key)) {
//                         currentItem = { name: rawName, date: 'NA', hospital: 'NA', notes: 'NA' };
//                         majorIllnessesMap.set(key, currentItem);
//                     } else { currentItem = majorIllnessesMap.get(key); }

//                 } else if (currentSection === 'interventions') {
//                     const key = rawName.toLowerCase().trim();
//                     if (!previousInterventionsMap.has(key)) {
//                         currentItem = { name: rawName, date: 'NA', hospital: 'NA' };
//                         previousInterventionsMap.set(key, currentItem);
//                     } else { currentItem = previousInterventionsMap.get(key); }

//                 } else if (currentSection === 'bloodThinner') {
//                     const m = rawName.match(/^(.+?)\s*\(([^)]+)\)$/);
//                     const name = m ? m[1].trim() : rawName;
//                     const type = m ? m[2].trim() : 'NA';
//                     const key = name.toLowerCase().trim();
//                     if (!bloodThinnerMap.has(key)) {
//                         currentItem = { name, type, duration: 'NA', reason: 'NA' };
//                         bloodThinnerMap.set(key, currentItem);
//                     } else { currentItem = bloodThinnerMap.get(key); }

//                 } else if (currentSection === 'allergies') {
//                     const key = rawName.toLowerCase().trim();
//                     if (!allergiesMap.has(key)) allergiesMap.set(key, rawName);
//                     currentItem = null;
//                 }

//             } else if (currentItem) {
//                 const subFieldMap = {
//                     'date:': 'date',
//                     'hospital:': 'hospital',
//                     'surgeon:': 'surgeon',
//                     'notes:': 'notes',
//                     'duration:': 'duration',
//                     'reason:': 'reason',
//                     'type:': 'type',
//                 };
//                 const lowerLine = line.toLowerCase();
//                 for (const [prefix, field] of Object.entries(subFieldMap)) {
//                     if (lowerLine.startsWith(prefix)) {
//                         currentItem[field] = line.slice(prefix.length).trim();
//                         if (field === 'hospital') hospitalsSet.add(currentItem[field]);
//                         if (field === 'surgeon') doctorsSet.add(currentItem[field]);
//                         break;
//                     }
//                 }
//             }
//         }
//     }

//     // ─────────────────────────────────────────────────────────────────────────
//     // HELPERS
//     // ─────────────────────────────────────────────────────────────────────────

//     formatMedicalHistory(historyByYear) {
//         const formatted = [];
//         const monthOrder = {
//             January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
//             July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
//         };
//         const years = Object.keys(historyByYear).sort((a, b) => parseInt(b) - parseInt(a));
//         for (const year of years) {
//             const yearData = { year, months: [] };
//             const months = Object.keys(historyByYear[year])
//                 .sort((a, b) => (monthOrder[b] || 0) - (monthOrder[a] || 0));
//             for (const month of months) {
//                 yearData.months.push({
//                     month,
//                     records: historyByYear[year][month]
//                         .sort((a, b) => b.day - a.day)
//                         .map(r => ({ day: r.day, type: r.type, description: r.description }))
//                 });
//             }
//             formatted.push(yearData);
//         }
//         return formatted;
//     }

//     isChronicDisease(diagnosis) {
//         const keywords = [
//             'diabetes', 'hypertension', 'asthma', 'copd', 'arthritis',
//             'heart disease', 'ckd', 'kidney disease', 'liver disease',
//             'thyroid', 'osteoporosis', 'alzheimer', 'parkinson',
//             'high cholesterol', 'hyperlipidemia'
//         ];
//         const lower = diagnosis.toLowerCase();
//         return keywords.some(k => lower.includes(k));
//     }

//     isComorbidCondition(diagnosis) {
//         const keywords = [
//             'hypertension', 'diabetes', 'high cholesterol', 'obesity',
//             'heart failure', 'copd', 'asthma', 'depression', 'anxiety',
//             'hyperlipidemia', 'type 2'
//         ];
//         const lower = diagnosis.toLowerCase();
//         return keywords.some(k => lower.includes(k));
//     }

//     getRecordType(doc) {
//         const name = doc.fileName?.toLowerCase() || '';
//         if (name.includes('lab')) return 'LAB TEST';
//         if (name.includes('xray')) return 'IMAGING';
//         if (name.includes('prescription')) return 'PRESCRIPTION';
//         if (name.includes('discharge')) return 'DISCHARGE SUMMARY';
//         if (doc.diagnoses?.length > 0) return 'CONSULTATION';
//         return 'DOCUMENT';
//     }

//     containsKeyword(text, keywords) {
//         if (!text) return false;
//         const lower = text.toLowerCase();
//         return keywords.some(k => lower.includes(k.toLowerCase()));
//     }

//     extractVitals(documents) {
//         const vitals = { bloodPressure: 'NA', heartRate: 'NA', temperature: 'NA', weight: 'NA' };
//         const recent = documents[0];
//         if (recent?.vitals) return recent.vitals;
//         return vitals;
//     }

//     extractMobilityStatus(documents) {
//         const keywords = ['walking', 'ambulatory', 'wheelchair', 'crutches', 'cane', 'walker'];
//         for (const doc of documents.slice(0, 3)) {
//             if (doc.summary) {
//                 for (const kw of keywords) {
//                     if (doc.summary.toLowerCase().includes(kw)) return `Patient requires ${kw}`;
//                 }
//             }
//         }
//         return 'Mobility status unknown';
//     }

//     calculateCardiacRiskFactors(patient, medicalForm, cardiacDiagnoses) {
//         const riskFactors = [];
//         if (cardiacDiagnoses.has('hypertension')) riskFactors.push('Hypertension');
//         if (cardiacDiagnoses.has('diabetes')) riskFactors.push('Diabetes');
//         return riskFactors.length > 0 ? riskFactors : ['No specific cardiac risk factors identified'];
//     }

//     parseMedication(medString) {
//         const result = { name: medString, purpose: 'NA', dosage: 'NA' };
//         const dosageMatch = medString.match(/(\d+\s*(?:mg|mcg|g|ml))/i);
//         if (dosageMatch) {
//             result.dosage = dosageMatch[1];
//             result.name = medString.replace(dosageMatch[0], '').trim();
//         }
//         const purposeMap = {
//             'diabetes': ['metformin', 'glipizide', 'insulin'],
//             'blood pressure': ['lisinopril', 'amlodipine', 'losartan'],
//             'cholesterol': ['atorvastatin', 'simvastatin', 'rosuvastatin'],
//             'pain': ['ibuprofen', 'naproxen', 'tramadol']
//         };
//         const lower = medString.toLowerCase();
//         for (const [purpose, drugs] of Object.entries(purposeMap)) {
//             if (drugs.some(d => lower.includes(d))) { result.purpose = purpose; break; }
//         }
//         return result;
//     }

//     // ─────────────────────────────────────────────────────────────────────────
//     // SPECIALTY SUMMARIES
//     // ─────────────────────────────────────────────────────────────────────────

//     generateCardiologySummary(patient, medicalForm, documents) {
//         const cardiacKeywords = [
//             'heart', 'cardiac', 'coronary', 'myocardial', 'angina', 'arrhythmia',
//             'palpitations', 'ecg', 'ekg', 'echocardiogram', 'echo', 'stress test',
//             'troponin', 'ck-mb', 'ldl', 'hdl', 'cholesterol', 'hypertension',
//             'blood pressure', 'bp', 'ace inhibitor', 'beta blocker', 'statin',
//             'aspirin', 'clopidogrel', 'warfarin', 'eliquis', 'xarelto'
//         ];

//         const cardiacDiagnoses = new Set();
//         const cardiacMedications = [];
//         const cardiacTests = new Set();
//         const cardiacReports = [];

//         documents.forEach(doc => {
//             doc.diagnoses?.forEach(d => { if (this.containsKeyword(d, cardiacKeywords)) cardiacDiagnoses.add(d); });
//             doc.medications?.forEach(m => {
//                 const name = typeof m === 'object' ? m.name : m;
//                 if (this.containsKeyword(name, cardiacKeywords)) {
//                     cardiacMedications.push({ name, purpose: m.purpose || 'NA', dosage: m.dosage || 'NA' });
//                 }
//             });
//             doc.labResults?.forEach(l => { if (this.containsKeyword(l, cardiacKeywords)) cardiacTests.add(l); });
//             if (this.containsKeyword(doc.fileName, cardiacKeywords)) {
//                 cardiacReports.push({
//                     name: doc.fileName,
//                     date: doc.processedAt
//                         ? new Date(doc.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
//                         : 'NA',
//                     type: doc.fileType
//                 });
//             }
//         });

//         return {
//             patientInfo: {
//                 name: patient.name || 'NA',
//                 patientId: patient.patientId || 'NA',
//                 age: medicalForm?.personalInfo?.dateOfBirth
//                     ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
//                     : 'NA',
//                 bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA'
//             },
//             cardiacDiagnoses: cardiacDiagnoses.size > 0 ? Array.from(cardiacDiagnoses) : ['NA'],
//             cardiacMedications: cardiacMedications.length > 0 ? cardiacMedications : [{ name: 'NA', purpose: 'NA', dosage: 'NA' }],
//             cardiacTests: cardiacTests.size > 0 ? Array.from(cardiacTests) : ['NA'],
//             vitals: this.extractVitals(documents),
//             recentCardiacReports: cardiacReports.slice(0, 5),
//             riskFactors: this.calculateCardiacRiskFactors(patient, medicalForm, cardiacDiagnoses),
//             lastUpdated: new Date().toISOString()
//         };
//     }

//     generateOrthopedicSummary(patient, medicalForm, documents) {
//         const orthopedicKeywords = [
//             'bone', 'joint', 'muscle', 'ligament', 'tendon', 'cartilage',
//             'fracture', 'dislocation', 'sprain', 'strain', 'arthritis',
//             'osteoporosis', 'back pain', 'neck pain', 'knee', 'hip', 'shoulder',
//             'spine', 'disc', 'x-ray', 'mri', 'ct scan', 'orthopedic',
//             'ortho', 'rheumatoid', 'osteoarthritis', 'gout'
//         ];

//         const orthopedicDiagnoses = new Set();
//         const orthopedicMedications = [];
//         const orthopedicImaging = new Set();
//         const orthopedicReports = [];

//         documents.forEach(doc => {
//             doc.diagnoses?.forEach(d => { if (this.containsKeyword(d, orthopedicKeywords)) orthopedicDiagnoses.add(d); });
//             doc.medications?.forEach(m => {
//                 const name = typeof m === 'object' ? m.name : m;
//                 if (this.containsKeyword(name, ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'prednisone'])) {
//                     orthopedicMedications.push({ name, purpose: m.purpose || 'pain', dosage: m.dosage || 'NA' });
//                 }
//             });
//             doc.labResults?.forEach(l => {
//                 if (this.containsKeyword(l, ['x-ray', 'mri', 'ct', 'ultrasound', 'bone density'])) orthopedicImaging.add(l);
//             });
//             if (this.containsKeyword(doc.fileName, orthopedicKeywords)) {
//                 orthopedicReports.push({
//                     name: doc.fileName,
//                     date: doc.processedAt
//                         ? new Date(doc.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
//                         : 'NA',
//                     type: doc.fileType
//                 });
//             }
//         });

//         return {
//             patientInfo: {
//                 name: patient.name || 'NA',
//                 patientId: patient.patientId || 'NA',
//                 age: medicalForm?.personalInfo?.dateOfBirth
//                     ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
//                     : 'NA',
//                 bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA'
//             },
//             orthopedicDiagnoses: orthopedicDiagnoses.size > 0 ? Array.from(orthopedicDiagnoses) : ['NA'],
//             orthopedicMedications: orthopedicMedications.length > 0 ? orthopedicMedications : [{ name: 'NA', purpose: 'NA', dosage: 'NA' }],
//             imagingResults: orthopedicImaging.size > 0 ? Array.from(orthopedicImaging) : ['NA'],
//             recentOrthopedicReports: orthopedicReports.slice(0, 5),
//             mobilityStatus: this.extractMobilityStatus(documents),
//             lastUpdated: new Date().toISOString()
//         };
//     }
// }

// module.exports = new SummaryGenerator();

/**
 * Medical Summary Generator — SEHAROOP
 * Specialty summaries now pull from PatientMedicalForm + ProcessedDocuments
 * to produce fully structured cardiology and orthopedic views.
 */

const PatientSummary = require('../models/PatientSummary');
const User = require('../models/User');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');

const ALL_SECTION_HEADERS = new Set([
    'PATIENT DEMOGRAPHICS', 'ADDRESS', 'MEDICAL PROFILE',
    'ALLERGIES', 'COMORBID CONDITIONS', 'CHRONIC DISEASES',
    'CURRENT MEDICATIONS', 'PAST SURGERIES',
    'MAJOR SURGERIES', 'MAJOR SURGERIES / ILLNESS',
    'PREVIOUS INTERVENTIONS', 'BLOOD THINNER HISTORY',
    'EMERGENCY CONTACT', 'MEDICAL HISTORY', 'DIAGNOSES',
]);

// ── Medication classification tables ─────────────────────────────────────────
const CARDIAC_DRUG_TYPES = {
    antiplatelet: ['aspirin', 'clopidogrel', 'ticagrelor', 'prasugrel', 'plavix'],
    statin: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'lipitor', 'crestor'],
    betaBlocker: ['metoprolol', 'atenolol', 'carvedilol', 'bisoprolol', 'propranolol', 'nebivolol'],
    aceInhibitor: ['lisinopril', 'enalapril', 'ramipril', 'perindopril', 'captopril'],
    arb: ['losartan', 'valsartan', 'telmisartan', 'olmesartan', 'irbesartan', 'candesartan'],
    calciumChannel: ['amlodipine', 'nifedipine', 'diltiazem', 'verapamil', 'felodipine'],
    anticoagulant: ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'eliquis', 'xarelto', 'pradaxa'],
    diuretic: ['furosemide', 'hydrochlorothiazide', 'spironolactone', 'torsemide', 'indapamide'],
    nitrate: ['nitroglycerin', 'isosorbide', 'nitroglycerine', 'sorbitrate'],
    antiarrhythmic: ['amiodarone', 'digoxin', 'flecainide', 'sotalol', 'dronedarone'],
};

const ORTHO_DRUG_TYPES = {
    nsaid: ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'indomethacin', 'meloxicam', 'etoricoxib'],
    opioid: ['tramadol', 'codeine', 'morphine', 'oxycodone', 'tapentadol'],
    dmard: ['methotrexate', 'hydroxychloroquine', 'sulfasalazine', 'leflunomide', 'plaquenil'],
    biologic: ['adalimumab', 'etanercept', 'infliximab', 'rituximab', 'humira', 'enbrel'],
    steroid: ['prednisolone', 'prednisone', 'dexamethasone', 'methylprednisolone'],
    supplement: ['calcium', 'vitamin d', 'calcitriol', 'alfacalcidol', 'glucosamine', 'chondroitin'],
    bisphosphonate: ['alendronate', 'risedronate', 'zoledronic', 'ibandronate'],
    muscle_relaxant: ['baclofen', 'cyclobenzaprine', 'tizanidine', 'carisoprodol', 'methocarbamol'],
};

// Cardiac-relevant diagnoses/conditions
const CARDIAC_CONDITIONS = [
    'hypertension', 'coronary artery disease', 'cad', 'heart failure', 'chf',
    'arrhythmia', 'atrial fibrillation', 'afib', 'myocardial infarction', 'mi',
    'heart attack', 'angina', 'cardiomyopathy', 'valve disease', 'aortic stenosis',
    'mitral regurgitation', 'pericarditis', 'endocarditis', 'stroke', 'tia',
    'peripheral artery disease', 'pad', 'heart block', 'bundle branch block',
    'ventricular tachycardia', 'svt', 'pvcs',
];

// Cardiac procedures/interventions
const CARDIAC_PROCEDURES = [
    'angioplasty', 'stent', 'bypass', 'cabg', 'pci', 'catheterization',
    'angiography', 'echocardiogram', 'echo', 'ecg', 'ekg', 'treadmill',
    'stress test', 'holter', 'pacemaker', 'icd', 'defibrillator', 'ablation',
    'cardioversion', 'valve replacement', 'valve repair', 'tavr',
];

// Orthopedic conditions
const ORTHO_CONDITIONS = [
    'osteoarthritis', 'rheumatoid arthritis', 'ra', 'osteoporosis',
    'ankylosing spondylitis', 'gout', 'fibromyalgia', 'spondylitis',
    'disc herniation', 'disc prolapse', 'slipped disc', 'sciatica',
    'spinal stenosis', 'fracture', 'dislocation', 'ligament tear',
    'acl tear', 'meniscus tear', 'rotator cuff', 'tendinitis',
    'bursitis', 'carpal tunnel', 'plantar fasciitis', 'scoliosis', 'kyphosis',
];

// Orthopedic procedures
const ORTHO_PROCEDURES = [
    'acl reconstruction', 'knee replacement', 'hip replacement', 'arthroplasty',
    'arthroscopy', 'spinal fusion', 'laminectomy', 'discectomy', 'amputation',
    'external fixation', 'internal fixation', 'orif', 'osteotomy', 'tendon repair',
    'rotator cuff repair', 'shoulder replacement',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function containsAny(text, keywords) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
}

function classifyMedication(medName, typeMap) {
    const lower = (medName || '').toLowerCase();
    for (const [type, drugs] of Object.entries(typeMap)) {
        if (drugs.some(d => lower.includes(d))) return type;
    }
    return null;
}

function getAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
}

function naOrArray(arr, naObj) {
    return arr && arr.length > 0 ? arr : [naObj];
}

class SummaryGenerator {

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    async generateAndSaveAllSummaries(patient, medicalForm, documents) {
        console.log(`🔄 Generating all summaries for patient: ${patient.patientId}`);
        try {
            const generalSummary = this.generateGeneralSummary(patient, medicalForm, documents);
            const cardiologySummary = this.generateCardiologySummary(patient, medicalForm, documents);
            const orthopedicSummary = this.generateOrthopedicSummary(patient, medicalForm, documents);

            let ps = await PatientSummary.findOne({ patientId: patient._id });
            if (!ps) ps = new PatientSummary({ patientId: patient._id });

            // Preserve locked fields in existing general summary
            if (ps.generalSummary) {
                const existing = ps.generalSummary;
                for (const field of ['patientDemographics', 'address', 'medicalProfile']) {
                    if (existing[field] != null) generalSummary[field] = existing[field];
                }
            }

            ps.generalSummary = generalSummary;
            ps.cardiologySummary = cardiologySummary;
            ps.orthopedicSummary = orthopedicSummary;
            ps.lastUpdated = new Date();
            ps.documentCount = documents.length;
            ps.version = (ps.version || 0) + 1;

            await ps.save();
            console.log(`✅ All summaries saved for patient: ${patient.patientId}`);
            return { general: generalSummary, cardiology: cardiologySummary, orthopedic: orthopedicSummary };
        } catch (error) {
            console.error('❌ Error generating all summaries:', error);
            throw error;
        }
    }

    async getPatientSummaries(patientId) {
        try {
            const ps = await PatientSummary.findOne({ patientId });
            if (!ps) return null;
            return {
                general: ps.generalSummary,
                cardiology: ps.cardiologySummary,
                orthopedic: ps.orthopedicSummary,
                lastUpdated: ps.lastUpdated,
                documentCount: ps.documentCount,
                version: ps.version,
            };
        } catch (error) {
            console.error('Error getting patient summaries:', error);
            throw error;
        }
    }

    async refreshSummaries(userId) {
        try {
            console.log(`🔄 Refreshing summaries for user: ${userId}`);
            const patient = await User.findById(userId);
            if (!patient) throw new Error('Patient not found');
            const medicalForm = await PatientMedicalForm.findOne({ patientId: userId });
            const allDocs = await ProcessedDocument.find({ userId }).sort({ processedAt: -1 });
            return await this.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
        } catch (error) {
            console.error('❌ Error refreshing summaries:', error);
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERAL SUMMARY (unchanged from original)
    // ─────────────────────────────────────────────────────────────────────────

    generateGeneralSummary(patient, medicalForm, documents) {
        console.log(`📊 Generating general summary — ${documents.length} docs`);

        const dob = medicalForm?.personalInfo?.dateOfBirth ? new Date(medicalForm.personalInfo.dateOfBirth) : null;
        const age = dob ? new Date().getFullYear() - dob.getFullYear() : null;
        const formattedDob = dob ? dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA';

        const address = medicalForm?.personalInfo?.address || {};
        const formattedAddress = [address.street, address.city, address.state, address.pincode ? `- ${address.pincode}` : null, address.country].filter(Boolean).join(', ') || 'NA';

        const allergiesMap = new Map();
        const medicationsMap = new Map();
        const comorbidMap = new Map();
        const chronicMap = new Map();
        const pastSurgeriesMap = new Map();
        const majorIllnessesMap = new Map();
        const previousInterventionsMap = new Map();
        const bloodThinnerMap = new Map();
        const hospitalsSet = new Set();
        const doctorsSet = new Set();
        const medicalHistoryMap = new Map();

        documents.forEach(doc => {
            if (Array.isArray(doc.allergies)) {
                doc.allergies.forEach(a => { const n = typeof a === 'string' ? a : a?.name; if (n && n !== 'NA') allergiesMap.set(n.toLowerCase().trim(), n); });
            }
            if (Array.isArray(doc.medications)) {
                doc.medications.forEach(m => { const n = typeof m === 'object' ? m?.name : m; if (n && n !== 'NA') { const key = n.toLowerCase().trim(); if (!medicationsMap.has(key)) medicationsMap.set(key, { name: n, purpose: m?.purpose || 'NA', dosage: m?.dosage || 'NA' }); } });
            }
            if (Array.isArray(doc.pastSurgeries)) {
                doc.pastSurgeries.forEach(s => {
                    if (s?.name && s.name !== 'NA') {
                        const key = s.name.toLowerCase().trim();
                        if (!pastSurgeriesMap.has(key)) pastSurgeriesMap.set(key, { name: s.name, date: s.date || 'NA', hospital: s.hospital || 'NA', surgeon: s.surgeon || 'NA' });
                        else { const e = pastSurgeriesMap.get(key); if (e.date === 'NA' && s.date) e.date = s.date; if (e.hospital === 'NA' && s.hospital) e.hospital = s.hospital; if (e.surgeon === 'NA' && s.surgeon) e.surgeon = s.surgeon; }
                    }
                });
            }
            if (Array.isArray(doc.majorIllnesses)) {
                doc.majorIllnesses.forEach(ill => {
                    if (ill?.name && ill.name !== 'NA') {
                        const key = ill.name.toLowerCase().trim();
                        if (!majorIllnessesMap.has(key)) majorIllnessesMap.set(key, { name: ill.name, date: ill.date || 'NA', hospital: ill.hospital || 'NA', notes: ill.notes || 'NA' });
                        else { const e = majorIllnessesMap.get(key); if (e.date === 'NA' && ill.date) e.date = ill.date; if (e.hospital === 'NA' && ill.hospital) e.hospital = ill.hospital; if (e.notes === 'NA' && ill.notes) e.notes = ill.notes; }
                    }
                });
            }
            if (Array.isArray(doc.interventions)) {
                doc.interventions.forEach(iv => {
                    if (iv?.name && iv.name !== 'NA') {
                        const key = iv.name.toLowerCase().trim();
                        if (!previousInterventionsMap.has(key)) previousInterventionsMap.set(key, { name: iv.name, date: iv.date || 'NA', hospital: iv.hospital || 'NA' });
                        else { const e = previousInterventionsMap.get(key); if (e.date === 'NA' && iv.date) e.date = iv.date; if (e.hospital === 'NA' && iv.hospital) e.hospital = iv.hospital; }
                    }
                });
            }
            if (Array.isArray(doc.bloodThinner)) {
                doc.bloodThinner.forEach(bt => { if (bt?.name && bt.name !== 'NA') { const key = bt.name.toLowerCase().trim(); if (!bloodThinnerMap.has(key)) bloodThinnerMap.set(key, { name: bt.name, type: bt.type || 'NA', duration: bt.duration || 'NA', reason: bt.reason || 'NA' }); } });
            }
            if (Array.isArray(doc.comorbidConditions)) { doc.comorbidConditions.forEach(c => { const n = typeof c === 'string' ? c : c?.name; if (n && n !== 'NA') comorbidMap.set(n.toLowerCase().trim(), n); }); }
            if (Array.isArray(doc.chronicDiseases)) { doc.chronicDiseases.forEach(c => { const n = typeof c === 'string' ? c : c?.name; if (n && n !== 'NA') chronicMap.set(n.toLowerCase().trim(), n); }); }
            if (Array.isArray(doc.diagnoses)) {
                doc.diagnoses.forEach(d => {
                    if (d && d !== 'NA') {
                        if (this.isChronicDisease(d)) chronicMap.set(d.toLowerCase().trim(), d);
                        if (this.isComorbidCondition(d)) comorbidMap.set(d.toLowerCase().trim(), d);
                    }
                });
            }
            if (Array.isArray(doc.hospitals)) doc.hospitals.forEach(h => h && h !== 'NA' && hospitalsSet.add(h));
            if (Array.isArray(doc.doctors)) doc.doctors.forEach(d => d && d !== 'NA' && doctorsSet.add(d));

            if (Array.isArray(doc.parsedMedicalHistory)) {
                doc.parsedMedicalHistory.forEach(r => { const key = `${r.year}-${r.month}-${r.day}-${r.type}`; if (!medicalHistoryMap.has(key)) medicalHistoryMap.set(key, r); });
            }
            if (doc.processedAt) {
                const dt = new Date(doc.processedAt);
                const key = `${dt.getFullYear()}-${dt.toLocaleString('default', { month: 'long' })}-${dt.getDate()}-${doc.fileId}`;
                if (!medicalHistoryMap.has(key)) {
                    medicalHistoryMap.set(key, { year: dt.getFullYear(), month: dt.toLocaleString('default', { month: 'long' }), day: dt.getDate(), type: this.getRecordType(doc), description: doc.summary || `Document: ${doc.fileName}`, documentId: doc.fileId });
                }
            }
            if (doc.extractedText) this.parseExtractedTextWithDeduplication(doc.extractedText, { pastSurgeriesMap, majorIllnessesMap, previousInterventionsMap, bloodThinnerMap, allergiesMap, hospitalsSet, doctorsSet });
        });

        if (medicalForm) {
            medicalForm.surgicalHistory?.pastSurgeries?.forEach(s => { if (s.surgery) { const k = s.surgery.toLowerCase(); if (!pastSurgeriesMap.has(k)) pastSurgeriesMap.set(k, { name: s.surgery, date: s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA', hospital: s.hospital || 'NA', surgeon: s.surgeon || 'NA' }); } });
            medicalForm.surgicalHistory?.majorIllnesses?.forEach(ill => { if (ill.illness) { const k = ill.illness.toLowerCase(); if (!majorIllnessesMap.has(k)) majorIllnessesMap.set(k, { name: ill.illness, date: ill.year || 'NA', hospital: ill.hospital || 'NA', notes: ill.notes || 'NA' }); } });
            medicalForm.surgicalHistory?.previousInterventions?.forEach(iv => { if (iv.name) { const k = iv.name.toLowerCase(); if (!previousInterventionsMap.has(k)) previousInterventionsMap.set(k, { name: iv.name, date: iv.date ? new Date(iv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA', hospital: iv.hospital || 'NA' }); } });
            medicalForm.medications?.bloodThinnerHistory?.forEach(bt => { if (bt.name) { const k = bt.name.toLowerCase(); if (!bloodThinnerMap.has(k)) bloodThinnerMap.set(k, { name: bt.name, type: bt.type || 'NA', duration: bt.duration || 'NA', reason: bt.reason || 'NA' }); } });
            medicalForm.medicalConditions?.comorbidConditions?.forEach(c => { if (c) comorbidMap.set(c.toLowerCase(), c); });
            medicalForm.medicalConditions?.chronicDiseases?.forEach(c => { if (c) chronicMap.set(c.toLowerCase(), c); });
        }

        let emergencyContact = { name: 'NA', relationship: 'NA', phone: 'NA' };
        if (medicalForm?.emergencyContact?.name && medicalForm.emergencyContact.name !== 'NA') {
            emergencyContact = { name: medicalForm.emergencyContact.name, relationship: medicalForm.emergencyContact.relationship || 'NA', phone: medicalForm.emergencyContact.phone || 'NA' };
        }

        const histByYear = {};
        medicalHistoryMap.forEach(r => {
            if (!histByYear[r.year]) histByYear[r.year] = {};
            if (!histByYear[r.year][r.month]) histByYear[r.year][r.month] = [];
            histByYear[r.year][r.month].push({ day: r.day, type: r.type, description: r.description });
        });

        const toArr = m => m.size > 0 ? Array.from(m.values()) : null;
        const setArr = s => s.size > 0 ? Array.from(s) : null;

        return {
            patientDemographics: { name: patient.name || 'NA', patientId: patient.patientId || 'NA', dateOfBirth: formattedDob, age: age ? `${age} years` : 'NA', gender: medicalForm?.personalInfo?.gender || 'NA', email: patient.email || 'NA', phone: medicalForm?.personalInfo?.phone || 'NA' },
            address: formattedAddress,
            medicalProfile: { bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA', isDiabetic: medicalForm?.medicalConditions?.isDiabetic ? 'Yes' : 'No', diabetesType: medicalForm?.medicalConditions?.diabetesType || 'NA', hasThyroid: medicalForm?.medicalConditions?.hasThyroid ? 'Yes' : 'No', thyroidCondition: medicalForm?.medicalConditions?.thyroidCondition || 'NA' },
            allergies: naOrArray(toArr(allergiesMap)?.map(n => ({ name: n })), { name: 'NA' }),
            comorbidConditions: naOrArray(toArr(comorbidMap)?.map(n => ({ name: n })), { name: 'NA' }),
            chronicDiseases: naOrArray(toArr(chronicMap)?.map(n => ({ name: n })), { name: 'NA' }),
            currentMedications: naOrArray(toArr(medicationsMap), { name: 'NA', purpose: 'NA', dosage: 'NA' }),
            pastSurgeries: naOrArray(toArr(pastSurgeriesMap), { name: 'NA', date: 'NA', hospital: 'NA', surgeon: 'NA' }),
            majorSurgeriesOrIllness: naOrArray(toArr(majorIllnessesMap), { name: 'NA', date: 'NA', hospital: 'NA', notes: 'NA' }),
            previousInterventions: naOrArray(toArr(previousInterventionsMap), { name: 'NA', date: 'NA', hospital: 'NA' }),
            bloodThinnerHistory: naOrArray(toArr(bloodThinnerMap), { name: 'NA', type: 'NA', duration: 'NA', reason: 'NA' }),
            emergencyContact,
            hospitals: setArr(hospitalsSet) || [],
            doctors: setArr(doctorsSet) || [],
            medicalHistory: this.formatMedicalHistory(histByYear),
            lastUpdated: new Date().toISOString(),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CARDIOLOGY SUMMARY — fully structured per template
    // ─────────────────────────────────────────────────────────────────────────

    generateCardiologySummary(patient, medicalForm, documents) {
        console.log('❤️  Generating cardiology summary');

        const age = getAge(medicalForm?.personalInfo?.dateOfBirth);
        const isDiabetic = medicalForm?.medicalConditions?.isDiabetic || false;
        const hasThyroid = medicalForm?.medicalConditions?.hasThyroid || false;

        // ── Collect all conditions from docs + medicalForm ────────────────────
        const allConditions = new Set();
        const allMedications = new Map();   // name → { name, type, dosage }
        const allInterventions = [];
        const allAllergies = [];
        const labResults = [];
        const recentInvestigations = [];

        // From medical form
        medicalForm?.medicalConditions?.chronicDiseases?.forEach(c => c && allConditions.add(c));
        medicalForm?.medicalConditions?.comorbidConditions?.forEach(c => c && allConditions.add(c));

        // Blood thinners from medical form
        const btHistory = medicalForm?.medications?.bloodThinnerHistory || [];
        const onBloodThinners = btHistory.length > 0;
        const btDetails = btHistory.map(bt => `${bt.name}${bt.duration && bt.duration !== 'NA' ? ' — ' + bt.duration : ''}`).join(', ') || 'None';

        // Allergies
        medicalForm?.medicalConditions?.medicationAllergies?.forEach(a => {
            const name = typeof a === 'object' ? a.medication : a;
            if (name) allAllergies.push(name);
        });

        // Surgeries / interventions from medical form
        medicalForm?.surgicalHistory?.previousInterventions?.forEach(iv => {
            if (iv.name) allInterventions.push({ procedure: iv.name, date: iv.date ? new Date(iv.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : 'NA', hospital: iv.hospital || 'NA', notes: 'NA' });
        });
        medicalForm?.surgicalHistory?.pastSurgeries?.forEach(s => {
            if (s.surgery && containsAny(s.surgery, CARDIAC_PROCEDURES)) {
                allInterventions.push({ procedure: s.surgery, date: s.date ? new Date(s.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : 'NA', hospital: s.hospital || 'NA', notes: s.notes || 'NA' });
            }
        });

        // From documents
        documents.forEach(doc => {
            // Conditions
            doc.diagnoses?.forEach(d => d && allConditions.add(d));
            doc.comorbidConditions?.forEach(c => { const n = typeof c === 'string' ? c : c?.name; if (n) allConditions.add(n); });
            doc.chronicDiseases?.forEach(c => { const n = typeof c === 'string' ? c : c?.name; if (n) allConditions.add(n); });

            // Medications → classify
            doc.medications?.forEach(m => {
                const name = typeof m === 'object' ? m?.name : m;
                if (!name) return;
                const key = name.toLowerCase().trim();
                if (!allMedications.has(key)) {
                    const cardType = classifyMedication(name, CARDIAC_DRUG_TYPES);
                    allMedications.set(key, { name, type: cardType ? this._formatDrugType(cardType) : 'Prescribed', dosage: m?.dosage || 'NA' });
                }
            });

            // Interventions from docs
            doc.interventions?.forEach(iv => {
                if (iv?.name && containsAny(iv.name, CARDIAC_PROCEDURES)) {
                    allInterventions.push({ procedure: iv.name, date: iv.date || 'NA', hospital: iv.hospital || 'NA', notes: 'NA' });
                }
            });
            doc.pastSurgeries?.forEach(s => {
                if (s?.name && containsAny(s.name, CARDIAC_PROCEDURES)) {
                    allInterventions.push({ procedure: s.name, date: s.date || 'NA', hospital: s.hospital || 'NA', notes: s.notes || 'NA' });
                }
            });

            // Lab results
            doc.labResults?.forEach(l => l && labResults.push(l));

            // Allergies
            doc.allergies?.forEach(a => { const n = typeof a === 'string' ? a : a?.name; if (n && !allAllergies.includes(n)) allAllergies.push(n); });

            // Imaging/investigations from document name/type
            if (doc.fileName) {
                const fname = doc.fileName.toLowerCase();
                if (['ecg', 'ekg', 'echo', 'angio', 'stress', 'holter', 'ct', 'mri', 'xray', 'x-ray', 'troponin', 'lipid', 'cholesterol'].some(k => fname.includes(k))) {
                    recentInvestigations.push({
                        test: doc.fileName,
                        date: doc.processedAt ? new Date(doc.processedAt).getFullYear().toString() : 'NA',
                        result: doc.summary ? doc.summary.slice(0, 120) : 'See document',
                    });
                }
            }
        });

        // Also add current medications from medical form (not in docs)
        medicalForm?.medications?.currentMedications?.forEach(m => {
            const name = typeof m === 'object' ? m.name : m;
            if (!name) return;
            const key = name.toLowerCase().trim();
            if (!allMedications.has(key)) {
                const cardType = classifyMedication(name, CARDIAC_DRUG_TYPES);
                allMedications.set(key, { name, type: cardType ? this._formatDrugType(cardType) : 'Prescribed', dosage: m?.dosage || 'NA' });
            }
        });

        // ── Cardiac-specific conditions ───────────────────────────────────────
        const cardiacConditions = Array.from(allConditions).filter(c => containsAny(c, CARDIAC_CONDITIONS));
        const allConditionsArr = Array.from(allConditions);

        // ── Previous cardiac events ───────────────────────────────────────────
        const previousCardiacEvents = allConditionsArr
            .filter(c => containsAny(c, ['myocardial infarction', 'heart attack', 'mi ', 'stroke', 'tia', 'cardiac arrest', 'heart failure']))
            .map(c => ({ event: c, date: 'NA', severity: 'NA', treatment: 'NA' }));

        // ── Risk profile ──────────────────────────────────────────────────────
        const hasDiabetes = isDiabetic || allConditionsArr.some(c => containsAny(c, ['diabetes', 'diabetic']));
        const hasHtn = allConditionsArr.some(c => containsAny(c, ['hypertension', 'high blood pressure', 'htn']));
        const hasCad = allConditionsArr.some(c => containsAny(c, ['coronary artery', 'cad', 'angina', 'ischemic']));
        const hasHF = allConditionsArr.some(c => containsAny(c, ['heart failure', 'chf']));
        const hasAfib = allConditionsArr.some(c => containsAny(c, ['atrial fibrillation', 'afib', 'af ']));
        const hasPriorMI = previousCardiacEvents.length > 0;

        // Risk level
        let riskLevel = 'Low';
        let riskScore = 0;
        if (hasDiabetes) riskScore += 2;
        if (hasHtn) riskScore += 2;
        if (hasCad) riskScore += 3;
        if (hasHF) riskScore += 3;
        if (hasAfib) riskScore += 2;
        if (hasPriorMI) riskScore += 3;
        if (onBloodThinners) riskScore += 1;
        if (age && age > 65) riskScore += 2;
        if (riskScore >= 7) riskLevel = 'High';
        else if (riskScore >= 4) riskLevel = 'Medium';

        // ── Red flags ─────────────────────────────────────────────────────────
        const redFlags = [];
        if (hasPriorMI) redFlags.push('History of myocardial infarction');
        if (hasHF) redFlags.push('History of heart failure');
        if (hasAfib) redFlags.push('Atrial fibrillation — bleeding risk if on anticoagulants');
        if (hasCad) redFlags.push('Coronary artery disease — angina risk');
        if (onBloodThinners && allAllergies.length > 0) redFlags.push('On blood thinners — check drug interactions before prescribing');
        if (hasDiabetes && hasHtn) redFlags.push('Diabetic + Hypertensive — high cardiovascular risk combination');
        if (age && age > 70 && hasCad) redFlags.push('Elderly patient with CAD — caution with procedures');
        if (redFlags.length === 0) redFlags.push('No immediate red flags identified');

        // ── Primary concern ───────────────────────────────────────────────────
        const primaryConcern = hasCad
            ? `Coronary artery disease${hasPriorMI ? ' with prior MI' : ''}`
            : hasHF ? 'Heart failure'
                : hasAfib ? 'Atrial fibrillation'
                    : hasHtn ? 'Hypertension'
                        : cardiacConditions.length > 0 ? cardiacConditions[0]
                            : 'No active cardiac diagnosis';

        // ── Immediate action ──────────────────────────────────────────────────
        const immediateAction = riskLevel === 'High'
            ? 'Urgent cardiac evaluation required. Rule out ACS. ECG and troponin stat.'
            : riskLevel === 'Medium'
                ? 'Review current medications, check BP and lipids. Schedule stress test if not recent.'
                : 'Routine follow-up. Continue preventive measures.';

        // ── Vitals (from docs if available) ───────────────────────────────────
        const vitals = this.extractVitals(documents);

        // ── Medications list ──────────────────────────────────────────────────
        const cardiacMeds = Array.from(allMedications.values());

        return {
            patientInfo: {
                name: patient.name || 'NA',
                patientId: patient.patientId || 'NA',
                age: age ? `${age} years` : 'NA',
                gender: medicalForm?.personalInfo?.gender || 'NA',
                bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA',
                isDiabetic: hasDiabetes ? 'Yes' : 'No',
                hasThyroid: hasThyroid ? 'Yes' : 'No',
            },

            riskProfile: {
                hasChestPain: 'Not recorded',
                shortnessOfBreath: 'Not recorded',
                syncopeHistory: 'Not recorded',
                palpitations: hasAfib ? 'Likely (Afib noted)' : 'Not recorded',
                familyHistoryHeartDisease: 'Not recorded',
                smokingStatus: 'Not recorded',
                alcoholUse: 'Not recorded',
            },

            vitalIndicators: {
                bloodPressure: vitals.bloodPressure || 'NA',
                heartRate: vitals.heartRate || 'NA',
                cholesterolLevels: { LDL: 'NA', HDL: 'NA', triglycerides: 'NA' },
                bloodSugar: hasDiabetes ? 'Diabetic — check latest values' : 'NA',
            },

            cardiacConditions: cardiacConditions.length > 0 ? cardiacConditions : ['No specific cardiac conditions recorded'],

            previousCardiacEvents: previousCardiacEvents.length > 0
                ? previousCardiacEvents
                : [{ event: 'None recorded', date: 'NA', severity: 'NA', treatment: 'NA' }],

            proceduresAndInterventions: allInterventions.length > 0
                ? allInterventions.slice(0, 10)
                : [{ procedure: 'None recorded', date: 'NA', hospital: 'NA', notes: 'NA' }],

            currentCardiacMedications: cardiacMeds.length > 0
                ? cardiacMeds.map(m => ({ name: m.name, type: m.type, dosage: m.dosage }))
                : [{ name: 'None recorded', type: 'NA', dosage: 'NA' }],

            bloodThinnerStatus: {
                onBloodThinners: onBloodThinners ? 'Yes' : 'No',
                details: btDetails,
            },

            recentInvestigations: recentInvestigations.length > 0
                ? recentInvestigations.slice(0, 5)
                : [{ test: 'No investigations on file', date: 'NA', result: 'NA' }],

            allergies: allAllergies.length > 0 ? allAllergies : ['None recorded'],

            redFlagAlerts: redFlags,

            doctorQuickView: {
                primaryConcern: primaryConcern,
                riskLevel: riskLevel,
                immediateActionHint: immediateAction,
            },

            lastUpdated: new Date().toISOString(),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ORTHOPEDIC SUMMARY — fully structured per template
    // ─────────────────────────────────────────────────────────────────────────

    generateOrthopedicSummary(patient, medicalForm, documents) {
        console.log('🦴  Generating orthopedic summary');

        const age = getAge(medicalForm?.personalInfo?.dateOfBirth);
        const isDiabetic = medicalForm?.medicalConditions?.isDiabetic || false;
        const hasThyroid = medicalForm?.medicalConditions?.hasThyroid || false;

        const allConditions = new Set();
        const allMedications = new Map();
        const previousSurgeries = [];
        const previousInjuries = [];
        const implantsOrDevices = [];
        const recentImaging = [];
        const allAllergies = [];

        // From medical form
        medicalForm?.medicalConditions?.chronicDiseases?.forEach(c => c && allConditions.add(c));
        medicalForm?.medicalConditions?.comorbidConditions?.forEach(c => c && allConditions.add(c));
        medicalForm?.medicalConditions?.medicationAllergies?.forEach(a => {
            const name = typeof a === 'object' ? a.medication : a;
            if (name) allAllergies.push(name);
        });

        // Current medications from medical form
        medicalForm?.medications?.currentMedications?.forEach(m => {
            const name = typeof m === 'object' ? m.name : m;
            if (!name) return;
            const key = name.toLowerCase().trim();
            if (!allMedications.has(key)) {
                const orthoType = classifyMedication(name, ORTHO_DRUG_TYPES);
                allMedications.set(key, { name, type: orthoType ? this._formatDrugType(orthoType) : 'Prescribed', dosage: m?.dosage || 'NA' });
            }
        });

        // Surgeries from medical form
        medicalForm?.surgicalHistory?.pastSurgeries?.forEach(s => {
            if (!s.surgery) return;
            const isOrtho = containsAny(s.surgery, ORTHO_PROCEDURES);
            previousSurgeries.push({
                procedure: s.surgery,
                date: s.date ? new Date(s.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : 'NA',
                implantUsed: containsAny(s.surgery, ['replacement', 'implant', 'prosthesis', 'arthroplasty']) ? 'Yes' : 'Unknown',
                recoveryStatus: 'NA',
            });
            // Also check for implants
            if (containsAny(s.surgery, ['replacement', 'implant', 'prosthesis', 'arthroplasty', 'fixation'])) {
                implantsOrDevices.push({
                    type: s.surgery,
                    location: s.surgery,
                    year: s.date ? new Date(s.date).getFullYear().toString() : 'NA',
                });
            }
        });
        medicalForm?.surgicalHistory?.majorIllnesses?.forEach(ill => {
            if (ill.illness && containsAny(ill.illness, [...ORTHO_CONDITIONS, ...ORTHO_PROCEDURES])) {
                previousInjuries.push({ injury: ill.illness, year: ill.year || 'NA', side: 'NA' });
            }
        });
        medicalForm?.surgicalHistory?.previousInterventions?.forEach(iv => {
            if (iv.name && containsAny(iv.name, ORTHO_PROCEDURES)) {
                previousSurgeries.push({ procedure: iv.name, date: iv.date ? new Date(iv.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : 'NA', implantUsed: 'Unknown', recoveryStatus: 'NA' });
            }
        });

        // From documents
        documents.forEach(doc => {
            doc.diagnoses?.forEach(d => d && allConditions.add(d));
            doc.comorbidConditions?.forEach(c => { const n = typeof c === 'string' ? c : c?.name; if (n) allConditions.add(n); });
            doc.chronicDiseases?.forEach(c => { const n = typeof c === 'string' ? c : c?.name; if (n) allConditions.add(n); });

            doc.medications?.forEach(m => {
                const name = typeof m === 'object' ? m?.name : m;
                if (!name) return;
                const key = name.toLowerCase().trim();
                if (!allMedications.has(key)) {
                    const orthoType = classifyMedication(name, ORTHO_DRUG_TYPES);
                    allMedications.set(key, { name, type: orthoType ? this._formatDrugType(orthoType) : 'Prescribed', dosage: m?.dosage || 'NA' });
                }
            });

            doc.pastSurgeries?.forEach(s => {
                if (s?.name) {
                    previousSurgeries.push({ procedure: s.name, date: s.date || 'NA', implantUsed: containsAny(s.name, ['replacement', 'implant', 'prosthesis']) ? 'Yes' : 'Unknown', recoveryStatus: 'NA' });
                }
            });
            doc.interventions?.forEach(iv => {
                if (iv?.name && containsAny(iv.name, ORTHO_PROCEDURES)) {
                    previousSurgeries.push({ procedure: iv.name, date: iv.date || 'NA', implantUsed: 'Unknown', recoveryStatus: 'NA' });
                }
            });

            doc.allergies?.forEach(a => { const n = typeof a === 'string' ? a : a?.name; if (n && !allAllergies.includes(n)) allAllergies.push(n); });

            // Imaging from doc filename
            if (doc.fileName) {
                const fname = doc.fileName.toLowerCase();
                const imagingTypes = { 'xray': 'X-Ray', 'x-ray': 'X-Ray', 'mri': 'MRI', 'ct scan': 'CT Scan', 'dexa': 'DEXA Scan', 'bone density': 'Bone Density', 'ultrasound': 'Ultrasound' };
                for (const [key, label] of Object.entries(imagingTypes)) {
                    if (fname.includes(key)) {
                        recentImaging.push({ type: label, area: 'See document', result: doc.summary ? doc.summary.slice(0, 100) : 'See document' });
                        break;
                    }
                }
            }
        });

        // ── Orthopedic conditions ─────────────────────────────────────────────
        const allConditionsArr = Array.from(allConditions);
        const orthoConditions = allConditionsArr.filter(c => containsAny(c, ORTHO_CONDITIONS));

        const hasOsteoArthritis = allConditionsArr.some(c => containsAny(c, ['osteoarthritis', 'oa ']));
        const hasRA = allConditionsArr.some(c => containsAny(c, ['rheumatoid', 'ra ']));
        const hasOsteoporosis = allConditionsArr.some(c => containsAny(c, ['osteoporosis']));
        const hasSpine = allConditionsArr.some(c => containsAny(c, ['spondylitis', 'disc', 'spinal', 'sciatica', 'lumbar', 'cervical']));
        const hasJointReplacement = previousSurgeries.some(s => containsAny(s.procedure, ['replacement', 'arthroplasty']));
        const hasImplants = implantsOrDevices.length > 0 || hasJointReplacement;

        // ── Risk factors ──────────────────────────────────────────────────────
        const riskFactors = [];
        if (isDiabetic) riskFactors.push('Diabetes — impaired wound healing');
        if (hasOsteoporosis) riskFactors.push('Osteoporosis — fracture risk');
        if (age && age > 60) riskFactors.push('Age > 60 — degenerative changes likely');
        if (hasRA) riskFactors.push('Rheumatoid arthritis — systemic inflammation');
        if (hasImplants) riskFactors.push('Previous joint implants — check for loosening');
        if (riskFactors.length === 0) riskFactors.push('No significant orthopedic risk factors');

        // ── Red flags ─────────────────────────────────────────────────────────
        const redFlags = [];
        if (hasJointReplacement) redFlags.push('Post-joint replacement — assess prosthesis integrity');
        if (hasOsteoporosis) redFlags.push('Osteoporosis — high fracture risk');
        if (hasRA) redFlags.push('Rheumatoid arthritis — may be on biologics/DMARDs, check before surgery');
        if (hasSpine) redFlags.push('Spine condition — assess neurological symptoms');
        if (isDiabetic && hasImplants) redFlags.push('Diabetic with implants — infection surveillance required');
        if (implantsOrDevices.length > 0) redFlags.push(`Implants present — avoid MRI without clearance`);
        if (redFlags.length === 0) redFlags.push('No immediate red flags identified');

        // ── Severity & concern ────────────────────────────────────────────────
        let severityLevel = 'Low';
        let sevScore = 0;
        if (hasJointReplacement) sevScore += 3;
        if (hasOsteoporosis) sevScore += 2;
        if (hasRA) sevScore += 2;
        if (hasSpine) sevScore += 2;
        if (previousSurgeries.length > 1) sevScore += 1;
        if (age && age > 65) sevScore += 1;
        if (sevScore >= 6) severityLevel = 'High';
        else if (sevScore >= 3) severityLevel = 'Moderate';

        const primaryConcern = hasJointReplacement
            ? 'Joint replacement — assess prosthesis and function'
            : hasRA ? 'Rheumatoid arthritis — active disease management'
                : hasSpine ? 'Spinal condition — assess neurological status'
                    : hasOsteoArthritis ? 'Osteoarthritis — pain and mobility management'
                        : hasOsteoporosis ? 'Osteoporosis — fracture prevention'
                            : orthoConditions.length > 0 ? orthoConditions[0]
                                : 'No active orthopedic diagnosis recorded';

        const immediateAction = severityLevel === 'High'
            ? 'Review imaging (X-Ray/MRI), assess joint function, check implant integrity.'
            : severityLevel === 'Moderate'
                ? 'Clinical assessment of affected joints, review medications, consider physiotherapy referral.'
                : 'Routine evaluation. Document baseline function and range of motion.';

        return {
            patientInfo: {
                name: patient.name || 'NA',
                patientId: patient.patientId || 'NA',
                age: age ? `${age} years` : 'NA',
                gender: medicalForm?.personalInfo?.gender || 'NA',
                bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA',
                isDiabetic: isDiabetic ? 'Yes' : 'No',
                hasThyroid: hasThyroid ? 'Yes' : 'No',
            },

            presentingIssues: {
                painLocation: 'Not recorded — assess on examination',
                painSeverity: 'Not recorded',
                painDuration: 'Not recorded',
                mobilityRestriction: hasJointReplacement ? 'Possible — post-surgical' : 'Not recorded',
                historyOfTrauma: previousInjuries.length > 0 ? 'Yes' : 'Not recorded',
            },

            functionalStatus: {
                canWalk: hasJointReplacement ? 'With possible support' : 'Assess on examination',
                canLiftWeight: hasSpine ? 'Restricted (spine condition)' : 'Assess on examination',
                rangeOfMotion: 'Assess on examination',
            },

            boneAndJointConditions: orthoConditions.length > 0
                ? orthoConditions
                : ['No specific bone/joint conditions recorded'],

            previousInjuries: previousInjuries.length > 0
                ? previousInjuries
                : [{ injury: 'None recorded', year: 'NA', side: 'NA' }],

            surgeriesAndProcedures: previousSurgeries.length > 0
                ? previousSurgeries.slice(0, 10)
                : [{ procedure: 'None recorded', date: 'NA', implantUsed: 'No', recoveryStatus: 'NA' }],

            implantsOrDevices: implantsOrDevices.length > 0
                ? implantsOrDevices
                : [{ type: 'None', location: 'NA', year: 'NA' }],

            currentMedications: Array.from(allMedications.values()).length > 0
                ? Array.from(allMedications.values()).map(m => ({ name: m.name, type: m.type, dosage: m.dosage }))
                : [{ name: 'None recorded', type: 'NA', dosage: 'NA' }],

            allergies: allAllergies.length > 0 ? allAllergies : ['None recorded'],

            recentImaging: recentImaging.length > 0
                ? recentImaging.slice(0, 5)
                : [{ type: 'No imaging on file', area: 'NA', result: 'NA' }],

            riskFactors,

            redFlagAlerts: redFlags,

            doctorQuickView: {
                primaryConcern: primaryConcern,
                severityLevel: severityLevel,
                immediateActionHint: immediateAction,
            },

            lastUpdated: new Date().toISOString(),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    _formatDrugType(key) {
        const labels = {
            antiplatelet: 'Antiplatelet', statin: 'Statin', betaBlocker: 'Beta Blocker',
            aceInhibitor: 'ACE Inhibitor', arb: 'ARB', calciumChannel: 'Calcium Channel Blocker',
            anticoagulant: 'Anticoagulant', diuretic: 'Diuretic', nitrate: 'Nitrate',
            antiarrhythmic: 'Anti-arrhythmic', nsaid: 'NSAID', opioid: 'Opioid Analgesic',
            dmard: 'DMARD', biologic: 'Biologic', steroid: 'Corticosteroid',
            supplement: 'Supplement', bisphosphonate: 'Bisphosphonate', muscle_relaxant: 'Muscle Relaxant',
        };
        return labels[key] || key;
    }

    parseExtractedTextWithDeduplication(text, collections) {
        const { pastSurgeriesMap, majorIllnessesMap, previousInterventionsMap, bloodThinnerMap, allergiesMap, hospitalsSet, doctorsSet } = collections;
        const lines = text.split('\n');
        let currentSection = null;
        let currentItem = null;

        for (const line of lines) {
            const l = line.trim();
            const lu = l.toUpperCase();
            if (!l) continue;
            if (ALL_SECTION_HEADERS.has(lu)) {
                currentItem = null;
                if (lu === 'PAST SURGERIES') currentSection = 'surgeries';
                else if (lu.startsWith('MAJOR SURGERIES')) currentSection = 'major';
                else if (lu === 'PREVIOUS INTERVENTIONS') currentSection = 'interventions';
                else if (lu === 'BLOOD THINNER HISTORY') currentSection = 'bloodThinner';
                else if (lu === 'ALLERGIES') currentSection = 'allergies';
                else currentSection = null;
                continue;
            }
            if (!currentSection) continue;
            if (/^[•*\-–¢+►→▪✓❯›]/.test(l)) {
                const raw = l.replace(/^[•*\-–¢+►→▪✓❯›]\s*/, '');
                if (currentSection === 'surgeries') { const k = raw.toLowerCase(); if (!pastSurgeriesMap.has(k)) { currentItem = { name: raw, date: 'NA', hospital: 'NA', surgeon: 'NA' }; pastSurgeriesMap.set(k, currentItem); } else currentItem = pastSurgeriesMap.get(k); }
                else if (currentSection === 'major') { const k = raw.toLowerCase(); if (!majorIllnessesMap.has(k)) { currentItem = { name: raw, date: 'NA', hospital: 'NA', notes: 'NA' }; majorIllnessesMap.set(k, currentItem); } else currentItem = majorIllnessesMap.get(k); }
                else if (currentSection === 'interventions') { const k = raw.toLowerCase(); if (!previousInterventionsMap.has(k)) { currentItem = { name: raw, date: 'NA', hospital: 'NA' }; previousInterventionsMap.set(k, currentItem); } else currentItem = previousInterventionsMap.get(k); }
                else if (currentSection === 'bloodThinner') { const m = raw.match(/^(.+?)\s*\(([^)]+)\)$/); const name = m ? m[1].trim() : raw; const type = m ? m[2].trim() : 'NA'; const k = name.toLowerCase(); if (!bloodThinnerMap.has(k)) { currentItem = { name, type, duration: 'NA', reason: 'NA' }; bloodThinnerMap.set(k, currentItem); } else currentItem = bloodThinnerMap.get(k); }
                else if (currentSection === 'allergies') { const k = raw.toLowerCase(); if (!allergiesMap.has(k)) allergiesMap.set(k, raw); currentItem = null; }
            } else if (currentItem) {
                const lowerL = l.toLowerCase();
                const subFields = { 'date:': 'date', 'hospital:': 'hospital', 'surgeon:': 'surgeon', 'notes:': 'notes', 'duration:': 'duration', 'reason:': 'reason', 'type:': 'type' };
                for (const [pfx, field] of Object.entries(subFields)) {
                    if (lowerL.startsWith(pfx)) { currentItem[field] = l.slice(pfx.length).trim(); if (field === 'hospital') hospitalsSet.add(currentItem[field]); if (field === 'surgeon') doctorsSet.add(currentItem[field]); break; }
                }
            }
        }
    }

    formatMedicalHistory(historyByYear) {
        const monthOrder = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
        return Object.keys(historyByYear).sort((a, b) => parseInt(b) - parseInt(a)).map(year => ({
            year,
            months: Object.keys(historyByYear[year]).sort((a, b) => (monthOrder[b] || 0) - (monthOrder[a] || 0)).map(month => ({
                month,
                records: historyByYear[year][month].sort((a, b) => b.day - a.day).map(r => ({ day: r.day, type: r.type, description: r.description }))
            }))
        }));
    }

    isChronicDisease(d) { return ['diabetes', 'hypertension', 'asthma', 'copd', 'arthritis', 'heart disease', 'ckd', 'kidney disease', 'liver disease', 'thyroid', 'osteoporosis', 'alzheimer', 'parkinson', 'high cholesterol', 'hyperlipidemia'].some(k => d.toLowerCase().includes(k)); }
    isComorbidCondition(d) { return ['hypertension', 'diabetes', 'high cholesterol', 'obesity', 'heart failure', 'copd', 'asthma', 'depression', 'anxiety', 'hyperlipidemia', 'type 2'].some(k => d.toLowerCase().includes(k)); }
    getRecordType(doc) { const n = (doc.fileName || '').toLowerCase(); if (n.includes('lab')) return 'LAB TEST'; if (n.includes('xray')) return 'IMAGING'; if (n.includes('prescription')) return 'PRESCRIPTION'; if (n.includes('discharge')) return 'DISCHARGE SUMMARY'; if (doc.diagnoses?.length > 0) return 'CONSULTATION'; return 'DOCUMENT'; }
    containsKeyword(text, keywords) { if (!text) return false; const lower = text.toLowerCase(); return keywords.some(k => lower.includes(k.toLowerCase())); }
    extractVitals(documents) { const v = { bloodPressure: 'NA', heartRate: 'NA', temperature: 'NA', weight: 'NA' }; if (documents[0]?.vitals) return documents[0].vitals; return v; }
    extractMobilityStatus(documents) { const kws = ['walking', 'ambulatory', 'wheelchair', 'crutches', 'cane', 'walker']; for (const doc of documents.slice(0, 3)) { if (doc.summary) { for (const kw of kws) { if (doc.summary.toLowerCase().includes(kw)) return `Patient requires ${kw}`; } } } return 'Mobility status unknown'; }
    calculateCardiacRiskFactors(patient, medicalForm, cardiacDiagnoses) { const rf = []; if (cardiacDiagnoses.has('hypertension')) rf.push('Hypertension'); if (cardiacDiagnoses.has('diabetes')) rf.push('Diabetes'); return rf.length > 0 ? rf : ['No specific cardiac risk factors identified']; }
    parseMedication(s) { const r = { name: s, purpose: 'NA', dosage: 'NA' }; const dm = s.match(/(\d+\s*(?:mg|mcg|g|ml))/i); if (dm) { r.dosage = dm[1]; r.name = s.replace(dm[0], '').trim(); } const pm = { diabetes: ['metformin', 'glipizide', 'insulin'], 'blood pressure': ['lisinopril', 'amlodipine', 'losartan'], cholesterol: ['atorvastatin', 'simvastatin', 'rosuvastatin'], pain: ['ibuprofen', 'naproxen', 'tramadol'] }; const low = s.toLowerCase(); for (const [p, drugs] of Object.entries(pm)) { if (drugs.some(d => low.includes(d))) { r.purpose = p; break; } } return r; }
}

module.exports = new SummaryGenerator();