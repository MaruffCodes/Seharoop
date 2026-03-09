/**
 * Configuration for document processing pipeline
 */

module.exports = {
    // File processing limits
    fileUpload: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ],
        allowedExtensions: ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    },

    // OCR configuration
    ocr: {
        languages: ['eng'],
        confidenceThreshold: 0.7,
        preprocessing: {
            enhanceContrast: true,
            deskew: true,
            denoise: true
        }
    },

    // NLP configuration
    nlp: {
        minWordLength: 3,
        maxWordLength: 50,
        useStemming: true,
        useLemmatization: true,
        removeStopwords: true,
        confidenceThreshold: 0.6,

        // Entity extraction settings
        entities: {
            diagnoses: { enabled: true, minConfidence: 0.6 },
            medications: { enabled: true, minConfidence: 0.7 },
            labResults: { enabled: true, minConfidence: 0.6 },
            allergies: { enabled: true, minConfidence: 0.8 },
            dates: { enabled: true, minConfidence: 0.9 },
            doctors: { enabled: true, minConfidence: 0.5 },
            hospitals: { enabled: true, minConfidence: 0.5 }
        }
    },

    // Queue configuration
    queue: {
        maxConcurrent: 3,
        maxAttempts: 3,
        retryDelay: 5000, // 5 seconds
        cleanupAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        pollingInterval: 5000 // 5 seconds
    },

    // Worker configuration
    worker: {
        heartbeatInterval: 60000, // 1 minute
        maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
        gracefulShutdownTimeout: 30000 // 30 seconds
    },

    // Processing timeouts
    timeouts: {
        ocr: 30000, // 30 seconds
        nlp: 20000, // 20 seconds
        total: 60000 // 60 seconds
    },

    // Storage paths
    paths: {
        uploads: './uploads/',
        temp: './uploads/temp/',
        processed: './uploads/processed/'
    },

    // Logging
    logging: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        detailed: process.env.NODE_ENV !== 'production'
    }
};