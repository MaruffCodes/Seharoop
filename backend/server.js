// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');
// const fs = require('fs-extra');

// // Load environment variables
// dotenv.config();

// // Import routes
// const authRoutes = require('./routes/auth');
// const patientRoutes = require('./routes/patient');
// const doctorRoutes = require('./routes/doctor');
// const uploadRoutes = require('./routes/upload');
// const medicalFormRoutes = require('./routes/medicalForm');
// const processingRoutes = require('./routes/processing');

// const app = express();

// // Ensure upload directories exist
// const uploadDir = path.join(__dirname, 'uploads');
// const tempDir = path.join(__dirname, 'uploads/temp');
// fs.ensureDirSync(uploadDir);
// fs.ensureDirSync(tempDir);

// // Middleware
// app.use(cors({
//   origin: '*', // For development only
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Serve uploaded files statically
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => {
//     console.log('✅ Connected to MongoDB');
//   })
//   .catch((error) => {
//     console.error('❌ MongoDB connection error:', error);
//     process.exit(1);
//   });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/patient', patientRoutes);
// app.use('/api/medical-form', medicalFormRoutes);
// app.use('/api/doctor', doctorRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/processing', processingRoutes);


// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     message: 'MedRecord API is running',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
//     uploads: {
//       temp: tempDir,
//       uploads: uploadDir
//     }
//   });
// });

// // Error handling middleware
// app.use((error, req, res, next) => {
//   console.error('❌ Server Error:', error);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found'
//   });
// });

// const PORT = process.env.PORT || 5001;

// app.listen(PORT, () => {
//   console.log(`🚀 MedRecord API server running on port ${PORT}`);
//   console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
//   console.log(`📁 Upload directory: ${uploadDir}`);
//   console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
// });

// module.exports = app;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');

dotenv.config();

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const uploadRoutes = require('./routes/upload');
const reportsRoutes = require('./routes/reports');
const medicalFormRoutes = require('./routes/medicalForm');
const processingRoutes = require('./routes/processing');

const app = express();

const uploadDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'uploads/temp');
const reportsDir = path.join(__dirname, 'uploads/reports');

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(tempDir);
fs.ensureDirSync(reportsDir);

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const staticOptions = {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') { res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', 'inline'); }
    else if (['.jpg', '.jpeg'].includes(ext)) res.setHeader('Content-Type', 'image/jpeg');
    else if (ext === '.png') res.setHeader('Content-Type', 'image/png');
    else if (ext === '.docx') res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  },
};
app.use('/uploads', express.static(uploadDir, staticOptions));

// Generic document file fetch  GET /api/files/:fileId
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.txt', '.doc'];
    let foundPath = null, foundExt = null;
    for (const ext of extensions) {
      const c = path.join(uploadDir, `${fileId}${ext}`);
      if (await fs.pathExists(c)) { foundPath = c; foundExt = ext; break; }
    }
    if (!foundPath) return res.status(404).json({ success: false, message: 'File not found' });
    const mimeMap = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.doc': 'application/msword', '.txt': 'text/plain' };
    res.setHeader('Content-Type', mimeMap[foundExt] || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(foundPath).pipe(res);
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({ success: false, message: 'Error serving file' });
  }
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medrecord', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/medical-form', medicalFormRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/processing', processingRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({ success: false, message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' });
});
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'API endpoint not found' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => { console.log(`🚀 Server on port ${PORT}`); });
module.exports = app;