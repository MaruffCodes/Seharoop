const axios = require('axios');

class SLMClient {
    constructor() {
        this.baseUrl = process.env.SLM_SERVICE_URL || 'http://localhost:5003';
        this.defaultTimeout = 30000; // 30 seconds
    }

    /**
     * Generate a medical summary using the SLM service
     * @param {Object} patientData - Patient information (name, id, age, etc.)
     * @param {Object} extractedData - Medical data extracted from documents
     * @param {string} summaryType - Type of summary (general, cardiology, orthopedic)
     * @returns {Promise<Object>} - The generated summary
     */
    async generateSummary(patientData, extractedData, summaryType = 'general') {
        try {
            console.log(`📝 Requesting SLM summary (${summaryType}) for patient: ${patientData.name || patientData.patientId}`);

            // Validate input data
            if (!patientData || !extractedData) {
                throw new Error('Missing required data: patientData and extractedData are required');
            }

            const response = await axios.post(`${this.baseUrl}/generate-summary`, {
                patientData,
                extractedData,
                summaryType
            }, {
                timeout: this.defaultTimeout,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.data && response.data.success) {
                console.log(`✅ SLM ${summaryType} summary received successfully`);
                return response.data;
            } else {
                console.warn(`⚠️ SLM service returned success: false`, response.data);
                return {
                    success: false,
                    summary: "AI summary generation failed",
                    type: summaryType,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error(`❌ SLM service error (${summaryType}):`, error.message);

            // Handle specific error types
            if (error.code === 'ECONNREFUSED') {
                throw new Error('SLM service is not running. Start it with: cd slm-service && python app.py');
            }

            if (error.code === 'ETIMEDOUT') {
                throw new Error('SLM service request timed out. The model might be too slow or overloaded.');
            }

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('SLM service response error:', {
                    status: error.response.status,
                    data: error.response.data
                });
                throw new Error(`SLM service error: ${error.response.data?.detail || error.response.statusText}`);
            }

            // Re-throw the error for the caller to handle
            throw error;
        }
    }

    /**
     * Generate multiple summaries in batch
     * @param {Array} summaries - Array of summary request objects
     * @returns {Promise<Object>} - Batch generation results
     */
    async batchGenerate(summaries) {
        try {
            console.log(`📦 Requesting batch generation for ${summaries.length} summaries`);

            if (!Array.isArray(summaries) || summaries.length === 0) {
                throw new Error('Invalid batch request: summaries must be a non-empty array');
            }

            const response = await axios.post(`${this.baseUrl}/batch-generate`, summaries, {
                timeout: this.defaultTimeout * 2, // Double timeout for batch
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log(`✅ Batch generation completed`);
            return response.data;

        } catch (error) {
            console.error('❌ Batch generation error:', error.message);

            if (error.code === 'ECONNREFUSED') {
                throw new Error('SLM service is not running. Start it with: cd slm-service && python app.py');
            }

            throw error;
        }
    }

    /**
     * Generate all three summary types for a patient
     * @param {Object} patientData - Patient information
     * @param {Object} extractedData - Medical data
     * @returns {Promise<Object>} - Object containing all three summaries
     */
    async generateAllSummaries(patientData, extractedData) {
        console.log(`📚 Generating all summary types for patient: ${patientData.name || patientData.patientId}`);

        try {
            // Run all three summary generations in parallel
            const [general, cardiology, orthopedic] = await Promise.allSettled([
                this.generateSummary(patientData, extractedData, 'general'),
                this.generateSummary(patientData, extractedData, 'cardiology'),
                this.generateSummary(patientData, extractedData, 'orthopedic')
            ]);

            const results = {
                general: general.status === 'fulfilled' ? general.value : null,
                cardiology: cardiology.status === 'fulfilled' ? cardiology.value : null,
                orthopedic: orthopedic.status === 'fulfilled' ? orthopedic.value : null,
                timestamp: new Date().toISOString()
            };

            // Log any failures
            if (general.status === 'rejected') console.error('General summary failed:', general.reason);
            if (cardiology.status === 'rejected') console.error('Cardiology summary failed:', cardiology.reason);
            if (orthopedic.status === 'rejected') console.error('Orthopedic summary failed:', orthopedic.reason);

            console.log(`✅ Generated ${Object.values(results).filter(r => r).length}/3 summaries`);
            return results;

        } catch (error) {
            console.error('❌ Failed to generate all summaries:', error.message);
            throw error;
        }
    }

    /**
     * Check if the SLM service is healthy and model is loaded
     * @returns {Promise<Object>} - Health status
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, {
                timeout: 5000
            });

            return {
                status: 'healthy',
                model_loaded: response.data.model_loaded,
                service: response.data.service,
                timestamp: response.data.timestamp
            };
        } catch (error) {
            console.warn('⚠️ SLM service health check failed:', error.message);
            return {
                status: 'unhealthy',
                model_loaded: false,
                error: error.message
            };
        }
    }

    /**
     * Get the service URL (useful for debugging)
     * @returns {string} - The base URL
     */
    getServiceUrl() {
        return this.baseUrl;
    }

    /**
     * Update the timeout value
     * @param {number} timeout - Timeout in milliseconds
     */
    setTimeout(timeout) {
        if (typeof timeout === 'number' && timeout > 0) {
            this.defaultTimeout = timeout;
            console.log(`⏱️ SLM client timeout set to ${timeout}ms`);
        }
    }
}

module.exports = new SLMClient();