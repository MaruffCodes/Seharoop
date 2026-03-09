/**
 * Queue monitoring script
 * Usage: node scripts/monitorQueue.js [--watch]
 */

const mongoose = require('mongoose');
const ProcessingQueue = require('../models/ProcessingQueue');
const FailedJob = require('../models/FailedJob');
require('dotenv').config();

const WATCH_MODE = process.argv.includes('--watch');

async function monitorQueue() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord');

        if (WATCH_MODE) {
            console.log('👀 Watching queue (Ctrl+C to stop)...\n');
            setInterval(displayStats, 5000);
        } else {
            await displayStats();
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Monitoring failed:', error);
        process.exit(1);
    }
}

async function displayStats() {
    try {
        // Get queue statistics
        const stats = await ProcessingQueue.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgAttempts: { $avg: '$attempts' },
                    totalSize: { $sum: '$fileSize' }
                }
            }
        ]);

        // Get detailed counts
        const pending = await ProcessingQueue.countDocuments({ status: 'pending' });
        const processing = await ProcessingQueue.countDocuments({ status: 'processing' });
        const completed = await ProcessingQueue.countDocuments({ status: 'completed' });
        const failed = await ProcessingQueue.countDocuments({ status: 'failed' });

        // Get oldest pending job
        const oldestPending = await ProcessingQueue.findOne({ status: 'pending' })
            .sort({ createdAt: 1 });

        // Get recent failed jobs
        const recentFailed = await FailedJob.find({ resolved: false })
            .sort({ failedAt: -1 })
            .limit(5);

        // Calculate average processing time
        const avgProcessingTime = await ProcessingQueue.aggregate([
            {
                $match: {
                    status: 'completed',
                    completedAt: { $ne: null },
                    startedAt: { $ne: null }
                }
            },
            {
                $project: {
                    processingTime: {
                        $subtract: ['$completedAt', '$startedAt']
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: { $avg: '$processingTime' }
                }
            }
        ]);

        // Clear console in watch mode
        if (WATCH_MODE) {
            console.clear();
        }

        console.log('\n📊 QUEUE MONITORING REPORT');
        console.log('='.repeat(50));
        console.log(`🕐 Last Updated: ${new Date().toLocaleString()}`);
        console.log('='.repeat(50));

        console.log('\n📈 Queue Status:');
        console.log(`  ✅ Completed: ${completed}`);
        console.log(`  ⏳ Processing: ${processing}`);
        console.log(`  ⏰ Pending: ${pending}`);
        console.log(`  ❌ Failed: ${failed}`);
        console.log(`  📦 Total: ${pending + processing + completed + failed}`);

        if (oldestPending) {
            const waitTime = Math.floor((new Date() - oldestPending.createdAt) / 1000 / 60);
            console.log(`\n⏰ Oldest pending job: ${waitTime} minutes`);
            console.log(`  📄 File: ${oldestPending.fileName}`);
        }

        if (avgProcessingTime.length > 0) {
            const avgSeconds = Math.floor(avgProcessingTime[0].avgTime / 1000);
            console.log(`\n⚡ Average processing time: ${avgSeconds} seconds`);
        }

        if (recentFailed.length > 0) {
            console.log('\n❌ Recent Failed Jobs:');
            recentFailed.forEach((job, index) => {
                console.log(`  ${index + 1}. ${job.fileName} - ${job.error?.substring(0, 50)}...`);
            });
        }

        // Detailed breakdown by status
        console.log('\n📊 Detailed Breakdown:');
        stats.forEach(stat => {
            console.log(`  ${stat._id}: ${stat.count} jobs, avg attempts: ${stat.avgAttempts?.toFixed(2)}`);
        });

        console.log('\n' + '='.repeat(50));

    } catch (error) {
        console.error('❌ Error displaying stats:', error);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping monitor...');
    mongoose.disconnect();
    process.exit(0);
});

monitorQueue();