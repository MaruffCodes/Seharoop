// /**
//  * SOS QR Screen — app/(tabs)/sos-qr.tsx
//  *
//  * This screen is shown when the user taps the Medical ID lock screen
//  * notification. It loads the QR from AsyncStorage (offline), so it works
//  * even without internet or even without logging in.
//  *
//  * Also accessible from the dashboard via the red SOS button.
//  */

// import React, { useState, useEffect } from 'react';
// import {
//     View, Text, StyleSheet, Image, ScrollView,
//     ActivityIndicator, TouchableOpacity, StatusBar,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { ArrowLeft, ShieldAlert, Phone, AlertTriangle, Heart } from 'lucide-react-native';
// import { sosService, SOSData } from '../services/SOSService';

// export default function SOSQRScreen() {
//     const [sosData, setSOSData] = useState<SOSData | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [noData, setNoData] = useState(false);
//     const router = useRouter();

//     useEffect(() => {
//         loadData();
//     }, []);

//     const loadData = async () => {
//         try {
//             const data = await sosService.loadSOSData();
//             if (data) {
//                 setSOSData(data);
//             } else {
//                 setNoData(true);
//             }
//         } catch {
//             setNoData(true);
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (loading) {
//         return (
//             <View style={s.centered}>
//                 <ActivityIndicator size="large" color="#DC2626" />
//                 <Text style={s.loadingTxt}>Loading Medical ID…</Text>
//             </View>
//         );
//     }

//     if (noData || !sosData) {
//         return (
//             <SafeAreaView style={s.root}>
//                 <View style={s.centered}>
//                     <ShieldAlert size={56} color="#DC2626" strokeWidth={1.5} />
//                     <Text style={s.noDataTitle}>No Medical ID Set Up</Text>
//                     <Text style={s.noDataSub}>
//                         Open the Seharoop app and complete your medical profile to enable the Medical ID.
//                     </Text>
//                 </View>
//             </SafeAreaView>
//         );
//     }

//     return (
//         <SafeAreaView style={s.root}>
//             <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

//             {/* ── Red emergency header ── */}
//             <View style={s.emergencyHeader}>
//                 <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
//                     <ArrowLeft size={20} color="#FFF" strokeWidth={2} />
//                 </TouchableOpacity>
//                 <View style={s.headerCenter}>
//                     <ShieldAlert size={20} color="#FFF" strokeWidth={2} />
//                     <Text style={s.headerTitle}>🆘 MEDICAL ID</Text>
//                 </View>
//                 <View style={{ width: 36 }} />
//             </View>

//             <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

//                 {/* ── Patient name + ID ── */}
//                 <View style={s.patientCard}>
//                     <Text style={s.patientName}>{sosData.patientName}</Text>
//                     <Text style={s.patientId}>ID: {sosData.patientId}</Text>
//                 </View>

//                 {/* ── QR Code — loaded from local storage, no internet ── */}
//                 <View style={s.qrCard}>
//                     <Text style={s.qrLabel}>Scan for Full Medical Summary</Text>
//                     {sosData.qrCodeData ? (
//                         <Image
//                             source={{ uri: sosData.qrCodeData }}
//                             style={s.qrImage}
//                             resizeMode="contain"
//                         />
//                     ) : (
//                         <View style={s.qrPlaceholder}>
//                             <Text style={s.qrPlaceholderTxt}>QR not available</Text>
//                         </View>
//                     )}
//                     <Text style={s.offlineBadge}>✅ Works offline — no internet needed</Text>
//                 </View>

//                 {/* ── Critical info cards ── */}
//                 <View style={s.criticalRow}>
//                     <View style={[s.critCard, { backgroundColor: '#FEF2F2' }]}>
//                         <Text style={s.critLabel}>Blood Group</Text>
//                         <Text style={[s.critValue, { color: '#DC2626', fontSize: 28 }]}>
//                             {sosData.bloodGroup || '?'}
//                         </Text>
//                     </View>
//                     <View style={[s.critCard, { backgroundColor: '#FFF7ED' }]}>
//                         <Text style={s.critLabel}>Diabetic</Text>
//                         <Text style={[s.critValue, { color: '#D97706' }]}>
//                             {sosData.isDiabetic ? 'YES' : 'NO'}
//                         </Text>
//                     </View>
//                 </View>

//                 {/* ── Allergies ── */}
//                 {sosData.allergies.length > 0 && (
//                     <View style={s.section}>
//                         <View style={s.sectionHead}>
//                             <AlertTriangle size={18} color="#DC2626" strokeWidth={2} />
//                             <Text style={[s.sectionTitle, { color: '#DC2626' }]}>ALLERGIES</Text>
//                         </View>
//                         {sosData.allergies.map((a, i) => (
//                             <Text key={i} style={s.allergyItem}>⚠️  {a}</Text>
//                         ))}
//                     </View>
//                 )}

//                 {/* ── Chronic diseases ── */}
//                 {sosData.chronicDiseases.length > 0 && (
//                     <View style={s.section}>
//                         <View style={s.sectionHead}>
//                             <Heart size={18} color="#7C3AED" strokeWidth={2} />
//                             <Text style={[s.sectionTitle, { color: '#7C3AED' }]}>CONDITIONS</Text>
//                         </View>
//                         {sosData.chronicDiseases.map((c, i) => (
//                             <Text key={i} style={s.conditionItem}>• {c}</Text>
//                         ))}
//                     </View>
//                 )}

//                 {/* ── Emergency contact ── */}
//                 {sosData.emergencyName && (
//                     <View style={[s.section, { backgroundColor: '#ECFDF5', borderRadius: 16 }]}>
//                         <View style={s.sectionHead}>
//                             <Phone size={18} color="#059669" strokeWidth={2} />
//                             <Text style={[s.sectionTitle, { color: '#059669' }]}>EMERGENCY CONTACT</Text>
//                         </View>
//                         <Text style={s.emergencyName}>{sosData.emergencyName}</Text>
//                         {sosData.emergencyPhone && (
//                             <Text style={s.emergencyPhone}>{sosData.emergencyPhone}</Text>
//                         )}
//                     </View>
//                 )}

//                 {/* ── Last updated ── */}
//                 <Text style={s.lastUpdated}>
//                     Last updated: {new Date(sosData.lastUpdated).toLocaleDateString('en-GB', {
//                         day: 'numeric', month: 'long', year: 'numeric',
//                         hour: '2-digit', minute: '2-digit',
//                     })}
//                 </Text>

//                 <View style={{ height: 32 }} />
//             </ScrollView>
//         </SafeAreaView>
//     );
// }

// const s = StyleSheet.create({
//     root: { flex: 1, backgroundColor: '#FFF' },
//     centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14, backgroundColor: '#FFF' },
//     loadingTxt: { fontSize: 15, color: '#64748B', marginTop: 8 },
//     noDataTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
//     noDataSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },

//     emergencyHeader: {
//         backgroundColor: '#DC2626',
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//         paddingHorizontal: 16, paddingVertical: 14,
//     },
//     backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
//     headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//     headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 1 },

//     scroll: { padding: 20 },

//     patientCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: '#DC2626' },
//     patientName: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
//     patientId: { fontSize: 13, color: '#64748B', fontWeight: '600' },

//     qrCard: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
//     qrLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
//     qrImage: { width: 220, height: 220, borderRadius: 12 },
//     qrPlaceholder: { width: 220, height: 220, backgroundColor: '#F1F5F9', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
//     qrPlaceholderTxt: { color: '#94A3B8', fontSize: 14 },
//     offlineBadge: { fontSize: 12, color: '#059669', fontWeight: '600', marginTop: 12 },

//     criticalRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
//     critCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
//     critLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
//     critValue: { fontSize: 22, fontWeight: '800', color: '#1E293B' },

//     section: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 16, marginBottom: 14 },
//     sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
//     sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
//     allergyItem: { fontSize: 15, color: '#DC2626', fontWeight: '600', marginBottom: 4 },
//     conditionItem: { fontSize: 15, color: '#4B5563', marginBottom: 4 },

//     emergencyName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
//     emergencyPhone: { fontSize: 15, color: '#059669', fontWeight: '600' },

//     lastUpdated: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
// });


/**
 * SOS QR Screen — app/(tabs)/sos-qr.tsx
 *
 * This screen is shown when the user taps the Medical ID lock screen
 * notification. It loads the QR from AsyncStorage (offline), so it works
 * even without internet or even without logging in.
 *
 * Also accessible from the dashboard via the red SOS button.
//  */
// import React, { useState, useEffect } from 'react';
// import {
//     View, Text, StyleSheet, ScrollView,
//     ActivityIndicator, TouchableOpacity, StatusBar,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { ArrowLeft, ShieldAlert, Phone, AlertTriangle, Heart } from 'lucide-react-native';
// import QRCode from 'react-native-qrcode-svg';
// import { sosService, SOSData } from '../services/SOSService';

// export default function SOSQRScreen() {
//     const [sosData, setSOSData] = useState<SOSData | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [noData, setNoData] = useState(false);
//     const router = useRouter();

//     useEffect(() => {
//         loadData();
//     }, []);

//     const loadData = async () => {
//         try {
//             const data = await sosService.loadSOSData();
//             if (data) {
//                 setSOSData(data);
//             } else {
//                 setNoData(true);
//             }
//         } catch {
//             setNoData(true);
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (loading) {
//         return (
//             <View style={s.centered}>
//                 <ActivityIndicator size="large" color="#DC2626" />
//                 <Text style={s.loadingTxt}>Loading Medical ID…</Text>
//             </View>
//         );
//     }

//     if (noData || !sosData) {
//         return (
//             <SafeAreaView style={s.root}>
//                 <View style={s.centered}>
//                     <ShieldAlert size={56} color="#DC2626" strokeWidth={1.5} />
//                     <Text style={s.noDataTitle}>No Medical ID Set Up</Text>
//                     <Text style={s.noDataSub}>
//                         Open the Seharoop app and complete your medical profile to enable the Medical ID.
//                     </Text>
//                 </View>
//             </SafeAreaView>
//         );
//     }

//     // Prepare QR code data
//     const qrValue = JSON.stringify({
//         patientId: sosData.patientId,
//         patientName: sosData.patientName,
//         bloodGroup: sosData.bloodGroup,
//         allergies: sosData.allergies,
//         emergencyContact: sosData.emergencyName,
//         timestamp: sosData.lastUpdated
//     });

//     return (
//         <SafeAreaView style={s.root}>
//             <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

//             {/* ── Red emergency header ── */}
//             <View style={s.emergencyHeader}>
//                 <TouchableOpacity onPress={() => router.replace('/(tabs)/patient-dashboard')} style={s.backBtn}>
//                     <ArrowLeft size={20} color="#FFF" strokeWidth={2} />
//                 </TouchableOpacity>
//                 <View style={s.headerCenter}>
//                     <ShieldAlert size={20} color="#FFF" strokeWidth={2} />
//                     <Text style={s.headerTitle}>🆘 MEDICAL ID</Text>
//                 </View>
//                 <View style={{ width: 36 }} />
//             </View>

//             <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

//                 {/* ── Patient name + ID ── */}
//                 <View style={s.patientCard}>
//                     <Text style={s.patientName}>{sosData.patientName}</Text>
//                     <Text style={s.patientId}>ID: {sosData.patientId}</Text>
//                 </View>

//                 {/* ── QR Code ── */}
//                 <View style={s.qrCard}>
//                     <Text style={s.qrLabel}>Scan for Full Medical Summary</Text>
//                     <View style={s.qrWrapper}>
//                         <QRCode
//                             value={qrValue}
//                             size={220}
//                             color="#000000"
//                             backgroundColor="#FFFFFF"
//                         />
//                     </View>
//                     <Text style={s.offlineBadge}>✅ Works offline — no internet needed</Text>
//                 </View>

//                 {/* ── Critical info cards ── */}
//                 <View style={s.criticalRow}>
//                     <View style={[s.critCard, { backgroundColor: '#FEF2F2' }]}>
//                         <Text style={s.critLabel}>Blood Group</Text>
//                         <Text style={[s.critValue, { color: '#DC2626', fontSize: 28 }]}>
//                             {sosData.bloodGroup || '?'}
//                         </Text>
//                     </View>
//                     <View style={[s.critCard, { backgroundColor: '#FFF7ED' }]}>
//                         <Text style={s.critLabel}>Diabetic</Text>
//                         <Text style={[s.critValue, { color: '#D97706' }]}>
//                             {sosData.isDiabetic ? 'YES' : 'NO'}
//                         </Text>
//                     </View>
//                 </View>

//                 {/* ── Allergies ── */}
//                 {sosData.allergies.length > 0 && (
//                     <View style={s.section}>
//                         <View style={s.sectionHead}>
//                             <AlertTriangle size={18} color="#DC2626" strokeWidth={2} />
//                             <Text style={[s.sectionTitle, { color: '#DC2626' }]}>ALLERGIES</Text>
//                         </View>
//                         {sosData.allergies.map((a, i) => (
//                             <Text key={i} style={s.allergyItem}>⚠️  {a}</Text>
//                         ))}
//                     </View>
//                 )}

//                 {/* ── Chronic diseases ── */}
//                 {sosData.chronicDiseases.length > 0 && (
//                     <View style={s.section}>
//                         <View style={s.sectionHead}>
//                             <Heart size={18} color="#7C3AED" strokeWidth={2} />
//                             <Text style={[s.sectionTitle, { color: '#7C3AED' }]}>CONDITIONS</Text>
//                         </View>
//                         {sosData.chronicDiseases.map((c, i) => (
//                             <Text key={i} style={s.conditionItem}>• {c}</Text>
//                         ))}
//                     </View>
//                 )}

//                 {/* ── Emergency contact ── */}
//                 {sosData.emergencyName && (
//                     <View style={[s.section, { backgroundColor: '#ECFDF5', borderRadius: 16 }]}>
//                         <View style={s.sectionHead}>
//                             <Phone size={18} color="#059669" strokeWidth={2} />
//                             <Text style={[s.sectionTitle, { color: '#059669' }]}>EMERGENCY CONTACT</Text>
//                         </View>
//                         <Text style={s.emergencyName}>{sosData.emergencyName}</Text>
//                         {sosData.emergencyPhone && (
//                             <Text style={s.emergencyPhone}>{sosData.emergencyPhone}</Text>
//                         )}
//                     </View>
//                 )}

//                 {/* ── Last updated ── */}
//                 <Text style={s.lastUpdated}>
//                     Last updated: {new Date(sosData.lastUpdated).toLocaleDateString('en-GB', {
//                         day: 'numeric', month: 'long', year: 'numeric',
//                         hour: '2-digit', minute: '2-digit',
//                     })}
//                 </Text>

//                 <View style={{ height: 32 }} />
//             </ScrollView>
//         </SafeAreaView>
//     );
// }

// const s = StyleSheet.create({
//     root: { flex: 1, backgroundColor: '#FFF' },
//     centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14, backgroundColor: '#FFF' },
//     loadingTxt: { fontSize: 15, color: '#64748B', marginTop: 8 },
//     noDataTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
//     noDataSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },

//     emergencyHeader: {
//         backgroundColor: '#DC2626',
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//         paddingHorizontal: 16, paddingVertical: 14,
//     },
//     backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
//     headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//     headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 1 },

//     scroll: { padding: 20 },

//     patientCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: '#DC2626' },
//     patientName: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
//     patientId: { fontSize: 13, color: '#64748B', fontWeight: '600' },

//     qrCard: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
//     qrLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
//     qrWrapper: { padding: 12, backgroundColor: '#FFF', borderRadius: 12 },
//     offlineBadge: { fontSize: 12, color: '#059669', fontWeight: '600', marginTop: 12 },

//     criticalRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
//     critCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
//     critLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
//     critValue: { fontSize: 22, fontWeight: '800', color: '#1E293B' },

//     section: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 16, marginBottom: 14 },
//     sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
//     sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
//     allergyItem: { fontSize: 15, color: '#DC2626', fontWeight: '600', marginBottom: 4 },
//     conditionItem: { fontSize: 15, color: '#4B5563', marginBottom: 4 },

//     emergencyName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
//     emergencyPhone: { fontSize: 15, color: '#059669', fontWeight: '600' },

//     lastUpdated: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
// });


import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldAlert, Phone, AlertTriangle, Heart } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { sosService, SOSData } from '../services/SOSService';

export default function SOSQRScreen() {
    const [sosData, setSOSData] = useState<SOSData | null>(null);
    const [loading, setLoading] = useState(true);
    const [noData, setNoData] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await sosService.loadSOSData();
            if (data && data.patientId) {
                setSOSData(data);
                console.log('📱 Loaded SOS data for patient:', data.patientName, 'ID:', data.patientId);
            } else {
                setNoData(true);
            }
        } catch (error) {
            console.error('Error loading SOS data:', error);
            setNoData(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color="#DC2626" />
                <Text style={s.loadingTxt}>Loading Medical ID…</Text>
            </View>
        );
    }

    if (noData || !sosData) {
        return (
            <SafeAreaView style={s.root}>
                <View style={s.centered}>
                    <ShieldAlert size={56} color="#DC2626" strokeWidth={1.5} />
                    <Text style={s.noDataTitle}>No Medical ID Set Up</Text>
                    <Text style={s.noDataSub}>
                        Open the Seharoop app and complete your medical profile to enable the Medical ID.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Prepare QR code data with current patient info
    const qrValue = JSON.stringify({
        patientId: sosData.patientId,
        patientName: sosData.patientName,
        bloodGroup: sosData.bloodGroup,
        allergies: sosData.allergies,
        emergencyContact: sosData.emergencyName,
        emergencyPhone: sosData.emergencyPhone,
        isDiabetic: sosData.isDiabetic,
        timestamp: sosData.lastUpdated
    });

    return (
        <SafeAreaView style={s.root}>
            <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

            {/* Red emergency header */}
            <View style={s.emergencyHeader}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/patient-dashboard')} style={s.backBtn}>
                    <ArrowLeft size={20} color="#FFF" strokeWidth={2} />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <ShieldAlert size={20} color="#FFF" strokeWidth={2} />
                    <Text style={s.headerTitle}>🆘 MEDICAL ID</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Patient name + ID */}
                <View style={s.patientCard}>
                    <Text style={s.patientName}>{sosData.patientName}</Text>
                    <Text style={s.patientId}>ID: {sosData.patientId}</Text>
                </View>

                {/* QR Code - dynamically generated for current patient */}
                <View style={s.qrCard}>
                    <Text style={s.qrLabel}>Scan for Full Medical Summary</Text>
                    <View style={s.qrWrapper}>
                        <QRCode
                            value={qrValue}
                            size={220}
                            color="#000000"
                            backgroundColor="#FFFFFF"
                        />
                    </View>
                    <Text style={s.offlineBadge}>✅ Works offline — no internet needed</Text>
                </View>

                {/* Critical info cards */}
                <View style={s.criticalRow}>
                    <View style={[s.critCard, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={s.critLabel}>Blood Group</Text>
                        <Text style={[s.critValue, { color: '#DC2626', fontSize: 28 }]}>
                            {sosData.bloodGroup || '?'}
                        </Text>
                    </View>
                    <View style={[s.critCard, { backgroundColor: '#FFF7ED' }]}>
                        <Text style={s.critLabel}>Diabetic</Text>
                        <Text style={[s.critValue, { color: '#D97706' }]}>
                            {sosData.isDiabetic ? 'YES' : 'NO'}
                        </Text>
                    </View>
                </View>

                {/* Emergency Contact - prominently displayed */}
                {sosData.emergencyName && (
                    <View style={[s.section, { backgroundColor: '#ECFDF5', borderRadius: 16 }]}>
                        <View style={s.sectionHead}>
                            <Phone size={18} color="#059669" strokeWidth={2} />
                            <Text style={[s.sectionTitle, { color: '#059669' }]}>EMERGENCY CONTACT</Text>
                        </View>
                        <Text style={s.emergencyName}>{sosData.emergencyName}</Text>
                        {sosData.emergencyPhone && (
                            <Text style={s.emergencyPhone}>{sosData.emergencyPhone}</Text>
                        )}
                    </View>
                )}

                {/* Allergies */}
                {sosData.allergies.length > 0 && (
                    <View style={s.section}>
                        <View style={s.sectionHead}>
                            <AlertTriangle size={18} color="#DC2626" strokeWidth={2} />
                            <Text style={[s.sectionTitle, { color: '#DC2626' }]}>ALLERGIES</Text>
                        </View>
                        {sosData.allergies.map((a, i) => (
                            <Text key={i} style={s.allergyItem}>⚠️  {a}</Text>
                        ))}
                    </View>
                )}

                {/* Chronic diseases */}
                {sosData.chronicDiseases.length > 0 && (
                    <View style={s.section}>
                        <View style={s.sectionHead}>
                            <Heart size={18} color="#7C3AED" strokeWidth={2} />
                            <Text style={[s.sectionTitle, { color: '#7C3AED' }]}>CONDITIONS</Text>
                        </View>
                        {sosData.chronicDiseases.map((c, i) => (
                            <Text key={i} style={s.conditionItem}>• {c}</Text>
                        ))}
                    </View>
                )}

                {/* Last updated */}
                <Text style={s.lastUpdated}>
                    Last updated: {new Date(sosData.lastUpdated).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                    })}
                </Text>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14, backgroundColor: '#FFF' },
    loadingTxt: { fontSize: 15, color: '#64748B', marginTop: 8 },
    noDataTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
    noDataSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },

    emergencyHeader: {
        backgroundColor: '#DC2626',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 1 },

    scroll: { padding: 20 },

    patientCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: '#DC2626' },
    patientName: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    patientId: { fontSize: 13, color: '#64748B', fontWeight: '600' },

    qrCard: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    qrLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    qrWrapper: { padding: 12, backgroundColor: '#FFF', borderRadius: 12 },
    offlineBadge: { fontSize: 12, color: '#059669', fontWeight: '600', marginTop: 12 },

    criticalRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    critCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
    critLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    critValue: { fontSize: 22, fontWeight: '800', color: '#1E293B' },

    section: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 16, marginBottom: 14 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    allergyItem: { fontSize: 15, color: '#DC2626', fontWeight: '600', marginBottom: 4 },
    conditionItem: { fontSize: 15, color: '#4B5563', marginBottom: 4 },

    emergencyName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    emergencyPhone: { fontSize: 15, color: '#059669', fontWeight: '600' },

    lastUpdated: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});