import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';

// API configuration
const API_BASE_URL ='http://192.168.1.6:5000/api';

// Updated registerAPI function to call your backend
const registerAPI = async (name: string, email: string, password: string, role: string, additionalData?: any) => {
  try {
    const endpoint = role === 'patient' ? '/auth/register/patient' : '/auth/register/doctor';
    
    const requestBody = role === 'patient' 
      ? { name, email, password }
      : { 
          name, 
          email, 
          password, 
          specialization: additionalData?.specialization || 'General',
          qualification: additionalData?.qualification || '',
          experience: additionalData?.experience || 0
        };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return {
      token: data.data.token,
      role: role,
      user: data.data.user
    };
  } catch (error) {
    console.error('Registration API error:', error);
    throw error;
  }
};

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
  const { login, checkAuthStatus } = useAuth();
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      checkAuthStatus();
    }, [])
  );

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Additional validation for doctor registration
    if (role === 'doctor' && !specialization) {
      Alert.alert('Error', 'Please enter your specialization');
      return;
    }

    setIsLoading(true);
    try {
      const additionalData = role === 'doctor' ? {
        specialization,
        qualification,
        experience: experience ? parseInt(experience) : 0
      } : {};

      const response = await registerAPI(name, email, password, role, additionalData);
      await login(response.token, response.role, response.user);
      
      // Navigate to appropriate dashboard
      if (response.role === 'patient') {
        router.replace('/(tabs)/patient-dashboard');
      } else if (response.role === 'doctor') {
        router.replace('/(tabs)/doctor-dashboard');
      }
      
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join our medical platform</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password (min. 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.roleContainer}>
        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
            onPress={() => setRole('patient')}
          >
            <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>
              Patient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
            onPress={() => setRole('doctor')}
          >
            <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextActive]}>
              Doctor
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Doctor-specific fields */}
      {role === 'doctor' && (
        <View style={styles.doctorFields}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Specialization *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Cardiologist, Pediatrician"
              value={specialization}
              onChangeText={setSpecialization}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Qualification</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., MBBS, MD"
              value={qualification}
              onChangeText={setQualification}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Experience (years)</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of years of experience"
              value={experience}
              onChangeText={setExperience}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.registerButton, isLoading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.registerButtonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  roleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  roleButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#2563EB',
  },
  doctorFields: {
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});