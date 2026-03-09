const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');

class PythonServiceClient {
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

            console.log('📤 Sending to Python OCR/NLP service...');

            const response = await axios.post(`${this.baseUrl}/process`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 30000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            console.log('✅ Python service response received');
            return response.data;

        } catch (error) {
            console.error('❌ Python service error:', error.message);

            if (error.code === 'ECONNREFUSED') {
                throw new Error('Python service is not running. Start it with: cd python-service && python app.py');
            }

            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
            return response.data;
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

module.exports = new PythonServiceClient();