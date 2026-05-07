// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
//   Image, ImageSourcePropType, Modal, ActivityIndicator, RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   Upload, FileText, Camera, LogOut, QrCode, Calendar, Activity,
//   Clock, ChevronRight, X, Eye, Bell, ShieldAlert, RefreshCw,
// } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as ImagePicker from 'expo-image-picker';
// import * as WebBrowser from 'expo-web-browser';
// import { shareAsync } from 'expo-sharing';
// import ApiService, { BASE_URL } from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext';

// // ── Design tokens ──────────────────────────────────────────────────────
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

// // ── Types ──────────────────────────────────────────────────────────────
// interface UserData { name: string; email: string; patientId: string; qrCode?: string; bloodGroup?: string; hasMedicalForm?: boolean; }
// interface Document { id: string; name: string; uri: string; type: string; size: number; uploadDate: string; status: 'processing' | 'processed' | 'failed'; extractedData?: any; }
// interface TimelineEvent { id: string; type: string; title: string; description: string; date: string; documentId?: string; documentName?: string; documentUri?: string; }
// interface AppNotification { _id: string; message: string; date: string; read: boolean; }
// interface Stats { documents: number; diagnoses: number; reports: number; }
// interface ApiFile { uri: string; type: string; name: string; size?: number; }

// const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'image/jpg'];
// const ALLOWED_EXT = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

// const typeColor = (type: string) => {
//   switch (type) {
//     case 'diagnosis': return { icon: C.danger, bg: C.dangerLight };
//     case 'medication': return { icon: C.success, bg: C.successLight };
//     case 'lab': return { icon: C.primary, bg: C.primaryLight };
//     case 'allergy': return { icon: C.warning, bg: C.warningLight };
//     default: return { icon: C.textLight, bg: '#F1F5F9' };
//   }
// };

// export default function PatientDashboard(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
//   const [stats, setStats] = useState<Stats>({ documents: 0, diagnoses: 0, reports: 0 });
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [processingQueue, setProcessingQueue] = useState(false);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [showNotifications, setShowNotifications] = useState(false);

//   const router = useRouter();
//   const { completeFirstLogin } = useAuth();

//   useEffect(() => { loadUserData(); loadAllPatientData(); }, []);
//   useFocusEffect(useCallback(() => { loadNotifications(); }, []));

//   const loadUserData = async () => {
//     try {
//       const stored = await AsyncStorage.getItem('userData');
//       if (stored) setUserData(JSON.parse(stored));
//       const res = await ApiService.getPatientProfile() as any;
//       setUserData(res.data);
//       await AsyncStorage.setItem('userData', JSON.stringify(res.data));
//     } catch { }
//   };

//   const loadAllPatientData = async () => {
//     try {
//       setLoading(true);
//       const [summaryRes, historyRes] = await Promise.all([
//         ApiService.getPatientSummary() as any,
//         ApiService.getPatientHistory() as any,
//       ]);
//       if (historyRes.data?.medicalHistory) {
//         const docs: Document[] = [];
//         let dxCount = 0;
//         historyRes.data.medicalHistory.forEach((yr: any) =>
//           yr.months?.forEach((mo: any) =>
//             mo.records?.forEach((rec: any) =>
//               rec.documents?.forEach((doc: any) => {
//                 if (doc.extractedData?.diagnoses) dxCount += doc.extractedData.diagnoses.length;
//                 docs.push({
//                   id: doc._id || doc.filename, name: doc.originalName,
//                   uri: `${BASE_URL}/uploads/${doc.filename}`, type: doc.mimetype,
//                   size: doc.size, uploadDate: new Date(doc.uploadDate).toLocaleDateString(),
//                   status: doc.processingStatus === 'completed' ? 'processed' : doc.processingStatus === 'failed' ? 'failed' : 'processing',
//                   extractedData: doc.extractedData,
//                 });
//               })
//             )
//           )
//         );
//         setDocuments(docs);
//         setStats({ documents: docs.length, diagnoses: dxCount, reports: docs.length });

//         const events: TimelineEvent[] = [];
//         historyRes.data.medicalHistory.forEach((yr: any) =>
//           yr.months?.forEach((mo: any) =>
//             mo.records?.forEach((rec: any) => {
//               events.push({
//                 id: `${rec.date}-${rec.description}`, type: rec.type || 'upload',
//                 title: rec.description, description: `${mo.month} ${yr.year}`,
//                 date: new Date(rec.date).toISOString(),
//                 documentId: rec.documents[0]?._id, documentName: rec.documents[0]?.originalName,
//               });
//             })
//           )
//         );
//         events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
//         setTimeline(events);
//       }
//     } catch { } finally { setLoading(false); }
//   };

//   const loadNotifications = async () => {
//     try {
//       const res = await ApiService.getPatientNotifications();
//       if (res.success && res.data) setNotifications(res.data);
//     } catch { }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await Promise.all([loadAllPatientData(), loadNotifications()]);
//     setRefreshing(false);
//   };

//   const validateFile = (f: { name: string; mimeType?: string }) => {
//     if (f.mimeType && ALLOWED_TYPES.includes(f.mimeType)) return true;
//     return ALLOWED_EXT.includes(f.name.substring(f.name.lastIndexOf('.')).toLowerCase());
//   };

//   const handleFileUpload = async (file: ApiFile) => {
//     try {
//       setLoading(true);
//       if (!validateFile({ name: file.name, mimeType: file.type })) {
//         Alert.alert('Invalid File', 'Supported formats: PDF, TXT, DOCX, JPG, PNG'); return;
//       }
//       const temp: Document = { id: `temp-${Date.now()}`, name: file.name, uri: file.uri, type: file.type, size: file.size || 0, uploadDate: new Date().toLocaleDateString(), status: 'processing' };
//       setDocuments(p => [temp, ...p]);
//       const res = await ApiService.uploadFile(file, false);
//       if (res.success) {
//         Alert.alert('Processing', 'Your document is being processed.', [{ text: 'OK' }]);
//         await loadAllPatientData();
//         try { await ApiService.refreshAllSummaries(); } catch { }
//       } else {
//         setDocuments(p => p.filter(d => d.id !== temp.id));
//         Alert.alert('Error', res.message || 'Failed to upload document');
//       }
//     } catch { Alert.alert('Error', 'Failed to upload document.'); } finally { setLoading(false); }
//   };

//   const pickDocument = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (!res.canceled && res.assets?.[0]) {
//         const d = res.assets[0];
//         await handleFileUpload({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       }
//     } catch { Alert.alert('Error', 'Failed to pick document'); }
//   };

//   const takePhoto = async () => {
//     try {
//       const perm = await ImagePicker.requestCameraPermissionsAsync();
//       if (!perm.granted) { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
//       const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 }) as any;
//       if (!res.canceled && res.assets?.[0]) {
//         const p = res.assets[0];
//         await handleFileUpload({ uri: p.uri, type: 'image/jpeg', name: `Record_${new Date().toLocaleDateString().replace(/\//g, '-')}.jpg`, size: p.fileSize });
//       }
//     } catch { Alert.alert('Error', 'Failed to capture photo'); }
//   };

//   const viewDocument = async (doc: Document) => {
//     try {
//       if (doc.type.startsWith('image/')) { setSelectedDocument(doc); setModalVisible(true); return; }
//       await WebBrowser.openBrowserAsync(doc.uri.startsWith('file://') ? doc.uri : `${BASE_URL}/uploads/${doc.id}.${doc.name.split('.').pop()}`);
//     } catch { Alert.alert('Error', 'Could not open the document'); }
//   };

//   const handleLogout = () => {
//     Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Sign Out', style: 'destructive', onPress: async () => { try { setLoading(true); await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); } finally { setLoading(false); } } },
//     ]);
//   };

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
//         showsVerticalScrollIndicator={false}
//       >

//         {/* ── Header ── */}
//         <View style={s.header}>
//           <View style={s.headerRow}>
//             <View style={s.avatarRow}>
//               <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
//               <View>
//                 <Text style={s.greeting}>Hello, welcome back 👋</Text>
//                 <Text style={s.name}>{userData?.name || 'Patient'}</Text>
//                 <View style={s.idBadge}>
//                   <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
//                   {userData?.bloodGroup && <View style={s.bloodDot} />}
//                   {userData?.bloodGroup && <Text style={s.bloodText}>{userData.bloodGroup}</Text>}
//                 </View>
//               </View>
//             </View>
//             <View style={s.headerActions}>
//               <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifications(true)}>
//                 <Bell size={18} color={C.primary} strokeWidth={2} />
//                 {unreadCount > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>}
//               </TouchableOpacity>
//               <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}>
//                 <LogOut size={18} color={C.danger} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* ── Stats ── */}
//         <View style={s.statsRow}>
//           {[
//             { icon: FileText, val: stats.documents, label: 'Documents', color: C.primary, bg: C.primaryLight },
//             { icon: Activity, val: stats.diagnoses, label: 'Diagnoses', color: C.success, bg: C.successLight },
//             { icon: Calendar, val: stats.reports, label: 'Reports', color: C.warning, bg: C.warningLight },
//           ].map((item, i) => {
//             const Icon = item.icon;
//             return (
//               <View key={i} style={s.statCard}>
//                 <View style={[s.statIcon, { backgroundColor: item.bg }]}>
//                   <Icon size={18} color={item.color} strokeWidth={2} />
//                 </View>
//                 <Text style={s.statVal}>{item.val}</Text>
//                 <Text style={s.statLabel}>{item.label}</Text>
//               </View>
//             );
//           })}
//         </View>

//         {/* ── QR Code ── */}
//         <TouchableOpacity
//           style={s.qrCard}
//           activeOpacity={0.9}
//           onPress={() => {
//             if (userData?.qrCode) {
//               router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } });
//             } else {
//               Alert.alert('Info', 'QR code is being generated...');
//             }
//           }}
//         >
//           <View style={s.qrLeft}>
//             <View style={s.qrIconWrap}>
//               {userData?.qrCode
//                 ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" />
//                 : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
//               }
//             </View>
//             <View>
//               <Text style={s.qrTitle}>Your Health QR</Text>
//               <Text style={s.qrSub}>Tap to view full QR code</Text>
//             </View>
//           </View>
//           <View style={s.qrArrow}>
//             {processingQueue
//               ? <ActivityIndicator size="small" color={C.primary} />
//               : <ChevronRight size={18} color={C.primary} strokeWidth={2} />
//             }
//           </View>
//         </TouchableOpacity>

//         {/* ── Upload ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>Upload Documents</Text>
//             <Text style={s.sectionSub}>PDF, TXT, DOCX, Images</Text>
//           </View>
//           <View style={s.uploadRow}>
//             <TouchableOpacity style={[s.uploadBtn, loading && s.uploadBtnOff]} onPress={pickDocument} disabled={loading} activeOpacity={0.85}>
//               <View style={[s.uploadIcon, { backgroundColor: C.successLight }]}>
//                 <FileText size={22} color={C.success} strokeWidth={1.8} />
//               </View>
//               <Text style={s.uploadBtnTitle}>Select File</Text>
//               <Text style={s.uploadBtnSub}>PDF · DOCX · TXT</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={[s.uploadBtn, loading && s.uploadBtnOff]} onPress={takePhoto} disabled={loading} activeOpacity={0.85}>
//               <View style={[s.uploadIcon, { backgroundColor: C.primaryLight }]}>
//                 <Camera size={22} color={C.primary} strokeWidth={1.8} />
//               </View>
//               <Text style={s.uploadBtnTitle}>Take Photo</Text>
//               <Text style={s.uploadBtnSub}>Use Camera</Text>
//             </TouchableOpacity>
//           </View>
//           {loading && (
//             <View style={s.uploadingRow}>
//               <ActivityIndicator size="small" color={C.primary} />
//               <Text style={s.uploadingTxt}>Uploading document…</Text>
//             </View>
//           )}
//         </View>

//         {/* ── Documents ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>My Documents</Text>
//             <View style={s.countPill}><Text style={s.countTxt}>{documents.length}</Text></View>
//           </View>
//           {documents.length === 0 ? (
//             <View style={s.empty}>
//               <View style={s.emptyIcon}><Upload size={32} color={C.textLight} strokeWidth={1.5} /></View>
//               <Text style={s.emptyTitle}>No documents yet</Text>
//               <Text style={s.emptySub}>Upload your medical documents to get started</Text>
//             </View>
//           ) : (
//             <View style={s.docList}>
//               {documents.map(doc => (
//                 <TouchableOpacity key={doc.id} style={s.docCard} onPress={() => viewDocument(doc)} activeOpacity={0.85}>
//                   <View style={[s.docIcon, doc.type.startsWith('image/') ? {} : { backgroundColor: C.dangerLight }]}>
//                     {doc.type.startsWith('image/')
//                       ? <Image source={{ uri: doc.uri }} style={s.docThumb} />
//                       : <FileText size={20} color={C.danger} strokeWidth={2} />
//                     }
//                   </View>
//                   <View style={s.docInfo}>
//                     <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
//                     <Text style={s.docMeta}>
//                       {doc.uploadDate} · {(doc.size / 1024).toFixed(1)} KB
//                     </Text>
//                     {doc.status === 'processed' && doc.extractedData && (
//                       <View style={s.processedTag}>
//                         <Text style={s.processedTxt}>✓ Processed</Text>
//                       </View>
//                     )}
//                     {doc.status === 'processing' && (
//                       <View style={[s.processedTag, { backgroundColor: C.warningLight }]}>
//                         <Text style={[s.processedTxt, { color: C.warning }]}>⏳ Processing</Text>
//                       </View>
//                     )}
//                     {doc.status === 'failed' && (
//                       <View style={[s.processedTag, { backgroundColor: C.dangerLight }]}>
//                         <Text style={[s.processedTxt, { color: C.danger }]}>✕ Failed</Text>
//                       </View>
//                     )}
//                   </View>
//                   <ChevronRight size={16} color={C.textLight} strokeWidth={2} />
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}
//         </View>

//         {/* ── Timeline ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>Recent Timeline</Text>
//             <TouchableOpacity onPress={() => router.push('/(tabs)/patient-timeline' as any)}>
//               <Text style={s.seeAll}>See All</Text>
//             </TouchableOpacity>
//           </View>
//           {timeline.length === 0 ? (
//             <View style={s.empty}>
//               <View style={s.emptyIcon}><Clock size={32} color={C.textLight} strokeWidth={1.5} /></View>
//               <Text style={s.emptyTitle}>No timeline events</Text>
//               <Text style={s.emptySub}>Upload documents to build your medical timeline</Text>
//             </View>
//           ) : (
//             timeline.slice(0, 5).map(ev => {
//               const tc = typeColor(ev.type);
//               return (
//                 <TouchableOpacity
//                   key={ev.id}
//                   style={s.timelineCard}
//                   activeOpacity={0.85}
//                   onPress={() => { const d = documents.find(dd => dd.id === ev.documentId); if (d) viewDocument(d); }}
//                 >
//                   <View style={[s.tlIcon, { backgroundColor: tc.bg }]}>
//                     {ev.type === 'diagnosis' && <Activity size={14} color={tc.icon} strokeWidth={2} />}
//                     {ev.type === 'medication' && <FileText size={14} color={tc.icon} strokeWidth={2} />}
//                     {ev.type === 'lab' && <Activity size={14} color={tc.icon} strokeWidth={2} />}
//                     {!['diagnosis', 'medication', 'lab'].includes(ev.type) && <Clock size={14} color={tc.icon} strokeWidth={2} />}
//                   </View>
//                   <View style={s.tlContent}>
//                     <Text style={s.tlTitle} numberOfLines={1}>{ev.title}</Text>
//                     <Text style={s.tlDesc} numberOfLines={1}>{ev.description}</Text>
//                     <Text style={s.tlDate}>{new Date(ev.date).toLocaleDateString()} · {ev.documentName}</Text>
//                   </View>
//                   <ChevronRight size={14} color={C.textLight} strokeWidth={2} />
//                 </TouchableOpacity>
//               );
//             })
//           )}
//         </View>

//       </ScrollView>

//       {/* ── Doc Modal ── */}
//       <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
//         <View style={s.overlay}>
//           <View style={s.modal}>
//             <View style={s.modalHead}>
//               <Text style={s.modalTitle}>Document Details</Text>
//               <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalClose}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             {selectedDocument && (
//               <ScrollView style={s.modalBody}>
//                 <Text style={s.modalDocName}>{selectedDocument.name}</Text>
//                 <Text style={s.modalDocMeta}>{selectedDocument.uploadDate} · {(selectedDocument.size / 1024).toFixed(1)} KB</Text>
//                 {selectedDocument.type.startsWith('image/') && (
//                   <Image source={{ uri: selectedDocument.uri }} style={s.modalImg} resizeMode="contain" />
//                 )}
//                 <TouchableOpacity style={s.viewBtn} onPress={() => viewDocument(selectedDocument)}>
//                   <Eye size={18} color="#FFF" strokeWidth={2} />
//                   <Text style={s.viewBtnTxt}>View Original Document</Text>
//                 </TouchableOpacity>
//                 {selectedDocument.extractedData && (
//                   <View style={s.extracted}>
//                     <Text style={s.extractedTitle}>Extracted Information</Text>
//                     {selectedDocument.extractedData.diagnoses?.map((d: string, i: number) => (
//                       <Text key={i} style={s.extractedItem}>• {d}</Text>
//                     ))}
//                     {selectedDocument.extractedData.medications?.map((m: string, i: number) => (
//                       <Text key={i} style={[s.extractedItem, { color: C.success }]}>• {m}</Text>
//                     ))}
//                   </View>
//                 )}
//               </ScrollView>
//             )}
//             <TouchableOpacity style={s.modalFooterBtn} onPress={() => setModalVisible(false)}>
//               <Text style={s.modalFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ── Notifications Modal ── */}
//       <Modal animationType="slide" transparent visible={showNotifications} onRequestClose={() => setShowNotifications(false)}>
//         <View style={s.overlay}>
//           <View style={s.modal}>
//             <View style={s.modalHead}>
//               <Text style={s.modalTitle}>Security & Access Alerts</Text>
//               <TouchableOpacity onPress={() => setShowNotifications(false)} style={s.modalClose}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView>
//               {notifications.length === 0 ? (
//                 <View style={s.empty}><Text style={s.emptyTitle}>No recent alerts</Text></View>
//               ) : (
//                 notifications.map(n => (
//                   <TouchableOpacity
//                     key={n._id}
//                     style={[s.notifCard, !n.read && s.notifUnread]}
//                     onPress={() => {
//                       setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
//                       ApiService.markNotificationRead(n._id).catch(() => { });
//                     }}
//                   >
//                     <View style={[s.notifIcon, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
//                       {n.message.includes('SECURITY')
//                         ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} />
//                         : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />
//                       }
//                     </View>
//                     <View style={s.notifBody}>
//                       <Text style={s.notifMsg}>{n.message}</Text>
//                       <Text style={s.notifDate}>{new Date(n.date).toLocaleString()}</Text>
//                     </View>
//                   </TouchableOpacity>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { paddingHorizontal: 20, paddingBottom: 36 },

//   // Header
//   header: {
//     backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4,
//   },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
//   avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' },
//   greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
//   name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
//   idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
//   bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight },
//   bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
//   headerActions: { flexDirection: 'row', gap: 8 },
//   iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   iconBtnDanger: { backgroundColor: C.dangerLight },
//   badge: {
//     position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8,
//     backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center',
//   },
//   badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },

//   // Stats
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statCard: {
//     flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
//   },
//   statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   statVal: { fontSize: 22, fontWeight: '800', color: C.textDark },
//   statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' },

//   // QR
//   qrCard: {
//     backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24,
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
//     borderWidth: 1, borderColor: C.primaryLight,
//   },
//   qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
//   qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrThumb: { width: 36, height: 36, borderRadius: 6 },
//   qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   qrSub: { fontSize: 12, color: C.textLight },
//   qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },

//   // Section
//   section: { marginBottom: 28 },
//   sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2 },
//   sectionSub: { fontSize: 12, color: C.textLight },
//   countPill: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
//   countTxt: { fontSize: 11, fontWeight: '700', color: '#FFF' },
//   seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },

//   // Upload
//   uploadRow: { flexDirection: 'row', gap: 12 },
//   uploadBtn: {
//     flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 20, alignItems: 'center',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
//   },
//   uploadBtnOff: { opacity: 0.5 },
//   uploadIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   uploadBtnTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   uploadBtnSub: { fontSize: 11, color: C.textLight },
//   uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: C.primaryLight, borderRadius: 10, padding: 12 },
//   uploadingTxt: { fontSize: 13, color: C.primary, fontWeight: '500' },

//   // Empty
//   empty: {
//     backgroundColor: C.surface, borderRadius: 18, padding: 36, alignItems: 'center',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
//   },
//   emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
//   emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textMid, marginBottom: 6 },
//   emptySub: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

//   // Docs
//   docList: { gap: 10 },
//   docCard: {
//     backgroundColor: C.surface, borderRadius: 16, padding: 14,
//     flexDirection: 'row', alignItems: 'center', gap: 12,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
//   docThumb: { width: 44, height: 44, borderRadius: 12 },
//   docInfo: { flex: 1 },
//   docName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 },
//   docMeta: { fontSize: 12, color: C.textLight },
//   processedTag: { alignSelf: 'flex-start', marginTop: 5, backgroundColor: C.successLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
//   processedTxt: { fontSize: 11, fontWeight: '600', color: C.success },

//   // Timeline
//   timelineCard: {
//     backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 8,
//     flexDirection: 'row', alignItems: 'center', gap: 12,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   tlIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   tlContent: { flex: 1 },
//   tlTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   tlDesc: { fontSize: 12, color: C.textMid, marginBottom: 2 },
//   tlDate: { fontSize: 11, color: C.textLight },

//   // Modal
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
//   modal: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', overflow: 'hidden' },
//   modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   modalTitle: { fontSize: 17, fontWeight: '700', color: C.textDark },
//   modalClose: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   modalBody: { padding: 22, maxHeight: 420 },
//   modalDocName: { fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 4 },
//   modalDocMeta: { fontSize: 13, color: C.textLight, marginBottom: 16 },
//   modalImg: { width: '100%', height: 200, borderRadius: 14, backgroundColor: '#F8FAFF', marginBottom: 16 },
//   viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
//   viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
//   extracted: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16 },
//   extractedTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 10 },
//   extractedItem: { fontSize: 13, color: C.textMid, marginBottom: 4, lineHeight: 18 },
//   modalFooterBtn: { margin: 22, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
//   modalFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },

//   // Notifications
//   notifCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'flex-start', gap: 14 },
//   notifUnread: { backgroundColor: '#F8FAFF' },
//   notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   notifBody: { flex: 1 },
//   notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 19, marginBottom: 4 },
//   notifDate: { fontSize: 11, color: C.textLight },
// });


// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
//   Image, ImageSourcePropType, Modal, ActivityIndicator,
//   RefreshControl, Linking,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   FileText, LogOut, QrCode, Activity, Clock, ChevronRight,
//   X, Eye, Bell, ShieldAlert, Stethoscope, Upload,
//   FlaskConical, FilePlus, Trash2,
// } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as WebBrowser from 'expo-web-browser';
// import ApiService, { BASE_URL } from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext';

// // ── Tokens ────────────────────────────────────────────────────────────────────
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
//   purple: '#7C3AED',
//   purpleLight: '#EDE9FE',
// };

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface UserData {
//   name: string; email: string; patientId: string;
//   qrCode?: string; bloodGroup?: string;
// }
// interface DocItem {
//   id: string; fileId: string; name: string; type: string;
//   size: number; status: string; uploadDate: string; fileUrl: string;
//   summary: string;
//   extractedData?: { diagnoses: string[]; medications: string[]; allergies: string[] };
// }
// interface ReportItem {
//   id: string; fileId: string; fileName: string; fileType: string;
//   fileSize: number; reportCategory: string; uploadedAt: string;
//   fileUrl: string; notes: string;
// }
// interface DoctorView { doctorName: string; specialization: string; viewedAt: string; }
// interface AppNotification { _id: string; message: string; createdAt: string; read: boolean; }

// const ALLOWED_TYPES = [
//   'application/pdf', 'text/plain',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//   'application/msword', 'image/jpeg', 'image/png', 'image/jpg',
// ];

// const fileEmoji = (type: string) => {
//   if (!type) return '📎';
//   if (type.startsWith('image/')) return '🖼️';
//   if (type.includes('pdf')) return '📄';
//   if (type.includes('word') || type.includes('docx')) return '📝';
//   return '📎';
// };

// const categoryColor = (cat: string) => {
//   switch (cat) {
//     case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' };
//     case 'LFT': return { bg: '#ECFDF5', text: '#065F46' };
//     case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' };
//     case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' };
//     case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' };
//     case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' };
//     default: return { bg: '#F1F5F9', text: '#475569' };
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────

// export default function PatientDashboard(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [documents, setDocuments] = useState<DocItem[]>([]);
//   const [reports, setReports] = useState<ReportItem[]>([]);
//   const [viewCount, setViewCount] = useState(0);
//   const [viewHistory, setViewHistory] = useState<DoctorView[]>([]);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState<'doc' | 'report' | null>(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // selected items for detail modals
//   const [selDoc, setSelDoc] = useState<DocItem | null>(null);
//   const [selReport, setSelReport] = useState<ReportItem | null>(null);
//   const [openingFile, setOpeningFile] = useState(false);

//   // modal visibility
//   const [showDocs, setShowDocs] = useState(false);
//   const [showDocDetail, setShowDocDetail] = useState(false);
//   const [showReports, setShowReports] = useState(false);
//   const [showReportDetail, setShowReportDetail] = useState(false);
//   const [showViews, setShowViews] = useState(false);
//   const [showNotifs, setShowNotifs] = useState(false);

//   const router = useRouter();

//   useEffect(() => { bootstrap(); }, []);

//   useFocusEffect(useCallback(() => {
//     loadNotifications();
//     loadViewHistory();
//   }, []));

//   // Poll stats every 30s so processing doc count stays fresh
//   useEffect(() => {
//     const id = setInterval(loadDocuments, 30000);
//     return () => clearInterval(id);
//   }, []);

//   async function bootstrap() {
//     setLoading(true);
//     try {
//       await Promise.all([loadUserData(), loadDocuments(), loadReports(), loadViewHistory(), loadNotifications()]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadUserData() {
//     try {
//       const stored = await AsyncStorage.getItem('userData');
//       if (stored) setUserData(JSON.parse(stored));
//       const res = await ApiService.getPatientProfile() as any;
//       if (res.success) {
//         setUserData(res.data);
//         await AsyncStorage.setItem('userData', JSON.stringify(res.data));
//       }
//     } catch { }
//   }

//   async function loadDocuments() {
//     try {
//       const res = await ApiService.getMyDocuments() as any;
//       if (res.success && Array.isArray(res.data)) setDocuments(res.data);
//     } catch { }
//   }

//   async function loadReports() {
//     try {
//       const res = await ApiService.getMyReports() as any;
//       if (res.success && Array.isArray(res.data)) setReports(res.data);
//     } catch { }
//   }

//   async function loadViewHistory() {
//     try {
//       const res = await ApiService.getViewHistory() as any;
//       if (res.success) {
//         setViewCount(res.data?.viewCount || 0);
//         setViewHistory(res.data?.viewHistory || []);
//       }
//     } catch { }
//   }

//   async function loadNotifications() {
//     try {
//       const res = await ApiService.getPatientNotifications();
//       if (res.success && res.data) setNotifications(res.data as any);
//     } catch { }
//   }

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await bootstrap();
//     setRefreshing(false);
//   };

//   // ── File picker & upload ──────────────────────────────────────────────────────

//   const pickAndUploadDocument = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (res.canceled || !res.assets?.[0]) return;
//       const d = res.assets[0];
//       setUploading('doc');
//       // Optimistic count bump
//       setDocuments(prev => [{
//         id: `temp-${Date.now()}`, fileId: '', name: d.name, type: d.mimeType || 'application/octet-stream',
//         size: d.size || 0, status: 'processing', uploadDate: new Date().toISOString(),
//         fileUrl: '', summary: '',
//       }, ...prev]);
//       const uploadRes = await ApiService.uploadFile({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (uploadRes.success) {
//         Alert.alert('Uploaded ✓', 'Document queued for processing. Summary will update shortly.');
//         setTimeout(() => { loadDocuments(); try { ApiService.refreshAllSummaries(); } catch { } }, 4000);
//       } else {
//         setDocuments(prev => prev.filter(x => !x.id.startsWith('temp-')));
//         Alert.alert('Error', uploadRes.message || 'Failed to upload document');
//       }
//     } catch (e: any) {
//       setDocuments(prev => prev.filter(x => !x.id.startsWith('temp-')));
//       Alert.alert('Error', e.message || 'Failed to upload document');
//     } finally { setUploading(null); }
//   };

//   const pickAndUploadReport = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (res.canceled || !res.assets?.[0]) return;
//       const d = res.assets[0];
//       setUploading('report');
//       const uploadRes = await ApiService.uploadReport(
//         { uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size }
//       );
//       if (uploadRes.success) {
//         Alert.alert('Uploaded ✓', 'Lab report saved successfully.');
//         await loadReports();
//       } else {
//         Alert.alert('Error', uploadRes.message || 'Failed to upload report');
//       }
//     } catch (e: any) {
//       Alert.alert('Error', e.message || 'Failed to upload report');
//     } finally { setUploading(null); }
//   };

//   // ── File viewer ───────────────────────────────────────────────────────────────

//   const openFile = async (url: string) => {
//     if (!url) { Alert.alert('Not available', 'This file is still being processed.'); return; }
//     setOpeningFile(true);
//     try {
//       await WebBrowser.openBrowserAsync(url, {
//         presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
//       });
//     } catch {
//       try { await Linking.openURL(url); }
//       catch { Alert.alert('Cannot open', 'Unable to open this file. Check the backend is running.'); }
//     } finally { setOpeningFile(false); }
//   };

//   const handleDeleteReport = async (report: ReportItem) => {
//     Alert.alert('Delete Report', `Delete "${report.fileName}"?`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete', style: 'destructive', onPress: async () => {
//           try {
//             await ApiService.deleteReport(report.id);
//             setReports(prev => prev.filter(r => r.id !== report.id));
//             setShowReportDetail(false);
//           } catch (e: any) { Alert.alert('Error', e.message); }
//         }
//       },
//     ]);
//   };

//   const handleLogout = () => {
//     Alert.alert('Sign Out', 'Are you sure?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Sign Out', style: 'destructive', onPress: async () => {
//           try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); }
//         }
//       },
//     ]);
//   };

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   // ── Render ────────────────────────────────────────────────────────────────────

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
//         showsVerticalScrollIndicator={false}
//       >

//         {/* ── Header ── */}
//         <View style={s.header}>
//           <View style={s.headerRow}>
//             <View style={s.avatarRow}>
//               <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.greeting}>Hello, welcome back</Text>
//                 <Text style={s.name} numberOfLines={1}>{userData?.name || 'Patient'}</Text>
//                 <View style={s.idBadge}>
//                   <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
//                   {userData?.bloodGroup && (
//                     <><View style={s.bloodDot} /><Text style={s.bloodText}>{userData.bloodGroup}ve</Text></>
//                   )}
//                 </View>
//               </View>
//             </View>
//             <View style={s.headerActions}>
//               <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
//                 <Bell size={18} color={C.primary} strokeWidth={2} />
//                 {unreadCount > 0 && (
//                   <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>
//                 )}
//               </TouchableOpacity>
//               <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}>
//                 <LogOut size={18} color={C.danger} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* ── Stats row ── */}
//         <View style={s.statsRow}>
//           {/* Documents */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.primaryLight }]}>
//               <FileText size={18} color={C.primary} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{documents.length}</Text>
//             <Text style={s.statLabel}>Documents</Text>
//             {documents.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>

//           {/* Dr Views */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowViews(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.successLight }]}>
//               <Stethoscope size={18} color={C.success} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{viewCount}</Text>
//             <Text style={s.statLabel}>Dr. Views</Text>
//             {viewCount > 0 && <Text style={s.statHint}>Tap to see</Text>}
//           </TouchableOpacity>

//           {/* Reports */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowReports(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.warningLight }]}>
//               <FlaskConical size={18} color={C.warning} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{reports.length}</Text>
//             <Text style={s.statLabel}>Reports</Text>
//             {reports.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//         </View>

//         {/* ── QR Card ── */}
//         <TouchableOpacity
//           style={s.qrCard} activeOpacity={0.9}
//           onPress={() => {
//             if (userData?.qrCode) router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } });
//             else Alert.alert('Info', 'QR code is being generated…');
//           }}
//         >
//           <View style={s.qrLeft}>
//             <View style={s.qrIconWrap}>
//               {userData?.qrCode
//                 ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" />
//                 : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
//               }
//             </View>
//             <View>
//               <Text style={s.qrTitle}>Your Health QR</Text>
//               <Text style={s.qrSub}>Tap to view full QR code</Text>
//             </View>
//           </View>
//           <View style={s.qrArrow}><ChevronRight size={18} color={C.primary} strokeWidth={2} /></View>
//         </TouchableOpacity>

//         {/* ── Upload Section ── */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Upload</Text>
//           <Text style={[s.sectionSub, { marginBottom: 14 }]}>Choose what you want to upload</Text>

//           <View style={s.uploadRow}>
//             {/* Upload Document */}
//             <TouchableOpacity
//               style={[s.uploadCard, uploading === 'doc' && s.uploadCardOff]}
//               onPress={pickAndUploadDocument}
//               disabled={!!uploading}
//               activeOpacity={0.85}
//             >
//               {uploading === 'doc'
//                 ? <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 10 }} />
//                 : <View style={[s.uploadCardIcon, { backgroundColor: C.primaryLight }]}>
//                   <FilePlus size={24} color={C.primary} strokeWidth={1.8} />
//                 </View>
//               }
//               <Text style={s.uploadCardTitle}>Document</Text>
//               <Text style={s.uploadCardSub}>Generates AI summary</Text>
//               <Text style={s.uploadCardSub2}>PDF · DOCX · TXT · Image</Text>
//             </TouchableOpacity>

//             {/* Upload Report */}
//             <TouchableOpacity
//               style={[s.uploadCard, uploading === 'report' && s.uploadCardOff, { borderColor: C.warning }]}
//               onPress={pickAndUploadReport}
//               disabled={!!uploading}
//               activeOpacity={0.85}
//             >
//               {uploading === 'report'
//                 ? <ActivityIndicator size="small" color={C.warning} style={{ marginBottom: 10 }} />
//                 : <View style={[s.uploadCardIcon, { backgroundColor: C.warningLight }]}>
//                   <FlaskConical size={24} color={C.warning} strokeWidth={1.8} />
//                 </View>
//               }
//               <Text style={[s.uploadCardTitle, { color: C.warning }]}>Lab Report</Text>
//               <Text style={s.uploadCardSub}>Stored & viewable</Text>
//               <Text style={s.uploadCardSub2}>KFT · LFT · CBC · etc.</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* ── Recent Documents inline ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>My Documents</Text>
//             <TouchableOpacity onPress={() => setShowDocs(true)}>
//               <Text style={s.seeAll}>See All ({documents.length})</Text>
//             </TouchableOpacity>
//           </View>

//           {documents.length === 0 ? (
//             <View style={s.emptyBox}>
//               <Upload size={28} color={C.textLight} strokeWidth={1.5} />
//               <Text style={s.emptyTxt}>No documents yet. Upload one above.</Text>
//             </View>
//           ) : (
//             documents.slice(0, 3).map(doc => (
//               <TouchableOpacity
//                 key={doc.id}
//                 style={s.listCard}
//                 onPress={() => { setSelDoc(doc); setShowDocDetail(true); }}
//                 activeOpacity={0.85}
//               >
//                 <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                 <View style={s.listInfo}>
//                   <Text style={s.listName} numberOfLines={1}>{doc.name}</Text>
//                   <Text style={s.listMeta}>
//                     {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                     {doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}
//                   </Text>
//                 </View>
//                 <StatusBadge status={doc.status} />
//                 <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//               </TouchableOpacity>
//             ))
//           )}
//         </View>

//         {/* ── Recent Reports inline ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>Lab Reports</Text>
//             <TouchableOpacity onPress={() => setShowReports(true)}>
//               <Text style={s.seeAll}>See All ({reports.length})</Text>
//             </TouchableOpacity>
//           </View>

//           {reports.length === 0 ? (
//             <View style={s.emptyBox}>
//               <FlaskConical size={28} color={C.textLight} strokeWidth={1.5} />
//               <Text style={s.emptyTxt}>No lab reports yet. Upload one above.</Text>
//             </View>
//           ) : (
//             reports.slice(0, 3).map(report => {
//               const cc = categoryColor(report.reportCategory);
//               return (
//                 <TouchableOpacity
//                   key={report.id}
//                   style={s.listCard}
//                   onPress={() => { setSelReport(report); setShowReportDetail(true); }}
//                   activeOpacity={0.85}
//                 >
//                   <Text style={s.listEmoji}>{fileEmoji(report.fileType)}</Text>
//                   <View style={s.listInfo}>
//                     <Text style={s.listName} numberOfLines={1}>{report.fileName}</Text>
//                     <Text style={s.listMeta}>
//                       {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                       {report.fileSize ? `  ·  ${(report.fileSize / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                   </View>
//                   <View style={[s.catBadge, { backgroundColor: cc.bg }]}>
//                     <Text style={[s.catTxt, { color: cc.text }]}>{report.reportCategory}</Text>
//                   </View>
//                   <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               );
//             })
//           )}
//         </View>

//       </ScrollView>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCUMENTS LIST MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showDocs} onRequestClose={() => setShowDocs(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>My Documents ({documents.length})</Text>
//               <TouchableOpacity onPress={() => setShowDocs(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {documents.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <Text style={s.emptyTxt}>No documents uploaded yet.</Text>
//                 </View>
//               ) : (
//                 documents.map(doc => (
//                   <TouchableOpacity
//                     key={doc.id}
//                     style={s.listCard}
//                     onPress={() => { setShowDocs(false); setSelDoc(doc); setShowDocDetail(true); }}
//                     activeOpacity={0.85}
//                   >
//                     <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                     <View style={s.listInfo}>
//                       <Text style={s.listName} numberOfLines={1}>{doc.name}</Text>
//                       <Text style={s.listMeta}>
//                         {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                         {doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}
//                       </Text>
//                     </View>
//                     <StatusBadge status={doc.status} />
//                     <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                   </TouchableOpacity>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCUMENT DETAIL MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showDocDetail} onRequestClose={() => setShowDocDetail(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle} numberOfLines={1}>{selDoc?.name || 'Document'}</Text>
//               <TouchableOpacity onPress={() => setShowDocDetail(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             {selDoc && (
//               <ScrollView contentContainerStyle={s.sheetBody}>
//                 {/* Info */}
//                 <View style={s.detailInfoRow}>
//                   <Text style={{ fontSize: 36 }}>{fileEmoji(selDoc.type)}</Text>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.detailName}>{selDoc.name}</Text>
//                     <Text style={s.detailMeta}>
//                       {selDoc.uploadDate ? new Date(selDoc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
//                       {selDoc.size ? `  ·  ${(selDoc.size / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                     <StatusBadge status={selDoc.status} />
//                   </View>
//                 </View>

//                 {/* View button */}
//                 <TouchableOpacity
//                   style={[s.viewBtn, (!selDoc.fileUrl || openingFile) && { opacity: 0.5 }]}
//                   onPress={() => openFile(selDoc.fileUrl)}
//                   disabled={!selDoc.fileUrl || openingFile}
//                 >
//                   {openingFile
//                     ? <ActivityIndicator size="small" color="#FFF" />
//                     : <Eye size={18} color="#FFF" strokeWidth={2} />
//                   }
//                   <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Document'}</Text>
//                 </TouchableOpacity>

//                 {/* Summary */}
//                 {selDoc.summary ? (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Processing Summary</Text>
//                     <Text style={s.infoBoxText}>{selDoc.summary}</Text>
//                   </View>
//                 ) : null}

//                 {/* Extracted */}
//                 {selDoc.extractedData && (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Extracted Information</Text>
//                     {selDoc.extractedData.diagnoses?.length > 0 && <>
//                       <Text style={s.extractSub}>Diagnoses</Text>
//                       {selDoc.extractedData.diagnoses.map((d, i) => <Text key={i} style={s.extractItem}>• {d}</Text>)}
//                     </>}
//                     {selDoc.extractedData.medications?.length > 0 && <>
//                       <Text style={[s.extractSub, { color: C.success }]}>Medications</Text>
//                       {selDoc.extractedData.medications.map((m, i) => <Text key={i} style={[s.extractItem, { color: C.success }]}>• {m}</Text>)}
//                     </>}
//                     {selDoc.extractedData.allergies?.length > 0 && <>
//                       <Text style={[s.extractSub, { color: C.danger }]}>Allergies</Text>
//                       {selDoc.extractedData.allergies.map((a, i) => <Text key={i} style={[s.extractItem, { color: C.danger }]}>• {a}</Text>)}
//                     </>}
//                   </View>
//                 )}
//               </ScrollView>
//             )}
//             <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowDocDetail(false)}>
//               <Text style={s.sheetFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           REPORTS LIST MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showReports} onRequestClose={() => setShowReports(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>Lab Reports ({reports.length})</Text>
//               <TouchableOpacity onPress={() => setShowReports(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {reports.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <FlaskConical size={32} color={C.textLight} strokeWidth={1.5} />
//                   <Text style={s.emptyTxt}>No lab reports yet.</Text>
//                   <Text style={[s.emptyTxt, { fontSize: 12 }]}>Use the "Lab Report" upload button to add KFT, LFT, CBC etc.</Text>
//                 </View>
//               ) : (
//                 reports.map(report => {
//                   const cc = categoryColor(report.reportCategory);
//                   return (
//                     <TouchableOpacity
//                       key={report.id}
//                       style={s.listCard}
//                       onPress={() => { setShowReports(false); setSelReport(report); setShowReportDetail(true); }}
//                       activeOpacity={0.85}
//                     >
//                       <Text style={s.listEmoji}>{fileEmoji(report.fileType)}</Text>
//                       <View style={s.listInfo}>
//                         <Text style={s.listName} numberOfLines={1}>{report.fileName}</Text>
//                         <Text style={s.listMeta}>
//                           {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                           {report.fileSize ? `  ·  ${(report.fileSize / 1024).toFixed(1)} KB` : ''}
//                         </Text>
//                       </View>
//                       <View style={[s.catBadge, { backgroundColor: cc.bg }]}>
//                         <Text style={[s.catTxt, { color: cc.text }]}>{report.reportCategory}</Text>
//                       </View>
//                       <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                     </TouchableOpacity>
//                   );
//                 })
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           REPORT DETAIL MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showReportDetail} onRequestClose={() => setShowReportDetail(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle} numberOfLines={1}>{selReport?.fileName || 'Report'}</Text>
//               <TouchableOpacity onPress={() => setShowReportDetail(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             {selReport && (
//               <ScrollView contentContainerStyle={s.sheetBody}>
//                 {/* Info */}
//                 <View style={s.detailInfoRow}>
//                   <Text style={{ fontSize: 36 }}>{fileEmoji(selReport.fileType)}</Text>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.detailName}>{selReport.fileName}</Text>
//                     <Text style={s.detailMeta}>
//                       {selReport.uploadedAt ? new Date(selReport.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
//                       {selReport.fileSize ? `  ·  ${(selReport.fileSize / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                     {(() => {
//                       const cc = categoryColor(selReport.reportCategory);
//                       return (
//                         <View style={[s.catBadge, { backgroundColor: cc.bg, marginTop: 6, alignSelf: 'flex-start' }]}>
//                           <Text style={[s.catTxt, { color: cc.text }]}>{selReport.reportCategory}</Text>
//                         </View>
//                       );
//                     })()}
//                   </View>
//                 </View>

//                 {/* View button */}
//                 <TouchableOpacity
//                   style={[s.viewBtn, { backgroundColor: C.warning }, openingFile && { opacity: 0.5 }]}
//                   onPress={() => openFile(selReport.fileUrl)}
//                   disabled={openingFile}
//                 >
//                   {openingFile
//                     ? <ActivityIndicator size="small" color="#FFF" />
//                     : <Eye size={18} color="#FFF" strokeWidth={2} />
//                   }
//                   <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Report'}</Text>
//                 </TouchableOpacity>

//                 {/* Notes */}
//                 {selReport.notes ? (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Notes</Text>
//                     <Text style={s.infoBoxText}>{selReport.notes}</Text>
//                   </View>
//                 ) : null}

//                 {/* Delete */}
//                 <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteReport(selReport)}>
//                   <Trash2 size={16} color={C.danger} strokeWidth={2} />
//                   <Text style={s.deleteBtnTxt}>Delete Report</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             )}
//             <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowReportDetail(false)}>
//               <Text style={s.sheetFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCTOR VIEWS MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showViews} onRequestClose={() => setShowViews(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <View>
//                 <Text style={s.sheetTitle}>Doctor Access History</Text>
//                 <Text style={s.sheetSub}>{viewCount} total {viewCount === 1 ? 'view' : 'views'}</Text>
//               </View>
//               <TouchableOpacity onPress={() => setShowViews(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {viewHistory.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <Stethoscope size={32} color={C.textLight} strokeWidth={1.5} />
//                   <Text style={s.emptyTxt}>No doctors have accessed your record yet.</Text>
//                   <Text style={[s.emptyTxt, { fontSize: 12 }]}>When a doctor views your summary, it will appear here with their name and specialization.</Text>
//                 </View>
//               ) : (
//                 viewHistory.map((v, i) => (
//                   <View key={i} style={s.viewCard}>
//                     <View style={[s.viewCardIcon, { backgroundColor: C.primaryLight }]}>
//                       <Stethoscope size={20} color={C.primary} strokeWidth={2} />
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={s.viewCardName}>{v.doctorName}</Text>
//                       <Text style={s.viewCardSpec}>{v.specialization}</Text>
//                       <Text style={s.viewCardDate}>
//                         {new Date(v.viewedAt).toLocaleDateString('en-GB', {
//                           day: 'numeric', month: 'short', year: 'numeric',
//                           hour: '2-digit', minute: '2-digit',
//                         })}
//                       </Text>
//                     </View>
//                   </View>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           NOTIFICATIONS MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showNotifs} onRequestClose={() => setShowNotifs(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>Alerts & Notifications</Text>
//               <TouchableOpacity onPress={() => setShowNotifs(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView>
//               {notifications.length === 0 ? (
//                 <View style={s.emptyBox}><Text style={s.emptyTxt}>No notifications.</Text></View>
//               ) : (
//                 notifications.map(n => (
//                   <TouchableOpacity
//                     key={n._id}
//                     style={[s.notifRow, !n.read && { backgroundColor: '#F0F7FF' }]}
//                     onPress={() => {
//                       setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
//                       ApiService.markNotificationRead(n._id).catch(() => { });
//                     }}
//                   >
//                     <View style={[s.notifIconWrap, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
//                       {n.message.includes('SECURITY')
//                         ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} />
//                         : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />
//                       }
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={[s.notifMsg, !n.read && { fontWeight: '700' }]}>{n.message}</Text>
//                       <Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text>
//                     </View>
//                     {!n.read && <View style={s.unreadDot} />}
//                   </TouchableOpacity>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// // ── Small helper component ────────────────────────────────────────────────────
// function StatusBadge({ status }: { status: string }) {
//   const map: Record<string, { bg: string; text: string; label: string }> = {
//     completed: { bg: '#ECFDF5', text: '#059669', label: '✓ Processed' },
//     failed: { bg: '#FEF2F2', text: '#DC2626', label: '✕ Failed' },
//     processing: { bg: '#FFFBEB', text: '#D97706', label: '⏳ Processing' },
//     pending: { bg: '#EFF6FF', text: '#1A56DB', label: '⏳ Pending' },
//   };
//   const c = map[status] || map.pending;
//   return (
//     <View style={[{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.bg }]}>
//       <Text style={{ fontSize: 11, fontWeight: '600', color: c.text }}>{c.label}</Text>
//     </View>
//   );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { paddingHorizontal: 20, paddingBottom: 40 },

//   // Header
//   header: { backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
//   avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' },
//   greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
//   name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
//   idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
//   bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight },
//   bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
//   headerActions: { flexDirection: 'row', gap: 8 },
//   iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   iconBtnDanger: { backgroundColor: C.dangerLight },
//   badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
//   badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },

//   // Stats
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
//   statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   statVal: { fontSize: 22, fontWeight: '800', color: C.textDark },
//   statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' },
//   statHint: { fontSize: 9, color: C.primary, marginTop: 3, fontWeight: '600' },

//   // QR
//   qrCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.primaryLight },
//   qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
//   qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrThumb: { width: 36, height: 36, borderRadius: 6 },
//   qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   qrSub: { fontSize: 12, color: C.textLight },
//   qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },

//   // Section
//   section: { marginBottom: 28 },
//   sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, marginBottom: 2 },
//   sectionSub: { fontSize: 12, color: C.textLight },
//   seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },

//   // Upload cards
//   uploadRow: { flexDirection: 'row', gap: 12 },
//   uploadCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: C.border },
//   uploadCardOff: { opacity: 0.5 },
//   uploadCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   uploadCardTitle: { fontSize: 14, fontWeight: '800', color: C.textDark, marginBottom: 4 },
//   uploadCardSub: { fontSize: 12, color: C.textMid, textAlign: 'center' },
//   uploadCardSub2: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },

//   // List items
//   listCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
//   listEmoji: { fontSize: 26 },
//   listInfo: { flex: 1 },
//   listName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 },
//   listMeta: { fontSize: 11, color: C.textLight },
//   catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
//   catTxt: { fontSize: 11, fontWeight: '700' },

//   // Empty
//   emptyBox: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 },
//   emptyTxt: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

//   // Sheet (bottom modal)
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
//   sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1, marginRight: 12 },
//   sheetSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
//   closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   sheetBody: { padding: 20, paddingBottom: 8 },
//   sheetFooterBtn: { margin: 20, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
//   sheetFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },

//   // Detail
//   detailInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 18, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
//   detailName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 },
//   detailMeta: { fontSize: 12, color: C.textLight },

//   // View button
//   viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
//   viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

//   // Info box
//   infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16, marginBottom: 14 },
//   infoBoxTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 },
//   infoBoxText: { fontSize: 13, color: C.textMid, lineHeight: 20 },
//   extractSub: { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
//   extractItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },

//   // Delete
//   deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
//   deleteBtnTxt: { fontSize: 14, fontWeight: '700', color: C.danger },

//   // Doctor views
//   viewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 10 },
//   viewCardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   viewCardName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   viewCardSpec: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 },
//   viewCardDate: { fontSize: 11, color: C.textLight },

//   // Notifications
//   notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//   notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 18, marginBottom: 3 },
//   notifDate: { fontSize: 11, color: C.textLight },
//   unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
// });

// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
//   Image, ImageSourcePropType, Modal, ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   FileText, LogOut, QrCode, Activity, Clock, ChevronRight,
//   X, Eye, Bell, ShieldAlert, Stethoscope, Upload,
//   FlaskConical, FilePlus, Trash2,
// } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import ApiService, { BASE_URL } from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext';

// // ── Tokens ────────────────────────────────────────────────────────────────────
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
//   purple: '#7C3AED',
//   purpleLight: '#EDE9FE',
// };

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface UserData {
//   name: string; email: string; patientId: string;
//   qrCode?: string; bloodGroup?: string;
// }
// interface DocItem {
//   id: string; fileId: string; name: string; type: string;
//   size: number; status: string; uploadDate: string; fileUrl: string;
//   summary: string;
//   extractedData?: { diagnoses: string[]; medications: string[]; allergies: string[] };
// }
// interface ReportItem {
//   id: string; fileId: string; fileName: string; fileType: string;
//   fileSize: number; reportCategory: string; uploadedAt: string;
//   fileUrl: string; notes: string;
// }
// interface DoctorView { doctorName: string; specialization: string; viewedAt: string; }
// interface AppNotification { _id: string; message: string; createdAt: string; read: boolean; }

// const ALLOWED_TYPES = [
//   'application/pdf', 'text/plain',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//   'application/msword', 'image/jpeg', 'image/png', 'image/jpg',
// ];

// const fileEmoji = (type: string) => {
//   if (!type) return '📎';
//   if (type.startsWith('image/')) return '🖼️';
//   if (type.includes('pdf')) return '📄';
//   if (type.includes('word') || type.includes('docx')) return '📝';
//   return '📎';
// };

// const categoryColor = (cat: string) => {
//   switch (cat) {
//     case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' };
//     case 'LFT': return { bg: '#ECFDF5', text: '#065F46' };
//     case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' };
//     case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' };
//     case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' };
//     case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' };
//     default: return { bg: '#F1F5F9', text: '#475569' };
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────

// export default function PatientDashboard(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [documents, setDocuments] = useState<DocItem[]>([]);
//   const [reports, setReports] = useState<ReportItem[]>([]);
//   const [viewCount, setViewCount] = useState(0);
//   const [viewHistory, setViewHistory] = useState<DoctorView[]>([]);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState<'doc' | 'report' | null>(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // selected items for detail modals
//   const [selDoc, setSelDoc] = useState<DocItem | null>(null);
//   const [selReport, setSelReport] = useState<ReportItem | null>(null);
//   const [openingFile, setOpeningFile] = useState(false);

//   // modal visibility
//   const [showDocs, setShowDocs] = useState(false);
//   const [showDocDetail, setShowDocDetail] = useState(false);
//   const [showReports, setShowReports] = useState(false);
//   const [showReportDetail, setShowReportDetail] = useState(false);
//   const [showViews, setShowViews] = useState(false);
//   const [showNotifs, setShowNotifs] = useState(false);

//   const router = useRouter();

//   useEffect(() => { bootstrap(); }, []);

//   useFocusEffect(useCallback(() => {
//     loadNotifications();
//     loadViewHistory();
//   }, []));

//   // Poll stats every 30s so processing doc count stays fresh
//   useEffect(() => {
//     const id = setInterval(loadDocuments, 30000);
//     return () => clearInterval(id);
//   }, []);

//   async function bootstrap() {
//     setLoading(true);
//     try {
//       await Promise.all([loadUserData(), loadDocuments(), loadReports(), loadViewHistory(), loadNotifications()]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadUserData() {
//     try {
//       const stored = await AsyncStorage.getItem('userData');
//       if (stored) setUserData(JSON.parse(stored));
//       const res = await ApiService.getPatientProfile() as any;
//       if (res.success) {
//         setUserData(res.data);
//         await AsyncStorage.setItem('userData', JSON.stringify(res.data));
//       }
//     } catch { }
//   }

//   async function loadDocuments() {
//     try {
//       const res = await ApiService.getMyDocuments() as any;
//       if (res.success && Array.isArray(res.data)) setDocuments(res.data);
//     } catch { }
//   }

//   async function loadReports() {
//     try {
//       const res = await ApiService.getMyReports() as any;
//       if (res.success && Array.isArray(res.data)) setReports(res.data);
//     } catch { }
//   }

//   async function loadViewHistory() {
//     try {
//       const res = await ApiService.getViewHistory() as any;
//       if (res.success) {
//         setViewCount(res.data?.viewCount || 0);
//         setViewHistory(res.data?.viewHistory || []);
//       }
//     } catch { }
//   }

//   async function loadNotifications() {
//     try {
//       const res = await ApiService.getPatientNotifications();
//       if (res.success && res.data) setNotifications(res.data as any);
//     } catch { }
//   }

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await bootstrap();
//     setRefreshing(false);
//   };

//   // ── File picker & upload ──────────────────────────────────────────────────────

//   const pickAndUploadDocument = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (res.canceled || !res.assets?.[0]) return;
//       const d = res.assets[0];
//       setUploading('doc');
//       // Optimistic count bump
//       setDocuments(prev => [{
//         id: `temp-${Date.now()}`, fileId: '', name: d.name, type: d.mimeType || 'application/octet-stream',
//         size: d.size || 0, status: 'processing', uploadDate: new Date().toISOString(),
//         fileUrl: '', summary: '',
//       }, ...prev]);
//       const uploadRes = await ApiService.uploadFile({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (uploadRes.success) {
//         Alert.alert('Uploaded ✓', 'Document queued for processing. Summary will update shortly.');
//         setTimeout(() => { loadDocuments(); try { ApiService.refreshAllSummaries(); } catch { } }, 4000);
//       } else {
//         setDocuments(prev => prev.filter(x => !x.id.startsWith('temp-')));
//         Alert.alert('Error', uploadRes.message || 'Failed to upload document');
//       }
//     } catch (e: any) {
//       setDocuments(prev => prev.filter(x => !x.id.startsWith('temp-')));
//       Alert.alert('Error', e.message || 'Failed to upload document');
//     } finally { setUploading(null); }
//   };

//   const pickAndUploadReport = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (res.canceled || !res.assets?.[0]) return;
//       const d = res.assets[0];
//       setUploading('report');
//       const uploadRes = await ApiService.uploadReport(
//         { uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size }
//       );
//       if (uploadRes.success) {
//         Alert.alert('Uploaded ✓', 'Lab report saved successfully.');
//         await loadReports();
//       } else {
//         Alert.alert('Error', uploadRes.message || 'Failed to upload report');
//       }
//     } catch (e: any) {
//       Alert.alert('Error', e.message || 'Failed to upload report');
//     } finally { setUploading(null); }
//   };

//   // ── File viewer ───────────────────────────────────────────────────────────────

//   const openFile = async (url: string, fileId?: string, fileType?: string, fileName?: string) => {
//     if (!url) { Alert.alert('Not available', 'This file is still being processed.'); return; }

//     // Replace localhost with real LAN IP — critical for Expo Go on real device
//     let fixedUrl = url;
//     try {
//       const lanHost = new URL(BASE_URL).hostname;
//       fixedUrl = url.replace('localhost', lanHost).replace('127.0.0.1', lanHost);
//     } catch { }

//     setOpeningFile(true);
//     try {
//       const safeId = fileId || url.split('/').pop() || `file_${Date.now()}`;
//       const ext = (fileType?.includes('pdf') || url.endsWith('.pdf')) ? '.pdf'
//         : (fileType?.startsWith('image/jpeg') || url.endsWith('.jpg')) ? '.jpg'
//           : (fileType?.startsWith('image/png') || url.endsWith('.png')) ? '.png'
//             : (fileType?.includes('word') || url.endsWith('.docx')) ? '.docx'
//               : '.pdf';

//       const localUri = `${FileSystem.cacheDirectory}seharoop_${safeId}${ext}`;

//       const info = await FileSystem.getInfoAsync(localUri);
//       if (!info.exists) {
//         const token = await ApiService.getToken();
//         const dlRes = await FileSystem.downloadAsync(fixedUrl, localUri, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         });
//         if (dlRes.status !== 200) {
//           Alert.alert('Download Error', `Server returned HTTP ${dlRes.status}.\nMake sure the backend is running and accessible on your network.`);
//           return;
//         }
//       }

//       const canShare = await Sharing.isAvailableAsync();
//       if (!canShare) { Alert.alert('Not supported', 'File sharing is not available on this device.'); return; }

//       await Sharing.shareAsync(localUri, {
//         mimeType: fileType || 'application/octet-stream',
//         dialogTitle: fileName || 'Open File',
//         UTI: fileType?.includes('pdf') ? 'com.adobe.pdf' : undefined,
//       });
//     } catch (err: any) {
//       Alert.alert('Cannot open file', err.message || 'An unexpected error occurred.');
//     } finally {
//       setOpeningFile(false);
//     }
//   };

//   const handleDeleteReport = async (report: ReportItem) => {
//     Alert.alert('Delete Report', `Delete "${report.fileName}"?`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete', style: 'destructive', onPress: async () => {
//           try {
//             await ApiService.deleteReport(report.id);
//             setReports(prev => prev.filter(r => r.id !== report.id));
//             setShowReportDetail(false);
//           } catch (e: any) { Alert.alert('Error', e.message); }
//         }
//       },
//     ]);
//   };

//   const handleLogout = () => {
//     Alert.alert('Sign Out', 'Are you sure?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Sign Out', style: 'destructive', onPress: async () => {
//           try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); }
//         }
//       },
//     ]);
//   };

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   // ── Render ────────────────────────────────────────────────────────────────────

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
//         showsVerticalScrollIndicator={false}
//       >

//         {/* ── Header ── */}
//         <View style={s.header}>
//           <View style={s.headerRow}>
//             <View style={s.avatarRow}>
//               <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.greeting}>Hello, welcome back</Text>
//                 <Text style={s.name} numberOfLines={1}>{userData?.name || 'Patient'}</Text>
//                 <View style={s.idBadge}>
//                   <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
//                   {userData?.bloodGroup && (
//                     <><View style={s.bloodDot} /><Text style={s.bloodText}>{userData.bloodGroup}</Text></>
//                   )}
//                 </View>
//               </View>
//             </View>
//             <View style={s.headerActions}>
//               <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
//                 <Bell size={18} color={C.primary} strokeWidth={2} />
//                 {unreadCount > 0 && (
//                   <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>
//                 )}
//               </TouchableOpacity>
//               <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}>
//                 <LogOut size={18} color={C.danger} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* ── Stats row ── */}
//         <View style={s.statsRow}>
//           {/* Documents */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.primaryLight }]}>
//               <FileText size={18} color={C.primary} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{documents.length}</Text>
//             <Text style={s.statLabel}>Documents</Text>
//             {documents.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>

//           {/* Dr Views */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowViews(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.successLight }]}>
//               <Stethoscope size={18} color={C.success} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{viewCount}</Text>
//             <Text style={s.statLabel}>Dr. Views</Text>
//             {viewCount > 0 && <Text style={s.statHint}>Tap to see</Text>}
//           </TouchableOpacity>

//           {/* Reports */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowReports(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.warningLight }]}>
//               <FlaskConical size={18} color={C.warning} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{reports.length}</Text>
//             <Text style={s.statLabel}>Reports</Text>
//             {reports.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//         </View>

//         {/* ── QR Card ── */}
//         <TouchableOpacity
//           style={s.qrCard} activeOpacity={0.9}
//           onPress={() => {
//             if (userData?.qrCode) router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } });
//             else Alert.alert('Info', 'QR code is being generated…');
//           }}
//         >
//           <View style={s.qrLeft}>
//             <View style={s.qrIconWrap}>
//               {userData?.qrCode
//                 ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" />
//                 : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
//               }
//             </View>
//             <View>
//               <Text style={s.qrTitle}>Your Health QR</Text>
//               <Text style={s.qrSub}>Tap to view full QR code</Text>
//             </View>
//           </View>
//           <View style={s.qrArrow}><ChevronRight size={18} color={C.primary} strokeWidth={2} /></View>
//         </TouchableOpacity>

//         {/* ── Upload Section ── */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Upload</Text>
//           <Text style={[s.sectionSub, { marginBottom: 14 }]}>Choose what you want to upload</Text>

//           <View style={s.uploadRow}>
//             {/* Upload Document */}
//             <TouchableOpacity
//               style={[s.uploadCard, uploading === 'doc' && s.uploadCardOff]}
//               onPress={pickAndUploadDocument}
//               disabled={!!uploading}
//               activeOpacity={0.85}
//             >
//               {uploading === 'doc'
//                 ? <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 10 }} />
//                 : <View style={[s.uploadCardIcon, { backgroundColor: C.primaryLight }]}>
//                   <FilePlus size={24} color={C.primary} strokeWidth={1.8} />
//                 </View>
//               }
//               <Text style={s.uploadCardTitle}>Document</Text>
//               <Text style={s.uploadCardSub}>Generates AI summary</Text>
//               <Text style={s.uploadCardSub2}>PDF · DOCX · TXT · Image</Text>
//             </TouchableOpacity>

//             {/* Upload Report */}
//             <TouchableOpacity
//               style={[s.uploadCard, uploading === 'report' && s.uploadCardOff, { borderColor: C.warning }]}
//               onPress={pickAndUploadReport}
//               disabled={!!uploading}
//               activeOpacity={0.85}
//             >
//               {uploading === 'report'
//                 ? <ActivityIndicator size="small" color={C.warning} style={{ marginBottom: 10 }} />
//                 : <View style={[s.uploadCardIcon, { backgroundColor: C.warningLight }]}>
//                   <FlaskConical size={24} color={C.warning} strokeWidth={1.8} />
//                 </View>
//               }
//               <Text style={[s.uploadCardTitle, { color: C.warning }]}>Lab Report</Text>
//               <Text style={s.uploadCardSub}>Stored & viewable</Text>
//               <Text style={s.uploadCardSub2}>KFT · LFT · CBC · etc.</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* ── Recent Documents inline ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>My Documents</Text>
//             <TouchableOpacity onPress={() => setShowDocs(true)}>
//               <Text style={s.seeAll}>See All ({documents.length})</Text>
//             </TouchableOpacity>
//           </View>

//           {documents.length === 0 ? (
//             <View style={s.emptyBox}>
//               <Upload size={28} color={C.textLight} strokeWidth={1.5} />
//               <Text style={s.emptyTxt}>No documents yet. Upload one above.</Text>
//             </View>
//           ) : (
//             documents.slice(0, 3).map(doc => (
//               <TouchableOpacity
//                 key={doc.id}
//                 style={s.listCard}
//                 onPress={() => { setSelDoc(doc); setShowDocDetail(true); }}
//                 activeOpacity={0.85}
//               >
//                 <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                 <View style={s.listInfo}>
//                   <Text style={s.listName} numberOfLines={1}>{doc.name}</Text>
//                   <Text style={s.listMeta}>
//                     {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                     {doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}
//                   </Text>
//                 </View>
//                 <StatusBadge status={doc.status} />
//                 <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//               </TouchableOpacity>
//             ))
//           )}
//         </View>

//         {/* ── Recent Reports inline ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>Lab Reports</Text>
//             <TouchableOpacity onPress={() => setShowReports(true)}>
//               <Text style={s.seeAll}>See All ({reports.length})</Text>
//             </TouchableOpacity>
//           </View>

//           {reports.length === 0 ? (
//             <View style={s.emptyBox}>
//               <FlaskConical size={28} color={C.textLight} strokeWidth={1.5} />
//               <Text style={s.emptyTxt}>No lab reports yet. Upload one above.</Text>
//             </View>
//           ) : (
//             reports.slice(0, 3).map(report => {
//               const cc = categoryColor(report.reportCategory);
//               return (
//                 <TouchableOpacity
//                   key={report.id}
//                   style={s.listCard}
//                   onPress={() => { setSelReport(report); setShowReportDetail(true); }}
//                   activeOpacity={0.85}
//                 >
//                   <Text style={s.listEmoji}>{fileEmoji(report.fileType)}</Text>
//                   <View style={s.listInfo}>
//                     <Text style={s.listName} numberOfLines={1}>{report.fileName}</Text>
//                     <Text style={s.listMeta}>
//                       {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                       {report.fileSize ? `  ·  ${(report.fileSize / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                   </View>
//                   <View style={[s.catBadge, { backgroundColor: cc.bg }]}>
//                     <Text style={[s.catTxt, { color: cc.text }]}>{report.reportCategory}</Text>
//                   </View>
//                   <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               );
//             })
//           )}
//         </View>

//       </ScrollView>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCUMENTS LIST MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showDocs} onRequestClose={() => setShowDocs(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>My Documents ({documents.length})</Text>
//               <TouchableOpacity onPress={() => setShowDocs(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {documents.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <Text style={s.emptyTxt}>No documents uploaded yet.</Text>
//                 </View>
//               ) : (
//                 documents.map(doc => (
//                   <TouchableOpacity
//                     key={doc.id}
//                     style={s.listCard}
//                     onPress={() => { setShowDocs(false); setSelDoc(doc); setShowDocDetail(true); }}
//                     activeOpacity={0.85}
//                   >
//                     <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                     <View style={s.listInfo}>
//                       <Text style={s.listName} numberOfLines={1}>{doc.name}</Text>
//                       <Text style={s.listMeta}>
//                         {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                         {doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}
//                       </Text>
//                     </View>
//                     <StatusBadge status={doc.status} />
//                     <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                   </TouchableOpacity>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCUMENT DETAIL MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showDocDetail} onRequestClose={() => setShowDocDetail(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle} numberOfLines={1}>{selDoc?.name || 'Document'}</Text>
//               <TouchableOpacity onPress={() => setShowDocDetail(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             {selDoc && (
//               <ScrollView contentContainerStyle={s.sheetBody}>
//                 {/* Info */}
//                 <View style={s.detailInfoRow}>
//                   <Text style={{ fontSize: 36 }}>{fileEmoji(selDoc.type)}</Text>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.detailName}>{selDoc.name}</Text>
//                     <Text style={s.detailMeta}>
//                       {selDoc.uploadDate ? new Date(selDoc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
//                       {selDoc.size ? `  ·  ${(selDoc.size / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                     <StatusBadge status={selDoc.status} />
//                   </View>
//                 </View>

//                 {/* View button */}
//                 <TouchableOpacity
//                   style={[s.viewBtn, (!selDoc.fileUrl || openingFile) && { opacity: 0.5 }]}
//                   onPress={() => openFile(selDoc.fileUrl, selDoc.fileId, selDoc.type, selDoc.name)}
//                   disabled={!selDoc.fileUrl || openingFile}
//                 >
//                   {openingFile
//                     ? <ActivityIndicator size="small" color="#FFF" />
//                     : <Eye size={18} color="#FFF" strokeWidth={2} />
//                   }
//                   <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Document'}</Text>
//                 </TouchableOpacity>

//                 {/* Summary */}
//                 {selDoc.summary ? (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Processing Summary</Text>
//                     <Text style={s.infoBoxText}>{selDoc.summary}</Text>
//                   </View>
//                 ) : null}

//                 {/* Extracted */}
//                 {selDoc.extractedData && (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Extracted Information</Text>
//                     {selDoc.extractedData.diagnoses?.length > 0 && <>
//                       <Text style={s.extractSub}>Diagnoses</Text>
//                       {selDoc.extractedData.diagnoses.map((d, i) => <Text key={i} style={s.extractItem}>• {d}</Text>)}
//                     </>}
//                     {selDoc.extractedData.medications?.length > 0 && <>
//                       <Text style={[s.extractSub, { color: C.success }]}>Medications</Text>
//                       {selDoc.extractedData.medications.map((m, i) => <Text key={i} style={[s.extractItem, { color: C.success }]}>• {m}</Text>)}
//                     </>}
//                     {selDoc.extractedData.allergies?.length > 0 && <>
//                       <Text style={[s.extractSub, { color: C.danger }]}>Allergies</Text>
//                       {selDoc.extractedData.allergies.map((a, i) => <Text key={i} style={[s.extractItem, { color: C.danger }]}>• {a}</Text>)}
//                     </>}
//                   </View>
//                 )}
//               </ScrollView>
//             )}
//             <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowDocDetail(false)}>
//               <Text style={s.sheetFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           REPORTS LIST MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showReports} onRequestClose={() => setShowReports(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>Lab Reports ({reports.length})</Text>
//               <TouchableOpacity onPress={() => setShowReports(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {reports.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <FlaskConical size={32} color={C.textLight} strokeWidth={1.5} />
//                   <Text style={s.emptyTxt}>No lab reports yet.</Text>
//                   <Text style={[s.emptyTxt, { fontSize: 12 }]}>Use the "Lab Report" upload button to add KFT, LFT, CBC etc.</Text>
//                 </View>
//               ) : (
//                 reports.map(report => {
//                   const cc = categoryColor(report.reportCategory);
//                   return (
//                     <TouchableOpacity
//                       key={report.id}
//                       style={s.listCard}
//                       onPress={() => { setShowReports(false); setSelReport(report); setShowReportDetail(true); }}
//                       activeOpacity={0.85}
//                     >
//                       <Text style={s.listEmoji}>{fileEmoji(report.fileType)}</Text>
//                       <View style={s.listInfo}>
//                         <Text style={s.listName} numberOfLines={1}>{report.fileName}</Text>
//                         <Text style={s.listMeta}>
//                           {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                           {report.fileSize ? `  ·  ${(report.fileSize / 1024).toFixed(1)} KB` : ''}
//                         </Text>
//                       </View>
//                       <View style={[s.catBadge, { backgroundColor: cc.bg }]}>
//                         <Text style={[s.catTxt, { color: cc.text }]}>{report.reportCategory}</Text>
//                       </View>
//                       <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                     </TouchableOpacity>
//                   );
//                 })
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           REPORT DETAIL MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showReportDetail} onRequestClose={() => setShowReportDetail(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle} numberOfLines={1}>{selReport?.fileName || 'Report'}</Text>
//               <TouchableOpacity onPress={() => setShowReportDetail(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             {selReport && (
//               <ScrollView contentContainerStyle={s.sheetBody}>
//                 {/* Info */}
//                 <View style={s.detailInfoRow}>
//                   <Text style={{ fontSize: 36 }}>{fileEmoji(selReport.fileType)}</Text>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.detailName}>{selReport.fileName}</Text>
//                     <Text style={s.detailMeta}>
//                       {selReport.uploadedAt ? new Date(selReport.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
//                       {selReport.fileSize ? `  ·  ${(selReport.fileSize / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                     {(() => {
//                       const cc = categoryColor(selReport.reportCategory);
//                       return (
//                         <View style={[s.catBadge, { backgroundColor: cc.bg, marginTop: 6, alignSelf: 'flex-start' }]}>
//                           <Text style={[s.catTxt, { color: cc.text }]}>{selReport.reportCategory}</Text>
//                         </View>
//                       );
//                     })()}
//                   </View>
//                 </View>

//                 {/* View button */}
//                 <TouchableOpacity
//                   style={[s.viewBtn, { backgroundColor: C.warning }, openingFile && { opacity: 0.5 }]}
//                   onPress={() => openFile(selReport.fileUrl, selReport.fileId, selReport.fileType, selReport.fileName)}
//                   disabled={openingFile}
//                 >
//                   {openingFile
//                     ? <ActivityIndicator size="small" color="#FFF" />
//                     : <Eye size={18} color="#FFF" strokeWidth={2} />
//                   }
//                   <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Report'}</Text>
//                 </TouchableOpacity>

//                 {/* Notes */}
//                 {selReport.notes ? (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Notes</Text>
//                     <Text style={s.infoBoxText}>{selReport.notes}</Text>
//                   </View>
//                 ) : null}

//                 {/* Delete */}
//                 <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteReport(selReport)}>
//                   <Trash2 size={16} color={C.danger} strokeWidth={2} />
//                   <Text style={s.deleteBtnTxt}>Delete Report</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             )}
//             <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowReportDetail(false)}>
//               <Text style={s.sheetFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCTOR VIEWS MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showViews} onRequestClose={() => setShowViews(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <View>
//                 <Text style={s.sheetTitle}>Doctor Access History</Text>
//                 <Text style={s.sheetSub}>{viewCount} total {viewCount === 1 ? 'view' : 'views'}</Text>
//               </View>
//               <TouchableOpacity onPress={() => setShowViews(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {viewHistory.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <Stethoscope size={32} color={C.textLight} strokeWidth={1.5} />
//                   <Text style={s.emptyTxt}>No doctors have accessed your record yet.</Text>
//                   <Text style={[s.emptyTxt, { fontSize: 12 }]}>When a doctor views your summary, it will appear here with their name and specialization.</Text>
//                 </View>
//               ) : (
//                 viewHistory.map((v, i) => (
//                   <View key={i} style={s.viewCard}>
//                     <View style={[s.viewCardIcon, { backgroundColor: C.primaryLight }]}>
//                       <Stethoscope size={20} color={C.primary} strokeWidth={2} />
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={s.viewCardName}>{v.doctorName}</Text>
//                       <Text style={s.viewCardSpec}>{v.specialization}</Text>
//                       <Text style={s.viewCardDate}>
//                         {new Date(v.viewedAt).toLocaleDateString('en-GB', {
//                           day: 'numeric', month: 'short', year: 'numeric',
//                           hour: '2-digit', minute: '2-digit',
//                         })}
//                       </Text>
//                     </View>
//                   </View>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           NOTIFICATIONS MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showNotifs} onRequestClose={() => setShowNotifs(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>Alerts & Notifications</Text>
//               <TouchableOpacity onPress={() => setShowNotifs(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView>
//               {notifications.length === 0 ? (
//                 <View style={s.emptyBox}><Text style={s.emptyTxt}>No notifications.</Text></View>
//               ) : (
//                 notifications.map(n => (
//                   <TouchableOpacity
//                     key={n._id}
//                     style={[s.notifRow, !n.read && { backgroundColor: '#F0F7FF' }]}
//                     onPress={() => {
//                       setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
//                       ApiService.markNotificationRead(n._id).catch(() => { });
//                     }}
//                   >
//                     <View style={[s.notifIconWrap, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
//                       {n.message.includes('SECURITY')
//                         ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} />
//                         : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />
//                       }
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={[s.notifMsg, !n.read && { fontWeight: '700' }]}>{n.message}</Text>
//                       <Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text>
//                     </View>
//                     {!n.read && <View style={s.unreadDot} />}
//                   </TouchableOpacity>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// // ── Small helper component ────────────────────────────────────────────────────
// function StatusBadge({ status }: { status: string }) {
//   const map: Record<string, { bg: string; text: string; label: string }> = {
//     completed: { bg: '#ECFDF5', text: '#059669', label: '✓ Processed' },
//     failed: { bg: '#FEF2F2', text: '#DC2626', label: '✕ Failed' },
//     processing: { bg: '#FFFBEB', text: '#D97706', label: '⏳ Processing' },
//     pending: { bg: '#EFF6FF', text: '#1A56DB', label: '⏳ Pending' },
//   };
//   const c = map[status] || map.pending;
//   return (
//     <View style={[{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.bg }]}>
//       <Text style={{ fontSize: 11, fontWeight: '600', color: c.text }}>{c.label}</Text>
//     </View>
//   );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { paddingHorizontal: 20, paddingBottom: 40 },

//   // Header
//   header: { backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
//   avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' },
//   greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
//   name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
//   idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
//   bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight },
//   bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
//   headerActions: { flexDirection: 'row', gap: 8 },
//   iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   iconBtnDanger: { backgroundColor: C.dangerLight },
//   badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
//   badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },

//   // Stats
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
//   statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   statVal: { fontSize: 22, fontWeight: '800', color: C.textDark },
//   statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' },
//   statHint: { fontSize: 9, color: C.primary, marginTop: 3, fontWeight: '600' },

//   // QR
//   qrCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.primaryLight },
//   qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
//   qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrThumb: { width: 36, height: 36, borderRadius: 6 },
//   qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   qrSub: { fontSize: 12, color: C.textLight },
//   qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },

//   // Section
//   section: { marginBottom: 28 },
//   sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, marginBottom: 2 },
//   sectionSub: { fontSize: 12, color: C.textLight },
//   seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },

//   // Upload cards
//   uploadRow: { flexDirection: 'row', gap: 12 },
//   uploadCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: C.border },
//   uploadCardOff: { opacity: 0.5 },
//   uploadCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   uploadCardTitle: { fontSize: 14, fontWeight: '800', color: C.textDark, marginBottom: 4 },
//   uploadCardSub: { fontSize: 12, color: C.textMid, textAlign: 'center' },
//   uploadCardSub2: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },

//   // List items
//   listCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
//   listEmoji: { fontSize: 26 },
//   listInfo: { flex: 1 },
//   listName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 },
//   listMeta: { fontSize: 11, color: C.textLight },
//   catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
//   catTxt: { fontSize: 11, fontWeight: '700' },

//   // Empty
//   emptyBox: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 },
//   emptyTxt: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

//   // Sheet (bottom modal)
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
//   sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1, marginRight: 12 },
//   sheetSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
//   closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   sheetBody: { padding: 20, paddingBottom: 8 },
//   sheetFooterBtn: { margin: 20, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
//   sheetFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },

//   // Detail
//   detailInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 18, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
//   detailName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 },
//   detailMeta: { fontSize: 12, color: C.textLight },

//   // View button
//   viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
//   viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

//   // Info box
//   infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16, marginBottom: 14 },
//   infoBoxTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 },
//   infoBoxText: { fontSize: 13, color: C.textMid, lineHeight: 20 },
//   extractSub: { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
//   extractItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },

//   // Delete
//   deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
//   deleteBtnTxt: { fontSize: 14, fontWeight: '700', color: C.danger },

//   // Doctor views
//   viewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 10 },
//   viewCardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   viewCardName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   viewCardSpec: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 },
//   viewCardDate: { fontSize: 11, color: C.textLight },

//   // Notifications
//   notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//   notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 18, marginBottom: 3 },
//   notifDate: { fontSize: 11, color: C.textLight },
//   unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
// });

// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
//   Image, ImageSourcePropType, Modal, ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   FileText, LogOut, QrCode, Activity, Clock, ChevronRight,
//   X, Eye, Bell, ShieldAlert, Stethoscope, Upload,
//   FlaskConical, FilePlus, Trash2,
// } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import { File, Paths } from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import ApiService, { BASE_URL } from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext';

// // ── Tokens ────────────────────────────────────────────────────────────────────
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
//   purple: '#7C3AED',
//   purpleLight: '#EDE9FE',
// };

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface UserData {
//   name: string; email: string; patientId: string;
//   qrCode?: string; bloodGroup?: string;
// }
// interface DocItem {
//   id: string; fileId: string; name: string; type: string;
//   size: number; status: string; uploadDate: string; fileUrl: string;
//   summary: string;
//   extractedData?: { diagnoses: string[]; medications: string[]; allergies: string[] };
// }
// interface ReportItem {
//   id: string; fileId: string; fileName: string; fileType: string;
//   fileSize: number; reportCategory: string; uploadedAt: string;
//   fileUrl: string; notes: string;
// }
// interface DoctorView { doctorName: string; specialization: string; viewedAt: string; }
// interface AppNotification { _id: string; message: string; createdAt: string; read: boolean; }

// const ALLOWED_TYPES = [
//   'application/pdf', 'text/plain',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//   'application/msword', 'image/jpeg', 'image/png', 'image/jpg',
// ];

// const fileEmoji = (type: string) => {
//   if (!type) return '📎';
//   if (type.startsWith('image/')) return '🖼️';
//   if (type.includes('pdf')) return '📄';
//   if (type.includes('word') || type.includes('docx')) return '📝';
//   return '📎';
// };

// const categoryColor = (cat: string) => {
//   switch (cat) {
//     case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' };
//     case 'LFT': return { bg: '#ECFDF5', text: '#065F46' };
//     case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' };
//     case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' };
//     case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' };
//     case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' };
//     default: return { bg: '#F1F5F9', text: '#475569' };
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────

// export default function PatientDashboard(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [documents, setDocuments] = useState<DocItem[]>([]);
//   const [reports, setReports] = useState<ReportItem[]>([]);
//   const [viewCount, setViewCount] = useState(0);
//   const [viewHistory, setViewHistory] = useState<DoctorView[]>([]);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState<'doc' | 'report' | null>(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // selected items for detail modals
//   const [selDoc, setSelDoc] = useState<DocItem | null>(null);
//   const [selReport, setSelReport] = useState<ReportItem | null>(null);
//   const [openingFile, setOpeningFile] = useState(false);

//   // modal visibility
//   const [showDocs, setShowDocs] = useState(false);
//   const [showDocDetail, setShowDocDetail] = useState(false);
//   const [showReports, setShowReports] = useState(false);
//   const [showReportDetail, setShowReportDetail] = useState(false);
//   const [showViews, setShowViews] = useState(false);
//   const [showNotifs, setShowNotifs] = useState(false);

//   const router = useRouter();

//   useEffect(() => { bootstrap(); }, []);

//   useFocusEffect(useCallback(() => {
//     loadNotifications();
//     loadViewHistory();
//   }, []));

//   // Poll stats every 30s so processing doc count stays fresh
//   useEffect(() => {
//     const id = setInterval(loadDocuments, 30000);
//     return () => clearInterval(id);
//   }, []);

//   async function bootstrap() {
//     setLoading(true);
//     try {
//       await Promise.all([loadUserData(), loadDocuments(), loadReports(), loadViewHistory(), loadNotifications()]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadUserData() {
//     try {
//       const stored = await AsyncStorage.getItem('userData');
//       if (stored) setUserData(JSON.parse(stored));
//       const res = await ApiService.getPatientProfile() as any;
//       if (res.success) {
//         setUserData(res.data);
//         await AsyncStorage.setItem('userData', JSON.stringify(res.data));
//       }
//     } catch { }
//   }

//   async function loadDocuments() {
//     try {
//       const res = await ApiService.getMyDocuments() as any;
//       if (res.success && Array.isArray(res.data)) setDocuments(res.data);
//     } catch { }
//   }

//   async function loadReports() {
//     try {
//       const res = await ApiService.getMyReports() as any;
//       if (res.success && Array.isArray(res.data)) setReports(res.data);
//     } catch { }
//   }

//   async function loadViewHistory() {
//     try {
//       const res = await ApiService.getViewHistory() as any;
//       if (res.success) {
//         setViewCount(res.data?.viewCount || 0);
//         setViewHistory(res.data?.viewHistory || []);
//       }
//     } catch { }
//   }

//   async function loadNotifications() {
//     try {
//       const res = await ApiService.getPatientNotifications();
//       if (res.success && res.data) setNotifications(res.data as any);
//     } catch { }
//   }

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await bootstrap();
//     setRefreshing(false);
//   };

//   // ── File picker & upload ──────────────────────────────────────────────────────

//   const pickAndUploadDocument = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (res.canceled || !res.assets?.[0]) return;
//       const d = res.assets[0];
//       setUploading('doc');
//       // Optimistic count bump
//       setDocuments(prev => [{
//         id: `temp-${Date.now()}`, fileId: '', name: d.name, type: d.mimeType || 'application/octet-stream',
//         size: d.size || 0, status: 'processing', uploadDate: new Date().toISOString(),
//         fileUrl: '', summary: '',
//       }, ...prev]);
//       const uploadRes = await ApiService.uploadFile({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (uploadRes.success) {
//         Alert.alert('Uploaded ✓', 'Document queued for processing. Summary will update shortly.');
//         setTimeout(() => { loadDocuments(); try { ApiService.refreshAllSummaries(); } catch { } }, 4000);
//       } else {
//         setDocuments(prev => prev.filter(x => !x.id.startsWith('temp-')));
//         Alert.alert('Error', uploadRes.message || 'Failed to upload document');
//       }
//     } catch (e: any) {
//       setDocuments(prev => prev.filter(x => !x.id.startsWith('temp-')));
//       Alert.alert('Error', e.message || 'Failed to upload document');
//     } finally { setUploading(null); }
//   };

//   const pickAndUploadReport = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (res.canceled || !res.assets?.[0]) return;
//       const d = res.assets[0];
//       setUploading('report');
//       const uploadRes = await ApiService.uploadReport(
//         { uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size }
//       );
//       if (uploadRes.success) {
//         Alert.alert('Uploaded ✓', 'Lab report saved successfully.');
//         await loadReports();
//       } else {
//         Alert.alert('Error', uploadRes.message || 'Failed to upload report');
//       }
//     } catch (e: any) {
//       Alert.alert('Error', e.message || 'Failed to upload report');
//     } finally { setUploading(null); }
//   };

//   // ── File viewer using NEW FileSystem API ───────────────────────────────────────

//   const openFile = async (url: string, fileId?: string, fileType?: string, fileName?: string) => {
//     if (!url) { Alert.alert('Not available', 'This file is still being processed.'); return; }

//     // Replace localhost with real LAN IP — critical for Expo Go on real device
//     let fixedUrl = url;
//     try {
//       const lanHost = new URL(BASE_URL).hostname;
//       fixedUrl = url.replace('localhost', lanHost).replace('127.0.0.1', lanHost);
//     } catch { }

//     setOpeningFile(true);
//     try {
//       const safeId = fileId || url.split('/').pop() || `file_${Date.now()}`;
//       const ext = (fileType?.includes('pdf') || url.endsWith('.pdf')) ? '.pdf'
//         : (fileType?.startsWith('image/jpeg') || url.endsWith('.jpg')) ? '.jpg'
//           : (fileType?.startsWith('image/png') || url.endsWith('.png')) ? '.png'
//             : (fileType?.includes('word') || url.endsWith('.docx')) ? '.docx'
//               : '.pdf';

//       // Create a File object using the new API
//       const localFile = new File(Paths.cache, `seharoop_${safeId}${ext}`);

//       // Check if already cached using the new API
//       if (!localFile.exists) {
//         const token = await ApiService.getToken();

//         // Download using the new File.downloadFileAsync API
//         const downloadedFile = await File.downloadFileAsync(fixedUrl, localFile, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//           idempotent: true, // Overwrite if exists
//         });

//         if (!downloadedFile.exists) {
//           Alert.alert('Download Error', 'Failed to download the file. Make sure the backend is running and accessible.');
//           return;
//         }
//       }

//       const canShare = await Sharing.isAvailableAsync();
//       if (!canShare) { Alert.alert('Not supported', 'File sharing is not available on this device.'); return; }

//       await Sharing.shareAsync(localFile.uri, {
//         mimeType: fileType || 'application/octet-stream',
//         dialogTitle: fileName || 'Open File',
//         UTI: fileType?.includes('pdf') ? 'com.adobe.pdf' : undefined,
//       });
//     } catch (err: any) {
//       console.error('openFile error:', err);
//       Alert.alert('Cannot open file', err.message || 'An unexpected error occurred.');
//     } finally {
//       setOpeningFile(false);
//     }
//   };

//   const handleDeleteReport = async (report: ReportItem) => {
//     Alert.alert('Delete Report', `Delete "${report.fileName}"?`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete', style: 'destructive', onPress: async () => {
//           try {
//             await ApiService.deleteReport(report.id);
//             setReports(prev => prev.filter(r => r.id !== report.id));
//             setShowReportDetail(false);
//           } catch (e: any) { Alert.alert('Error', e.message); }
//         }
//       },
//     ]);
//   };

//   const handleLogout = () => {
//     Alert.alert('Sign Out', 'Are you sure?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Sign Out', style: 'destructive', onPress: async () => {
//           try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); }
//         }
//       },
//     ]);
//   };

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   // ── Render ────────────────────────────────────────────────────────────────────

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
//         showsVerticalScrollIndicator={false}
//       >

//         {/* ── Header ── */}
//         <View style={s.header}>
//           <View style={s.headerRow}>
//             <View style={s.avatarRow}>
//               <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.greeting}>Hello, welcome back</Text>
//                 <Text style={s.name} numberOfLines={1}>{userData?.name || 'Patient'}</Text>
//                 <View style={s.idBadge}>
//                   <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
//                   {userData?.bloodGroup && (
//                     <><View style={s.bloodDot} /><Text style={s.bloodText}>{userData.bloodGroup}ve</Text></>
//                   )}
//                 </View>
//               </View>
//             </View>
//             <View style={s.headerActions}>
//               <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
//                 <Bell size={18} color={C.primary} strokeWidth={2} />
//                 {unreadCount > 0 && (
//                   <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>
//                 )}
//               </TouchableOpacity>
//               <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}>
//                 <LogOut size={18} color={C.danger} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* ── Stats row ── */}
//         <View style={s.statsRow}>
//           {/* Documents */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.primaryLight }]}>
//               <FileText size={18} color={C.primary} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{documents.length}</Text>
//             <Text style={s.statLabel}>Documents</Text>
//             {documents.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>

//           {/* Dr Views */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowViews(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.successLight }]}>
//               <Stethoscope size={18} color={C.success} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{viewCount}</Text>
//             <Text style={s.statLabel}>Dr. Views</Text>
//             {viewCount > 0 && <Text style={s.statHint}>Tap to see</Text>}
//           </TouchableOpacity>

//           {/* Reports */}
//           <TouchableOpacity style={s.statCard} onPress={() => setShowReports(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.warningLight }]}>
//               <FlaskConical size={18} color={C.warning} strokeWidth={2} />
//             </View>
//             <Text style={s.statVal}>{reports.length}</Text>
//             <Text style={s.statLabel}>Reports</Text>
//             {reports.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//         </View>

//         {/* ── QR Card ── */}
//         <TouchableOpacity
//           style={s.qrCard} activeOpacity={0.9}
//           onPress={() => {
//             if (userData?.qrCode) router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } });
//             else Alert.alert('Info', 'QR code is being generated…');
//           }}
//         >
//           <View style={s.qrLeft}>
//             <View style={s.qrIconWrap}>
//               {userData?.qrCode
//                 ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" />
//                 : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
//               }
//             </View>
//             <View>
//               <Text style={s.qrTitle}>Your Health QR</Text>
//               <Text style={s.qrSub}>Tap to view full QR code</Text>
//             </View>
//           </View>
//           <View style={s.qrArrow}><ChevronRight size={18} color={C.primary} strokeWidth={2} /></View>
//         </TouchableOpacity>

//         {/* ── Upload Section ── */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Upload</Text>
//           <Text style={[s.sectionSub, { marginBottom: 14 }]}>Choose what you want to upload</Text>

//           <View style={s.uploadRow}>
//             {/* Upload Document */}
//             <TouchableOpacity
//               style={[s.uploadCard, uploading === 'doc' && s.uploadCardOff]}
//               onPress={pickAndUploadDocument}
//               disabled={!!uploading}
//               activeOpacity={0.85}
//             >
//               {uploading === 'doc'
//                 ? <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 10 }} />
//                 : <View style={[s.uploadCardIcon, { backgroundColor: C.primaryLight }]}>
//                   <FilePlus size={24} color={C.primary} strokeWidth={1.8} />
//                 </View>
//               }
//               <Text style={s.uploadCardTitle}>Document</Text>
//               <Text style={s.uploadCardSub}>Generates AI summary</Text>
//               <Text style={s.uploadCardSub2}>PDF · DOCX · TXT · Image</Text>
//             </TouchableOpacity>

//             {/* Upload Report */}
//             <TouchableOpacity
//               style={[s.uploadCard, uploading === 'report' && s.uploadCardOff, { borderColor: C.warning }]}
//               onPress={pickAndUploadReport}
//               disabled={!!uploading}
//               activeOpacity={0.85}
//             >
//               {uploading === 'report'
//                 ? <ActivityIndicator size="small" color={C.warning} style={{ marginBottom: 10 }} />
//                 : <View style={[s.uploadCardIcon, { backgroundColor: C.warningLight }]}>
//                   <FlaskConical size={24} color={C.warning} strokeWidth={1.8} />
//                 </View>
//               }
//               <Text style={[s.uploadCardTitle, { color: C.warning }]}>Lab Report</Text>
//               <Text style={s.uploadCardSub}>Stored & viewable</Text>
//               <Text style={s.uploadCardSub2}>KFT · LFT · CBC · etc.</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* ── Recent Documents inline ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>My Documents</Text>
//             <TouchableOpacity onPress={() => setShowDocs(true)}>
//               <Text style={s.seeAll}>See All ({documents.length})</Text>
//             </TouchableOpacity>
//           </View>

//           {documents.length === 0 ? (
//             <View style={s.emptyBox}>
//               <Upload size={28} color={C.textLight} strokeWidth={1.5} />
//               <Text style={s.emptyTxt}>No documents yet. Upload one above.</Text>
//             </View>
//           ) : (
//             documents.slice(0, 3).map(doc => (
//               <TouchableOpacity
//                 key={doc.id}
//                 style={s.listCard}
//                 onPress={() => { setSelDoc(doc); setShowDocDetail(true); }}
//                 activeOpacity={0.85}
//               >
//                 <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                 <View style={s.listInfo}>
//                   <Text style={s.listName} numberOfLines={1}>{doc.name}</Text>
//                   <Text style={s.listMeta}>
//                     {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                     {doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}
//                   </Text>
//                 </View>
//                 <StatusBadge status={doc.status} />
//                 <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//               </TouchableOpacity>
//             ))
//           )}
//         </View>

//         {/* ── Recent Reports inline ── */}
//         <View style={s.section}>
//           <View style={s.sectionHead}>
//             <Text style={s.sectionTitle}>Lab Reports</Text>
//             <TouchableOpacity onPress={() => setShowReports(true)}>
//               <Text style={s.seeAll}>See All ({reports.length})</Text>
//             </TouchableOpacity>
//           </View>

//           {reports.length === 0 ? (
//             <View style={s.emptyBox}>
//               <FlaskConical size={28} color={C.textLight} strokeWidth={1.5} />
//               <Text style={s.emptyTxt}>No lab reports yet. Upload one above.</Text>
//             </View>
//           ) : (
//             reports.slice(0, 3).map(report => {
//               const cc = categoryColor(report.reportCategory);
//               return (
//                 <TouchableOpacity
//                   key={report.id}
//                   style={s.listCard}
//                   onPress={() => { setSelReport(report); setShowReportDetail(true); }}
//                   activeOpacity={0.85}
//                 >
//                   <Text style={s.listEmoji}>{fileEmoji(report.fileType)}</Text>
//                   <View style={s.listInfo}>
//                     <Text style={s.listName} numberOfLines={1}>{report.fileName}</Text>
//                     <Text style={s.listMeta}>
//                       {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                       {report.fileSize ? `  ·  ${(report.fileSize / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                   </View>
//                   <View style={[s.catBadge, { backgroundColor: cc.bg }]}>
//                     <Text style={[s.catTxt, { color: cc.text }]}>{report.reportCategory}</Text>
//                   </View>
//                   <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               );
//             })
//           )}
//         </View>

//       </ScrollView>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCUMENTS LIST MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showDocs} onRequestClose={() => setShowDocs(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>My Documents ({documents.length})</Text>
//               <TouchableOpacity onPress={() => setShowDocs(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {documents.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <Text style={s.emptyTxt}>No documents uploaded yet.</Text>
//                 </View>
//               ) : (
//                 documents.map(doc => (
//                   <TouchableOpacity
//                     key={doc.id}
//                     style={s.listCard}
//                     onPress={() => { setShowDocs(false); setSelDoc(doc); setShowDocDetail(true); }}
//                     activeOpacity={0.85}
//                   >
//                     <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                     <View style={s.listInfo}>
//                       <Text style={s.listName} numberOfLines={1}>{doc.name}</Text>
//                       <Text style={s.listMeta}>
//                         {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                         {doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}
//                       </Text>
//                     </View>
//                     <StatusBadge status={doc.status} />
//                     <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                   </TouchableOpacity>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCUMENT DETAIL MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showDocDetail} onRequestClose={() => setShowDocDetail(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle} numberOfLines={1}>{selDoc?.name || 'Document'}</Text>
//               <TouchableOpacity onPress={() => setShowDocDetail(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             {selDoc && (
//               <ScrollView contentContainerStyle={s.sheetBody}>
//                 {/* Info */}
//                 <View style={s.detailInfoRow}>
//                   <Text style={{ fontSize: 36 }}>{fileEmoji(selDoc.type)}</Text>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.detailName}>{selDoc.name}</Text>
//                     <Text style={s.detailMeta}>
//                       {selDoc.uploadDate ? new Date(selDoc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
//                       {selDoc.size ? `  ·  ${(selDoc.size / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                     <StatusBadge status={selDoc.status} />
//                   </View>
//                 </View>

//                 {/* View button */}
//                 <TouchableOpacity
//                   style={[s.viewBtn, (!selDoc.fileUrl || openingFile) && { opacity: 0.5 }]}
//                   onPress={() => openFile(selDoc.fileUrl, selDoc.fileId, selDoc.type, selDoc.name)}
//                   disabled={!selDoc.fileUrl || openingFile}
//                 >
//                   {openingFile
//                     ? <ActivityIndicator size="small" color="#FFF" />
//                     : <Eye size={18} color="#FFF" strokeWidth={2} />
//                   }
//                   <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Document'}</Text>
//                 </TouchableOpacity>

//                 {/* Summary */}
//                 {selDoc.summary ? (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Processing Summary</Text>
//                     <Text style={s.infoBoxText}>{selDoc.summary}</Text>
//                   </View>
//                 ) : null}

//                 {/* Extracted */}
//                 {selDoc.extractedData && (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Extracted Information</Text>
//                     {selDoc.extractedData.diagnoses?.length > 0 && <>
//                       <Text style={s.extractSub}>Diagnoses</Text>
//                       {selDoc.extractedData.diagnoses.map((d, i) => <Text key={i} style={s.extractItem}>• {d}</Text>)}
//                     </>}
//                     {selDoc.extractedData.medications?.length > 0 && <>
//                       <Text style={[s.extractSub, { color: C.success }]}>Medications</Text>
//                       {selDoc.extractedData.medications.map((m, i) => <Text key={i} style={[s.extractItem, { color: C.success }]}>• {m}</Text>)}
//                     </>}
//                     {selDoc.extractedData.allergies?.length > 0 && <>
//                       <Text style={[s.extractSub, { color: C.danger }]}>Allergies</Text>
//                       {selDoc.extractedData.allergies.map((a, i) => <Text key={i} style={[s.extractItem, { color: C.danger }]}>• {a}</Text>)}
//                     </>}
//                   </View>
//                 )}
//               </ScrollView>
//             )}
//             <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowDocDetail(false)}>
//               <Text style={s.sheetFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           REPORTS LIST MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showReports} onRequestClose={() => setShowReports(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>Lab Reports ({reports.length})</Text>
//               <TouchableOpacity onPress={() => setShowReports(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {reports.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <FlaskConical size={32} color={C.textLight} strokeWidth={1.5} />
//                   <Text style={s.emptyTxt}>No lab reports yet.</Text>
//                   <Text style={[s.emptyTxt, { fontSize: 12 }]}>Use the "Lab Report" upload button to add KFT, LFT, CBC etc.</Text>
//                 </View>
//               ) : (
//                 reports.map(report => {
//                   const cc = categoryColor(report.reportCategory);
//                   return (
//                     <TouchableOpacity
//                       key={report.id}
//                       style={s.listCard}
//                       onPress={() => { setShowReports(false); setSelReport(report); setShowReportDetail(true); }}
//                       activeOpacity={0.85}
//                     >
//                       <Text style={s.listEmoji}>{fileEmoji(report.fileType)}</Text>
//                       <View style={s.listInfo}>
//                         <Text style={s.listName} numberOfLines={1}>{report.fileName}</Text>
//                         <Text style={s.listMeta}>
//                           {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
//                           {report.fileSize ? `  ·  ${(report.fileSize / 1024).toFixed(1)} KB` : ''}
//                         </Text>
//                       </View>
//                       <View style={[s.catBadge, { backgroundColor: cc.bg }]}>
//                         <Text style={[s.catTxt, { color: cc.text }]}>{report.reportCategory}</Text>
//                       </View>
//                       <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                     </TouchableOpacity>
//                   );
//                 })
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           REPORT DETAIL MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showReportDetail} onRequestClose={() => setShowReportDetail(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle} numberOfLines={1}>{selReport?.fileName || 'Report'}</Text>
//               <TouchableOpacity onPress={() => setShowReportDetail(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             {selReport && (
//               <ScrollView contentContainerStyle={s.sheetBody}>
//                 {/* Info */}
//                 <View style={s.detailInfoRow}>
//                   <Text style={{ fontSize: 36 }}>{fileEmoji(selReport.fileType)}</Text>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.detailName}>{selReport.fileName}</Text>
//                     <Text style={s.detailMeta}>
//                       {selReport.uploadedAt ? new Date(selReport.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
//                       {selReport.fileSize ? `  ·  ${(selReport.fileSize / 1024).toFixed(1)} KB` : ''}
//                     </Text>
//                     {(() => {
//                       const cc = categoryColor(selReport.reportCategory);
//                       return (
//                         <View style={[s.catBadge, { backgroundColor: cc.bg, marginTop: 6, alignSelf: 'flex-start' }]}>
//                           <Text style={[s.catTxt, { color: cc.text }]}>{selReport.reportCategory}</Text>
//                         </View>
//                       );
//                     })()}
//                   </View>
//                 </View>

//                 {/* View button */}
//                 <TouchableOpacity
//                   style={[s.viewBtn, { backgroundColor: C.warning }, openingFile && { opacity: 0.5 }]}
//                   onPress={() => openFile(selReport.fileUrl, selReport.fileId, selReport.fileType, selReport.fileName)}
//                   disabled={openingFile}
//                 >
//                   {openingFile
//                     ? <ActivityIndicator size="small" color="#FFF" />
//                     : <Eye size={18} color="#FFF" strokeWidth={2} />
//                   }
//                   <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Report'}</Text>
//                 </TouchableOpacity>

//                 {/* Notes */}
//                 {selReport.notes ? (
//                   <View style={s.infoBox}>
//                     <Text style={s.infoBoxTitle}>Notes</Text>
//                     <Text style={s.infoBoxText}>{selReport.notes}</Text>
//                   </View>
//                 ) : null}

//                 {/* Delete */}
//                 <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteReport(selReport)}>
//                   <Trash2 size={16} color={C.danger} strokeWidth={2} />
//                   <Text style={s.deleteBtnTxt}>Delete Report</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             )}
//             <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowReportDetail(false)}>
//               <Text style={s.sheetFooterBtnTxt}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           DOCTOR VIEWS MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showViews} onRequestClose={() => setShowViews(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <View>
//                 <Text style={s.sheetTitle}>Doctor Access History</Text>
//                 <Text style={s.sheetSub}>{viewCount} total {viewCount === 1 ? 'view' : 'views'}</Text>
//               </View>
//               <TouchableOpacity onPress={() => setShowViews(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={s.sheetBody}>
//               {viewHistory.length === 0 ? (
//                 <View style={s.emptyBox}>
//                   <Stethoscope size={32} color={C.textLight} strokeWidth={1.5} />
//                   <Text style={s.emptyTxt}>No doctors have accessed your record yet.</Text>
//                   <Text style={[s.emptyTxt, { fontSize: 12 }]}>When a doctor views your summary, it will appear here with their name and specialization.</Text>
//                 </View>
//               ) : (
//                 viewHistory.map((v, i) => (
//                   <View key={i} style={s.viewCard}>
//                     <View style={[s.viewCardIcon, { backgroundColor: C.primaryLight }]}>
//                       <Stethoscope size={20} color={C.primary} strokeWidth={2} />
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={s.viewCardName}>{v.doctorName}</Text>
//                       <Text style={s.viewCardSpec}>{v.specialization}</Text>
//                       <Text style={s.viewCardDate}>
//                         {new Date(v.viewedAt).toLocaleDateString('en-GB', {
//                           day: 'numeric', month: 'short', year: 'numeric',
//                           hour: '2-digit', minute: '2-digit',
//                         })}
//                       </Text>
//                     </View>
//                   </View>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ════════════════════════════════════════════════════════════════════════
//           NOTIFICATIONS MODAL
//       ════════════════════════════════════════════════════════════════════════ */}
//       <Modal animationType="slide" transparent visible={showNotifs} onRequestClose={() => setShowNotifs(false)}>
//         <View style={s.overlay}>
//           <View style={s.sheet}>
//             <View style={s.sheetHead}>
//               <Text style={s.sheetTitle}>Alerts & Notifications</Text>
//               <TouchableOpacity onPress={() => setShowNotifs(false)} style={s.closeBtn}>
//                 <X size={20} color={C.textMid} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView>
//               {notifications.length === 0 ? (
//                 <View style={s.emptyBox}><Text style={s.emptyTxt}>No notifications.</Text></View>
//               ) : (
//                 notifications.map(n => (
//                   <TouchableOpacity
//                     key={n._id}
//                     style={[s.notifRow, !n.read && { backgroundColor: '#F0F7FF' }]}
//                     onPress={() => {
//                       setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
//                       ApiService.markNotificationRead(n._id).catch(() => { });
//                     }}
//                   >
//                     <View style={[s.notifIconWrap, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
//                       {n.message.includes('SECURITY')
//                         ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} />
//                         : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />
//                       }
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={[s.notifMsg, !n.read && { fontWeight: '700' }]}>{n.message}</Text>
//                       <Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text>
//                     </View>
//                     {!n.read && <View style={s.unreadDot} />}
//                   </TouchableOpacity>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// // ── Small helper component ────────────────────────────────────────────────────
// function StatusBadge({ status }: { status: string }) {
//   const map: Record<string, { bg: string; text: string; label: string }> = {
//     completed: { bg: '#ECFDF5', text: '#059669', label: '✓ Processed' },
//     failed: { bg: '#FEF2F2', text: '#DC2626', label: '✕ Failed' },
//     processing: { bg: '#FFFBEB', text: '#D97706', label: '⏳ Processing' },
//     pending: { bg: '#EFF6FF', text: '#1A56DB', label: '⏳ Pending' },
//   };
//   const c = map[status] || map.pending;
//   return (
//     <View style={[{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.bg }]}>
//       <Text style={{ fontSize: 11, fontWeight: '600', color: c.text }}>{c.label}</Text>
//     </View>
//   );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { paddingHorizontal: 20, paddingBottom: 40 },

//   // Header
//   header: { backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
//   avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' },
//   greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
//   name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
//   idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
//   bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight },
//   bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
//   headerActions: { flexDirection: 'row', gap: 8 },
//   iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   iconBtnDanger: { backgroundColor: C.dangerLight },
//   badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
//   badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },

//   // Stats
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
//   statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   statVal: { fontSize: 22, fontWeight: '800', color: C.textDark },
//   statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' },
//   statHint: { fontSize: 9, color: C.primary, marginTop: 3, fontWeight: '600' },

//   // QR
//   qrCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.primaryLight },
//   qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
//   qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrThumb: { width: 36, height: 36, borderRadius: 6 },
//   qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   qrSub: { fontSize: 12, color: C.textLight },
//   qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },

//   // Section
//   section: { marginBottom: 28 },
//   sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, marginBottom: 2 },
//   sectionSub: { fontSize: 12, color: C.textLight },
//   seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },

//   // Upload cards
//   uploadRow: { flexDirection: 'row', gap: 12 },
//   uploadCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: C.border },
//   uploadCardOff: { opacity: 0.5 },
//   uploadCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   uploadCardTitle: { fontSize: 14, fontWeight: '800', color: C.textDark, marginBottom: 4 },
//   uploadCardSub: { fontSize: 12, color: C.textMid, textAlign: 'center' },
//   uploadCardSub2: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },

//   // List items
//   listCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
//   listEmoji: { fontSize: 26 },
//   listInfo: { flex: 1 },
//   listName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 },
//   listMeta: { fontSize: 11, color: C.textLight },
//   catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
//   catTxt: { fontSize: 11, fontWeight: '700' },

//   // Empty
//   emptyBox: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 },
//   emptyTxt: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

//   // Sheet (bottom modal)
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
//   sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1, marginRight: 12 },
//   sheetSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
//   closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   sheetBody: { padding: 20, paddingBottom: 8 },
//   sheetFooterBtn: { margin: 20, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
//   sheetFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },

//   // Detail
//   detailInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 18, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
//   detailName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 },
//   detailMeta: { fontSize: 12, color: C.textLight },

//   // View button
//   viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
//   viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

//   // Info box
//   infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16, marginBottom: 14 },
//   infoBoxTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 },
//   infoBoxText: { fontSize: 13, color: C.textMid, lineHeight: 20 },
//   extractSub: { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
//   extractItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },

//   // Delete
//   deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
//   deleteBtnTxt: { fontSize: 14, fontWeight: '700', color: C.danger },

//   // Doctor views
//   viewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 10 },
//   viewCardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   viewCardName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
//   viewCardSpec: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 },
//   viewCardDate: { fontSize: 11, color: C.textLight },

//   // Notifications
//   notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//   notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 18, marginBottom: 3 },
//   notifDate: { fontSize: 11, color: C.textLight },
//   unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
// });

// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
//   Image, ImageSourcePropType, Modal, ActivityIndicator, RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   FileText, LogOut, QrCode, ChevronRight, X, Eye, Bell,
//   ShieldAlert, Stethoscope, Upload, FlaskConical, FilePlus, Trash2,
// } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import ApiService, { BASE_URL } from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext';

// const C = {
//   bg: '#F3F6FD', surface: '#FFFFFF', primary: '#1A56DB', primaryLight: '#EBF2FF',
//   textDark: '#0D1B3E', textMid: '#4A5A7A', textLight: '#9AAABE', border: '#DDE4F5',
//   success: '#059669', successLight: '#ECFDF5', danger: '#DC2626', dangerLight: '#FEF2F2',
//   warning: '#D97706', warningLight: '#FFFBEB', purple: '#7C3AED', purpleLight: '#EDE9FE',
// };

// interface UserData { name: string; email: string; patientId: string; qrCode?: string; bloodGroup?: string; }
// interface DocItem { id: string; fileId: string; name: string; type: string; size: number; status: string; uploadDate: string; fileUrl: string; summary: string; extractedData?: { diagnoses: string[]; medications: string[]; allergies: string[] }; }
// interface ReportItem { id: string; fileId: string; fileName: string; fileType: string; fileSize: number; reportCategory: string; uploadedAt: string; fileUrl: string; notes: string; }
// interface DoctorView { doctorName: string; specialization: string; viewedAt: string; }
// interface AppNotification { _id: string; message: string; createdAt: string; read: boolean; }

// const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'image/jpg'];
// const fileEmoji = (t: string) => !t ? '📎' : t.startsWith('image/') ? '🖼️' : t.includes('pdf') ? '📄' : t.includes('word') || t.includes('docx') ? '📝' : '📎';
// const catColor = (cat: string) => { switch (cat) { case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' }; case 'LFT': return { bg: '#ECFDF5', text: '#065F46' }; case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' }; case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' }; case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' }; case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' }; default: return { bg: '#F1F5F9', text: '#475569' }; } };

// function StatusBadge({ status }: { status: string }) {
//   const m: Record<string, { bg: string; text: string; label: string }> = { completed: { bg: '#ECFDF5', text: '#059669', label: '✓ Processed' }, failed: { bg: '#FEF2F2', text: '#DC2626', label: '✕ Failed' }, processing: { bg: '#FFFBEB', text: '#D97706', label: '⏳ Processing' }, pending: { bg: '#EFF6FF', text: '#1A56DB', label: '⏳ Pending' } };
//   const c = m[status] || m.pending;
//   return <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.bg }}><Text style={{ fontSize: 11, fontWeight: '600', color: c.text }}>{c.label}</Text></View>;
// }

// export default function PatientDashboard(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [documents, setDocuments] = useState<DocItem[]>([]);
//   const [reports, setReports] = useState<ReportItem[]>([]);
//   const [viewCount, setViewCount] = useState(0);
//   const [viewHistory, setViewHistory] = useState<DoctorView[]>([]);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState<'doc' | 'report' | null>(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selDoc, setSelDoc] = useState<DocItem | null>(null);
//   const [selReport, setSelReport] = useState<ReportItem | null>(null);
//   const [openingFile, setOpeningFile] = useState(false);
//   const [showDocs, setShowDocs] = useState(false);
//   const [showDocDetail, setShowDocDetail] = useState(false);
//   const [showReports, setShowReports] = useState(false);
//   const [showReportDetail, setShowReportDetail] = useState(false);
//   const [showViews, setShowViews] = useState(false);
//   const [showNotifs, setShowNotifs] = useState(false);
//   const router = useRouter();

//   useEffect(() => { bootstrap(); }, []);
//   useFocusEffect(useCallback(() => { loadNotifications(); loadViewHistory(); }, []));
//   useEffect(() => { const id = setInterval(loadDocuments, 30000); return () => clearInterval(id); }, []);

//   // KEY FIX: sequential independent loads — one failure cannot crash others
//   async function bootstrap() {
//     setLoading(true);
//     try { await loadUserData(); } catch { }
//     try { await loadDocuments(); } catch { }
//     try { await loadReports(); } catch { }
//     try { await loadViewHistory(); } catch { }
//     try { await loadNotifications(); } catch { }
//     setLoading(false);
//   }

//   async function loadUserData() {
//     try {
//       const s = await AsyncStorage.getItem('userData');
//       if (s) setUserData(JSON.parse(s));
//       const r = await ApiService.getPatientProfile() as any;
//       if (r.success) { setUserData(r.data); await AsyncStorage.setItem('userData', JSON.stringify(r.data)); }
//     } catch { }
//   }
//   async function loadDocuments() { try { const r = await ApiService.getMyDocuments() as any; if (r.success && Array.isArray(r.data)) setDocuments(r.data); } catch { } }
//   async function loadReports() { try { const r = await ApiService.getMyReports() as any; if (r.success && Array.isArray(r.data)) setReports(r.data); } catch { } }
//   async function loadViewHistory() { try { const r = await ApiService.getViewHistory() as any; if (r.success) { setViewCount(r.data?.viewCount || 0); setViewHistory(r.data?.viewHistory || []); } } catch { } }
//   async function loadNotifications() { try { const r = await ApiService.getPatientNotifications(); if (r.success && r.data) setNotifications(r.data as any); } catch { } }

//   const onRefresh = async () => { setRefreshing(true); await bootstrap(); setRefreshing(false); };

//   const pickAndUploadDocument = async () => {
//     try {
//       const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (r.canceled || !r.assets?.[0]) return;
//       const d = r.assets[0]; setUploading('doc');
//       setDocuments(p => [{ id: `temp-${Date.now()}`, fileId: '', name: d.name, type: d.mimeType || 'application/octet-stream', size: d.size || 0, status: 'processing', uploadDate: new Date().toISOString(), fileUrl: '', summary: '' }, ...p]);
//       const u = await ApiService.uploadFile({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (u.success) { Alert.alert('Uploaded ✓', 'Document queued for processing.'); setTimeout(() => { loadDocuments(); try { ApiService.refreshAllSummaries(); } catch { } }, 4000); }
//       else { setDocuments(p => p.filter(x => !x.id.startsWith('temp-'))); Alert.alert('Error', u.message || 'Failed to upload'); }
//     } catch (e: any) { setDocuments(p => p.filter(x => !x.id.startsWith('temp-'))); Alert.alert('Error', e.message || 'Failed to upload'); }
//     finally { setUploading(null); }
//   };

//   const pickAndUploadReport = async () => {
//     try {
//       const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (r.canceled || !r.assets?.[0]) return;
//       const d = r.assets[0]; setUploading('report');
//       const u = await ApiService.uploadReport({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (u.success) { Alert.alert('Uploaded ✓', 'Lab report saved.'); await loadReports(); }
//       else Alert.alert('Error', u.message || 'Failed to upload report');
//     } catch (e: any) { Alert.alert('Error', e.message || 'Failed to upload report'); }
//     finally { setUploading(null); }
//   };

//   // Uses LEGACY expo-file-system API — compatible with Expo Go SDK 53
//   // The new 'expo-file-system/next' File/Paths API is NOT available in Expo Go
//   const openFile = async (url: string, fileId?: string, fileType?: string, fileName?: string) => {
//     if (!url) { Alert.alert('Not available', 'This file is still being processed.'); return; }
//     let fixedUrl = url;
//     try { const h = new URL(BASE_URL).hostname; fixedUrl = url.replace('localhost', h).replace('127.0.0.1', h); } catch { }
//     setOpeningFile(true);
//     try {
//       const safeId = fileId || `file_${Date.now()}`;
//       const ext = fileType?.includes('pdf') || url.endsWith('.pdf') ? '.pdf' : fileType?.startsWith('image/jpeg') || url.endsWith('.jpg') ? '.jpg' : fileType?.startsWith('image/png') || url.endsWith('.png') ? '.png' : fileType?.includes('word') || url.endsWith('.docx') ? '.docx' : '.pdf';
//       const localUri = `${FileSystem.cacheDirectory}seharoop_${safeId}${ext}`;
//       const info = await FileSystem.getInfoAsync(localUri);
//       if (!info.exists) {
//         const token = await ApiService.getToken();
//         const dl = await FileSystem.downloadAsync(fixedUrl, localUri, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
//         if (dl.status !== 200) { Alert.alert('Download Error', `Server returned HTTP ${dl.status}.\nCheck backend at ${BASE_URL}`); return; }
//       }
//       const canShare = await Sharing.isAvailableAsync();
//       if (!canShare) { Alert.alert('Not supported', 'File sharing not available.'); return; }
//       await Sharing.shareAsync(localUri, { mimeType: fileType || 'application/octet-stream', dialogTitle: fileName || 'Open File', UTI: fileType?.includes('pdf') ? 'com.adobe.pdf' : undefined });
//     } catch (e: any) { Alert.alert('Cannot open file', e.message || 'An error occurred.'); }
//     finally { setOpeningFile(false); }
//   };

//   const handleDeleteReport = async (r: ReportItem) => {
//     Alert.alert('Delete Report', `Delete "${r.fileName}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await ApiService.deleteReport(r.id); setReports(p => p.filter(x => x.id !== r.id)); setShowReportDetail(false); } catch (e: any) { Alert.alert('Error', e.message); } } }]);
//   };

//   const handleLogout = () => { Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); } } }]); };

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />} showsVerticalScrollIndicator={false}>

//         {/* Header */}
//         <View style={s.header}>
//           <View style={s.headerRow}>
//             <View style={s.avatarRow}>
//               <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.greeting}>Hello, welcome back</Text>
//                 <Text style={s.name} numberOfLines={1}>{userData?.name || 'Patient'}</Text>
//                 <View style={s.idBadge}>
//                   <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
//                   {userData?.bloodGroup && <><View style={s.bloodDot} /><Text style={s.bloodText}>{userData.bloodGroup}ve</Text></>}
//                 </View>
//               </View>
//             </View>
//             <View style={s.headerActions}>
//               <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
//                 <Bell size={18} color={C.primary} strokeWidth={2} />
//                 {unreadCount > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>}
//               </TouchableOpacity>
//               <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}><LogOut size={18} color={C.danger} strokeWidth={2} /></TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* Stats */}
//         <View style={s.statsRow}>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.primaryLight }]}><FileText size={18} color={C.primary} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{documents.length}</Text><Text style={s.statLabel}>Documents</Text>
//             {documents.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowViews(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.successLight }]}><Stethoscope size={18} color={C.success} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{viewCount}</Text><Text style={s.statLabel}>Dr. Views</Text>
//             {viewCount > 0 && <Text style={s.statHint}>Tap to see</Text>}
//           </TouchableOpacity>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowReports(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={18} color={C.warning} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{reports.length}</Text><Text style={s.statLabel}>Reports</Text>
//             {reports.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//         </View>

//         {/* QR */}
//         <TouchableOpacity style={s.qrCard} activeOpacity={0.9}
//           onPress={() => { if (userData?.qrCode) router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } }); else Alert.alert('Info', 'QR code is being generated…'); }}>
//           <View style={s.qrLeft}>
//             <View style={s.qrIconWrap}>{userData?.qrCode ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" /> : <QrCode size={28} color={C.primary} strokeWidth={1.8} />}</View>
//             <View><Text style={s.qrTitle}>Your Health QR</Text><Text style={s.qrSub}>Tap to view full QR code</Text></View>
//           </View>
//           <View style={s.qrArrow}><ChevronRight size={18} color={C.primary} strokeWidth={2} /></View>
//         </TouchableOpacity>

//         {/* Upload */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Upload</Text>
//           <Text style={[s.sectionSub, { marginBottom: 14 }]}>Choose what you want to upload</Text>
//           <View style={s.uploadRow}>
//             <TouchableOpacity style={[s.uploadCard, uploading === 'doc' && s.uploadCardOff]} onPress={pickAndUploadDocument} disabled={!!uploading} activeOpacity={0.85}>
//               {uploading === 'doc' ? <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.primaryLight }]}><FilePlus size={24} color={C.primary} strokeWidth={1.8} /></View>}
//               <Text style={s.uploadCardTitle}>Document</Text><Text style={s.uploadCardSub}>Generates AI summary</Text><Text style={s.uploadCardSub2}>PDF · DOCX · TXT · Image</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={[s.uploadCard, uploading === 'report' && s.uploadCardOff, { borderColor: C.warning }]} onPress={pickAndUploadReport} disabled={!!uploading} activeOpacity={0.85}>
//               {uploading === 'report' ? <ActivityIndicator size="small" color={C.warning} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={24} color={C.warning} strokeWidth={1.8} /></View>}
//               <Text style={[s.uploadCardTitle, { color: C.warning }]}>Lab Report</Text><Text style={s.uploadCardSub}>Stored & viewable</Text><Text style={s.uploadCardSub2}>KFT · LFT · CBC · etc.</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Documents */}
//         <View style={s.section}>
//           <View style={s.sectionHead}><Text style={s.sectionTitle}>My Documents</Text><TouchableOpacity onPress={() => setShowDocs(true)}><Text style={s.seeAll}>See All ({documents.length})</Text></TouchableOpacity></View>
//           {documents.length === 0 ? <View style={s.emptyBox}><Upload size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No documents yet.</Text></View>
//             : documents.slice(0, 3).map(doc => (
//               <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
//                 <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                 <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}{doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}</Text></View>
//                 <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//               </TouchableOpacity>
//             ))}
//         </View>

//         {/* Reports */}
//         <View style={s.section}>
//           <View style={s.sectionHead}><Text style={s.sectionTitle}>Lab Reports</Text><TouchableOpacity onPress={() => setShowReports(true)}><Text style={s.seeAll}>See All ({reports.length})</Text></TouchableOpacity></View>
//           {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
//             : reports.slice(0, 3).map(r => {
//               const cc = catColor(r.reportCategory); return (
//                 <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
//                   <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
//                   <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                   <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
//                   <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               );
//             })}
//         </View>
//       </ScrollView>

//       {/* Docs List Modal */}
//       <Modal animationType="slide" transparent visible={showDocs} onRequestClose={() => setShowDocs(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>My Documents ({documents.length})</Text><TouchableOpacity onPress={() => setShowDocs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {documents.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No documents yet.</Text></View>
//               : documents.map(doc => (
//                 <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setShowDocs(false); setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
//                   <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                   <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                   <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Doc Detail Modal */}
//       <Modal animationType="slide" transparent visible={showDocDetail} onRequestClose={() => setShowDocDetail(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selDoc?.name || 'Document'}</Text><TouchableOpacity onPress={() => setShowDocDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           {selDoc && (<ScrollView contentContainerStyle={s.sheetBody}>
//             <View style={s.detailInfoRow}>
//               <Text style={{ fontSize: 36 }}>{fileEmoji(selDoc.type)}</Text>
//               <View style={{ flex: 1 }}><Text style={s.detailName}>{selDoc.name}</Text><Text style={s.detailMeta}>{selDoc.uploadDate ? new Date(selDoc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}{selDoc.size ? `  ·  ${(selDoc.size / 1024).toFixed(1)} KB` : ''}</Text><StatusBadge status={selDoc.status} /></View>
//             </View>
//             <TouchableOpacity style={[s.viewBtn, (!selDoc.fileUrl || openingFile) && { opacity: 0.5 }]} onPress={() => openFile(selDoc.fileUrl, selDoc.fileId, selDoc.type, selDoc.name)} disabled={!selDoc.fileUrl || openingFile}>
//               {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
//               <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Document'}</Text>
//             </TouchableOpacity>
//             {selDoc.summary ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Summary</Text><Text style={s.infoBoxText}>{selDoc.summary}</Text></View> : null}
//             {selDoc.extractedData && <View style={s.infoBox}>
//               <Text style={s.infoBoxTitle}>Extracted Information</Text>
//               {selDoc.extractedData.diagnoses?.length > 0 && <><Text style={s.extractSub}>Diagnoses</Text>{selDoc.extractedData.diagnoses.map((d, i) => <Text key={i} style={s.extractItem}>• {d}</Text>)}</>}
//               {selDoc.extractedData.medications?.length > 0 && <><Text style={[s.extractSub, { color: C.success }]}>Medications</Text>{selDoc.extractedData.medications.map((m, i) => <Text key={i} style={[s.extractItem, { color: C.success }]}>• {m}</Text>)}</>}
//               {selDoc.extractedData.allergies?.length > 0 && <><Text style={[s.extractSub, { color: C.danger }]}>Allergies</Text>{selDoc.extractedData.allergies.map((a, i) => <Text key={i} style={[s.extractItem, { color: C.danger }]}>• {a}</Text>)}</>}
//             </View>}
//           </ScrollView>)}
//           <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowDocDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
//         </View></View>
//       </Modal>

//       {/* Reports List Modal */}
//       <Modal animationType="slide" transparent visible={showReports} onRequestClose={() => setShowReports(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>Lab Reports ({reports.length})</Text><TouchableOpacity onPress={() => setShowReports(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
//               : reports.map(r => {
//                 const cc = catColor(r.reportCategory); return (
//                   <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setShowReports(false); setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
//                     <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
//                     <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                     <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
//                     <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                   </TouchableOpacity>
//                 );
//               })}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Report Detail Modal */}
//       <Modal animationType="slide" transparent visible={showReportDetail} onRequestClose={() => setShowReportDetail(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selReport?.fileName || 'Report'}</Text><TouchableOpacity onPress={() => setShowReportDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           {selReport && (<ScrollView contentContainerStyle={s.sheetBody}>
//             <View style={s.detailInfoRow}>
//               <Text style={{ fontSize: 36 }}>{fileEmoji(selReport.fileType)}</Text>
//               <View style={{ flex: 1 }}><Text style={s.detailName}>{selReport.fileName}</Text><Text style={s.detailMeta}>{selReport.uploadedAt ? new Date(selReport.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</Text>{(() => { const cc = catColor(selReport.reportCategory); return <View style={[s.catBadge, { backgroundColor: cc.bg, marginTop: 6, alignSelf: 'flex-start' }]}><Text style={[s.catTxt, { color: cc.text }]}>{selReport.reportCategory}</Text></View>; })()}</View>
//             </View>
//             <TouchableOpacity style={[s.viewBtn, { backgroundColor: C.warning }, openingFile && { opacity: 0.5 }]} onPress={() => openFile(selReport.fileUrl, selReport.fileId, selReport.fileType, selReport.fileName)} disabled={openingFile}>
//               {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
//               <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Report'}</Text>
//             </TouchableOpacity>
//             {selReport.notes ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Notes</Text><Text style={s.infoBoxText}>{selReport.notes}</Text></View> : null}
//             <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteReport(selReport)}><Trash2 size={16} color={C.danger} strokeWidth={2} /><Text style={s.deleteBtnTxt}>Delete Report</Text></TouchableOpacity>
//           </ScrollView>)}
//           <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowReportDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
//         </View></View>
//       </Modal>

//       {/* Views Modal */}
//       <Modal animationType="slide" transparent visible={showViews} onRequestClose={() => setShowViews(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><View><Text style={s.sheetTitle}>Doctor Access History</Text><Text style={s.sheetSub}>{viewCount} total {viewCount === 1 ? 'view' : 'views'}</Text></View><TouchableOpacity onPress={() => setShowViews(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {viewHistory.length === 0 ? <View style={s.emptyBox}><Stethoscope size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No doctors have accessed your record yet.</Text></View>
//               : viewHistory.map((v, i) => (
//                 <View key={i} style={s.viewCard}>
//                   <View style={[s.viewCardIcon, { backgroundColor: C.primaryLight }]}><Stethoscope size={20} color={C.primary} strokeWidth={2} /></View>
//                   <View style={{ flex: 1 }}><Text style={s.viewCardName}>{v.doctorName}</Text><Text style={s.viewCardSpec}>{v.specialization}</Text><Text style={s.viewCardDate}>{new Date(v.viewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></View>
//                 </View>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Notifications Modal */}
//       <Modal animationType="slide" transparent visible={showNotifs} onRequestClose={() => setShowNotifs(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>Alerts & Notifications</Text><TouchableOpacity onPress={() => setShowNotifs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView>
//             {notifications.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No notifications.</Text></View>
//               : notifications.map(n => (
//                 <TouchableOpacity key={n._id} style={[s.notifRow, !n.read && { backgroundColor: '#F0F7FF' }]}
//                   onPress={() => { setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x)); ApiService.markNotificationRead(n._id).catch(() => { }); }}>
//                   <View style={[s.notifIconWrap, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
//                     {n.message.includes('SECURITY') ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} /> : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />}
//                   </View>
//                   <View style={{ flex: 1 }}><Text style={[s.notifMsg, !n.read && { fontWeight: '700' }]}>{n.message}</Text><Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text></View>
//                   {!n.read && <View style={s.unreadDot} />}
//                 </TouchableOpacity>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg }, scroll: { paddingHorizontal: 20, paddingBottom: 40 },
//   header: { backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
//   avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' }, greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
//   name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
//   idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
//   bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight }, bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
//   headerActions: { flexDirection: 'row', gap: 8 },
//   iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   iconBtnDanger: { backgroundColor: C.dangerLight },
//   badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
//   badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
//   statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   statVal: { fontSize: 22, fontWeight: '800', color: C.textDark }, statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' }, statHint: { fontSize: 9, color: C.primary, marginTop: 3, fontWeight: '600' },
//   qrCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.primaryLight },
//   qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 }, qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrThumb: { width: 36, height: 36, borderRadius: 6 }, qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, qrSub: { fontSize: 12, color: C.textLight },
//   qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   section: { marginBottom: 28 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, marginBottom: 2 }, sectionSub: { fontSize: 12, color: C.textLight }, seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },
//   uploadRow: { flexDirection: 'row', gap: 12 },
//   uploadCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: C.border },
//   uploadCardOff: { opacity: 0.5 }, uploadCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   uploadCardTitle: { fontSize: 14, fontWeight: '800', color: C.textDark, marginBottom: 4 }, uploadCardSub: { fontSize: 12, color: C.textMid, textAlign: 'center' }, uploadCardSub2: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },
//   listCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
//   listEmoji: { fontSize: 26 }, listInfo: { flex: 1 }, listName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 }, listMeta: { fontSize: 11, color: C.textLight },
//   catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }, catTxt: { fontSize: 11, fontWeight: '700' },
//   emptyBox: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 }, emptyTxt: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
//   sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1, marginRight: 12 }, sheetSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
//   closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   sheetBody: { padding: 20, paddingBottom: 8 }, sheetFooterBtn: { margin: 20, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, sheetFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
//   detailInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 18, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
//   detailName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 }, detailMeta: { fontSize: 12, color: C.textLight },
//   viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }, viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
//   infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16, marginBottom: 14 }, infoBoxTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 }, infoBoxText: { fontSize: 13, color: C.textMid, lineHeight: 20 },
//   extractSub: { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }, extractItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },
//   deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 14, marginTop: 4 }, deleteBtnTxt: { fontSize: 14, fontWeight: '700', color: C.danger },
//   viewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 10 },
//   viewCardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   viewCardName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, viewCardSpec: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 }, viewCardDate: { fontSize: 11, color: C.textLight },
//   notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//   notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 18, marginBottom: 3 }, notifDate: { fontSize: 11, color: C.textLight }, unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
// });

//6-5
// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
//   Image, ImageSourcePropType, Modal, ActivityIndicator, RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   FileText, LogOut, QrCode, ChevronRight, X, Eye, Bell,
//   ShieldAlert, Stethoscope, Upload, FlaskConical, FilePlus, Trash2,
// } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import { WebView } from 'react-native-webview';
// import ApiService, { BASE_URL } from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext';
// import { sosService } from '../../services/SOSService';

// const C = {
//   bg: '#F3F6FD', surface: '#FFFFFF', primary: '#1A56DB', primaryLight: '#EBF2FF',
//   textDark: '#0D1B3E', textMid: '#4A5A7A', textLight: '#9AAABE', border: '#DDE4F5',
//   success: '#059669', successLight: '#ECFDF5', danger: '#DC2626', dangerLight: '#FEF2F2',
//   warning: '#D97706', warningLight: '#FFFBEB', purple: '#7C3AED', purpleLight: '#EDE9FE',
// };

// interface UserData { name: string; email: string; patientId: string; qrCode?: string; bloodGroup?: string; }
// interface DocItem { id: string; fileId: string; name: string; type: string; size: number; status: string; uploadDate: string; fileUrl: string; summary: string; extractedData?: { diagnoses: string[]; medications: string[]; allergies: string[] }; }
// interface ReportItem { id: string; fileId: string; fileName: string; fileType: string; fileSize: number; reportCategory: string; uploadedAt: string; fileUrl: string; notes: string; }
// interface DoctorView { doctorName: string; specialization: string; viewedAt: string; }
// interface AppNotification { _id: string; message: string; createdAt: string; read: boolean; }

// const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'image/jpg'];
// const fileEmoji = (t: string) => !t ? '📎' : t.startsWith('image/') ? '🖼️' : t.includes('pdf') ? '📄' : t.includes('word') || t.includes('docx') ? '📝' : '📎';
// const catColor = (cat: string) => { switch (cat) { case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' }; case 'LFT': return { bg: '#ECFDF5', text: '#065F46' }; case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' }; case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' }; case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' }; case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' }; default: return { bg: '#F1F5F9', text: '#475569' }; } };

// function StatusBadge({ status }: { status: string }) {
//   const m: Record<string, { bg: string; text: string; label: string }> = { completed: { bg: '#ECFDF5', text: '#059669', label: '✓ Processed' }, failed: { bg: '#FEF2F2', text: '#DC2626', label: '✕ Failed' }, processing: { bg: '#FFFBEB', text: '#D97706', label: '⏳ Processing' }, pending: { bg: '#EFF6FF', text: '#1A56DB', label: '⏳ Pending' } };
//   const c = m[status] || m.pending;
//   return <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.bg }}><Text style={{ fontSize: 11, fontWeight: '600', color: c.text }}>{c.label}</Text></View>;
// }

// export default function PatientDashboard(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [documents, setDocuments] = useState<DocItem[]>([]);
//   const [reports, setReports] = useState<ReportItem[]>([]);
//   const [viewCount, setViewCount] = useState(0);
//   const [viewHistory, setViewHistory] = useState<DoctorView[]>([]);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState<'doc' | 'report' | null>(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selDoc, setSelDoc] = useState<DocItem | null>(null);
//   const [selReport, setSelReport] = useState<ReportItem | null>(null);
//   const [openingFile, setOpeningFile] = useState(false);
//   const [showDocs, setShowDocs] = useState(false);
//   const [showDocDetail, setShowDocDetail] = useState(false);
//   const [showReports, setShowReports] = useState(false);
//   const [showReportDetail, setShowReportDetail] = useState(false);
//   const [showViews, setShowViews] = useState(false);
//   const [showNotifs, setShowNotifs] = useState(false);

//   // Document viewer states
//   const [viewerVisible, setViewerVisible] = useState(false);
//   const [viewerUri, setViewerUri] = useState('');
//   const [viewerTitle, setViewerTitle] = useState('');

//   const router = useRouter();

//   useEffect(() => { bootstrap(); }, []);
//   useFocusEffect(useCallback(() => { loadNotifications(); loadViewHistory(); }, []));
//   useEffect(() => { const id = setInterval(loadDocuments, 30000); return () => clearInterval(id); }, []);

//   //notification


//   async function bootstrap() {
//     setLoading(true);
//     try { await loadUserData(); } catch { }
//     try { await loadDocuments(); } catch { }
//     try { await loadReports(); } catch { }
//     try { await loadViewHistory(); } catch { }
//     try { await loadNotifications(); } catch { }
//     setLoading(false);
//   }

//   async function loadUserData() {
//     try {
//       const s = await AsyncStorage.getItem('userData');
//       if (s) setUserData(JSON.parse(s));
//       const r = await ApiService.getPatientProfile() as any;
//       if (r.success) { setUserData(r.data); await AsyncStorage.setItem('userData', JSON.stringify(r.data)); }
//     } catch { }
//   }
//   async function loadDocuments() { try { const r = await ApiService.getMyDocuments() as any; if (r.success && Array.isArray(r.data)) setDocuments(r.data); } catch { } }
//   async function loadReports() { try { const r = await ApiService.getMyReports() as any; if (r.success && Array.isArray(r.data)) setReports(r.data); } catch { } }
//   async function loadViewHistory() { try { const r = await ApiService.getViewHistory() as any; if (r.success) { setViewCount(r.data?.viewCount || 0); setViewHistory(r.data?.viewHistory || []); } } catch { } }
//   async function loadNotifications() { try { const r = await ApiService.getPatientNotifications(); if (r.success && r.data) setNotifications(r.data as any); } catch { } }

//   const onRefresh = async () => { setRefreshing(true); await bootstrap(); setRefreshing(false); };

//   const pickAndUploadDocument = async () => {
//     try {
//       const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (r.canceled || !r.assets?.[0]) return;
//       const d = r.assets[0]; setUploading('doc');
//       setDocuments(p => [{ id: `temp-${Date.now()}`, fileId: '', name: d.name, type: d.mimeType || 'application/octet-stream', size: d.size || 0, status: 'processing', uploadDate: new Date().toISOString(), fileUrl: '', summary: '' }, ...p]);
//       const u = await ApiService.uploadFile({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (u.success) { Alert.alert('Uploaded ✓', 'Document queued for processing.'); setTimeout(() => { loadDocuments(); try { ApiService.refreshAllSummaries(); } catch { } }, 4000); }
//       else { setDocuments(p => p.filter(x => !x.id.startsWith('temp-'))); Alert.alert('Error', u.message || 'Failed to upload'); }
//     } catch (e: any) { setDocuments(p => p.filter(x => !x.id.startsWith('temp-'))); Alert.alert('Error', e.message || 'Failed to upload'); }
//     finally { setUploading(null); }
//   };

//   const pickAndUploadReport = async () => {
//     try {
//       const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (r.canceled || !r.assets?.[0]) return;
//       const d = r.assets[0]; setUploading('report');
//       const u = await ApiService.uploadReport({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (u.success) { Alert.alert('Uploaded ✓', 'Lab report saved.'); await loadReports(); }
//       else Alert.alert('Error', u.message || 'Failed to upload report');
//     } catch (e: any) { Alert.alert('Error', e.message || 'Failed to upload report'); }
//     finally { setUploading(null); }
//   };

//   // Updated openFile function with WebView for all document types
//   const openFile = async (url: string, fileId?: string, fileType?: string, fileName?: string) => {
//     if (!url) {
//       Alert.alert('Not available', 'This file is still being processed.');
//       return;
//     }

//     let fixedUrl = url;
//     try {
//       const h = new URL(BASE_URL).hostname;
//       fixedUrl = url.replace('localhost', h).replace('127.0.0.1', h);
//     } catch { }

//     setOpeningFile(true);
//     try {
//       const safeId = fileId || `file_${Date.now()}`;
//       const ext = fileType?.includes('pdf') || fixedUrl.endsWith('.pdf') ? '.pdf'
//         : fileType?.startsWith('image/jpeg') || fixedUrl.endsWith('.jpg') ? '.jpg'
//           : fileType?.startsWith('image/png') || fixedUrl.endsWith('.png') ? '.png'
//             : '.pdf';

//       const localUri = `${FileSystem.cacheDirectory}seharoop_${safeId}${ext}`;

//       // Check if file exists in cache
//       const info = await FileSystem.getInfoAsync(localUri);
//       if (!info.exists) {
//         const token = await ApiService.getToken();
//         const downloadResult = await FileSystem.downloadAsync(fixedUrl, localUri, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {}
//         });
//         if (downloadResult.status !== 200) {
//           Alert.alert('Download Error', `Failed to download file. Status: ${downloadResult.status}`);
//           return;
//         }
//       }

//       // Use WebView for all document types
//       setViewerTitle(fileName || 'Document Viewer');
//       setViewerUri(localUri);
//       setViewerVisible(true);

//     } catch (e: any) {
//       Alert.alert('Cannot open file', e.message || 'An error occurred.');
//     } finally {
//       setOpeningFile(false);
//     }
//   };

//   const handleDeleteReport = async (r: ReportItem) => {
//     Alert.alert('Delete Report', `Delete "${r.fileName}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await ApiService.deleteReport(r.id); setReports(p => p.filter(x => x.id !== r.id)); setShowReportDetail(false); } catch (e: any) { Alert.alert('Error', e.message); } } }]);
//   };

//   const handleLogout = () => { Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); } } }]); };

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />} showsVerticalScrollIndicator={false}>

//         {/* Header */}
//         <View style={s.header}>
//           <View style={s.headerRow}>
//             <View style={s.avatarRow}>
//               <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.greeting}>Hello, welcome back</Text>
//                 <Text style={s.name} numberOfLines={1}>{userData?.name || 'Patient'}</Text>
//                 <View style={s.idBadge}>
//                   <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
//                   {userData?.bloodGroup && <><View style={s.bloodDot} /><Text style={s.bloodText}>{userData.bloodGroup}ve</Text></>}
//                 </View>
//               </View>
//             </View>
//             <View style={s.headerActions}>
//               <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
//                 <Bell size={18} color={C.primary} strokeWidth={2} />
//                 {unreadCount > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>}
//               </TouchableOpacity>
//               <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}><LogOut size={18} color={C.danger} strokeWidth={2} /></TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* Stats */}
//         <View style={s.statsRow}>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.primaryLight }]}><FileText size={18} color={C.primary} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{documents.length}</Text><Text style={s.statLabel}>Documents</Text>
//             {documents.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowViews(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.successLight }]}><Stethoscope size={18} color={C.success} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{viewCount}</Text><Text style={s.statLabel}>Dr. Views</Text>
//             {viewCount > 0 && <Text style={s.statHint}>Tap to see</Text>}
//           </TouchableOpacity>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowReports(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={18} color={C.warning} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{reports.length}</Text><Text style={s.statLabel}>Reports</Text>
//             {reports.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//         </View>

//         {/* QR */}
//         <TouchableOpacity style={s.qrCard} activeOpacity={0.9}
//           onPress={() => { if (userData?.qrCode) router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } }); else Alert.alert('Info', 'QR code is being generated…'); }}>
//           <View style={s.qrLeft}>
//             <View style={s.qrIconWrap}>{userData?.qrCode ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" /> : <QrCode size={28} color={C.primary} strokeWidth={1.8} />}</View>
//             <View><Text style={s.qrTitle}>Your Health QR</Text><Text style={s.qrSub}>Tap to view full QR code</Text></View>
//           </View>
//           <View style={s.qrArrow}><ChevronRight size={18} color={C.primary} strokeWidth={2} /></View>
//         </TouchableOpacity>

//         {/* Upload */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Upload</Text>
//           <Text style={[s.sectionSub, { marginBottom: 14 }]}>Choose what you want to upload</Text>
//           <View style={s.uploadRow}>
//             <TouchableOpacity style={[s.uploadCard, uploading === 'doc' && s.uploadCardOff]} onPress={pickAndUploadDocument} disabled={!!uploading} activeOpacity={0.85}>
//               {uploading === 'doc' ? <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.primaryLight }]}><FilePlus size={24} color={C.primary} strokeWidth={1.8} /></View>}
//               <Text style={s.uploadCardTitle}>Document</Text><Text style={s.uploadCardSub}>Generates AI summary</Text><Text style={s.uploadCardSub2}>PDF · DOCX · TXT · Image</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={[s.uploadCard, uploading === 'report' && s.uploadCardOff, { borderColor: C.warning }]} onPress={pickAndUploadReport} disabled={!!uploading} activeOpacity={0.85}>
//               {uploading === 'report' ? <ActivityIndicator size="small" color={C.warning} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={24} color={C.warning} strokeWidth={1.8} /></View>}
//               <Text style={[s.uploadCardTitle, { color: C.warning }]}>Lab Report</Text><Text style={s.uploadCardSub}>Stored & viewable</Text><Text style={s.uploadCardSub2}>KFT · LFT · CBC · etc.</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Documents */}
//         <View style={s.section}>
//           <View style={s.sectionHead}><Text style={s.sectionTitle}>My Documents</Text><TouchableOpacity onPress={() => setShowDocs(true)}><Text style={s.seeAll}>See All ({documents.length})</Text></TouchableOpacity></View>
//           {documents.length === 0 ? <View style={s.emptyBox}><Upload size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No documents yet.</Text></View>
//             : documents.slice(0, 3).map(doc => (
//               <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
//                 <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                 <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}{doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}</Text></View>
//                 <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//               </TouchableOpacity>
//             ))}
//         </View>

//         {/* Reports */}
//         <View style={s.section}>
//           <View style={s.sectionHead}><Text style={s.sectionTitle}>Lab Reports</Text><TouchableOpacity onPress={() => setShowReports(true)}><Text style={s.seeAll}>See All ({reports.length})</Text></TouchableOpacity></View>
//           {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
//             : reports.slice(0, 3).map(r => {
//               const cc = catColor(r.reportCategory); return (
//                 <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
//                   <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
//                   <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                   <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
//                   <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               );
//             })}
//         </View>
//       </ScrollView>

//       {/* Docs List Modal */}
//       <Modal animationType="slide" transparent visible={showDocs} onRequestClose={() => setShowDocs(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>My Documents ({documents.length})</Text><TouchableOpacity onPress={() => setShowDocs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {documents.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No documents yet.</Text></View>
//               : documents.map(doc => (
//                 <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setShowDocs(false); setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
//                   <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                   <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                   <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Doc Detail Modal */}
//       <Modal animationType="slide" transparent visible={showDocDetail} onRequestClose={() => setShowDocDetail(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selDoc?.name || 'Document'}</Text><TouchableOpacity onPress={() => setShowDocDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           {selDoc && (<ScrollView contentContainerStyle={s.sheetBody}>
//             <View style={s.detailInfoRow}>
//               <Text style={{ fontSize: 36 }}>{fileEmoji(selDoc.type)}</Text>
//               <View style={{ flex: 1 }}><Text style={s.detailName}>{selDoc.name}</Text><Text style={s.detailMeta}>{selDoc.uploadDate ? new Date(selDoc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}{selDoc.size ? `  ·  ${(selDoc.size / 1024).toFixed(1)} KB` : ''}</Text><StatusBadge status={selDoc.status} /></View>
//             </View>
//             <TouchableOpacity style={[s.viewBtn, (!selDoc.fileUrl || openingFile) && { opacity: 0.5 }]} onPress={() => openFile(selDoc.fileUrl, selDoc.fileId, selDoc.type, selDoc.name)} disabled={!selDoc.fileUrl || openingFile}>
//               {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
//               <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Document'}</Text>
//             </TouchableOpacity>
//             {selDoc.summary ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Summary</Text><Text style={s.infoBoxText}>{selDoc.summary}</Text></View> : null}
//             {selDoc.extractedData && <View style={s.infoBox}>
//               <Text style={s.infoBoxTitle}>Extracted Information</Text>
//               {selDoc.extractedData.diagnoses?.length > 0 && <><Text style={s.extractSub}>Diagnoses</Text>{selDoc.extractedData.diagnoses.map((d, i) => <Text key={i} style={s.extractItem}>• {d}</Text>)}</>}
//               {selDoc.extractedData.medications?.length > 0 && <><Text style={[s.extractSub, { color: C.success }]}>Medications</Text>{selDoc.extractedData.medications.map((m, i) => <Text key={i} style={[s.extractItem, { color: C.success }]}>• {m}</Text>)}</>}
//               {selDoc.extractedData.allergies?.length > 0 && <><Text style={[s.extractSub, { color: C.danger }]}>Allergies</Text>{selDoc.extractedData.allergies.map((a, i) => <Text key={i} style={[s.extractItem, { color: C.danger }]}>• {a}</Text>)}</>}
//             </View>}
//           </ScrollView>)}
//           <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowDocDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
//         </View></View>
//       </Modal>

//       {/* Reports List Modal */}
//       <Modal animationType="slide" transparent visible={showReports} onRequestClose={() => setShowReports(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>Lab Reports ({reports.length})</Text><TouchableOpacity onPress={() => setShowReports(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
//               : reports.map(r => {
//                 const cc = catColor(r.reportCategory); return (
//                   <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setShowReports(false); setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
//                     <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
//                     <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                     <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
//                     <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                   </TouchableOpacity>
//                 );
//               })}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Report Detail Modal */}
//       <Modal animationType="slide" transparent visible={showReportDetail} onRequestClose={() => setShowReportDetail(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selReport?.fileName || 'Report'}</Text><TouchableOpacity onPress={() => setShowReportDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           {selReport && (<ScrollView contentContainerStyle={s.sheetBody}>
//             <View style={s.detailInfoRow}>
//               <Text style={{ fontSize: 36 }}>{fileEmoji(selReport.fileType)}</Text>
//               <View style={{ flex: 1 }}><Text style={s.detailName}>{selReport.fileName}</Text><Text style={s.detailMeta}>{selReport.uploadedAt ? new Date(selReport.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</Text>{(() => { const cc = catColor(selReport.reportCategory); return <View style={[s.catBadge, { backgroundColor: cc.bg, marginTop: 6, alignSelf: 'flex-start' }]}><Text style={[s.catTxt, { color: cc.text }]}>{selReport.reportCategory}</Text></View>; })()}</View>
//             </View>
//             <TouchableOpacity style={[s.viewBtn, { backgroundColor: C.warning }, openingFile && { opacity: 0.5 }]} onPress={() => openFile(selReport.fileUrl, selReport.fileId, selReport.fileType, selReport.fileName)} disabled={openingFile}>
//               {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
//               <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Report'}</Text>
//             </TouchableOpacity>
//             {selReport.notes ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Notes</Text><Text style={s.infoBoxText}>{selReport.notes}</Text></View> : null}
//             <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteReport(selReport)}><Trash2 size={16} color={C.danger} strokeWidth={2} /><Text style={s.deleteBtnTxt}>Delete Report</Text></TouchableOpacity>
//           </ScrollView>)}
//           <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowReportDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
//         </View></View>
//       </Modal>

//       {/* Views Modal */}
//       <Modal animationType="slide" transparent visible={showViews} onRequestClose={() => setShowViews(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><View><Text style={s.sheetTitle}>Doctor Access History</Text><Text style={s.sheetSub}>{viewCount} total {viewCount === 1 ? 'view' : 'views'}</Text></View><TouchableOpacity onPress={() => setShowViews(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {viewHistory.length === 0 ? <View style={s.emptyBox}><Stethoscope size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No doctors have accessed your record yet.</Text></View>
//               : viewHistory.map((v, i) => (
//                 <View key={i} style={s.viewCard}>
//                   <View style={[s.viewCardIcon, { backgroundColor: C.primaryLight }]}><Stethoscope size={20} color={C.primary} strokeWidth={2} /></View>
//                   <View style={{ flex: 1 }}><Text style={s.viewCardName}>{v.doctorName}</Text><Text style={s.viewCardSpec}>{v.specialization}</Text><Text style={s.viewCardDate}>{new Date(v.viewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></View>
//                 </View>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Notifications Modal */}
//       <Modal animationType="slide" transparent visible={showNotifs} onRequestClose={() => setShowNotifs(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>Alerts & Notifications</Text><TouchableOpacity onPress={() => setShowNotifs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView>
//             {notifications.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No notifications.</Text></View>
//               : notifications.map(n => (
//                 <TouchableOpacity key={n._id} style={[s.notifRow, !n.read && { backgroundColor: '#F0F7FF' }]}
//                   onPress={() => { setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x)); ApiService.markNotificationRead(n._id).catch(() => { }); }}>
//                   <View style={[s.notifIconWrap, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
//                     {n.message.includes('SECURITY') ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} /> : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />}
//                   </View>
//                   <View style={{ flex: 1 }}><Text style={[s.notifMsg, !n.read && { fontWeight: '700' }]}>{n.message}</Text><Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text></View>
//                   {!n.read && <View style={s.unreadDot} />}
//                 </TouchableOpacity>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Document Viewer Modal using WebView */}
//       <Modal
//         visible={viewerVisible}
//         transparent={false}
//         animationType="slide"
//         onRequestClose={() => setViewerVisible(false)}
//       >
//         <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
//           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#2a2a2a' }}>
//             <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>{viewerTitle}</Text>
//             <TouchableOpacity onPress={() => setViewerVisible(false)} style={{ padding: 8 }}>
//               <Text style={{ color: '#FFF', fontSize: 16 }}>Close</Text>
//             </TouchableOpacity>
//           </View>
//           <WebView
//             source={{ uri: viewerUri }}
//             style={{ flex: 1 }}
//             originWhitelist={['*']}
//             scalesPageToFit={true}
//             startInLoadingState={true}
//             renderLoading={() => (
//               <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//                 <ActivityIndicator size="large" color={C.primary} />
//               </View>
//             )}
//             onError={(error) => {
//               console.log('WebView Error:', error);
//               Alert.alert('Error', 'Failed to load document');
//               setViewerVisible(false);
//             }}
//           />
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg }, scroll: { paddingHorizontal: 20, paddingBottom: 40 },
//   header: { backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
//   avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' }, greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
//   name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
//   idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
//   bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight }, bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
//   headerActions: { flexDirection: 'row', gap: 8 },
//   iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   iconBtnDanger: { backgroundColor: C.dangerLight },
//   badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
//   badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
//   statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   statVal: { fontSize: 22, fontWeight: '800', color: C.textDark }, statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' }, statHint: { fontSize: 9, color: C.primary, marginTop: 3, fontWeight: '600' },
//   qrCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.primaryLight },
//   qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 }, qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrThumb: { width: 36, height: 36, borderRadius: 6 }, qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, qrSub: { fontSize: 12, color: C.textLight },
//   qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   section: { marginBottom: 28 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, marginBottom: 2 }, sectionSub: { fontSize: 12, color: C.textLight }, seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },
//   uploadRow: { flexDirection: 'row', gap: 12 },
//   uploadCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: C.border },
//   uploadCardOff: { opacity: 0.5 }, uploadCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   uploadCardTitle: { fontSize: 14, fontWeight: '800', color: C.textDark, marginBottom: 4 }, uploadCardSub: { fontSize: 12, color: C.textMid, textAlign: 'center' }, uploadCardSub2: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },
//   listCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
//   listEmoji: { fontSize: 26 }, listInfo: { flex: 1 }, listName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 }, listMeta: { fontSize: 11, color: C.textLight },
//   catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }, catTxt: { fontSize: 11, fontWeight: '700' },
//   emptyBox: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 }, emptyTxt: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
//   sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1, marginRight: 12 }, sheetSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
//   closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   sheetBody: { padding: 20, paddingBottom: 8 }, sheetFooterBtn: { margin: 20, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, sheetFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
//   detailInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 18, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
//   detailName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 }, detailMeta: { fontSize: 12, color: C.textLight },
//   viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }, viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
//   infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16, marginBottom: 14 }, infoBoxTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 }, infoBoxText: { fontSize: 13, color: C.textMid, lineHeight: 20 },
//   extractSub: { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }, extractItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },
//   deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 14, marginTop: 4 }, deleteBtnTxt: { fontSize: 14, fontWeight: '700', color: C.danger },
//   viewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 10 },
//   viewCardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   viewCardName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, viewCardSpec: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 }, viewCardDate: { fontSize: 11, color: C.textLight },
//   notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//   notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 18, marginBottom: 3 }, notifDate: { fontSize: 11, color: C.textLight }, unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
// });



// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
//   Image, ImageSourcePropType, Modal, ActivityIndicator, RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   FileText, LogOut, QrCode, ChevronRight, X, Eye, Bell,
//   ShieldAlert, Stethoscope, Upload, FlaskConical, FilePlus, Trash2,
// } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import { WebView } from 'react-native-webview';
// import ApiService, { BASE_URL } from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext';
// import { sosService } from '../../services/SOSService';

// const C = {
//   bg: '#F3F6FD', surface: '#FFFFFF', primary: '#1A56DB', primaryLight: '#EBF2FF',
//   textDark: '#0D1B3E', textMid: '#4A5A7A', textLight: '#9AAABE', border: '#DDE4F5',
//   success: '#059669', successLight: '#ECFDF5', danger: '#DC2626', dangerLight: '#FEF2F2',
//   warning: '#D97706', warningLight: '#FFFBEB', purple: '#7C3AED', purpleLight: '#EDE9FE',
// };

// interface UserData { name: string; email: string; patientId: string; qrCode?: string; bloodGroup?: string; hasMedicalForm?: boolean; }
// interface DocItem { id: string; fileId: string; name: string; type: string; size: number; status: string; uploadDate: string; fileUrl: string; summary: string; extractedData?: { diagnoses: string[]; medications: string[]; allergies: string[] }; }
// interface ReportItem { id: string; fileId: string; fileName: string; fileType: string; fileSize: number; reportCategory: string; uploadedAt: string; fileUrl: string; notes: string; }
// interface DoctorView { doctorName: string; specialization: string; viewedAt: string; }
// interface AppNotification { _id: string; message: string; createdAt: string; read: boolean; }

// const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'image/jpg'];
// const fileEmoji = (t: string) => !t ? '📎' : t.startsWith('image/') ? '🖼️' : t.includes('pdf') ? '📄' : t.includes('word') || t.includes('docx') ? '📝' : '📎';
// const catColor = (cat: string) => { switch (cat) { case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' }; case 'LFT': return { bg: '#ECFDF5', text: '#065F46' }; case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' }; case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' }; case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' }; case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' }; default: return { bg: '#F1F5F9', text: '#475569' }; } };

// function StatusBadge({ status }: { status: string }) {
//   const m: Record<string, { bg: string; text: string; label: string }> = { completed: { bg: '#ECFDF5', text: '#059669', label: '✓ Processed' }, failed: { bg: '#FEF2F2', text: '#DC2626', label: '✕ Failed' }, processing: { bg: '#FFFBEB', text: '#D97706', label: '⏳ Processing' }, pending: { bg: '#EFF6FF', text: '#1A56DB', label: '⏳ Pending' } };
//   const c = m[status] || m.pending;
//   return <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.bg }}><Text style={{ fontSize: 11, fontWeight: '600', color: c.text }}>{c.label}</Text></View>;
// }

// export default function PatientDashboard(): JSX.Element {
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [documents, setDocuments] = useState<DocItem[]>([]);
//   const [reports, setReports] = useState<ReportItem[]>([]);
//   const [viewCount, setViewCount] = useState(0);
//   const [viewHistory, setViewHistory] = useState<DoctorView[]>([]);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState<'doc' | 'report' | null>(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selDoc, setSelDoc] = useState<DocItem | null>(null);
//   const [selReport, setSelReport] = useState<ReportItem | null>(null);
//   const [openingFile, setOpeningFile] = useState(false);
//   const [showDocs, setShowDocs] = useState(false);
//   const [showDocDetail, setShowDocDetail] = useState(false);
//   const [showReports, setShowReports] = useState(false);
//   const [showReportDetail, setShowReportDetail] = useState(false);
//   const [showViews, setShowViews] = useState(false);
//   const [showNotifs, setShowNotifs] = useState(false);

//   // Document viewer states
//   const [viewerVisible, setViewerVisible] = useState(false);
//   const [viewerUri, setViewerUri] = useState('');
//   const [viewerTitle, setViewerTitle] = useState('');

//   const router = useRouter();

//   useEffect(() => { bootstrap(); }, []);
//   useFocusEffect(useCallback(() => { loadNotifications(); loadViewHistory(); }, []));
//   useEffect(() => { const id = setInterval(loadDocuments, 30000); return () => clearInterval(id); }, []);

//   // 🔔 Restore notification when dashboard loads (backup for returning patients)
//   useEffect(() => {
//     const restoreNotification = async () => {
//       try {
//         // Only restore if user has medical form (not first login)
//         if (userData?.hasMedicalForm) {
//           console.log('🔔 Dashboard: Attempting to restore notification...');
//           await sosService.restoreNotificationAfterLogin();
//           console.log('🔔 Dashboard: Notification restoration attempted');
//         }
//       } catch (err) {
//         console.log('Dashboard: Could not restore notification:', err);
//       }
//     };

//     if (userData?.hasMedicalForm) {
//       restoreNotification();
//     }
//   }, [userData?.hasMedicalForm]);

//   // 🔔 Verify SOS data matches current patient - FIXED VERSION with emergency contact validation
//   useEffect(() => {
//     const verifyAndRestoreNotification = async () => {
//       try {
//         if (userData?.hasMedicalForm && userData?.patientId) {
//           // Load stored SOS data
//           const storedData = await sosService.loadSOSData();

//           // Log the stored data for debugging
//           if (storedData) {
//             console.log('🔔 Loaded SOS data from storage:', {
//               patientName: storedData.patientName,
//               patientId: storedData.patientId,
//               bloodGroup: storedData.bloodGroup,
//               emergencyName: storedData.emergencyName || '(empty)',
//               emergencyPhone: storedData.emergencyPhone || '(empty)',
//               allergiesCount: storedData.allergies?.length || 0,
//               lastUpdated: storedData.lastUpdated
//             });
//           } else {
//             console.log('🔔 No stored SOS data found');
//           }

//           // If stored data exists but patient ID doesn't match, clear it
//           if (storedData && storedData.patientId !== userData.patientId) {
//             console.log(`⚠️ SOS data mismatch: stored=${storedData.patientId}, current=${userData.patientId}. Clearing old data...`);
//             await sosService.clearSOSData();
//             console.log(`✅ Cleared old patient's SOS data`);

//             // Fetch fresh profile to create new SOS data
//             console.log(`🔔 Fetching fresh profile for patient ${userData.patientId}...`);
//             const profileRes = await ApiService.getPatientProfile() as any;
//             if (profileRes.success && profileRes.data) {
//               console.log('🔔 Profile data received:', {
//                 name: profileRes.data.name,
//                 patientId: profileRes.data.patientId,
//                 bloodGroup: profileRes.data.bloodGroup,
//                 emergencyContact: profileRes.data.emergencyContact,
//               });

//               await sosService.setupAfterFormSave({
//                 patientName: profileRes.data.name || userData.name || '',
//                 patientId: profileRes.data.patientId || userData.patientId || '',
//                 bloodGroup: profileRes.data.bloodGroup || userData.bloodGroup || '',
//                 allergies: profileRes.data.allergies || [],
//                 emergencyName: profileRes.data.emergencyContact?.name || '',
//                 emergencyPhone: profileRes.data.emergencyContact?.phone || '',
//                 chronicDiseases: profileRes.data.chronicDiseases || [],
//                 isDiabetic: profileRes.data.isDiabetic || false,
//                 qrCodeDataUri: profileRes.data.qrCode || '',
//               });
//               console.log(`✅ SOS data created for patient ${userData.patientId}`);
//             }
//             return; // Exit early since we just created new data
//           }

//           // After clearing mismatch, check if we need to create new SOS data
//           // This happens if the current patient has medical form but no SOS data
//           const freshStoredData = await sosService.loadSOSData();
//           if (!freshStoredData && userData.hasMedicalForm) {
//             console.log(`🔔 No SOS data found for current patient ${userData.patientId}. Creating from profile...`);

//             // Fetch latest profile to create SOS data
//             const profileRes = await ApiService.getPatientProfile() as any;
//             if (profileRes.success && profileRes.data) {
//               console.log('🔔 Creating SOS data with:', {
//                 emergencyName: profileRes.data.emergencyContact?.name || '(not provided)',
//                 emergencyPhone: profileRes.data.emergencyContact?.phone || '(not provided)'
//               });

//               await sosService.setupAfterFormSave({
//                 patientName: profileRes.data.name || userData.name || '',
//                 patientId: profileRes.data.patientId || userData.patientId || '',
//                 bloodGroup: profileRes.data.bloodGroup || userData.bloodGroup || '',
//                 allergies: profileRes.data.allergies || [],
//                 emergencyName: profileRes.data.emergencyContact?.name || '',
//                 emergencyPhone: profileRes.data.emergencyContact?.phone || '',
//                 chronicDiseases: profileRes.data.chronicDiseases || [],
//                 isDiabetic: profileRes.data.isDiabetic || false,
//                 qrCodeDataUri: profileRes.data.qrCode || '',
//               });
//               console.log(`✅ SOS data created for patient ${userData.patientId}`);
//             }
//           } else if (freshStoredData) {
//             // Restore notification for current patient
//             console.log('🔔 Restoring notification for patient:', {
//               patientId: userData.patientId,
//               emergencyName: freshStoredData.emergencyName || '(not set)'
//             });
//             await sosService.restoreNotificationAfterLogin();
//             console.log('🔔 Dashboard: Notification restored for patient:', userData.patientId);
//           }
//         }
//       } catch (err) {
//         console.log('Dashboard: Could not verify SOS data:', err);
//       }
//     };

//     if (userData?.hasMedicalForm) {
//       verifyAndRestoreNotification();
//     }
//   }, [userData?.hasMedicalForm, userData?.patientId]);
//   async function bootstrap() {
//     setLoading(true);
//     try { await loadUserData(); } catch { }
//     try { await loadDocuments(); } catch { }
//     try { await loadReports(); } catch { }
//     try { await loadViewHistory(); } catch { }
//     try { await loadNotifications(); } catch { }
//     setLoading(false);
//   }

//   async function loadUserData() {
//     try {
//       const s = await AsyncStorage.getItem('userData');
//       if (s) setUserData(JSON.parse(s));
//       const r = await ApiService.getPatientProfile() as any;
//       if (r.success) {
//         setUserData(r.data);
//         await AsyncStorage.setItem('userData', JSON.stringify(r.data));
//       }
//     } catch { }
//   }
//   async function loadDocuments() { try { const r = await ApiService.getMyDocuments() as any; if (r.success && Array.isArray(r.data)) setDocuments(r.data); } catch { } }
//   async function loadReports() { try { const r = await ApiService.getMyReports() as any; if (r.success && Array.isArray(r.data)) setReports(r.data); } catch { } }
//   async function loadViewHistory() { try { const r = await ApiService.getViewHistory() as any; if (r.success) { setViewCount(r.data?.viewCount || 0); setViewHistory(r.data?.viewHistory || []); } } catch { } }
//   async function loadNotifications() { try { const r = await ApiService.getPatientNotifications(); if (r.success && r.data) setNotifications(r.data as any); } catch { } }

//   const onRefresh = async () => { setRefreshing(true); await bootstrap(); setRefreshing(false); };

//   const pickAndUploadDocument = async () => {
//     try {
//       const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (r.canceled || !r.assets?.[0]) return;
//       const d = r.assets[0]; setUploading('doc');
//       setDocuments(p => [{ id: `temp-${Date.now()}`, fileId: '', name: d.name, type: d.mimeType || 'application/octet-stream', size: d.size || 0, status: 'processing', uploadDate: new Date().toISOString(), fileUrl: '', summary: '' }, ...p]);
//       const u = await ApiService.uploadFile({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (u.success) { Alert.alert('Uploaded ✓', 'Document queued for processing.'); setTimeout(() => { loadDocuments(); try { ApiService.refreshAllSummaries(); } catch { } }, 4000); }
//       else { setDocuments(p => p.filter(x => !x.id.startsWith('temp-'))); Alert.alert('Error', u.message || 'Failed to upload'); }
//     } catch (e: any) { setDocuments(p => p.filter(x => !x.id.startsWith('temp-'))); Alert.alert('Error', e.message || 'Failed to upload'); }
//     finally { setUploading(null); }
//   };

//   const pickAndUploadReport = async () => {
//     try {
//       const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
//       if (r.canceled || !r.assets?.[0]) return;
//       const d = r.assets[0]; setUploading('report');
//       const u = await ApiService.uploadReport({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
//       if (u.success) { Alert.alert('Uploaded ✓', 'Lab report saved.'); await loadReports(); }
//       else Alert.alert('Error', u.message || 'Failed to upload report');
//     } catch (e: any) { Alert.alert('Error', e.message || 'Failed to upload report'); }
//     finally { setUploading(null); }
//   };

//   // Updated openFile function with WebView for all document types
//   const openFile = async (url: string, fileId?: string, fileType?: string, fileName?: string) => {
//     if (!url) {
//       Alert.alert('Not available', 'This file is still being processed.');
//       return;
//     }

//     let fixedUrl = url;
//     try {
//       const h = new URL(BASE_URL).hostname;
//       fixedUrl = url.replace('localhost', h).replace('127.0.0.1', h);
//     } catch { }

//     setOpeningFile(true);
//     try {
//       const safeId = fileId || `file_${Date.now()}`;
//       const ext = fileType?.includes('pdf') || fixedUrl.endsWith('.pdf') ? '.pdf'
//         : fileType?.startsWith('image/jpeg') || fixedUrl.endsWith('.jpg') ? '.jpg'
//           : fileType?.startsWith('image/png') || fixedUrl.endsWith('.png') ? '.png'
//             : '.pdf';

//       const localUri = `${FileSystem.cacheDirectory}seharoop_${safeId}${ext}`;

//       // Check if file exists in cache
//       const info = await FileSystem.getInfoAsync(localUri);
//       if (!info.exists) {
//         const token = await ApiService.getToken();
//         const downloadResult = await FileSystem.downloadAsync(fixedUrl, localUri, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {}
//         });
//         if (downloadResult.status !== 200) {
//           Alert.alert('Download Error', `Failed to download file. Status: ${downloadResult.status}`);
//           return;
//         }
//       }

//       // Use WebView for all document types
//       setViewerTitle(fileName || 'Document Viewer');
//       setViewerUri(localUri);
//       setViewerVisible(true);

//     } catch (e: any) {
//       Alert.alert('Cannot open file', e.message || 'An error occurred.');
//     } finally {
//       setOpeningFile(false);
//     }
//   };

//   const handleDeleteReport = async (r: ReportItem) => {
//     Alert.alert('Delete Report', `Delete "${r.fileName}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await ApiService.deleteReport(r.id); setReports(p => p.filter(x => x.id !== r.id)); setShowReportDetail(false); } catch (e: any) { Alert.alert('Error', e.message); } } }]);
//   };

//   const handleLogout = () => { Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); } } }]); };

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

//   return (
//     <SafeAreaView style={s.root}>
//       <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />} showsVerticalScrollIndicator={false}>

//         {/* Header */}
//         <View style={s.header}>
//           <View style={s.headerRow}>
//             <View style={s.avatarRow}>
//               <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.greeting}>Hello, welcome back</Text>
//                 <Text style={s.name} numberOfLines={1}>{userData?.name || 'Patient'}</Text>
//                 <View style={s.idBadge}>
//                   <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
//                   {userData?.bloodGroup && <><View style={s.bloodDot} /><Text style={s.bloodText}>{userData.bloodGroup}ve</Text></>}
//                 </View>
//               </View>
//             </View>
//             <View style={s.headerActions}>
//               <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
//                 <Bell size={18} color={C.primary} strokeWidth={2} />
//                 {unreadCount > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>}
//               </TouchableOpacity>
//               <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}><LogOut size={18} color={C.danger} strokeWidth={2} /></TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* Stats */}
//         <View style={s.statsRow}>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.primaryLight }]}><FileText size={18} color={C.primary} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{documents.length}</Text><Text style={s.statLabel}>Documents</Text>
//             {documents.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowViews(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.successLight }]}><Stethoscope size={18} color={C.success} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{viewCount}</Text><Text style={s.statLabel}>Dr. Views</Text>
//             {viewCount > 0 && <Text style={s.statHint}>Tap to see</Text>}
//           </TouchableOpacity>
//           <TouchableOpacity style={s.statCard} onPress={() => setShowReports(true)} activeOpacity={0.8}>
//             <View style={[s.statIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={18} color={C.warning} strokeWidth={2} /></View>
//             <Text style={s.statVal}>{reports.length}</Text><Text style={s.statLabel}>Reports</Text>
//             {reports.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
//           </TouchableOpacity>
//         </View>

//         {/* QR */}
//         <TouchableOpacity style={s.qrCard} activeOpacity={0.9}
//           onPress={() => { if (userData?.qrCode) router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } }); else Alert.alert('Info', 'QR code is being generated…'); }}>
//           <View style={s.qrLeft}>
//             <View style={s.qrIconWrap}>{userData?.qrCode ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" /> : <QrCode size={28} color={C.primary} strokeWidth={1.8} />}</View>
//             <View><Text style={s.qrTitle}>Your Health QR</Text><Text style={s.qrSub}>Tap to view full QR code</Text></View>
//           </View>
//           <View style={s.qrArrow}><ChevronRight size={18} color={C.primary} strokeWidth={2} /></View>
//         </TouchableOpacity>

//         {/* Upload */}
//         <View style={s.section}>
//           <Text style={s.sectionTitle}>Upload</Text>
//           <Text style={[s.sectionSub, { marginBottom: 14 }]}>Choose what you want to upload</Text>
//           <View style={s.uploadRow}>
//             <TouchableOpacity style={[s.uploadCard, uploading === 'doc' && s.uploadCardOff]} onPress={pickAndUploadDocument} disabled={!!uploading} activeOpacity={0.85}>
//               {uploading === 'doc' ? <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.primaryLight }]}><FilePlus size={24} color={C.primary} strokeWidth={1.8} /></View>}
//               <Text style={s.uploadCardTitle}>Document</Text><Text style={s.uploadCardSub}>Generates AI summary</Text><Text style={s.uploadCardSub2}>PDF · DOCX · TXT · Image</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={[s.uploadCard, uploading === 'report' && s.uploadCardOff, { borderColor: C.warning }]} onPress={pickAndUploadReport} disabled={!!uploading} activeOpacity={0.85}>
//               {uploading === 'report' ? <ActivityIndicator size="small" color={C.warning} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={24} color={C.warning} strokeWidth={1.8} /></View>}
//               <Text style={[s.uploadCardTitle, { color: C.warning }]}>Lab Report</Text><Text style={s.uploadCardSub}>Stored & viewable</Text><Text style={s.uploadCardSub2}>KFT · LFT · CBC · etc.</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Documents */}
//         <View style={s.section}>
//           <View style={s.sectionHead}><Text style={s.sectionTitle}>My Documents</Text><TouchableOpacity onPress={() => setShowDocs(true)}><Text style={s.seeAll}>See All ({documents.length})</Text></TouchableOpacity></View>
//           {documents.length === 0 ? <View style={s.emptyBox}><Upload size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No documents yet.</Text></View>
//             : documents.slice(0, 3).map(doc => (
//               <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
//                 <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                 <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}{doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}</Text></View>
//                 <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//               </TouchableOpacity>
//             ))}
//         </View>

//         {/* Reports */}
//         <View style={s.section}>
//           <View style={s.sectionHead}><Text style={s.sectionTitle}>Lab Reports</Text><TouchableOpacity onPress={() => setShowReports(true)}><Text style={s.seeAll}>See All ({reports.length})</Text></TouchableOpacity></View>
//           {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
//             : reports.slice(0, 3).map(r => {
//               const cc = catColor(r.reportCategory); return (
//                 <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
//                   <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
//                   <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                   <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
//                   <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               );
//             })}
//         </View>
//       </ScrollView>

//       {/* Docs List Modal */}
//       <Modal animationType="slide" transparent visible={showDocs} onRequestClose={() => setShowDocs(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>My Documents ({documents.length})</Text><TouchableOpacity onPress={() => setShowDocs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {documents.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No documents yet.</Text></View>
//               : documents.map(doc => (
//                 <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setShowDocs(false); setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
//                   <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
//                   <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                   <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                 </TouchableOpacity>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Doc Detail Modal */}
//       <Modal animationType="slide" transparent visible={showDocDetail} onRequestClose={() => setShowDocDetail(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selDoc?.name || 'Document'}</Text><TouchableOpacity onPress={() => setShowDocDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           {selDoc && (<ScrollView contentContainerStyle={s.sheetBody}>
//             <View style={s.detailInfoRow}>
//               <Text style={{ fontSize: 36 }}>{fileEmoji(selDoc.type)}</Text>
//               <View style={{ flex: 1 }}><Text style={s.detailName}>{selDoc.name}</Text><Text style={s.detailMeta}>{selDoc.uploadDate ? new Date(selDoc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}{selDoc.size ? `  ·  ${(selDoc.size / 1024).toFixed(1)} KB` : ''}</Text><StatusBadge status={selDoc.status} /></View>
//             </View>
//             <TouchableOpacity style={[s.viewBtn, (!selDoc.fileUrl || openingFile) && { opacity: 0.5 }]} onPress={() => openFile(selDoc.fileUrl, selDoc.fileId, selDoc.type, selDoc.name)} disabled={!selDoc.fileUrl || openingFile}>
//               {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
//               <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Document'}</Text>
//             </TouchableOpacity>
//             {selDoc.summary ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Summary</Text><Text style={s.infoBoxText}>{selDoc.summary}</Text></View> : null}
//             {selDoc.extractedData && <View style={s.infoBox}>
//               <Text style={s.infoBoxTitle}>Extracted Information</Text>
//               {selDoc.extractedData.diagnoses?.length > 0 && <><Text style={s.extractSub}>Diagnoses</Text>{selDoc.extractedData.diagnoses.map((d, i) => <Text key={i} style={s.extractItem}>• {d}</Text>)}</>}
//               {selDoc.extractedData.medications?.length > 0 && <><Text style={[s.extractSub, { color: C.success }]}>Medications</Text>{selDoc.extractedData.medications.map((m, i) => <Text key={i} style={[s.extractItem, { color: C.success }]}>• {m}</Text>)}</>}
//               {selDoc.extractedData.allergies?.length > 0 && <><Text style={[s.extractSub, { color: C.danger }]}>Allergies</Text>{selDoc.extractedData.allergies.map((a, i) => <Text key={i} style={[s.extractItem, { color: C.danger }]}>• {a}</Text>)}</>}
//             </View>}
//           </ScrollView>)}
//           <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowDocDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
//         </View></View>
//       </Modal>

//       {/* Reports List Modal */}
//       <Modal animationType="slide" transparent visible={showReports} onRequestClose={() => setShowReports(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>Lab Reports ({reports.length})</Text><TouchableOpacity onPress={() => setShowReports(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
//               : reports.map(r => {
//                 const cc = catColor(r.reportCategory); return (
//                   <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setShowReports(false); setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
//                     <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
//                     <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
//                     <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
//                     <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
//                   </TouchableOpacity>
//                 );
//               })}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Report Detail Modal */}
//       <Modal animationType="slide" transparent visible={showReportDetail} onRequestClose={() => setShowReportDetail(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selReport?.fileName || 'Report'}</Text><TouchableOpacity onPress={() => setShowReportDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           {selReport && (<ScrollView contentContainerStyle={s.sheetBody}>
//             <View style={s.detailInfoRow}>
//               <Text style={{ fontSize: 36 }}>{fileEmoji(selReport.fileType)}</Text>
//               <View style={{ flex: 1 }}><Text style={s.detailName}>{selReport.fileName}</Text><Text style={s.detailMeta}>{selReport.uploadedAt ? new Date(selReport.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</Text>{(() => { const cc = catColor(selReport.reportCategory); return <View style={[s.catBadge, { backgroundColor: cc.bg, marginTop: 6, alignSelf: 'flex-start' }]}><Text style={[s.catTxt, { color: cc.text }]}>{selReport.reportCategory}</Text></View>; })()}</View>
//             </View>
//             <TouchableOpacity style={[s.viewBtn, { backgroundColor: C.warning }, openingFile && { opacity: 0.5 }]} onPress={() => openFile(selReport.fileUrl, selReport.fileId, selReport.fileType, selReport.fileName)} disabled={openingFile}>
//               {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
//               <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Report'}</Text>
//             </TouchableOpacity>
//             {selReport.notes ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Notes</Text><Text style={s.infoBoxText}>{selReport.notes}</Text></View> : null}
//             <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteReport(selReport)}><Trash2 size={16} color={C.danger} strokeWidth={2} /><Text style={s.deleteBtnTxt}>Delete Report</Text></TouchableOpacity>
//           </ScrollView>)}
//           <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowReportDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
//         </View></View>
//       </Modal>

//       {/* Views Modal */}
//       <Modal animationType="slide" transparent visible={showViews} onRequestClose={() => setShowViews(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><View><Text style={s.sheetTitle}>Doctor Access History</Text><Text style={s.sheetSub}>{viewCount} total {viewCount === 1 ? 'view' : 'views'}</Text></View><TouchableOpacity onPress={() => setShowViews(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView contentContainerStyle={s.sheetBody}>
//             {viewHistory.length === 0 ? <View style={s.emptyBox}><Stethoscope size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No doctors have accessed your record yet.</Text></View>
//               : viewHistory.map((v, i) => (
//                 <View key={i} style={s.viewCard}>
//                   <View style={[s.viewCardIcon, { backgroundColor: C.primaryLight }]}><Stethoscope size={20} color={C.primary} strokeWidth={2} /></View>
//                   <View style={{ flex: 1 }}><Text style={s.viewCardName}>{v.doctorName}</Text><Text style={s.viewCardSpec}>{v.specialization}</Text><Text style={s.viewCardDate}>{new Date(v.viewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></View>
//                 </View>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Notifications Modal */}
//       <Modal animationType="slide" transparent visible={showNotifs} onRequestClose={() => setShowNotifs(false)}>
//         <View style={s.overlay}><View style={s.sheet}>
//           <View style={s.sheetHead}><Text style={s.sheetTitle}>Alerts & Notifications</Text><TouchableOpacity onPress={() => setShowNotifs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
//           <ScrollView>
//             {notifications.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No notifications.</Text></View>
//               : notifications.map(n => (
//                 <TouchableOpacity key={n._id} style={[s.notifRow, !n.read && { backgroundColor: '#F0F7FF' }]}
//                   onPress={() => { setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x)); ApiService.markNotificationRead(n._id).catch(() => { }); }}>
//                   <View style={[s.notifIconWrap, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
//                     {n.message.includes('SECURITY') ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} /> : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />}
//                   </View>
//                   <View style={{ flex: 1 }}><Text style={[s.notifMsg, !n.read && { fontWeight: '700' }]}>{n.message}</Text><Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text></View>
//                   {!n.read && <View style={s.unreadDot} />}
//                 </TouchableOpacity>
//               ))}
//           </ScrollView>
//         </View></View>
//       </Modal>

//       {/* Document Viewer Modal using WebView */}
//       <Modal
//         visible={viewerVisible}
//         transparent={false}
//         animationType="slide"
//         onRequestClose={() => setViewerVisible(false)}
//       >
//         <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
//           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#2a2a2a' }}>
//             <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>{viewerTitle}</Text>
//             <TouchableOpacity onPress={() => setViewerVisible(false)} style={{ padding: 8 }}>
//               <Text style={{ color: '#FFF', fontSize: 16 }}>Close</Text>
//             </TouchableOpacity>
//           </View>
//           <WebView
//             source={{ uri: viewerUri }}
//             style={{ flex: 1 }}
//             originWhitelist={['*']}
//             scalesPageToFit={true}
//             startInLoadingState={true}
//             renderLoading={() => (
//               <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//                 <ActivityIndicator size="large" color={C.primary} />
//               </View>
//             )}
//             onError={(error) => {
//               console.log('WebView Error:', error);
//               Alert.alert('Error', 'Failed to load document');
//               setViewerVisible(false);
//             }}
//           />
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg }, scroll: { paddingHorizontal: 20, paddingBottom: 40 },
//   header: { backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
//   avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
//   avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' }, greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
//   name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
//   idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
//   bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight }, bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
//   headerActions: { flexDirection: 'row', gap: 8 },
//   iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   iconBtnDanger: { backgroundColor: C.dangerLight },
//   badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
//   badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
//   statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   statVal: { fontSize: 22, fontWeight: '800', color: C.textDark }, statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' }, statHint: { fontSize: 9, color: C.primary, marginTop: 3, fontWeight: '600' },
//   qrCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.primaryLight },
//   qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 }, qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   qrThumb: { width: 36, height: 36, borderRadius: 6 }, qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, qrSub: { fontSize: 12, color: C.textLight },
//   qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
//   section: { marginBottom: 28 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, marginBottom: 2 }, sectionSub: { fontSize: 12, color: C.textLight }, seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },
//   uploadRow: { flexDirection: 'row', gap: 12 },
//   uploadCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: C.border },
//   uploadCardOff: { opacity: 0.5 }, uploadCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   uploadCardTitle: { fontSize: 14, fontWeight: '800', color: C.textDark, marginBottom: 4 }, uploadCardSub: { fontSize: 12, color: C.textMid, textAlign: 'center' }, uploadCardSub2: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },
//   listCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
//   listEmoji: { fontSize: 26 }, listInfo: { flex: 1 }, listName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 }, listMeta: { fontSize: 11, color: C.textLight },
//   catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }, catTxt: { fontSize: 11, fontWeight: '700' },
//   emptyBox: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 }, emptyTxt: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
//   sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
//   sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1, marginRight: 12 }, sheetSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
//   closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   sheetBody: { padding: 20, paddingBottom: 8 }, sheetFooterBtn: { margin: 20, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, sheetFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
//   detailInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 18, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
//   detailName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 }, detailMeta: { fontSize: 12, color: C.textLight },
//   viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }, viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
//   infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16, marginBottom: 14 }, infoBoxTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 }, infoBoxText: { fontSize: 13, color: C.textMid, lineHeight: 20 },
//   extractSub: { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }, extractItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },
//   deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 14, marginTop: 4 }, deleteBtnTxt: { fontSize: 14, fontWeight: '700', color: C.danger },
//   viewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 10 },
//   viewCardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   viewCardName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, viewCardSpec: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 }, viewCardDate: { fontSize: 11, color: C.textLight },
//   notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//   notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 18, marginBottom: 3 }, notifDate: { fontSize: 11, color: C.textLight }, unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
// });

import React, { useState, useEffect, useCallback, JSX } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  Image, ImageSourcePropType, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  FileText, LogOut, QrCode, ChevronRight, X, Eye, Bell,
  ShieldAlert, Stethoscope, Upload, FlaskConical, FilePlus, Trash2,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ApiService, { BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import sosService from '../../services/SOSService';

const C = {
  bg: '#F3F6FD', surface: '#FFFFFF', primary: '#1A56DB', primaryLight: '#EBF2FF',
  textDark: '#0D1B3E', textMid: '#4A5A7A', textLight: '#9AAABE', border: '#DDE4F5',
  success: '#059669', successLight: '#ECFDF5', danger: '#DC2626', dangerLight: '#FEF2F2',
  warning: '#D97706', warningLight: '#FFFBEB', purple: '#7C3AED', purpleLight: '#EDE9FE',
};

interface UserData { name: string; email: string; patientId: string; qrCode?: string; bloodGroup?: string; }
interface DocItem { id: string; fileId: string; name: string; type: string; size: number; status: string; uploadDate: string; fileUrl: string; summary: string; extractedData?: { diagnoses: string[]; medications: string[]; allergies: string[] }; }
interface ReportItem { id: string; fileId: string; fileName: string; fileType: string; fileSize: number; reportCategory: string; uploadedAt: string; fileUrl: string; notes: string; }
interface DoctorView { doctorName: string; specialization: string; viewedAt: string; }
interface AppNotification { _id: string; message: string; createdAt: string; read: boolean; }

const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'image/jpg'];
const fileEmoji = (t: string) => !t ? '📎' : t.startsWith('image/') ? '🖼️' : t.includes('pdf') ? '📄' : t.includes('word') || t.includes('docx') ? '📝' : '📎';
const catColor = (cat: string) => { switch (cat) { case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' }; case 'LFT': return { bg: '#ECFDF5', text: '#065F46' }; case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' }; case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' }; case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' }; case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' }; default: return { bg: '#F1F5F9', text: '#475569' }; } };

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string; text: string; label: string }> = { completed: { bg: '#ECFDF5', text: '#059669', label: '✓ Processed' }, failed: { bg: '#FEF2F2', text: '#DC2626', label: '✕ Failed' }, processing: { bg: '#FFFBEB', text: '#D97706', label: '⏳ Processing' }, pending: { bg: '#EFF6FF', text: '#1A56DB', label: '⏳ Pending' } };
  const c = m[status] || m.pending;
  return <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.bg }}><Text style={{ fontSize: 11, fontWeight: '600', color: c.text }}>{c.label}</Text></View>;
}

export default function PatientDashboard(): JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [viewHistory, setViewHistory] = useState<DoctorView[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'doc' | 'report' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selDoc, setSelDoc] = useState<DocItem | null>(null);
  const [selReport, setSelReport] = useState<ReportItem | null>(null);
  const [openingFile, setOpeningFile] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showDocDetail, setShowDocDetail] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const router = useRouter();

  useEffect(() => { bootstrap(); }, []);
  useFocusEffect(useCallback(() => { loadNotifications(); loadViewHistory(); }, []));
  useEffect(() => { const id = setInterval(loadDocuments, 30000); return () => clearInterval(id); }, []);

  async function bootstrap() {
    setLoading(true);
    try {
      console.log('🔄 Bootstrap starting...');
      await loadUserData();
      await loadDocuments();
      await loadReports();
      await loadViewHistory();
      await loadNotifications();
      console.log('✅ Bootstrap complete');
    } catch (error) {
      console.error('❌ Bootstrap error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserData() {
    try {
      const s = await AsyncStorage.getItem('userData');
      if (s) setUserData(JSON.parse(s));
      const r = await ApiService.getPatientProfile() as any;
      if (r.success) { setUserData(r.data); await AsyncStorage.setItem('userData', JSON.stringify(r.data)); }
    } catch (error) {
      console.error('loadUserData error:', error);
    }
  }

  async function loadDocuments() {
    try {
      const r = await ApiService.getMyDocuments() as any;
      if (r.success && Array.isArray(r.data)) setDocuments(r.data);
    } catch (error) {
      console.error('loadDocuments error:', error);
    }
  }

  async function loadReports() {
    try {
      const r = await ApiService.getMyReports() as any;
      if (r.success && Array.isArray(r.data)) setReports(r.data);
    } catch (error) {
      console.error('loadReports error:', error);
    }
  }

  async function loadViewHistory() {
    try {
      const r = await ApiService.getViewHistory() as any;
      if (r.success) {
        setViewCount(r.data?.viewCount || 0);
        setViewHistory(r.data?.viewHistory || []);
      }
    } catch (error) {
      console.error('loadViewHistory error:', error);
    }
  }

  async function loadNotifications() {
    try {
      const r = await ApiService.getPatientNotifications();
      if (r.success && r.data) setNotifications(r.data as any);
    } catch (error) {
      console.error('loadNotifications error:', error);
    }
  }

  const onRefresh = async () => {
    console.log('🔄 Refresh started...');
    setRefreshing(true);
    try {
      await bootstrap();
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setRefreshing(false);
      console.log('✅ Refresh complete');
    }
  };

  const pickAndUploadDocument = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
      if (r.canceled || !r.assets?.[0]) return;
      const d = r.assets[0]; setUploading('doc');
      setDocuments(p => [{ id: `temp-${Date.now()}`, fileId: '', name: d.name, type: d.mimeType || 'application/octet-stream', size: d.size || 0, status: 'processing', uploadDate: new Date().toISOString(), fileUrl: '', summary: '' }, ...p]);
      const u = await ApiService.uploadFile({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
      if (u.success) {
        Alert.alert('Uploaded ✓', 'Document queued for processing.');
        setTimeout(() => {
          loadDocuments();
        }, 4000);
      } else {
        setDocuments(p => p.filter(x => !x.id.startsWith('temp-')));
        Alert.alert('Error', u.message || 'Failed to upload');
      }
    } catch (e: any) {
      setDocuments(p => p.filter(x => !x.id.startsWith('temp-')));
      Alert.alert('Error', e.message || 'Failed to upload');
    } finally { setUploading(null); }
  };

  const pickAndUploadReport = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
      if (r.canceled || !r.assets?.[0]) return;
      const d = r.assets[0]; setUploading('report');
      const u = await ApiService.uploadReport({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
      if (u.success) { Alert.alert('Uploaded ✓', 'Lab report saved.'); await loadReports(); }
      else Alert.alert('Error', u.message || 'Failed to upload report');
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to upload report'); }
    finally { setUploading(null); }
  };

  const openFile = async (url: string, fileId?: string, fileType?: string, fileName?: string) => {
    if (!url) { Alert.alert('Not available', 'This file is still being processed.'); return; }
    let fixedUrl = url;
    try { const h = new URL(BASE_URL).hostname; fixedUrl = url.replace('localhost', h).replace('127.0.0.1', h); } catch { }
    setOpeningFile(true);
    try {
      const safeId = fileId || `file_${Date.now()}`;
      const ext = fileType?.includes('pdf') || url.endsWith('.pdf') ? '.pdf' : fileType?.startsWith('image/jpeg') || url.endsWith('.jpg') ? '.jpg' : fileType?.startsWith('image/png') || url.endsWith('.png') ? '.png' : fileType?.includes('word') || url.endsWith('.docx') ? '.docx' : '.pdf';
      const localUri = `${FileSystem.cacheDirectory}seharoop_${safeId}${ext}`;
      const info = await FileSystem.getInfoAsync(localUri);
      if (!info.exists) {
        const token = await ApiService.getToken();
        const dl = await FileSystem.downloadAsync(fixedUrl, localUri, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (dl.status !== 200) { Alert.alert('Download Error', `Server returned HTTP ${dl.status}.\nCheck backend at ${BASE_URL}`); return; }
      }
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) { Alert.alert('Not supported', 'File sharing not available.'); return; }
      await Sharing.shareAsync(localUri, { mimeType: fileType || 'application/octet-stream', dialogTitle: fileName || 'Open File', UTI: fileType?.includes('pdf') ? 'com.adobe.pdf' : undefined });
    } catch (e: any) { Alert.alert('Cannot open file', e.message || 'An error occurred.'); }
    finally { setOpeningFile(false); }
  };

  const handleDeleteReport = async (r: ReportItem) => {
    Alert.alert('Delete Report', `Delete "${r.fileName}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await ApiService.deleteReport(r.id); setReports(p => p.filter(x => x.id !== r.id)); setShowReportDetail(false); } catch (e: any) { Alert.alert('Error', e.message); } } }]);
  };

  const handleLogout = () => { Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); } } }]); };

  const unreadCount = notifications.filter(n => !n.read).length;
  const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.avatarRow}>
              <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.greeting}>Hello, welcome back</Text>
                <Text style={s.name} numberOfLines={1}>{userData?.name || 'Patient'}</Text>
                <View style={s.idBadge}>
                  <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
                  {userData?.bloodGroup && <><View style={s.bloodDot} /><Text style={s.bloodText}>{userData.bloodGroup}</Text></>}
                </View>
              </View>
            </View>
            <View style={s.headerActions}>
              <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
                <Bell size={18} color={C.primary} strokeWidth={2} />
                {unreadCount > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}><LogOut size={18} color={C.danger} strokeWidth={2} /></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <TouchableOpacity style={s.statCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
            <View style={[s.statIcon, { backgroundColor: C.primaryLight }]}><FileText size={18} color={C.primary} strokeWidth={2} /></View>
            <Text style={s.statVal}>{documents.length}</Text><Text style={s.statLabel}>Documents</Text>
            {documents.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => setShowViews(true)} activeOpacity={0.8}>
            <View style={[s.statIcon, { backgroundColor: C.successLight }]}><Stethoscope size={18} color={C.success} strokeWidth={2} /></View>
            <Text style={s.statVal}>{viewCount}</Text><Text style={s.statLabel}>Dr. Views</Text>
            {viewCount > 0 && <Text style={s.statHint}>Tap to see</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => setShowReports(true)} activeOpacity={0.8}>
            <View style={[s.statIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={18} color={C.warning} strokeWidth={2} /></View>
            <Text style={s.statVal}>{reports.length}</Text><Text style={s.statLabel}>Reports</Text>
            {reports.length > 0 && <Text style={s.statHint}>Tap to view</Text>}
          </TouchableOpacity>
        </View>

        {/* QR */}
        <TouchableOpacity style={s.qrCard} activeOpacity={0.9}
          onPress={() => { if (userData?.qrCode) router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } }); else Alert.alert('Info', 'QR code is being generated…'); }}>
          <View style={s.qrLeft}>
            <View style={s.qrIconWrap}>{userData?.qrCode ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" /> : <QrCode size={28} color={C.primary} strokeWidth={1.8} />}</View>
            <View><Text style={s.qrTitle}>Your Health QR</Text><Text style={s.qrSub}>Tap to view full QR code</Text></View>
          </View>
          <View style={s.qrArrow}><ChevronRight size={18} color={C.primary} strokeWidth={2} /></View>
        </TouchableOpacity>

        {/* Upload */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Upload</Text>
          <Text style={[s.sectionSub, { marginBottom: 14 }]}>Choose what you want to upload</Text>
          <View style={s.uploadRow}>
            <TouchableOpacity style={[s.uploadCard, uploading === 'doc' && s.uploadCardOff]} onPress={pickAndUploadDocument} disabled={!!uploading} activeOpacity={0.85}>
              {uploading === 'doc' ? <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.primaryLight }]}><FilePlus size={24} color={C.primary} strokeWidth={1.8} /></View>}
              <Text style={s.uploadCardTitle}>Document</Text><Text style={s.uploadCardSub}>Generates AI summary</Text><Text style={s.uploadCardSub2}>PDF · DOCX · TXT · Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.uploadCard, uploading === 'report' && s.uploadCardOff, { borderColor: C.warning }]} onPress={pickAndUploadReport} disabled={!!uploading} activeOpacity={0.85}>
              {uploading === 'report' ? <ActivityIndicator size="small" color={C.warning} style={{ marginBottom: 10 }} /> : <View style={[s.uploadCardIcon, { backgroundColor: C.warningLight }]}><FlaskConical size={24} color={C.warning} strokeWidth={1.8} /></View>}
              <Text style={[s.uploadCardTitle, { color: C.warning }]}>Lab Report</Text><Text style={s.uploadCardSub}>Stored & viewable</Text><Text style={s.uploadCardSub2}>KFT · LFT · CBC · etc.</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Documents */}
        <View style={s.section}>
          <View style={s.sectionHead}><Text style={s.sectionTitle}>My Documents</Text><TouchableOpacity onPress={() => setShowDocs(true)}><Text style={s.seeAll}>See All ({documents.length})</Text></TouchableOpacity></View>
          {documents.length === 0 ? <View style={s.emptyBox}><Upload size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No documents yet.</Text></View>
            : documents.slice(0, 3).map(doc => (
              <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
                <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
                <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}{doc.size ? `  ·  ${(doc.size / 1024).toFixed(1)} KB` : ''}</Text></View>
                <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}
        </View>

        {/* Reports */}
        <View style={s.section}>
          <View style={s.sectionHead}><Text style={s.sectionTitle}>Lab Reports</Text><TouchableOpacity onPress={() => setShowReports(true)}><Text style={s.seeAll}>See All ({reports.length})</Text></TouchableOpacity></View>
          {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={28} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
            : reports.slice(0, 3).map(r => {
              const cc = catColor(r.reportCategory); return (
                <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
                  <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
                  <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
                  <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
                  <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              );
            })}
        </View>
      </ScrollView>

      {/* Docs List Modal */}
      <Modal animationType="slide" transparent visible={showDocs} onRequestClose={() => setShowDocs(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.sheetHead}><Text style={s.sheetTitle}>My Documents ({documents.length})</Text><TouchableOpacity onPress={() => setShowDocs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
          <ScrollView contentContainerStyle={s.sheetBody}>
            {documents.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No documents yet.</Text></View>
              : documents.map(doc => (
                <TouchableOpacity key={doc.id} style={s.listCard} onPress={() => { setShowDocs(false); setSelDoc(doc); setShowDocDetail(true); }} activeOpacity={0.85}>
                  <Text style={s.listEmoji}>{fileEmoji(doc.type)}</Text>
                  <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{doc.name}</Text><Text style={s.listMeta}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
                  <StatusBadge status={doc.status} /><ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View></View>
      </Modal>

      {/* Doc Detail Modal */}
      <Modal animationType="slide" transparent visible={showDocDetail} onRequestClose={() => setShowDocDetail(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selDoc?.name || 'Document'}</Text><TouchableOpacity onPress={() => setShowDocDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
          {selDoc && (<ScrollView contentContainerStyle={s.sheetBody}>
            <View style={s.detailInfoRow}>
              <Text style={{ fontSize: 36 }}>{fileEmoji(selDoc.type)}</Text>
              <View style={{ flex: 1 }}><Text style={s.detailName}>{selDoc.name}</Text><Text style={s.detailMeta}>{selDoc.uploadDate ? new Date(selDoc.uploadDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}{selDoc.size ? `  ·  ${(selDoc.size / 1024).toFixed(1)} KB` : ''}</Text><StatusBadge status={selDoc.status} /></View>
            </View>
            <TouchableOpacity style={[s.viewBtn, (!selDoc.fileUrl || openingFile) && { opacity: 0.5 }]} onPress={() => openFile(selDoc.fileUrl, selDoc.fileId, selDoc.type, selDoc.name)} disabled={!selDoc.fileUrl || openingFile}>
              {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
              <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Document'}</Text>
            </TouchableOpacity>
            {selDoc.summary ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Summary</Text><Text style={s.infoBoxText}>{selDoc.summary}</Text></View> : null}
            {selDoc.extractedData && <View style={s.infoBox}>
              <Text style={s.infoBoxTitle}>Extracted Information</Text>
              {selDoc.extractedData.diagnoses?.length > 0 && <><Text style={s.extractSub}>Diagnoses</Text>{selDoc.extractedData.diagnoses.map((d, i) => <Text key={i} style={s.extractItem}>• {d}</Text>)}</>}
              {selDoc.extractedData.medications?.length > 0 && <><Text style={[s.extractSub, { color: C.success }]}>Medications</Text>{selDoc.extractedData.medications.map((m, i) => <Text key={i} style={[s.extractItem, { color: C.success }]}>• {m}</Text>)}</>}
              {selDoc.extractedData.allergies?.length > 0 && <><Text style={[s.extractSub, { color: C.danger }]}>Allergies</Text>{selDoc.extractedData.allergies.map((a, i) => <Text key={i} style={[s.extractItem, { color: C.danger }]}>• {a}</Text>)}</>}
            </View>}
          </ScrollView>)}
          <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowDocDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {/* Reports List Modal */}
      <Modal animationType="slide" transparent visible={showReports} onRequestClose={() => setShowReports(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.sheetHead}><Text style={s.sheetTitle}>Lab Reports ({reports.length})</Text><TouchableOpacity onPress={() => setShowReports(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
          <ScrollView contentContainerStyle={s.sheetBody}>
            {reports.length === 0 ? <View style={s.emptyBox}><FlaskConical size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No lab reports yet.</Text></View>
              : reports.map(r => {
                const cc = catColor(r.reportCategory); return (
                  <TouchableOpacity key={r.id} style={s.listCard} onPress={() => { setShowReports(false); setSelReport(r); setShowReportDetail(true); }} activeOpacity={0.85}>
                    <Text style={s.listEmoji}>{fileEmoji(r.fileType)}</Text>
                    <View style={s.listInfo}><Text style={s.listName} numberOfLines={1}>{r.fileName}</Text><Text style={s.listMeta}>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text></View>
                    <View style={[s.catBadge, { backgroundColor: cc.bg }]}><Text style={[s.catTxt, { color: cc.text }]}>{r.reportCategory}</Text></View>
                    <ChevronRight size={15} color={C.textLight} strokeWidth={2} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View></View>
      </Modal>

      {/* Report Detail Modal */}
      <Modal animationType="slide" transparent visible={showReportDetail} onRequestClose={() => setShowReportDetail(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.sheetHead}><Text style={s.sheetTitle} numberOfLines={1}>{selReport?.fileName || 'Report'}</Text><TouchableOpacity onPress={() => setShowReportDetail(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
          {selReport && (<ScrollView contentContainerStyle={s.sheetBody}>
            <View style={s.detailInfoRow}>
              <Text style={{ fontSize: 36 }}>{fileEmoji(selReport.fileType)}</Text>
              <View style={{ flex: 1 }}><Text style={s.detailName}>{selReport.fileName}</Text><Text style={s.detailMeta}>{selReport.uploadedAt ? new Date(selReport.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</Text>{(() => { const cc = catColor(selReport.reportCategory); return <View style={[s.catBadge, { backgroundColor: cc.bg, marginTop: 6, alignSelf: 'flex-start' }]}><Text style={[s.catTxt, { color: cc.text }]}>{selReport.reportCategory}</Text></View>; })()}</View>
            </View>
            <TouchableOpacity style={[s.viewBtn, { backgroundColor: C.warning }, openingFile && { opacity: 0.5 }]} onPress={() => openFile(selReport.fileUrl, selReport.fileId, selReport.fileType, selReport.fileName)} disabled={openingFile}>
              {openingFile ? <ActivityIndicator size="small" color="#FFF" /> : <Eye size={18} color="#FFF" strokeWidth={2} />}
              <Text style={s.viewBtnTxt}>{openingFile ? 'Opening…' : 'View Report'}</Text>
            </TouchableOpacity>
            {selReport.notes ? <View style={s.infoBox}><Text style={s.infoBoxTitle}>Notes</Text><Text style={s.infoBoxText}>{selReport.notes}</Text></View> : null}
            <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteReport(selReport)}><Trash2 size={16} color={C.danger} strokeWidth={2} /><Text style={s.deleteBtnTxt}>Delete Report</Text></TouchableOpacity>
          </ScrollView>)}
          <TouchableOpacity style={s.sheetFooterBtn} onPress={() => setShowReportDetail(false)}><Text style={s.sheetFooterBtnTxt}>Close</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {/* Views Modal */}
      <Modal animationType="slide" transparent visible={showViews} onRequestClose={() => setShowViews(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.sheetHead}><View><Text style={s.sheetTitle}>Doctor Access History</Text><Text style={s.sheetSub}>{viewCount} total {viewCount === 1 ? 'view' : 'views'}</Text></View><TouchableOpacity onPress={() => setShowViews(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
          <ScrollView contentContainerStyle={s.sheetBody}>
            {viewHistory.length === 0 ? <View style={s.emptyBox}><Stethoscope size={32} color={C.textLight} strokeWidth={1.5} /><Text style={s.emptyTxt}>No doctors have accessed your record yet.</Text></View>
              : viewHistory.map((v, i) => (
                <View key={i} style={s.viewCard}>
                  <View style={[s.viewCardIcon, { backgroundColor: C.primaryLight }]}><Stethoscope size={20} color={C.primary} strokeWidth={2} /></View>
                  <View style={{ flex: 1 }}><Text style={s.viewCardName}>{v.doctorName}</Text><Text style={s.viewCardSpec}>{v.specialization}</Text><Text style={s.viewCardDate}>{new Date(v.viewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></View>
                </View>
              ))}
          </ScrollView>
        </View></View>
      </Modal>

      {/* Notifications Modal */}
      <Modal animationType="slide" transparent visible={showNotifs} onRequestClose={() => setShowNotifs(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.sheetHead}><Text style={s.sheetTitle}>Alerts & Notifications</Text><TouchableOpacity onPress={() => setShowNotifs(false)} style={s.closeBtn}><X size={20} color={C.textMid} strokeWidth={2} /></TouchableOpacity></View>
          <ScrollView>
            {notifications.length === 0 ? <View style={s.emptyBox}><Text style={s.emptyTxt}>No notifications.</Text></View>
              : notifications.map(n => (
                <TouchableOpacity key={n._id} style={[s.notifRow, !n.read && { backgroundColor: '#F0F7FF' }]}
                  onPress={() => { setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x)); ApiService.markNotificationRead(n._id).catch(() => { }); }}>
                  <View style={[s.notifIconWrap, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
                    {n.message.includes('SECURITY') ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} /> : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />}
                  </View>
                  <View style={{ flex: 1 }}><Text style={[s.notifMsg, !n.read && { fontWeight: '700' }]}>{n.message}</Text><Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text></View>
                  {!n.read && <View style={s.unreadDot} />}
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' }, greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
  name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
  idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
  bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight }, bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  iconBtnDanger: { backgroundColor: C.dangerLight },
  badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 22, fontWeight: '800', color: C.textDark }, statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' }, statHint: { fontSize: 9, color: C.primary, marginTop: 3, fontWeight: '600' },
  qrCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.primaryLight },
  qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 }, qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qrThumb: { width: 36, height: 36, borderRadius: 6 }, qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, qrSub: { fontSize: 12, color: C.textLight },
  qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 28 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2, marginBottom: 2 }, sectionSub: { fontSize: 12, color: C.textLight }, seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },
  uploadRow: { flexDirection: 'row', gap: 12 },
  uploadCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: C.border },
  uploadCardOff: { opacity: 0.5 }, uploadCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadCardTitle: { fontSize: 14, fontWeight: '800', color: C.textDark, marginBottom: 4 }, uploadCardSub: { fontSize: 12, color: C.textMid, textAlign: 'center' }, uploadCardSub2: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },
  listCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  listEmoji: { fontSize: 26 }, listInfo: { flex: 1 }, listName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 }, listMeta: { fontSize: 11, color: C.textLight },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }, catTxt: { fontSize: 11, fontWeight: '700' },
  emptyBox: { backgroundColor: C.surface, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 }, emptyTxt: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1, marginRight: 12 }, sheetSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  sheetBody: { padding: 20, paddingBottom: 8 }, sheetFooterBtn: { margin: 20, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, sheetFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  detailInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 18, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  detailName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 }, detailMeta: { fontSize: 12, color: C.textLight },
  viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }, viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16, marginBottom: 14 }, infoBoxTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 }, infoBoxText: { fontSize: 13, color: C.textMid, lineHeight: 20 },
  extractSub: { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }, extractItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 14, marginTop: 4 }, deleteBtnTxt: { fontSize: 14, fontWeight: '700', color: C.danger },
  viewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  viewCardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  viewCardName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 }, viewCardSpec: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 }, viewCardDate: { fontSize: 11, color: C.textLight },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 18, marginBottom: 3 }, notifDate: { fontSize: 11, color: C.textLight }, unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
});