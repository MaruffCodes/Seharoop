/**
 * Fix existing documents to use new medication schema
 * Run with: node scripts/fix-medications.js
 */

const mongoose = require('mongoose');
const ProcessedDocument = require('../models/ProcessedDocument');
require('dotenv').config();

async function fixMedications() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord');
        console.log('✅ Connected to MongoDB');

        // First, let's check the current schema of the documents
        const sampleDoc = await ProcessedDocument.findOne();
        if (sampleDoc) {
            console.log('\n📊 Sample document structure:');
            console.log('Medications type:', Array.isArray(sampleDoc.medications) ? typeof sampleDoc.medications[0] : 'not array');
            if (Array.isArray(sampleDoc.medications) && sampleDoc.medications.length > 0) {
                console.log('First medication type:', typeof sampleDoc.medications[0]);
                console.log('First medication value:', sampleDoc.medications[0]);
            }
        }

        // Find documents with string medications
        const docs = await ProcessedDocument.find({
            $or: [
                { 'medications.0': { $type: 'string' } },
                { medications: { $elemMatch: { $type: 'string' } } }
            ]
        });

        console.log(`\n📄 Found ${docs.length} documents with string medications`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const doc of docs) {
            try {
                console.log(`\n📄 Processing document: ${doc.fileName || doc._id}`);

                if (doc.medications && Array.isArray(doc.medications)) {
                    const originalMedications = [...doc.medications];
                    const newMedications = [];

                    for (const med of originalMedications) {
                        if (typeof med === 'string') {
                            // Parse medication string
                            const dosageMatch = med.match(/(\d+\s*(?:mg|mcg|g|ml|tablet|capsule))/i);
                            const dosage = dosageMatch ? dosageMatch[1] : 'NA';

                            // Extract name (remove dosage if present)
                            let name = med;
                            if (dosageMatch) {
                                name = med.replace(dosageMatch[0], '').trim();
                            } else {
                                name = med.trim();
                            }

                            // Clean up name
                            name = name.replace(/[^\w\s\-/]/g, '').trim();
                            if (!name) name = 'Unknown Medication';

                            // Determine purpose based on keywords
                            let purpose = 'NA';
                            const lowerMed = med.toLowerCase();
                            if (lowerMed.includes('metformin') || lowerMed.includes('glipizide') || lowerMed.includes('insulin')) {
                                purpose = 'diabetes';
                            } else if (lowerMed.includes('lisinopril') || lowerMed.includes('amlodipine') || lowerMed.includes('losartan')) {
                                purpose = 'blood pressure';
                            } else if (lowerMed.includes('atorvastatin') || lowerMed.includes('simvastatin')) {
                                purpose = 'cholesterol';
                            } else if (lowerMed.includes('ibuprofen') || lowerMed.includes('naproxen')) {
                                purpose = 'pain';
                            }

                            newMedications.push({
                                name: name,
                                purpose: purpose,
                                dosage: dosage
                            });

                            console.log(`  ✓ Converted: "${med}" → name: "${name}", purpose: "${purpose}", dosage: "${dosage}"`);
                        } else if (typeof med === 'object' && med !== null) {
                            // If it's already an object but missing required fields
                            const newMed = {
                                name: med.name || 'Unknown Medication',
                                purpose: med.purpose || 'NA',
                                dosage: med.dosage || 'NA'
                            };
                            newMedications.push(newMed);
                            console.log(`  ✓ Fixed object: ${JSON.stringify(newMed)}`);
                        }
                    }

                    // Update the document
                    doc.medications = newMedications;
                    await doc.save();
                    fixedCount++;
                    console.log(`✅ Fixed document: ${doc.fileName || doc._id}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Error fixing document ${doc._id}:`, error.message);
                console.log('Document medications:', JSON.stringify(doc.medications, null, 2));
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Fixed: ${fixedCount} documents`);
        console.log(`❌ Errors: ${errorCount} documents`);

        // Verify the fixes
        const remainingStringDocs = await ProcessedDocument.find({
            $or: [
                { 'medications.0': { $type: 'string' } },
                { medications: { $elemMatch: { $type: 'string' } } }
            ]
        });

        console.log(`\n📊 Remaining documents with string medications: ${remainingStringDocs.length}`);

        if (remainingStringDocs.length === 0) {
            console.log('✅ All documents successfully migrated!');
        } else {
            console.log('⚠️ Some documents still need attention');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run a separate function to update the schema if needed
async function updateSchema() {
    try {
        // This is a one-time operation to add the new fields if they don't exist
        await mongoose.connection.db.command({
            collMod: 'processeddocuments',
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    properties: {
                        medications: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'object',
                                properties: {
                                    name: { bsonType: 'string' },
                                    purpose: { bsonType: 'string' },
                                    dosage: { bsonType: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }).catch(() => console.log('Schema update skipped (may not be needed)'));
    } catch (error) {
        console.log('Schema update error (non-critical):', error.message);
    }
}

// Run the fix
fixMedications();