// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const storeUserRole = async (role: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('userRole', role);
  } catch (error) {
    console.error('Error storing role:', error);
    throw error;
  }
};

export const getUserRole = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('userRole');
  } catch (error) {
    console.error('Error getting role:', error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
};

export const removeUserRole = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('userRole');
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
};

export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['authToken', 'userRole']);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};