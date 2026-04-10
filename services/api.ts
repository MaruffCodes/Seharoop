import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';

// DO NOT hardcode IPs in production. Use environment variables.
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || "http://192.168.1.5:5001";
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
}

type RequestOptions = RequestInit & {
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeout?: number;
};

class ApiService {
  private token: string | null = null;

  constructor() {
    this.initToken();
  }

  private async initToken(): Promise<void> {
    try {
      this.token = await AsyncStorage.getItem("seharoop_token");
    } catch (error) {
      console.error("Failed to initialize token:", error);
    }
  }

  public async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem("seharoop_token");
    }
    return this.token;
  }

  // Instantly injects token post-login to avoid AsyncStorage race conditions
  public setToken(token: string): void {
    this.token = token;
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, timeout = 10000, ...fetchOptions } = options;

    try {
      let token = null;
      if (requiresAuth) {
        token = await this.getToken();

        if (!token) {
          router.replace('/login');
          throw new Error('No authentication token available');
        }
      }

      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        ...fetchOptions,
      };

      if (token) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }

      console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint} (timeout: ${timeout}ms)`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      console.log(`📡 Response status: ${response.status}`);

      if (response.status === 401) {
        if (endpoint.includes('/login')) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Invalid email or password');
        }

        await AsyncStorage.multiRemove([
          "seharoop_token",
          "seharoop_user_role",
          "seharoop_user_data",
          "seharoop_first_login",
        ]);
        this.token = null;
        router.replace('/login');
        throw new Error('Session expired. Please login again.');
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (error: any) {
      console.error("❌ API request error:", error.message || error);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms. Server is not responding.`);
      }

      if (error.message === 'Network request failed' ||
        error.message.includes('Network') ||
        error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check:\n' +
          '1. Backend server is running (cd backend && npm run dev)\n' +
          '2. IP address is correct\n' +
          '3. Device is on same network\n' +
          '4. Firewall is not blocking the connection');
      }

      throw error;
    }
  }

  // ==================== AUTH METHODS ====================
  public async loginPatient(email: string, password: string): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/login/patient", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
      timeout: 10000,
    });
  }

  public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/login/doctor", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
      timeout: 10000,
    });
  }

  public async registerPatient(name: string, email: string, password: string): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/register/patient", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      requiresAuth: false,
      timeout: 10000,
    });
  }

  public async registerDoctor(
    name: string,
    email: string,
    password: string,
    specialization: string,
    qualification?: string,
    experience?: number
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/register/doctor", {
      method: "POST",
      body: JSON.stringify({ name, email, password, specialization, qualification, experience }),
      requiresAuth: false,
      timeout: 10000,
    });
  }

  public async logout(): Promise<void> {
    try {
      try {
        await this.request("/auth/logout", { method: "POST", requiresAuth: true, timeout: 5000 });
        console.log('✅ Logout API call successful');
      } catch (error) {
        console.log('⚠️ Logout endpoint not available:', (error as Error).message);
      }
    } finally {
      this.token = null;
      await AsyncStorage.multiRemove([
        "seharoop_token",
        "seharoop_user_role",
        "seharoop_user_data",
        "seharoop_first_login",
      ]);
      router.replace('/login');
    }
  }

  // ==================== MEDICAL FORM METHODS ====================
  public async submitMedicalForm(formData: any): Promise<ApiResponse> {
    return this.request<ApiResponse>("/medical-form/submit", {
      method: "POST",
      body: JSON.stringify(formData),
      timeout: 15000,
    });
  }

  public async getMedicalForm(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/medical-form", { timeout: 10000 });
  }

  public async checkMedicalFormStatus(): Promise<boolean> {
    try {
      const response = await this.getMedicalForm();
      return response.success && !!response.data;
    } catch {
      return false;
    }
  }

  // ==================== PATIENT METHODS ====================
  public async getPatientProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/profile", { timeout: 10000 });
  }

  public async updatePatientProfile(updates: Record<string, unknown>): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
      timeout: 10000,
    });
  }

  public async getPatientHistory(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/history", { timeout: 10000 });
  }

  // Patient's own summary endpoints (for patient viewing their own data)
  public async getPatientSummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/summary", { timeout: 15000 });
  }

  public async getCardiologySummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/summary/cardiology", { timeout: 15000 });
  }

  public async getOrthopedicSummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/summary/orthopedic", { timeout: 15000 });
  }

  public async getMySLMSummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/slm-summary", {
      method: "GET",
      timeout: 120000,
    });
  }

  // QR Code methods
  public async refreshQRCode(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/refresh-qr", {
      method: "POST",
      timeout: 15000,
    });
  }

  public async generateSpecialtyQR(specialty: 'general' | 'cardiology' | 'orthopedic'): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/patient/qr/${specialty}`, {
      method: "POST",
      timeout: 30000,
    });
  }

  // Batch summary methods
  public async getAllSummaries(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/all-summaries", { timeout: 30000 });
  }

  public async refreshAllSummaries(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/refresh-summaries", {
      method: "POST",
      timeout: 120000,
    });
  }

  // ==================== NOTIFICATION METHODS ====================
  public async getPatientNotifications(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/notifications", { timeout: 10000 });
  }

  public async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/patient/notifications/${notificationId}/read`, {
      method: "PUT",
      timeout: 10000,
    });
  }

  // ==================== DOCTOR METHODS ====================
  public async getDoctorProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/profile", { timeout: 10000 });
  }

  public async searchPatient(query: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
  }

  public async getPatientByQR(qrData: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/qr/${encodeURIComponent(qrData)}`, { timeout: 10000 });
  }

  // Doctor viewing patient summaries (FULL summaries, NOT QR data)
  public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/summary`, {
      timeout: 30000
    });
  }

  public async getPatientCardiologySummary(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/cardiology-summary`, {
      timeout: 30000
    });
  }

  public async getPatientOrthopedicSummary(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/orthopedic-summary`, {
      timeout: 30000
    });
  }

  public async getPatientAllSummaries(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/all-summaries`, {
      timeout: 30000
    });
  }

  public async refreshPatientSummaries(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/refresh-summaries`, {
      method: "POST",
      timeout: 120000,
    });
  }

  public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/timeline`, { timeout: 10000 });
  }

  public async getMyPatients(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/patients", { timeout: 10000 });
  }

  // Missing Doctor Dashboard Endpoints
  public async getDoctorDashboardStats(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/dashboard/stats", { timeout: 10000 });
  }

  public async getDoctorSchedule(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/dashboard/schedule", { timeout: 10000 });
  }

  public async getDoctorActivity(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/dashboard/activity", { timeout: 10000 });
  }

  // Doctor SLM methods
  public async getPatientSLMSummaryDoctor(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/slm-summary`, {
      timeout: 120000,
    });
  }

  // ==================== UPLOAD METHODS ====================
  public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
    const token = await this.getToken();
    if (!token) throw new Error('No authentication token available');

    const formData = new FormData();

    const fileData = {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name,
    };

    console.log('📤 Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      uri: file.uri,
      isMultiple
    });

    formData.append(isMultiple ? 'documents' : 'document', fileData as any);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      console.log(`📤 Uploading to: ${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`);

      const response = await fetch(`${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      console.log('📡 Upload response status:', response.status);

      const responseText = await response.text();
      console.log('📡 Upload response text:', responseText.substring(0, 200) + '...');

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse upload response as JSON:', responseText.substring(0, 500));
        throw new Error('Invalid server response - not JSON');
      }

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      console.log('✅ Upload successful:', data);
      return data;

    } catch (error: any) {
      console.error('❌ Upload error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });

      if (error.name === 'AbortError') {
        throw new Error('Upload timeout after 60 seconds. Please try again with a smaller file.');
      }

      if (error.message === 'Network request failed' ||
        error.message.includes('Network') ||
        error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check:\n' +
          '1. Backend server is running (cd backend && npm run dev)\n' +
          '2. IP address is correct (' + API_BASE_URL + ')\n' +
          '3. Device is on same network\n' +
          '4. Firewall is not blocking the connection');
      }

      throw error;
    }
  }

  public async checkUploadStatus(fileId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/upload/status/${fileId}`, { timeout: 10000 });
  }

  public async getMyUploads(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/upload/my-uploads', { timeout: 10000 });
  }
}

export default new ApiService();