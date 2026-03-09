import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Define user data interface for better type safety
interface UserData {
  id?: string;
  name?: string;
  email?: string;
  patientId?: string;
  doctorId?: string;
  bloodGroup?: string;
  hasMedicalForm?: boolean;
  profileCompleted?: boolean;
  [key: string]: any;
}

// Define the shape of the context value
interface AuthContextType {
  isLoggedIn: boolean;
  userRole: 'patient' | 'doctor' | null;
  userData: UserData | null;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (token: string, role: 'patient' | 'doctor', userData?: UserData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  completeFirstLogin: () => Promise<void>;
  updateUserData: (newData: Partial<UserData>) => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

// Define props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'seharoop_token',
  USER_ROLE: 'seharoop_user_role',
  USER_DATA: 'seharoop_user_data',
  FIRST_LOGIN: 'seharoop_first_login',
  LAST_ACTIVE: 'seharoop_last_active',
} as const;

// Session timeout in milliseconds (30 days)
const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  // Check if session is expired
  const isSessionExpired = useCallback(async (): Promise<boolean> => {
    try {
      const lastActive = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
      if (!lastActive) return true;

      const now = Date.now();
      const lastActiveTime = parseInt(lastActive);
      return now - lastActiveTime > SESSION_TIMEOUT;
    } catch (error) {
      console.error('Session check error:', error);
      return true;
    }
  }, []);

  // Update last active timestamp
  const updateLastActive = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
    } catch (error) {
      console.error('Update last active error:', error);
    }
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [token, role, userDataString, firstLoginFlag, lastActive] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE)
      ]);

      // Check if session is expired
      if (token && role) {
        const expired = await isSessionExpired();
        if (expired) {
          console.log('Session expired, logging out');
          await logout();
          return;
        }
      }

      if (token && role) {
        setIsLoggedIn(true);
        setUserRole(role as 'patient' | 'doctor');
        setUserData(userDataString ? JSON.parse(userDataString) : null);
        setIsFirstLogin(firstLoginFlag === 'true');

        // Update last active timestamp
        await updateLastActive();
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
        setUserData(null);
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoggedIn(false);
      setUserRole(null);
      setUserData(null);
      setIsFirstLogin(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSessionExpired, updateLastActive]);

  // Refresh auth state
  const refreshAuthState = useCallback(async (): Promise<void> => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  // Login function
  const login = async (token: string, role: 'patient' | 'doctor', userData?: UserData): Promise<void> => {
    try {
      setIsLoading(true);

      // Validate inputs
      if (!token || !role) {
        throw new Error('Invalid login credentials');
      }

      // Store authentication data
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      await updateLastActive();

      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        setUserData(userData);
      }

      // Check if this is patient's first login (no medical form data)
      if (role === 'patient') {
        const hasMedicalForm = userData?.hasMedicalForm || false;
        const isFirstLoginValue = !hasMedicalForm;
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, isFirstLoginValue ? 'true' : 'false');
        setIsFirstLogin(isFirstLoginValue);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');
        setIsFirstLogin(false);
      }

      setIsLoggedIn(true);
      setUserRole(role);

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Handle navigation based on role and first login
      if (role === 'patient') {
        const hasMedicalForm = userData?.hasMedicalForm || false;
        if (!hasMedicalForm) {
          router.replace('/(tabs)/patient-medicalForm');
        } else {
          router.replace('/(tabs)/patient-dashboard');
        }
      } else if (role === 'doctor') {
        router.replace('/(tabs)/doctor-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Clear all stored data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.FIRST_LOGIN,
        STORAGE_KEYS.LAST_ACTIVE,
      ]);

      // Reset state
      setIsLoggedIn(false);
      setUserRole(null);
      setUserData(null);
      setIsFirstLogin(false);

      // Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Complete first login (after medical form submission)
  const completeFirstLogin = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Update storage
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');

      // Update user data to reflect medical form completion
      if (userData) {
        const updatedUserData = { ...userData, hasMedicalForm: true };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
      }

      setIsFirstLogin(false);

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to dashboard
      router.replace('/(tabs)/patient-dashboard');
    } catch (error) {
      console.error('Complete first login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data
  const updateUserData = async (newData: Partial<UserData>): Promise<void> => {
    try {
      if (!userData) return;

      const updatedData = { ...userData, ...newData };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
      setUserData(updatedData);
    } catch (error) {
      console.error('Update user data error:', error);
      throw error;
    }
  };

  // Auto-refresh token periodically (optional)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLoggedIn) {
      // Update last active every minute
      intervalId = setInterval(async () => {
        await updateLastActive();
      }, 60000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoggedIn, updateLastActive]);

  // Check auth status on mount and when app comes to foreground
  useEffect(() => {
    checkAuthStatus();

    // You can add AppState listener here for foreground/background detection
    // This would require importing AppState from react-native

  }, [checkAuthStatus]);

  const value: AuthContextType = {
    isLoggedIn,
    userRole,
    userData,
    isLoading,
    isFirstLogin,
    login,
    logout,
    checkAuthStatus,
    completeFirstLogin,
    updateUserData,
    refreshAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hook to check if user is authenticated and redirect if not
export const useRequireAuth = (redirectTo: string = '/login'): boolean => {
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace(redirectTo);
    }
  }, [isLoggedIn, isLoading, redirectTo]);

  return isLoggedIn;
};

// Helper hook for patient-only routes
export const useRequirePatient = (redirectTo: string = '/login'): boolean => {
  const { isLoggedIn, userRole, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.replace(redirectTo);
      } else if (userRole !== 'patient') {
        router.replace('/(tabs)/doctor-dashboard');
      }
    }
  }, [isLoggedIn, userRole, isLoading, redirectTo]);

  return isLoggedIn && userRole === 'patient';
};

// Helper hook for doctor-only routes
export const useRequireDoctor = (redirectTo: string = '/login'): boolean => {
  const { isLoggedIn, userRole, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.replace(redirectTo);
      } else if (userRole !== 'doctor') {
        router.replace('/(tabs)/patient-dashboard');
      }
    }
  }, [isLoggedIn, userRole, isLoading, redirectTo]);

  return isLoggedIn && userRole === 'doctor';
};