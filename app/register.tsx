import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus, ArrowLeft, Stethoscope, Calendar, Briefcase } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext'
import ApiService from '@/services/api'

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: '' };
  };

  const handleRegister = async () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Validation Error', passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    // Additional validation for doctor
    if (role === 'doctor') {
      if (!specialization.trim()) {
        Alert.alert('Validation Error', 'Please enter your specialization');
        return;
      }

      if (experience && isNaN(parseInt(experience))) {
        Alert.alert('Validation Error', 'Experience must be a number');
        return;
      }
    }

    setIsLoading(true);
    try {
      let response;

      if (role === 'patient') {
        response = await ApiService.registerPatient(name, email, password);
      } else {
        response = await ApiService.registerDoctor(
          name,
          email,
          password,
          specialization,
          qualification,
          experience ? parseInt(experience) : 0
        );
      }

      if (response.success && response.data) {
        // Automatically log in after successful registration
        await login(
          response.data.token,
          role,
          { ...response.data.user, hasMedicalForm: role === 'doctor' ? true : false }
        );

        Alert.alert(
          'Registration Successful',
          `Welcome to Seharoop, ${name}!`,
          [{ text: 'Continue' }]
        );
      } else {
        Alert.alert('Registration Failed', response.message || 'Could not create account');
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.message.includes('email already exists')) {
        errorMessage = 'This email is already registered. Please use a different email or login.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}>
            <ArrowLeft size={24} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Stethoscope size={48} color="#2563EB" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Seharoop to manage your health records</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.roleContainer}>
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                  onPress={() => setRole('patient')}
                  disabled={isLoading}>
                  <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>
                    Patient
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
                  onPress={() => setRole('doctor')}
                  disabled={isLoading}>
                  <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextActive]}>
                    Doctor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <Text style={styles.passwordHint}>
                Minimum 6 characters with 1 uppercase and 1 number
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
            </View>

            {/* Doctor-specific fields */}
            {role === 'doctor' && (
              <View style={styles.doctorFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Specialization *</Text>
                  <View style={styles.iconInput}>
                    <Briefcase size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.iconInputField}
                      placeholder="e.g., Cardiologist, Pediatrician"
                      placeholderTextColor="#9CA3AF"
                      value={specialization}
                      onChangeText={setSpecialization}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Qualification</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., MBBS, MD"
                    placeholderTextColor="#9CA3AF"
                    value={qualification}
                    onChangeText={setQualification}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Experience (years)</Text>
                  <View style={styles.iconInput}>
                    <Calendar size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.iconInputField}
                      placeholder="Years of experience"
                      placeholderTextColor="#9CA3AF"
                      value={experience}
                      onChangeText={setExperience}
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <UserPlus size={20} color="#FFFFFF" />
                  <Text style={styles.registerButtonText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/login')}
              disabled={isLoading}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  roleContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#2563EB',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  iconInputField: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 4,
  },
  doctorFields: {
    marginTop: 8,
    marginBottom: 8,
  },
  registerButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A7F3D0',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loginLinkText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  loginLinkBold: {
    color: '#2563EB',
    fontWeight: '700',
  },
});