/**
 * Cleanup script for old processed files and queue items
 * Usage: node scripts/cleanup.js [days]
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const ProcessingQueue = require('../models/ProcessingQueue');
const ProcessedDocument = require('../models/ProcessedDocument');
const FailedJob = require('../models/FailedJob');
require('dotenv').config();

const DAYS_TO_KEEP = parseInt(process.argv[2]) || 30;

async function cleanup() {
    console.log(`🧹 Starting cleanup of items older than ${DAYS_TO_KEEP} days...`);

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord');
        console.log('✅ Connected to MongoDB');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

        // Clean up old completed queue items
        const queueResult = await ProcessingQueue.deleteMany({
            status: 'completed',
            completedAt: { $lt: cutoffDate }
        });
        console.log(`✅ Deleted ${queueResult.deletedCount} old queue items`);

        // Clean up old failed jobs
        const failedResult = await FailedJob.deleteMany({
            resolved: true,
            resolvedAt: { $lt: cutoffDate }
        });
        console.log(`✅ Deleted ${failedResult.deletedCount} old resolved failed jobs`);

        // Clean up temp files older than 7 days
        const tempDir = path.join(__dirname, '../uploads/temp');
        const files = await fs.readdir(tempDir);

        let deletedFiles = 0;
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);

            // Delete files older than 7 days
            if (now - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
                await fs.unlink(filePath);
                deletedFiles++;
            }
        }

        console.log(`✅ Deleted ${deletedFiles} old temporary files`);

        // Get statistics
        const stats = {
            pending: await ProcessingQueue.countDocuments({ status: 'pending' }),
            processing: await ProcessingQueue.countDocuments({ status: 'processing' }),
            completed: await ProcessingQueue.countDocuments({ status: 'completed' }),
            failed: await ProcessingQueue.countDocuments({ status: 'failed' }),
            totalDocuments: await ProcessedDocument.countDocuments(),
            totalFailedJobs: await FailedJob.countDocuments({ resolved: false })
        };

        console.log('\n📊 Current Statistics:');
        console.log(JSON.stringify(stats, null, 2));

        console.log('\n✅ Cleanup completed successfully');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanup();