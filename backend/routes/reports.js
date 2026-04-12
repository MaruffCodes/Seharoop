const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { auth, isPatient } = require('../middleware/auth');
const MedicalReport = require('../models/Medicalreport');

const reportsDir = path.join(__dirname, '../uploads/reports');
const BASE_URL = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

// ── List all lab reports for the patient ──────────────────────────────────────
router.get('/my-reports', auth, isPatient, async (req, res) => {
    try {
        const reports = await MedicalReport.find({ userId: req.user._id })
            .sort({ uploadedAt: -1 });

        const data = reports.map(r => ({
            id: r._id,
            fileId: r.fileId,
            fileName: r.fileName,
            fileType: r.fileType,
            fileSize: r.fileSize,
            reportCategory: r.reportCategory,
            notes: r.notes,
            uploadedAt: r.uploadedAt,
            fileUrl: `${BASE_URL()}/api/reports/file/${r.fileId}`,
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('my-reports error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ── Count of lab reports (for stats) ─────────────────────────────────────────
router.get('/count', auth, isPatient, async (req, res) => {
    try {
        const count = await MedicalReport.countDocuments({ userId: req.user._id });
        res.json({ success: true, data: { count } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ── Serve a report file by fileId ─────────────────────────────────────────────
router.get('/file/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const report = await MedicalReport.findOne({ fileId });

        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        // Try stored filePath first, then scan reportsDir for the uuid
        let foundPath = null;
        if (report.filePath && await fs.pathExists(report.filePath)) {
            foundPath = report.filePath;
        } else {
            const extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.txt'];
            for (const ext of extensions) {
                const candidate = path.join(reportsDir, `${fileId}${ext}`);
                if (await fs.pathExists(candidate)) { foundPath = candidate; break; }
            }
        }

        if (!foundPath) return res.status(404).json({ success: false, message: 'File not found on disk' });

        const ext = path.extname(foundPath).toLowerCase();
        const mimeMap = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
        };

        res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Access-Control-Allow-Origin', '*');

        fs.createReadStream(foundPath).pipe(res);
    } catch (error) {
        console.error('Report file serve error:', error);
        res.status(500).json({ success: false, message: 'Error serving file' });
    }
});

// ── Delete a report ───────────────────────────────────────────────────────────
router.delete('/:reportId', auth, isPatient, async (req, res) => {
    try {
        const report = await MedicalReport.findOne({
            _id: req.params.reportId, userId: req.user._id,
        });
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        // Remove file from disk
        if (report.filePath) await fs.remove(report.filePath).catch(() => { });

        await MedicalReport.deleteOne({ _id: report._id });
        res.json({ success: true, message: 'Report deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;