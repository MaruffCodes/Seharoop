// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { Stethoscope, LogIn, User, UserCheck } from 'lucide-react-native';
// import { useAuth } from '@/contexts/AuthContext'
// import ApiService from '@/services/api'

// export default function LoginScreen() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
//   const [isLoading, setIsLoading] = useState(false);
//   const { login, isLoggedIn } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     // If already logged in, redirect to appropriate dashboard
//     if (isLoggedIn) {
//       // Navigation will be handled by AuthContext
//     }
//   }, [isLoggedIn]);

//   const validateEmail = (email: string): boolean => {
//     // Production-grade email regex
//     const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
//     return emailRegex.test(email);
//   };

//   const handleLogin = async () => {
//     const sanitizedEmail = email.trim().toLowerCase();

//     // Validation
//     // NEVER trim passwords during validation. Spaces are valid characters in passwords.
//     if (!sanitizedEmail || !password) {
//       Alert.alert('Validation Error', 'Please fill in all fields');
//       return;
//     }

//     if (!validateEmail(sanitizedEmail)) {
//       Alert.alert('Validation Error', 'Please enter a valid email address');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       let response;

//       // Call the appropriate API based on user type
//       if (userType === 'patient') {
//         response = await ApiService.loginPatient(sanitizedEmail, password);
//       } else {
//         response = await ApiService.loginDoctor(sanitizedEmail, password);
//       }

//       if (response.success && response.data) {
//         // Immediately sync API service state to prevent race conditions
//         ApiService.setToken(response.data.token);
        
//         // Store token and user data via auth context
//         await login(
//           response.data.token,
//           userType,
//           response.data.user
//         );

//         // Success message
//         Alert.alert(
//           'Success',
//           `Welcome back, ${response.data.user.name || userType}!`
//         );
//       } else {
//         Alert.alert('Login Failed', response.message || 'Invalid credentials. Please try again.');
//       }
//     } catch (error: any) {
//       console.error('Login error:', error);

//       let errorMessage = 'Login failed. Please check your connection and try again.';

//       if (error.message.includes('401')) {
//         errorMessage = 'Invalid email or password. Please try again.';
//       } else if (error.message.includes('Network')) {
//         errorMessage = 'Network error. Please check your internet connection.';
//       }

//       Alert.alert('Login Error', errorMessage);
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

//           <View style={styles.header}>
//             <View style={styles.logoContainer}>
//               <Stethoscope size={64} color="#2563EB" />
//             </View>
//             <Text style={styles.title}>Seharoop</Text>
//             <Text style={styles.subtitle}>Your Health Records, Simplified</Text>
//           </View>

//           <View style={styles.form}>
//             <View style={styles.userTypeSelector}>
//               <TouchableOpacity
//                 style={[
//                   styles.userTypeButton,
//                   userType === 'patient' && styles.userTypeButtonActive,
//                 ]}
//                 onPress={() => setUserType('patient')}
//                 disabled={isLoading}>
//                 <User
//                   size={20}
//                   color={userType === 'patient' ? '#FFFFFF' : '#6B7280'}
//                 />
//                 <Text
//                   style={[
//                     styles.userTypeText,
//                     userType === 'patient' && styles.userTypeTextActive,
//                   ]}>
//                   Patient
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[
//                   styles.userTypeButton,
//                   userType === 'doctor' && styles.userTypeButtonActive,
//                 ]}
//                 onPress={() => setUserType('doctor')}
//                 disabled={isLoading}>
//                 <UserCheck
//                   size={20}
//                   color={userType === 'doctor' ? '#FFFFFF' : '#6B7280'}
//                 />
//                 <Text
//                   style={[
//                     styles.userTypeText,
//                     userType === 'doctor' && styles.userTypeTextActive,
//                   ]}>
//                   Doctor
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email</Text>
//               <TextInput
//                 style={styles.input}
//                 value={email}
//                 onChangeText={setEmail}
//                 placeholder="Enter your email"
//                 placeholderTextColor="#9CA3AF"
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//                 autoComplete="email"
//                 editable={!isLoading}
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Password</Text>
//               <TextInput
//                 style={styles.input}
//                 value={password}
//                 onChangeText={setPassword}
//                 placeholder="Enter your password"
//                 placeholderTextColor="#9CA3AF"
//                 secureTextEntry
//                 autoComplete="password"
//                 editable={!isLoading}
//               />
//             </View>

//             <TouchableOpacity
//               style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
//               onPress={handleLogin}
//               disabled={isLoading}>
//               {isLoading ? (
//                 <ActivityIndicator color="#FFFFFF" size="small" />
//               ) : (
//                 <>
//                   <LogIn size={20} color="#FFFFFF" />
//                   <Text style={styles.loginButtonText}>Sign In</Text>
//                 </>
//               )}
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.registerLink}
//               onPress={() => router.push('/register')}
//               disabled={isLoading}>
//               <Text style={styles.registerLinkText}>
//                 Don't have an account? <Text style={styles.registerLinkBold}>Register here</Text>
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
//     paddingHorizontal: 24,
//     paddingVertical: 32,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   logoContainer: {
//     width: 120,
//     height: 120,
//     backgroundColor: '#EFF6FF',
//     borderRadius: 60,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//     shadowColor: '#2563EB',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginTop: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#64748B',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   form: {
//     flex: 1,
//     width: '100%',
//   },
//   userTypeSelector: {
//     flexDirection: 'row',
//     marginBottom: 32,
//     backgroundColor: '#F1F5F9',
//     borderRadius: 12,
//     padding: 4,
//   },
//   userTypeButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   userTypeButtonActive: {
//     backgroundColor: '#2563EB',
//     shadowColor: '#2563EB',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   userTypeText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   userTypeTextActive: {
//     color: '#FFFFFF',
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     fontSize: 16,
//     color: '#1F2937',
//   },
//   loginButton: {
//     backgroundColor: '#2563EB',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     marginTop: 20,
//     gap: 8,
//     shadowColor: '#2563EB',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   loginButtonDisabled: {
//     backgroundColor: '#9CA3AF',
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   loginButtonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   registerLink: {
//     alignItems: 'center',
//     marginTop: 24,
//   },
//   registerLinkText: {
//     color: '#64748B',
//     fontSize: 15,
//     fontWeight: '500',
//   },
//   registerLinkBold: {
//     color: '#2563EB',
//     fontWeight: '700',
//   },
// });

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Stethoscope, User, UserCheck, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from '@/services/api';

// ── Design tokens ────────────────────────────────────────────────────
const C = {
  bg: '#F3F6FD',
  surface: '#FFFFFF',
  primary: '#1A56DB',
  primaryLight: '#EBF2FF',
  textDark: '#0D1B3E',
  textMid: '#4A5A7A',
  textLight: '#9AAABE',
  border: '#DDE4F5',
  borderFocus: '#1A56DB',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const sanitized = email.trim().toLowerCase();
    if (!sanitized || !password) { Alert.alert('Missing Fields', 'Please fill in all fields.'); return; }
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!re.test(sanitized)) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }
    setIsLoading(true);
    try {
      const response = userType === 'patient'
        ? await ApiService.loginPatient(sanitized, password)
        : await ApiService.loginDoctor(sanitized, password);
      if (response.success && response.data) {
        ApiService.setToken(response.data.token);
        await login(response.data.token, userType, response.data.user);
        Alert.alert('Welcome back', `Signed in as ${response.data.user.name || userType}.`);
      } else {
        Alert.alert('Sign In Failed', response.message || 'Invalid credentials.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message?.includes('401') ? 'Incorrect email or password.' : 'Connection error. Try again.');
    } finally { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Brand ── */}
          <View style={s.brand}>
            <View style={s.logoRing}>
              <View style={s.logoCore}>
                <Stethoscope size={30} color={C.primary} strokeWidth={1.8} />
              </View>
            </View>
            <Text style={s.appName}>Seharoop</Text>
            <Text style={s.tagline}>Your health records, simplified</Text>
          </View>

          {/* ── Form card ── */}
          <View style={s.card}>

            {/* Role toggle */}
            <View style={s.toggleTrack}>
              {(['patient', 'doctor'] as const).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[s.togglePill, userType === role && s.toggleActive]}
                  onPress={() => setUserType(role)}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {role === 'patient'
                    ? <User size={14} color={userType === role ? '#FFF' : C.textLight} strokeWidth={2} />
                    : <UserCheck size={14} color={userType === role ? '#FFF' : C.textLight} strokeWidth={2} />
                  }
                  <Text style={[s.toggleTxt, userType === role && s.toggleTxtActive]}>
                    {role === 'patient' ? 'Patient' : 'Doctor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email address</Text>
              <View style={[s.box, emailFocus && s.boxFocus]}>
                <TextInput
                  style={s.inp}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={[s.box, pwFocus && s.boxFocus]}>
                <TextInput
                  style={[s.inp, { paddingRight: 4 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={C.textLight}
                  secureTextEntry={!showPw}
                  autoComplete="password"
                  editable={!isLoading}
                  onFocus={() => setPwFocus(true)}
                  onBlur={() => setPwFocus(false)}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eye} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPw ? <EyeOff size={17} color={C.textLight} /> : <Eye size={17} color={C.textLight} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[s.cta, isLoading && s.ctaOff]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Text style={s.ctaTxt}>Sign In</Text><ArrowRight size={17} color="#FFF" strokeWidth={2.5} /></>
              }
            </TouchableOpacity>

            {/* Separator */}
            <View style={s.sep}>
              <View style={s.sepLine} />
              <Text style={s.sepTxt}>New to Seharoop?</Text>
              <View style={s.sepLine} />
            </View>

            {/* Register link */}
            <TouchableOpacity style={s.ghost} onPress={() => router.push('/register')} disabled={isLoading} activeOpacity={0.85}>
              <Text style={s.ghostTxt}>Create an account</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.legal}>By continuing, you agree to our <Text style={s.legalLink}>Terms & Privacy</Text></Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 40 },

  brand: { alignItems: 'center', marginBottom: 34 },
  logoRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 22, elevation: 6,
  },
  logoCore: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  appName: { fontSize: 32, fontWeight: '800', color: C.textDark, letterSpacing: -0.6 },
  tagline: { fontSize: 14, color: C.textMid, marginTop: 5, letterSpacing: 0.05 },

  card: {
    backgroundColor: C.surface, borderRadius: 26, padding: 26,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4,
    marginBottom: 20,
  },

  toggleTrack: { flexDirection: 'row', backgroundColor: '#F0F5FF', borderRadius: 14, padding: 4, marginBottom: 26 },
  togglePill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 11, gap: 6 },
  toggleActive: { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 3 },
  toggleTxt: { fontSize: 14, fontWeight: '600', color: C.textLight },
  toggleTxtActive: { color: '#FFF' },

  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: C.textDark, marginBottom: 8 },
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFF', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16 },
  boxFocus: { borderColor: C.borderFocus, backgroundColor: C.surface },
  inp: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.textDark },
  eye: { padding: 4 },

  cta: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  ctaOff: { backgroundColor: C.textLight, shadowOpacity: 0, elevation: 0 },
  ctaTxt: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.15 },

  sep: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 10 },
  sepLine: { flex: 1, height: 1, backgroundColor: C.border },
  sepTxt: { fontSize: 12, color: C.textLight, fontWeight: '500' },

  ghost: { borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  ghostTxt: { color: C.primary, fontSize: 15, fontWeight: '700' },

  legal: { textAlign: 'center', fontSize: 12, color: C.textLight, lineHeight: 18 },
  legalLink: { color: C.primary, fontWeight: '600' },
});
