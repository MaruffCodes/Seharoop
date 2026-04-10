const fs = require('fs-extra');
const path = require('path');
const User = require('../models/User');
const ProcessedDocument = require('../models/ProcessedDocument');
const PatientSummary = require('../models/PatientSummary');
const QRCode = require('qrcode');
const pythonService = require('./pythonClient');
const slmClient = require('./slmClient');
const summaryGenerator = require('./summaryGenerator');

/**
 * Fields in PatientSummary.generalSummary that must NEVER be overwritten
 * by document extraction.  These come exclusively from the patient's
 * manually-submitted medical form (PatientMedicalForm) or their profile.
 *
 * Everything else is appendable / mergeable from uploaded documents.
 */
const LOCKED_SUMMARY_FIELDS = new Set([
    'patientDemographics',  // name, DOB, email, phone, patientId, gender
    'address',              // manually entered address
    'medicalProfile',       // bloodGroup, isDiabetic, diabetesType, hasThyroid
]);

class DocumentProcessor {
    async processDocument(fileInfo, userId) {
        const { filePath, originalName, mimeType, size, fileId } = fileInfo;
        console.log(`🔄 Starting document processing for: ${originalName}`);

        try {
            // ── Step 1: OCR + NLP via Python ──────────────────────────────────
            console.log('📤 Sending to Python OCR/NLP service...');
            const pythonResult = await pythonService.processDocument(filePath, originalName, mimeType);
            if (!pythonResult.success) throw new Error(pythonResult.error || 'Python processing failed');

            console.log('📥 Python result received');
            console.log('📊 Python entities:', JSON.stringify(pythonResult.entities, null, 2));

            // ── Step 2: Transform Python output → MongoDB schema ───────────────
            const transformedData = this.transformPythonResult(pythonResult);
            console.log('📊 Transformed data:', JSON.stringify(transformedData, null, 2));

            // ── Step 3: Patient / form data ────────────────────────────────────
            console.log('👤 Fetching patient data...');
            const user = await User.findById(userId);
            const PatientMedicalForm = require('../models/PatientMedicalForm');
            const medicalForm = await PatientMedicalForm.findOne({ patientId: userId });

            // ── Step 4: SLM summaries (disabled) ──────────────────────────────
            console.log('🧠 SLM summaries disabled for debugging — using fallback values');
            const fallbackSummary = (type) => ({
                success: false,
                summary: 'AI summary generation temporarily disabled',
                type,
                timestamp: new Date().toISOString()
            });
            const generalSummary = fallbackSummary('general');
            const cardiologySummary = fallbackSummary('cardiology');
            const orthopedicSummary = fallbackSummary('orthopedic');

            // ── Step 5: Save ProcessedDocument ────────────────────────────────
            console.log('💾 Saving to database...');

            const bloodThinnerArray = Array.isArray(transformedData.bloodThinner)
                ? transformedData.bloodThinner : [];

            const processedDoc = new ProcessedDocument({
                fileId: fileId || path.basename(filePath, path.extname(filePath)),
                userId,
                fileName: originalName,
                fileType: mimeType,
                fileSize: size,
                extractedText: (pythonResult.text || '').substring(0, 5000),

                allergies: transformedData.allergies || [],
                medications: transformedData.medications || [],
                comorbidConditions: transformedData.comorbidConditions || [],
                chronicDiseases: transformedData.chronicDiseases || [],
                pastSurgeries: transformedData.pastSurgeries || [],
                majorIllnesses: transformedData.majorIllnesses || [],
                interventions: transformedData.interventions || [],
                bloodThinner: bloodThinnerArray,
                emergencyContact: transformedData.emergencyContact || { name: 'NA', relationship: 'NA', phone: 'NA' },
                parsedMedicalHistory: transformedData.parsedMedicalHistory || [],

                diagnoses: transformedData.diagnoses || [],
                labResults: transformedData.labResults || [],
                dates: transformedData.dates || [],
                doctors: transformedData.doctors || [],
                hospitals: transformedData.hospitals || [],
                vitals: transformedData.vitals || new Map(),

                summary: generalSummary?.summary || pythonResult.summary || '',
                slmSummaries: { general: generalSummary, cardiology: cardiologySummary, orthopedic: orthopedicSummary },

                confidence: {
                    textLength: pythonResult.confidence?.textLength || 0,
                    entityCount: pythonResult.confidence?.entityCount || 0,
                    overall: pythonResult.confidence?.overall || 50
                },
                processingStatus: 'completed',
                processedAt: new Date(),
                metadata: {
                    fileName: originalName,
                    fileType: mimeType,
                    fileSize: size,
                    processingDate: new Date(),
                    textLength: pythonResult.text?.length || 0,
                    ocrConfidence: pythonResult.confidence?.overall || 0,
                    slmGenerated: false
                }
            });

            await processedDoc.save();
            console.log('✅ Document saved:', processedDoc._id);

            // ── Step 6: Update patient medical history ─────────────────────────
            console.log('📊 Updating patient history...');
            await this.updatePatientHistory(userId, processedDoc, transformedData, generalSummary);

            // ── Step 7: Refresh all summaries (APPEND mode) ────────────────────
            console.log('📊 Refreshing all patient summaries...');
            try {
                const allDocuments = await ProcessedDocument.find({ userId }).sort({ processedAt: -1 });
                const patient = await User.findById(userId);
                let patientSummary = await PatientSummary.findOne({ patientId: userId });
                if (!patientSummary) patientSummary = new PatientSummary({ patientId: userId });

                const newGeneral = summaryGenerator.generateGeneralSummary(patient, medicalForm, allDocuments);
                const newCardiology = summaryGenerator.generateCardiologySummary(patient, medicalForm, allDocuments);
                const newOrthopedic = summaryGenerator.generateOrthopedicSummary(patient, medicalForm, allDocuments);

                // ── LOCKED FIELD PROTECTION ──────────────────────────────────
                // If a summary already exists, preserve locked fields from the
                // stored version (which came from the medical form) rather than
                // letting document extraction overwrite them.
                if (patientSummary.generalSummary) {
                    const existing = patientSummary.generalSummary;
                    for (const lockedField of LOCKED_SUMMARY_FIELDS) {
                        if (existing[lockedField] !== undefined && existing[lockedField] !== null) {
                            newGeneral[lockedField] = existing[lockedField];
                        }
                    }
                }

                patientSummary.generalSummary = newGeneral;
                patientSummary.cardiologySummary = newCardiology;
                patientSummary.orthopedicSummary = newOrthopedic;
                patientSummary.slmSummaries = { general: generalSummary, cardiology: cardiologySummary, orthopedic: orthopedicSummary };
                patientSummary.lastUpdated = new Date();
                patientSummary.documentCount = allDocuments.length;
                patientSummary.version = (patientSummary.version || 0) + 1;

                await patientSummary.save();
                console.log('✅ All summaries refreshed');
            } catch (summaryError) {
                console.error('⚠️ Could not refresh summaries:', summaryError.message);
            }

            // ── Step 8: QR code ────────────────────────────────────────────────
            console.log('📱 Refreshing QR code...');
            await this.refreshPatientQRCode(userId);

            // ── Step 9: Move file to permanent storage ─────────────────────────
            console.log('📁 Moving to permanent storage...');
            await this.moveFile(filePath, fileId, originalName);

            console.log('✅ Document processing completed');
            return {
                success: true,
                documentId: processedDoc._id,
                data: {
                    ...transformedData,
                    slmSummaries: { general: generalSummary, cardiology: cardiologySummary, orthopedic: orthopedicSummary }
                }
            };

        } catch (error) {
            console.error('❌ Document processing error:', error);
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRANSFORM PYTHON RESULT
    // ─────────────────────────────────────────────────────────────────────────

    transformPythonResult(pythonResult) {
        const entities = pythonResult.entities || {};

        // ── ALLERGIES
        const allergies = (entities.allergies || [])
            .filter(a => a && a !== 'NA' && a !== 'null')
            .map(a => typeof a === 'string' ? { name: a } : { name: a.name || a });

        // ── MEDICATIONS — prefer currentMedications, fall back to medications
        let medications = [];
        const src = entities.currentMedications?.length
            ? entities.currentMedications
            : (entities.medications || []);

        medications = src.map(m => {
            if (typeof m === 'string') return this.parseMedication(m);
            return {
                name: m.name || 'Unknown',
                purpose: m.purpose || m.indication || 'NA',
                dosage: m.dosage || m.dosage_text || 'NA'
            };
        });

        // Deduplicate by name
        const seenMedNames = new Set();
        medications = medications.filter(med => {
            const k = med.name.toLowerCase();
            if (seenMedNames.has(k)) return false;
            seenMedNames.add(k);
            return true;
        });

        // ── COMORBID / CHRONIC
        const comorbidConditions = (entities.comorbidConditions || [])
            .filter(c => c && c !== 'NA')
            .map(c => typeof c === 'string' ? { name: c } : { name: c.name || c });

        const chronicDiseases = (entities.chronicDiseases || [])
            .filter(c => c && c !== 'NA')
            .map(c => typeof c === 'string' ? { name: c } : { name: c.name || c });

        // ── PAST SURGERIES — keep all fields including NA values so the
        //    summary generator can display "Date: NA" rather than omit the field
        const pastSurgeries = (entities.pastSurgeries || []).map(s => ({
            name: (s.name || 'NA').replace(/^[«»\s]+/, '').trim(),
            date: s.date || 'NA',
            hospital: s.hospital || 'NA',
            surgeon: s.surgeon || 'NA'
        }));

        // ── MAJOR ILLNESSES
        const majorIllnesses = (entities.majorIllnesses || []).map(ill => ({
            name: ill.name || 'NA',
            date: ill.date || 'NA',
            hospital: ill.hospital || 'NA',
            notes: ill.notes || 'NA'
        }));

        // ── INTERVENTIONS
        const interventions = (entities.interventions || []).map(iv => ({
            name: (iv.name || 'NA').replace(/^\+?\s*/, '').trim(),
            date: iv.date || 'NA',
            hospital: iv.hospital || 'NA'
        }));

        // ── BLOOD THINNER
        const bloodThinner = (entities.bloodThinner || []).map(bt => ({
            name: (bt.name || 'NA').replace(/^\+?\s*/, '').trim(),
            type: bt.type || 'NA',
            duration: bt.duration || 'NA',
            reason: bt.reason || 'NA'
        }));

        // ── EMERGENCY CONTACT
        const emergencyContact = entities.emergencyContact || { name: 'NA', relationship: 'NA', phone: 'NA' };

        // ── PARSED MEDICAL HISTORY
        const parsedMedicalHistory = entities.medicalHistory || [];

        // ── DATES
        const dates = (entities.dates || []).map(d => ({
            text: typeof d === 'string' ? d : d.text,
            normalized: this.normalizeDate(typeof d === 'string' ? d : d.text)
        }));

        // ── REST
        const diagnoses = Array.isArray(entities.diagnoses) ? entities.diagnoses : [];
        const labResults = Array.isArray(entities.lab_results) ? entities.lab_results : [];
        const doctors = Array.isArray(entities.doctors) ? entities.doctors : [];
        const hospitals = Array.isArray(entities.hospitals) ? entities.hospitals : [];

        let vitals = new Map();
        if (entities.vitals && typeof entities.vitals === 'object') {
            vitals = new Map(Object.entries(entities.vitals));
        }

        return {
            allergies, medications, comorbidConditions, chronicDiseases,
            pastSurgeries, majorIllnesses, interventions, bloodThinner,
            emergencyContact, parsedMedicalHistory,
            diagnoses, labResults, dates, doctors, hospitals, vitals,
            summary: pythonResult.summary || ''
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

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

    normalizeDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        } catch (_) { /* fall through */ }
        return dateStr;
    }

    async updatePatientHistory(userId, document, transformedData, slmSummary) {
        try {
            const user = await User.findById(userId);
            if (!user) return console.log('User not found for history update');

            const currentYear = new Date().getFullYear().toString();
            const currentMonth = new Date().toLocaleString('default', { month: 'long' });

            if (!user.medicalHistory) user.medicalHistory = [];

            let yearEntry = user.medicalHistory.find(y => y.year === currentYear);
            if (!yearEntry) {
                yearEntry = { year: currentYear, months: [] };
                user.medicalHistory.push(yearEntry);
            }

            let monthEntry = yearEntry.months.find(m => m.month === currentMonth);
            if (!monthEntry) {
                monthEntry = { month: currentMonth, records: [] };
                yearEntry.months.push(monthEntry);
            }

            const description = slmSummary?.summary || transformedData.summary
                || `Medical document: ${document.fileName}`;

            monthEntry.records.push({
                date: new Date(),
                description: description.substring(0, 500),
                type: 'document',
                documents: [{
                    filename: document.fileId,
                    originalName: document.fileName,
                    path: `/uploads/${document.fileId}.${document.fileName.split('.').pop()}`,
                    mimetype: document.fileType,
                    size: document.fileSize,
                    uploadDate: new Date()
                }],
                extractedData: {
                    diagnoses: (transformedData.diagnoses || []).slice(0, 10),
                    medications: (transformedData.medications || []).map(m => m?.name || m).slice(0, 10),
                    labResults: (transformedData.labResults || []).slice(0, 10),
                    allergies: (transformedData.allergies || []).map(a => a?.name || a).slice(0, 10)
                },
                slmGenerated: !!slmSummary?.success
            });

            await user.save();
            console.log('✅ Patient history updated');
        } catch (error) {
            console.error('Error updating history:', error);
        }
    }

    async refreshPatientQRCode(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            const recentDocs = await ProcessedDocument.find({ userId })
                .sort({ processedAt: -1 }).limit(20);

            const PatientMedicalForm = require('../models/PatientMedicalForm');
            const medicalForm = await PatientMedicalForm.findOne({ patientId: userId });

            const allDiagnoses = new Set();
            const allMedsMap = new Map();
            const allAllergies = new Set();
            const allLabResults = new Set();

            recentDocs.forEach(doc => {
                doc.diagnoses?.slice(0, 5).forEach(d => allDiagnoses.add(d));
                doc.medications?.slice(0, 5).forEach(m => {
                    const name = m?.name || m;
                    if (!allMedsMap.has(name)) {
                        allMedsMap.set(name, { name, purpose: m?.purpose || 'NA', dosage: m?.dosage || 'NA' });
                    }
                });
                doc.allergies?.slice(0, 5).forEach(a => allAllergies.add(a?.name || a));
                doc.labResults?.slice(0, 3).forEach(l => allLabResults.add(l));
            });

            const qrData = {
                patientId: user.patientId,
                name: user.name,
                bloodGroup: user.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'Unknown',
                lastUpdated: new Date().toISOString().split('T')[0],
                stats: {
                    documents: recentDocs.length,
                    diagnoses: Array.from(allDiagnoses).slice(0, 5),
                    medications: Array.from(allMedsMap.values()).slice(0, 5),
                    allergies: Array.from(allAllergies).slice(0, 5),
                    labResults: Array.from(allLabResults).slice(0, 3)
                },
                emergencyContact: medicalForm?.emergencyContact || null,
                criticalInfo: {
                    allergies: Array.from(allAllergies).slice(0, 5),
                    chronicConditions: medicalForm?.medicalConditions?.chronicDiseases?.slice(0, 5) || []
                }
            };

            user.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
            await user.save();
            console.log('✅ QR code refreshed');
        } catch (error) {
            console.error('Error refreshing QR:', error);
        }
    }

    async moveFile(tempPath, fileId, originalName) {
        try {
            const ext = path.extname(originalName);
            const newPath = path.join(__dirname, `../uploads/${fileId}${ext}`);
            if (!(await fs.pathExists(tempPath))) {
                return console.log('⚠️ Temp file not found, skipping move');
            }
            await fs.move(tempPath, newPath, { overwrite: true });
            console.log('✅ File moved:', newPath);
        } catch (error) {
            console.error('Error moving file:', error);
        }
    }
}

module.exports = new DocumentProcessor();