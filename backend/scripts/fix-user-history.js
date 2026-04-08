/**
 * Fix existing user medical history records
 * Run with: node scripts/fix-user-history.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixUserHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord');
        console.log('✅ Connected to MongoDB');

        // Find all users
        const users = await User.find({});
        console.log(`📄 Found ${users.length} users`);

        let fixedCount = 0;

        for (const user of users) {
            let modified = false;

            if (user.medicalHistory && user.medicalHistory.length > 0) {
                for (const year of user.medicalHistory) {
                    if (year.months && year.months.length > 0) {
                        for (const month of year.months) {
                            if (month.records && month.records.length > 0) {
                                for (const record of month.records) {
                                    // Check if type is valid
                                    const validTypes = ['lab', 'imaging', 'exam', 'prescription', 'surgery', 'consultation', 'document', 'form_submission'];
                                    if (!validTypes.includes(record.type)) {
                                        console.log(`Fixing invalid type '${record.type}' for user ${user.email}`);
                                        record.type = 'document';
                                        modified = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (modified) {
                await user.save();
                fixedCount++;
                console.log(`✅ Fixed user: ${user.email}`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Fixed: ${fixedCount} users`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixUserHistory();