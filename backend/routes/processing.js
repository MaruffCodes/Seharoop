const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { auth, isPatient } = require('../middleware/auth');
const documentProcessor = require('../services/documentProcessor');
const queueService = require('../services/queueService');
const ProcessedDocument = require('../models/ProcessedDocument');

// Configure multer for temporary storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/temp/'));
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, TXT, DOCX, and images are allowed.'));
        }
    }
});

// Upload and process document
router.post('/upload', auth, isPatient, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileInfo = {
            filePath: req.file.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            fileId: req.file.filename.split('.')[0] // Remove extension
        };

        // Add to processing queue
        const queueItem = await queueService.addToQueue(fileInfo, req.user._id);

        res.json({
            success: true,
            message: 'Document uploaded and queued for processing',
            data: {
                fileId: fileInfo.fileId,
                fileName: fileInfo.originalName,
                queueId: queueItem._id,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload document'
        });
    }
});

// Get processing status
router.get('/status/:fileId', auth, async (req, res) => {
    try {
        const { fileId } = req.params;

        const queueItem = await ProcessingQueue.findOne({ fileId });
        const processedDoc = await ProcessedDocument.findOne({ fileId });

        res.json({
            success: true,
            data: {
                queueStatus: queueItem?.status || 'not_found',
                document: processedDoc,
                queueDetails: queueItem
            }
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get processing status'
        });
    }
});

// Get all processed documents for user
router.get('/documents', auth, isPatient, async (req, res) => {
    try {
        const documents = await ProcessedDocument.find({
            userId: req.user._id,
            processingStatus: 'completed'
        }).sort({ processedAt: -1 });

        res.json({
            success: true,
            data: documents
        });

    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get documents'
        });
    }
});

// Get single processed document
router.get('/documents/:id', auth, async (req, res) => {
    try {
        const document = await ProcessedDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check authorization
        if (document.userId.toString() !== req.user._id.toString() && req.userRole !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        res.json({
            success: true,
            data: document
        });

    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get document'
        });
    }
});

// Get processing queue status (admin only)
router.get('/queue/status', auth, async (req, res) => {
    try {
        // Only allow doctors or admins
        if (req.userRole !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const status = await queueService.getQueueStatus();

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('Queue status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get queue status'
        });
    }
});

// Reprocess failed document
router.post('/reprocess/:fileId', auth, isPatient, async (req, res) => {
    try {
        const { fileId } = req.params;

        const failedItem = await ProcessingQueue.findOne({
            fileId,
            userId: req.user._id,
            status: 'failed'
        });

        if (!failedItem) {
            return res.status(404).json({
                success: false,
                message: 'Failed document not found'
            });
        }

        // Reset and add back to queue
        failedItem.status = 'pending';
        failedItem.attempts = 0;
        failedItem.errorMessage = null;
        failedItem.failedAt = null;
        await failedItem.save();

        // Trigger queue processing
        queueService.processQueue();

        res.json({
            success: true,
            message: 'Document queued for reprocessing'
        });

    } catch (error) {
        console.error('Reprocess error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reprocess document'
        });
    }
});

module.exports = router;