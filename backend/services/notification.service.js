const Notification = require('../models/Notification');
const User = require('../models/User');

exports.createSecurityAlert = async (patientId, doctorDetails) => {
  try {
    if (!patientId) throw new Error('Patient ID is required to create a security alert.');

    const patient = await User.findById(patientId);
    if (!patient) throw new Error('Patient not found in database.');

      const doctorName = doctorDetails?.name ? doctorDetails.name : 'Unknown Doctor';
      const doctorEmail = doctorDetails?.email ? doctorDetails.email : 'Unknown Email';
      const doctorPhone = doctorDetails?.phone ? doctorDetails.phone : 'Unknown Phone';
      const doctorhospital = doctorDetails?.hospital?.name ? doctorDetails.hospital.name : 'Unknown Hospital';
      const hospitalAddress = doctorDetails?.hospital?.address ? `${doctorDetails.hospital.address.street}, ${doctorDetails.hospital.address.city}, ${doctorDetails.hospital.address.state} ${doctorDetails.hospital.address.pincode}, ${doctorDetails.hospital.address.country}` : 'Unknown Address';

const message = `
SECURITY ALERT:
${doctorName} has accessed your medical data.

Doctor Details:
Email: ${doctorEmail}
Phone: ${doctorPhone}
Hospital: ${doctorhospital}
Address: ${hospitalAddress}
`;
    await Notification.create({
      userId: patient._id,
      email: patient.email,
      role: 'PATIENT',
      message: message,
      read: false,
      createdAt: new Date()
    });

    console.log(`[NOTIFICATION TO PATIENT - ${patient.email}]: ${message}`);
  } catch (error) {
    console.error('[NOTIFICATION SERVICE ERROR]:', error.message);
    throw error;
  }
};