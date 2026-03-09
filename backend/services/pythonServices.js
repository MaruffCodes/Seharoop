const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');

class PythonService {
    constructor() {
        this.baseUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5002';
    }

    async processDocument(filePath, fileName, fileType) {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath), {
                filename: fileName,
                contentType: fileType
            });

            console.log('📤 Sending to Python service for processing...');

            const response = await axios.post(`${this.baseUrl}/process`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 30000, // 30 second timeout
            });

            console.log('✅ Python service response received');
            return response.data;

        } catch (error) {
            console.error('❌ Python service error:', error.message);
            throw error;
        }
    }

    async ocrOnly(filePath, fileName, fileType) {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath), {
                filename: fileName,
                contentType: fileType
            });

            const response = await axios.post(`${this.baseUrl}/ocr-only`, formData, {
                headers: formData.getHeaders(),
            });

            return response.data;

        } catch (error) {
            console.error('❌ OCR error:', error.message);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            return response.data;
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

module.exports = new PythonService();