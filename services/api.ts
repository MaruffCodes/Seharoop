import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.6:5000/api";

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
};

class ApiService {
  addMedicalRecord(patientId: string, newRecord: { date: string; description: string; type: string; }) {
    throw new Error('Method not implemented.');
  }
  public token: string | null = null;

  public async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem("userToken");
    }
    return this.token;
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = await this.getToken();

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    };

    if (token) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      return data as T;
    } catch (error: any) {
      console.error("API request error:", error.message || error);
      throw new Error(error.message || "An unknown error occurred");
    }
  }

  // Auth methods
  public async loginPatient(email: string, password: string): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/login/patient", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  public async loginDoctor(email: string, password: string): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/login/doctor", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  public async logout(): Promise<ApiResponse> {
  return this.request<ApiResponse>("/auth/logout", {
    method: "POST",
  });
}
  public async registerPatient(
    name: string,
    email: string,
    password: string
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>("/auth/register/patient", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Medical form methods
  public async getMedicalForm(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/medicalform");
  }

  // Patient methods
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

  public async getPatientHistory(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/history");
  }

  public async getPatientSummary(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/patient/summary");
  }

  // Doctor methods
  public async getDoctorProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/doctor/profile");
  }

  public async searchPatient(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}`);
  }

  public async getPatientSummaryDoctor(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/summary`);
  }

  public async getPatientTimeline(patientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/doctor/patient/${patientId}/timeline`);
  }

  // Upload methods
  public async uploadFile(file: FileUpload, isMultiple = false): Promise<ApiResponse> {
    const token = await this.getToken();
    const formData = new FormData();

    formData.append(isMultiple ? "documents" : "document", {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as unknown as Blob); // React Native FormData requires `as unknown as Blob`

    try {
      const response = await fetch(
        `${API_BASE_URL}/upload/${isMultiple ? "multiple" : "single"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      return data as ApiResponse;
    } catch (error: any) {
      console.error("File upload error:", error.message || error);
      throw new Error(error.message || "Failed to upload file");
    }
  }
}

export default new ApiService();