/**
 * Fix users with empty gender strings
 * Run with: node scripts/fix-user-gender.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixUserGender() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord');
        console.log('✅ Connected to MongoDB');

        // Find users with empty gender strings
        const users = await User.find({ gender: '' });
        console.log(`📄 Found ${users.length} users with empty gender`);

        for (const user of users) {
            user.gender = null;
            await user.save();
            console.log(`✅ Fixed user: ${user.email} (${user.name})`);
        }

        // Also check for other enum fields that might have empty strings
        const usersWithEmptyBloodGroup = await User.find({ bloodGroup: '' });
        if (usersWithEmptyBloodGroup.length > 0) {
            console.log(`📄 Found ${usersWithEmptyBloodGroup.length} users with empty bloodGroup`);
            for (const user of usersWithEmptyBloodGroup) {
                user.bloodGroup = null;
                await user.save();
                console.log(`✅ Fixed bloodGroup for: ${user.email}`);
            }
        }

        const usersWithEmptyDiabetesType = await User.find({ diabetesType: '' });
        if (usersWithEmptyDiabetesType.length > 0) {
            console.log(`📄 Found ${usersWithEmptyDiabetesType.length} users with empty diabetesType`);
            for (const user of usersWithEmptyDiabetesType) {
                user.diabetesType = null;
                await user.save();
                console.log(`✅ Fixed diabetesType for: ${user.email}`);
            }
        }

        const usersWithEmptyThyroidCondition = await User.find({ thyroidCondition: '' });
        if (usersWithEmptyThyroidCondition.length > 0) {
            console.log(`📄 Found ${usersWithEmptyThyroidCondition.length} users with empty thyroidCondition`);
            for (const user of usersWithEmptyThyroidCondition) {
                user.thyroidCondition = null;
                await user.save();
                console.log(`✅ Fixed thyroidCondition for: ${user.email}`);
            }
        }

        console.log('✅ All users fixed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixUserGender();