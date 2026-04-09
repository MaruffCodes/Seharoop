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
  Upload, FileText, Camera, LogOut, QrCode, Calendar, Activity,
  Clock, ChevronRight, X, Eye, Bell, ShieldAlert, RefreshCw,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { shareAsync } from 'expo-sharing';
import ApiService, { BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// ── Design tokens ──────────────────────────────────────────────────────
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

// ── Types ──────────────────────────────────────────────────────────────
interface UserData { name: string; email: string; patientId: string; qrCode?: string; bloodGroup?: string; hasMedicalForm?: boolean; }
interface Document { id: string; name: string; uri: string; type: string; size: number; uploadDate: string; status: 'processing' | 'processed' | 'failed'; extractedData?: any; }
interface TimelineEvent { id: string; type: string; title: string; description: string; date: string; documentId?: string; documentName?: string; documentUri?: string; }
interface AppNotification { _id: string; message: string; date: string; read: boolean; }
interface Stats { documents: number; diagnoses: number; reports: number; }
interface ApiFile { uri: string; type: string; name: string; size?: number; }

const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXT = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

const typeColor = (type: string) => {
  switch (type) {
    case 'diagnosis': return { icon: C.danger, bg: C.dangerLight };
    case 'medication': return { icon: C.success, bg: C.successLight };
    case 'lab': return { icon: C.primary, bg: C.primaryLight };
    case 'allergy': return { icon: C.warning, bg: C.warningLight };
    default: return { icon: C.textLight, bg: '#F1F5F9' };
  }
};

export default function PatientDashboard(): JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<Stats>({ documents: 0, diagnoses: 0, reports: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const router = useRouter();
  const { completeFirstLogin } = useAuth();

  // Load initial data
  useEffect(() => { loadUserData(); loadAllPatientData(); }, []);

  // Refresh notifications every time screen gains focus
  useFocusEffect(useCallback(() => { loadNotifications(); }, []));

  // Poll for new notifications every 30 seconds (optional, for real‑time feel)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showNotifications) loadNotifications(); // silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, [showNotifications]);

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) setUserData(JSON.parse(stored));
      const res = await ApiService.getPatientProfile() as any;
      setUserData(res.data);
      await AsyncStorage.setItem('userData', JSON.stringify(res.data));
    } catch { }
  };

  const loadAllPatientData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        ApiService.getPatientSummary() as any,
        ApiService.getPatientHistory() as any,
      ]);
      if (historyRes.data?.medicalHistory) {
        const docs: Document[] = [];
        let dxCount = 0;
        historyRes.data.medicalHistory.forEach((yr: any) =>
          yr.months?.forEach((mo: any) =>
            mo.records?.forEach((rec: any) =>
              rec.documents?.forEach((doc: any) => {
                if (doc.extractedData?.diagnoses) dxCount += doc.extractedData.diagnoses.length;
                docs.push({
                  id: doc._id || doc.filename, name: doc.originalName,
                  uri: `${BASE_URL}/uploads/${doc.filename}`, type: doc.mimetype,
                  size: doc.size, uploadDate: new Date(doc.uploadDate).toLocaleDateString(),
                  status: doc.processingStatus === 'completed' ? 'processed' : doc.processingStatus === 'failed' ? 'failed' : 'processing',
                  extractedData: doc.extractedData,
                });
              })
            )
          )
        );
        setDocuments(docs);
        setStats({ documents: docs.length, diagnoses: dxCount, reports: docs.length });

        const events: TimelineEvent[] = [];
        historyRes.data.medicalHistory.forEach((yr: any) =>
          yr.months?.forEach((mo: any) =>
            mo.records?.forEach((rec: any) => {
              events.push({
                id: `${rec.date}-${rec.description}`, type: rec.type || 'upload',
                title: rec.description, description: `${mo.month} ${yr.year}`,
                date: new Date(rec.date).toISOString(),
                documentId: rec.documents[0]?._id, documentName: rec.documents[0]?.originalName,
              });
            })
          )
        );
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTimeline(events);
      }
    } catch { } finally { setLoading(false); }
  };

  const loadNotifications = async () => {
    try {
      const res = await ApiService.getPatientNotifications();
      if (res.success && res.data) setNotifications(res.data);
    } catch { }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAllPatientData(), loadNotifications()]);
    setRefreshing(false);
  };

  const validateFile = (f: { name: string; mimeType?: string }) => {
    if (f.mimeType && ALLOWED_TYPES.includes(f.mimeType)) return true;
    return ALLOWED_EXT.includes(f.name.substring(f.name.lastIndexOf('.')).toLowerCase());
  };

  const handleFileUpload = async (file: ApiFile) => {
    try {
      setLoading(true);
      if (!validateFile({ name: file.name, mimeType: file.type })) {
        Alert.alert('Invalid File', 'Supported formats: PDF, TXT, DOCX, JPG, PNG'); return;
      }
      const temp: Document = { id: `temp-${Date.now()}`, name: file.name, uri: file.uri, type: file.type, size: file.size || 0, uploadDate: new Date().toLocaleDateString(), status: 'processing' };
      setDocuments(p => [temp, ...p]);
      const res = await ApiService.uploadFile(file, false);
      if (res.success) {
        Alert.alert('Processing', 'Your document is being processed.', [{ text: 'OK' }]);
        await loadAllPatientData();
        try { await ApiService.refreshAllSummaries(); } catch { }
      } else {
        setDocuments(p => p.filter(d => d.id !== temp.id));
        Alert.alert('Error', res.message || 'Failed to upload document');
      }
    } catch { Alert.alert('Error', 'Failed to upload document.'); } finally { setLoading(false); }
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true }) as any;
      if (!res.canceled && res.assets?.[0]) {
        const d = res.assets[0];
        await handleFileUpload({ uri: d.uri, type: d.mimeType || 'application/octet-stream', name: d.name, size: d.size });
      }
    } catch { Alert.alert('Error', 'Failed to pick document'); }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 }) as any;
      if (!res.canceled && res.assets?.[0]) {
        const p = res.assets[0];
        await handleFileUpload({ uri: p.uri, type: 'image/jpeg', name: `Record_${new Date().toLocaleDateString().replace(/\//g, '-')}.jpg`, size: p.fileSize });
      }
    } catch { Alert.alert('Error', 'Failed to capture photo'); }
  };

  const viewDocument = async (doc: Document) => {
    try {
      if (doc.type.startsWith('image/')) { setSelectedDocument(doc); setModalVisible(true); return; }
      await WebBrowser.openBrowserAsync(doc.uri.startsWith('file://') ? doc.uri : `${BASE_URL}/uploads/${doc.id}.${doc.name.split('.').pop()}`);
    } catch { Alert.alert('Error', 'Could not open the document'); }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { try { setLoading(true); await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); } finally { setLoading(false); } } },
    ]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.avatarRow}>
              <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
              <View>
                <Text style={s.greeting}>Hello, welcome back</Text>
                <Text style={s.name}>{userData?.name || 'Patient'}</Text>
                <View style={s.idBadge}>
                  <Text style={s.idText}>ID: {userData?.patientId || '—'}</Text>
                  {userData?.bloodGroup && <View style={s.bloodDot} />}
                  {userData?.bloodGroup && <Text style={s.bloodText}>{userData.bloodGroup}</Text>}
                </View>
              </View>
            </View>
            <View style={s.headerActions}>
              <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifications(true)}>
                <Bell size={18} color={C.primary} strokeWidth={2} />
                {unreadCount > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleLogout}>
                <LogOut size={18} color={C.danger} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          {[
            { icon: FileText, val: stats.documents, label: 'Documents', color: C.primary, bg: C.primaryLight },
            { icon: Activity, val: stats.diagnoses, label: 'Diagnoses', color: C.success, bg: C.successLight },
            { icon: Calendar, val: stats.reports, label: 'Reports', color: C.warning, bg: C.warningLight },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <View key={i} style={s.statCard}>
                <View style={[s.statIcon, { backgroundColor: item.bg }]}>
                  <Icon size={18} color={item.color} strokeWidth={2} />
                </View>
                <Text style={s.statVal}>{item.val}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── QR Code ── */}
        <TouchableOpacity
          style={s.qrCard}
          activeOpacity={0.9}
          onPress={() => {
            if (userData?.qrCode) {
              router.push({ pathname: '/(tabs)/FullScreenQR', params: { qrCodeUrl: userData.qrCode } });
            } else {
              Alert.alert('Info', 'QR code is being generated...');
            }
          }}
        >
          <View style={s.qrLeft}>
            <View style={s.qrIconWrap}>
              {userData?.qrCode
                ? <Image source={{ uri: userData.qrCode } as ImageSourcePropType} style={s.qrThumb} resizeMode="contain" />
                : <QrCode size={28} color={C.primary} strokeWidth={1.8} />
              }
            </View>
            <View>
              <Text style={s.qrTitle}>Your Health QR</Text>
              <Text style={s.qrSub}>Tap to view full QR code</Text>
            </View>
          </View>
          <View style={s.qrArrow}>
            {processingQueue
              ? <ActivityIndicator size="small" color={C.primary} />
              : <ChevronRight size={18} color={C.primary} strokeWidth={2} />
            }
          </View>
        </TouchableOpacity>

        {/* ── Upload ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Upload Documents</Text>
            <Text style={s.sectionSub}>PDF, TXT, DOCX, Images</Text>
          </View>
          <View style={s.uploadRow}>
            <TouchableOpacity style={[s.uploadBtn, loading && s.uploadBtnOff]} onPress={pickDocument} disabled={loading} activeOpacity={0.85}>
              <View style={[s.uploadIcon, { backgroundColor: C.successLight }]}>
                <FileText size={22} color={C.success} strokeWidth={1.8} />
              </View>
              <Text style={s.uploadBtnTitle}>Select File</Text>
              <Text style={s.uploadBtnSub}>PDF · DOCX · TXT</Text>
            </TouchableOpacity>

            {/* Add time line here */}
            {/* <TouchableOpacity style={[s.uploadBtn, loading && s.uploadBtnOff]} onPress={takePhoto} disabled={loading} activeOpacity={0.85}>
              <View style={[s.uploadIcon, { backgroundColor: C.primaryLight }]}>
                <Camera size={22} color={C.primary} strokeWidth={1.8} />
              </View>
              <Text style={s.uploadBtnTitle}>Take Photo</Text>
              <Text style={s.uploadBtnSub}>Use Camera</Text>
            </TouchableOpacity> */}
          </View>
          {loading && (
            <View style={s.uploadingRow}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={s.uploadingTxt}>Uploading document…</Text>
            </View>
          )}
        </View>

        {/* ── Documents ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>My Documents</Text>
            <View style={s.countPill}><Text style={s.countTxt}>{documents.length}</Text></View>
          </View>
          {documents.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}><Upload size={32} color={C.textLight} strokeWidth={1.5} /></View>
              <Text style={s.emptyTitle}>No documents yet</Text>
              <Text style={s.emptySub}>Upload your medical documents to get started</Text>
            </View>
          ) : (
            <View style={s.docList}>
              {documents.map(doc => (
                <TouchableOpacity key={doc.id} style={s.docCard} onPress={() => viewDocument(doc)} activeOpacity={0.85}>
                  <View style={[s.docIcon, doc.type.startsWith('image/') ? {} : { backgroundColor: C.dangerLight }]}>
                    {doc.type.startsWith('image/')
                      ? <Image source={{ uri: doc.uri }} style={s.docThumb} />
                      : <FileText size={20} color={C.danger} strokeWidth={2} />
                    }
                  </View>
                  <View style={s.docInfo}>
                    <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
                    <Text style={s.docMeta}>
                      {doc.uploadDate} · {(doc.size / 1024).toFixed(1)} KB
                    </Text>
                    {doc.status === 'processed' && doc.extractedData && (
                      <View style={s.processedTag}>
                        <Text style={s.processedTxt}>✓ Processed</Text>
                      </View>
                    )}
                    {doc.status === 'processing' && (
                      <View style={[s.processedTag, { backgroundColor: C.warningLight }]}>
                        <Text style={[s.processedTxt, { color: C.warning }]}>⏳ Processing</Text>
                      </View>
                    )}
                    {doc.status === 'failed' && (
                      <View style={[s.processedTag, { backgroundColor: C.dangerLight }]}>
                        <Text style={[s.processedTxt, { color: C.danger }]}>✕ Failed</Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={16} color={C.textLight} strokeWidth={2} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Timeline ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Recent Timeline</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/patient-timeline' as any)}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {timeline.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}><Clock size={32} color={C.textLight} strokeWidth={1.5} /></View>
              <Text style={s.emptyTitle}>No timeline events</Text>
              <Text style={s.emptySub}>Upload documents to build your medical timeline</Text>
            </View>
          ) : (
            timeline.slice(0, 5).map(ev => {
              const tc = typeColor(ev.type);
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={s.timelineCard}
                  activeOpacity={0.85}
                  onPress={() => { const d = documents.find(dd => dd.id === ev.documentId); if (d) viewDocument(d); }}
                >
                  <View style={[s.tlIcon, { backgroundColor: tc.bg }]}>
                    {ev.type === 'diagnosis' && <Activity size={14} color={tc.icon} strokeWidth={2} />}
                    {ev.type === 'medication' && <FileText size={14} color={tc.icon} strokeWidth={2} />}
                    {ev.type === 'lab' && <Activity size={14} color={tc.icon} strokeWidth={2} />}
                    {!['diagnosis', 'medication', 'lab'].includes(ev.type) && <Clock size={14} color={tc.icon} strokeWidth={2} />}
                  </View>
                  <View style={s.tlContent}>
                    <Text style={s.tlTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={s.tlDesc} numberOfLines={1}>{ev.description}</Text>
                    <Text style={s.tlDate}>{new Date(ev.date).toLocaleDateString()} · {ev.documentName}</Text>
                  </View>
                  <ChevronRight size={14} color={C.textLight} strokeWidth={2} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* ── Doc Modal ── */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Document Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalClose}>
                <X size={20} color={C.textMid} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {selectedDocument && (
              <ScrollView style={s.modalBody}>
                <Text style={s.modalDocName}>{selectedDocument.name}</Text>
                <Text style={s.modalDocMeta}>{selectedDocument.uploadDate} · {(selectedDocument.size / 1024).toFixed(1)} KB</Text>
                {selectedDocument.type.startsWith('image/') && (
                  <Image source={{ uri: selectedDocument.uri }} style={s.modalImg} resizeMode="contain" />
                )}
                <TouchableOpacity style={s.viewBtn} onPress={() => viewDocument(selectedDocument)}>
                  <Eye size={18} color="#FFF" strokeWidth={2} />
                  <Text style={s.viewBtnTxt}>View Original Document</Text>
                </TouchableOpacity>
                {selectedDocument.extractedData && (
                  <View style={s.extracted}>
                    <Text style={s.extractedTitle}>Extracted Information</Text>
                    {selectedDocument.extractedData.diagnoses?.map((d: string, i: number) => (
                      <Text key={i} style={s.extractedItem}>• {d}</Text>
                    ))}
                    {selectedDocument.extractedData.medications?.map((m: string, i: number) => (
                      <Text key={i} style={[s.extractedItem, { color: C.success }]}>• {m}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
            <TouchableOpacity style={s.modalFooterBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.modalFooterBtnTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Notifications Modal ── */}
      <Modal animationType="slide" transparent visible={showNotifications} onRequestClose={() => setShowNotifications(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Security & Access Alerts</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={s.modalClose}>
                <X size={20} color={C.textMid} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {notifications.length === 0 ? (
                <View style={s.empty}><Text style={s.emptyTitle}>No recent alerts</Text></View>
              ) : (
                notifications.map(n => (
                  <TouchableOpacity
                    key={n._id}
                    style={[s.notifCard, !n.read && s.notifUnread]}
                    onPress={() => {
                      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
                      ApiService.markNotificationRead(n._id).catch(() => { });
                    }}
                  >
                    <View style={[s.notifIcon, { backgroundColor: n.message.includes('SECURITY') ? C.dangerLight : C.primaryLight }]}>
                      {n.message.includes('SECURITY')
                        ? <ShieldAlert size={18} color={n.read ? C.textLight : C.danger} strokeWidth={2} />
                        : <Bell size={18} color={n.read ? C.textLight : C.primary} strokeWidth={2} />
                      }
                    </View>
                    <View style={s.notifBody}>
                      <Text style={s.notifMsg}>{n.message}</Text>
                      <Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 36 },

  // Header
  header: {
    backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  greeting: { fontSize: 12, color: C.textLight, marginBottom: 2 },
  name: { fontSize: 19, fontWeight: '800', color: C.textDark, letterSpacing: -0.3, marginBottom: 4 },
  idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  idText: { fontSize: 12, color: C.textMid, fontWeight: '600' },
  bloodDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight },
  bloodText: { fontSize: 12, color: C.success, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  iconBtnDanger: { backgroundColor: C.dangerLight },
  badge: {
    position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center',
  },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 22, fontWeight: '800', color: C.textDark },
  statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, fontWeight: '600' },

  // QR
  qrCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: C.primaryLight,
  },
  qrLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qrIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qrThumb: { width: 36, height: 36, borderRadius: 6 },
  qrTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  qrSub: { fontSize: 12, color: C.textLight },
  qrArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },

  // Section
  section: { marginBottom: 28 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, letterSpacing: -0.2 },
  sectionSub: { fontSize: 12, color: C.textLight },
  countPill: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  countTxt: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  seeAll: { fontSize: 13, fontWeight: '700', color: C.primary },

  // Upload
  uploadRow: { flexDirection: 'row', gap: 12 },
  uploadBtn: {
    flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  uploadBtnOff: { opacity: 0.5 },
  uploadIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadBtnTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  uploadBtnSub: { fontSize: 11, color: C.textLight },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: C.primaryLight, borderRadius: 10, padding: 12 },
  uploadingTxt: { fontSize: 13, color: C.primary, fontWeight: '500' },

  // Empty
  empty: {
    backgroundColor: C.surface, borderRadius: 18, padding: 36, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textMid, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

  // Docs
  docList: { gap: 10 },
  docCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  docThumb: { width: 44, height: 44, borderRadius: 12 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 },
  docMeta: { fontSize: 12, color: C.textLight },
  processedTag: { alignSelf: 'flex-start', marginTop: 5, backgroundColor: C.successLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  processedTxt: { fontSize: 11, fontWeight: '600', color: C.success },

  // Timeline
  timelineCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  tlIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tlContent: { flex: 1 },
  tlTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  tlDesc: { fontSize: 12, color: C.textMid, marginBottom: 2 },
  tlDate: { fontSize: 11, color: C.textLight },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', overflow: 'hidden' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.textDark },
  modalClose: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 22, maxHeight: 420 },
  modalDocName: { fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 4 },
  modalDocMeta: { fontSize: 13, color: C.textLight, marginBottom: 16 },
  modalImg: { width: '100%', height: 200, borderRadius: 14, backgroundColor: '#F8FAFF', marginBottom: 16 },
  viewBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  extracted: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 16 },
  extractedTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 10 },
  extractedItem: { fontSize: 13, color: C.textMid, marginBottom: 4, lineHeight: 18 },
  modalFooterBtn: { margin: 22, marginTop: 4, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalFooterBtnTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },

  // Notifications
  notifCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'flex-start', gap: 14 },
  notifUnread: { backgroundColor: '#F8FAFF' },
  notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1 },
  notifMsg: { fontSize: 13, color: C.textDark, lineHeight: 19, marginBottom: 4 },
  notifDate: { fontSize: 11, color: C.textLight },
});