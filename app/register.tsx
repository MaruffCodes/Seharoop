// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { UserPlus, ArrowLeft, Stethoscope, Calendar, Briefcase } from 'lucide-react-native';
// import { useAuth } from '@/contexts/AuthContext'
// import ApiService from '@/services/api'

// export default function RegisterScreen() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [role, setRole] = useState<'patient' | 'doctor'>('patient');
//   const [specialization, setSpecialization] = useState('');
//   const [qualification, setQualification] = useState('');
//   const [experience, setExperience] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   const { login } = useAuth();
//   const router = useRouter();

//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const validatePassword = (password: string): { valid: boolean; message: string } => {
//     if (password.length < 6) {
//       return { valid: false, message: 'Password must be at least 6 characters' };
//     }
//     if (!/[A-Z]/.test(password)) {
//       return { valid: false, message: 'Password must contain at least one uppercase letter' };
//     }
//     if (!/[0-9]/.test(password)) {
//       return { valid: false, message: 'Password must contain at least one number' };
//     }
//     return { valid: true, message: '' };
//   };

//   const handleRegister = async () => {
//     // Basic validation
//     if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
//       Alert.alert('Validation Error', 'Please fill all required fields');
//       return;
//     }

//     if (!validateEmail(email)) {
//       Alert.alert('Validation Error', 'Please enter a valid email address');
//       return;
//     }

//     const passwordValidation = validatePassword(password);
//     if (!passwordValidation.valid) {
//       Alert.alert('Validation Error', passwordValidation.message);
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Validation Error', 'Passwords do not match');
//       return;
//     }

//     // Additional validation for doctor
//     if (role === 'doctor') {
//       if (!specialization.trim()) {
//         Alert.alert('Validation Error', 'Please enter your specialization');
//         return;
//       }

//       if (experience && isNaN(parseInt(experience))) {
//         Alert.alert('Validation Error', 'Experience must be a number');
//         return;
//       }
//     }

//     setIsLoading(true);
//     try {
//       let response;

//       if (role === 'patient') {
//         response = await ApiService.registerPatient(name, email, password);
//       } else {
//         response = await ApiService.registerDoctor(
//           name,
//           email,
//           password,
//           specialization,
//           qualification,
//           experience ? parseInt(experience) : 0
//         );
//       }

//       if (response.success && response.data) {
//         // Automatically log in after successful registration
//         await login(
//           response.data.token,
//           role,
//           { ...response.data.user, hasMedicalForm: role === 'doctor' ? true : false }
//         );

//         Alert.alert(
//           'Registration Successful',
//           `Welcome to Seharoop, ${name}!`,
//           [{ text: 'Continue' }]
//         );
//       } else {
//         Alert.alert('Registration Failed', response.message || 'Could not create account');
//       }
//     } catch (error: any) {
//       console.error('Registration error:', error);

//       let errorMessage = 'Registration failed. Please try again.';

//       if (error.message.includes('email already exists')) {
//         errorMessage = 'This email is already registered. Please use a different email or login.';
//       } else if (error.message.includes('Network')) {
//         errorMessage = 'Network error. Please check your internet connection.';
//       }

//       Alert.alert('Registration Error', errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardAvoid}>
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}>

//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => router.back()}
//             disabled={isLoading}>
//             <ArrowLeft size={24} color="#2563EB" />
//           </TouchableOpacity>

//           <View style={styles.header}>
//             <Stethoscope size={48} color="#2563EB" />
//             <Text style={styles.title}>Create Account</Text>
//             <Text style={styles.subtitle}>Join Seharoop to manage your health records</Text>
//           </View>

//           <View style={styles.form}>
//             <View style={styles.roleContainer}>
//               <Text style={styles.label}>I am a:</Text>
//               <View style={styles.roleButtons}>
//                 <TouchableOpacity
//                   style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
//                   onPress={() => setRole('patient')}
//                   disabled={isLoading}>
//                   <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>
//                     Patient
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
//                   onPress={() => setRole('doctor')}
//                   disabled={isLoading}>
//                   <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextActive]}>
//                     Doctor
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Full Name *</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter your full name"
//                 placeholderTextColor="#9CA3AF"
//                 value={name}
//                 onChangeText={setName}
//                 editable={!isLoading}
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email *</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter your email"
//                 placeholderTextColor="#9CA3AF"
//                 value={email}
//                 onChangeText={setEmail}
//                 autoCapitalize="none"
//                 keyboardType="email-address"
//                 editable={!isLoading}
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Password *</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Create a password"
//                 placeholderTextColor="#9CA3AF"
//                 value={password}
//                 onChangeText={setPassword}
//                 secureTextEntry={!showPassword}
//                 editable={!isLoading}
//               />
//               <Text style={styles.passwordHint}>
//                 Minimum 6 characters with 1 uppercase and 1 number
//               </Text>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Confirm Password *</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Confirm your password"
//                 placeholderTextColor="#9CA3AF"
//                 value={confirmPassword}
//                 onChangeText={setConfirmPassword}
//                 secureTextEntry={!showPassword}
//                 editable={!isLoading}
//               />
//             </View>

//             {/* Doctor-specific fields */}
//             {role === 'doctor' && (
//               <View style={styles.doctorFields}>
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.label}>Specialization *</Text>
//                   <View style={styles.iconInput}>
//                     <Briefcase size={20} color="#9CA3AF" />
//                     <TextInput
//                       style={styles.iconInputField}
//                       placeholder="e.g., Cardiologist, Pediatrician"
//                       placeholderTextColor="#9CA3AF"
//                       value={specialization}
//                       onChangeText={setSpecialization}
//                       editable={!isLoading}
//                     />
//                   </View>
//                 </View>

//                 <View style={styles.inputGroup}>
//                   <Text style={styles.label}>Qualification</Text>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="e.g., MBBS, MD"
//                     placeholderTextColor="#9CA3AF"
//                     value={qualification}
//                     onChangeText={setQualification}
//                     editable={!isLoading}
//                   />
//                 </View>

//                 <View style={styles.inputGroup}>
//                   <Text style={styles.label}>Experience (years)</Text>
//                   <View style={styles.iconInput}>
//                     <Calendar size={20} color="#9CA3AF" />
//                     <TextInput
//                       style={styles.iconInputField}
//                       placeholder="Years of experience"
//                       placeholderTextColor="#9CA3AF"
//                       value={experience}
//                       onChangeText={setExperience}
//                       keyboardType="numeric"
//                       editable={!isLoading}
//                     />
//                   </View>
//                 </View>
//               </View>
//             )}

//             <TouchableOpacity
//               style={[styles.registerButton, isLoading && styles.buttonDisabled]}
//               onPress={handleRegister}
//               disabled={isLoading}>
//               {isLoading ? (
//                 <ActivityIndicator color="#FFFFFF" size="small" />
//               ) : (
//                 <>
//                   <UserPlus size={20} color="#FFFFFF" />
//                   <Text style={styles.registerButtonText}>Create Account</Text>
//                 </>
//               )}
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.loginLink}
//               onPress={() => router.push('/login')}
//               disabled={isLoading}>
//               <Text style={styles.loginLinkText}>
//                 Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginTop: 12,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#64748B',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   form: {
//     width: '100%',
//   },
//   roleContainer: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 8,
//     color: '#374151',
//   },
//   roleButtons: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   roleButton: {
//     flex: 1,
//     padding: 14,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   roleButtonActive: {
//     borderColor: '#2563EB',
//     backgroundColor: '#EFF6FF',
//   },
//   roleButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   roleButtonTextActive: {
//     color: '#2563EB',
//   },
//   inputGroup: {
//     marginBottom: 16,
//   },
//   input: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 10,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     fontSize: 15,
//     color: '#1F2937',
//   },
//   iconInput: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 10,
//     paddingHorizontal: 16,
//   },
//   iconInputField: {
//     flex: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 12,
//     fontSize: 15,
//     color: '#1F2937',
//   },
//   passwordHint: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginTop: 4,
//     marginLeft: 4,
//   },
//   doctorFields: {
//     marginTop: 8,
//     marginBottom: 8,
//   },
//   registerButton: {
//     backgroundColor: '#10B981',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     marginTop: 24,
//     gap: 8,
//     shadowColor: '#10B981',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   buttonDisabled: {
//     backgroundColor: '#A7F3D0',
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   registerButtonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   loginLink: {
//     alignItems: 'center',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   loginLinkText: {
//     color: '#6B7280',
//     fontSize: 15,
//     fontWeight: '500',
//   },
//   loginLinkBold: {
//     color: '#2563EB',
//     fontWeight: '700',
//   },
// });


import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus, ArrowLeft, User, UserCheck, Eye, EyeOff, Briefcase, Calendar, GraduationCap } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from '@/services/api';

const C = {
  bg: '#F3F6FD',
  surface: '#FFFFFF',
  primary: '#1A56DB',
  primaryLight: '#EBF2FF',
  success: '#059669',
  successLight: '#ECFDF5',
  textDark: '#0D1B3E',
  textMid: '#4A5A7A',
  textLight: '#9AAABE',
  border: '#DDE4F5',
  borderFocus: '#1A56DB',
  sectionBg: '#F8FAFF',
};

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}

const FieldWrap = ({ label, children, hint }: FieldProps) => (
  <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    {children}
    {hint ? <Text style={s.hint}>{hint}</Text> : null}
  </View>
);

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
  const [showPw, setShowPw] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePassword = (p: string) => {
    if (p.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(p)) return 'Must contain at least one uppercase letter';
    if (!/[0-9]/.test(p)) return 'Must contain at least one number';
    return '';
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.'); return;
    }
    if (!validateEmail(email)) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }
    const pwError = validatePassword(password);
    if (pwError) { Alert.alert('Weak Password', pwError); return; }
    if (password !== confirmPassword) { Alert.alert('Password Mismatch', 'Passwords do not match.'); return; }
    if (role === 'doctor' && !specialization.trim()) { Alert.alert('Missing Field', 'Please enter your specialization.'); return; }

    setIsLoading(true);
    try {
      const response = role === 'patient'
        ? await ApiService.registerPatient(name, email, password)
        : await ApiService.registerDoctor(name, email, password, specialization, qualification, experience ? parseInt(experience) : 0);

      if (response.success && response.data) {
        await login(response.data.token, role, { ...response.data.user, hasMedicalForm: role === 'doctor' });
        Alert.alert('Welcome!', `Account created for ${name}.`, [{ text: 'Continue' }]);
      } else {
        Alert.alert('Registration Failed', response.message || 'Could not create account.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message?.includes('email already exists') ? 'This email is already registered.' : 'Registration failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  const box = (id: string) => [s.box, focus === id && s.boxFocus];

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity style={s.back} onPress={() => router.back()} disabled={isLoading} activeOpacity={0.7}>
            <View style={s.backBtn}><ArrowLeft size={20} color={C.primary} strokeWidth={2} /></View>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.sub}>Join Seharoop to manage your health records</Text>
          </View>

          {/* Role toggle */}
          <View style={s.toggleTrack}>
            {(['patient', 'doctor'] as const).map(r => (
              <TouchableOpacity
                key={r}
                style={[s.togglePill, role === r && s.toggleActive]}
                onPress={() => setRole(r)}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {r === 'patient'
                  ? <User size={14} color={role === r ? '#FFF' : C.textLight} strokeWidth={2} />
                  : <UserCheck size={14} color={role === r ? '#FFF' : C.textLight} strokeWidth={2} />
                }
                <Text style={[s.toggleTxt, role === r && s.toggleTxtActive]}>
                  {r === 'patient' ? 'Patient' : 'Doctor'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Core fields */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Personal Information</Text>

            <FieldWrap label="Full Name *">
              <View style={box('name')}>
                <TextInput
                  style={s.inp}
                  placeholder="John Doe"
                  placeholderTextColor={C.textLight}
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                  onFocus={() => setFocus('name')}
                  onBlur={() => setFocus(null)}
                />
              </View>
            </FieldWrap>

            <FieldWrap label="Email Address *">
              <View style={box('email')}>
                <TextInput
                  style={s.inp}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                  onFocus={() => setFocus('email')}
                  onBlur={() => setFocus(null)}
                />
              </View>
            </FieldWrap>

            <FieldWrap label="Password *" hint="Min 6 chars, 1 uppercase, 1 number">
              <View style={box('pw')}>
                <TextInput
                  style={[s.inp, { paddingRight: 4 }]}
                  placeholder="Create a strong password"
                  placeholderTextColor={C.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  editable={!isLoading}
                  onFocus={() => setFocus('pw')}
                  onBlur={() => setFocus(null)}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eye} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPw ? <EyeOff size={17} color={C.textLight} /> : <Eye size={17} color={C.textLight} />}
                </TouchableOpacity>
              </View>
            </FieldWrap>

            <FieldWrap label="Confirm Password *">
              <View style={box('cpw')}>
                <TextInput
                  style={[s.inp, { paddingRight: 4 }]}
                  placeholder="Repeat your password"
                  placeholderTextColor={C.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPw}
                  editable={!isLoading}
                  onFocus={() => setFocus('cpw')}
                  onBlur={() => setFocus(null)}
                />
              </View>
            </FieldWrap>
          </View>

          {/* Doctor-specific fields */}
          {role === 'doctor' && (
            <View style={[s.card, s.doctorCard]}>
              <View style={s.doctorBadge}>
                <UserCheck size={14} color={C.primary} strokeWidth={2} />
                <Text style={s.doctorBadgeText}>Doctor Details</Text>
              </View>

              <FieldWrap label="Specialization *">
                <View style={[s.box, s.boxIcon, focus === 'spec' && s.boxFocus]}>
                  <Briefcase size={16} color={C.textLight} strokeWidth={2} />
                  <TextInput
                    style={s.inpIcon}
                    placeholder="e.g., Cardiologist, Pediatrician"
                    placeholderTextColor={C.textLight}
                    value={specialization}
                    onChangeText={setSpecialization}
                    editable={!isLoading}
                    onFocus={() => setFocus('spec')}
                    onBlur={() => setFocus(null)}
                  />
                </View>
              </FieldWrap>

              <FieldWrap label="Qualification">
                <View style={[s.box, s.boxIcon, focus === 'qual' && s.boxFocus]}>
                  <GraduationCap size={16} color={C.textLight} strokeWidth={2} />
                  <TextInput
                    style={s.inpIcon}
                    placeholder="e.g., MBBS, MD"
                    placeholderTextColor={C.textLight}
                    value={qualification}
                    onChangeText={setQualification}
                    editable={!isLoading}
                    onFocus={() => setFocus('qual')}
                    onBlur={() => setFocus(null)}
                  />
                </View>
              </FieldWrap>

              <FieldWrap label="Experience (years)">
                <View style={[s.box, s.boxIcon, focus === 'exp' && s.boxFocus]}>
                  <Calendar size={16} color={C.textLight} strokeWidth={2} />
                  <TextInput
                    style={s.inpIcon}
                    placeholder="Years of practice"
                    placeholderTextColor={C.textLight}
                    value={experience}
                    onChangeText={setExperience}
                    keyboardType="numeric"
                    editable={!isLoading}
                    onFocus={() => setFocus('exp')}
                    onBlur={() => setFocus(null)}
                  />
                </View>
              </FieldWrap>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[s.cta, isLoading && s.ctaOff]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading
              ? <ActivityIndicator color="#FFF" size="small" />
              : <><UserPlus size={18} color="#FFF" strokeWidth={2} /><Text style={s.ctaTxt}>Create Account</Text></>
            }
          </TouchableOpacity>

          {/* Login link */}
          <TouchableOpacity style={s.loginRow} onPress={() => router.push('/login')} disabled={isLoading}>
            <Text style={s.loginTxt}>Already have an account? </Text>
            <Text style={s.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },

  back: { marginBottom: 20 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  header: { marginBottom: 26 },
  title: { fontSize: 28, fontWeight: '800', color: C.textDark, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: C.textMid, marginTop: 5 },

  toggleTrack: { flexDirection: 'row', backgroundColor: '#F0F5FF', borderRadius: 14, padding: 4, marginBottom: 20 },
  togglePill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 11, gap: 6 },
  toggleActive: { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 3 },
  toggleTxt: { fontSize: 14, fontWeight: '600', color: C.textLight },
  toggleTxtActive: { color: '#FFF' },

  card: {
    backgroundColor: C.surface, borderRadius: 22, padding: 22, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  doctorCard: { borderWidth: 1.5, borderColor: C.primaryLight },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 18 },

  doctorBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 18 },
  doctorBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: C.textDark, marginBottom: 8 },
  hint: { fontSize: 12, color: C.textLight, marginTop: 5 },
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFF', borderWidth: 1.5, borderColor: C.border, borderRadius: 13, paddingHorizontal: 16 },
  boxIcon: { gap: 10 },
  boxFocus: { borderColor: C.borderFocus, backgroundColor: C.surface },
  inp: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.textDark },
  inpIcon: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.textDark },
  eye: { padding: 4 },

  cta: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  ctaOff: { backgroundColor: C.textLight, shadowOpacity: 0, elevation: 0 },
  ctaTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginTxt: { fontSize: 14, color: C.textLight },
  loginLink: { fontSize: 14, fontWeight: '700', color: C.primary },
});
