const ProcessingQueue = require('../models/ProcessingQueue');
const documentProcessor = require('./documentProcessor');

class QueueService {
    constructor() {
        this.isProcessing = false;
        this.maxConcurrent = 3;
        this.currentProcessing = 0;
    }

    // Add document to processing queue
    async addToQueue(job) {
        try {
            const queueItem = new ProcessingQueue({
                fileId: job.fileInfo.fileId,
                userId: job.userId,
                fileName: job.fileInfo.originalName,
                fileType: job.fileInfo.mimeType,
                fileSize: job.fileInfo.size,
                filePath: job.fileInfo.filePath,
                priority: job.priority || 'normal',
                status: 'pending',
                createdAt: new Date()
            });

            await queueItem.save();
            console.log(`📥 Job added to queue: ${queueItem.fileName}`);

            // Start processing if not already running
            this.processQueue();

            return queueItem;
        } catch (error) {
            console.error('Error adding to queue:', error);
            throw error;
        }
    }

    // Process queue
    async processQueue() {
        if (this.isProcessing) {
            console.log('Queue already processing');
            return;
        }

        this.isProcessing = true;

        try {
            while (true) {
                // Get next pending job
                const nextJob = await ProcessingQueue.findOneAndUpdate(
                    {
                        status: 'pending',
                        $or: [
                            { attempts: { $lt: 3 } },
                            { attempts: null }
                        ]
                    },
                    {
                        $set: {
                            status: 'processing',
                            startedAt: new Date()
                        },
                        $inc: { attempts: 1 }
                    },
                    { sort: { priority: -1, createdAt: 1 }, new: true }
                );

                if (!nextJob) {
                    console.log('No more jobs in queue');
                    break;
                }

                console.log(`🔄 Processing job: ${nextJob.fileName}`);

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

                    // Update job status
                    nextJob.status = 'completed';
                    nextJob.completedAt = new Date();
                    nextJob.result = result;
                    await nextJob.save();

                    console.log(`✅ Job completed: ${nextJob.fileName}`);

                } catch (error) {
                    console.error(`❌ Job failed: ${nextJob.fileName}`, error);

                    nextJob.status = 'failed';
                    nextJob.errorMessage = error.message;
                    nextJob.failedAt = new Date();
                    await nextJob.save();

                    // Retry logic
                    if (nextJob.attempts < 3) {
                        console.log(`🔄 Retrying job (${nextJob.attempts}/3)...`);
                        nextJob.status = 'pending';
                        await nextJob.save();
                    }
                }

                // Small delay between jobs
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('Queue processing error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    // Get queue status
    async getQueueStatus() {
        const stats = await ProcessingQueue.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const pending = await ProcessingQueue.countDocuments({ status: 'pending' });
        const processing = await ProcessingQueue.countDocuments({ status: 'processing' });
        const completed = await ProcessingQueue.countDocuments({ status: 'completed' });
        const failed = await ProcessingQueue.countDocuments({ status: 'failed' });

        return {
            pending,
            processing,
            completed,
            failed,
            total: pending + processing + completed + failed,
            details: stats
        };
    }

    // Clear old completed jobs
    async cleanup(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        await ProcessingQueue.deleteMany({
            status: 'completed',
            completedAt: { $lt: cutoffDate }
        });

        console.log(`Cleaned up completed jobs older than ${days} days`);
    }
}

module.exports = new QueueService();