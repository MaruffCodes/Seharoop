const fs = require('fs-extra');
const path = require('path');
const User = require('../models/User');
const ProcessedDocument = require('../models/ProcessedDocument');
const QRCode = require('qrcode');
const pythonService = require('./pythonClient');
const slmClient = require('./slmClient');

class DocumentProcessor {
    async processDocument(fileInfo, userId) {
        const { filePath, originalName, mimeType, size, fileId } = fileInfo;

        console.log(`🔄 Starting document processing for: ${originalName}`);

        try {
            // Step 1: Send to Python service for OCR and NLP
            console.log('📤 Sending to Python OCR/NLP service...');
            const pythonResult = await pythonService.processDocument(
                filePath,
                originalName,
                mimeType
            );

            if (!pythonResult.success) {
                throw new Error(pythonResult.error || 'Python processing failed');
            }

            console.log('📥 Python result received');

            // Transform Python data to match MongoDB schema
            const transformedData = this.transformPythonResult(pythonResult);

            // Step 2: Get patient data for SLM
            console.log('👤 Fetching patient data for SLM...');
            const user = await User.findById(userId);
            const PatientMedicalForm = require('../models/PatientMedicalForm');
            const medicalForm = await PatientMedicalForm.findOne({ patientId: userId });

            // Prepare patient data for SLM
            const patientData = {
                name: user.name,
                patientId: user.patientId,
                age: medicalForm?.personalInfo?.dateOfBirth
                    ? new Date().getFullYear() - new Date(medicalForm.personalInfo.dateOfBirth).getFullYear()
                    : null,
                gender: medicalForm?.personalInfo?.gender || null,
                bloodGroup: user.bloodGroup || medicalForm?.personalInfo?.bloodGroup || null,
                email: user.email,
                phone: medicalForm?.personalInfo?.phone || null,
                address: this.formatAddress(medicalForm?.personalInfo?.address)
            };

            // Prepare extracted data for SLM
            const extractedData = {
                diagnoses: transformedData.diagnoses || [],
                medications: transformedData.medications || [],
                labResults: transformedData.labResults || [],
                allergies: transformedData.allergies || [],
                pastSurgeries: medicalForm?.surgicalHistory?.pastSurgeries || [],
                chronicDiseases: medicalForm?.medicalConditions?.chronicDiseases || [],
                comorbidConditions: medicalForm?.medicalConditions?.comorbidConditions || []
            };

            // Step 3: Generate SLM summaries
            console.log('🧠 Generating SLM summaries...');

            let generalSummary = null;
            let cardiologySummary = null;
            let orthopedicSummary = null;

            try {
                [generalSummary, cardiologySummary, orthopedicSummary] = await Promise.all([
                    slmClient.generateSummary(patientData, extractedData, 'general').catch(e => {
                        console.log('⚠️ General summary generation skipped:', e.message);
                        return null;
                    }),
                    slmClient.generateSummary(patientData, extractedData, 'cardiology').catch(e => {
                        console.log('⚠️ Cardiology summary generation skipped:', e.message);
                        return null;
                    }),
                    slmClient.generateSummary(patientData, extractedData, 'orthopedic').catch(e => {
                        console.log('⚠️ Orthopedic summary generation skipped:', e.message);
                        return null;
                    })
                ]);
                console.log('✅ SLM summaries generated successfully');
            } catch (slmError) {
                console.log('⚠️ SLM service not available, continuing without AI summaries');
                // Continue without SLM summaries
            }

            // Step 4: Save processed document with SLM summaries
            console.log('💾 Saving to database...');
            const processedDoc = new ProcessedDocument({
                fileId: fileId || path.basename(filePath, path.extname(filePath)),
                userId: userId,
                fileName: originalName,
                fileType: mimeType,
                fileSize: size,
                extractedText: pythonResult.text?.substring(0, 5000) || '',
                diagnoses: transformedData.diagnoses || [],
                medications: transformedData.medications || [],
                labResults: transformedData.labResults || [],
                allergies: transformedData.allergies || [],
                dates: transformedData.dates || [],
                doctors: transformedData.doctors || [],
                hospitals: transformedData.hospitals || [],
                vitals: transformedData.vitals || {},
                summary: generalSummary?.summary || pythonResult.summary || transformedData.summary || '',
                slmSummaries: {
                    general: generalSummary,
                    cardiology: cardiologySummary,
                    orthopedic: orthopedicSummary
                },
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
                    slmGenerated: !!(generalSummary || cardiologySummary || orthopedicSummary)
                }
            });

            await processedDoc.save();
            console.log('✅ Document saved to database with ID:', processedDoc._id);

            // Step 5: Update patient's medical history
            console.log('📊 Updating patient history...');
            await this.updatePatientHistory(userId, processedDoc, transformedData, generalSummary);

            // Step 6: Refresh QR code with rich medical data
            console.log('📱 Refreshing QR code with medical data...');
            await this.refreshPatientQRCode(userId);

            // Step 7: Move file to permanent storage
            console.log('📁 Moving file to permanent storage...');
            await this.moveFile(filePath, fileId, originalName);

            console.log('✅ Document processing completed successfully');

            return {
                success: true,
                documentId: processedDoc._id,
                data: {
                    ...transformedData,
                    slmSummaries: {
                        general: generalSummary,
                        cardiology: cardiologySummary,
                        orthopedic: orthopedicSummary
                    }
                }
            };

        } catch (error) {
            console.error('❌ Document processing error:', error);
            throw error;
        }
    }

    // Format address for SLM
    formatAddress(address) {
        if (!address) return null;
        const parts = [
            address.street,
            address.city,
            address.state,
            address.pincode,
            address.country
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
    }

    // Transform Python result to match MongoDB schema
    transformPythonResult(pythonResult) {
        const entities = pythonResult.entities || {};

        // Transform dates from strings to objects
        const dates = (entities.dates || []).map(dateStr => ({
            text: dateStr,
            normalized: this.normalizeDate(dateStr)
        }));

        return {
            diagnoses: Array.isArray(entities.diagnoses) ? entities.diagnoses : [],
            medications: Array.isArray(entities.medications) ? entities.medications : [],
            labResults: Array.isArray(entities.lab_results) ? entities.lab_results : [],
            allergies: Array.isArray(entities.allergies) ? entities.allergies : [],
            dates: dates,
            doctors: Array.isArray(entities.doctors) ? entities.doctors : [],
            hospitals: Array.isArray(entities.hospitals) ? entities.hospitals : [],
            vitals: entities.vitals || {},
            summary: pythonResult.summary || ''
        };
    }

    // Normalize date string
    normalizeDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (error) {
            // Return original if parsing fails
        }
        return dateStr;
    }

    async updatePatientHistory(userId, document, transformedData, slmSummary) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found for history update');
                return;
            }

            const currentYear = new Date().getFullYear().toString();
            const currentMonth = new Date().toLocaleString('default', { month: 'long' });

            // Initialize medical history if not exists
            if (!user.medicalHistory) user.medicalHistory = [];

            // Find or create year
            let yearEntry = user.medicalHistory.find(y => y.year === currentYear);
            if (!yearEntry) {
                yearEntry = { year: currentYear, months: [] };
                user.medicalHistory.push(yearEntry);
            }

            // Find or create month
            let monthEntry = yearEntry.months.find(m => m.month === currentMonth);
            if (!monthEntry) {
                monthEntry = { month: currentMonth, records: [] };
                yearEntry.months.push(monthEntry);
            }

            // Use SLM summary if available, otherwise fallback
            const description = slmSummary?.summary || transformedData.summary || `Medical document: ${document.fileName}`;

            // Create medical record
            const medicalRecord = {
                date: new Date(),
                description: description,
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
                    diagnoses: transformedData.diagnoses || [],
                    medications: transformedData.medications || [],
                    labResults: transformedData.labResults || [],
                    allergies: transformedData.allergies || []
                },
                slmGenerated: !!slmSummary
            };

            monthEntry.records.push(medicalRecord);
            await user.save();

            console.log('✅ Patient history updated with document');

        } catch (error) {
            console.error('Error updating history:', error);
        }
    }

    async refreshPatientQRCode(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found for QR refresh');
                return;
            }

            // Get recent processed documents
            const recentDocs = await ProcessedDocument.find({ userId })
                .sort({ processedAt: -1 })
                .limit(20);

            // Get medical form
            const PatientMedicalForm = require('../models/PatientMedicalForm');
            const medicalForm = await PatientMedicalForm.findOne({ patientId: userId });

            // Calculate summary
            const allDiagnoses = new Set();
            const allMedications = new Set();
            const allAllergies = new Set();
            const allLabResults = new Set();

            recentDocs.forEach(doc => {
                if (doc.diagnoses) doc.diagnoses.forEach(d => allDiagnoses.add(d));
                if (doc.medications) doc.medications.forEach(m => allMedications.add(m));
                if (doc.allergies) doc.allergies.forEach(a => allAllergies.add(a));
                if (doc.labResults) doc.labResults.forEach(l => allLabResults.add(l));
            });

            // Check if we have any SLM summaries
            const hasSLM = recentDocs.some(doc => doc.slmSummaries &&
                (doc.slmSummaries.general || doc.slmSummaries.cardiology || doc.slmSummaries.orthopedic));

            // Create rich QR data
            const qrData = {
                patientId: user.patientId,
                name: user.name,
                bloodGroup: user.bloodGroup || medicalForm?.personalInfo?.bloodGroup || 'Unknown',
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
                },
                aiGenerated: hasSLM,
                summary: recentDocs[0]?.slmSummaries?.general?.summary || null
            };

            // Generate QR code
            const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrData));

            user.qrCode = qrCodeData;
            await user.save();

            console.log('✅ QR code refreshed successfully with medical data');

        } catch (error) {
            console.error('Error refreshing QR:', error);
        }
    }

    async moveFile(tempPath, fileId, originalName) {
        try {
            const ext = path.extname(originalName);
            const newPath = path.join(__dirname, `../uploads/${fileId}${ext}`);

            const exists = await fs.pathExists(tempPath);
            if (!exists) {
                console.log('⚠️ Temp file not found, skipping move');
                return;
            }

            await fs.move(tempPath, newPath, { overwrite: true });
            console.log('✅ File moved to permanent storage:', newPath);
        } catch (error) {
            console.error('Error moving file:', error);
        }
    }
}

module.exports = new DocumentProcessor();