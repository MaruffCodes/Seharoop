// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { router } from 'expo-router';

// // DO NOT hardcode IPs in production. Use environment variables.
// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || "http://192.168.1.12:5001";
// const API_BASE_URL = `${BASE_URL}/api`;

// interface ApiResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
// }

// interface FileUpload {
//   uri: string;
//   type: string;
//   name: string;
// }

// type RequestOptions = RequestInit & {
//   headers?: Record<string, string>;
//   requiresAuth?: boolean;
//   timeout?: number;
// };

// class ApiService {
//   private token: string | null = null;

//   constructor() {
//     this.initToken();
//   }

//   private async initToken(): Promise<void> {
//     try {
//       this.token = await AsyncStorage.getItem("seharoop_token");
//     } catch (error) {
//       console.error("Failed to initialize token:", error);
//     }
//   }

//   public async getToken(): Promise<string | null> {
//     if (!this.token) {
//       this.token = await AsyncStorage.getItem("seharoop_token");
//     }
//     return this.token;
//   }

//   // Instantly injects token post-login to avoid AsyncStorage race conditions
//   public setToken(token: string): void {
//     this.token = token;
//   }

//   public async request<T = any>(
//     endpoint: string,
//     options: RequestOptions = {}
//   ): Promise<T> {
//     const { requiresAuth = true, timeout = 10000, ...fetchOptions } = options;

//     try {
//       let token = null;
//       if (requiresAuth) {
//         token = await this.getToken();

//         if (!token) {
//           router.replace('/login');
//           throw new Error('No authentication token available');
//         }
//       }

//       const config: RequestInit = {
//         headers: {
//           "Content-Type": "application/json",
//           ...(options.headers || {}),
//         },
//         ...fetchOptions,
//       };

//       if (token) {
//         (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
//       }

//       console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint} (timeout: ${timeout}ms)`);

//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), timeout);

//       const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//         ...config,
//         signal: controller.signal
//       }).finally(() => clearTimeout(timeoutId));

//       console.log(`📡 Response status: ${response.status}`);

//       if (response.status === 401) {
//         if (endpoint.includes('/login')) {
//           const errorData = await response.json().catch(() => ({}));
//           throw new Error(errorData.message || 'Invalid email or password');
//         }

//         await AsyncStorage.multiRemove([
//           "seharoop_token",
//           "seharoop_user_role",
//           "seharoop_user_data",
//           "seharoop_first_login",
//         ]);
//         this.token = null;
//         router.replace('/login');
//         throw new Error('Session expired. Please login again.');
//       }

//       let data;
//       try {
//         data = await response.json();
//       } catch (e) {
//         console.error('Failed to parse response as JSON:', e);
//         throw new Error('Invalid response from server');
//       }

//       if (!response.ok) {
//         throw new Error(data.message || `Request failed with status ${response.status}`);
//       }

//       return data as T;
//     } catch (error: any) {
//       console.error("❌ API request error:", error.message || error);

//       if (error.name === 'AbortError') {
//         throw new Error(`Request timeout after ${timeout}ms. Server is not responding.`);
//       }

//       if (error.message === 'Network request failed' ||
//         error.message.includes('Network') ||
//         error.message.includes('Failed to fetch')) {
//         throw new Error('Cannot connect to server. Please check:\n' +
//           '1. Backend server is running (cd backend && npm run dev)\n' +
//           '2. IP address is correct\n' +
//           '3. Device is on same network\n' +
//           '4. Firewall is not blocking the connection');
//       }

//       throw error;
//     }
//   }

//   // ==================== AUTH METHODS ====================
//   public async loginPatient(email: string, password: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/auth/login/patient", {
//       method: "POST",
//       body: JSON.stringify({ email, password }),
//       requiresAuth: false,
//       timeout: 10000,
//     });
//   }

//   public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/auth/login/doctor", {
//       method: "POST",
//       body: JSON.stringify({ email, password }),
//       requiresAuth: false,
//       timeout: 10000,
//     });
//   }

//   public async registerPatient(name: string, email: string, password: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/auth/register/patient", {
//       method: "POST",
//       body: JSON.stringify({ name, email, password }),
//       requiresAuth: false,
//       timeout: 10000,
//     });
//   }

//   public async registerDoctor(
//     name: string,
//     email: string,
//     password: string,
//     specialization: string,
//     qualification?: string,
//     experience?: number
//   ): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/auth/register/doctor", {
//       method: "POST",
//       body: JSON.stringify({ name, email, password, specialization, qualification, experience }),
//       requiresAuth: false,
//       timeout: 10000,
//     });
//   }

//   public async logout(): Promise<void> {
//     try {
//       try {
//         await this.request("/auth/logout", { method: "POST", requiresAuth: true, timeout: 5000 });
//         console.log('✅ Logout API call successful');
//       } catch (error) {
//         console.log('⚠️ Logout endpoint not available:', (error as Error).message);
//       }
//     } finally {
//       this.token = null;
//       await AsyncStorage.multiRemove([
//         "seharoop_token",
//         "seharoop_user_role",
//         "seharoop_user_data",
//         "seharoop_first_login",
//       ]);
//       router.replace('/login');
//     }
//   }

//   // ==================== MEDICAL FORM METHODS ====================
//   public async submitMedicalForm(formData: any): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/medical-form/submit", {
//       method: "POST",
//       body: JSON.stringify(formData),
//       timeout: 15000,
//     });
//   }

//   public async getMedicalForm(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/medical-form", { timeout: 10000 });
//   }

//   public async checkMedicalFormStatus(): Promise<boolean> {
//     try {
//       const response = await this.getMedicalForm();
//       return response.success && !!response.data;
//     } catch {
//       return false;
//     }
//   }

//   // ==================== PATIENT METHODS ====================
//   public async getPatientProfile(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/profile", { timeout: 10000 });
//   }

//   public async updatePatientProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/profile", {
//       method: "PUT",
//       body: JSON.stringify(updates),
//       timeout: 10000,
//     });
//   }

//   public async getPatientHistory(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/history", { timeout: 10000 });
//   }

//   // Patient's own summary endpoints (for patient viewing their own data)
//   public async getPatientSummary(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/summary", { timeout: 15000 });
//   }

//   public async getCardiologySummary(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/summary/cardiology", { timeout: 15000 });
//   }

//   public async getOrthopedicSummary(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/summary/orthopedic", { timeout: 15000 });
//   }

//   public async getMySLMSummary(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/slm-summary", {
//       method: "GET",
//       timeout: 120000,
//     });
//   }

//   // QR Code methods
//   public async refreshQRCode(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/refresh-qr", {
//       method: "POST",
//       timeout: 15000,
//     });
//   }

//   public async generateSpecialtyQR(specialty: 'general' | 'cardiology' | 'orthopedic'): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/patient/qr/${specialty}`, {
//       method: "POST",
//       timeout: 30000,
//     });
//   }

//   // Batch summary methods
//   public async getAllSummaries(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/all-summaries", { timeout: 30000 });
//   }

//   public async refreshAllSummaries(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/refresh-summaries", {
//       method: "POST",
//       timeout: 120000,
//     });
//   }

//   // ==================== NOTIFICATION METHODS ====================
//   public async getPatientNotifications(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/patient/notifications", { timeout: 10000 });
//   }

//   public async markNotificationRead(notificationId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/patient/notifications/${notificationId}/read`, {
//       method: "PUT",
//       timeout: 10000,
//     });
//   }

//   // ==================== DOCTOR METHODS ====================
//   public async getDoctorProfile(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/doctor/profile", { timeout: 10000 });
//   }

//   public async searchPatient(query: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
//   }

//   public async getPatientByQR(qrData: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/qr/${encodeURIComponent(qrData)}`, { timeout: 10000 });
//   }

//   // Doctor viewing patient summaries (FULL summaries, NOT QR data)
//   public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/${patientId}/summary`, {
//       timeout: 30000
//     });
//   }

//   public async getPatientCardiologySummary(patientId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/${patientId}/cardiology-summary`, {
//       timeout: 30000
//     });
//   }

//   public async getPatientOrthopedicSummary(patientId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/${patientId}/orthopedic-summary`, {
//       timeout: 30000
//     });
//   }

//   public async getPatientAllSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/${patientId}/all-summaries`, {
//       timeout: 30000
//     });
//   }

//   public async refreshPatientSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/${patientId}/refresh-summaries`, {
//       method: "POST",
//       timeout: 120000,
//     });
//   }

//   public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/${patientId}/timeline`, { timeout: 10000 });
//   }

//   public async getMyPatients(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/doctor/patients", { timeout: 10000 });
//   }

//   // Missing Doctor Dashboard Endpoints
//   public async getDoctorDashboardStats(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/doctor/dashboard/stats", { timeout: 10000 });
//   }

//   public async getDoctorSchedule(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/doctor/dashboard/schedule", { timeout: 10000 });
//   }

//   public async getDoctorActivity(): Promise<ApiResponse> {
//     return this.request<ApiResponse>("/doctor/dashboard/activity", { timeout: 10000 });
//   }

//   // Doctor SLM methods
//   public async getPatientSLMSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/doctor/patient/${patientId}/slm-summary`, {
//       timeout: 120000,
//     });
//   }

//   // ==================== UPLOAD METHODS ====================
//   public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
//     const token = await this.getToken();
//     if (!token) throw new Error('No authentication token available');

//     const formData = new FormData();

//     const fileData = {
//       uri: file.uri,
//       type: file.type || 'application/octet-stream',
//       name: file.name,
//     };

//     console.log('📤 Uploading file:', {
//       name: file.name,
//       type: file.type,
//       size: file.size,
//       uri: file.uri,
//       isMultiple
//     });

//     formData.append(isMultiple ? 'documents' : 'document', fileData as any);

//     try {
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 60000);

//       console.log(`📤 Uploading to: ${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`);

//       const response = await fetch(`${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//         body: formData,
//         signal: controller.signal,
//       }).finally(() => clearTimeout(timeoutId));

//       console.log('📡 Upload response status:', response.status);

//       const responseText = await response.text();
//       console.log('📡 Upload response text:', responseText.substring(0, 200) + '...');

//       let data;
//       try {
//         data = JSON.parse(responseText);
//       } catch (e) {
//         console.error('❌ Failed to parse upload response as JSON:', responseText.substring(0, 500));
//         throw new Error('Invalid server response - not JSON');
//       }

//       if (!response.ok) {
//         throw new Error(data.message || `Upload failed with status ${response.status}`);
//       }

//       console.log('✅ Upload successful:', data);
//       return data;

//     } catch (error: any) {
//       console.error('❌ Upload error details:', {
//         message: error.message,
//         name: error.name,
//         code: error.code
//       });

//       if (error.name === 'AbortError') {
//         throw new Error('Upload timeout after 60 seconds. Please try again with a smaller file.');
//       }

//       if (error.message === 'Network request failed' ||
//         error.message.includes('Network') ||
//         error.message.includes('Failed to fetch')) {
//         throw new Error('Cannot connect to server. Please check:\n' +
//           '1. Backend server is running (cd backend && npm run dev)\n' +
//           '2. IP address is correct (' + API_BASE_URL + ')\n' +
//           '3. Device is on same network\n' +
//           '4. Firewall is not blocking the connection');
//       }

//       throw error;
//     }
//   }

//   public async checkUploadStatus(fileId: string): Promise<ApiResponse> {
//     return this.request<ApiResponse>(`/upload/status/${fileId}`, { timeout: 10000 });
//   }

//   public async getMyUploads(): Promise<ApiResponse> {
//     return this.request<ApiResponse>('/upload/my-uploads', { timeout: 10000 });
//   }
// }

// export default new ApiService();
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { router } from 'expo-router';

// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || "http://192.168.1.12:5001";
// const API_BASE_URL = `${BASE_URL}/api`;

// interface ApiResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
// }

// interface FileUpload {
//   uri: string;
//   type: string;
//   name: string;
//   size?: number;
// }

// type RequestOptions = RequestInit & {
//   headers?: Record<string, string>;
//   requiresAuth?: boolean;
//   timeout?: number;
// };

// class ApiService {
//   private token: string | null = null;

//   constructor() { this.initToken(); }

//   private async initToken(): Promise<void> {
//     try { this.token = await AsyncStorage.getItem("seharoop_token"); } catch { }
//   }

//   public async getToken(): Promise<string | null> {
//     if (!this.token) this.token = await AsyncStorage.getItem("seharoop_token");
//     return this.token;
//   }

//   public setToken(token: string): void { this.token = token; }

//   public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
//     const { requiresAuth = true, timeout = 10000, ...fetchOptions } = options;
//     try {
//       let token = null;
//       if (requiresAuth) {
//         token = await this.getToken();
//         if (!token) { router.replace('/login'); throw new Error('No authentication token'); }
//       }
//       const config: RequestInit = {
//         headers: { "Content-Type": "application/json", ...(options.headers || {}) },
//         ...fetchOptions,
//       };
//       if (token) (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;

//       console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint} (timeout: ${timeout}ms)`);
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), timeout);
//       const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, signal: controller.signal })
//         .finally(() => clearTimeout(timeoutId));
//       console.log(`📡 Response status: ${response.status}`);

//       if (response.status === 401) {
//         if (endpoint.includes('/login')) {
//           const err = await response.json().catch(() => ({}));
//           throw new Error(err.message || 'Invalid email or password');
//         }
//         await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
//         this.token = null;
//         router.replace('/login');
//         throw new Error('Session expired. Please login again.');
//       }

//       let data;
//       try { data = await response.json(); } catch { throw new Error('Invalid response from server'); }
//       if (!response.ok) throw new Error(data.message || `Request failed ${response.status}`);
//       return data as T;
//     } catch (error: any) {
//       console.error("API error:", error.message);
//       if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms.`);
//       if (error.message?.includes('Network') || error.message?.includes('Failed to fetch'))
//         throw new Error('Cannot connect to server. Check backend is running.');
//       throw error;
//     }
//   }

//   // ── URL helpers ───────────────────────────────────────────────────────────────
//   public getDocumentUrl(fileId: string): string {
//     return `${BASE_URL}/api/files/${fileId}`;
//   }
//   public getReportUrl(fileId: string): string {
//     return `${BASE_URL}/api/reports/file/${fileId}`;
//   }

//   // ── Auth ──────────────────────────────────────────────────────────────────────
//   public async loginPatient(email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/login/patient", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
//   }
//   public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/login/doctor", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
//   }
//   public async registerPatient(name: string, email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/register/patient", { method: "POST", body: JSON.stringify({ name, email, password }), requiresAuth: false });
//   }
//   public async registerDoctor(name: string, email: string, password: string, specialization: string, qualification?: string, experience?: number): Promise<ApiResponse> {
//     return this.request("/auth/register/doctor", { method: "POST", body: JSON.stringify({ name, email, password, specialization, qualification, experience }), requiresAuth: false });
//   }
//   public async logout(): Promise<void> {
//     try { await this.request("/auth/logout", { method: "POST", timeout: 5000 }); } catch { }
//     finally {
//       this.token = null;
//       await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
//       router.replace('/login');
//     }
//   }

//   // ── Medical Form ──────────────────────────────────────────────────────────────
//   public async submitMedicalForm(formData: any): Promise<ApiResponse> {
//     return this.request("/medical-form/submit", { method: "POST", body: JSON.stringify(formData), timeout: 15000 });
//   }
//   public async getMedicalForm(): Promise<ApiResponse> {
//     return this.request("/medical-form", { timeout: 10000 });
//   }
//   public async checkMedicalFormStatus(): Promise<boolean> {
//     try { const r = await this.getMedicalForm(); return r.success && !!r.data; } catch { return false; }
//   }

//   // ── Patient ───────────────────────────────────────────────────────────────────
//   public async getPatientProfile(): Promise<ApiResponse> {
//     return this.request("/patient/profile", { timeout: 10000 });
//   }
//   public async updatePatientProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
//     return this.request("/patient/profile", { method: "PUT", body: JSON.stringify(updates), timeout: 10000 });
//   }
//   public async getPatientHistory(): Promise<ApiResponse> {
//     return this.request("/patient/history", { timeout: 10000 });
//   }

//   // ── Documents (OCR processed) — pulled directly from ProcessedDocuments ───────
//   public async getMyDocuments(): Promise<ApiResponse> {
//     return this.request("/patient/my-documents", { timeout: 15000 });
//   }
//   public async getUploadCount(): Promise<ApiResponse> {
//     return this.request("/patient/upload-count", { timeout: 10000 });
//   }

//   // ── Lab Reports (separate MedicalReport collection) ───────────────────────────
//   public async getMyReports(): Promise<ApiResponse> {
//     return this.request("/reports/my-reports", { timeout: 15000 });
//   }
//   public async getReportsCount(): Promise<ApiResponse> {
//     return this.request("/reports/count", { timeout: 10000 });
//   }
//   public async deleteReport(reportId: string): Promise<ApiResponse> {
//     return this.request(`/reports/${reportId}`, { method: 'DELETE', timeout: 10000 });
//   }

//   // ── Doctor view history ───────────────────────────────────────────────────────
//   public async getViewHistory(): Promise<ApiResponse> {
//     return this.request("/patient/view-history", { timeout: 10000 });
//   }

//   // ── Summaries ─────────────────────────────────────────────────────────────────
//   public async getPatientSummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary", { timeout: 15000 });
//   }
//   public async getCardiologySummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary/cardiology", { timeout: 15000 });
//   }
//   public async getOrthopedicSummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary/orthopedic", { timeout: 15000 });
//   }
//   public async getMySLMSummary(): Promise<ApiResponse> {
//     return this.request("/patient/slm-summary", { timeout: 120000 });
//   }
//   public async getAllSummaries(): Promise<ApiResponse> {
//     return this.request("/patient/all-summaries", { timeout: 30000 });
//   }
//   public async refreshAllSummaries(): Promise<ApiResponse> {
//     return this.request("/patient/refresh-summaries", { method: "POST", timeout: 120000 });
//   }

//   // ── QR ────────────────────────────────────────────────────────────────────────
//   public async refreshQRCode(): Promise<ApiResponse> {
//     return this.request("/patient/refresh-qr", { method: "POST", timeout: 15000 });
//   }
//   public async generateSpecialtyQR(specialty: 'general' | 'cardiology' | 'orthopedic'): Promise<ApiResponse> {
//     return this.request(`/patient/qr/${specialty}`, { method: "POST", timeout: 30000 });
//   }

//   // ── Notifications ─────────────────────────────────────────────────────────────
//   public async getPatientNotifications(): Promise<ApiResponse> {
//     return this.request("/patient/notifications", { timeout: 10000 });
//   }
//   public async markNotificationRead(notificationId: string): Promise<ApiResponse> {
//     return this.request(`/patient/notifications/${notificationId}/read`, { method: "PUT", timeout: 10000 });
//   }

//   // ── Doctor ────────────────────────────────────────────────────────────────────
//   public async getDoctorProfile(): Promise<ApiResponse> {
//     return this.request("/doctor/profile", { timeout: 10000 });
//   }
//   public async searchPatient(query: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
//   }
//   public async getPatientByQR(qrData: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/qr/${encodeURIComponent(qrData)}`, { timeout: 10000 });
//   }
//   public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/summary`, { timeout: 30000 });
//   }
//   public async getPatientCardiologySummary(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/cardiology-summary`, { timeout: 30000 });
//   }
//   public async getPatientOrthopedicSummary(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/orthopedic-summary`, { timeout: 30000 });
//   }
//   public async getPatientAllSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/all-summaries`, { timeout: 30000 });
//   }
//   public async refreshPatientSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/refresh-summaries`, { method: "POST", timeout: 120000 });
//   }
//   public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/timeline`, { timeout: 10000 });
//   }
//   public async getMyPatients(): Promise<ApiResponse> {
//     return this.request("/doctor/patients", { timeout: 10000 });
//   }
//   public async getDoctorDashboardStats(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/stats", { timeout: 10000 });
//   }
//   public async getDoctorSchedule(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/schedule", { timeout: 10000 });
//   }
//   public async getDoctorActivity(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/activity", { timeout: 10000 });
//   }
//   public async getPatientSLMSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/slm-summary`, { timeout: 120000 });
//   }

//   // ── Upload helpers ────────────────────────────────────────────────────────────
//   private async _upload(url: string, fieldName: string, file: FileUpload, extraFields?: Record<string, string>): Promise<ApiResponse> {
//     const token = await this.getToken();
//     if (!token) throw new Error('No authentication token');
//     const formData = new FormData();
//     formData.append(fieldName, { uri: file.uri, type: file.type || 'application/octet-stream', name: file.name } as any);
//     if (extraFields) Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 60000);
//     try {
//       const response = await fetch(url, {
//         method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData, signal: controller.signal,
//       }).finally(() => clearTimeout(timeoutId));
//       const text = await response.text();
//       let data;
//       try { data = JSON.parse(text); } catch { throw new Error('Invalid server response'); }
//       if (!response.ok) throw new Error(data.message || `Upload failed ${response.status}`);
//       return data;
//     } catch (error: any) {
//       if (error.name === 'AbortError') throw new Error('Upload timeout. Try a smaller file.');
//       throw error;
//     }
//   }

//   /** Upload medical document → OCR + NLP → summary */
//   public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
//     return this._upload(
//       `${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`,
//       isMultiple ? 'documents' : 'document',
//       file
//     );
//   }

//   /** Upload lab report (KFT/LFT/CBC) → stored only, no OCR */
//   public async uploadReport(file: FileUpload, category?: string): Promise<ApiResponse> {
//     return this._upload(
//       `${API_BASE_URL}/upload/report/single`,
//       'report',
//       file,
//       category ? { category } : undefined
//     );
//   }

//   public async checkUploadStatus(fileId: string): Promise<ApiResponse> {
//     return this.request(`/upload/status/${fileId}`, { timeout: 10000 });
//   }
//   public async getMyUploads(): Promise<ApiResponse> {
//     return this.request('/upload/my-uploads', { timeout: 10000 });
//   }
// }

// export default new ApiService();

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { router } from 'expo-router';

// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || "http://1.12:5001";
// const API_BASE_URL = `${BASE_URL}/api`;

// interface ApiResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
// }

// interface FileUpload {
//   uri: string;
//   type: string;
//   name: string;
//   size?: number;
// }

// type RequestOptions = RequestInit & {
//   headers?: Record<string, string>;
//   requiresAuth?: boolean;
//   timeout?: number;
// };

// class ApiService {
//   private token: string | null = null;

//   constructor() { this.initToken(); }

//   private async initToken(): Promise<void> {
//     try { this.token = await AsyncStorage.getItem("seharoop_token"); } catch { }
//   }

//   public async getToken(): Promise<string | null> {
//     if (!this.token) this.token = await AsyncStorage.getItem("seharoop_token");
//     return this.token;
//   }

//   public setToken(token: string): void { this.token = token; }

//   public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
//     const { requiresAuth = true, timeout = 10000, ...fetchOptions } = options;
//     try {
//       let token = null;
//       if (requiresAuth) {
//         token = await this.getToken();
//         if (!token) { router.replace('/login'); throw new Error('No authentication token'); }
//       }
//       const config: RequestInit = {
//         headers: { "Content-Type": "application/json", ...(options.headers || {}) },
//         ...fetchOptions,
//       };
//       if (token) (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;

//       console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint} (timeout: ${timeout}ms)`);
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), timeout);
//       const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, signal: controller.signal })
//         .finally(() => clearTimeout(timeoutId));
//       console.log(`📡 Response status: ${response.status}`);

//       if (response.status === 401) {
//         if (endpoint.includes('/login')) {
//           const err = await response.json().catch(() => ({}));
//           throw new Error(err.message || 'Invalid email or password');
//         }
//         await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
//         this.token = null;
//         router.replace('/login');
//         throw new Error('Session expired. Please login again.');
//       }

//       let data;
//       try { data = await response.json(); } catch { throw new Error('Invalid response from server'); }
//       if (!response.ok) throw new Error(data.message || `Request failed ${response.status}`);
//       return data as T;
//     } catch (error: any) {
//       console.error("API error:", error.message);
//       if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms.`);
//       if (error.message?.includes('Network') || error.message?.includes('Failed to fetch'))
//         throw new Error('Cannot connect to server. Check backend is running.');
//       throw error;
//     }
//   }

//   // ── URL helpers ───────────────────────────────────────────────────────────────
//   public getDocumentUrl(fileId: string): string {
//     return `${BASE_URL}/api/files/${fileId}`;
//   }
//   public getReportUrl(fileId: string): string {
//     return `${BASE_URL}/api/reports/file/${fileId}`;
//   }

//   // ── Auth ──────────────────────────────────────────────────────────────────────
//   public async loginPatient(email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/login/patient", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
//   }
//   public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/login/doctor", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
//   }
//   public async registerPatient(name: string, email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/register/patient", { method: "POST", body: JSON.stringify({ name, email, password }), requiresAuth: false });
//   }
//   public async registerDoctor(name: string, email: string, password: string, specialization: string, qualification?: string, experience?: number): Promise<ApiResponse> {
//     return this.request("/auth/register/doctor", { method: "POST", body: JSON.stringify({ name, email, password, specialization, qualification, experience }), requiresAuth: false });
//   }
//   public async logout(): Promise<void> {
//     try { await this.request("/auth/logout", { method: "POST", timeout: 5000 }); } catch { }
//     finally {
//       this.token = null;
//       await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
//       router.replace('/login');
//     }
//   }

//   // ── Medical Form ──────────────────────────────────────────────────────────────
//   public async submitMedicalForm(formData: any): Promise<ApiResponse> {
//     return this.request("/medical-form/submit", { method: "POST", body: JSON.stringify(formData), timeout: 15000 });
//   }
//   public async getMedicalForm(): Promise<ApiResponse> {
//     return this.request("/medical-form", { timeout: 10000 });
//   }
//   public async checkMedicalFormStatus(): Promise<boolean> {
//     try { const r = await this.getMedicalForm(); return r.success && !!r.data; } catch { return false; }
//   }

//   // ── Patient ───────────────────────────────────────────────────────────────────
//   public async getPatientProfile(): Promise<ApiResponse> {
//     return this.request("/patient/profile", { timeout: 10000 });
//   }
//   public async updatePatientProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
//     return this.request("/patient/profile", { method: "PUT", body: JSON.stringify(updates), timeout: 10000 });
//   }
//   public async getPatientHistory(): Promise<ApiResponse> {
//     return this.request("/patient/history", { timeout: 10000 });
//   }

//   /** Unified timeline: documents + lab reports + form events, newest first */
//   public async getTimeline(): Promise<ApiResponse> {
//     return this.request("/patient/timeline", { timeout: 15000 });
//   }

//   // ── Documents (OCR processed) — pulled directly from ProcessedDocuments ───────
//   public async getMyDocuments(): Promise<ApiResponse> {
//     return this.request("/patient/my-documents", { timeout: 15000 });
//   }
//   public async getUploadCount(): Promise<ApiResponse> {
//     return this.request("/patient/upload-count", { timeout: 10000 });
//   }

//   // ── Lab Reports (separate MedicalReport collection) ───────────────────────────
//   public async getMyReports(): Promise<ApiResponse> {
//     return this.request("/reports/my-reports", { timeout: 15000 });
//   }
//   public async getReportsCount(): Promise<ApiResponse> {
//     return this.request("/reports/count", { timeout: 10000 });
//   }
//   public async deleteReport(reportId: string): Promise<ApiResponse> {
//     return this.request(`/reports/${reportId}`, { method: 'DELETE', timeout: 10000 });
//   }

//   // ── Doctor view history ───────────────────────────────────────────────────────
//   public async getViewHistory(): Promise<ApiResponse> {
//     return this.request("/patient/view-history", { timeout: 10000 });
//   }

//   // ── Summaries ─────────────────────────────────────────────────────────────────
//   public async getPatientSummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary", { timeout: 15000 });
//   }
//   public async getCardiologySummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary/cardiology", { timeout: 15000 });
//   }
//   public async getOrthopedicSummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary/orthopedic", { timeout: 15000 });
//   }
//   public async getMySLMSummary(): Promise<ApiResponse> {
//     return this.request("/patient/slm-summary", { timeout: 120000 });
//   }
//   public async getAllSummaries(): Promise<ApiResponse> {
//     return this.request("/patient/all-summaries", { timeout: 30000 });
//   }
//   public async refreshAllSummaries(): Promise<ApiResponse> {
//     return this.request("/patient/refresh-summaries", { method: "POST", timeout: 120000 });
//   }

//   // ── QR ────────────────────────────────────────────────────────────────────────
//   public async refreshQRCode(): Promise<ApiResponse> {
//     return this.request("/patient/refresh-qr", { method: "POST", timeout: 15000 });
//   }
//   public async generateSpecialtyQR(specialty: 'general' | 'cardiology' | 'orthopedic'): Promise<ApiResponse> {
//     return this.request(`/patient/qr/${specialty}`, { method: "POST", timeout: 30000 });
//   }

//   // ── Notifications ─────────────────────────────────────────────────────────────
//   public async getPatientNotifications(): Promise<ApiResponse> {
//     return this.request("/patient/notifications", { timeout: 10000 });
//   }
//   public async markNotificationRead(notificationId: string): Promise<ApiResponse> {
//     return this.request(`/patient/notifications/${notificationId}/read`, { method: "PUT", timeout: 10000 });
//   }

//   // ── Doctor ────────────────────────────────────────────────────────────────────
//   public async getDoctorProfile(): Promise<ApiResponse> {
//     return this.request("/doctor/profile", { timeout: 10000 });
//   }
//   public async searchPatient(query: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
//   }
//   public async getPatientByQR(qrData: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/qr/${encodeURIComponent(qrData)}`, { timeout: 10000 });
//   }
//   public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/summary`, { timeout: 30000 });
//   }
//   public async getPatientCardiologySummary(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/cardiology-summary`, { timeout: 30000 });
//   }
//   public async getPatientOrthopedicSummary(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/orthopedic-summary`, { timeout: 30000 });
//   }
//   public async getPatientAllSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/all-summaries`, { timeout: 30000 });
//   }
//   public async refreshPatientSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/refresh-summaries`, { method: "POST", timeout: 120000 });
//   }
//   public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/timeline`, { timeout: 10000 });
//   }
//   public async getMyPatients(): Promise<ApiResponse> {
//     return this.request("/doctor/patients", { timeout: 10000 });
//   }
//   public async getDoctorDashboardStats(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/stats", { timeout: 10000 });
//   }
//   public async getDoctorSchedule(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/schedule", { timeout: 10000 });
//   }
//   public async getDoctorActivity(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/activity", { timeout: 10000 });
//   }
//   public async getPatientSLMSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/slm-summary`, { timeout: 120000 });
//   }

//   // ── Upload helpers ────────────────────────────────────────────────────────────
//   private async _upload(url: string, fieldName: string, file: FileUpload, extraFields?: Record<string, string>): Promise<ApiResponse> {
//     const token = await this.getToken();
//     if (!token) throw new Error('No authentication token');
//     const formData = new FormData();
//     formData.append(fieldName, { uri: file.uri, type: file.type || 'application/octet-stream', name: file.name } as any);
//     if (extraFields) Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 60000);
//     try {
//       const response = await fetch(url, {
//         method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData, signal: controller.signal,
//       }).finally(() => clearTimeout(timeoutId));
//       const text = await response.text();
//       let data;
//       try { data = JSON.parse(text); } catch { throw new Error('Invalid server response'); }
//       if (!response.ok) throw new Error(data.message || `Upload failed ${response.status}`);
//       return data;
//     } catch (error: any) {
//       if (error.name === 'AbortError') throw new Error('Upload timeout. Try a smaller file.');
//       throw error;
//     }
//   }

//   /** Upload medical document → OCR + NLP → summary */
//   public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
//     return this._upload(
//       `${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`,
//       isMultiple ? 'documents' : 'document',
//       file
//     );
//   }

//   /** Upload lab report (KFT/LFT/CBC) → stored only, no OCR */
//   public async uploadReport(file: FileUpload, category?: string): Promise<ApiResponse> {
//     return this._upload(
//       `${API_BASE_URL}/upload/report/single`,
//       'report',
//       file,
//       category ? { category } : undefined
//     );
//   }

//   public async checkUploadStatus(fileId: string): Promise<ApiResponse> {
//     return this.request(`/upload/status/${fileId}`, { timeout: 10000 });
//   }
//   public async getMyUploads(): Promise<ApiResponse> {
//     return this.request('/upload/my-uploads', { timeout: 10000 });
//   }
// }

// export default new ApiService();

//newimport AsyncStorage from "@react-native-async-storage/async-storage";


// import { router } from 'expo-router';
// import { Alert } from "react-native";
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || "http://192.168.1.6:5001";
// const API_BASE_URL = `${BASE_URL}/api`;

// interface ApiResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
// }

// interface FileUpload {
//   uri: string;
//   type: string;
//   name: string;
//   size?: number;
// }

// type RequestOptions = RequestInit & {
//   headers?: Record<string, string>;
//   requiresAuth?: boolean;
//   timeout?: number;
// };

// class ApiService {
//   private token: string | null = null;

//   constructor() { this.initToken(); }

//   private async initToken(): Promise<void> {
//     try { this.token = await AsyncStorage.getItem("seharoop_token"); } catch { }
//   }

//   public async getToken(): Promise<string | null> {
//     if (!this.token) this.token = await AsyncStorage.getItem("seharoop_token");
//     return this.token;
//   }

//   public setToken(token: string): void { this.token = token; }

//   public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
//     const { requiresAuth = true, timeout = 10000, ...fetchOptions } = options;
//     try {
//       let token = null;
//       if (requiresAuth) {
//         token = await this.getToken();
//         if (!token) {
//           router.replace('/login');
//           throw new Error('No authentication token');
//         }
//       }
//       const config: RequestInit = {
//         headers: { "Content-Type": "application/json", ...(options.headers || {}) },
//         ...fetchOptions,
//       };
//       if (token) (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;

//       console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint} (timeout: ${timeout}ms)`);
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), timeout);
//       const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, signal: controller.signal })
//         .finally(() => clearTimeout(timeoutId));
//       console.log(`📡 Response status: ${response.status}`);

//       if (response.status === 401) {
//         if (endpoint.includes('/login')) {
//           const err = await response.json().catch(() => ({}));
//           throw new Error(err.message || 'Invalid email or password');
//         }
//         await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
//         this.token = null;
//         router.replace('/login');
//         throw new Error('Session expired. Please login again.');
//       }

//       let data;
//       try { data = await response.json(); } catch { throw new Error('Invalid response from server'); }
//       if (!response.ok) throw new Error(data.message || `Request failed ${response.status}`);
//       return data as T;
//     } catch (error: any) {
//       console.error(`API Error [${endpoint}]:`, error.message);

//       if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms.`);
//       if (error.message?.includes('Network') || error.message?.includes('Failed to fetch'))
//         throw new Error('Cannot connect to server. Check backend is running.');
//       throw error;
//     }
//   }

//   // ── URL helpers ───────────────────────────────────────────────────────────────
//   public getDocumentUrl(fileId: string): string {
//     return `${BASE_URL}/api/files/${fileId}`;
//   }
//   public getReportUrl(fileId: string): string {
//     return `${BASE_URL}/api/reports/file/${fileId}`;
//   }

//   // ── Auth ──────────────────────────────────────────────────────────────────────
//   public async loginPatient(email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/login/patient", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
//   }
//   public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/login/doctor", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
//   }
//   public async registerPatient(name: string, email: string, password: string): Promise<ApiResponse> {
//     return this.request("/auth/register/patient", { method: "POST", body: JSON.stringify({ name, email, password }), requiresAuth: false });
//   }
//   public async registerDoctor(
//     name: string, email: string, password: string, specialization: string,
//     qualification?: string, experience?: number,
//     licenseNumber?: string, medicalCouncilId?: string,
//     hospitalName?: string, hospitalAddress?: string,
//   ): Promise<ApiResponse> {
//     return this.request("/auth/register/doctor", {
//       method: "POST",
//       body: JSON.stringify({
//         name, email, password, specialization, qualification, experience,
//         licenseNumber, medicalCouncilId, hospitalName, hospitalAddress,
//       }),
//       requiresAuth: false,
//     });
//   }
//   public async logout(): Promise<void> {
//     try { await this.request("/auth/logout", { method: "POST", timeout: 5000 }); } catch { }
//     finally {
//       this.token = null;
//       await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
//       router.replace('/login');
//     }
//   }

//   // ── Medical Form ──────────────────────────────────────────────────────────────
//   public async submitMedicalForm(formData: any): Promise<ApiResponse> {
//     return this.request("/medical-form/submit", { method: "POST", body: JSON.stringify(formData), timeout: 15000 });
//   }
//   public async getMedicalForm(): Promise<ApiResponse> {
//     return this.request("/medical-form", { timeout: 10000 });
//   }
//   public async checkMedicalFormStatus(): Promise<boolean> {
//     try { const r = await this.getMedicalForm(); return r.success && !!r.data; } catch { return false; }
//   }

//   // ── Patient ───────────────────────────────────────────────────────────────────
//   public async getPatientProfile(): Promise<ApiResponse> {
//     return this.request("/patient/profile", { timeout: 10000 });
//   }
//   public async updatePatientProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
//     return this.request("/patient/profile", { method: "PUT", body: JSON.stringify(updates), timeout: 10000 });
//   }
//   public async getPatientHistory(): Promise<ApiResponse> {
//     return this.request("/patient/history", { timeout: 10000 });
//   }

//   /** Unified timeline: documents + lab reports + form events, newest first */
//   public async getTimeline(): Promise<ApiResponse> {
//     return this.request("/patient/timeline", { timeout: 15000 });
//   }

//   // ── Documents (OCR processed) — pulled directly from ProcessedDocuments ───────
//   public async getMyDocuments(): Promise<ApiResponse> {
//     return this.request("/patient/my-documents", { timeout: 15000 });
//   }
//   public async getUploadCount(): Promise<ApiResponse> {
//     return this.request("/patient/upload-count", { timeout: 10000 });
//   }

//   // ── Lab Reports (separate MedicalReport collection) ───────────────────────────
//   public async getMyReports(): Promise<ApiResponse> {
//     return this.request("/reports/my-reports", { timeout: 15000 });
//   }
//   public async getReportsCount(): Promise<ApiResponse> {
//     return this.request("/reports/count", { timeout: 10000 });
//   }
//   public async deleteReport(reportId: string): Promise<ApiResponse> {
//     return this.request(`/reports/${reportId}`, { method: 'DELETE', timeout: 10000 });
//   }

//   // ── Doctor view history ───────────────────────────────────────────────────────
//   public async getViewHistory(): Promise<ApiResponse> {
//     return this.request("/patient/view-history", { timeout: 10000 });
//   }

//   // ── Summaries ─────────────────────────────────────────────────────────────────
//   public async getPatientSummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary", { timeout: 15000 });
//   }
//   public async getCardiologySummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary/cardiology", { timeout: 15000 });
//   }
//   public async getOrthopedicSummary(): Promise<ApiResponse> {
//     return this.request("/patient/summary/orthopedic", { timeout: 15000 });
//   }
//   public async getMySLMSummary(): Promise<ApiResponse> {
//     return this.request("/patient/slm-summary", { timeout: 120000 });
//   }
//   public async getAllSummaries(): Promise<ApiResponse> {
//     return this.request("/patient/all-summaries", { timeout: 30000 });
//   }
//   public async refreshAllSummaries(): Promise<ApiResponse> {
//     return this.request("/patient/refresh-summaries", { method: "POST", timeout: 120000 });
//   }

//   // ── QR ────────────────────────────────────────────────────────────────────────
//   public async refreshQRCode(): Promise<ApiResponse> {
//     return this.request("/patient/refresh-qr", { method: "POST", timeout: 15000 });
//   }
//   public async generateSpecialtyQR(specialty: 'general' | 'cardiology' | 'orthopedic'): Promise<ApiResponse> {
//     return this.request(`/patient/qr/${specialty}`, { method: "POST", timeout: 30000 });
//   }

//   // ── Notifications ─────────────────────────────────────────────────────────────
//   public async getPatientNotifications(): Promise<ApiResponse> {
//     return this.request("/patient/notifications", { timeout: 10000 });
//   }
//   public async markNotificationRead(notificationId: string): Promise<ApiResponse> {
//     return this.request(`/patient/notifications/${notificationId}/read`, { method: "PUT", timeout: 10000 });
//   }

//   // ── Doctor ────────────────────────────────────────────────────────────────────
//   public async getDoctorProfile(): Promise<ApiResponse> {
//     return this.request("/doctor/profile", { timeout: 10000 });
//   }

//   public async updateDoctorProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
//     return this.request("/doctor/profile/update", { method: "PUT", body: JSON.stringify(updates), timeout: 10000 });
//   }

//   public async searchPatient(query: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
//   }

//   public async getPatientByQR(qrData: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/qr/${encodeURIComponent(qrData)}`, { timeout: 10000 });
//   }

//   public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/summary`, { timeout: 30000 });
//   }

//   public async getPatientCardiologySummary(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/cardiology-summary`, { timeout: 30000 });
//   }

//   public async getPatientOrthopedicSummary(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/orthopedic-summary`, { timeout: 30000 });
//   }

//   public async getPatientAllSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/all-summaries`, { timeout: 30000 });
//   }

//   public async refreshPatientSummaries(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/refresh-summaries`, { method: "POST", timeout: 120000 });
//   }

//   public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/timeline`, { timeout: 10000 });
//   }

//   public async getMyPatients(): Promise<ApiResponse> {
//     return this.request("/doctor/my-patients", { timeout: 10000 });
//   }

//   public async getDoctorDashboardStats(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/stats", { timeout: 10000 });
//   }

//   // Record when a doctor views a patient (for analytics)
//   // Record when a doctor views a patient (for analytics)
//   async recordPatientView(patientId: string, patientName: string, patientUniqueId: string) {
//     return this.request("/doctor/record-patient-view", {
//       method: "POST",
//       body: JSON.stringify({
//         patientId,
//         patientName,
//         patientUniqueId,
//       }),
//       timeout: 10000,
//     });
//   }
//   public async getDoctorSchedule(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/schedule", { timeout: 10000 });
//   }

//   public async getDoctorActivity(): Promise<ApiResponse> {
//     return this.request("/doctor/dashboard/activity", { timeout: 10000 });
//   }

//   public async getPatientSLMSummaryDoctor(patientId: string): Promise<ApiResponse> {
//     return this.request(`/doctor/patient/${patientId}/slm-summary`, { timeout: 120000 });
//   }

//   // ── Upload helpers ────────────────────────────────────────────────────────────
//   private async _upload(url: string, fieldName: string, file: FileUpload, extraFields?: Record<string, string>): Promise<ApiResponse> {
//     const token = await this.getToken();
//     if (!token) throw new Error('No authentication token');
//     const formData = new FormData();
//     formData.append(fieldName, { uri: file.uri, type: file.type || 'application/octet-stream', name: file.name } as any);
//     if (extraFields) Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 60000);
//     try {
//       const response = await fetch(url, {
//         method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData, signal: controller.signal,
//       }).finally(() => clearTimeout(timeoutId));
//       const text = await response.text();
//       let data;
//       try { data = JSON.parse(text); } catch { throw new Error('Invalid server response'); }
//       if (!response.ok) throw new Error(data.message || `Upload failed ${response.status}`);
//       return data;
//     } catch (error: any) {
//       if (error.name === 'AbortError') throw new Error('Upload timeout. Try a smaller file.');
//       throw error;
//     }
//   }

//   /** Upload medical document → OCR + NLP → summary */
//   public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
//     return this._upload(
//       `${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`,
//       isMultiple ? 'documents' : 'document',
//       file
//     );
//   }

//   /** Upload lab report (KFT/LFT/CBC) → stored only, no OCR */
//   public async uploadReport(file: FileUpload, category?: string): Promise<ApiResponse> {
//     return this._upload(
//       `${API_BASE_URL}/upload/report/single`,
//       'report',
//       file,
//       category ? { category } : undefined
//     );
//   }

//   public async checkUploadStatus(fileId: string): Promise<ApiResponse> {
//     return this.request(`/upload/status/${fileId}`, { timeout: 10000 });
//   }
//   public async getMyUploads(): Promise<ApiResponse> {
//     return this.request('/upload/my-uploads', { timeout: 10000 });
//   }
// }

// export default new ApiService();

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from "react-native";

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || "http://192.168.1.6:5001";
const API_BASE_URL = `${BASE_URL}/api`;

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface FileUpload {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

type RequestOptions = RequestInit & {
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeout?: number;
};

class ApiService {
  private token: string | null = null;

  constructor() { this.initToken(); }

  private async initToken(): Promise<void> {
    try { this.token = await AsyncStorage.getItem("seharoop_token"); } catch { }
  }

  public async getToken(): Promise<string | null> {
    if (!this.token) this.token = await AsyncStorage.getItem("seharoop_token");
    return this.token;
  }

  public setToken(token: string): void { this.token = token; }

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, timeout = 10000, ...fetchOptions } = options;
    try {
      let token = null;
      if (requiresAuth) {
        token = await this.getToken();
        if (!token) {
          router.replace('/login');
          throw new Error('No authentication token');
        }
      }
      const config: RequestInit = {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...fetchOptions,
      };
      if (token) (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;

      console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint} (timeout: ${timeout}ms)`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, signal: controller.signal })
        .finally(() => clearTimeout(timeoutId));
      console.log(`📡 Response status: ${response.status}`);

      if (response.status === 401) {
        if (endpoint.includes('/login')) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Invalid email or password');
        }
        await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
        this.token = null;
        router.replace('/login');
        throw new Error('Session expired. Please login again.');
      }

      let data;
      try { data = await response.json(); } catch { throw new Error('Invalid response from server'); }
      if (!response.ok) throw new Error(data.message || `Request failed ${response.status}`);
      return data as T;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error.message);

      if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms.`);
      if (error.message?.includes('Network') || error.message?.includes('Failed to fetch'))
        throw new Error('Cannot connect to server. Check backend is running.');
      throw error;
    }
  }

  // ── URL helpers ───────────────────────────────────────────────────────────────
  public getDocumentUrl(fileId: string): string {
    return `${BASE_URL}/api/files/${fileId}`;
  }
  public getReportUrl(fileId: string): string {
    return `${BASE_URL}/api/reports/file/${fileId}`;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────────
  public async loginPatient(email: string, password: string): Promise<ApiResponse> {
    return this.request("/auth/login/patient", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
  }
  public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
    return this.request("/auth/login/doctor", { method: "POST", body: JSON.stringify({ email, password }), requiresAuth: false });
  }
  public async registerPatient(name: string, email: string, password: string): Promise<ApiResponse> {
    return this.request("/auth/register/patient", { method: "POST", body: JSON.stringify({ name, email, password }), requiresAuth: false });
  }
  public async registerDoctor(
    name: string, email: string, password: string, specialization: string,
    qualification?: string, experience?: number,
    licenseNumber?: string, medicalCouncilId?: string,
    hospitalName?: string, hospitalAddress?: string,
  ): Promise<ApiResponse> {
    return this.request("/auth/register/doctor", {
      method: "POST",
      body: JSON.stringify({
        name, email, password, specialization, qualification, experience,
        licenseNumber, medicalCouncilId, hospitalName, hospitalAddress,
      }),
      requiresAuth: false,
    });
  }
  public async logout(): Promise<void> {
    try { await this.request("/auth/logout", { method: "POST", timeout: 5000 }); } catch { }
    finally {
      this.token = null;
      await AsyncStorage.multiRemove(["seharoop_token", "seharoop_user_role", "seharoop_user_data", "seharoop_first_login"]);
      router.replace('/login');
    }
  }

  // ── Medical Form ──────────────────────────────────────────────────────────────
  public async submitMedicalForm(formData: any): Promise<ApiResponse> {
    return this.request("/medical-form/submit", { method: "POST", body: JSON.stringify(formData), timeout: 15000 });
  }
  public async getMedicalForm(): Promise<ApiResponse> {
    return this.request("/medical-form", { timeout: 10000 });
  }
  public async checkMedicalFormStatus(): Promise<boolean> {
    try { const r = await this.getMedicalForm(); return r.success && !!r.data; } catch { return false; }
  }

  // ── Patient ───────────────────────────────────────────────────────────────────
  public async getPatientProfile(): Promise<ApiResponse> {
    return this.request("/patient/profile", { timeout: 10000 });
  }
  public async updatePatientProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
    return this.request("/patient/profile", { method: "PUT", body: JSON.stringify(updates), timeout: 10000 });
  }
  public async getPatientHistory(): Promise<ApiResponse> {
    return this.request("/patient/history", { timeout: 10000 });
  }

  /** Unified timeline: documents + lab reports + form events, newest first */
  public async getTimeline(): Promise<ApiResponse> {
    return this.request("/patient/timeline", { timeout: 15000 });
  }

  // ── Documents (OCR processed) — pulled directly from ProcessedDocuments ───────
  public async getMyDocuments(): Promise<ApiResponse> {
    return this.request("/patient/my-documents", { timeout: 15000 });
  }
  public async getUploadCount(): Promise<ApiResponse> {
    return this.request("/patient/upload-count", { timeout: 10000 });
  }

  // ── Lab Reports (separate MedicalReport collection) ───────────────────────────
  public async getMyReports(): Promise<ApiResponse> {
    return this.request("/reports/my-reports", { timeout: 15000 });
  }
  public async getReportsCount(): Promise<ApiResponse> {
    return this.request("/reports/count", { timeout: 10000 });
  }
  public async deleteReport(reportId: string): Promise<ApiResponse> {
    return this.request(`/reports/${reportId}`, { method: 'DELETE', timeout: 10000 });
  }

  // ── Doctor view history ───────────────────────────────────────────────────────
  public async getViewHistory(): Promise<ApiResponse> {
    return this.request("/patient/view-history", { timeout: 10000 });
  }

  // ── Summaries ─────────────────────────────────────────────────────────────────
  public async getPatientSummary(): Promise<ApiResponse> {
    return this.request("/patient/summary", { timeout: 15000 });
  }
  public async getCardiologySummary(): Promise<ApiResponse> {
    return this.request("/patient/summary/cardiology", { timeout: 15000 });
  }
  public async getOrthopedicSummary(): Promise<ApiResponse> {
    return this.request("/patient/summary/orthopedic", { timeout: 15000 });
  }
  public async getMySLMSummary(): Promise<ApiResponse> {
    return this.request("/patient/slm-summary", { timeout: 120000 });
  }
  public async getAllSummaries(): Promise<ApiResponse> {
    return this.request("/patient/all-summaries", { timeout: 30000 });
  }
  public async refreshAllSummaries(): Promise<ApiResponse> {
    return this.request("/patient/refresh-summaries", { method: "POST", timeout: 120000 });
  }

  // ── QR ────────────────────────────────────────────────────────────────────────
  public async refreshQRCode(): Promise<ApiResponse> {
    return this.request("/patient/refresh-qr", { method: "POST", timeout: 15000 });
  }
  public async generateSpecialtyQR(specialty: 'general' | 'cardiology' | 'orthopedic'): Promise<ApiResponse> {
    return this.request(`/patient/qr/${specialty}`, { method: "POST", timeout: 30000 });
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  public async getPatientNotifications(): Promise<ApiResponse> {
    return this.request("/patient/notifications", { timeout: 10000 });
  }
  public async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/patient/notifications/${notificationId}/read`, { method: "PUT", timeout: 10000 });
  }

  // ── Doctor ────────────────────────────────────────────────────────────────────
  public async getDoctorProfile(): Promise<ApiResponse> {
    return this.request("/doctor/profile", { timeout: 10000 });
  }

  public async updateDoctorProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
    return this.request("/doctor/profile/update", { method: "PUT", body: JSON.stringify(updates), timeout: 10000 });
  }

  public async searchPatient(query: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
  }

  public async getPatientByQR(qrData: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/qr/${encodeURIComponent(qrData)}`, { timeout: 10000 });
  }

  public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/${patientId}/summary`, { timeout: 30000 });
  }

  public async getPatientCardiologySummary(patientId: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/${patientId}/cardiology-summary`, { timeout: 30000 });
  }

  public async getPatientOrthopedicSummary(patientId: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/${patientId}/orthopedic-summary`, { timeout: 30000 });
  }

  public async getPatientAllSummaries(patientId: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/${patientId}/all-summaries`, { timeout: 30000 });
  }

  public async refreshPatientSummaries(patientId: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/${patientId}/refresh-summaries`, { method: "POST", timeout: 120000 });
  }

  public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/${patientId}/timeline`, { timeout: 10000 });
  }

  public async getMyPatients(): Promise<ApiResponse> {
    return this.request("/doctor/my-patients", { timeout: 10000 });
  }

  public async getDoctorDashboardStats(): Promise<ApiResponse> {
    return this.request("/doctor/dashboard/stats", { timeout: 10000 });
  }

  // Enhanced stats with patient list
  public async getDoctorEnhancedStats(): Promise<ApiResponse> {
    return this.request("/doctor/dashboard/stats/enhanced", { timeout: 10000 });
  }

  // Record when a doctor views a patient (for analytics)
  public async recordPatientView(patientId: string, patientName: string, patientUniqueId: string): Promise<ApiResponse> {
    return this.request("/doctor/record-patient-view", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        patientName,
        patientUniqueId,
      }),
      timeout: 10000,
    });
  }

  public async getDoctorSchedule(): Promise<ApiResponse> {
    return this.request("/doctor/dashboard/schedule", { timeout: 10000 });
  }

  public async getDoctorActivity(): Promise<ApiResponse> {
    return this.request("/doctor/dashboard/activity", { timeout: 10000 });
  }

  public async getPatientSLMSummaryDoctor(patientId: string): Promise<ApiResponse> {
    return this.request(`/doctor/patient/${patientId}/slm-summary`, { timeout: 120000 });
  }

  // ── Upload helpers ────────────────────────────────────────────────────────────
  private async _upload(url: string, fieldName: string, file: FileUpload, extraFields?: Record<string, string>): Promise<ApiResponse> {
    const token = await this.getToken();
    if (!token) throw new Error('No authentication token');
    const formData = new FormData();
    formData.append(fieldName, { uri: file.uri, type: file.type || 'application/octet-stream', name: file.name } as any);
    if (extraFields) Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(url, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData, signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid server response'); }
      if (!response.ok) throw new Error(data.message || `Upload failed ${response.status}`);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') throw new Error('Upload timeout. Try a smaller file.');
      throw error;
    }
  }

  /** Upload medical document → OCR + NLP → summary */
  public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
    return this._upload(
      `${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`,
      isMultiple ? 'documents' : 'document',
      file
    );
  }

  /** Upload lab report (KFT/LFT/CBC) → stored only, no OCR */
  public async uploadReport(file: FileUpload, category?: string): Promise<ApiResponse> {
    return this._upload(
      `${API_BASE_URL}/upload/report/single`,
      'report',
      file,
      category ? { category } : undefined
    );
  }

  public async checkUploadStatus(fileId: string): Promise<ApiResponse> {
    return this.request(`/upload/status/${fileId}`, { timeout: 10000 });
  }
  public async getMyUploads(): Promise<ApiResponse> {
    return this.request('/upload/my-uploads', { timeout: 10000 });
  }
}

export default new ApiService();