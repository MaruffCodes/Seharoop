# SEHAROOP - Digital Health Record Management System

A centralized mobile-based digital health record management system that eliminates fragmentation of patient medical records across hospitals and clinics.

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Running the Complete System](#running-the-complete-system)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## 🏥 Overview

SEHAROOP enables:
- **Patients** to upload and manage lifetime medical records
- **Doctors** to instantly access structured patient data
- **Automatic clinical information extraction** using OCR + NLP
- **AI-generated medical summaries** using a fine-tuned medical Small Language Model (SLM)
- **QR code-based retrieval** of structured patient data

## 🏗 System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Native  │────▶│   Node.js API    │────▶│  Python Service │
│   Mobile App    │◀────│    (Express)     │◀────│  (OCR + NLP)    │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                  │                        │
                                  ▼                        ▼
                         ┌───────────────┐          ┌──────────────┐
                         │   MongoDB     │          │   SLM Service│
                         │   (Storage)   │          │  (Summaries) │
                         └───────────────┘          └──────────────┘
                                  │                        │
                                  ▼                        ▼
                         ┌───────────────┐          ┌──────────────┐
                         │    Worker     │          │   File       │
                         │   (Queue)     │          │   Storage    │
                         └───────────────┘          └──────────────┘
```

## 📦 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **MongoDB** (v6 or higher)
- **Docker** (optional, for containerized setup)
- **Expo CLI** (`npm install -g expo-cli`)
- **Git**

### macOS Specific Requirements
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install system dependencies
brew install tesseract poppler cmake
```

### Python Dependencies
- Tesseract OCR
- Poppler (for PDF processing)
- llama-cpp-python (for SLM)

## 🚀 Quick Start

### One-Line Setup (Unix/Mac)
```bash
git clone https://github.com/yourusername/seharoop.git
cd seharoop
chmod +x setup.sh
./setup.sh
```

### Manual Setup (5 Terminals Required)

#### Terminal 1: MongoDB
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# OR using local MongoDB
mongod --dbpath ~/data/db
```

#### Terminal 2: Python OCR/NLP Service
```bash
cd python-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py
# Runs on http://localhost:5002
```

#### Terminal 3: SLM Service (AI Summaries)
```bash
cd slm-service
# Place your .gguf model file in slm-service/models/
cp /path/to/your/medical-slm.gguf models/

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5003
```

#### Terminal 4: Node.js Backend
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
PORT=5001
MONGO_URI=mongodb://localhost:27017/medrecord
JWT_SECRET=your-super-secret-key-change-this-in-production
PYTHON_SERVICE_URL=http://localhost:5002
SLM_SERVICE_URL=http://localhost:5003
EOF

npm run dev
# Runs on http://localhost:5001
```

#### Terminal 5: Worker (Document Processing)
```bash
cd backend
npm run worker
# Processes documents from queue
```

#### Terminal 6: React Native Mobile App
```bash
# From project root
npm install
npx expo start

# Scan QR code with Expo Go app on your phone
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

## 🔧 Detailed Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/seharoop.git
cd seharoop
```

### 2. Backend Setup
```bash
cd backend
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your settings

# Create upload directories
mkdir -p uploads/temp
```

### 3. Python OCR/NLP Service Setup
```bash
cd python-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Download scispaCy medical model
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.3/en_core_sci_md-0.5.3.tar.gz
```

### 4. SLM Service Setup
```bash
cd slm-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Place your .gguf model in the models directory
mkdir -p models
cp /path/to/your/medical-model.gguf models/medical-slm.gguf

# Test model loading
python test_model.py
```

### 5. Frontend Setup
```bash
# From project root
npm install

# Update API URL in services/api.ts if needed
# Default: http://192.168.1.4:5001/api
```

## 🎯 Running the Complete System

### Development Mode (5 Terminals)

```bash
# Terminal 1: MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Terminal 2: Python OCR/NLP
cd python-service && source venv/bin/activate && python app.py

# Terminal 3: SLM Service
cd slm-service && source venv/bin/activate && python app.py

# Terminal 4: Backend
cd backend && npm run dev

# Terminal 5: Worker
cd backend && npm run worker

# Terminal 6: Mobile App
npx expo start
```

### Production Mode with Docker Compose
```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📁 Project Structure

```
Seharoop/
├── app/                          # React Native frontend
│   ├── (tabs)/                   # Tab screens
│   ├── contexts/                  # React contexts
│   └── services/                   # API services
├── backend/                        # Node.js backend
│   ├── models/                      # MongoDB models
│   ├── routes/                      # API routes
│   ├── services/                    # Business logic
│   ├── workers/                     # Background workers
│   └── uploads/                      # File storage
├── python-service/                  # OCR/NLP service
│   ├── ocr/                          # OCR processing
│   ├── nlp/                          # NLP extraction
│   └── app.py                         # FastAPI app
├── slm-service/                      # SLM summary service
│   ├── models/                        # .gguf model files
│   ├── summarizer/                    # Summary generation
│   └── app.py                         # FastAPI app
└── docker-compose.yml                 # Docker configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register/patient` - Register patient
- `POST /api/auth/register/doctor` - Register doctor
- `POST /api/auth/login/patient` - Patient login
- `POST /api/auth/login/doctor` - Doctor login
- `POST /api/auth/logout` - Logout

### Patient Routes
- `GET /api/patient/profile` - Get patient profile
- `GET /api/patient/history` - Get medical history
- `GET /api/patient/summary` - Get medical summary
- `POST /api/patient/refresh-qr` - Refresh QR code
- `GET /api/patient/slm-summary` - Get AI summary

### Doctor Routes
- `GET /api/doctor/patient/search?q=` - Search patients
- `GET /api/doctor/patient/:patientId/summary` - Get patient summary
- `GET /api/doctor/patient/:patientId/cardiology-summary` - Cardiology summary
- `GET /api/doctor/patient/:patientId/orthopedic-summary` - Orthopedic summary

### Document Processing
- `POST /api/upload/single` - Upload single document
- `POST /api/upload/multiple` - Upload multiple documents
- `GET /api/processing/status/:fileId` - Check processing status

## 🛠 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
# Check if MongoDB is running
ps aux | grep mongo

# Start MongoDB manually
mongod --dbpath ~/data/db

# Or using Docker
docker start mongodb
```

#### 2. Python Service Won't Start
```bash
# Check Python version
python --version  # Must be 3.9+

# Check if port is in use
lsof -i :5002
kill -9 <PID>

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

#### 3. SLM Model Loading Issues
```bash
# Test model loading
cd slm-service
python test_direct.py

# Check model file
ls -la models/medical-slm.gguf
# Should be ~1.8GB

# Update llama-cpp-python
pip install --upgrade llama-cpp-python
```

#### 4. Upload Timeout Errors
```bash
# Check backend logs for timeout errors
tail -f backend/logs/app.log

# Increase timeout in services/api.ts
# Look for SLM methods with timeout: 60000
```

#### 5. Mobile App Can't Connect to Backend
```bash
# Get your local IP address
ifconfig | grep inet  # Mac
ipconfig              # Windows

# Update API_BASE_URL in services/api.ts
const API_BASE_URL = "http://YOUR_IP:5001/api";

# Check if backend is accessible from phone
# Open browser on phone: http://YOUR_IP:5001/api/health
```

### Logs Location

```bash
# Backend logs
tail -f backend/logs/app.log
tail -f backend/logs/worker.log

# Python service logs (in terminal)
# SLM service logs (in terminal)

# MongoDB logs
docker logs mongodb
```

## 🐳 Docker Compose Setup

### docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports: ["27017:27017"]
    volumes: [mongodb_data:/data/db]

  python-service:
    build: ./python-service
    ports: ["5002:5002"]
    volumes: [./python-service/uploads:/app/uploads]

  slm-service:
    build: ./slm-service
    ports: ["5003:5003"]
    volumes: [./slm-service/models:/app/models]
    environment:
      - MODEL_PATH=/app/models/medical-slm.gguf
    deploy:
      resources:
        limits: { memory: 4G }
        reservations: { memory: 2G }

  node-backend:
    build: ./backend
    ports: ["5001:5001"]
    environment:
      - MONGO_URI=mongodb://mongodb:27017/medrecord
      - PYTHON_SERVICE_URL=http://python-service:5002
      - SLM_SERVICE_URL=http://slm-service:5003
    depends_on: [mongodb, python-service, slm-service]
    volumes: [./backend/uploads:/app/uploads]

volumes:
  mongodb_data:
```

## 📊 Monitoring

### Queue Status
```bash
cd backend
node scripts/monitorQueue.js --watch
```

### Health Checks
```bash
# Backend health
curl http://localhost:5001/api/health

# Python service health
curl http://localhost:5002/health

# SLM service health
curl http://localhost:5003/health
```

### Clean Up Old Files
```bash
cd backend
node scripts/cleanup.js 30  # Remove files older than 30 days
```

## 🧪 Testing

### Test SLM Service
```bash
cd slm-service
python test_slm_api.py
```

### Test OCR/NLP Service
```bash
cd python-service
python test_service.py
```

### Test Backend API
```bash
cd backend
npm test
```

## 📱 Mobile App Features

- **Patient Dashboard**: View documents, timeline, and stats
- **Document Upload**: Upload PDF, images, DOCX files
- **QR Code**: Access medical summary via QR
- **Multiple Summaries**: General, Cardiology, Orthopedic, AI-generated
- **Timeline**: Chronological view of medical events
- **Profile**: Manage personal and medical information

## 👨‍⚕️ Doctor Features

- **Patient Search**: Search by ID, name, or QR code
- **Patient Summary**: View complete medical history
- **Specialty Views**: Cardiology and Orthopedic focused summaries
- **Download Reports**: Export patient summaries

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- FastAPI for Python services
- Express.js for Node.js backend
- React Native for mobile app
- Llama.cpp for SLM inference
- Tesseract for OCR processing

## 📞 Support

For issues or questions:
- Check logs in respective service directories
- Monitor queue status with `node scripts/monitorQueue.js`
- Check failed jobs in MongoDB
- Contact development team

---

**Made with ❤️ for better healthcare**