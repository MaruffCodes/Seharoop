const axios = require('axios');

class SLMClient {
    constructor() {
        this.baseUrl = process.env.SLM_SERVICE_URL || 'http://localhost:5003';
        this.defaultTimeout = 45000; // 45 seconds
    }

    async generateSummary(patientData, extractedData, summaryType = 'general') {
        try {
            console.log(`📝 Requesting SLM summary (${summaryType}) for patient: ${patientData.name || patientData.patientId}`);

            if (!patientData || !extractedData) {
                console.warn('⚠️ Missing patientData or extractedData');
                return {
                    success: false,
                    summary: "Insufficient data for AI summary",
                    type: summaryType,
                    timestamp: new Date().toISOString()
                };
            }

            console.log(`⏱️ Using timeout: ${this.defaultTimeout / 1000} seconds`);

            const response = await axios.post(`${this.baseUrl}/generate-summary`, {
                patientData,
                extractedData,
                summaryType
            }, {
                timeout: this.defaultTimeout,
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.data && response.data.success) {
                console.log(`✅ SLM ${summaryType} summary received successfully`);
                return response.data;
            } else {
                console.warn(`⚠️ SLM service returned success: false`);
                return {
                    success: false,
                    summary: "AI summary generation failed",
                    type: summaryType,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error(`❌ SLM service error (${summaryType}):`, error.message);

            // Handle timeout gracefully - return fallback object
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                console.log(`⚠️ SLM ${summaryType} summary timed out after ${this.defaultTimeout / 1000} seconds`);
                return {
                    success: false,
                    summary: "AI summary generation is taking longer than expected. Please try again.",
                    type: summaryType,
                    timestamp: new Date().toISOString()
                };
            }

            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    summary: "AI summary service is not available. Please try again later.",
                    type: summaryType,
                    timestamp: new Date().toISOString()
                };
            }

            if (error.response) {
                console.error('SLM service response error:', {
                    status: error.response.status,
                    data: error.response.data
                });
                return {
                    success: false,
                    summary: `SLM service error: ${error.response.data?.detail || error.response.statusText}`,
                    type: summaryType,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                summary: "AI summary generation failed. Please try again.",
                type: summaryType,
                timestamp: new Date().toISOString()
            };
        }
    }

    async batchGenerate(summaries) {
        try {
            console.log(`📦 Requesting batch generation for ${summaries.length} summaries`);
            const response = await axios.post(`${this.baseUrl}/batch-generate`, summaries, {
                timeout: this.defaultTimeout * 2,
                headers: { 'Content-Type': 'application/json' },
            });
            return response.data;
        } catch (error) {
            console.error('❌ Batch generation error:', error.message);
            throw error;
        }
    }

    async generateAllSummaries(patientData, extractedData) {
        console.log(`📚 Generating all summary types for patient: ${patientData.name || patientData.patientId}`);

        try {
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

            if (general.status === 'rejected') console.error('❌ General summary failed:', general.reason?.message);
            if (cardiology.status === 'rejected') console.error('❌ Cardiology summary failed:', cardiology.reason?.message);
            if (orthopedic.status === 'rejected') console.error('❌ Orthopedic summary failed:', orthopedic.reason?.message);

            console.log(`✅ Generated ${Object.values(results).filter(r => r && r.success).length}/3 summaries`);
            return results;
        } catch (error) {
            console.error('❌ Failed to generate all summaries:', error.message);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
            return {
                status: 'healthy',
                model_loaded: response.data.model_loaded,
                service: response.data.service,
                timestamp: response.data.timestamp
            };
        } catch (error) {
            return { status: 'unhealthy', model_loaded: false, error: error.message };
        }
    }

    getServiceUrl() {
        return this.baseUrl;
    }

    setTimeout(timeout) {
        if (typeof timeout === 'number' && timeout > 0) {
            this.defaultTimeout = timeout;
            console.log(`⏱️ SLM client timeout set to ${timeout}ms (${timeout / 1000} seconds)`);
        }
    }
}

module.exports = new SLMClient();