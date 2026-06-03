const User = require('../models/User');
const DoctorPatientView = require('../models/DoctorPatientView');

// Get doctor profile
exports.getDoctorProfile = async (req, res) => {
    try {
        const doctor = await User.findById(req.user._id).select('-password');
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        res.json({ success: true, data: doctor });
    } catch (error) {
        console.error('Get doctor profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['name', 'email', 'phone', 'specialization', 'qualification',
            'experience', 'hospitalName', 'hospitalAddress'];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        const doctor = await User.findByIdAndUpdate(
            req.user._id,
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.json({ success: true, data: doctor, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update doctor profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Record patient view (called when doctor scans QR or searches)
exports.recordPatientView = async (req, res) => {
    try {
        const { patientId, patientName, patientUniqueId } = req.body;
        const doctorId = req.user._id;

        // Find existing record
        let viewRecord = await DoctorPatientView.findOne({ doctorId, patientId });

        if (viewRecord) {
            // Update existing record
            viewRecord.viewCount += 1;
            viewRecord.lastViewedAt = new Date();
            await viewRecord.save();
        } else {
            // Create new record
            viewRecord = new DoctorPatientView({
                doctorId,
                patientId,
                patientName,
                patientUniqueId,
                viewCount: 1,
                firstViewedAt: new Date(),
                lastViewedAt: new Date()
            });
            await viewRecord.save();
        }

        res.json({ success: true, data: viewRecord });
    } catch (error) {
        console.error('Record patient view error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get doctor's patient list (recent patients)
exports.getMyPatients = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const limit = parseInt(req.query.limit) || 50;

        const patients = await DoctorPatientView.find({ doctorId })
            .sort({ lastViewedAt: -1 })
            .limit(limit)
            .select('patientId patientName patientUniqueId lastViewedAt viewCount');

        res.json({
            success: true,
            data: patients,
            count: patients.length
        });
    } catch (error) {
        console.error('Get my patients error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get dashboard stats
exports.getDoctorDashboardStats = async (req, res) => {
    try {
        const doctorId = req.user._id;

        const totalPatients = await DoctorPatientView.countDocuments({ doctorId });
        const recentPatients = await DoctorPatientView.find({ doctorId })
            .sort({ lastViewedAt: -1 })
            .limit(10)
            .select('patientName patientUniqueId lastViewedAt');

        res.json({
            success: true,
            data: {
                totalPatients,
                recentPatients
            }
        });
    } catch (error) {
        console.error('Get doctor stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};