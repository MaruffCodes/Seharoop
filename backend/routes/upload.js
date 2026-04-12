// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs-extra');
// const { v4: uuidv4 } = require('uuid');
// const { auth, isPatient } = require('../middleware/auth');
// const ProcessingQueue = require('../models/ProcessingQueue');

// // Ensure upload directories exist
// const uploadDir = path.join(__dirname, '../uploads');
// const tempDir = path.join(__dirname, '../uploads/temp');

// fs.ensureDirSync(uploadDir);
// fs.ensureDirSync(tempDir);

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, tempDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueId = uuidv4();
//     const ext = path.extname(file.originalname);
//     cb(null, `${uniqueId}${ext}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = [
//     'application/pdf',
//     'text/plain',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/msword',
//     'image/jpeg',
//     'image/png',
//     'image/jpg'
//   ];

//   const allowedExtensions = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

//   const ext = path.extname(file.originalname).toLowerCase();

//   if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only PDF, TXT, DOCX, and images are allowed.'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   },
//   fileFilter: fileFilter
// });

// // Single file upload
// router.post('/single', auth, isPatient, upload.single('document'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'No file uploaded'
//       });
//     }

//     console.log('📁 File uploaded:', req.file.originalname);

//     const fileInfo = {
//       fileId: req.file.filename.split('.')[0],
//       originalName: req.file.originalname,
//       filename: req.file.filename,
//       path: req.file.path,
//       size: req.file.size,
//       mimetype: req.file.mimetype,
//       userId: req.user._id
//     };

//     // Add to processing queue
//     const queueItem = new ProcessingQueue({
//       fileId: fileInfo.fileId,
//       userId: req.user._id,
//       fileName: fileInfo.originalName,
//       fileType: fileInfo.mimetype,
//       fileSize: fileInfo.size,
//       filePath: fileInfo.path,
//       status: 'pending',
//       priority: 'normal',
//       createdAt: new Date()
//     });

//     await queueItem.save();

//     console.log('📥 Added to queue:', queueItem._id);

//     res.status(201).json({
//       success: true,
//       message: 'File uploaded successfully and queued for processing',
//       data: {
//         fileId: fileInfo.fileId,
//         fileName: fileInfo.originalName,
//         queueId: queueItem._id,
//         status: 'pending'
//       }
//     });

//   } catch (error) {
//     console.error('❌ Upload error:', error);

//     // Clean up file if error occurred
//     if (req.file) {
//       await fs.remove(req.file.path);
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to upload file'
//     });
//   }
// });

// // Multiple files upload
// router.post('/multiple', auth, isPatient, upload.array('documents', 5), async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No files uploaded'
//       });
//     }

//     const queueItems = [];

//     for (const file of req.files) {
//       const fileInfo = {
//         fileId: file.filename.split('.')[0],
//         originalName: file.originalname,
//         filename: file.filename,
//         path: file.path,
//         size: file.size,
//         mimetype: file.mimetype,
//         userId: req.user._id
//       };

//       const queueItem = new ProcessingQueue({
//         fileId: fileInfo.fileId,
//         userId: req.user._id,
//         fileName: fileInfo.originalName,
//         fileType: fileInfo.mimetype,
//         fileSize: fileInfo.size,
//         filePath: fileInfo.path,
//         status: 'pending',
//         priority: 'normal',
//         createdAt: new Date()
//       });

//       await queueItem.save();
//       queueItems.push({
//         fileId: fileInfo.fileId,
//         fileName: fileInfo.originalName,
//         queueId: queueItem._id
//       });
//     }

//     res.status(201).json({
//       success: true,
//       message: `${req.files.length} files uploaded successfully and queued for processing`,
//       data: {
//         files: queueItems,
//         count: req.files.length
//       }
//     });

//   } catch (error) {
//     console.error('❌ Multiple upload error:', error);

//     // Clean up files if error occurred
//     if (req.files) {
//       for (const file of req.files) {
//         await fs.remove(file.path);
//       }
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to upload files'
//     });
//   }
// });

// // Get upload status
// router.get('/status/:fileId', auth, async (req, res) => {
//   try {
//     const { fileId } = req.params;

//     const queueItem = await ProcessingQueue.findOne({ fileId });

//     if (!queueItem) {
//       return res.status(404).json({
//         success: false,
//         message: 'File not found'
//       });
//     }

//     // Check authorization
//     if (queueItem.userId.toString() !== req.user._id.toString() && req.userRole !== 'doctor') {
//       return res.status(403).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         fileId: queueItem.fileId,
//         fileName: queueItem.fileName,
//         status: queueItem.status,
//         createdAt: queueItem.createdAt,
//         completedAt: queueItem.completedAt,
//         failedAt: queueItem.failedAt,
//         errorMessage: queueItem.errorMessage,
//         attempts: queueItem.attempts
//       }
//     });

//   } catch (error) {
//     console.error('❌ Status check error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get upload status'
//     });
//   }
// });

// // Get user's uploads
// router.get('/my-uploads', auth, isPatient, async (req, res) => {
//   try {
//     const uploads = await ProcessingQueue.find({
//       userId: req.user._id
//     }).sort({ createdAt: -1 }).limit(50);

//     res.json({
//       success: true,
//       data: uploads.map(item => ({
//         fileId: item.fileId,
//         fileName: item.fileName,
//         status: item.status,
//         createdAt: item.createdAt,
//         completedAt: item.completedAt,
//         fileType: item.fileType,
//         fileSize: item.fileSize
//       }))
//     });

//   } catch (error) {
//     console.error('❌ Get uploads error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get uploads'
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { auth, isPatient } = require('../middleware/auth');
const ProcessingQueue = require('../models/ProcessingQueue');
const MedicalReport = require('../models/Medicalreport');

// ── Directories ───────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../uploads/temp');
const reportsDir = path.join(__dirname, '../uploads/reports');   // permanent home for lab reports

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(tempDir);
fs.ensureDirSync(reportsDir);

// ── Multer config (shared) ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword', 'image/jpeg', 'image/png', 'image/jpg',
  ];
  const allowedExt = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, DOCX, and images are allowed.'), false);
  }
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT ROUTES  (OCR → summary pipeline)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/upload/single  →  queue for OCR processing
router.post('/single', auth, isPatient, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    console.log('📁 Document uploaded:', req.file.originalname);

    const fileId = req.file.filename.split('.')[0];

    const queueItem = new ProcessingQueue({
      fileId,
      userId: req.user._id,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      status: 'pending',
      priority: 'normal',
      createdAt: new Date(),
    });
    await queueItem.save();

    console.log('📥 Added to processing queue:', queueItem._id);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and queued for processing',
      data: { fileId, fileName: req.file.originalname, queueId: queueItem._id, status: 'pending' },
    });
  } catch (error) {
    console.error('❌ Document upload error:', error);
    if (req.file) await fs.remove(req.file.path).catch(() => { });
    res.status(500).json({ success: false, message: error.message || 'Failed to upload document' });
  }
});

// POST /api/upload/multiple  →  queue multiple docs for OCR processing
router.post('/multiple', auth, isPatient, upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files uploaded' });

    const queueItems = [];
    for (const file of req.files) {
      const fileId = file.filename.split('.')[0];
      const item = new ProcessingQueue({
        fileId,
        userId: req.user._id,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        status: 'pending',
        priority: 'normal',
        createdAt: new Date(),
      });
      await item.save();
      queueItems.push({ fileId, fileName: file.originalname, queueId: item._id });
    }

    res.status(201).json({
      success: true,
      message: `${req.files.length} documents queued for processing`,
      data: { files: queueItems, count: req.files.length },
    });
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    if (req.files) for (const f of req.files) await fs.remove(f.path).catch(() => { });
    res.status(500).json({ success: false, message: error.message || 'Failed to upload files' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORT ROUTES  (lab reports: KFT, LFT, CBC …  — NO OCR, just store)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/upload/report/single  →  store as MedicalReport, no processing queue
router.post('/report/single', auth, isPatient, upload.single('report'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    console.log('🧪 Lab report uploaded:', req.file.originalname);

    const fileId = req.file.filename.split('.')[0];
    const ext = path.extname(req.file.originalname);
    const destPath = path.join(reportsDir, `${fileId}${ext}`);

    // Move immediately from temp → permanent reports folder
    await fs.move(req.file.path, destPath, { overwrite: true });

    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

    const report = new MedicalReport({
      userId: req.user._id,
      fileId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      reportCategory: req.body.category || detectCategory(req.file.originalname),
      filePath: destPath,
      notes: req.body.notes || '',
    });
    await report.save();

    console.log('✅ Lab report saved:', report._id);

    res.status(201).json({
      success: true,
      message: 'Lab report uploaded successfully',
      data: {
        id: report._id,
        fileId,
        fileName: report.fileName,
        reportCategory: report.reportCategory,
        fileUrl: `${BASE_URL}/api/reports/file/${fileId}`,
        uploadedAt: report.uploadedAt,
      },
    });
  } catch (error) {
    console.error('❌ Report upload error:', error);
    if (req.file) await fs.remove(req.file.path).catch(() => { });
    res.status(500).json({ success: false, message: error.message || 'Failed to upload report' });
  }
});

// ── Status & listing ──────────────────────────────────────────────────────────

router.get('/status/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const queueItem = await ProcessingQueue.findOne({ fileId });
    if (!queueItem) return res.status(404).json({ success: false, message: 'File not found' });
    if (queueItem.userId.toString() !== req.user._id.toString() && req.userRole !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.json({
      success: true,
      data: {
        fileId: queueItem.fileId,
        fileName: queueItem.fileName,
        status: queueItem.status,
        createdAt: queueItem.createdAt,
        completedAt: queueItem.completedAt,
        failedAt: queueItem.failedAt,
        errorMessage: queueItem.errorMessage,
        attempts: queueItem.attempts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get upload status' });
  }
});

router.get('/my-uploads', auth, isPatient, async (req, res) => {
  try {
    const uploads = await ProcessingQueue.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      data: uploads.map(i => ({
        fileId: i.fileId, fileName: i.fileName, status: i.status,
        createdAt: i.createdAt, completedAt: i.completedAt,
        fileType: i.fileType, fileSize: i.fileSize,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get uploads' });
  }
});

// ── Helper ────────────────────────────────────────────────────────────────────
function detectCategory(fileName) {
  const name = (fileName || '').toLowerCase();
  if (name.includes('kft') || name.includes('kidney')) return 'KFT';
  if (name.includes('lft') || name.includes('liver')) return 'LFT';
  if (name.includes('cbc') || name.includes('complete blood')) return 'CBC';
  if (name.includes('lipid') || name.includes('cholesterol')) return 'Lipid Profile';
  if (name.includes('thyroid') || name.includes('tsh')) return 'Thyroid';
  if (name.includes('sugar') || name.includes('glucose') || name.includes('hba1c')) return 'Blood Sugar';
  if (name.includes('urine')) return 'Urine Analysis';
  if (name.includes('xray') || name.includes('x-ray')) return 'X-Ray';
  if (name.includes('mri')) return 'MRI';
  if (name.includes('ct') || name.includes('scan')) return 'CT Scan';
  return 'Other';
}

module.exports = router;