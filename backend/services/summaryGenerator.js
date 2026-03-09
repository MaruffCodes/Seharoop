/**
 * Medical Summary Generator
 * Generates different types of summaries based on specialty
 */

class SummaryGenerator {
    /**
     * Generate General Summary in strict format
     */
    generateGeneralSummary(patient, medicalForm, documents) {
        // Format date of birth
        const dob = medicalForm?.personalInfo?.dateOfBirth
            ? new Date(medicalForm.personalInfo.dateOfBirth)
            : null;

        const age = dob
            ? new Date().getFullYear() - dob.getFullYear()
            : null;

        const formattedDob = dob
            ? dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'NA';

        // Format address
        const address = medicalForm?.personalInfo?.address || {};
        const formattedAddress = address.street || address.city || address.state
            ? `${address.street || ''}${address.street && address.city ? ', ' : ''}${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''}${address.pincode ? ' - ' + address.pincode : ''}${address.country ? '\n' + address.country : ''}`.trim()
            : 'NA';

        // Collect all data from documents
        const allDiagnoses = new Set();
        const allMedications = new Set();
        const allAllergies = new Set();
        const allComorbidConditions = new Set();
        const allChronicDiseases = new Set();
        const pastSurgeries = [];
        const majorIllnesses = [];
        const previousInterventions = [];
        const bloodThinnerHistory = [];
        const medicalHistoryByYear = {};

        // Process documents for medical history
        documents.forEach(doc => {
            // Extract diagnoses
            doc.diagnoses?.forEach(d => {
                allDiagnoses.add(d);
                // Categorize as chronic disease if applicable
                if (this.isChronicDisease(d)) {
                    allChronicDiseases.add(d);
                }
                // Categorize as comorbid condition if applicable
                if (this.isComorbidCondition(d)) {
                    allComorbidConditions.add(d);
                }
            });

            // Extract medications
            doc.medications?.forEach(m => {
                allMedications.add(m);
            });

            // Extract allergies
            doc.allergies?.forEach(a => {
                allAllergies.add(a);
            });

            // Process medical history from records
            if (doc.metadata?.processingDate) {
                const date = new Date(doc.processedAt || doc.metadata.processingDate);
                const year = date.getFullYear();
                const month = date.toLocaleString('default', { month: 'long' });
                const day = date.getDate();

                if (!medicalHistoryByYear[year]) {
                    medicalHistoryByYear[year] = {};
                }
                if (!medicalHistoryByYear[year][month]) {
                    medicalHistoryByYear[year][month] = [];
                }

                medicalHistoryByYear[year][month].push({
                    day,
                    type: this.getRecordType(doc),
                    description: doc.summary || `Document uploaded: ${doc.fileName}`,
                    documentId: doc.fileId
                });
            }
        });

        // Process medical form data for past surgeries, major illnesses, etc.
        if (medicalForm) {
            // Past Surgeries
            if (medicalForm.surgicalHistory?.pastSurgeries) {
                medicalForm.surgicalHistory.pastSurgeries.forEach(surgery => {
                    pastSurgeries.push({
                        name: surgery.surgery || 'NA',
                        date: surgery.date ? new Date(surgery.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
                        hospital: surgery.hospital || 'NA',
                        surgeon: surgery.surgeon || 'NA'
                    });
                });
            }

            // Major Illnesses
            if (medicalForm.surgicalHistory?.majorIllnesses) {
                medicalForm.surgicalHistory.majorIllnesses.forEach(illness => {
                    majorIllnesses.push({
                        name: illness.illness || 'NA',
                        date: illness.year || 'NA',
                        hospital: illness.hospital || 'NA',
                        notes: illness.notes || 'NA'
                    });
                });
            }

            // Previous Interventions
            if (medicalForm.surgicalHistory?.previousInterventions) {
                medicalForm.surgicalHistory.previousInterventions.forEach(intervention => {
                    previousInterventions.push({
                        name: intervention.name || 'NA',
                        date: intervention.date ? new Date(intervention.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
                        hospital: intervention.hospital || 'NA'
                    });
                });
            }

            // Blood Thinner History
            if (medicalForm.medications?.bloodThinnerHistory) {
                medicalForm.medications.bloodThinnerHistory.forEach(bloodThinner => {
                    bloodThinnerHistory.push({
                        name: bloodThinner.name || 'NA',
                        type: bloodThinner.type || 'NA',
                        duration: bloodThinner.duration || 'NA',
                        reason: bloodThinner.reason || 'NA'
                    });
                });
            }
        }

        // Build the summary in the exact format requested
        return {
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
            allergies: Array.from(allAllergies).length > 0
                ? Array.from(allAllergies).map(a => ({ name: a }))
                : [{ name: 'NA' }],
            comorbidConditions: Array.from(allComorbidConditions).length > 0
                ? Array.from(allComorbidConditions).map(c => ({ name: c }))
                : [{ name: 'NA' }],
            chronicDiseases: Array.from(allChronicDiseases).length > 0
                ? Array.from(allChronicDiseases).map(d => ({ name: d }))
                : [{ name: 'NA' }],
            currentMedications: Array.from(allMedications).length > 0
                ? Array.from(allMedications).map(m => this.parseMedication(m))
                : [{ name: 'NA', purpose: 'NA', dosage: 'NA' }],
            pastSurgeries: pastSurgeries.length > 0 ? pastSurgeries : [{
                name: 'NA',
                date: 'NA',
                hospital: 'NA',
                surgeon: 'NA'
            }],
            majorSurgeriesOrIllness: majorIllnesses.length > 0 ? majorIllnesses : [{
                name: 'NA',
                date: 'NA',
                hospital: 'NA',
                notes: 'NA'
            }],
            previousInterventions: previousInterventions.length > 0 ? previousInterventions : [{
                name: 'NA',
                date: 'NA',
                hospital: 'NA'
            }],
            bloodThinnerHistory: bloodThinnerHistory.length > 0 ? bloodThinnerHistory : [{
                name: 'NA',
                type: 'NA',
                duration: 'NA',
                reason: 'NA'
            }],
            emergencyContact: medicalForm?.emergencyContact ? {
                name: medicalForm.emergencyContact.name || 'NA',
                relationship: medicalForm.emergencyContact.relationship || 'NA',
                phone: medicalForm.emergencyContact.phone || 'NA'
            } : {
                name: 'NA',
                relationship: 'NA',
                phone: 'NA'
            },
            medicalHistory: this.formatMedicalHistory(medicalHistoryByYear),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Format medical history by year and month
     */
    formatMedicalHistory(historyByYear) {
        const formatted = [];

        // Sort years in descending order
        const years = Object.keys(historyByYear).sort((a, b) => parseInt(b) - parseInt(a));

        for (const year of years) {
            const yearData = {
                year,
                months: []
            };

            // Sort months in reverse chronological order
            const months = Object.keys(historyByYear[year]).sort((a, b) => {
                const monthOrder = {
                    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
                    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
                };
                return monthOrder[b] - monthOrder[a];
            });

            for (const month of months) {
                const monthData = {
                    month,
                    records: historyByYear[year][month]
                        .sort((a, b) => b.day - a.day) // Sort days in descending order
                        .map(record => ({
                            day: record.day,
                            type: record.type,
                            description: record.description
                        }))
                };
                yearData.months.push(monthData);
            }

            formatted.push(yearData);
        }

        return formatted;
    }

    /**
     * Determine if a diagnosis is a chronic disease
     */
    isChronicDisease(diagnosis) {
        const chronicKeywords = [
            'diabetes', 'hypertension', 'asthma', 'copd', 'arthritis',
            'heart disease', 'ckd', 'kidney disease', 'liver disease',
            'thyroid', 'osteoporosis', 'alzheimer', 'parkinson'
        ];
        const lower = diagnosis.toLowerCase();
        return chronicKeywords.some(keyword => lower.includes(keyword));
    }

    /**
     * Determine if a diagnosis is a comorbid condition
     */
    isComorbidCondition(diagnosis) {
        const comorbidKeywords = [
            'hypertension', 'diabetes', 'high cholesterol', 'obesity',
            'heart failure', 'copd', 'asthma', 'depression', 'anxiety'
        ];
        const lower = diagnosis.toLowerCase();
        return comorbidKeywords.some(keyword => lower.includes(keyword));
    }

    /**
     * Get record type based on document
     */
    getRecordType(doc) {
        if (doc.fileName?.toLowerCase().includes('lab')) return 'LAB TEST';
        if (doc.fileName?.toLowerCase().includes('xray')) return 'IMAGING';
        if (doc.fileName?.toLowerCase().includes('prescription')) return 'PRESCRIPTION';
        if (doc.fileName?.toLowerCase().includes('discharge')) return 'DISCHARGE SUMMARY';
        if (doc.diagnoses?.length > 0) return 'CONSULTATION';
        return 'DOCUMENT';
    }

    /**
     * Parse medication string into name, purpose, dosage
     */
    parseMedication(medString) {
        // Default structure
        const result = {
            name: medString,
            purpose: 'NA',
            dosage: 'NA'
        };

        // Try to parse common medication formats
        const dosageMatch = medString.match(/(\d+\s*(?:mg|mcg|g|ml))/i);
        if (dosageMatch) {
            result.dosage = dosageMatch[1];
        }

        // Try to extract purpose from context (simplified)
        const purposeKeywords = {
            'diabetes': ['metformin', 'glipizide', 'insulin'],
            'blood pressure': ['lisinopril', 'amlodipine', 'losartan'],
            'cholesterol': ['atorvastatin', 'simvastatin', 'rosuvastatin'],
            'pain': ['ibuprofen', 'naproxen', 'tramadol']
        };

        const lowerMed = medString.toLowerCase();
        for (const [purpose, drugs] of Object.entries(purposeKeywords)) {
            if (drugs.some(drug => lowerMed.includes(drug))) {
                result.purpose = purpose;
                break;
            }
        }

        return result;
    }

    /**
     * Generate Cardiology-Specific Summary
     */
    generateCardiologySummary(patient, medicalForm, documents) {
        // Cardiology-specific keywords
        const cardiacKeywords = [
            'heart', 'cardiac', 'coronary', 'myocardial', 'angina', 'arrhythmia',
            'palpitations', 'ecg', 'ekg', 'echocardiogram', 'echo', 'stress test',
            'troponin', 'ck-mb', 'ldl', 'hdl', 'cholesterol', 'hypertension',
            'blood pressure', 'bp', 'ace inhibitor', 'beta blocker', 'statin',
            'aspirin', 'clopidogrel', 'warfarin', 'eliquis', 'xarelto'
        ];

        // Filter cardiac-related data
        const cardiacDiagnoses = new Set();
        const cardiacMedications = new Set();
        const cardiacTests = new Set();
        const cardiacReports = [];

        documents.forEach(doc => {
            // Check diagnoses
            doc.diagnoses?.forEach(d => {
                if (this.containsKeyword(d, cardiacKeywords)) {
                    cardiacDiagnoses.add(d);
                }
            });

            // Check medications
            doc.medications?.forEach(m => {
                if (this.containsKeyword(m, cardiacKeywords)) {
                    cardiacMedications.add(m);
                }
            });

            // Check lab results
            doc.labResults?.forEach(l => {
                if (this.containsKeyword(l, cardiacKeywords)) {
                    cardiacTests.add(l);
                }
            });

            // Check if document is cardiac-related
            if (this.containsKeyword(doc.fileName, cardiacKeywords)) {
                cardiacReports.push({
                    name: doc.fileName,
                    date: doc.processedAt ? new Date(doc.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
                    type: doc.fileType
                });
            }
        });

        // Extract vital signs
        const vitals = this.extractVitals(documents);

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
            cardiacMedications: Array.from(cardiacMedications).length > 0 ? Array.from(cardiacMedications) : ['NA'],
            cardiacTests: Array.from(cardiacTests).length > 0 ? Array.from(cardiacTests) : ['NA'],
            vitals: vitals,
            recentCardiacReports: cardiacReports.slice(0, 5),
            riskFactors: this.calculateCardiacRiskFactors(patient, medicalForm, cardiacDiagnoses),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Generate Orthopedic-Specific Summary
     */
    generateOrthopedicSummary(patient, medicalForm, documents) {
        // Orthopedic keywords
        const orthopedicKeywords = [
            'bone', 'joint', 'muscle', 'ligament', 'tendon', 'cartilage',
            'fracture', 'dislocation', 'sprain', 'strain', 'arthritis',
            'osteoporosis', 'back pain', 'neck pain', 'knee', 'hip', 'shoulder',
            'spine', 'disc', 'x-ray', 'mri', 'ct scan', 'orthopedic',
            'ortho', 'rheumatoid', 'osteoarthritis', 'gout'
        ];

        // Filter orthopedic-related data
        const orthopedicDiagnoses = new Set();
        const orthopedicMedications = new Set();
        const orthopedicImaging = new Set();
        const orthopedicReports = [];

        documents.forEach(doc => {
            // Check diagnoses
            doc.diagnoses?.forEach(d => {
                if (this.containsKeyword(d, orthopedicKeywords)) {
                    orthopedicDiagnoses.add(d);
                }
            });

            // Check medications (pain meds, anti-inflammatories)
            doc.medications?.forEach(m => {
                if (this.containsKeyword(m, ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'prednisone'])) {
                    orthopedicMedications.add(m);
                }
            });

            // Check imaging results
            doc.labResults?.forEach(l => {
                if (this.containsKeyword(l, ['x-ray', 'mri', 'ct', 'ultrasound', 'bone density'])) {
                    orthopedicImaging.add(l);
                }
            });

            // Check if document is orthopedic-related
            if (this.containsKeyword(doc.fileName, orthopedicKeywords)) {
                orthopedicReports.push({
                    name: doc.fileName,
                    date: doc.processedAt ? new Date(doc.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'NA',
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
            orthopedicMedications: Array.from(orthopedicMedications).length > 0 ? Array.from(orthopedicMedications) : ['NA'],
            imagingResults: Array.from(orthopedicImaging).length > 0 ? Array.from(orthopedicImaging) : ['NA'],
            recentOrthopedicReports: orthopedicReports.slice(0, 5),
            mobilityStatus: this.extractMobilityStatus(documents),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Helper: Check if text contains any keyword
     */
    containsKeyword(text, keywords) {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    }

    /**
     * Extract chief complaints from recent documents
     */
    extractChiefComplaints(documents) {
        const complaints = [];
        const complaintKeywords = ['complaint', 'symptom', 'pain', 'fever', 'cough', 'fatigue'];

        documents.slice(0, 5).forEach(doc => {
            if (doc.summary) {
                complaintKeywords.forEach(keyword => {
                    if (doc.summary.toLowerCase().includes(keyword)) {
                        complaints.push(doc.summary);
                    }
                });
            }
        });

        return complaints.length > 0 ? complaints : ['No chief complaints recorded'];
    }

    /**
     * Calculate general risk flags
     */
    calculateRiskFlags(patient, medicalForm, diagnoses) {
        const flags = [];

        const criticalConditions = [
            'diabetes', 'hypertension', 'heart disease', 'stroke', 'cancer',
            'kidney disease', 'liver disease', 'copd', 'asthma'
        ];

        diagnoses.forEach(d => {
            criticalConditions.forEach(condition => {
                if (d.toLowerCase().includes(condition)) {
                    flags.push(condition.charAt(0).toUpperCase() + condition.slice(1));
                }
            });
        });

        return flags.length > 0 ? flags : ['No significant risk flags'];
    }

    /**
     * Calculate cardiac risk factors
     */
    calculateCardiacRiskFactors(patient, medicalForm, cardiacDiagnoses) {
        const riskFactors = [];

        if (cardiacDiagnoses.has('hypertension')) riskFactors.push('Hypertension');
        if (cardiacDiagnoses.has('diabetes')) riskFactors.push('Diabetes');

        // Add more risk factors based on data

        return riskFactors.length > 0 ? riskFactors : ['No specific cardiac risk factors identified'];
    }

    /**
     * Extract vital signs from documents
     */
    extractVitals(documents) {
        const vitals = {
            bloodPressure: 'NA',
            heartRate: 'NA',
            temperature: 'NA',
            weight: 'NA'
        };

        // Look for vitals in the most recent documents
        const recentDoc = documents[0];
        if (recentDoc?.vitals) {
            return recentDoc.vitals;
        }

        return vitals;
    }

    /**
     * Extract mobility status for orthopedics
     */
    extractMobilityStatus(documents) {
        const mobilityKeywords = ['walking', 'ambulatory', 'wheelchair', 'crutches', 'cane', 'walker'];

        for (const doc of documents.slice(0, 3)) {
            if (doc.summary) {
                for (const keyword of mobilityKeywords) {
                    if (doc.summary.toLowerCase().includes(keyword)) {
                        return `Patient requires ${keyword}`;
                    }
                }
            }
        }

        return 'Mobility status unknown';
    }
}

module.exports = new SummaryGenerator();