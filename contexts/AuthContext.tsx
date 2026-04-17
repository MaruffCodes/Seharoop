// import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { router } from 'expo-router';

// // Define user data interface for better type safety
// interface UserData {
//   id?: string;
//   name?: string;
//   email?: string;
//   patientId?: string;
//   doctorId?: string;
//   bloodGroup?: string;
//   hasMedicalForm?: boolean;
//   profileCompleted?: boolean;
//   [key: string]: any;
// }

// // Define the shape of the context value
// interface AuthContextType {
//   isLoggedIn: boolean;
//   userRole: 'patient' | 'doctor' | null;
//   userData: UserData | null;
//   isLoading: boolean;
//   isFirstLogin: boolean;
//   login: (token: string, role: 'patient' | 'doctor', userData?: UserData) => Promise<void>;
//   logout: () => Promise<void>;
//   checkAuthStatus: () => Promise<void>;
//   completeFirstLogin: () => Promise<void>;
//   updateUserData: (newData: Partial<UserData>) => Promise<void>;
//   refreshAuthState: () => Promise<void>;
// }

// // Define props for the AuthProvider component
// interface AuthProviderProps {
//   children: ReactNode;
// }

// // Storage keys
// const STORAGE_KEYS = {
//   TOKEN: 'seharoop_token',
//   USER_ROLE: 'seharoop_user_role',
//   USER_DATA: 'seharoop_user_data',
//   FIRST_LOGIN: 'seharoop_first_login',
//   LAST_ACTIVE: 'seharoop_last_active',
// } as const;

// // Session timeout in milliseconds (30 days)
// const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

// // Create the context with a default value
// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: AuthProviderProps) {
//   const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
//   const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

//   // Check if session is expired
//   const isSessionExpired = useCallback(async (): Promise<boolean> => {
//     try {
//       const lastActive = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
//       if (!lastActive) return true;

//       const now = Date.now();
//       const lastActiveTime = parseInt(lastActive);
//       return now - lastActiveTime > SESSION_TIMEOUT;
//     } catch (error) {
//       console.error('Session check error:', error);
//       return true;
//     }
//   }, []);

//   // Update last active timestamp
//   const updateLastActive = useCallback(async (): Promise<void> => {
//     try {
//       await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
//     } catch (error) {
//       console.error('Update last active error:', error);
//     }
//   }, []);

//   // Check authentication status
//   const checkAuthStatus = useCallback(async (): Promise<void> => {
//     try {
//       setIsLoading(true);

//       const [token, role, userDataString, firstLoginFlag, lastActive] = await Promise.all([
//         AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
//         AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN),
//         AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE)
//       ]);

//       // Check if session is expired
//       if (token && role) {
//         const expired = await isSessionExpired();
//         if (expired) {
//           console.log('Session expired, logging out');
//           await logout();
//           return;
//         }
//       }

//       if (token && role) {
//         setIsLoggedIn(true);
//         setUserRole(role as 'patient' | 'doctor');
//         setUserData(userDataString ? JSON.parse(userDataString) : null);
//         setIsFirstLogin(firstLoginFlag === 'true');

//         // Update last active timestamp
//         await updateLastActive();
//       } else {
//         setIsLoggedIn(false);
//         setUserRole(null);
//         setUserData(null);
//         setIsFirstLogin(false);
//       }
//     } catch (error) {
//       console.error('Auth check error:', error);
//       setIsLoggedIn(false);
//       setUserRole(null);
//       setUserData(null);
//       setIsFirstLogin(false);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [isSessionExpired, updateLastActive]);

//   // Refresh auth state
//   const refreshAuthState = useCallback(async (): Promise<void> => {
//     await checkAuthStatus();
//   }, [checkAuthStatus]);

//   // Login function
//   const login = async (token: string, role: 'patient' | 'doctor', userData?: UserData): Promise<void> => {
//     try {
//       setIsLoading(true);

//       // Validate inputs
//       if (!token || !role) {
//         throw new Error('Invalid login credentials');
//       }

//       // Store authentication data
//       await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
//       await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
//       await updateLastActive();

//       if (userData) {
//         await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
//         setUserData(userData);
//       }

//       // Check if this is patient's first login (no medical form data)
//       if (role === 'patient') {
//         const hasMedicalForm = userData?.hasMedicalForm || false;
//         const isFirstLoginValue = !hasMedicalForm;
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, isFirstLoginValue ? 'true' : 'false');
//         setIsFirstLogin(isFirstLoginValue);
//       } else {
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');
//         setIsFirstLogin(false);
//       }

//       setIsLoggedIn(true);
//       setUserRole(role);

//       // Small delay to ensure state is updated
//       await new Promise(resolve => setTimeout(resolve, 100));

//       // Handle navigation based on role and first login
//       if (role === 'patient') {
//         const hasMedicalForm = userData?.hasMedicalForm || false;
//         if (!hasMedicalForm) {
//           router.replace('/(tabs)/patient-medicalForm');
//         } else {
//           router.replace('/(tabs)/patient-dashboard');
//         }
//       } else if (role === 'doctor') {
//         router.replace('/(tabs)/doctor-dashboard');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Logout function
//   const logout = async (): Promise<void> => {
//     try {
//       setIsLoading(true);

//       // Clear all stored data
//       await AsyncStorage.multiRemove([
//         STORAGE_KEYS.TOKEN,
//         STORAGE_KEYS.USER_ROLE,
//         STORAGE_KEYS.USER_DATA,
//         STORAGE_KEYS.FIRST_LOGIN,
//         STORAGE_KEYS.LAST_ACTIVE,
//       ]);

//       // Reset state
//       setIsLoggedIn(false);
//       setUserRole(null);
//       setUserData(null);
//       setIsFirstLogin(false);

//       // Navigate to login
//       router.replace('/login');
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Complete first login (after medical form submission)
//   const completeFirstLogin = async (): Promise<void> => {
//     try {
//       setIsLoading(true);

//       // Update storage
//       await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');

//       // Update user data to reflect medical form completion
//       if (userData) {
//         const updatedUserData = { ...userData, hasMedicalForm: true };
//         await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
//         setUserData(updatedUserData);
//       }

//       setIsFirstLogin(false);

//       // Small delay to ensure state is updated
//       await new Promise(resolve => setTimeout(resolve, 100));

//       // Navigate to dashboard
//       router.replace('/(tabs)/patient-dashboard');
//     } catch (error) {
//       console.error('Complete first login error:', error);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Update user data
//   const updateUserData = async (newData: Partial<UserData>): Promise<void> => {
//     try {
//       if (!userData) return;

//       const updatedData = { ...userData, ...newData };
//       await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
//       setUserData(updatedData);
//     } catch (error) {
//       console.error('Update user data error:', error);
//       throw error;
//     }
//   };

//   // Auto-refresh token periodically (optional)
//   useEffect(() => {
//     let intervalId: NodeJS.Timeout;

//     if (isLoggedIn) {
//       // Update last active every minute
//       intervalId = setInterval(async () => {
//         await updateLastActive();
//       }, 60000);
//     }

//     return () => {
//       if (intervalId) {
//         clearInterval(intervalId);
//       }
//     };
//   }, [isLoggedIn, updateLastActive]);

//   // Check auth status on mount and when app comes to foreground
//   useEffect(() => {
//     checkAuthStatus();

//     // You can add AppState listener here for foreground/background detection
//     // This would require importing AppState from react-native

//   }, [checkAuthStatus]);

//   const value: AuthContextType = {
//     isLoggedIn,
//     userRole,
//     userData,
//     isLoading,
//     isFirstLogin,
//     login,
//     logout,
//     checkAuthStatus,
//     completeFirstLogin,
//     updateUserData,
//     refreshAuthState,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // Custom hook to use auth context
// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// // Helper hook to check if user is authenticated and redirect if not
// export const useRequireAuth = (redirectTo: string = '/login'): boolean => {
//   const { isLoggedIn, isLoading } = useAuth();

//   useEffect(() => {
//     if (!isLoading && !isLoggedIn) {
//       router.replace(redirectTo);
//     }
//   }, [isLoggedIn, isLoading, redirectTo]);

//   return isLoggedIn;
// };

// // Helper hook for patient-only routes
// export const useRequirePatient = (redirectTo: string = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();

//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) {
//         router.replace(redirectTo);
//       } else if (userRole !== 'patient') {
//         router.replace('/(tabs)/doctor-dashboard');
//       }
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);

//   return isLoggedIn && userRole === 'patient';
// };

// // Helper hook for doctor-only routes
// export const useRequireDoctor = (redirectTo: string = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();

//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) {
//         router.replace(redirectTo);
//       } else if (userRole !== 'doctor') {
//         router.replace('/(tabs)/patient-dashboard');
//       }
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);

//   return isLoggedIn && userRole === 'doctor';
// };

//new cla

// import React, {
//   createContext, useContext, useState, useEffect,
//   ReactNode, useCallback, useRef,
// } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { router } from 'expo-router';

// interface UserData {
//   id?: string;
//   name?: string;
//   email?: string;
//   patientId?: string;
//   doctorId?: string;
//   bloodGroup?: string;
//   hasMedicalForm?: boolean;
//   profileCompleted?: boolean;
//   [key: string]: any;
// }

// interface AuthContextType {
//   isLoggedIn: boolean;
//   userRole: 'patient' | 'doctor' | null;
//   userData: UserData | null;
//   isLoading: boolean;
//   isFirstLogin: boolean;
//   login: (token: string, role: 'patient' | 'doctor', userData?: UserData) => Promise<void>;
//   logout: () => Promise<void>;
//   checkAuthStatus: () => Promise<void>;
//   completeFirstLogin: () => Promise<void>;
//   updateUserData: (newData: Partial<UserData>) => Promise<void>;
//   refreshAuthState: () => Promise<void>;
// }

// interface AuthProviderProps { children: ReactNode; }

// const STORAGE_KEYS = {
//   TOKEN: 'seharoop_token',
//   USER_ROLE: 'seharoop_user_role',
//   USER_DATA: 'seharoop_user_data',
//   FIRST_LOGIN: 'seharoop_first_login',
//   LAST_ACTIVE: 'seharoop_last_active',
// } as const;

// // 30 days
// const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: AuthProviderProps) {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);

//   // Prevent state updates after unmount
//   const isMounted = useRef(true);
//   useEffect(() => { return () => { isMounted.current = false; }; }, []);

//   // ── Session helpers ───────────────────────────────────────────────────────
//   const isSessionExpired = async (): Promise<boolean> => {
//     try {
//       const lastActive = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
//       if (!lastActive) return true;
//       return Date.now() - parseInt(lastActive) > SESSION_TIMEOUT;
//     } catch { return true; }
//   };

//   const updateLastActive = async (): Promise<void> => {
//     try { await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString()); } catch { }
//   };

//   // ── clearState helper ─────────────────────────────────────────────────────
//   const clearState = () => {
//     if (!isMounted.current) return;
//     setIsLoggedIn(false);
//     setUserRole(null);
//     setUserData(null);
//     setIsFirstLogin(false);
//   };

//   // ── checkAuthStatus ───────────────────────────────────────────────────────
//   // KEY FIX: no deps so this function reference is stable — it won't cause
//   // the useEffect below to re-run every render.
//   const checkAuthStatus = useCallback(async (): Promise<void> => {
//     try {
//       if (isMounted.current) setIsLoading(true);

//       const [token, role, userDataStr, firstLoginFlag] = await Promise.all([
//         AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
//         AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN),
//       ]);

//       if (!isMounted.current) return;

//       if (token && role) {
//         const expired = await isSessionExpired();
//         if (expired) {
//           await _clearStorage();
//           clearState();
//           return;
//         }

//         setIsLoggedIn(true);
//         setUserRole(role as 'patient' | 'doctor');
//         setUserData(userDataStr ? JSON.parse(userDataStr) : null);
//         setIsFirstLogin(firstLoginFlag === 'true');
//         await updateLastActive();
//       } else {
//         clearState();
//       }
//     } catch (err) {
//       console.error('Auth check error:', err);
//       if (isMounted.current) clearState();
//     } finally {
//       if (isMounted.current) setIsLoading(false);
//     }
//   }, []); // ← empty deps — stable reference, no infinite loops

//   const refreshAuthState = useCallback(async () => {
//     await checkAuthStatus();
//   }, [checkAuthStatus]);

//   // ── _clearStorage ─────────────────────────────────────────────────────────
//   const _clearStorage = async () => {
//     await AsyncStorage.multiRemove([
//       STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER_ROLE,
//       STORAGE_KEYS.USER_DATA, STORAGE_KEYS.FIRST_LOGIN, STORAGE_KEYS.LAST_ACTIVE,
//     ]);
//   };

//   // ── login ─────────────────────────────────────────────────────────────────
//   const login = async (
//     token: string, role: 'patient' | 'doctor', userDataParam?: UserData
//   ): Promise<void> => {
//     try {
//       // Don't set global isLoading here — it causes the dashboard to mount
//       // while we're still setting up state, which triggers all those API calls
//       // before the token is stored, leading to crashes.

//       if (!token || !role) throw new Error('Invalid login credentials');

//       // Write to storage first, then update state
//       const storageOps: Promise<void>[] = [
//         AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
//         AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role),
//         updateLastActive(),
//       ];
//       if (userDataParam) {
//         storageOps.push(AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userDataParam)));
//       }
//       await Promise.all(storageOps);

//       // Determine first-login for patient
//       let firstLogin = false;
//       if (role === 'patient') {
//         firstLogin = !(userDataParam?.hasMedicalForm);
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, firstLogin ? 'true' : 'false');
//       } else {
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');
//       }

//       // Update state — only after storage is committed
//       if (isMounted.current) {
//         setIsLoggedIn(true);
//         setUserRole(role);
//         setUserData(userDataParam ?? null);
//         setIsFirstLogin(firstLogin);
//       }

//       // Navigate — brief tick so React can flush state before navigation
//       await new Promise(r => setTimeout(r, 80));

//       if (role === 'patient') {
//         if (firstLogin) {
//           router.replace('/(tabs)/patient-medicalForm');
//         } else {
//           router.replace('/(tabs)/patient-dashboard');
//         }
//       } else {
//         router.replace('/(tabs)/doctor-dashboard');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       throw error;
//     }
//   };

//   // ── logout ────────────────────────────────────────────────────────────────
//   const logout = async (): Promise<void> => {
//     try {
//       await _clearStorage();
//       clearState();
//       router.replace('/login');
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   };

//   // ── completeFirstLogin ────────────────────────────────────────────────────
//   const completeFirstLogin = async (): Promise<void> => {
//     try {
//       await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');

//       if (userData) {
//         const updated = { ...userData, hasMedicalForm: true };
//         await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
//         if (isMounted.current) setUserData(updated);
//       }

//       if (isMounted.current) setIsFirstLogin(false);

//       await new Promise(r => setTimeout(r, 80));
//       router.replace('/(tabs)/patient-dashboard');
//     } catch (error) {
//       console.error('Complete first login error:', error);
//       throw error;
//     }
//   };

//   // ── updateUserData ────────────────────────────────────────────────────────
//   const updateUserData = async (newData: Partial<UserData>): Promise<void> => {
//     try {
//       if (!userData) return;
//       const updated = { ...userData, ...newData };
//       await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
//       if (isMounted.current) setUserData(updated);
//     } catch (error) {
//       console.error('Update user data error:', error);
//       throw error;
//     }
//   };

//   // ── Periodic last-active update ───────────────────────────────────────────
//   useEffect(() => {
//     if (!isLoggedIn) return;
//     const id = setInterval(updateLastActive, 60_000);
//     return () => clearInterval(id);
//   }, [isLoggedIn]);

//   // ── Initial auth check — runs ONCE on mount ───────────────────────────────
//   useEffect(() => {
//     checkAuthStatus();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // intentionally empty — checkAuthStatus is stable

//   const value: AuthContextType = {
//     isLoggedIn, userRole, userData, isLoading, isFirstLogin,
//     login, logout, checkAuthStatus, completeFirstLogin,
//     updateUserData, refreshAuthState,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within an AuthProvider');
//   return context;
// };

// export const useRequireAuth = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading && !isLoggedIn) router.replace(redirectTo);
//   }, [isLoggedIn, isLoading, redirectTo]);
//   return isLoggedIn;
// };

// export const useRequirePatient = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) router.replace(redirectTo);
//       else if (userRole !== 'patient') router.replace('/(tabs)/doctor-dashboard');
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);
//   return isLoggedIn && userRole === 'patient';
// };

// export const useRequireDoctor = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) router.replace(redirectTo);
//       else if (userRole !== 'doctor') router.replace('/(tabs)/patient-dashboard');
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);
//   return isLoggedIn && userRole === 'doctor';
// };



// import React, {
//   createContext, useContext, useState, useEffect,
//   ReactNode, useCallback, useRef,
// } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { router } from 'expo-router';

// interface UserData {
//   id?: string;
//   name?: string;
//   email?: string;
//   patientId?: string;
//   doctorId?: string;
//   bloodGroup?: string;
//   hasMedicalForm?: boolean;
//   profileCompleted?: boolean;
//   [key: string]: any;
// }

// interface AuthContextType {
//   isLoggedIn: boolean;
//   userRole: 'patient' | 'doctor' | null;
//   userData: UserData | null;
//   isLoading: boolean;
//   isFirstLogin: boolean;
//   login: (token: string, role: 'patient' | 'doctor', userData?: UserData) => Promise<void>;
//   logout: () => Promise<void>;
//   checkAuthStatus: () => Promise<void>;
//   completeFirstLogin: () => Promise<void>;
//   updateUserData: (newData: Partial<UserData>) => Promise<void>;
//   refreshAuthState: () => Promise<void>;
//   refreshUserData: () => Promise<void>;
// }

// interface AuthProviderProps { children: ReactNode; }

// const STORAGE_KEYS = {
//   TOKEN: 'seharoop_token',
//   USER_ROLE: 'seharoop_user_role',
//   USER_DATA: 'seharoop_user_data',
//   FIRST_LOGIN: 'seharoop_first_login',
//   LAST_ACTIVE: 'seharoop_last_active',
// } as const;

// // 30 days
// const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: AuthProviderProps) {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);

//   // Prevent state updates after unmount
//   const isMounted = useRef(true);
//   useEffect(() => { return () => { isMounted.current = false; }; }, []);

//   // ── Session helpers ───────────────────────────────────────────────────────
//   const isSessionExpired = async (): Promise<boolean> => {
//     try {
//       const lastActive = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
//       if (!lastActive) return true;
//       return Date.now() - parseInt(lastActive) > SESSION_TIMEOUT;
//     } catch { return true; }
//   };

//   const updateLastActive = async (): Promise<void> => {
//     try { await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString()); } catch { }
//   };

//   // ── clearState helper ─────────────────────────────────────────────────────
//   const clearState = () => {
//     if (!isMounted.current) return;
//     setIsLoggedIn(false);
//     setUserRole(null);
//     setUserData(null);
//     setIsFirstLogin(false);
//   };

//   // ── checkAuthStatus ───────────────────────────────────────────────────────
//   const checkAuthStatus = useCallback(async (): Promise<void> => {
//     try {
//       if (isMounted.current) setIsLoading(true);

//       const [token, role, userDataStr, firstLoginFlag] = await Promise.all([
//         AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
//         AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN),
//       ]);

//       if (!isMounted.current) return;

//       if (token && role) {
//         const expired = await isSessionExpired();
//         if (expired) {
//           await _clearStorage();
//           clearState();
//           return;
//         }

//         setIsLoggedIn(true);
//         setUserRole(role as 'patient' | 'doctor');
//         setUserData(userDataStr ? JSON.parse(userDataStr) : null);
//         setIsFirstLogin(firstLoginFlag === 'true');
//         await updateLastActive();
//       } else {
//         clearState();
//       }
//     } catch (err) {
//       console.error('Auth check error:', err);
//       if (isMounted.current) clearState();
//     } finally {
//       if (isMounted.current) setIsLoading(false);
//     }
//   }, []);

//   const refreshAuthState = useCallback(async () => {
//     await checkAuthStatus();
//   }, [checkAuthStatus]);

//   // ── refreshUserData ───────────────────────────────────────────────────────
//   const refreshUserData = useCallback(async (): Promise<void> => {
//     try {
//       const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
//       if (userDataStr && isMounted.current) {
//         const parsed = JSON.parse(userDataStr);
//         setUserData(parsed);
//         // Also update the first login flag based on medical form status
//         const firstLoginFlag = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN);
//         setIsFirstLogin(firstLoginFlag === 'true');
//       }
//     } catch (error) {
//       console.error('Refresh user data error:', error);
//     }
//   }, []);

//   // ── _clearStorage ─────────────────────────────────────────────────────────
//   const _clearStorage = async () => {
//     await AsyncStorage.multiRemove([
//       STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER_ROLE,
//       STORAGE_KEYS.USER_DATA, STORAGE_KEYS.FIRST_LOGIN, STORAGE_KEYS.LAST_ACTIVE,
//     ]);
//   };

//   // ── login ─────────────────────────────────────────────────────────────────
//   const login = async (
//     token: string, role: 'patient' | 'doctor', userDataParam?: UserData
//   ): Promise<void> => {
//     try {
//       if (!token || !role) throw new Error('Invalid login credentials');

//       // Clear any existing data first to avoid conflicts
//       await _clearStorage();

//       // Write to storage first, then update state
//       const storageOps: Promise<void>[] = [
//         AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
//         AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role),
//         updateLastActive(),
//       ];

//       if (userDataParam) {
//         storageOps.push(AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userDataParam)));
//       }
//       await Promise.all(storageOps);

//       // Determine first-login for patient
//       let firstLogin = false;
//       if (role === 'patient') {
//         firstLogin = !(userDataParam?.hasMedicalForm);
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, firstLogin ? 'true' : 'false');
//       } else {
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');
//       }

//       // Update state — only after storage is committed
//       if (isMounted.current) {
//         setIsLoggedIn(true);
//         setUserRole(role);
//         setUserData(userDataParam ?? null);
//         setIsFirstLogin(firstLogin);
//       }

//       // Brief tick so React can flush state before navigation
//       await new Promise(r => setTimeout(r, 100));

//       if (role === 'patient') {
//         if (firstLogin) {
//           router.replace('/(tabs)/patient-medicalForm');
//         } else {
//           router.replace('/(tabs)/patient-dashboard');
//         }
//       } else {
//         router.replace('/(tabs)/doctor-dashboard');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       throw error;
//     }
//   };

//   // ── logout ────────────────────────────────────────────────────────────────
//   const logout = async (): Promise<void> => {
//     try {
//       await _clearStorage();
//       clearState();
//       router.replace('/login');
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   };

//   // ── completeFirstLogin ────────────────────────────────────────────────────
//   const completeFirstLogin = async (): Promise<void> => {
//     try {
//       // IMPORTANT: Get the current user data first to preserve identity
//       const currentUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
//       if (!currentUserData) {
//         console.error('No user data found during completeFirstLogin');
//         return;
//       }

//       const parsedUserData = JSON.parse(currentUserData);

//       // Update user data with hasMedicalForm = true, but preserve ALL other fields
//       const updatedUserData = {
//         ...parsedUserData,
//         hasMedicalForm: true,
//         profileCompleted: true
//       };

//       // Update storage - preserve the same token and role
//       await Promise.all([
//         AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData)),
//         AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false'),
//       ]);

//       // Update state
//       if (isMounted.current) {
//         setUserData(updatedUserData);
//         setIsFirstLogin(false);
//       }

//       // Wait a bit for state to settle
//       await new Promise(r => setTimeout(r, 100));

//       // Navigate to dashboard
//       router.replace('/(tabs)/patient-dashboard');
//     } catch (error) {
//       console.error('Complete first login error:', error);
//       throw error;
//     }
//   };

//   // ── updateUserData ────────────────────────────────────────────────────────
//   const updateUserData = async (newData: Partial<UserData>): Promise<void> => {
//     try {
//       // Get current user data first
//       const currentData = userData || (await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA).then(d => d ? JSON.parse(d) : null));
//       if (!currentData) return;

//       const updated = { ...currentData, ...newData };
//       await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
//       if (isMounted.current) setUserData(updated);
//     } catch (error) {
//       console.error('Update user data error:', error);
//       throw error;
//     }
//   };

//   // ── Periodic last-active update ───────────────────────────────────────────
//   useEffect(() => {
//     if (!isLoggedIn) return;
//     const id = setInterval(updateLastActive, 60_000);
//     return () => clearInterval(id);
//   }, [isLoggedIn]);

//   // ── Initial auth check — runs ONCE on mount ───────────────────────────────
//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   const value: AuthContextType = {
//     isLoggedIn, userRole, userData, isLoading, isFirstLogin,
//     login, logout, checkAuthStatus, completeFirstLogin,
//     updateUserData, refreshAuthState, refreshUserData,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within an AuthProvider');
//   return context;
// };

// export const useRequireAuth = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading && !isLoggedIn) router.replace(redirectTo);
//   }, [isLoggedIn, isLoading, redirectTo]);
//   return isLoggedIn;
// };

// export const useRequirePatient = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) router.replace(redirectTo);
//       else if (userRole !== 'patient') router.replace('/(tabs)/doctor-dashboard');
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);
//   return isLoggedIn && userRole === 'patient';
// };

// export const useRequireDoctor = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) router.replace(redirectTo);
//       else if (userRole !== 'doctor') router.replace('/(tabs)/patient-dashboard');
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);
//   return isLoggedIn && userRole === 'doctor';
// };


//newww

// import React, {
//   createContext, useContext, useState, useEffect,
//   ReactNode, useCallback, useRef,
// } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { router } from 'expo-router';

// interface UserData {
//   id?: string;
//   name?: string;
//   email?: string;
//   patientId?: string;
//   doctorId?: string;
//   bloodGroup?: string;
//   hasMedicalForm?: boolean;
//   profileCompleted?: boolean;
//   [key: string]: any;
// }

// interface AuthContextType {
//   isLoggedIn: boolean;
//   userRole: 'patient' | 'doctor' | null;
//   userData: UserData | null;
//   isLoading: boolean;
//   isFirstLogin: boolean;
//   login: (token: string, role: 'patient' | 'doctor', userData?: UserData) => Promise<void>;
//   logout: () => Promise<void>;
//   checkAuthStatus: () => Promise<void>;
//   completeFirstLogin: () => Promise<void>;
//   updateUserData: (newData: Partial<UserData>) => Promise<void>;
//   refreshAuthState: () => Promise<void>;
//   refreshUserData: () => Promise<void>;
// }

// interface AuthProviderProps { children: ReactNode; }

// const STORAGE_KEYS = {
//   TOKEN: 'seharoop_token',
//   USER_ROLE: 'seharoop_user_role',
//   USER_DATA: 'seharoop_user_data',
//   FIRST_LOGIN: 'seharoop_first_login',
//   LAST_ACTIVE: 'seharoop_last_active',
// } as const;

// // 30 days
// const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: AuthProviderProps) {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);

//   // Prevent state updates after unmount
//   const isMounted = useRef(true);
//   useEffect(() => { return () => { isMounted.current = false; }; }, []);

//   // ── Session helpers ───────────────────────────────────────────────────────
//   const isSessionExpired = async (): Promise<boolean> => {
//     try {
//       const lastActive = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
//       if (!lastActive) return true;
//       return Date.now() - parseInt(lastActive) > SESSION_TIMEOUT;
//     } catch { return true; }
//   };

//   const updateLastActive = async (): Promise<void> => {
//     try { await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString()); } catch { }
//   };

//   // ── clearState helper ─────────────────────────────────────────────────────
//   const clearState = () => {
//     if (!isMounted.current) return;
//     setIsLoggedIn(false);
//     setUserRole(null);
//     setUserData(null);
//     setIsFirstLogin(false);
//   };

//   // ── FORCE CLEAR STORAGE - CRITICAL FIX ─────────────────────────────────────
//   const clearAllStorage = async (): Promise<void> => {
//     try {
//       await AsyncStorage.multiRemove([
//         STORAGE_KEYS.TOKEN,
//         STORAGE_KEYS.USER_ROLE,
//         STORAGE_KEYS.USER_DATA,
//         STORAGE_KEYS.FIRST_LOGIN,
//         STORAGE_KEYS.LAST_ACTIVE,
//       ]);
//       console.log('✅ All auth storage cleared');
//     } catch (error) {
//       console.error('Error clearing storage:', error);
//     }
//   };

//   // ── checkAuthStatus ───────────────────────────────────────────────────────
//   const checkAuthStatus = useCallback(async (): Promise<void> => {
//     try {
//       if (isMounted.current) setIsLoading(true);

//       const [token, role, userDataStr, firstLoginFlag] = await Promise.all([
//         AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
//         AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
//         AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN),
//       ]);

//       if (!isMounted.current) return;

//       if (token && role) {
//         const expired = await isSessionExpired();
//         if (expired) {
//           await clearAllStorage();
//           clearState();
//           return;
//         }

//         setIsLoggedIn(true);
//         setUserRole(role as 'patient' | 'doctor');
//         setUserData(userDataStr ? JSON.parse(userDataStr) : null);
//         setIsFirstLogin(firstLoginFlag === 'true');
//         await updateLastActive();
//       } else {
//         clearState();
//       }
//     } catch (err) {
//       console.error('Auth check error:', err);
//       if (isMounted.current) clearState();
//     } finally {
//       if (isMounted.current) setIsLoading(false);
//     }
//   }, []);

//   const refreshAuthState = useCallback(async () => {
//     await checkAuthStatus();
//   }, [checkAuthStatus]);

//   // ── refreshUserData ───────────────────────────────────────────────────────
//   const refreshUserData = useCallback(async (): Promise<void> => {
//     try {
//       const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
//       if (userDataStr && isMounted.current) {
//         const parsed = JSON.parse(userDataStr);
//         setUserData(parsed);
//         const firstLoginFlag = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LOGIN);
//         setIsFirstLogin(firstLoginFlag === 'true');
//       }
//     } catch (error) {
//       console.error('Refresh user data error:', error);
//     }
//   }, []);

//   // ── LOGIN - COMPLETELY REWRITTEN ──────────────────────────────────────────
//   const login = async (
//     token: string, role: 'patient' | 'doctor', userDataParam?: UserData
//   ): Promise<void> => {
//     try {
//       if (!token || !role) throw new Error('Invalid login credentials');

//       console.log('🔐 Starting login process for role:', role);

//       // CRITICAL: Clear ALL existing data first to prevent old user data from persisting
//       await clearAllStorage();

//       // Clear state immediately
//       clearState();

//       // Small delay to ensure storage is cleared
//       await new Promise(resolve => setTimeout(resolve, 100));

//       // Now store the new user data
//       const storageOps: Promise<void>[] = [
//         AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
//         AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role),
//         updateLastActive(),
//       ];

//       if (userDataParam) {
//         // Ensure no old data is merged
//         const cleanUserData = { ...userDataParam };
//         storageOps.push(AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(cleanUserData)));
//       }

//       await Promise.all(storageOps);

//       // Determine first-login for patient
//       let firstLogin = false;
//       if (role === 'patient') {
//         firstLogin = !(userDataParam?.hasMedicalForm);
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, firstLogin ? 'true' : 'false');
//       } else {
//         await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false');
//       }

//       // Verify stored data matches what we just saved
//       const verifyToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
//       const verifyRole = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
//       console.log(`✅ Verification - Token: ${verifyToken ? 'exists' : 'missing'}, Role: ${verifyRole}`);

//       // Update state
//       if (isMounted.current) {
//         setIsLoggedIn(true);
//         setUserRole(role);
//         setUserData(userDataParam ?? null);
//         setIsFirstLogin(firstLogin);
//       }

//       // Brief tick so React can flush state before navigation
//       await new Promise(r => setTimeout(r, 150));

//       // Navigate based on role and first login status
//       console.log('🚀 Navigating for role:', role, 'firstLogin:', firstLogin);

//       if (role === 'patient') {
//         if (firstLogin) {
//           router.replace('/(tabs)/patient-medicalForm');
//         } else {
//           router.replace('/(tabs)/patient-dashboard');
//         }
//       } else {
//         router.replace('/(tabs)/doctor-dashboard');
//       }

//       console.log('✅ Login process completed successfully');
//     } catch (error) {
//       console.error('Login error:', error);
//       throw error;
//     }
//   };

//   // ── logout ────────────────────────────────────────────────────────────────
//   const logout = async (): Promise<void> => {
//     try {
//       await clearAllStorage();
//       clearState();
//       router.replace('/login');
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   };

//   // ── completeFirstLogin ────────────────────────────────────────────────────
//   const completeFirstLogin = async (): Promise<void> => {
//     try {
//       // Get the current user data first to preserve identity
//       const currentUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
//       if (!currentUserData) {
//         console.error('No user data found during completeFirstLogin');
//         return;
//       }

//       const parsedUserData = JSON.parse(currentUserData);
//       const currentRole = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);

//       // Update user data with hasMedicalForm = true, but preserve ALL other fields
//       const updatedUserData = {
//         ...parsedUserData,
//         hasMedicalForm: true,
//         profileCompleted: true
//       };

//       // Update storage - preserve the same token and role
//       await Promise.all([
//         AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData)),
//         AsyncStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'false'),
//       ]);

//       // Update state
//       if (isMounted.current) {
//         setUserData(updatedUserData);
//         setIsFirstLogin(false);
//       }

//       // Wait a bit for state to settle
//       await new Promise(r => setTimeout(r, 100));

//       // Navigate to dashboard
//       router.replace('/(tabs)/patient-dashboard');
//     } catch (error) {
//       console.error('Complete first login error:', error);
//       throw error;
//     }
//   };

//   // ── updateUserData ────────────────────────────────────────────────────────
//   const updateUserData = async (newData: Partial<UserData>): Promise<void> => {
//     try {
//       const currentData = userData || (await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA).then(d => d ? JSON.parse(d) : null));
//       if (!currentData) return;

//       const updated = { ...currentData, ...newData };
//       await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
//       if (isMounted.current) setUserData(updated);
//     } catch (error) {
//       console.error('Update user data error:', error);
//       throw error;
//     }
//   };

//   // ── Periodic last-active update ───────────────────────────────────────────
//   useEffect(() => {
//     if (!isLoggedIn) return;
//     const id = setInterval(updateLastActive, 60_000);
//     return () => clearInterval(id);
//   }, [isLoggedIn]);

//   // ── Initial auth check — runs ONCE on mount ───────────────────────────────
//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   const value: AuthContextType = {
//     isLoggedIn, userRole, userData, isLoading, isFirstLogin,
//     login, logout, checkAuthStatus, completeFirstLogin,
//     updateUserData, refreshAuthState, refreshUserData,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within an AuthProvider');
//   return context;
// };

// export const useRequireAuth = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading && !isLoggedIn) router.replace(redirectTo);
//   }, [isLoggedIn, isLoading, redirectTo]);
//   return isLoggedIn;
// };

// export const useRequirePatient = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) router.replace(redirectTo);
//       else if (userRole !== 'patient') router.replace('/(tabs)/doctor-dashboard');
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);
//   return isLoggedIn && userRole === 'patient';
// };

// export const useRequireDoctor = (redirectTo = '/login'): boolean => {
//   const { isLoggedIn, userRole, isLoading } = useAuth();
//   useEffect(() => {
//     if (!isLoading) {
//       if (!isLoggedIn) router.replace(redirectTo);
//       else if (userRole !== 'doctor') router.replace('/(tabs)/patient-dashboard');
//     }
//   }, [isLoggedIn, userRole, isLoading, redirectTo]);
//   return isLoggedIn && userRole === 'doctor';
// };

import React, {
  createContext, useContext, useState, useEffect,
  ReactNode, useCallback, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface UserData {
  id?: string; name?: string; email?: string; patientId?: string;
  doctorId?: string; bloodGroup?: string; hasMedicalForm?: boolean;
  profileCompleted?: boolean;[key: string]: any;
}

interface AuthContextType {
  isLoggedIn: boolean; userRole: 'patient' | 'doctor' | null;
  userData: UserData | null; isLoading: boolean; isFirstLogin: boolean;
  login: (token: string, role: 'patient' | 'doctor', userData?: UserData) => Promise<void>;
  logout: () => Promise<void>; checkAuthStatus: () => Promise<void>;
  completeFirstLogin: () => Promise<void>;
  updateUserData: (newData: Partial<UserData>) => Promise<void>;
  refreshAuthState: () => Promise<void>; refreshUserData: () => Promise<void>;
}

interface AuthProviderProps { children: ReactNode; }

const KEYS = {
  TOKEN: 'seharoop_token', USER_ROLE: 'seharoop_user_role',
  USER_DATA: 'seharoop_user_data', FIRST_LOGIN: 'seharoop_first_login',
  LAST_ACTIVE: 'seharoop_last_active',
} as const;

const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const safe = (fn: () => void) => { if (isMounted.current) fn(); };

  const updateLastActive = async () => {
    try { await AsyncStorage.setItem(KEYS.LAST_ACTIVE, Date.now().toString()); } catch { }
  };

  const isExpired = async (): Promise<boolean> => {
    try {
      const t = await AsyncStorage.getItem(KEYS.LAST_ACTIVE);
      return !t || Date.now() - parseInt(t) > SESSION_TIMEOUT;
    } catch { return true; }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER_ROLE, KEYS.USER_DATA, KEYS.FIRST_LOGIN, KEYS.LAST_ACTIVE]);
    } catch { }
  };

  const clearState = () => safe(() => {
    setIsLoggedIn(false); setUserRole(null); setUserData(null); setIsFirstLogin(false);
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      safe(() => setIsLoading(true));
      const [token, role, udStr, firstFlag] = await Promise.all([
        AsyncStorage.getItem(KEYS.TOKEN), AsyncStorage.getItem(KEYS.USER_ROLE),
        AsyncStorage.getItem(KEYS.USER_DATA), AsyncStorage.getItem(KEYS.FIRST_LOGIN),
      ]);
      if (!isMounted.current) return;
      if (token && role) {
        if (await isExpired()) { await clearStorage(); clearState(); return; }
        safe(() => {
          setIsLoggedIn(true); setUserRole(role as any);
          setUserData(udStr ? JSON.parse(udStr) : null);
          setIsFirstLogin(firstFlag === 'true');
        });
        await updateLastActive();
      } else clearState();
    } catch { clearState(); }
    finally { safe(() => setIsLoading(false)); }
  }, []);

  const refreshAuthState = useCallback(async () => { await checkAuthStatus(); }, [checkAuthStatus]);
  const refreshUserData = useCallback(async () => {
    try {
      const s = await AsyncStorage.getItem(KEYS.USER_DATA);
      if (s) safe(() => setUserData(JSON.parse(s)));
    } catch { }
  }, []);

  // ── LOGIN — key fix for doctor 403 ───────────────────────────────────────
  // Problem: ApiService.setToken() was being called in register.tsx AFTER
  // login() returned, but the doctor-dashboard was already firing
  // getDoctorProfile() with whatever token was cached. We now set the token
  // in AsyncStorage FIRST (synchronously before any state update) so that
  // any API call that fires immediately gets the correct token.
  const login = async (token: string, role: 'patient' | 'doctor', userDataParam?: UserData): Promise<void> => {
    if (!token || !role) throw new Error('Invalid credentials');

    // 1. CLEAR old storage completely
    await clearStorage();
    safe(() => clearState());
    await new Promise(r => setTimeout(r, 50));

    // 2. Write new token FIRST — before any state or navigation
    //    This ensures any API call that fires immediately uses the right token
    await AsyncStorage.setItem(KEYS.TOKEN, token);
    await AsyncStorage.setItem(KEYS.USER_ROLE, role);
    await updateLastActive();

    if (userDataParam) {
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userDataParam));
    }

    const firstLogin = role === 'patient' ? !(userDataParam?.hasMedicalForm) : false;
    await AsyncStorage.setItem(KEYS.FIRST_LOGIN, firstLogin ? 'true' : 'false');

    // 3. Update state
    safe(() => {
      setIsLoggedIn(true); setUserRole(role);
      setUserData(userDataParam ?? null); setIsFirstLogin(firstLogin);
    });

    // 4. Brief tick for React to flush state
    await new Promise(r => setTimeout(r, 100));

    // 5. Navigate
    if (role === 'patient') {
      router.replace(firstLogin ? '/(tabs)/patient-medicalForm' : '/(tabs)/patient-dashboard');
    } else {
      router.replace('/(tabs)/doctor-dashboard');
    }
  };

  const logout = async (): Promise<void> => {
    await clearStorage(); clearState(); router.replace('/login');
  };

  // ── completeFirstLogin — no isLoading wrapper (prevents crash) ────────────
  const completeFirstLogin = async (): Promise<void> => {
    try {
      const raw = await AsyncStorage.getItem(KEYS.USER_DATA);
      const current = raw ? JSON.parse(raw) : {};
      const updated = { ...current, hasMedicalForm: true, profileCompleted: true };
      await Promise.all([
        AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(updated)),
        AsyncStorage.setItem(KEYS.FIRST_LOGIN, 'false'),
      ]);
      safe(() => { setUserData(updated); setIsFirstLogin(false); });
      await new Promise(r => setTimeout(r, 80));
      router.replace('/(tabs)/patient-dashboard');
    } catch (e) {
      console.error('completeFirstLogin error:', e);
      router.replace('/(tabs)/patient-dashboard');
    }
  };

  const updateUserData = async (newData: Partial<UserData>): Promise<void> => {
    try {
      const base = userData || {};
      const updated = { ...base, ...newData };
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(updated));
      safe(() => setUserData(updated));
    } catch { }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(updateLastActive, 60_000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  useEffect(() => { checkAuthStatus(); }, []);

  const value: AuthContextType = {
    isLoggedIn, userRole, userData, isLoading, isFirstLogin,
    login, logout, checkAuthStatus, completeFirstLogin,
    updateUserData, refreshAuthState, refreshUserData,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const useRequireAuth = (redirectTo = '/login'): boolean => {
  const { isLoggedIn, isLoading } = useAuth();
  useEffect(() => { if (!isLoading && !isLoggedIn) router.replace(redirectTo); }, [isLoggedIn, isLoading, redirectTo]);
  return isLoggedIn;
};
export const useRequirePatient = (redirectTo = '/login'): boolean => {
  const { isLoggedIn, userRole, isLoading } = useAuth();
  useEffect(() => { if (!isLoading) { if (!isLoggedIn) router.replace(redirectTo); else if (userRole !== 'patient') router.replace('/(tabs)/doctor-dashboard'); } }, [isLoggedIn, userRole, isLoading, redirectTo]);
  return isLoggedIn && userRole === 'patient';
};
export const useRequireDoctor = (redirectTo = '/login'): boolean => {
  const { isLoggedIn, userRole, isLoading } = useAuth();
  useEffect(() => { if (!isLoading) { if (!isLoggedIn) router.replace(redirectTo); else if (userRole !== 'doctor') router.replace('/(tabs)/patient-dashboard'); } }, [isLoggedIn, userRole, isLoading, redirectTo]);
  return isLoggedIn && userRole === 'doctor';
};