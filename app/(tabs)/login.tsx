import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Stethoscope, LogIn, User, UserCheck } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api'; // Adjust the path as needed

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      
      // Call the appropriate API based on user type
      if (userType === 'patient') {
        response = await ApiService.loginPatient(email, password);
      } else {
        response = await ApiService.loginDoctor(email, password);
      }

      if (response.success) {
        // Store token and user data
        await login(response.data.token, userType);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));

        // Also store the token in ApiService for future requests
        ApiService.token = response.data.token;

        const route = userType === 'patient' 
          ? '/(tabs)/patient-dashboard' 
          : '/(tabs)/doctor-dashboard';

        Alert.alert('Success', `Logged in as ${userType}`, [
          {
            text: 'OK',
            onPress: () => {
              router.replace(route);
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Stethoscope size={64} color="#2563EB" />
            <Text style={styles.title}>Seharoop</Text>
            <Text style={styles.subtitle}>Your Health Records, Simplified</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.userTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'patient' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('patient')}>
                <User
                  size={20}
                  color={userType === 'patient' ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'patient' && styles.userTypeTextActive,
                  ]}>
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'doctor' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('doctor')}>
                <UserCheck
                  size={20}
                  color={userType === 'doctor' ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'doctor' && styles.userTypeTextActive,
                  ]}>
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}>
              <LogIn size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push('/(tabs)/register')}>
              <Text style={styles.registerLinkText}>
                Don&apos;t have an account? Register here
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  userTypeSelector: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  userTypeButtonActive: {
    backgroundColor: '#2563EB',
  },
  userTypeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  userTypeTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  loginButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
});