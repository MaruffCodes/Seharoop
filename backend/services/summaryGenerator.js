/**
 * Medical Summary Generator
 * Generates different types of summaries based on specialty with aggressive deduplication.
 *
 * CHANGES vs original:
 *  1. generateGeneralSummary now reads structured sub-fields from ProcessedDocument
 *     that the new MedicalEntityExtractor emits (allergies, medications, pastSurgeries,
 *     majorIllnesses, interventions, bloodThinner, emergencyContact, demographics).
 *  2. parseExtractedTextWithDeduplication has a hard section-reset list so it can
 *     never bleed content between sections. (kept as a fallback for legacy docs)
 *  3. Medications are never sourced from the allergies array.
 *  4. emergencyContact is read from doc.emergencyContact when the medicalForm field
 *     is absent.
 *  5. Medical history now merges doc-level parsed history records too.
 */

const PatientSummary = require('../models/PatientSummary');
const User = require('../models/User');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');

// All known section headers — used to hard-reset the parser
const ALL_SECTION_HEADERS = new Set([
    'PATIENT DEMOGRAPHICS', 'ADDRESS', 'MEDICAL PROFILE',
    'ALLERGIES', 'COMORBID CONDITIONS', 'CHRONIC DISEASES',
    'CURRENT MEDICATIONS', 'PAST SURGERIES',
    'MAJOR SURGERIES', 'MAJOR SURGERIES / ILLNESS',
    'PREVIOUS INTERVENTIONS', 'BLOOD THINNER HISTORY',
    'EMERGENCY CONTACT', 'MEDICAL HISTORY', 'DIAGNOSES',
]);

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

            let patientSummary = await PatientSummary.findOne({ patientId: patient._id });
            if (!patientSummary) patientSummary = new PatientSummary({ patientId: patient._id });

            patientSummary.generalSummary = generalSummary;
            patientSummary.cardiologySummary = cardiologySummary;
            patientSummary.orthopedicSummary = orthopedicSummary;
            patientSummary.lastUpdated = new Date();
            patientSummary.documentCount = documents.length;
            patientSummary.version = (patientSummary.version || 0) + 1;

            await patientSummary.save();
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
                version: ps.version
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
            const allDocuments = await ProcessedDocument.find({ userId }).sort({ processedAt: -1 });
            return await this.generateAndSaveAllSummaries(patient, medicalForm, allDocuments);
        } catch (error) {
            console.error('❌ Error refreshing summaries:', error);
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERAL SUMMARY
    // ─────────────────────────────────────────────────────────────────────────

    generateGeneralSummary(patient, medicalForm, documents) {
        console.log(`📊 Generating general summary — ${documents.length} docs`);

        // ── Demographics from medicalForm ─────────────────────────────────────
        const dob = medicalForm?.personalInfo?.dateOfBirth
            ? new Date(medicalForm.personalInfo.dateOfBirth) : null;
        const age = dob ? new Date().getFullYear() - dob.getFullYear() : null;
        const formattedDob = dob
            ? dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'NA';

        const address = medicalForm?.personalInfo?.address || {};
        const formattedAddress = [address.street, address.city, address.state,
        address.pincode ? `- ${address.pincode}` : null, address.country]
            .filter(Boolean).join(', ') || 'NA';

        // ── Dedup collections ─────────────────────────────────────────────────
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

        // ── Process each document ─────────────────────────────────────────────
        documents.forEach(doc => {
            console.log(`📄 Processing document: ${doc.fileName}`);

            // ── ALLERGIES — read ONLY from doc.allergies (section-isolated by extractor)
            if (Array.isArray(doc.allergies)) {
                doc.allergies.forEach(a => {
                    const name = typeof a === 'string' ? a : a?.name;
                    if (name && name !== 'NA') {
                        allergiesMap.set(name.toLowerCase().trim(), name);
                    }
                });
            }

            // ── MEDICATIONS — read ONLY from doc.medications (already structured)
            if (Array.isArray(doc.medications)) {
                doc.medications.forEach(m => {
                    const name = typeof m === 'object' ? m?.name : m;
                    if (name && name !== 'NA') {
                        const key = name.toLowerCase().trim();
                        if (!medicationsMap.has(key)) {
                            medicationsMap.set(key, {
                                name: name,
                                purpose: m?.purpose || 'NA',
                                dosage: m?.dosage || 'NA'
                            });
                        }
                    }
                });
            }

            // ── PAST SURGERIES from doc (new extractor populates doc.pastSurgeries)
            if (Array.isArray(doc.pastSurgeries)) {
                doc.pastSurgeries.forEach(s => {
                    if (s?.name && s.name !== 'NA') {
                        const key = s.name.toLowerCase().trim();
                        if (!pastSurgeriesMap.has(key)) {
                            pastSurgeriesMap.set(key, {
                                name: s.name,
                                date: s.date || 'NA',
                                hospital: s.hospital || 'NA',
                                surgeon: s.surgeon || 'NA'
                            });
                        }
                    }
                });
            }

            // ── MAJOR ILLNESSES from doc
            if (Array.isArray(doc.majorIllnesses)) {
                doc.majorIllnesses.forEach(ill => {
                    if (ill?.name && ill.name !== 'NA') {
                        const key = ill.name.toLowerCase().trim();
                        if (!majorIllnessesMap.has(key)) {
                            majorIllnessesMap.set(key, {
                                name: ill.name,
                                date: ill.date || 'NA',
                                hospital: ill.hospital || 'NA',
                                notes: ill.notes || 'NA'
                            });
                        }
                    }
                });
            }

            // ── INTERVENTIONS from doc
            if (Array.isArray(doc.interventions)) {
                doc.interventions.forEach(iv => {
                    if (iv?.name && iv.name !== 'NA') {
                        const key = iv.name.toLowerCase().trim();
                        if (!previousInterventionsMap.has(key)) {
                            previousInterventionsMap.set(key, {
                                name: iv.name,
                                date: iv.date || 'NA',
                                hospital: iv.hospital || 'NA'
                            });
                        }
                    }
                });
            }

            // ── BLOOD THINNER from doc
            if (Array.isArray(doc.bloodThinner)) {
                doc.bloodThinner.forEach(bt => {
                    if (bt?.name && bt.name !== 'NA') {
                        const key = bt.name.toLowerCase().trim();
                        if (!bloodThinnerMap.has(key)) {
                            bloodThinnerMap.set(key, {
                                name: bt.name,
                                type: bt.type || 'NA',
                                duration: bt.duration || 'NA',
                                reason: bt.reason || 'NA'
                            });
                        }
                    }
                });
            }

            // ── DIAGNOSES → comorbid / chronic buckets
            if (Array.isArray(doc.diagnoses)) {
                doc.diagnoses.forEach(d => {
                    if (d && d !== 'NA' && typeof d === 'string') {
                        const key = d.toLowerCase().trim();
                        if (this.isChronicDisease(d)) chronicMap.set(key, d);
                        if (this.isComorbidCondition(d)) comorbidMap.set(key, d);
                    }
                });
            }

            // ── Also populate comorbid / chronic from dedicated doc fields
            if (Array.isArray(doc.comorbidConditions)) {
                doc.comorbidConditions.forEach(c => {
                    const name = typeof c === 'string' ? c : c?.name;
                    if (name && name !== 'NA') comorbidMap.set(name.toLowerCase().trim(), name);
                });
            }
            if (Array.isArray(doc.chronicDiseases)) {
                doc.chronicDiseases.forEach(c => {
                    const name = typeof c === 'string' ? c : c?.name;
                    if (name && name !== 'NA') chronicMap.set(name.toLowerCase().trim(), name);
                });
            }

            // ── HOSPITALS & DOCTORS
            if (Array.isArray(doc.hospitals)) doc.hospitals.forEach(h => h && h !== 'NA' && hospitalsSet.add(h));
            if (Array.isArray(doc.doctors)) doc.doctors.forEach(d => d && d !== 'NA' && doctorsSet.add(d));

            // ── PARSED MEDICAL HISTORY RECORDS from extractor
            if (Array.isArray(doc.parsedMedicalHistory)) {
                doc.parsedMedicalHistory.forEach(record => {
                    const key = `${record.year}-${record.month}-${record.day}-${record.type}`;
                    if (!medicalHistoryMap.has(key)) {
                        medicalHistoryMap.set(key, record);
                    }
                });
            }

            // ── Fallback: use processedAt as a history entry
            if (doc.processedAt) {
                const date = new Date(doc.processedAt);
                const year = date.getFullYear();
                const month = date.toLocaleString('default', { month: 'long' });
                const day = date.getDate();
                const key = `${year}-${month}-${day}-${doc.fileId}`;
                if (!medicalHistoryMap.has(key)) {
                    medicalHistoryMap.set(key, {
                        year, month, day,
                        type: this.getRecordType(doc),
                        description: doc.summary || `Document uploaded: ${doc.fileName}`,
                        documentId: doc.fileId
                    });
                }
            }

            // ── Legacy fallback: parse extractedText (section-safe)
            if (doc.extractedText && typeof doc.extractedText === 'string') {
                this.parseExtractedTextWithDeduplication(doc.extractedText, {
                    pastSurgeriesMap, majorIllnessesMap, previousInterventionsMap,
                    bloodThinnerMap, allergiesMap, hospitalsSet, doctorsSet
                    // NOTE: medicationsMap intentionally NOT passed — prevents cross-section bleed
                });
            }
        });

        // ── medicalForm overrides / supplements ───────────────────────────────
        if (medicalForm) {
            medicalForm.surgicalHistory?.pastSurgeries?.forEach(s => {
                if (s.surgery && s.surgery !== 'NA') {
                    const key = s.surgery.toLowerCase().trim();
                    if (!pastSurgeriesMap.has(key)) {
                        pastSurgeriesMap.set(key, {
                            name: s.surgery,
                            date: s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
                            hospital: s.hospital || 'NA',
                            surgeon: s.surgeon || 'NA'
                        });
                    }
                }
            });

            medicalForm.surgicalHistory?.majorIllnesses?.forEach(ill => {
                if (ill.illness && ill.illness !== 'NA') {
                    const key = ill.illness.toLowerCase().trim();
                    if (!majorIllnessesMap.has(key)) {
                        majorIllnessesMap.set(key, {
                            name: ill.illness,
                            date: ill.year || 'NA',
                            hospital: ill.hospital || 'NA',
                            notes: ill.notes || 'NA'
                        });
                    }
                }
            });

            medicalForm.surgicalHistory?.previousInterventions?.forEach(iv => {
                if (iv.name && iv.name !== 'NA') {
                    const key = iv.name.toLowerCase().trim();
                    if (!previousInterventionsMap.has(key)) {
                        previousInterventionsMap.set(key, {
                            name: iv.name,
                            date: iv.date ? new Date(iv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
                            hospital: iv.hospital || 'NA'
                        });
                    }
                }
            });

            medicalForm.medications?.bloodThinnerHistory?.forEach(bt => {
                if (bt.name && bt.name !== 'NA') {
                    const key = bt.name.toLowerCase().trim();
                    if (!bloodThinnerMap.has(key)) {
                        bloodThinnerMap.set(key, {
                            name: bt.name,
                            type: bt.type || 'NA',
                            duration: bt.duration || 'NA',
                            reason: bt.reason || 'NA'
                        });
                    }
                }
            });
        }

        // ── Build year→month history structure ────────────────────────────────
        const medicalHistoryByYear = {};
        medicalHistoryMap.forEach(record => {
            if (!medicalHistoryByYear[record.year]) medicalHistoryByYear[record.year] = {};
            if (!medicalHistoryByYear[record.year][record.month]) medicalHistoryByYear[record.year][record.month] = [];
            medicalHistoryByYear[record.year][record.month].push({
                day: record.day,
                type: record.type,
                description: record.description
            });
        });

        // ── Emergency contact: prefer medicalForm, fall back to doc-level ─────
        let emergencyContact = { name: 'NA', relationship: 'NA', phone: 'NA' };
        if (medicalForm?.emergencyContact?.name) {
            emergencyContact = {
                name: medicalForm.emergencyContact.name || 'NA',
                relationship: medicalForm.emergencyContact.relationship || 'NA',
                phone: medicalForm.emergencyContact.phone || 'NA'
            };
        } else {
            // Check processed docs for emergency contact extracted by new extractor
            for (const doc of documents) {
                if (doc.emergencyContact?.name && doc.emergencyContact.name !== 'NA') {
                    emergencyContact = doc.emergencyContact;
                    break;
                }
            }
        }

        // ── Assemble final summary ────────────────────────────────────────────
        const summary = {
            patientDemographics: {
                name: patient.name || 'NA',
                patientId: patient.patientId || 'NA',
                dateOfBirth: formattedDob,
                age: age ? `${age} years` : 'NA',
                gender: medicalForm?.personalInfo?.gender || patient.gender || 'NA',
                email: patient.email || 'NA',
                phone: medicalForm?.personalInfo?.phone || patient.phone || 'NA'
            },
            address: formattedAddress,
            medicalProfile: {
                bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA',
                isDiabetic: medicalForm?.medicalConditions?.isDiabetic ? 'Yes' : 'No',
                diabetesType: medicalForm?.medicalConditions?.diabetesType || 'NA',
                hasThyroid: medicalForm?.medicalConditions?.hasThyroid ? 'Yes' : 'No',
                thyroidCondition: medicalForm?.medicalConditions?.thyroidCondition || 'NA'
            },
            allergies: allergiesMap.size > 0
                ? Array.from(allergiesMap.values()).map(a => ({ name: a }))
                : [{ name: 'NA' }],
            comorbidConditions: comorbidMap.size > 0
                ? Array.from(comorbidMap.values()).map(c => ({ name: c }))
                : [{ name: 'NA' }],
            chronicDiseases: chronicMap.size > 0
                ? Array.from(chronicMap.values()).map(d => ({ name: d }))
                : [{ name: 'NA' }],
            currentMedications: medicationsMap.size > 0
                ? Array.from(medicationsMap.values())
                : [{ name: 'NA', purpose: 'NA', dosage: 'NA' }],
            pastSurgeries: pastSurgeriesMap.size > 0
                ? Array.from(pastSurgeriesMap.values())
                : [{ name: 'NA', date: 'NA', hospital: 'NA', surgeon: 'NA' }],
            majorSurgeriesOrIllness: majorIllnessesMap.size > 0
                ? Array.from(majorIllnessesMap.values())
                : [{ name: 'NA', date: 'NA', hospital: 'NA', notes: 'NA' }],
            previousInterventions: previousInterventionsMap.size > 0
                ? Array.from(previousInterventionsMap.values())
                : [{ name: 'NA', date: 'NA', hospital: 'NA' }],
            bloodThinnerHistory: bloodThinnerMap.size > 0
                ? Array.from(bloodThinnerMap.values())
                : [{ name: 'NA', type: 'NA', duration: 'NA', reason: 'NA' }],
            emergencyContact,
            hospitals: Array.from(hospitalsSet),
            doctors: Array.from(doctorsSet),
            medicalHistory: this.formatMedicalHistory(medicalHistoryByYear),
            lastUpdated: new Date().toISOString()
        };

        console.log('📊 FINAL SUMMARY STATS:');
        console.log(`  - Allergies: ${allergiesMap.size}`);
        console.log(`  - Medications: ${medicationsMap.size}`);
        console.log(`  - Past Surgeries: ${pastSurgeriesMap.size}`);
        console.log(`  - Major Illnesses: ${majorIllnessesMap.size}`);
        console.log(`  - Interventions: ${previousInterventionsMap.size}`);
        console.log(`  - Blood Thinners: ${bloodThinnerMap.size}`);
        console.log(`  - Hospitals: ${hospitalsSet.size}`);

        return summary;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEGACY EXTRACTED-TEXT PARSER (section-safe fallback)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Parse raw extractedText for legacy documents that don't yet have
     * structured sub-fields from the new extractor.
     *
     * KEY FIX: every known section header resets `currentSection`, preventing
     * content from bleeding into the wrong array.
     * medications are NOT populated here to avoid cross-section contamination.
     */
    parseExtractedTextWithDeduplication(text, collections) {
        const {
            pastSurgeriesMap, majorIllnessesMap, previousInterventionsMap,
            bloodThinnerMap, allergiesMap, hospitalsSet, doctorsSet
        } = collections;

        const lines = text.split('\n');
        let currentSection = null;
        let currentItem = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineUp = line.toUpperCase();
            if (!line) continue;

            // ── Hard reset on ANY known section header ────────────────────────
            if (ALL_SECTION_HEADERS.has(lineUp)) {
                // Flush pending item before switching
                currentItem = null;

                if (lineUp === 'PAST SURGERIES') currentSection = 'surgeries';
                else if (lineUp.startsWith('MAJOR SURGERIES')) currentSection = 'major';
                else if (lineUp === 'PREVIOUS INTERVENTIONS') currentSection = 'interventions';
                else if (lineUp === 'BLOOD THINNER HISTORY') currentSection = 'bloodThinner';
                else if (lineUp === 'ALLERGIES') currentSection = 'allergies';
                else currentSection = null; // stop collecting
                continue;
            }

            if (!currentSection) continue;

            // ── Bullet item → start a new entry ──────────────────────────────
            if (/^[•*\-–]/.test(line)) {
                const rawName = line.replace(/^[•*\-–]\s*/, '');

                if (currentSection === 'surgeries') {
                    const key = rawName.toLowerCase().trim();
                    if (!pastSurgeriesMap.has(key)) {
                        currentItem = { name: rawName, date: 'NA', hospital: 'NA', surgeon: 'NA' };
                        pastSurgeriesMap.set(key, currentItem);
                    } else {
                        currentItem = pastSurgeriesMap.get(key);
                    }
                } else if (currentSection === 'major') {
                    const key = rawName.toLowerCase().trim();
                    if (!majorIllnessesMap.has(key)) {
                        currentItem = { name: rawName, date: 'NA', hospital: 'NA', notes: 'NA' };
                        majorIllnessesMap.set(key, currentItem);
                    } else {
                        currentItem = majorIllnessesMap.get(key);
                    }
                } else if (currentSection === 'interventions') {
                    const key = rawName.toLowerCase().trim();
                    if (!previousInterventionsMap.has(key)) {
                        currentItem = { name: rawName, date: 'NA', hospital: 'NA' };
                        previousInterventionsMap.set(key, currentItem);
                    } else {
                        currentItem = previousInterventionsMap.get(key);
                    }
                } else if (currentSection === 'bloodThinner') {
                    // Parse "Aspirin (Antiplatelet)" → name + type
                    const m = rawName.match(/^(.+?)\s*\(([^)]+)\)$/);
                    const name = m ? m[1].trim() : rawName;
                    const type = m ? m[2].trim() : 'NA';
                    const key = name.toLowerCase().trim();
                    if (!bloodThinnerMap.has(key)) {
                        currentItem = { name, type, duration: 'NA', reason: 'NA' };
                        bloodThinnerMap.set(key, currentItem);
                    } else {
                        currentItem = bloodThinnerMap.get(key);
                    }
                } else if (currentSection === 'allergies') {
                    const key = rawName.toLowerCase().trim();
                    if (!allergiesMap.has(key)) allergiesMap.set(key, rawName);
                    currentItem = null; // allergies have no sub-fields
                }

                // ── Sub-field lines (Date:, Hospital:, etc.) ──────────────────────
            } else if (currentItem) {
                const subFieldMap = {
                    'date:': 'date',
                    'hospital:': 'hospital',
                    'surgeon:': 'surgeon',
                    'notes:': 'notes',
                    'duration:': 'duration',
                    'reason:': 'reason',
                    'type:': 'type',
                };
                const lowerLine = line.toLowerCase();
                for (const [prefix, field] of Object.entries(subFieldMap)) {
                    if (lowerLine.startsWith(prefix)) {
                        currentItem[field] = line.slice(prefix.length).trim();
                        // Also collect hospitals/doctors from sub-fields
                        if (field === 'hospital') hospitalsSet.add(currentItem[field]);
                        if (field === 'surgeon') doctorsSet.add(currentItem[field]);
                        break;
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    formatMedicalHistory(historyByYear) {
        const formatted = [];
        const years = Object.keys(historyByYear).sort((a, b) => parseInt(b) - parseInt(a));
        const monthOrder = {
            January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
            July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
        };
        for (const year of years) {
            const yearData = { year, months: [] };
            const months = Object.keys(historyByYear[year])
                .sort((a, b) => (monthOrder[b] || 0) - (monthOrder[a] || 0));
            for (const month of months) {
                yearData.months.push({
                    month,
                    records: historyByYear[year][month]
                        .sort((a, b) => b.day - a.day)
                        .map(r => ({ day: r.day, type: r.type, description: r.description }))
                });
            }
            formatted.push(yearData);
        }
        return formatted;
    }

    isChronicDisease(diagnosis) {
        const keywords = [
            'diabetes', 'hypertension', 'asthma', 'copd', 'arthritis',
            'heart disease', 'ckd', 'kidney disease', 'liver disease',
            'thyroid', 'osteoporosis', 'alzheimer', 'parkinson'
        ];
        const lower = diagnosis.toLowerCase();
        return keywords.some(k => lower.includes(k));
    }

    isComorbidCondition(diagnosis) {
        const keywords = [
            'hypertension', 'diabetes', 'high cholesterol', 'obesity',
            'heart failure', 'copd', 'asthma', 'depression', 'anxiety'
        ];
        const lower = diagnosis.toLowerCase();
        return keywords.some(k => lower.includes(k));
    }

    getRecordType(doc) {
        const name = doc.fileName?.toLowerCase() || '';
        if (name.includes('lab')) return 'LAB TEST';
        if (name.includes('xray')) return 'IMAGING';
        if (name.includes('prescription')) return 'PRESCRIPTION';
        if (name.includes('discharge')) return 'DISCHARGE SUMMARY';
        if (doc.diagnoses?.length > 0) return 'CONSULTATION';
        return 'DOCUMENT';
    }

    parseMedication(medString) {
        const result = { name: medString, purpose: 'NA', dosage: 'NA' };
        const dosageMatch = medString.match(/(\d+\s*(?:mg|mcg|g|ml))/i);
        if (dosageMatch) {
            result.dosage = dosageMatch[1];
            result.name = medString.replace(dosageMatch[0], '').trim();
        }
        const purposeMap = {
            'diabetes': ['metformin', 'glipizide', 'insulin'],
            'blood pressure': ['lisinopril', 'amlodipine', 'losartan'],
            'cholesterol': ['atorvastatin', 'simvastatin', 'rosuvastatin'],
            'pain': ['ibuprofen', 'naproxen', 'tramadol']
        };
        const lower = medString.toLowerCase();
        for (const [purpose, drugs] of Object.entries(purposeMap)) {
            if (drugs.some(d => lower.includes(d))) { result.purpose = purpose; break; }
        }
        return result;
    }

    containsKeyword(text, keywords) {
        if (!text) return false;
        const lower = text.toLowerCase();
        return keywords.some(k => lower.includes(k.toLowerCase()));
    }

    extractVitals(documents) {
        const vitals = { bloodPressure: 'NA', heartRate: 'NA', temperature: 'NA', weight: 'NA' };
        const recent = documents[0];
        if (recent?.vitals) return recent.vitals;
        return vitals;
    }

    extractMobilityStatus(documents) {
        const keywords = ['walking', 'ambulatory', 'wheelchair', 'crutches', 'cane', 'walker'];
        for (const doc of documents.slice(0, 3)) {
            if (doc.summary) {
                for (const kw of keywords) {
                    if (doc.summary.toLowerCase().includes(kw)) return `Patient requires ${kw}`;
                }
            }
        }
        return 'Mobility status unknown';
    }

    calculateCardiacRiskFactors(patient, medicalForm, cardiacDiagnoses) {
        const riskFactors = [];
        if (cardiacDiagnoses.has('hypertension')) riskFactors.push('Hypertension');
        if (cardiacDiagnoses.has('diabetes')) riskFactors.push('Diabetes');
        return riskFactors.length > 0 ? riskFactors : ['No specific cardiac risk factors identified'];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SPECIALTY SUMMARIES (unchanged logic, kept intact)
    // ─────────────────────────────────────────────────────────────────────────

    generateCardiologySummary(patient, medicalForm, documents) {
        const cardiacKeywords = [
            'heart', 'cardiac', 'coronary', 'myocardial', 'angina', 'arrhythmia',
            'palpitations', 'ecg', 'ekg', 'echocardiogram', 'echo', 'stress test',
            'troponin', 'ck-mb', 'ldl', 'hdl', 'cholesterol', 'hypertension',
            'blood pressure', 'bp', 'ace inhibitor', 'beta blocker', 'statin',
            'aspirin', 'clopidogrel', 'warfarin', 'eliquis', 'xarelto'
        ];

        const cardiacDiagnoses = new Set();
        const cardiacMedications = [];
        const cardiacTests = new Set();
        const cardiacReports = [];

        documents.forEach(doc => {
            doc.diagnoses?.forEach(d => {
                if (this.containsKeyword(d, cardiacKeywords)) cardiacDiagnoses.add(d);
            });
            doc.medications?.forEach(m => {
                const name = typeof m === 'object' ? m.name : m;
                if (this.containsKeyword(name, cardiacKeywords)) {
                    cardiacMedications.push({ name, purpose: m.purpose || 'NA', dosage: m.dosage || 'NA' });
                }
            });
            doc.labResults?.forEach(l => {
                if (this.containsKeyword(l, cardiacKeywords)) cardiacTests.add(l);
            });
            if (this.containsKeyword(doc.fileName, cardiacKeywords)) {
                cardiacReports.push({
                    name: doc.fileName,
                    date: doc.processedAt
                        ? new Date(doc.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'NA',
                    type: doc.fileType
                });
            }
        });

        return {
            patientInfo: {
                name: patient.name || 'NA',
                patientId: patient.patientId || 'NA',
                age: medicalForm?.personalInfo?.dateOfBirth
                    ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
                    : 'NA',
                bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA'
            },
            cardiacDiagnoses: Array.from(cardiacDiagnoses).length > 0 ? Array.from(cardiacDiagnoses) : ['NA'],
            cardiacMedications: cardiacMedications.length > 0 ? cardiacMedications : [{ name: 'NA', purpose: 'NA', dosage: 'NA' }],
            cardiacTests: Array.from(cardiacTests).length > 0 ? Array.from(cardiacTests) : ['NA'],
            vitals: this.extractVitals(documents),
            recentCardiacReports: cardiacReports.slice(0, 5),
            riskFactors: this.calculateCardiacRiskFactors(patient, medicalForm, cardiacDiagnoses),
            lastUpdated: new Date().toISOString()
        };
    }

    generateOrthopedicSummary(patient, medicalForm, documents) {
        const orthopedicKeywords = [
            'bone', 'joint', 'muscle', 'ligament', 'tendon', 'cartilage',
            'fracture', 'dislocation', 'sprain', 'strain', 'arthritis',
            'osteoporosis', 'back pain', 'neck pain', 'knee', 'hip', 'shoulder',
            'spine', 'disc', 'x-ray', 'mri', 'ct scan', 'orthopedic',
            'ortho', 'rheumatoid', 'osteoarthritis', 'gout'
        ];

        const orthopedicDiagnoses = new Set();
        const orthopedicMedications = [];
        const orthopedicImaging = new Set();
        const orthopedicReports = [];

        documents.forEach(doc => {
            doc.diagnoses?.forEach(d => {
                if (this.containsKeyword(d, orthopedicKeywords)) orthopedicDiagnoses.add(d);
            });
            doc.medications?.forEach(m => {
                const name = typeof m === 'object' ? m.name : m;
                if (this.containsKeyword(name, ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'prednisone'])) {
                    orthopedicMedications.push({ name, purpose: m.purpose || 'pain', dosage: m.dosage || 'NA' });
                }
            });
            doc.labResults?.forEach(l => {
                if (this.containsKeyword(l, ['x-ray', 'mri', 'ct', 'ultrasound', 'bone density'])) {
                    orthopedicImaging.add(l);
                }
            });
            if (this.containsKeyword(doc.fileName, orthopedicKeywords)) {
                orthopedicReports.push({
                    name: doc.fileName,
                    date: doc.processedAt
                        ? new Date(doc.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'NA',
                    type: doc.fileType
                });
            }
        });

        return {
            patientInfo: {
                name: patient.name || 'NA',
                patientId: patient.patientId || 'NA',
                age: medicalForm?.personalInfo?.dateOfBirth
                    ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
                    : 'NA',
                bloodGroup: patient.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'NA'
            },
            orthopedicDiagnoses: Array.from(orthopedicDiagnoses).length > 0 ? Array.from(orthopedicDiagnoses) : ['NA'],
            orthopedicMedications: orthopedicMedications.length > 0 ? orthopedicMedications : [{ name: 'NA', purpose: 'NA', dosage: 'NA' }],
            imagingResults: Array.from(orthopedicImaging).length > 0 ? Array.from(orthopedicImaging) : ['NA'],
            recentOrthopedicReports: orthopedicReports.slice(0, 5),
            mobilityStatus: this.extractMobilityStatus(documents),
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = new SummaryGenerator();