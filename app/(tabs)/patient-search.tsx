// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   Image,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { Search, User, MapPin, Phone, Mail, Calendar, QrCode, X, Camera as CameraIcon } from 'lucide-react-native';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import ApiService from '../../services/api';


// interface Patient {
//   _id: string;
//   patientId: string;
//   name: string;
//   email: string;
//   bloodGroup?: string;
//   phone?: string;
//   address?: string | {
//     street?: string;
//     city?: string;
//     pincode?: string;
//     state?: string;
//     country?: string;
//   };
//   qrCode?: string;
// }

// export default function PatientSearch() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<Patient[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [scanning, setScanning] = useState(false);
//   const [scanned, setScanned] = useState(false);
//   const router = useRouter();

//   const [permission, requestPermission] = useCameraPermissions();

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) {
//       Alert.alert('Error', 'Please enter a patient ID or name');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await ApiService.searchPatient(searchQuery);
//       if (response.success) {
//         setSearchResults(response.data || []);
//         if (response.data?.length === 0) {
//           Alert.alert('No Results', 'No patients found matching your search');
//         }
//       }
//     } catch (error) {
//       console.error('Search error:', error);
//       Alert.alert('Error', 'Failed to search patients');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
//     setScanned(true);
//     setScanning(false);

//     setLoading(true);
//     try {
//       // Safely extract the patient ID from the QR JSON to prevent sending massive URLs
//       let extractedId = data;
//       try {
//         const parsed = JSON.parse(data);
//         extractedId = parsed.pid || parsed.patientId || data;
//       } catch (e) {
//         // If it's not JSON, assume the raw string is the ID
//       }

//       // Hit the dedicated QR endpoint so the patient is added to the doctor's list
//       const response = await ApiService.getPatientByQR(String(extractedId).trim());
      
//       if (response.success && response.data) {
//         setSearchResults([response.data]);
//         setSearchQuery(response.data.patientId); // Update the search bar text
//         Alert.alert('Patient Found', `Successfully scanned ${response.data.name}.`);
//       } else {
//         Alert.alert('Scan Failed', 'Could not find a patient for this QR code.');
//       }
//     } catch (error: any) {
//       console.error('QR Scan error:', error);
//       Alert.alert('Error', error.message || 'Failed to process QR code. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const viewPatientSummary = (patientId: string) => {
//     router.push({
//       pathname: '/(tabs)/patient-summary',
//       params: { patientId }
//     });
//   };

//   const renderPatientCard = (patient: Patient) => {
//     // Safely access address fields
//     let addressString = 'Address not available';
//     if (typeof patient.address === 'string') {
//       addressString = patient.address;
//     } else if (patient.address && typeof patient.address === 'object') {
//       const { street, city,pincode ,state } = patient.address;
//       const addressParts = [street, city,pincode, state].filter(Boolean);
//       if (addressParts.length > 0) {
//         addressString = addressParts.join(', ');
//       }
//     }

//     return (
//       <TouchableOpacity
//         key={patient._id}
//         style={styles.patientCard}
//         onPress={() => viewPatientSummary(patient.patientId)}
//       >
//         <View style={styles.patientHeader}>
//           <View style={styles.avatar}>
//             <User size={24} color="#FFFFFF" />
//           </View>
//           <View style={styles.patientInfo}>
//             <Text style={styles.patientName}>{patient.name}</Text>
//             <Text style={styles.patientId}>ID: {patient.patientId}</Text>
//           </View>
//           {patient.bloodGroup && (
//             <View style={styles.bloodGroupBadge}>
//               <Text style={styles.bloodGroupText}>{patient.bloodGroup}</Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.patientDetails}>
//           {patient.email && (
//             <View style={styles.detailRow}>
//               <Mail size={16} color="#64748B" />
//               <Text style={styles.detailText}>{patient.email}</Text>
//             </View>
//           )}

//           {patient.phone && (
//             <View style={styles.detailRow}>
//               <Phone size={16} color="#64748B" />
//               <Text style={styles.detailText}>{patient.phone}</Text>
//             </View>
//           )}

//           <View style={styles.detailRow}>
//             <MapPin size={16} color="#64748B" />
//             <Text style={styles.detailText}>{addressString}</Text>
//           </View>
//         </View>

//         <View style={styles.cardFooter}>
//           <TouchableOpacity
//             style={styles.viewButton}
//             onPress={() => viewPatientSummary(patient.patientId)}
//           >
//             <Text style={styles.viewButtonText}>View Medical Summary</Text>
//           </TouchableOpacity>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   if (scanning) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity style={styles.backButton} onPress={() => setScanning(false)}>
//             <X size={24} color="#2563EB" />
//           </TouchableOpacity>
//           <Text style={styles.title}>Scan Patient QR</Text>
//           <View style={styles.placeholder} />
//         </View>

//         {!permission ? (
//           <View style={styles.centerContent}>
//             <Text>Requesting camera permission...</Text>
//           </View>
//         ) : !permission.granted ? (
//           <View style={styles.centerContent}>
//             <Text>No access to camera</Text>
//             <TouchableOpacity style={styles.button} onPress={requestPermission}>
//               <Text style={styles.buttonText}>Grant Permission</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <View style={styles.cameraContainer}>
//             <CameraView
//               style={styles.camera}
//               onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
//               barcodeScannerSettings={{
//                 barcodeTypes: ['qr'],
//               }}
//             />
//             <View style={styles.scannerOverlay}>
//               <View style={styles.scannerFrame} />
//               <Text style={styles.scannerText}>Align QR code within the frame</Text>
//             </View>
//             {scanned && (
//               <TouchableOpacity
//                 style={styles.scanAgainButton}
//                 onPress={() => setScanned(false)}
//               >
//                 <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Patient Search</Text>
//         <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
//           <CameraIcon size={20} color="#2563EB" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.searchContainer}>
//         <View style={styles.searchInputContainer}>
//           <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by Patient ID or Name"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             onSubmitEditing={handleSearch}
//             returnKeyType="search"
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <X size={20} color="#9CA3AF" />
//             </TouchableOpacity>
//           )}
//         </View>
//         <TouchableOpacity
//           style={[styles.searchButton, loading && styles.searchButtonDisabled]}
//           onPress={handleSearch}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator size="small" color="#FFFFFF" />
//           ) : (
//             <Text style={styles.searchButtonText}>Search</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       <ScrollView style={styles.resultsContainer}>
//         {searchResults.length > 0 ? (
//           searchResults.map(renderPatientCard)
//         ) : (
//           <View style={styles.emptyState}>
//             <User size={48} color="#9CA3AF" />
//             <Text style={styles.emptyStateTitle}>No Patients Found</Text>
//             <Text style={styles.emptyStateText}>
//               Search by patient ID or name to view medical records
//             </Text>
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1E293B',
//   },
//   scanButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#EFF6FF',
//   },
//   backButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#EFF6FF',
//   },
//   placeholder: {
//     width: 40,
//   },
//   searchContainer: {
//     padding: 20,
//     flexDirection: 'row',
//     gap: 12,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#1E293B',
//   },
//   searchButton: {
//     backgroundColor: '#2563EB',
//     paddingHorizontal: 20,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   searchButtonDisabled: {
//     backgroundColor: '#9CA3AF',
//   },
//   searchButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   resultsContainer: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },
//   patientCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   patientHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#2563EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   patientInfo: {
//     flex: 1,
//   },
//   patientName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1E293B',
//   },
//   patientId: {
//     fontSize: 14,
//     color: '#64748B',
//     marginTop: 2,
//   },
//   bloodGroupBadge: {
//     backgroundColor: '#EFF6FF',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 16,
//   },
//   bloodGroupText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#2563EB',
//   },
//   patientDetails: {
//     marginBottom: 16,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//     gap: 8,
//   },
//   detailText: {
//     fontSize: 14,
//     color: '#4B5563',
//     flex: 1,
//   },
//   cardFooter: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   viewButton: {
//     backgroundColor: '#EFF6FF',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   viewButtonText: {
//     color: '#2563EB',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 48,
//   },
//   emptyStateTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#6B7280',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateText: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     textAlign: 'center',
//   },
//   centerContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   button: {
//     backgroundColor: '#2563EB',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginTop: 16,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   cameraContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   camera: {
//     flex: 1,
//   },
//   scannerOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.3)',
//   },
//   scannerFrame: {
//     width: 250,
//     height: 250,
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//     borderRadius: 12,
//     backgroundColor: 'transparent',
//   },
//   scannerText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     marginTop: 20,
//     textAlign: 'center',
//   },
//   scanAgainButton: {
//     position: 'absolute',
//     bottom: 40,
//     alignSelf: 'center',
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   scanAgainText: {
//     color: '#2563EB',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, User, MapPin, Phone, Mail, QrCode, X, Camera as CameraIcon, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ApiService from '../../services/api';

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
};

interface Patient {
  _id: string; patientId: string; name: string; email: string;
  bloodGroup?: string; phone?: string;
  address?: string | { street?: string; city?: string; pincode?: string; state?: string; };
  qrCode?: string;
}

const formatAddress = (addr: Patient['address']) => {
  if (!addr) return null;
  if (typeof addr === 'string') return addr;
  const parts = [addr.street, addr.city, addr.pincode, addr.state].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
};

export default function PatientSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const handleSearch = async () => {
    if (!searchQuery.trim()) { Alert.alert('Empty Search', 'Please enter a patient ID or name.'); return; }
    setLoading(true);
    try {
      const res = await ApiService.searchPatient(searchQuery);
      if (res.success) {
        setSearchResults(res.data || []);
        if (!res.data?.length) Alert.alert('No Results', 'No patients found matching your search.');
      }
    } catch { Alert.alert('Error', 'Failed to search patients.'); } finally { setLoading(false); }
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true); setScanning(false); setLoading(true);
    try {
      let id = data;
      try { const parsed = JSON.parse(data); id = parsed.pid || parsed.patientId || data; } catch { }
      const res = await ApiService.getPatientByQR(String(id).trim());
      if (res.success && res.data) {
        setSearchResults([res.data]);
        setSearchQuery(res.data.patientId);
        Alert.alert('Patient Found', `Successfully scanned ${res.data.name}.`);
      } else {
        Alert.alert('Scan Failed', 'Could not find a patient for this QR code.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to process QR code.');
    } finally { setLoading(false); }
  };

  const viewSummary = (patientId: string) => router.push({ pathname: '/(tabs)/patient-summary', params: { patientId } });

  // ── QR Scanner view ───────────────────────────────────────────────
  if (scanning) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.scanHeader}>
          <TouchableOpacity style={s.scanBack} onPress={() => setScanning(false)} activeOpacity={0.8}>
            <ArrowLeft size={20} color={C.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.scanTitle}>Scan Patient QR</Text>
          <View style={{ width: 42 }} />
        </View>

        {!permission ? (
          <View style={s.center}><Text style={s.centerTxt}>Requesting camera permission…</Text></View>
        ) : !permission.granted ? (
          <View style={s.center}>
            <View style={s.permIcon}><CameraIcon size={36} color={C.textLight} strokeWidth={1.5} /></View>
            <Text style={s.centerTitle}>Camera Access Needed</Text>
            <Text style={s.centerSub}>Allow camera access to scan patient QR codes</Text>
            <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={s.permBtnTxt}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.cameraWrap}>
            <CameraView
              style={s.camera}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={s.scanOverlay}>
              <Text style={s.scanHint}>Position QR code within the frame</Text>
              <View style={s.scanFrame}>
                <View style={[s.corner, s.cornerTL]} />
                <View style={[s.corner, s.cornerTR]} />
                <View style={[s.corner, s.cornerBL]} />
                <View style={[s.corner, s.cornerBR]} />
              </View>
              {scanned && (
                <TouchableOpacity style={s.rescanBtn} onPress={() => setScanned(false)} activeOpacity={0.85}>
                  <Text style={s.rescanTxt}>Tap to scan again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── Main search view ──────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Patient Search</Text>
        <TouchableOpacity style={s.scanBtn} onPress={() => setScanning(true)} activeOpacity={0.85}>
          <QrCode size={18} color={C.primary} strokeWidth={2} />
          <Text style={s.scanBtnTxt}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, inputFocused && s.searchBoxFocus]}>
          <Search size={18} color={C.textLight} strokeWidth={2} />
          <TextInput
            style={s.searchInp}
            placeholder="Search by ID or name…"
            placeholderTextColor={C.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={C.textLight} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.searchBtn, loading && s.searchBtnOff]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.searchBtnTxt}>Search</Text>}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={s.results} contentContainerStyle={s.resultsPad} showsVerticalScrollIndicator={false}>
        {searchResults.length > 0 ? (
          searchResults.map(patient => {
            const addr = formatAddress(patient.address);
            const initials = patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <TouchableOpacity
                key={patient._id}
                style={s.card}
                onPress={() => viewSummary(patient.patientId)}
                activeOpacity={0.88}
              >
                {/* Card header */}
                <View style={s.cardHead}>
                  <View style={s.cardAvatar}><Text style={s.cardAvatarTxt}>{initials}</Text></View>
                  <View style={s.cardHeadInfo}>
                    <Text style={s.cardName}>{patient.name}</Text>
                    <Text style={s.cardId}>ID: {patient.patientId}</Text>
                  </View>
                  {patient.bloodGroup && (
                    <View style={s.bloodBadge}><Text style={s.bloodTxt}>{patient.bloodGroup}</Text></View>
                  )}
                </View>

                {/* Details */}
                <View style={s.cardDetails}>
                  {patient.email && (
                    <View style={s.detailRow}>
                      <Mail size={13} color={C.textLight} strokeWidth={2} />
                      <Text style={s.detailTxt}>{patient.email}</Text>
                    </View>
                  )}
                  {patient.phone && (
                    <View style={s.detailRow}>
                      <Phone size={13} color={C.textLight} strokeWidth={2} />
                      <Text style={s.detailTxt}>{patient.phone}</Text>
                    </View>
                  )}
                  {addr && (
                    <View style={s.detailRow}>
                      <MapPin size={13} color={C.textLight} strokeWidth={2} />
                      <Text style={s.detailTxt} numberOfLines={1}>{addr}</Text>
                    </View>
                  )}
                </View>

                {/* CTA */}
                <TouchableOpacity style={s.viewBtn} onPress={() => viewSummary(patient.patientId)} activeOpacity={0.85}>
                  <Text style={s.viewBtnTxt}>View Medical Summary</Text>
                  <ChevronRight size={15} color={C.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <User size={36} color={C.textLight} strokeWidth={1.5} />
            </View>
            <Text style={s.emptyTitle}>No patients found</Text>
            <Text style={s.emptySub}>Search by patient ID or name to access medical records</Text>
            <TouchableOpacity style={s.qrHint} onPress={() => setScanning(true)} activeOpacity={0.85}>
              <QrCode size={15} color={C.primary} strokeWidth={2} />
              <Text style={s.qrHintTxt}>Or scan a patient's QR code</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 22;
const CORNER_BORDER = 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: C.textDark, letterSpacing: -0.3 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
  },
  scanBtnTxt: { fontSize: 13, fontWeight: '700', color: C.primary },

  // Search
  searchWrap: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14,
  },
  searchBoxFocus: { borderColor: C.primary, backgroundColor: C.surface },
  searchInp: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.textDark },
  searchBtn: {
    backgroundColor: C.primary, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.24, shadowRadius: 10, elevation: 4,
  },
  searchBtnOff: { backgroundColor: C.textLight, shadowOpacity: 0, elevation: 0 },
  searchBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Results
  results: { flex: 1 },
  resultsPad: { padding: 20, gap: 14 },

  // Patient card
  card: {
    backgroundColor: C.surface, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardAvatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardAvatarTxt: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  cardHeadInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  cardId: { fontSize: 12, color: C.textLight, fontWeight: '600' },
  bloodBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bloodTxt: { fontSize: 12, fontWeight: '700', color: C.primary },
  cardDetails: { gap: 7, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailTxt: { fontSize: 13, color: C.textMid, flex: 1 },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.primaryLight, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11,
  },
  viewBtnTxt: { fontSize: 14, fontWeight: '700', color: C.primary },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textMid, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  qrHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  qrHintTxt: { fontSize: 13, fontWeight: '700', color: C.primary },

  // Scanner
  scanHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  scanBack: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },

  cameraWrap: { flex: 1 },
  camera: { flex: 1 },
  scanOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  scanHint: { color: '#FFF', fontSize: 14, marginBottom: 28, fontWeight: '500', opacity: 0.85 },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#FFF', borderWidth: CORNER_BORDER },
  cornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },
  rescanBtn: { position: 'absolute', bottom: 40, backgroundColor: '#FFF', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14 },
  rescanTxt: { color: C.primary, fontSize: 15, fontWeight: '700' },

  // Permission
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerTxt: { fontSize: 15, color: C.textMid },
  permIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: C.textDark, marginBottom: 8 },
  centerSub: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  permBtn: { backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  permBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
