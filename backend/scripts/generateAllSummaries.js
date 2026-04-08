
const mongoose = require('mongoose');
const User = require('../models/User');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const ProcessedDocument = require('../models/ProcessedDocument');
const summaryGenerator = require('../services/summaryGenerator');
require('dotenv').config();

async function generateAllSummaries() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord');
        console.log('✅ Connected to MongoDB');

        const patients = await User.find({ role: 'patient' });
        console.log(`📊 Found ${patients.length} patients`);

        for (const patient of patients) {
            console.log(`\n🔄 Processing patient: ${patient.patientId} - ${patient.name}`);

            const medicalForm = await PatientMedicalForm.findOne({ patientId: patient._id });
            const allDocs = await ProcessedDocument.find({ userId: patient._id })
                .sort({ processedAt: -1 });

            console.log(`📄 Found ${allDocs.length} documents`);

            await summaryGenerator.generateAndSaveAllSummaries(patient, medicalForm, allDocs);
            console.log(`✅ Completed patient: ${patient.patientId}`);
        }

        console.log('\n🎉 All summaries generated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

generateAllSummaries();
