const express = require('express');
const User = require('../models/User');
const { auth, isPatient } = require('../middleware/auth');

const router = express.Router();

// Get patient profile
router.get('/profile', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update patient profile
router.put('/profile', auth, isPatient, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.patientId;
    delete updates.qrCode;
    delete updates.role;
    delete updates.password;
    delete updates.email;

    const patient = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient medical history
router.get('/history', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id)
      .populate('medicalHistory.months.records.uploadedBy', 'name specialization');
    
    res.json({
      success: true,
      data: {
        medicalHistory: patient.medicalHistory,
        pastSurgeries: patient.pastSurgeries
      }
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient summary
router.get('/summary', auth, isPatient, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id);
    
    const summary = {
      patientId: patient.patientId,
      name: patient.name,
      bloodGroup: patient.bloodGroup,
      isDiabetic: patient.isDiabetic,
      diabetesType: patient.diabetesType,
      hasThyroid: patient.hasThyroid,
      thyroidCondition: patient.thyroidCondition,
      pastSurgeries: patient.pastSurgeries,
      totalRecords: patient.medicalHistory.reduce((total, year) => {
        return total + year.months.reduce((monthTotal, month) => {
          return monthTotal + month.records.length;
        }, 0);
      }, 0)
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get patient summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;