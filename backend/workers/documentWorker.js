/**
 * Background worker for processing documents
 * Runs independently to process queued documents
 */

const mongoose = require('mongoose');
const queueService = require('../services/queueService');
const documentProcessor = require('../services/documentProcessor');
const ProcessingQueue = require('../models/ProcessingQueue');
require('dotenv').config();

class DocumentWorker {
    constructor() {
        this.isRunning = false;
        this.workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.processingInterval = null;
        this.stats = {
            processed: 0,
            failed: 0,
            startedAt: null,
            lastHeartbeat: null
        };
    }

    // Start the worker
    async start() {
        if (this.isRunning) {
            console.log(`⚠️ Worker ${this.workerId} is already running`);
            return;
        }

        try {
            // Connect to MongoDB if not already connected
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord', {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });
                console.log('✅ Worker connected to MongoDB');
            }

            this.isRunning = true;
            this.stats.startedAt = new Date();

            console.log(`🚀 Document worker ${this.workerId} started`);

            // Process queue immediately on start
            this.processQueue();

            // Set up interval to process queue every 5 seconds
            this.processingInterval = setInterval(() => {
                this.processQueue();
            }, 5000);

            // Set up heartbeat
            setInterval(() => {
                this.stats.lastHeartbeat = new Date();
                console.log(`💓 Worker ${this.workerId} heartbeat - Processed: ${this.stats.processed}, Failed: ${this.stats.failed}`);
            }, 60000); // Every minute

        } catch (error) {
            console.error('❌ Failed to start worker:', error);
            this.isRunning = false;
        }
    }

    // Stop the worker
    async stop() {
        console.log(`🛑 Stopping worker ${this.workerId}...`);

        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }

        this.isRunning = false;

        console.log(`✅ Worker ${this.workerId} stopped`);
        console.log(`📊 Final stats - Processed: ${this.stats.processed}, Failed: ${this.stats.failed}`);
    }

    // Process the queue
    async processQueue() {
        if (!this.isRunning) {
            console.log('⚠️ Worker is not running');
            return;
        }

        try {
            // Get next pending job
            const nextJob = await ProcessingQueue.findOneAndUpdate(
                {
                    status: 'pending',
                    attempts: { $lt: 3 }
                },
                {
                    $set: {
                        status: 'processing',
                        startedAt: new Date(),
                        workerId: this.workerId
                    },
                    $inc: { attempts: 1 }
                },
                {
                    sort: {
                        priority: -1,
                        createdAt: 1
                    },
                    new: true
                }
            );

            if (!nextJob) {
                // No jobs to process
                return;
            }

            console.log(`🔄 Processing job ${nextJob._id} - ${nextJob.fileName} (Attempt ${nextJob.attempts})`);

            try {
                // Process the document
                const result = await documentProcessor.processDocument(
                    {
                        filePath: nextJob.filePath,
                        originalName: nextJob.fileName,
                        mimeType: nextJob.fileType,
                        size: nextJob.fileSize,
                        fileId: nextJob.fileId
                    },
                    nextJob.userId
                );

                // Update job as completed
                nextJob.status = 'completed';
                nextJob.completedAt = new Date();
                nextJob.result = {
                    documentId: result.documentId,
                    summary: result.data?.summary,
                    diagnosesCount: result.data?.diagnoses?.length || 0,
                    medicationsCount: result.data?.medications?.length || 0
                };
                await nextJob.save();

                this.stats.processed++;
                console.log(`✅ Job ${nextJob._id} completed successfully`);

            } catch (error) {
                console.error(`❌ Job ${nextJob._id} failed:`, error);

                // Update job status
                nextJob.status = 'failed';
                nextJob.errorMessage = error.message;
                nextJob.failedAt = new Date();
                await nextJob.save();

                this.stats.failed++;

                // If attempts < 3, reset to pending for retry
                if (nextJob.attempts < 3) {
                    console.log(`🔄 Will retry job ${nextJob._id} (${nextJob.attempts}/3)`);
                    nextJob.status = 'pending';
                    await nextJob.save();
                } else {
                    console.log(`❌ Job ${nextJob._id} failed permanently after 3 attempts`);

                    // Send notification about permanent failure (implement based on your notification system)
                    await this.notifyFailure(nextJob);
                }
            }

        } catch (error) {
            console.error('❌ Error in processQueue:', error);
        }
    }

    // Notify about permanent failure
    async notifyFailure(job) {
        try {
            // You can implement email/SMS/push notification here
            console.log(`🔔 Permanent failure for job ${job._id} - ${job.fileName}`);

            // Example: Save to failed jobs collection for monitoring
            const FailedJob = mongoose.model('FailedJob', new mongoose.Schema({
                jobId: String,
                fileName: String,
                userId: mongoose.Schema.Types.ObjectId,
                error: String,
                failedAt: Date
            }));

            const failedJob = new FailedJob({
                jobId: job._id,
                fileName: job.fileName,
                userId: job.userId,
                error: job.errorMessage,
                failedAt: new Date()
            });

            await failedJob.save();
        } catch (error) {
            console.error('Error sending failure notification:', error);
        }
    }

    // Get worker status
    getStatus() {
        return {
            workerId: this.workerId,
            isRunning: this.isRunning,
            stats: this.stats,
            uptime: this.stats.startedAt ?
                Math.floor((new Date() - this.stats.startedAt) / 1000) : 0
        };
    }
}

// Create and export worker instance
const documentWorker = new DocumentWorker();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n📥 Received SIGINT signal');
    await documentWorker.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n📥 Received SIGTERM signal');
    await documentWorker.stop();
    process.exit(0);
});

// Start worker if this file is run directly
if (require.main === module) {
    documentWorker.start().catch(console.error);
}

module.exports = documentWorker;