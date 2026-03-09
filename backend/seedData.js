const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const dotenv = require('dotenv');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample Indian Patient Data
const createSamplePatient = async () => {
  try {
    // Check if patient already exists
    const existingPatient = await User.findOne({ email: 'priya.sharma@gmail.com' });
    if (existingPatient) {
      console.log('📋 Sample patient already exists');
      return existingPatient;
    }

    const patientId = '00001';
    const qrCodeData = await QRCode.toDataURL(patientId);

    const samplePatient = new User({
      role: 'patient',
      patientId: patientId,
      qrCode: qrCodeData,
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      password: 'password123',
      bloodGroup: 'B+',
      isDiabetic: true,
      diabetesType: 'Type 2',
      hasThyroid: false,
      thyroidCondition: null,
      dateOfBirth: new Date('1995-08-15'),
      gender: 'Female',
      phone: '+91-9876543210',
      address: {
        street: '123, MG Road',
        city: 'Nashik',
        state: 'Maharashtra',
        pincode: '400011',
        country: 'India'
      },
      emergencyContact: {
        name: 'Rajesh Sharma',
        relationship: 'Father',
        phone: '+91-9876543211'
      },

      // ✅ NEW FIELDS ADDED
      medicationAllergies: ['Penicillin', 'Sulfa drugs'],
      comorbidConditions: ['Diabetes (Type 2)', 'Hypertension'],
      chronicDiseases: ['Asthma'],
      thyroidCondition: null, // Already included in your schema
      previousInterventions: [
        {
          name: 'Coronary Angiography',
          date: new Date('2022-05-10'),
          hospital: 'Nanavati Hospital, Mumbai'
        }
      ],
      majorSurgeriesOrIllness: [
        {
          name: 'Appendectomy',
          date: new Date('2020-03-15'),
          hospital: 'Lilavati Hospital, Mumbai',
          notes: 'Surgery successful, full recovery'
        },
        {
          name: 'Hospital admission for Dengue Fever',
          date: new Date('2018-08-20'),
          hospital: 'Apollo Hospital, Nashik',
          notes: 'Admitted for 5 days, recovered well'
        }
      ],
      currentMedications: [
        { name: 'Metformin 500mg', for: 'Diabetes', dosage: 'Twice daily' },
        { name: 'Amlodipine 5mg', for: 'Hypertension', dosage: 'Once daily' },
        { name: 'Salbutamol Inhaler', for: 'Asthma', dosage: 'As needed' }
      ],
      bloodThinnerHistory: [
        {
          name: 'Aspirin 75mg',
          type: 'Antiplatelet',
          duration: '6 months (2022)',
          reason: 'Post-angiography'
        }
      ],

      pastSurgeries: [
        {
          surgery: 'Appendectomy',
          date: new Date('2020-03-15'),
          hospital: 'Lilavati Hospital, Mumbai',
          surgeon: 'Dr. Anil Kumar'
        }
      ],

      medicalHistory: [
        {
          year: '2024',
          months: [
            {
              month: 'January',
              records: [
                {
                  date: new Date('2024-01-15'),
                  description: 'Blood Sugar Level Test - HbA1c: 7.2%',
                  type: 'lab',
                  documents: []
                },
                {
                  date: new Date('2024-01-20'),
                  description: 'Chest X-Ray - Normal findings',
                  type: 'imaging',
                  documents: []
                }
              ]
            },
            {
              month: 'March',
              records: [
                {
                  date: new Date('2024-03-10'),
                  description: 'Diabetes Follow-up Consultation',
                  type: 'consultation',
                  documents: []
                }
              ]
            }
          ]
        },
        {
          year: '2023',
          months: [
            {
              month: 'December',
              records: [
                {
                  date: new Date('2023-12-10'),
                  description: 'Annual Physical Examination - Overall health good',
                  type: 'exam',
                  documents: []
                }
              ]
            },
            {
              month: 'September',
              records: [
                {
                  date: new Date('2023-09-05'),
                  description: 'Lipid Profile Test - Cholesterol levels normal',
                  type: 'lab',
                  documents: []
                }
              ]
            }
          ]
        }
      ]
    });

    await samplePatient.save();
    console.log('👩‍⚕️ Sample patient created successfully');
    console.log(`   Name: ${samplePatient.name}`);
    console.log(`   Email: ${samplePatient.email}`);
    console.log(`   Patient ID: ${samplePatient.patientId}`);
    console.log(`   Password: password123`);

    return samplePatient;
  } catch (error) {
    console.error('❌ Error creating sample patient:', error);
    throw error;
  }
};

// Sample Indian Doctor Data
const createSampleDoctor = async () => {
  try {
    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email: 'dr.saroj.singh@hospital.com' });
    if (existingDoctor) {
      console.log('👨‍⚕️ Sample doctor already exists');
      return existingDoctor;
    }

    const sampleDoctor = new Doctor({
      role: 'doctor',
      doctorId: 'DR0001',
      name: 'Dr. Saroj Singh',
      email: 'dr.saroj.singh@hospital.com',
      password: 'doctor123',
      specialization: 'Internal Medicine',
      qualification: 'MBBS, MD (Internal Medicine)',
      experience: 8,
      licenseNumber: 'MH-12345-2016',
      hospital: {
        name: 'Apollo Hospital',
        address: {
          street: '456, Sahar Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400099',
          country: 'India'
        }
      },
      phone: '+91-9876543220',
      consultationFee: 1500,
      availableHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: { start: '', end: '' }
      },
      isVerified: true,
      rating: {
        average: 4.8,
        count: 156
      }
    });

    await sampleDoctor.save();
    console.log('👨‍⚕️ Sample doctor created successfully');
    console.log(`   Name: ${sampleDoctor.name}`);
    console.log(`   Email: ${sampleDoctor.email}`);
    console.log(`   Doctor ID: ${sampleDoctor.doctorId}`);
    console.log(`   Password: doctor123`);
    console.log(`   Specialization: ${sampleDoctor.specialization}`);

    return sampleDoctor;
  } catch (error) {
    console.error('❌ Error creating sample doctor:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    await connectDB();

    // Create sample data
    const patient = await createSamplePatient();
    const doctor = await createSampleDoctor();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('=================================');
    console.log('PATIENT LOGIN:');
    console.log('Email: priya.sharma@gmail.com');
    console.log('Password: password123');
    console.log('Patient ID: 00001');
    console.log('\nDOCTOR LOGIN:');
    console.log('Email: dr.saroj.singh@hospital.com');
    console.log('Password: doctor123');
    console.log('Doctor ID: DR0001');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, createSamplePatient, createSampleDoctor };
