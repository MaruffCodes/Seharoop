import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';

const API_BASE_URL = "http://192.168.1.4:5001/api";

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

  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    try {
      let token = null;
      if (requiresAuth) {
        token = await this.getToken();

        // If no token, redirect to login
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

      console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint}`);

      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      console.log(`📡 Response status: ${response.status}`);

      // Handle unauthorized response
      if (response.status === 401) {
        // Don't redirect for login attempts
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

      // Try to parse response as JSON
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

      // Handle abort errors (timeout)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Server is not responding.');
      }

      // Handle fetch errors (network issues)
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
    try {
      console.log('🔐 Attempting patient login...');
      const response = await this.request<ApiResponse>("/auth/login/patient", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        requiresAuth: false,
      });

      console.log('✅ Login response received:', response);

      if (response.success && response.data) {
        // Store token
        this.token = response.data.token;
        await AsyncStorage.setItem("seharoop_token", response.data.token);
        await AsyncStorage.setItem("seharoop_user_role", "patient");
        if (response.data.user) {
          await AsyncStorage.setItem("seharoop_user_data", JSON.stringify(response.data.user));
        }
      }

      return response;
    } catch (error: any) {
      console.error("❌ Login error:", error.message);
      throw error;
    }
  }

  public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
    try {
      console.log('🔐 Attempting doctor login...');
      const response = await this.request<ApiResponse>("/auth/login/doctor", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        requiresAuth: false,
      });

      console.log('✅ Login response received:', response);

      if (response.success && response.data) {
        this.token = response.data.token;
        await AsyncStorage.setItem("seharoop_token", response.data.token);
        await AsyncStorage.setItem("seharoop_user_role", "doctor");
        if (response.data.user) {
          await AsyncStorage.setItem("seharoop_user_data", JSON.stringify(response.data.user));
        }
      }

      return response;
    } catch (error: any) {
      console.error("❌ Login error:", error.message);
      throw error;
    }
  }

  public async registerPatient(
    name: string,
    email: string,
    password: string
  ): Promise<ApiResponse> {
    try {
      console.log('📝 Attempting patient registration...');
      const response = await this.request<ApiResponse>("/auth/register/patient", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
        requiresAuth: false,
      });

      if (response.success && response.data) {
        this.token = response.data.token;
        await AsyncStorage.setItem("seharoop_token", response.data.token);
        await AsyncStorage.setItem("seharoop_user_role", "patient");
        if (response.data.user) {
          await AsyncStorage.setItem("seharoop_user_data", JSON.stringify({
            ...response.data.user,
            hasMedicalForm: false
          }));
        }
      }

      return response;
    } catch (error: any) {
      console.error("❌ Registration error:", error.message);
      throw error;
    }
  }

  public async registerDoctor(
    name: string,
    email: string,
    password: string,
    specialization: string,
    qualification?: string,
    experience?: number
  ): Promise<ApiResponse> {
    try {
      console.log('📝 Attempting doctor registration...');
      const response = await this.request<ApiResponse>("/auth/register/doctor", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          specialization,
          qualification,
          experience,
        }),
        requiresAuth: false,
      });

      if (response.success && response.data) {
        this.token = response.data.token;
        await AsyncStorage.setItem("seharoop_token", response.data.token);
        await AsyncStorage.setItem("seharoop_user_role", "doctor");
        if (response.data.user) {
          await AsyncStorage.setItem("seharoop_user_data", JSON.stringify(response.data.user));
        }
      }

      return response;
    } catch (error: any) {
      console.error("❌ Registration error:", error.message);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      // Try to call logout endpoint (optional - it might fail if not implemented)
      try {
        await this.request("/auth/logout", {
          method: "POST",
          requiresAuth: true
        });
        console.log('✅ Logout API call successful');
      } catch (error) {
        // Ignore logout endpoint errors - we'll still clear local storage
        console.log('⚠️ Logout endpoint not available or error:', (error as Error).message);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local storage regardless of server response
      this.token = null;
      await AsyncStorage.multiRemove([
        "seharoop_token",
        "seharoop_user_role",
        "seharoop_user_data",
        "seharoop_first_login",
      ]);
      console.log('✅ Local storage cleared, redirecting to login');
      router.replace('/login');
    }
  }

  // ==================== MEDICAL FORM METHODS ====================
  public async submitMedicalForm(formData: any): Promise<ApiResponse> {
    return this.request<ApiResponse>("/medical-form/submit", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  }

  public async getMedicalForm(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/medical-form");
  }

  public async checkMedicalFormStatus(): Promise<boolean> {
    try {
      const response = await this.getMedicalForm();
      return response.success && !!response.data;
    } catch (error) {
      return false;
    }
  }

  // ==================== PATIENT METHODS ====================
  public async getPatientProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/profile");
  }

  public async updatePatientProfile(
    updates: Record<string, unknown>
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  public async getPatientHistory(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/history");
  }

  public async getPatientSummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/summary");
  }

  public async refreshQRCode(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/refresh-qr", {
      method: "POST",
    });
  }

  // Patient Specialty Summaries (for patient's own view)
  public async getCardiologySummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/summary/cardiology");
  }

  public async getOrthopedicSummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/summary/orthopedic");
  }

  // Generate QR for specific specialty (for patient)
  public async generateSpecialtyQR(specialty: 'general' | 'cardiology' | 'orthopedic'): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/patient/qr/${specialty}`, {
      method: "POST",
    });
  }

  // ==================== DOCTOR METHODS ====================
  public async getDoctorProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/profile");
  }

  public async searchPatient(query: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/search?q=${encodeURIComponent(query)}`);
  }

  public async getPatientByQR(qrData: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/qr/${encodeURIComponent(qrData)}`);
  }

  // Doctor viewing patient summaries
  public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/summary`);
  }

  public async getPatientCardiologySummary(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/cardiology-summary`);
  }

  public async getPatientOrthopedicSummary(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/orthopedic-summary`);
  }

  public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/timeline`);
  }

  public async getMyPatients(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/patients");
  }

  // ==================== UPLOAD METHODS ====================
  public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
    const token = await this.getToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    const fileData = {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name,
    };

    formData.append('document', fileData as any);

    console.log('📤 Uploading to:', `${API_BASE_URL}/upload/single`);
    console.log('📤 With token:', token.substring(0, 20) + '...');

    try {
      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const responseText = await response.text();
      console.log('📡 Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse JSON:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Upload error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  // ==================== UPLOAD STATUS METHODS ====================
  public async checkUploadStatus(fileId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/upload/status/${fileId}`);
  }

  public async getMyUploads(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/upload/my-uploads');
  }

  // Get AI-generated SLM summary for patient
  // Get patient SLM summary for doctor
  public async getPatientSLMSummaryDoctor(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/slm-summary`);
  }

  // Get patient's own SLM summary (for patient view)
  // In your ApiService class, add a special method for SLM with longer timeout
  public async getMySLMSummary(): Promise<ApiResponse> {
    // Use a longer timeout (60 seconds) for SLM generation
    return this.request<ApiResponse>("/patient/slm-summary", {
      method: "GET",
      // You'll need to modify your request method to accept custom timeout
      // For now, we'll handle it in the backend
    });
  }
}

export default new ApiService();