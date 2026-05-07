// import React, { useState, useEffect, JSX } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Image,
//   ImageSourcePropType,
//   Modal,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import {
//   User,
//   Mail,
//   Hash,
//   QrCode,
//   CreditCard as Edit3,
//   Shield,
//   Activity,
//   Heart,
//   Zap,
//   MapPin,
//   Phone,
//   Calendar,
//   AlertCircle,
//   Pill,
//   Scissors,
//   AlertTriangle,
//   PhoneCall,
//   X,
//   FileText
// } from 'lucide-react-native';
// import ApiService from '../../services/api';
// import PatientMedicalForm from './patient-medicalForm';

// interface UserData {
//   name: string;
//   email: string;
//   patientId: string;
//   bloodGroup?: string;
//   isDiabetic?: boolean;
//   diabetesType?: string;
//   hasThyroid?: boolean;
//   thyroidCondition?: string;
//   qrCode?: string;
//   dateOfBirth?: string;
//   gender?: string;
//   phone?: string;
//   address?: {
//     street?: string;
//     city?: string;
//     state?: string;
//     pincode?: string;
//     country?: string;
//   };
//   hasMedicalForm?: boolean;
// }

// interface ApiResponse {
//   data: UserData;
// }

// export default function PatientProfile(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [medicalFormModalVisible, setMedicalFormModalVisible] = useState<boolean>(false);
//   const router = useRouter();

//   useEffect(() => {
//     loadUserData();
//   }, []);

//   const loadUserData = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       const response = await ApiService.getPatientProfile() as ApiResponse;
//       setUserData(response.data);

//       await AsyncStorage.setItem('userData', JSON.stringify(response.data));
//     } catch (error) {
//       console.log('Error loading user data:', error);
//       const storedData = await AsyncStorage.getItem('userData');
//       if (storedData) {
//         setUserData(JSON.parse(storedData));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showQRCode = (): void => {
//     if (!userData?.qrCode) {
//       Alert.alert('QR Code', `Patient ID: ${userData?.patientId}`);
//       return;
//     }

//     Alert.alert(
//       'Patient QR Code',
//       `Scan this QR code to access medical records for ${userData?.name}`,
//       [
//         { text: 'OK' },
//         {
//           text: 'View Full QR',
//           onPress: (): void => {
//             router.push({
//               pathname: '/(tabs)/FullScreenQR',
//               params: { qrCodeUrl: userData.qrCode }
//             });
//           }
//         }
//       ]
//     );
//   };

//   const calculateAge = (dateOfBirth: string): string => {
//     if (!dateOfBirth) return 'Not provided';
//     const dob = new Date(dateOfBirth);
//     const today = new Date();
//     let age = today.getFullYear() - dob.getFullYear();
//     const monthDiff = today.getMonth() - dob.getMonth();

//     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
//       age--;
//     }

//     return `${age} years`;
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#2563EB" />
//           <Text style={styles.loadingText}>Loading profile...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//         <View style={styles.header}>
//           <Text style={styles.title}>My Profile</Text>
//         </View>

//         {/* Profile Header Card */}
//         <View style={styles.profileCard}>
//           <View style={styles.avatarContainer}>
//             <View style={styles.avatar}>
//               <User size={48} color="#FFFFFF" />
//             </View>
//             <Text style={styles.patientName}>{userData?.name || 'Patient Name'}</Text>
//             <Text style={styles.patientId}>ID: {userData?.patientId}</Text>
//           </View>
//         </View>

//         {/* MEDICAL FORM SECTION - DEDICATED AND EDITABLE */}
//         <View style={styles.medicalFormSection}>
//           <View style={styles.medicalFormHeader}>
//             <View style={styles.medicalFormTitleContainer}>
//               <FileText size={24} color="#2563EB" />
//               <Text style={styles.medicalFormTitle}>Medical Form</Text>
//             </View>
//             <TouchableOpacity
//               style={styles.editMedicalFormButton}
//               onPress={() => setMedicalFormModalVisible(true)}
//             >
//               <Edit3 size={20} color="#FFFFFF" />
//               <Text style={styles.editMedicalFormButtonText}>
//                 {userData?.hasMedicalForm ? 'Edit Form' : 'Complete Form'}
//               </Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.medicalFormPreview}>
//             <Text style={styles.medicalFormPreviewText}>
//               {userData?.hasMedicalForm
//                 ? 'Your medical information has been recorded. Tap "Edit Form" to update your details.'
//                 : 'You haven\'t completed your medical form yet. Tap "Complete Form" to add your medical information.'}
//             </Text>
//             <View style={styles.medicalFormStats}>
//               <View style={styles.statItem}>
//                 <Heart size={16} color="#DC2626" />
//                 <Text style={styles.statText}>
//                   Blood: {userData?.bloodGroup || 'Not set'}
//                 </Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Activity size={16} color="#059669" />
//                 <Text style={styles.statText}>
//                   Diabetic: {userData?.isDiabetic ? 'Yes' : 'No'}
//                 </Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Zap size={16} color="#2563EB" />
//                 <Text style={styles.statText}>
//                   Thyroid: {userData?.hasThyroid ? 'Yes' : 'No'}
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Personal Information */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Personal Information</Text>
//           <View style={styles.infoCard}>
//             <View style={styles.infoRow}>
//               <View style={styles.infoIconContainer}>
//                 <User size={20} color="#6B7280" />
//               </View>
//               <View style={styles.infoContent}>
//                 <Text style={styles.infoLabel}>Full Name</Text>
//                 <Text style={styles.infoValue}>{userData?.name || 'Not provided'}</Text>
//               </View>
//             </View>

//             <View style={styles.divider} />

//             <View style={styles.infoRow}>
//               <View style={styles.infoIconContainer}>
//                 <Mail size={20} color="#6B7280" />
//               </View>
//               <View style={styles.infoContent}>
//                 <Text style={styles.infoLabel}>Email</Text>
//                 <Text style={styles.infoValue}>{userData?.email || 'Not provided'}</Text>
//               </View>
//             </View>

//             <View style={styles.divider} />

//             <View style={styles.infoRow}>
//               <View style={styles.infoIconContainer}>
//                 <Phone size={20} color="#6B7280" />
//               </View>
//               <View style={styles.infoContent}>
//                 <Text style={styles.infoLabel}>Phone</Text>
//                 <Text style={styles.infoValue}>{userData?.phone || 'Not provided'}</Text>
//               </View>
//             </View>

//             {userData?.dateOfBirth && (
//               <>
//                 <View style={styles.divider} />
//                 <View style={styles.infoRow}>
//                   <View style={styles.infoIconContainer}>
//                     <Calendar size={20} color="#6B7280" />
//                   </View>
//                   <View style={styles.infoContent}>
//                     <Text style={styles.infoLabel}>Age</Text>
//                     <Text style={styles.infoValue}>{calculateAge(userData.dateOfBirth)}</Text>
//                   </View>
//                 </View>
//               </>
//             )}
//           </View>
//         </View>

//         {/* Quick Medical Info */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Quick Medical Info</Text>
//           <View style={styles.medicalGrid}>
//             <View style={styles.medicalCard}>
//               <Heart size={24} color="#DC2626" />
//               <Text style={styles.medicalLabel}>Blood Group</Text>
//               <Text style={styles.medicalValue}>{userData?.bloodGroup || 'Not set'}</Text>
//             </View>

//             <View style={styles.medicalCard}>
//               <Activity size={24} color="#059669" />
//               <Text style={styles.medicalLabel}>Diabetes</Text>
//               <Text style={styles.medicalValue}>
//                 {userData?.isDiabetic ? (userData.diabetesType || 'Yes') : 'No'}
//               </Text>
//             </View>

//             <View style={styles.medicalCard}>
//               <Zap size={24} color="#2563EB" />
//               <Text style={styles.medicalLabel}>Thyroid</Text>
//               <Text style={styles.medicalValue}>
//                 {userData?.hasThyroid ? (userData.thyroidCondition || 'Yes') : 'No'}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* QR Code Access */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>QR Code Access</Text>

//           <TouchableOpacity style={styles.qrButton} onPress={showQRCode}>
//             {userData?.qrCode ? (
//               <Image
//                 source={{ uri: userData.qrCode } as ImageSourcePropType}
//                 style={styles.qrImage}
//                 resizeMode="contain"
//               />
//             ) : (
//               <QrCode size={32} color="#2563EB" />
//             )}
//             <View style={styles.qrButtonContent}>
//               <Text style={styles.qrButtonTitle}>
//                 {userData?.qrCode ? 'Show My QR Code' : 'Generate QR Code'}
//               </Text>
//               <Text style={styles.qrButtonSubtitle}>
//                 Let doctors scan to access your medical records
//               </Text>
//             </View>
//           </TouchableOpacity>
//         </View>

//         {/* Privacy & Security */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Privacy & Security</Text>

//           <View style={styles.securityCard}>
//             <Shield size={24} color="#059669" />
//             <View style={styles.securityContent}>
//               <Text style={styles.securityTitle}>Your data is secure</Text>
//               <Text style={styles.securityDescription}>
//                 Your medical records are encrypted and only accessible to authorized healthcare providers.
//               </Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>

//       {/* Medical Form Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={medicalFormModalVisible}
//         onRequestClose={() => setMedicalFormModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Medical Form</Text>
//               <TouchableOpacity onPress={() => setMedicalFormModalVisible(false)}>
//                 <X size={24} color="#6B7280" />
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={styles.modalBody}>
//               <PatientMedicalForm />
//             </ScrollView>

//             <View style={styles.modalFooter}>
//               <TouchableOpacity
//                 style={styles.modalCloseButton}
//                 onPress={() => setMedicalFormModalVisible(false)}
//               >
//                 <Text style={styles.modalCloseButtonText}>Close</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#64748B',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#1E293B',
//   },
//   profileCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   avatarContainer: {
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#2563EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   patientName: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1E293B',
//   },
//   patientId: {
//     fontSize: 16,
//     color: '#2563EB',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   // Medical Form Section Styles
//   medicalFormSection: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 2,
//     borderColor: '#2563EB',
//   },
//   medicalFormHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   medicalFormTitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   medicalFormTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#2563EB',
//   },
//   editMedicalFormButton: {
//     backgroundColor: '#2563EB',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//     gap: 6,
//   },
//   editMedicalFormButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   medicalFormPreview: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: 12,
//     padding: 16,
//   },
//   medicalFormPreviewText: {
//     fontSize: 14,
//     color: '#4B5563',
//     marginBottom: 12,
//     lineHeight: 20,
//   },
//   medicalFormStats: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 8,
//     padding: 12,
//   },
//   statItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   statText: {
//     fontSize: 12,
//     color: '#1E293B',
//     fontWeight: '500',
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#2563EB',
//     marginBottom: 16,
//     textTransform: 'uppercase',
//   },
//   infoCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//   },
//   infoIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F1F5F9',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   infoContent: {
//     flex: 1,
//   },
//   infoLabel: {
//     fontSize: 14,
//     color: '#64748B',
//     marginBottom: 4,
//   },
//   infoValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E293B',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#E2E8F0',
//     marginVertical: 8,
//   },
//   medicalGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   medicalCard: {
//     flex: 1,
//     minWidth: '30%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   medicalLabel: {
//     fontSize: 12,
//     color: '#64748B',
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   medicalValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E293B',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   qrButton: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   qrImage: {
//     width: 48,
//     height: 48,
//   },
//   qrButtonContent: {
//     marginLeft: 16,
//     flex: 1,
//   },
//   qrButtonTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1E293B',
//   },
//   qrButtonSubtitle: {
//     fontSize: 14,
//     color: '#64748B',
//     marginTop: 4,
//   },
//   securityCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   securityContent: {
//     marginLeft: 16,
//     flex: 1,
//   },
//   securityTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E293B',
//   },
//   securityDescription: {
//     fontSize: 14,
//     color: '#64748B',
//     marginTop: 4,
//     lineHeight: 20,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     width: '95%',
//     maxHeight: '90%',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1E293B',
//   },
//   modalBody: {
//     padding: 20,
//     maxHeight: '70%',
//   },
//   modalFooter: {
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#E2E8F0',
//     alignItems: 'flex-end',
//   },
//   modalCloseButton: {
//     backgroundColor: '#F1F5F9',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   modalCloseButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#4B5563',
//   },
// });

// import React, { useState, useEffect, JSX } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TouchableOpacity,
//   Alert, Image, ImageSourcePropType, Modal, ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import {
//   User, Mail, Phone, QrCode, CreditCard as Edit3, Shield,
//   Activity, Heart, Zap, Calendar, FileText, X, ChevronRight,
// } from 'lucide-react-native';
// import ApiService from '../../services/api';
// import PatientMedicalForm from './patient-medicalForm';

// const C = {
//   bg: '#F3F6FD',
//   surface: '#FFFFFF',
//   primary: '#1A56DB',
//   primaryLight: '#EBF2FF',
//   textDark: '#0D1B3E',
//   textMid: '#4A5A7A',
//   textLight: '#9AAABE',
//   border: '#DDE4F5',
//   success: '#059669',
//   successLight: '#ECFDF5',
//   danger: '#DC2626',
//   dangerLight: '#FEF2F2',
// };

// interface UserData {
//   name: string; email: string; patientId: string;
//   bloodGroup?: string; isDiabetic?: boolean; diabetesType?: string;
//   hasThyroid?: boolean; thyroidCondition?: string; qrCode?: string;
//   dateOfBirth?: string; gender?: string; phone?: string;
//   hasMedicalForm?: boolean;
// }

// const calcAge = (dob: string) => {
//   const d = new Date(dob), today = new Date();
//   let age = today.getFullYear() - d.getFullYear();
//   if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
//   return `${age} years`;
// };

// export default function PatientProfile(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [formModal, setFormModal] = useState(false);
//   const router = useRouter();

//   useEffect(() => { loadUserData(); }, []);

//   const loadUserData = async () => {
//     try {
//       setLoading(true);
//       const res = await ApiService.getPatientProfile() as any;
//       setUserData(res.data);
//       await AsyncStorage.setItem('userData', JSON.stringify(res.data));
//     } catch {
//       const stored = await AsyncStorage.getItem('userData');
//       if (stored) setUserData(JSON.parse(stored));
//     } finally { setLoading(false); }
//   };

//   const showQRCode = () => {
//     if (!userData?.qrCode) { Alert.alert('QR Code', `Patient ID: ${userData?.patientId}`); return; }
//     router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } });
//   };

//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   if (loading) return (
//     <SafeAreaView style={s.root}>
//       <View style={s.loader}><ActivityIndicator size="large" color={C.primary} /><Text style={s.loaderTxt}>Loading profile…</Text></View>
//     </SafeAreaView>
//   );

//   const VITALS = [
//     { icon: Heart, label: 'Blood Group', value: userData?.bloodGroup || '—', color: C.danger, bg: C.dangerLight },
//     { icon: Activity, label: 'Diabetes', value: userData?.isDiabetic ? (userData.diabetesType || 'Yes') : 'No', color: C.success, bg: C.successLight },
//     { icon: Zap, label: 'Thyroid', value: userData?.hasThyroid ? (userData.thyroidCondition || 'Yes') : 'No', color: C.primary, bg: C.primaryLight },
//   ];

//   const INFO_ROWS = [
//     { icon: User, label: 'Full Name', value: userData?.name },
//     { icon: Mail, label: 'Email', value: userData?.email },
//     { icon: Phone, label: 'Phone', value: userData?.phone },
//     ...(userData?.dateOfBirth ? [{ icon: Calendar, label: 'Age', value: calcAge(userData.dateOfBirth) }] : []),
//   ];

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

//         {/* ── Page title ── */}
//         <View style={s.pageHeader}>
//           <Text style={s.pageTitle}>My Profile</Text>
//         </View>

//         {/* ── Profile hero ── */}
//         <View style={s.hero}>
//           <View style={s.heroAvatar}>
//             <Text style={s.heroAvatarTxt}>{initials}</Text>
//           </View>
//           <Text style={s.heroName}>{userData?.name || 'Patient Name'}</Text>
//           <View style={s.heroBadge}>
//             <Text style={s.heroBadgeTxt}>ID: {userData?.patientId}</Text>
//           </View>
//           {userData?.gender && <Text style={s.heroGender}>{userData.gender}</Text>}
//         </View>

//         {/* ── Quick vitals ── */}
//         <View style={s.vitalsRow}>
//           {VITALS.map((v, i) => {
//             const Icon = v.icon;
//             return (
//               <View key={i} style={s.vitalCard}>
//                 <View style={[s.vitalIcon, { backgroundColor: v.bg }]}>
//                   <Icon size={18} color={v.color} strokeWidth={2} />
//                 </View>
//                 <Text style={s.vitalLabel}>{v.label}</Text>
//                 <Text style={[s.vitalValue, { color: v.color }]}>{v.value}</Text>
//               </View>
//             );
//           })}
//         </View>

//         {/* ── Medical Form ── */}
//         <View style={s.medCard}>
//           <View style={s.medCardHead}>
//             <View style={s.medCardLeft}>
//               <View style={s.medIcon}><FileText size={18} color={C.primary} strokeWidth={2} /></View>
//               <Text style={s.medTitle}>Medical Form</Text>
//             </View>
//             <TouchableOpacity style={s.editBtn} onPress={() => setFormModal(true)} activeOpacity={0.85}>
//               <Edit3 size={14} color="#FFF" strokeWidth={2} />
//               <Text style={s.editBtnTxt}>{userData?.hasMedicalForm ? 'Edit Form' : 'Complete'}</Text>
//             </TouchableOpacity>
//           </View>
//           <Text style={s.medDesc}>
//             {userData?.hasMedicalForm
//               ? 'Your medical information is on record. Keep it updated for accurate care.'
//               : 'Complete your medical form to help healthcare providers give you better care.'
//             }
//           </Text>
//           {!userData?.hasMedicalForm && (
//             <View style={s.incompleteTag}>
//               <Text style={s.incompleteTxt}>⚠ Form incomplete</Text>
//             </View>
//           )}
//         </View>

//         {/* ── Personal Information ── */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Personal Information</Text>
//           <View style={s.infoCard}>
//             {INFO_ROWS.map((row, i) => {
//               const Icon = row.icon;
//               return (
//                 <View key={i}>
//                   {i > 0 && <View style={s.divider} />}
//                   <View style={s.infoRow}>
//                     <View style={s.infoIconWrap}><Icon size={17} color={C.textLight} strokeWidth={2} /></View>
//                     <View style={s.infoContent}>
//                       <Text style={s.infoLabel}>{row.label}</Text>
//                       <Text style={s.infoValue}>{row.value || 'Not provided'}</Text>
//                     </View>
//                   </View>
//                 </View>
//               );
//             })}
//           </View>
//         </View>

//         {/* ── QR Code ── */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Health QR Code</Text>
//           <TouchableOpacity style={s.qrRow} onPress={showQRCode} activeOpacity={0.85}>
//             <View style={s.qrPreview}>
//               {userData?.qrCode
//                 ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrImg} resizeMode="contain" />
//                 : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
//               }
//             </View>
//             <View style={s.qrText}>
//               <Text style={s.qrTitle}>{userData?.qrCode ? 'View My QR Code' : 'Generate QR Code'}</Text>
//               <Text style={s.qrSub}>Let doctors instantly access your medical records</Text>
//             </View>
//             <View style={s.qrArrow}><ChevronRight size={16} color={C.primary} strokeWidth={2} /></View>
//           </TouchableOpacity>
//         </View>

//         {/* ── Privacy ── */}
//         <View style={s.privCard}>
//           <View style={[s.medIcon, { backgroundColor: C.successLight }]}>
//             <Shield size={18} color={C.success} strokeWidth={2} />
//           </View>
//           <View style={s.privBody}>
//             <Text style={s.privTitle}>Your data is secure</Text>
//             {/* <Text style={s.privDesc}> */}
//             {/* All medical records are encrypted and only accessible to authorized healthcare providers. */}
//             {/* </Text> */}
//           </View>
//         </View>

//       </ScrollView>

//       {/* Medical Form Modal */}
//       <Modal animationType="slide" transparent visible={formModal} onRequestClose={() => setFormModal(false)}>
//         <View style={s.overlay}>
//           <View style={s.modal}>
//             <View style={s.modalHead}>
//               <Text style={s.modalTitle}>Medical Form</Text>
//               <TouchableOpacity onPress={() => setFormModal(false)} style={s.modalClose}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView style={s.modalBody}>
//               <PatientMedicalForm />
//             </ScrollView>
//             <TouchableOpacity style={s.modalFooterBtn} onPress={() => setFormModal(false)}>
//               <Text style={s.modalFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { paddingHorizontal: 20, paddingBottom: 40 },
//   loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   loaderTxt: { marginTop: 14, fontSize: 15, color: C.textMid },

//   pageHeader: { marginVertical: 20 },
//   pageTitle: { fontSize: 28, fontWeight: '800', color: C.textDark, letterSpacing: -0.5 },

//   // Hero
//   hero: {
//     backgroundColor: C.surface, borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 4,
//   },
//   heroAvatar: {
//     width: 84, height: 84, borderRadius: 26, backgroundColor: C.primary,
//     alignItems: 'center', justifyContent: 'center', marginBottom: 14,
//     shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 5,
//   },
//   heroAvatarTxt: { fontSize: 28, fontWeight: '800', color: '#FFF' },
//   heroName: { fontSize: 22, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 8 },
//   heroBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 6 },
//   heroBadgeTxt: { fontSize: 13, fontWeight: '700', color: C.primary },
//   heroGender: { fontSize: 13, color: C.textLight, marginTop: 2 },

//   // Vitals
//   vitalsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   vitalCard: {
//     flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
//   },
//   vitalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   vitalLabel: { fontSize: 11, color: C.textLight, marginBottom: 3, fontWeight: '600' },
//   vitalValue: { fontSize: 14, fontWeight: '700' },

//   // Medical Form card
//   medCard: {
//     backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 24,
//     borderWidth: 1.5, borderColor: '#C7D9FF',
//     shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
//   },
//   medCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
//   medCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   medIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   medTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
//   editBtn: {
//     backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//   },
//   editBtnTxt: { fontSize: 13, fontWeight: '700', color: '#FFF' },
//   medDesc: { fontSize: 13, color: C.textMid, lineHeight: 19 },
//   incompleteTag: { marginTop: 10, backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
//   incompleteTxt: { fontSize: 12, color: C.textMid, fontWeight: '600' },

//   // Section
//   section: { marginBottom: 24 },
//   sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

//   // Info card
//   infoCard: {
//     backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
//   },
//   infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
//   infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
//   infoContent: { flex: 1 },
//   infoLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 },
//   infoValue: { fontSize: 15, fontWeight: '600', color: C.textDark },
//   divider: { height: 1, backgroundColor: C.border, marginLeft: 68 },

//   // QR
//   qrRow: {
//     backgroundColor: C.surface, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
//   },
//   qrPreview: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   qrImg: { width: 40, height: 40, borderRadius: 8 },
//   qrText: { flex: 1 },
//   qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 3 },
//   qrSub: { fontSize: 12, color: C.textLight, lineHeight: 16 },
//   qrArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },

//   // Privacy
//   privCard: {
//     backgroundColor: C.successLight, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14,
//     borderWidth: 1, borderColor: '#A7F3D0',
//   },
//   privBody: { flex: 1 },
//   privTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 5 },
//   privDesc: { fontSize: 13, color: C.textMid, lineHeight: 19 },

//   // Modal
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
//   modal: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
//   modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   modalTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
//   modalClose: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   modalBody: { padding: 22, maxHeight: 500 },
//   modalFooterBtn: { margin: 22, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
//   modalFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
// });



// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TouchableOpacity,
//   Alert, Image, ImageSourcePropType, Modal, ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect, useRouter } from 'expo-router';
// import {
//   User, Mail, Phone, QrCode, CreditCard as Edit3, Shield,
//   Activity, Heart, Zap, Calendar, FileText, X, ChevronRight,
//   LogOut, RefreshCw,
// } from 'lucide-react-native';
// import ApiService from '../../services/api';
// import PatientMedicalForm from './patient-medicalForm';
// import { useAuth } from '../../contexts/AuthContext';

// const C = {
//   bg: '#F3F6FD',
//   surface: '#FFFFFF',
//   primary: '#1A56DB',
//   primaryLight: '#EBF2FF',
//   textDark: '#0D1B3E',
//   textMid: '#4A5A7A',
//   textLight: '#9AAABE',
//   border: '#DDE4F5',
//   success: '#059669',
//   successLight: '#ECFDF5',
//   danger: '#DC2626',
//   dangerLight: '#FEF2F2',
//   warning: '#D97706',
//   warningLight: '#FFFBEB',
// };

// interface UserData {
//   name: string; email: string; patientId: string;
//   bloodGroup?: string; isDiabetic?: boolean; diabetesType?: string;
//   hasThyroid?: boolean; thyroidCondition?: string; qrCode?: string;
//   dateOfBirth?: string; gender?: string; phone?: string;
//   hasMedicalForm?: boolean;
// }

// const calcAge = (dob: string) => {
//   if (!dob) return null;
//   try {
//     const d = new Date(dob);
//     const today = new Date();
//     let age = today.getFullYear() - d.getFullYear();
//     if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
//     return `${age} years`;
//   } catch {
//     return null;
//   }
// };

// export default function PatientProfile(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [formModal, setFormModal] = useState(false);
//   const [qrModalVisible, setQrModalVisible] = useState(false);
//   const router = useRouter();
//   const { logout } = useAuth();

//   useFocusEffect(
//     useCallback(() => {
//       loadUserData();
//     }, [])
//   );

//   const loadUserData = async () => {
//     try {
//       setLoading(true);
//       const res = await ApiService.getPatientProfile() as any;
//       if (res.success && res.data) {
//         setUserData(res.data);
//         await AsyncStorage.setItem('userData', JSON.stringify(res.data));
//       } else {
//         // Fallback to stored data
//         const stored = await AsyncStorage.getItem('userData');
//         if (stored) setUserData(JSON.parse(stored));
//       }
//     } catch (error) {
//       console.error('Error loading profile:', error);
//       const stored = await AsyncStorage.getItem('userData');
//       if (stored) setUserData(JSON.parse(stored));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadUserData();
//     setRefreshing(false);
//   };

//   const showQRCode = () => {
//     if (!userData?.qrCode) {
//       Alert.alert('QR Code', `Your QR code is being generated. Patient ID: ${userData?.patientId || 'N/A'}`);
//       return;
//     }
//     setQrModalVisible(true);
//   };

//   const handleLogout = () => {
//     Alert.alert(
//       'Sign Out',
//       'Are you sure you want to sign out?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Sign Out',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await logout();
//             } catch (error) {
//               Alert.alert('Error', 'Failed to sign out');
//             }
//           }
//         }
//       ]
//     );
//   };

//   const refreshQRCode = async () => {
//     try {
//       setLoading(true);
//       const res = await ApiService.refreshQRCode();
//       if (res.success) {
//         await loadUserData();
//         Alert.alert('Success', 'QR code refreshed successfully');
//       } else {
//         Alert.alert('Error', res.message || 'Failed to refresh QR code');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to refresh QR code');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';
//   const age = userData?.dateOfBirth ? calcAge(userData.dateOfBirth) : null;

//   if (loading) {
//     return (
//       <SafeAreaView style={s.root}>
//         <View style={s.loader}>
//           <ActivityIndicator size="large" color={C.primary} />
//           <Text style={s.loaderTxt}>Loading profile…</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const VITALS = [
//     { icon: Heart, label: 'Blood Group', value: userData?.bloodGroup || '—', color: C.danger, bg: C.dangerLight },
//     { icon: Activity, label: 'Diabetes', value: userData?.isDiabetic ? (userData.diabetesType || 'Yes') : 'No', color: C.success, bg: C.successLight },
//     { icon: Zap, label: 'Thyroid', value: userData?.hasThyroid ? (userData.thyroidCondition || 'Yes') : 'No', color: C.primary, bg: C.primaryLight },
//   ];

//   const INFO_ROWS = [
//     { icon: User, label: 'Full Name', value: userData?.name },
//     { icon: Mail, label: 'Email', value: userData?.email },
//     { icon: Phone, label: 'Phone', value: userData?.phone || 'Not provided' },
//     ...(age ? [{ icon: Calendar, label: 'Age', value: age }] : []),
//     ...(userData?.gender ? [{ icon: User, label: 'Gender', value: userData.gender }] : []),
//   ];

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
//       >

//         {/* ── Page header with logout ── */}
//         <View style={s.pageHeader}>
//           <Text style={s.pageTitle}>My Profile</Text>
//           <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
//             <LogOut size={20} color={C.danger} strokeWidth={2} />
//           </TouchableOpacity>
//         </View>

//         {/* ── Profile hero ── */}
//         <View style={s.hero}>
//           <View style={s.heroAvatar}>
//             <Text style={s.heroAvatarTxt}>{initials}</Text>
//           </View>
//           <Text style={s.heroName}>{userData?.name || 'Patient Name'}</Text>
//           <View style={s.heroBadge}>
//             <Text style={s.heroBadgeTxt}>ID: {userData?.patientId || '—'}</Text>
//           </View>
//           {userData?.gender && <Text style={s.heroGender}>{userData.gender}</Text>}
//         </View>

//         {/* ── Quick vitals ── */}
//         <View style={s.vitalsRow}>
//           {VITALS.map((v, i) => {
//             const Icon = v.icon;
//             return (
//               <View key={i} style={s.vitalCard}>
//                 <View style={[s.vitalIcon, { backgroundColor: v.bg }]}>
//                   <Icon size={18} color={v.color} strokeWidth={2} />
//                 </View>
//                 <Text style={s.vitalLabel}>{v.label}</Text>
//                 <Text style={[s.vitalValue, { color: v.color }]}>{v.value}</Text>
//               </View>
//             );
//           })}
//         </View>

//         {/* ── Medical Form ── */}
//         <View style={s.medCard}>
//           <View style={s.medCardHead}>
//             <View style={s.medCardLeft}>
//               <View style={s.medIcon}><FileText size={18} color={C.primary} strokeWidth={2} /></View>
//               <Text style={s.medTitle}>Medical Form</Text>
//             </View>
//             <TouchableOpacity style={s.editBtn} onPress={() => setFormModal(true)} activeOpacity={0.85}>
//               <Edit3 size={14} color="#FFF" strokeWidth={2} />
//               <Text style={s.editBtnTxt}>{userData?.hasMedicalForm ? 'Edit Form' : 'Complete'}</Text>
//             </TouchableOpacity>
//           </View>
//           <Text style={s.medDesc}>
//             {userData?.hasMedicalForm
//               ? 'Your medical information is on record. Keep it updated for accurate care.'
//               : 'Complete your medical form to help healthcare providers give you better care.'
//             }
//           </Text>
//           {!userData?.hasMedicalForm && (
//             <View style={s.incompleteTag}>
//               <Text style={s.incompleteTxt}>⚠ Form incomplete</Text>
//             </View>
//           )}
//         </View>

//         {/* ── Personal Information ── */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Personal Information</Text>
//           <View style={s.infoCard}>
//             {INFO_ROWS.map((row, i) => {
//               const Icon = row.icon;
//               return (
//                 <View key={i}>
//                   {i > 0 && <View style={s.divider} />}
//                   <View style={s.infoRow}>
//                     <View style={s.infoIconWrap}><Icon size={17} color={C.textLight} strokeWidth={2} /></View>
//                     <View style={s.infoContent}>
//                       <Text style={s.infoLabel}>{row.label}</Text>
//                       <Text style={s.infoValue}>{row.value || 'Not provided'}</Text>
//                     </View>
//                   </View>
//                 </View>
//               );
//             })}
//           </View>
//         </View>

//         {/* ── QR Code ── */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Health QR Code</Text>
//           <TouchableOpacity style={s.qrRow} onPress={showQRCode} activeOpacity={0.85}>
//             <View style={s.qrPreview}>
//               {userData?.qrCode
//                 ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrImg} resizeMode="contain" />
//                 : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
//               }
//             </View>
//             <View style={s.qrText}>
//               <Text style={s.qrTitle}>{userData?.qrCode ? 'View My QR Code' : 'Generate QR Code'}</Text>
//               <Text style={s.qrSub}>Let doctors instantly access your medical records</Text>
//             </View>
//             <View style={s.qrArrow}><ChevronRight size={16} color={C.primary} strokeWidth={2} /></View>
//           </TouchableOpacity>
//           {userData?.qrCode && (
//             <TouchableOpacity style={s.refreshQrBtn} onPress={refreshQRCode}>
//               <RefreshCw size={14} color={C.primary} strokeWidth={2} />
//               <Text style={s.refreshQrTxt}>Refresh QR Code</Text>
//             </TouchableOpacity>
//           )}
//         </View>

//         {/* ── Privacy ── */}
//         <View style={s.privCard}>
//           <View style={[s.medIcon, { backgroundColor: C.successLight }]}>
//             <Shield size={18} color={C.success} strokeWidth={2} />
//           </View>
//           <View style={s.privBody}>
//             <Text style={s.privTitle}>Your data is secure</Text>
//             <Text style={s.privDesc}>
//               All medical records are encrypted and only accessible to authorized healthcare providers.
//             </Text>
//           </View>
//         </View>

//       </ScrollView>

//       {/* Medical Form Modal */}
//       <Modal
//         animationType="slide"
//         transparent
//         visible={formModal}
//         onRequestClose={() => setFormModal(false)}
//       >
//         <View style={s.overlay}>
//           <View style={s.modal}>
//             <View style={s.modalHead}>
//               <Text style={s.modalTitle}>Medical Form</Text>
//               <TouchableOpacity onPress={() => setFormModal(false)} style={s.modalClose}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
//               <PatientMedicalForm
//                 onSave={() => {
//                   setFormModal(false);
//                   loadUserData();
//                 }}
//                 onClose={() => setFormModal(false)}
//               />
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* QR Code Full Screen Modal */}
//       <Modal
//         animationType="slide"
//         transparent={false}
//         visible={qrModalVisible}
//         onRequestClose={() => setQrModalVisible(false)}
//       >
//         <SafeAreaView style={s.qrFullScreen}>
//           <View style={s.qrFullHeader}>
//             <Text style={s.qrFullTitle}>Your Health QR Code</Text>
//             <TouchableOpacity onPress={() => setQrModalVisible(false)} style={s.qrFullClose}>
//               <X size={24} color={C.textDark} strokeWidth={2} />
//             </TouchableOpacity>
//           </View>
//           <View style={s.qrFullContent}>
//             {userData?.qrCode ? (
//               <Image
//                 source={{ uri: userData.qrCode } as ImageSourcePropType}
//                 style={s.qrFullImage}
//                 resizeMode="contain"
//               />
//             ) : (
//               <ActivityIndicator size="large" color={C.primary} />
//             )}
//             <Text style={s.qrFullName}>{userData?.name}</Text>
//             <Text style={s.qrFullId}>ID: {userData?.patientId}</Text>
//             <Text style={s.qrFullHint}>
//               Show this QR code to your doctor for instant access to your medical records
//             </Text>
//           </View>
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { paddingHorizontal: 20, paddingBottom: 40 },
//   loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   loaderTxt: { marginTop: 14, fontSize: 15, color: C.textMid },

//   pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
//   pageTitle: { fontSize: 28, fontWeight: '800', color: C.textDark, letterSpacing: -0.5 },
//   logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.dangerLight, alignItems: 'center', justifyContent: 'center' },

//   // Hero
//   hero: {
//     backgroundColor: C.surface, borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 4,
//   },
//   heroAvatar: {
//     width: 84, height: 84, borderRadius: 26, backgroundColor: C.primary,
//     alignItems: 'center', justifyContent: 'center', marginBottom: 14,
//     shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 5,
//   },
//   heroAvatarTxt: { fontSize: 28, fontWeight: '800', color: '#FFF' },
//   heroName: { fontSize: 22, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 8 },
//   heroBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 6 },
//   heroBadgeTxt: { fontSize: 13, fontWeight: '700', color: C.primary },
//   heroGender: { fontSize: 13, color: C.textLight, marginTop: 2 },

//   // Vitals
//   vitalsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   vitalCard: {
//     flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
//   },
//   vitalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   vitalLabel: { fontSize: 11, color: C.textLight, marginBottom: 3, fontWeight: '600' },
//   vitalValue: { fontSize: 14, fontWeight: '700' },

//   // Medical Form card
//   medCard: {
//     backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 24,
//     borderWidth: 1.5, borderColor: '#C7D9FF',
//     shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
//   },
//   medCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
//   medCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   medIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   medTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
//   editBtn: {
//     backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//   },
//   editBtnTxt: { fontSize: 13, fontWeight: '700', color: '#FFF' },
//   medDesc: { fontSize: 13, color: C.textMid, lineHeight: 19 },
//   incompleteTag: { marginTop: 10, backgroundColor: C.warningLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
//   incompleteTxt: { fontSize: 12, color: C.warning, fontWeight: '600' },

//   // Section
//   section: { marginBottom: 24 },
//   sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

//   // Info card
//   infoCard: {
//     backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
//   },
//   infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
//   infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
//   infoContent: { flex: 1 },
//   infoLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 },
//   infoValue: { fontSize: 15, fontWeight: '600', color: C.textDark },
//   divider: { height: 1, backgroundColor: C.border, marginLeft: 68 },

//   // QR
//   qrRow: {
//     backgroundColor: C.surface, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
//   },
//   qrPreview: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   qrImg: { width: 40, height: 40, borderRadius: 8 },
//   qrText: { flex: 1 },
//   qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 3 },
//   qrSub: { fontSize: 12, color: C.textLight, lineHeight: 16 },
//   qrArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   refreshQrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 10 },
//   refreshQrTxt: { fontSize: 13, color: C.primary, fontWeight: '600' },

//   // QR Full Screen Modal
//   qrFullScreen: { flex: 1, backgroundColor: C.bg },
//   qrFullHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//   qrFullTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
//   qrFullClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrFullContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
//   qrFullImage: { width: 280, height: 280, marginBottom: 32 },
//   qrFullName: { fontSize: 24, fontWeight: '700', color: C.textDark, marginBottom: 8 },
//   qrFullId: { fontSize: 16, color: C.textMid, marginBottom: 24 },
//   qrFullHint: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20 },

//   // Privacy
//   privCard: {
//     backgroundColor: C.successLight, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14,
//     borderWidth: 1, borderColor: '#A7F3D0',
//   },
//   privBody: { flex: 1 },
//   privTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 5 },
//   privDesc: { fontSize: 13, color: C.textMid, lineHeight: 19 },

//   // Modal
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
//   modal: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
//   modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   modalTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
//   modalClose: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   modalBody: { padding: 22, maxHeight: 500 },
//   modalFooterBtn: { margin: 22, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
//   modalFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
// });

import React, { useState, useEffect, useCallback, JSX } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ImageSourcePropType, Modal, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  User, Mail, Phone, QrCode, CreditCard as Edit3, Shield,
  Activity, Heart, Zap, Calendar, FileText, X, ChevronRight,
  LogOut, RefreshCw,
} from 'lucide-react-native';
import ApiService from '../../services/api';
import PatientMedicalForm from './patient-medicalForm';
import { useAuth } from '../../contexts/AuthContext';
import { sosService } from '../../services/SOSService';

const C = {
  bg: '#F3F6FD',
  surface: '#FFFFFF',
  primary: '#1A56DB',
  primaryLight: '#EBF2FF',
  textDark: '#0D1B3E',
  textMid: '#4A5A7A',
  textLight: '#9AAABE',
  border: '#DDE4F5',
  success: '#059669',
  successLight: '#ECFDF5',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  warning: '#D97706',
  warningLight: '#FFFBEB',
};

interface UserData {
  name: string; email: string; patientId: string;
  bloodGroup?: string; isDiabetic?: boolean; diabetesType?: string;
  hasThyroid?: boolean; thyroidCondition?: string; qrCode?: string;
  dateOfBirth?: string; gender?: string; phone?: string;
  hasMedicalForm?: boolean;
  emergencyContact?: { name: string; relationship: string; phone: string };
  allergies?: string[];
}

const calcAge = (dob: string) => {
  if (!dob) return null;
  try {
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
    return `${age} years`;
  } catch {
    return null;
  }
};

export default function PatientProfile(): JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  // Update SOS notification with latest profile data - ONLY if emergency contact exists
  const updateSOSFromProfile = async () => {
    try {
      const profile = await ApiService.getPatientProfile() as any;
      if (profile.success && profile.data && profile.data.patientId) {
        console.log('🔔 Updating SOS from profile...');
        console.log('🔔 Emergency Contact from profile:', profile.data.emergencyContact);

        // ONLY update if emergency contact exists and is not 'NA'
        if (profile.data.emergencyContact?.name && profile.data.emergencyContact.name !== 'NA') {
          await sosService.setupAfterFormSave({
            patientName: profile.data.name || '',
            patientId: profile.data.patientId || '',
            bloodGroup: profile.data.bloodGroup || '',
            allergies: profile.data.allergies || [],
            emergencyName: profile.data.emergencyContact.name,
            emergencyPhone: profile.data.emergencyContact.phone,
            chronicDiseases: profile.data.chronicDiseases || [],
            isDiabetic: profile.data.isDiabetic || false,
            qrCodeDataUri: profile.data.qrCode || '',
          });
          console.log('✅ SOS updated from profile successfully');
        } else {
          console.log('⚠️ Skipping SOS update - no emergency contact in profile');
        }
      }
    } catch (error) {
      console.error('Failed to update SOS from profile:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getPatientProfile() as any;
      if (res.success && res.data) {
        setUserData(res.data);
        await AsyncStorage.setItem('userData', JSON.stringify(res.data));

        // Update SOS notification ONLY if patient has medical form AND emergency contact
        if (res.data.hasMedicalForm && res.data.emergencyContact?.name && res.data.emergencyContact.name !== 'NA') {
          await updateSOSFromProfile();
        } else {
          console.log('⚠️ Skipping SOS update on profile load - no emergency contact');
        }
      } else {
        // Fallback to stored data
        const stored = await AsyncStorage.getItem('userData');
        if (stored) setUserData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const stored = await AsyncStorage.getItem('userData');
      if (stored) setUserData(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const showQRCode = () => {
    if (!userData?.qrCode) {
      Alert.alert('QR Code', `Your QR code is being generated. Patient ID: ${userData?.patientId || 'N/A'}`);
      return;
    }
    setQrModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const refreshQRCode = async () => {
    try {
      setLoading(true);
      const res = await ApiService.refreshQRCode();
      if (res.success) {
        await loadUserData();
        Alert.alert('Success', 'QR code refreshed successfully');
      } else {
        Alert.alert('Error', res.message || 'Failed to refresh QR code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh QR code');
    } finally {
      setLoading(false);
    }
  };

  const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';
  const age = userData?.dateOfBirth ? calcAge(userData.dateOfBirth) : null;

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loaderTxt}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const VITALS = [
    { icon: Heart, label: 'Blood Group', value: userData?.bloodGroup || '—', color: C.danger, bg: C.dangerLight },
    { icon: Activity, label: 'Diabetes', value: userData?.isDiabetic ? (userData.diabetesType || 'Yes') : 'No', color: C.success, bg: C.successLight },
    { icon: Zap, label: 'Thyroid', value: userData?.hasThyroid ? (userData.thyroidCondition || 'Yes') : 'No', color: C.primary, bg: C.primaryLight },
  ];

  const INFO_ROWS = [
    { icon: User, label: 'Full Name', value: userData?.name },
    { icon: Mail, label: 'Email', value: userData?.email },
    { icon: Phone, label: 'Phone', value: userData?.phone || 'Not provided' },
    ...(age ? [{ icon: Calendar, label: 'Age', value: age }] : []),
    ...(userData?.gender ? [{ icon: User, label: 'Gender', value: userData.gender }] : []),
  ];

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >

        {/* Page header with logout */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>My Profile</Text>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color={C.danger} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Profile hero */}
        <View style={s.hero}>
          <View style={s.heroAvatar}>
            <Text style={s.heroAvatarTxt}>{initials}</Text>
          </View>
          <Text style={s.heroName}>{userData?.name || 'Patient Name'}</Text>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeTxt}>ID: {userData?.patientId || '—'}</Text>
          </View>
          {userData?.gender && <Text style={s.heroGender}>{userData.gender}</Text>}
        </View>

        {/* Quick vitals */}
        <View style={s.vitalsRow}>
          {VITALS.map((v, i) => {
            const Icon = v.icon;
            return (
              <View key={i} style={s.vitalCard}>
                <View style={[s.vitalIcon, { backgroundColor: v.bg }]}>
                  <Icon size={18} color={v.color} strokeWidth={2} />
                </View>
                <Text style={s.vitalLabel}>{v.label}</Text>
                <Text style={[s.vitalValue, { color: v.color }]}>{v.value}</Text>
              </View>
            );
          })}
        </View>

        {/* Emergency Contact Display */}
        {userData?.emergencyContact?.name && userData.emergencyContact.name !== 'NA' && (
          <View style={[s.medCard, { borderColor: C.danger, backgroundColor: C.dangerLight }]}>
            <View style={s.medCardHead}>
              <View style={s.medCardLeft}>
                <View style={[s.medIcon, { backgroundColor: C.danger }]}><Phone size={18} color="#FFF" strokeWidth={2} /></View>
                <Text style={s.medTitle}>Emergency Contact</Text>
              </View>
            </View>
            <Text style={s.medDesc}>Name: {userData.emergencyContact.name}</Text>
            <Text style={s.medDesc}>Relationship: {userData.emergencyContact.relationship || 'Not specified'}</Text>
            <Text style={s.medDesc}>Phone: {userData.emergencyContact.phone || 'Not provided'}</Text>
          </View>
        )}

        {/* Medical Form */}
        <View style={s.medCard}>
          <View style={s.medCardHead}>
            <View style={s.medCardLeft}>
              <View style={s.medIcon}><FileText size={18} color={C.primary} strokeWidth={2} /></View>
              <Text style={s.medTitle}>Medical Form</Text>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => setFormModal(true)} activeOpacity={0.85}>
              <Edit3 size={14} color="#FFF" strokeWidth={2} />
              <Text style={s.editBtnTxt}>{userData?.hasMedicalForm ? 'Edit Form' : 'Complete'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.medDesc}>
            {userData?.hasMedicalForm
              ? 'Your medical information is on record. Keep it updated for accurate care.'
              : 'Complete your medical form to help healthcare providers give you better care.'
            }
          </Text>
          {!userData?.hasMedicalForm && (
            <View style={s.incompleteTag}>
              <Text style={s.incompleteTxt}>⚠ Form incomplete</Text>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Personal Information</Text>
          <View style={s.infoCard}>
            {INFO_ROWS.map((row, i) => {
              const Icon = row.icon;
              return (
                <View key={i}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.infoRow}>
                    <View style={s.infoIconWrap}><Icon size={17} color={C.textLight} strokeWidth={2} /></View>
                    <View style={s.infoContent}>
                      <Text style={s.infoLabel}>{row.label}</Text>
                      <Text style={s.infoValue}>{row.value || 'Not provided'}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* QR Code */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Health QR Code</Text>
          <TouchableOpacity style={s.qrRow} onPress={showQRCode} activeOpacity={0.85}>
            <View style={s.qrPreview}>
              {userData?.qrCode
                ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrImg} resizeMode="contain" />
                : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
              }
            </View>
            <View style={s.qrText}>
              <Text style={s.qrTitle}>{userData?.qrCode ? 'View My QR Code' : 'Generate QR Code'}</Text>
              <Text style={s.qrSub}>Let doctors instantly access your medical records</Text>
            </View>
            <View style={s.qrArrow}><ChevronRight size={16} color={C.primary} strokeWidth={2} /></View>
          </TouchableOpacity>
          {userData?.qrCode && (
            <TouchableOpacity style={s.refreshQrBtn} onPress={refreshQRCode}>
              <RefreshCw size={14} color={C.primary} strokeWidth={2} />
              <Text style={s.refreshQrTxt}>Refresh QR Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy */}
        <View style={s.privCard}>
          <View style={[s.medIcon, { backgroundColor: C.successLight }]}>
            <Shield size={18} color={C.success} strokeWidth={2} />
          </View>
          <View style={s.privBody}>
            <Text style={s.privTitle}>Your data is secure</Text>
            <Text style={s.privDesc}>
              All medical records are encrypted and only accessible to authorized healthcare providers.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Medical Form Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={formModal}
        onRequestClose={() => setFormModal(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Medical Form</Text>
              <TouchableOpacity onPress={() => setFormModal(false)} style={s.modalClose}>
                <X size={20} color={C.textMid} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              <PatientMedicalForm
                onSave={async () => {
                  setFormModal(false);
                  await loadUserData();
                  // Only update SOS if profile has emergency contact after form save
                  const profile = await ApiService.getPatientProfile() as any;
                  if (profile.data?.emergencyContact?.name && profile.data.emergencyContact.name !== 'NA') {
                    await updateSOSFromProfile();
                  } else {
                    console.log('⚠️ Skipping SOS update after form save - no emergency contact yet');
                  }
                }}
                onClose={() => setFormModal(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Code Full Screen Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <SafeAreaView style={s.qrFullScreen}>
          <View style={s.qrFullHeader}>
            <Text style={s.qrFullTitle}>Your Health QR Code</Text>
            <TouchableOpacity onPress={() => setQrModalVisible(false)} style={s.qrFullClose}>
              <X size={24} color={C.textDark} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={s.qrFullContent}>
            {userData?.qrCode ? (
              <Image
                source={{ uri: userData.qrCode } as ImageSourcePropType}
                style={s.qrFullImage}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator size="large" color={C.primary} />
            )}
            <Text style={s.qrFullName}>{userData?.name}</Text>
            <Text style={s.qrFullId}>ID: {userData?.patientId}</Text>
            <Text style={s.qrFullHint}>
              Show this QR code to your doctor for instant access to your medical records
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderTxt: { marginTop: 14, fontSize: 15, color: C.textMid },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: C.textDark, letterSpacing: -0.5 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.dangerLight, alignItems: 'center', justifyContent: 'center' },

  // Hero
  hero: {
    backgroundColor: C.surface, borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 4,
  },
  heroAvatar: {
    width: 84, height: 84, borderRadius: 26, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 5,
  },
  heroAvatarTxt: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  heroName: { fontSize: 22, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 8 },
  heroBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 6 },
  heroBadgeTxt: { fontSize: 13, fontWeight: '700', color: C.primary },
  heroGender: { fontSize: 13, color: C.textLight, marginTop: 2 },

  // Vitals
  vitalsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  vitalCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  vitalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  vitalLabel: { fontSize: 11, color: C.textLight, marginBottom: 3, fontWeight: '600' },
  vitalValue: { fontSize: 14, fontWeight: '700' },

  // Medical Form card
  medCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 24,
    borderWidth: 1.5, borderColor: '#C7D9FF',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  medCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  medCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  medTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  editBtn: {
    backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  editBtnTxt: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  medDesc: { fontSize: 13, color: C.textMid, lineHeight: 19 },
  incompleteTag: { marginTop: 10, backgroundColor: C.warningLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  incompleteTxt: { fontSize: 12, color: C.warning, fontWeight: '600' },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Info card
  infoCard: {
    backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: C.textDark },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 68 },

  // QR
  qrRow: {
    backgroundColor: C.surface, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  qrPreview: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  qrImg: { width: 40, height: 40, borderRadius: 8 },
  qrText: { flex: 1 },
  qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 3 },
  qrSub: { fontSize: 12, color: C.textLight, lineHeight: 16 },
  qrArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  refreshQrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 10 },
  refreshQrTxt: { fontSize: 13, color: C.primary, fontWeight: '600' },

  // QR Full Screen Modal
  qrFullScreen: { flex: 1, backgroundColor: C.bg },
  qrFullHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  qrFullTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
  qrFullClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qrFullContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  qrFullImage: { width: 280, height: 280, marginBottom: 32 },
  qrFullName: { fontSize: 24, fontWeight: '700', color: C.textDark, marginBottom: 8 },
  qrFullId: { fontSize: 16, color: C.textMid, marginBottom: 24 },
  qrFullHint: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20 },

  // Privacy
  privCard: {
    backgroundColor: C.successLight, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  privBody: { flex: 1 },
  privTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 5 },
  privDesc: { fontSize: 13, color: C.textMid, lineHeight: 19 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
  modalClose: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 22, maxHeight: 500 },
  modalFooterBtn: { margin: 22, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
});