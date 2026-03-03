const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { auth, isDoctor } = require('../middleware/auth');

const router = express.Router();

// Get doctor profile
router.get('/profile', auth, isDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Search patient by ID
router.get('/patient/:patientId', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await User.findOne({ patientId, role: 'patient' })
      .populate('medicalHistory.months.records.uploadedBy', 'name specialization');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient summary by ID
router.get('/patient/:patientId/summary', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await User.findOne({ patientId, role: 'patient' });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const summary = {
      patientId: patient.patientId,
      name: patient.name,
      email: patient.email,
      bloodGroup: patient.bloodGroup,
      isDiabetic: patient.isDiabetic,
      diabetesType: patient.diabetesType,
      hasThyroid: patient.hasThyroid,
      thyroidCondition: patient.thyroidCondition,
      pastSurgeries: patient.pastSurgeries,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
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

// Get patient timeline by ID
router.get('/patient/:patientId/timeline', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await User.findOne({ patientId, role: 'patient' })
      .populate('medicalHistory.months.records.uploadedBy', 'name specialization');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        patientId: patient.patientId,
        name: patient.name,
        medicalHistory: patient.medicalHistory
      }
    });
  } catch (error) {
    console.error('Get patient timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add medical record to patient
router.post('/patient/:patientId/record', auth, isDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date, description, type, documents } = req.body;
    
    const patient = await User.findOne({ patientId, role: 'patient' });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const recordDate = new Date(date);
    const year = recordDate.getFullYear().toString();
    const month = recordDate.toLocaleString('default', { month: 'long' });
    
    // Find or create year entry
    let yearEntry = patient.medicalHistory.find(y => y.year === year);
    if (!yearEntry) {
      yearEntry = { year, months: [] };
      patient.medicalHistory.push(yearEntry);
    }
    
    // Find or create month entry
    let monthEntry = yearEntry.months.find(m => m.month === month);
    if (!monthEntry) {
      monthEntry = { month, records: [] };
      yearEntry.months.push(monthEntry);
    }
    
    // Add new record
    const newRecord = {
      date: recordDate,
      description,
      type,
      documents: documents || [],
      uploadedBy: req.user._id
    };
    
    monthEntry.records.push(newRecord);
    
    // Sort records by date (newest first)
    monthEntry.records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    await patient.save();
    
    res.json({
      success: true,
      message: 'Medical record added successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Add medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;