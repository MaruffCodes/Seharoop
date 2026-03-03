const express = require('express');
const PatientMedicalForm = require('../models/PatientMedicalForm');
const { auth, isPatient } = require('../middleware/auth');

const router = express.Router();

// POST: Submit Patient Medical Form
router.post('/submit', auth, isPatient, async (req, res) => {
  try {
    const {
      medicationAllergy,
      bloodGroup,
      coMorbidCondition,
      previousIntervention,
      majorSurgeries,
      currentMedication,
      bloodThinner,
      bloodThinnerDetails,
    } = req.body;

    // Validate required fields
    if (!medicationAllergy || !bloodGroup || !coMorbidCondition || !previousIntervention || !majorSurgeries || !currentMedication) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled.',
      });
    }

    // Create a new form entry
    const newForm = new PatientMedicalForm({
      userId: req.user._id, // Assuming `auth` middleware adds `req.user`
      medicationAllergy,
      bloodGroup,
      coMorbidCondition,
      previousIntervention,
      majorSurgeries,
      currentMedication,
      bloodThinner,
      bloodThinnerDetails,
    });

    // Save to the database
    await newForm.save();

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully.',
      data: newForm,
    });
  } catch (error) {
    console.error('Error submitting medical form:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});


// GET: Retrieve Patient Medical Form
router.get('/medicalform', auth, isPatient, async (req, res) => {
  try {
    const medicalForm = await PatientMedicalForm.findOne({ userId: req.user._id });

    if (!medicalForm) {
      return res.status(404).json({
        success: false,
        message: 'Medical form not found for this patient.',
      });
    }

    res.status(200).json({
      success: true,
      data: medicalForm,
    });
  } catch (error) {
    console.error('Error fetching medical form:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

module.exports = router;