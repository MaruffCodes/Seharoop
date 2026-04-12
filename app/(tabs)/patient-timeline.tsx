// import React, { useState, useEffect, useCallback, JSX } from 'react';
// import {
//     View, Text, StyleSheet, ScrollView, TouchableOpacity,
//     RefreshControl, ActivityIndicator, Alert, Modal,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import {
//     FileText, FlaskConical, ClipboardList, Eye,
//     X, ChevronDown, ChevronUp, Calendar,
//     CheckCircle, Clock, AlertCircle,
// } from 'lucide-react-native';
// import ApiService, { BASE_URL } from '../../services/api';

// // ── Tokens ────────────────────────────────────────────────────────────────────
// const C = {
//     bg: '#F3F6FD',
//     surface: '#FFFFFF',
//     primary: '#1A56DB',
//     primaryLight: '#EBF2FF',
//     textDark: '#0D1B3E',
//     textMid: '#4A5A7A',
//     textLight: '#9AAABE',
//     border: '#DDE4F5',
//     success: '#059669',
//     successLight: '#ECFDF5',
//     danger: '#DC2626',
//     dangerLight: '#FEF2F2',
//     warning: '#D97706',
//     warningLight: '#FFFBEB',
//     purple: '#7C3AED',
//     purpleLight: '#EDE9FE',
// };

// // ── Types ─────────────────────────────────────────────────────────────────────
// type EventType = 'all' | 'document' | 'report' | 'form';

// interface TimelineEvent {
//     id: string;
//     type: 'document' | 'report' | 'form';
//     title: string;
//     subtitle: string;
//     date: string;
//     status: string;
//     fileId: string | null;
//     fileUrl: string | null;
//     fileType: string | null;
//     fileSize: number | null;
//     reportCategory?: string;
//     meta: {
//         diagnoses?: string[];
//         medications?: string[];
//         allergies?: string[];
//         summary?: string;
//         notes?: string;
//     };
// }

// interface GroupedMonth { month: string; events: TimelineEvent[]; }
// interface GroupedYear { year: string; months: GroupedMonth[]; }

// // ── Constants ─────────────────────────────────────────────────────────────────
// const FILTERS: { key: EventType; label: string }[] = [
//     { key: 'all', label: 'All' },
//     { key: 'document', label: 'Documents' },
//     { key: 'report', label: 'Reports' },
//     { key: 'form', label: 'Forms' },
// ];

// const MONTH_ORDER: Record<string, number> = {
//     January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
//     July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
// };

// // ── Helpers ───────────────────────────────────────────────────────────────────
// function formatDate(dateStr: string): string {
//     try {
//         return new Date(dateStr).toLocaleDateString('en-GB', {
//             day: 'numeric', month: 'long', year: 'numeric',
//         });
//     } catch { return dateStr; }
// }

// function formatTime(dateStr: string): string {
//     try {
//         return new Date(dateStr).toLocaleTimeString('en-GB', {
//             hour: '2-digit', minute: '2-digit',
//         });
//     } catch { return ''; }
// }

// function fileEmoji(type: string | null): string {
//     if (!type) return '📋';
//     if (type.startsWith('image/')) return '🖼️';
//     if (type.includes('pdf')) return '📄';
//     if (type.includes('word') || type.includes('docx')) return '📝';
//     return '📎';
// }

// function categoryColor(cat?: string) {
//     switch (cat) {
//         case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' };
//         case 'LFT': return { bg: '#ECFDF5', text: '#065F46' };
//         case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' };
//         case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' };
//         case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' };
//         case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' };
//         default: return { bg: '#F1F5F9', text: '#475569' };
//     }
// }

// function eventStyle(type: TimelineEvent['type']) {
//     switch (type) {
//         case 'document': return { dot: C.primary, iconBg: C.primaryLight, icon: 'doc' };
//         case 'report': return { dot: C.warning, iconBg: C.warningLight, icon: 'report' };
//         case 'form': return { dot: C.success, iconBg: C.successLight, icon: 'form' };
//     }
// }

// function statusStyle(status: string) {
//     switch (status) {
//         case 'completed': return { color: C.success, label: 'Processed', Icon: CheckCircle };
//         case 'failed': return { color: C.danger, label: 'Failed', Icon: AlertCircle };
//         case 'processing': return { color: C.warning, label: 'Processing', Icon: Clock };
//         case 'pending': return { color: C.primary, label: 'Pending', Icon: Clock };
//         default: return { color: C.success, label: 'Saved', Icon: CheckCircle };
//     }
// }

// // ── Group events by year → month ──────────────────────────────────────────────
// function groupEvents(events: TimelineEvent[]): GroupedYear[] {
//     const map = new Map<string, Map<string, TimelineEvent[]>>();

//     for (const ev of events) {
//         const d = new Date(ev.date);
//         const year = d.getFullYear().toString();
//         const month = d.toLocaleString('default', { month: 'long' });

//         if (!map.has(year)) map.set(year, new Map());
//         const yearMap = map.get(year)!;
//         if (!yearMap.has(month)) yearMap.set(month, []);
//         yearMap.get(month)!.push(ev);
//     }

//     const result: GroupedYear[] = [];
//     const years = Array.from(map.keys()).sort((a, b) => parseInt(b) - parseInt(a));

//     for (const year of years) {
//         const yearMap = map.get(year)!;
//         const months = Array.from(yearMap.keys())
//             .sort((a, b) => (MONTH_ORDER[b] || 0) - (MONTH_ORDER[a] || 0));

//         result.push({
//             year,
//             months: months.map(month => ({ month, events: yearMap.get(month)! })),
//         });
//     }

//     return result;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────
// export default function PatientTimeline(): JSX.Element {
//     const [events, setEvents] = useState<TimelineEvent[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [filter, setFilter] = useState<EventType>('all');
//     const [selEvent, setSelEvent] = useState<TimelineEvent | null>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [opening, setOpening] = useState(false);
//     const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

//     useEffect(() => { load(); }, []);

//     async function load() {
//         try {
//             setLoading(true);
//             const res = await ApiService.getTimeline() as any;
//             if (res.success && Array.isArray(res.data)) {
//                 setEvents(res.data);
//                 // Auto-expand the most recent year
//                 if (res.data.length > 0) {
//                     const latestYear = new Date(res.data[0].date).getFullYear().toString();
//                     setExpandedYears(new Set([latestYear]));
//                 }
//             }
//         } catch (e: any) {
//             Alert.alert('Error', e.message || 'Could not load timeline');
//         } finally {
//             setLoading(false);
//         }
//     }

//     const onRefresh = async () => {
//         setRefreshing(true);
//         await load();
//         setRefreshing(false);
//     };

//     // ── File opener — download to device cache then share/open ────────────────
//     // This is the ONLY reliable way to open files in Expo Go on a real device.
//     // WebBrowser.openBrowserAsync fails when the server is on a local IP because
//     // some Android WebViews and iOS Safari block non-HTTPS local URLs.
//     // expo-file-system downloads the bytes directly (using the token for auth if
//     // needed) and expo-sharing hands it to the OS native viewer.
//     const openFile = async (event: TimelineEvent) => {
//         if (!event.fileUrl || !event.fileId) {
//             Alert.alert('Not available', 'This file is not yet available for viewing.');
//             return;
//         }

//         // Replace any "localhost" with the real LAN IP from BASE_URL
//         const rawUrl = event.fileUrl;
//         const fixedUrl = rawUrl.replace('localhost', new URL(BASE_URL).hostname);

//         setOpening(true);
//         try {
//             // Determine extension from fileType or URL
//             const ext = event.fileType?.includes('pdf') ? '.pdf'
//                 : event.fileType?.startsWith('image/jpeg') ? '.jpg'
//                     : event.fileType?.startsWith('image/png') ? '.png'
//                         : event.fileType?.includes('word') || event.fileType?.includes('docx') ? '.docx'
//                             : '.pdf'; // default fallback

//             const localUri = `${FileSystem.cacheDirectory}seharoop_${event.fileId}${ext}`;

//             // Check if already cached
//             const info = await FileSystem.getInfoAsync(localUri);
//             if (!info.exists) {
//                 // Download from backend
//                 const token = await ApiService.getToken();
//                 const downloadRes = await FileSystem.downloadAsync(fixedUrl, localUri, {
//                     headers: token ? { Authorization: `Bearer ${token}` } : {},
//                 });

//                 if (downloadRes.status !== 200) {
//                     Alert.alert('Error', `Could not download file (HTTP ${downloadRes.status}). Make sure the backend is running.`);
//                     return;
//                 }
//             }

//             // Check sharing is available on this device
//             const canShare = await Sharing.isAvailableAsync();
//             if (!canShare) {
//                 Alert.alert('Not supported', 'File sharing is not available on this device.');
//                 return;
//             }

//             await Sharing.shareAsync(localUri, {
//                 mimeType: event.fileType || 'application/octet-stream',
//                 dialogTitle: event.title,
//                 UTI: event.fileType?.includes('pdf') ? 'com.adobe.pdf' : undefined,
//             });
//         } catch (err: any) {
//             console.error('openFile error:', err);
//             Alert.alert('Cannot open file', err.message || 'An error occurred. Check the backend is reachable.');
//         } finally {
//             setOpening(false);
//         }
//     };

//     // ── Filtered & grouped data ───────────────────────────────────────────────
//     const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
//     const grouped = groupEvents(filtered);

//     const toggleYear = (year: string) => {
//         setExpandedYears(prev => {
//             const next = new Set(prev);
//             next.has(year) ? next.delete(year) : next.add(year);
//             return next;
//         });
//     };

//     // ── Render ────────────────────────────────────────────────────────────────
//     return (
//         <SafeAreaView style={s.root}>
//             {/* ── Title bar ── */}
//             <View style={s.topBar}>
//                 <View>
//                     <Text style={s.topTitle}>Medical Timeline</Text>
//                     <Text style={s.topSub}>
//                         {events.length} {events.length === 1 ? 'event' : 'events'} total
//                     </Text>
//                 </View>
//             </View>

//             {/* ── Filter chips ── */}
//             <View style={s.filterWrap}>
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
//                     {FILTERS.map(f => {
//                         const count = f.key === 'all'
//                             ? events.length
//                             : events.filter(e => e.type === f.key).length;
//                         const active = filter === f.key;
//                         return (
//                             <TouchableOpacity
//                                 key={f.key}
//                                 style={[s.filterChip, active && s.filterChipActive]}
//                                 onPress={() => setFilter(f.key)}
//                                 activeOpacity={0.8}
//                             >
//                                 <Text style={[s.filterChipTxt, active && s.filterChipTxtActive]}>
//                                     {f.label}
//                                 </Text>
//                                 <View style={[s.filterCount, active && s.filterCountActive]}>
//                                     <Text style={[s.filterCountTxt, active && s.filterCountTxtActive]}>{count}</Text>
//                                 </View>
//                             </TouchableOpacity>
//                         );
//                     })}
//                 </ScrollView>
//             </View>

//             {/* ── Content ── */}
//             {loading ? (
//                 <View style={s.centered}>
//                     <ActivityIndicator size="large" color={C.primary} />
//                     <Text style={s.loadingTxt}>Loading timeline…</Text>
//                 </View>
//             ) : grouped.length === 0 ? (
//                 <View style={s.centered}>
//                     <Calendar size={48} color={C.textLight} strokeWidth={1.5} />
//                     <Text style={s.emptyTitle}>No events yet</Text>
//                     <Text style={s.emptySub}>
//                         {filter !== 'all'
//                             ? `No ${filter}s found. Try a different filter.`
//                             : 'Upload documents or lab reports to see them here.'}
//                     </Text>
//                 </View>
//             ) : (
//                 <ScrollView
//                     style={s.scroll}
//                     contentContainerStyle={s.scrollContent}
//                     refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
//                     showsVerticalScrollIndicator={false}
//                 >
//                     {grouped.map(yearGroup => {
//                         const isExpanded = expandedYears.has(yearGroup.year);
//                         return (
//                             <View key={yearGroup.year} style={s.yearBlock}>
//                                 {/* Year header */}
//                                 <TouchableOpacity style={s.yearHeader} onPress={() => toggleYear(yearGroup.year)} activeOpacity={0.8}>
//                                     <View style={s.yearBadge}>
//                                         <Text style={s.yearBadgeTxt}>{yearGroup.year}</Text>
//                                     </View>
//                                     <View style={s.yearLine} />
//                                     {isExpanded
//                                         ? <ChevronUp size={18} color={C.textLight} strokeWidth={2} />
//                                         : <ChevronDown size={18} color={C.textLight} strokeWidth={2} />
//                                     }
//                                 </TouchableOpacity>

//                                 {isExpanded && yearGroup.months.map(monthGroup => (
//                                     <View key={monthGroup.month} style={s.monthBlock}>
//                                         {/* Month label */}
//                                         <Text style={s.monthLabel}>{monthGroup.month}</Text>

//                                         {/* Events */}
//                                         {monthGroup.events.map((ev, evIdx) => {
//                                             const es = eventStyle(ev.type);
//                                             const ss = statusStyle(ev.status);
//                                             const isLast = evIdx === monthGroup.events.length - 1;

//                                             return (
//                                                 <View key={ev.id} style={s.eventRow}>
//                                                     {/* Timeline spine */}
//                                                     <View style={s.spine}>
//                                                         <View style={[s.dot, { backgroundColor: es.dot }]} />
//                                                         {!isLast && <View style={s.line} />}
//                                                     </View>

//                                                     {/* Event card */}
//                                                     <TouchableOpacity
//                                                         style={s.eventCard}
//                                                         onPress={() => { setSelEvent(ev); setShowDetail(true); }}
//                                                         activeOpacity={0.85}
//                                                     >
//                                                         {/* Icon + title */}
//                                                         <View style={s.eventCardTop}>
//                                                             <View style={[s.eventIcon, { backgroundColor: es.iconBg }]}>
//                                                                 {ev.type === 'document' && <FileText size={16} color={es.dot} strokeWidth={2} />}
//                                                                 {ev.type === 'report' && <FlaskConical size={16} color={es.dot} strokeWidth={2} />}
//                                                                 {ev.type === 'form' && <ClipboardList size={16} color={es.dot} strokeWidth={2} />}
//                                                             </View>
//                                                             <View style={s.eventCardInfo}>
//                                                                 <Text style={s.eventTitle} numberOfLines={1}>{ev.title}</Text>
//                                                                 <Text style={s.eventSub} numberOfLines={2}>{ev.subtitle}</Text>
//                                                             </View>
//                                                         </View>

//                                                         {/* Footer: date + badges */}
//                                                         <View style={s.eventCardFooter}>
//                                                             <Text style={s.eventDate}>
//                                                                 {formatDate(ev.date)}  {formatTime(ev.date)}
//                                                             </Text>
//                                                             <View style={s.eventBadges}>
//                                                                 {ev.type === 'report' && ev.reportCategory && ev.reportCategory !== 'Other' && (() => {
//                                                                     const cc = categoryColor(ev.reportCategory);
//                                                                     return (
//                                                                         <View style={[s.badge, { backgroundColor: cc.bg }]}>
//                                                                             <Text style={[s.badgeTxt, { color: cc.text }]}>{ev.reportCategory}</Text>
//                                                                         </View>
//                                                                     );
//                                                                 })()}
//                                                                 <View style={[s.badge, { backgroundColor: ss.color + '20' }]}>
//                                                                     <Text style={[s.badgeTxt, { color: ss.color }]}>{ss.label}</Text>
//                                                                 </View>
//                                                             </View>
//                                                         </View>
//                                                     </TouchableOpacity>
//                                                 </View>
//                                             );
//                                         })}
//                                     </View>
//                                 ))}
//                             </View>
//                         );
//                     })}

//                     {/* Bottom padding */}
//                     <View style={{ height: 32 }} />
//                 </ScrollView>
//             )}

//             {/* ════════════════════════════════════════════════════════════════════
//           EVENT DETAIL BOTTOM SHEET
//       ════════════════════════════════════════════════════════════════════ */}
//             <Modal
//                 animationType="slide"
//                 transparent
//                 visible={showDetail}
//                 onRequestClose={() => setShowDetail(false)}
//             >
//                 <View style={s.overlay}>
//                     <View style={s.sheet}>
//                         {/* Handle */}
//                         <View style={s.handle} />

//                         {/* Header */}
//                         <View style={s.sheetHead}>
//                             <View style={{ flex: 1 }}>
//                                 <Text style={s.sheetTitle} numberOfLines={2}>{selEvent?.title}</Text>
//                                 <Text style={s.sheetSub}>{selEvent ? formatDate(selEvent.date) : ''}</Text>
//                             </View>
//                             <TouchableOpacity onPress={() => setShowDetail(false)} style={s.closeBtn}>
//                                 <X size={20} color={C.textMid} strokeWidth={2} />
//                             </TouchableOpacity>
//                         </View>

//                         {selEvent && (
//                             <ScrollView contentContainerStyle={s.sheetBody} showsVerticalScrollIndicator={false}>

//                                 {/* Type + status row */}
//                                 <View style={s.detailMeta}>
//                                     {(() => {
//                                         const es = eventStyle(selEvent.type);
//                                         const ss = statusStyle(selEvent.status);
//                                         return (
//                                             <>
//                                                 <View style={[s.badge, { backgroundColor: es.dot + '20' }]}>
//                                                     <Text style={[s.badgeTxt, { color: es.dot, textTransform: 'capitalize' }]}>{selEvent.type}</Text>
//                                                 </View>
//                                                 <View style={[s.badge, { backgroundColor: ss.color + '20' }]}>
//                                                     <Text style={[s.badgeTxt, { color: ss.color }]}>{ss.label}</Text>
//                                                 </View>
//                                                 {selEvent.reportCategory && selEvent.reportCategory !== 'Other' && (() => {
//                                                     const cc = categoryColor(selEvent.reportCategory);
//                                                     return (
//                                                         <View style={[s.badge, { backgroundColor: cc.bg }]}>
//                                                             <Text style={[s.badgeTxt, { color: cc.text }]}>{selEvent.reportCategory}</Text>
//                                                         </View>
//                                                     );
//                                                 })()}
//                                             </>
//                                         );
//                                     })()}
//                                 </View>

//                                 {/* File info */}
//                                 {(selEvent.fileSize || selEvent.fileType) && (
//                                     <View style={s.infoBox}>
//                                         <Text style={s.infoBoxRow}>
//                                             <Text style={s.infoLabel}>Type  </Text>
//                                             <Text style={s.infoValue}>{selEvent.fileType || '—'}</Text>
//                                         </Text>
//                                         {selEvent.fileSize && (
//                                             <Text style={s.infoBoxRow}>
//                                                 <Text style={s.infoLabel}>Size  </Text>
//                                                 <Text style={s.infoValue}>{(selEvent.fileSize / 1024).toFixed(1)} KB</Text>
//                                             </Text>
//                                         )}
//                                         <Text style={s.infoBoxRow}>
//                                             <Text style={s.infoLabel}>Time  </Text>
//                                             <Text style={s.infoValue}>{formatTime(selEvent.date)}</Text>
//                                         </Text>
//                                     </View>
//                                 )}

//                                 {/* View / Open button */}
//                                 {selEvent.fileUrl && (
//                                     <TouchableOpacity
//                                         style={[s.viewBtn,
//                                         selEvent.type === 'report' ? { backgroundColor: C.warning } : { backgroundColor: C.primary },
//                                         opening && { opacity: 0.6 },
//                                         ]}
//                                         onPress={() => openFile(selEvent)}
//                                         disabled={opening}
//                                     >
//                                         {opening
//                                             ? <ActivityIndicator size="small" color="#FFF" />
//                                             : <Eye size={18} color="#FFF" strokeWidth={2} />
//                                         }
//                                         <Text style={s.viewBtnTxt}>
//                                             {opening ? 'Downloading…' : `Open ${selEvent.type === 'report' ? 'Report' : 'Document'}`}
//                                         </Text>
//                                     </TouchableOpacity>
//                                 )}

//                                 {/* Extracted data — documents only */}
//                                 {selEvent.type === 'document' && selEvent.meta && (
//                                     <>
//                                         {(selEvent.meta.diagnoses?.length ?? 0) > 0 && (
//                                             <View style={s.metaBox}>
//                                                 <Text style={s.metaTitle}>Diagnoses</Text>
//                                                 {selEvent.meta.diagnoses!.map((d, i) => (
//                                                     <Text key={i} style={s.metaItem}>• {d}</Text>
//                                                 ))}
//                                             </View>
//                                         )}
//                                         {(selEvent.meta.medications?.length ?? 0) > 0 && (
//                                             <View style={s.metaBox}>
//                                                 <Text style={[s.metaTitle, { color: C.success }]}>Medications</Text>
//                                                 {selEvent.meta.medications!.map((m, i) => (
//                                                     <Text key={i} style={[s.metaItem, { color: C.success }]}>• {m}</Text>
//                                                 ))}
//                                             </View>
//                                         )}
//                                         {(selEvent.meta.allergies?.length ?? 0) > 0 && (
//                                             <View style={s.metaBox}>
//                                                 <Text style={[s.metaTitle, { color: C.danger }]}>Allergies</Text>
//                                                 {selEvent.meta.allergies!.map((a, i) => (
//                                                     <Text key={i} style={[s.metaItem, { color: C.danger }]}>• {a}</Text>
//                                                 ))}
//                                             </View>
//                                         )}
//                                         {selEvent.meta.summary ? (
//                                             <View style={s.metaBox}>
//                                                 <Text style={s.metaTitle}>Processing Summary</Text>
//                                                 <Text style={[s.metaItem, { lineHeight: 20 }]}>{selEvent.meta.summary}</Text>
//                                             </View>
//                                         ) : null}
//                                     </>
//                                 )}

//                                 {/* Notes — reports */}
//                                 {selEvent.type === 'report' && selEvent.meta.notes ? (
//                                     <View style={s.metaBox}>
//                                         <Text style={s.metaTitle}>Notes</Text>
//                                         <Text style={s.metaItem}>{selEvent.meta.notes}</Text>
//                                     </View>
//                                 ) : null}

//                                 <View style={{ height: 16 }} />
//                             </ScrollView>
//                         )}
//                     </View>
//                 </View>
//             </Modal>
//         </SafeAreaView>
//     );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//     root: { flex: 1, backgroundColor: C.bg },

//     // Top bar
//     topBar: { backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//     topTitle: { fontSize: 22, fontWeight: '800', color: C.textDark, letterSpacing: -0.4 },
//     topSub: { fontSize: 13, color: C.textLight, marginTop: 2 },

//     // Filter
//     filterWrap: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
//     filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
//     filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border },
//     filterChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
//     filterChipTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },
//     filterChipTxtActive: { color: C.primary },
//     filterCount: { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
//     filterCountActive: { backgroundColor: C.primary },
//     filterCountTxt: { fontSize: 10, fontWeight: '700', color: C.textMid },
//     filterCountTxtActive: { color: '#FFF' },

//     // States
//     centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
//     loadingTxt: { fontSize: 14, color: C.textLight, marginTop: 8 },
//     emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textMid },
//     emptySub: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

//     // Scroll
//     scroll: { flex: 1 },
//     scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

//     // Year
//     yearBlock: { marginBottom: 8 },
//     yearHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
//     yearBadge: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
//     yearBadgeTxt: { fontSize: 14, fontWeight: '800', color: '#FFF' },
//     yearLine: { flex: 1, height: 1, backgroundColor: C.border },

//     // Month
//     monthBlock: { marginLeft: 8, marginBottom: 16 },
//     monthLabel: { fontSize: 13, fontWeight: '700', color: C.textMid, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

//     // Event row (spine + card)
//     eventRow: { flexDirection: 'row', marginBottom: 12 },
//     spine: { width: 28, alignItems: 'center', paddingTop: 14 },
//     dot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
//     line: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4 },

//     // Event card
//     eventCard: {
//         flex: 1, marginLeft: 12, backgroundColor: C.surface, borderRadius: 16, padding: 14,
//         shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
//     },
//     eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
//     eventIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//     eventCardInfo: { flex: 1 },
//     eventTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 },
//     eventSub: { fontSize: 12, color: C.textMid, lineHeight: 17 },
//     eventCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
//     eventDate: { fontSize: 11, color: C.textLight },
//     eventBadges: { flexDirection: 'row', gap: 6 },

//     // Badges
//     badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
//     badgeTxt: { fontSize: 11, fontWeight: '700' },

//     // Modal / sheet
//     overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//     sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
//     handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
//     sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//     sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 4 },
//     sheetSub: { fontSize: 12, color: C.textLight },
//     closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
//     sheetBody: { paddingHorizontal: 22, paddingTop: 16 },

//     // Detail content
//     detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
//     infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 14 },
//     infoBoxRow: { fontSize: 13, color: C.textMid, marginBottom: 4 },
//     infoLabel: { fontWeight: '700', color: C.textDark },
//     infoValue: { color: C.textMid },

//     viewBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
//     viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

//     metaBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 12 },
//     metaTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 },
//     metaItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },
// });

import React, { useState, useEffect, useCallback, JSX } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert, Modal,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import {
    FileText, FlaskConical, ClipboardList, Eye,
    X, ChevronDown, ChevronUp, Calendar,
    CheckCircle, Clock, AlertCircle, Download,
} from 'lucide-react-native';
import ApiService, { BASE_URL } from '../../services/api';

// ── Tokens ────────────────────────────────────────────────────────────────────
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
    purple: '#7C3AED',
    purpleLight: '#EDE9FE',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type EventType = 'all' | 'document' | 'report' | 'form';

interface TimelineEvent {
    id: string;
    type: 'document' | 'report' | 'form';
    title: string;
    subtitle: string;
    date: string;
    status: string;
    fileId: string | null;
    fileUrl: string | null;
    fileType: string | null;
    fileSize: number | null;
    reportCategory?: string;
    meta: {
        diagnoses?: string[];
        medications?: string[];
        allergies?: string[];
        summary?: string;
        notes?: string;
    };
}

interface GroupedMonth { month: string; events: TimelineEvent[]; }
interface GroupedYear { year: string; months: GroupedMonth[]; }

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTERS: { key: EventType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'document', label: 'Documents' },
    { key: 'report', label: 'Reports' },
    { key: 'form', label: 'Forms' },
];

const MONTH_ORDER: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    } catch { return dateStr; }
}

function formatTime(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return ''; }
}

function categoryColor(cat?: string) {
    switch (cat) {
        case 'KFT': return { bg: '#EFF6FF', text: '#1D4ED8' };
        case 'LFT': return { bg: '#ECFDF5', text: '#065F46' };
        case 'CBC': return { bg: '#FFF7ED', text: '#C2410C' };
        case 'Lipid Profile': return { bg: '#FDF4FF', text: '#7E22CE' };
        case 'Thyroid': return { bg: '#FFF1F2', text: '#BE123C' };
        case 'Blood Sugar': return { bg: '#FFFBEB', text: '#92400E' };
        default: return { bg: '#F1F5F9', text: '#475569' };
    }
}

function eventStyle(type: TimelineEvent['type']) {
    switch (type) {
        case 'document': return { dot: C.primary, iconBg: C.primaryLight, icon: 'doc' };
        case 'report': return { dot: C.warning, iconBg: C.warningLight, icon: 'report' };
        case 'form': return { dot: C.success, iconBg: C.successLight, icon: 'form' };
    }
}

function statusStyle(status: string) {
    switch (status) {
        case 'completed': return { color: C.success, label: 'Processed', Icon: CheckCircle };
        case 'failed': return { color: C.danger, label: 'Failed', Icon: AlertCircle };
        case 'processing': return { color: C.warning, label: 'Processing', Icon: Clock };
        case 'pending': return { color: C.primary, label: 'Pending', Icon: Clock };
        default: return { color: C.success, label: 'Saved', Icon: CheckCircle };
    }
}

// ── Group events by year → month ──────────────────────────────────────────────
function groupEvents(events: TimelineEvent[]): GroupedYear[] {
    const map = new Map<string, Map<string, TimelineEvent[]>>();

    for (const ev of events) {
        const d = new Date(ev.date);
        const year = d.getFullYear().toString();
        const month = d.toLocaleString('default', { month: 'long' });

        if (!map.has(year)) map.set(year, new Map());
        const yearMap = map.get(year)!;
        if (!yearMap.has(month)) yearMap.set(month, []);
        yearMap.get(month)!.push(ev);
    }

    const result: GroupedYear[] = [];
    const years = Array.from(map.keys()).sort((a, b) => parseInt(b) - parseInt(a));

    for (const year of years) {
        const yearMap = map.get(year)!;
        const months = Array.from(yearMap.keys())
            .sort((a, b) => (MONTH_ORDER[b] || 0) - (MONTH_ORDER[a] || 0));

        result.push({
            year,
            months: months.map(month => ({ month, events: yearMap.get(month)! })),
        });
    }

    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PatientTimeline(): JSX.Element {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<EventType>('all');
    const [selEvent, setSelEvent] = useState<TimelineEvent | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [opening, setOpening] = useState(false);
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            setLoading(true);
            const res = await ApiService.getTimeline() as any;
            if (res.success && Array.isArray(res.data)) {
                setEvents(res.data);
                if (res.data.length > 0) {
                    const latestYear = new Date(res.data[0].date).getFullYear().toString();
                    setExpandedYears(new Set([latestYear]));
                }
            }
        } catch (e: any) {
            console.error('Load timeline error:', e);
            Alert.alert('Error', e.message || 'Could not load timeline');
        } finally {
            setLoading(false);
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    // ── File opener — downloads to device cache then shares/opens ────────────────
    const openFile = async (event: TimelineEvent) => {
        if (!event.fileUrl || !event.fileId) {
            Alert.alert('Not available', 'This file is not yet available for viewing.');
            return;
        }

        // Fix localhost URLs
        let fileUrl = event.fileUrl;
        if (fileUrl.includes('localhost')) {
            const baseHost = new URL(BASE_URL).hostname;
            fileUrl = fileUrl.replace('localhost', baseHost);
        }

        setOpening(true);
        try {
            // Determine file extension
            let ext = '.pdf';
            if (event.fileType?.includes('pdf')) ext = '.pdf';
            else if (event.fileType?.startsWith('image/jpeg')) ext = '.jpg';
            else if (event.fileType?.startsWith('image/png')) ext = '.png';
            else if (event.fileType?.includes('word') || event.fileType?.includes('docx')) ext = '.docx';
            else if (event.fileType?.includes('text')) ext = '.txt';

            const localUri = `${FileSystem.cacheDirectory}seharoop_${event.fileId}${ext}`;

            // Check if already cached
            const fileInfo = await FileSystem.getInfoAsync(localUri);

            if (!fileInfo.exists) {
                // Download the file
                const token = await ApiService.getToken();
                const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (downloadResult.status !== 200) {
                    throw new Error(`Download failed with status ${downloadResult.status}`);
                }
            }

            // For images on iOS, use WebBrowser for better preview
            if (event.fileType?.startsWith('image/') && Platform.OS === 'ios') {
                await WebBrowser.openBrowserAsync(localUri);
            } else {
                // Check if sharing is available
                const isSharingAvailable = await Sharing.isAvailableAsync();
                if (isSharingAvailable) {
                    await Sharing.shareAsync(localUri, {
                        mimeType: event.fileType || 'application/octet-stream',
                        dialogTitle: event.title,
                    });
                } else {
                    // Fallback to WebBrowser
                    await WebBrowser.openBrowserAsync(localUri);
                }
            }
        } catch (err: any) {
            console.error('openFile error:', err);
            Alert.alert('Cannot open file', err.message || 'Failed to open document. Please try again.');
        } finally {
            setOpening(false);
        }
    };

    // ── Filtered & grouped data ───────────────────────────────────────────────
    const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
    const grouped = groupEvents(filtered);

    const toggleYear = (year: string) => {
        setExpandedYears(prev => {
            const next = new Set(prev);
            next.has(year) ? next.delete(year) : next.add(year);
            return next;
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={s.root}>
            {/* ── Title bar ── */}
            <View style={s.topBar}>
                <View>
                    <Text style={s.topTitle}>Medical Timeline</Text>
                    <Text style={s.topSub}>
                        {events.length} {events.length === 1 ? 'event' : 'events'} total
                    </Text>
                </View>
            </View>

            {/* ── Filter chips ── */}
            <View style={s.filterWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                    {FILTERS.map(f => {
                        const count = f.key === 'all'
                            ? events.length
                            : events.filter(e => e.type === f.key).length;
                        const active = filter === f.key;
                        return (
                            <TouchableOpacity
                                key={f.key}
                                style={[s.filterChip, active && s.filterChipActive]}
                                onPress={() => setFilter(f.key)}
                                activeOpacity={0.8}
                            >
                                <Text style={[s.filterChipTxt, active && s.filterChipTxtActive]}>
                                    {f.label}
                                </Text>
                                <View style={[s.filterCount, active && s.filterCountActive]}>
                                    <Text style={[s.filterCountTxt, active && s.filterCountTxtActive]}>{count}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Content ── */}
            {loading ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={s.loadingTxt}>Loading timeline…</Text>
                </View>
            ) : grouped.length === 0 ? (
                <View style={s.centered}>
                    <Calendar size={48} color={C.textLight} strokeWidth={1.5} />
                    <Text style={s.emptyTitle}>No events yet</Text>
                    <Text style={s.emptySub}>
                        {filter !== 'all'
                            ? `No ${filter}s found. Try a different filter.`
                            : 'Upload documents or lab reports to see them here.'}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={s.scroll}
                    contentContainerStyle={s.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    {grouped.map(yearGroup => {
                        const isExpanded = expandedYears.has(yearGroup.year);
                        return (
                            <View key={yearGroup.year} style={s.yearBlock}>
                                {/* Year header */}
                                <TouchableOpacity style={s.yearHeader} onPress={() => toggleYear(yearGroup.year)} activeOpacity={0.8}>
                                    <View style={s.yearBadge}>
                                        <Text style={s.yearBadgeTxt}>{yearGroup.year}</Text>
                                    </View>
                                    <View style={s.yearLine} />
                                    {isExpanded
                                        ? <ChevronUp size={18} color={C.textLight} strokeWidth={2} />
                                        : <ChevronDown size={18} color={C.textLight} strokeWidth={2} />
                                    }
                                </TouchableOpacity>

                                {isExpanded && yearGroup.months.map(monthGroup => (
                                    <View key={monthGroup.month} style={s.monthBlock}>
                                        {/* Month label */}
                                        <Text style={s.monthLabel}>{monthGroup.month}</Text>

                                        {/* Events */}
                                        {monthGroup.events.map((ev, evIdx) => {
                                            const es = eventStyle(ev.type);
                                            const ss = statusStyle(ev.status);
                                            const isLast = evIdx === monthGroup.events.length - 1;

                                            return (
                                                <View key={ev.id} style={s.eventRow}>
                                                    {/* Timeline spine */}
                                                    <View style={s.spine}>
                                                        <View style={[s.dot, { backgroundColor: es.dot }]} />
                                                        {!isLast && <View style={s.line} />}
                                                    </View>

                                                    {/* Event card */}
                                                    <TouchableOpacity
                                                        style={s.eventCard}
                                                        onPress={() => { setSelEvent(ev); setShowDetail(true); }}
                                                        activeOpacity={0.85}
                                                    >
                                                        {/* Icon + title */}
                                                        <View style={s.eventCardTop}>
                                                            <View style={[s.eventIcon, { backgroundColor: es.iconBg }]}>
                                                                {ev.type === 'document' && <FileText size={16} color={es.dot} strokeWidth={2} />}
                                                                {ev.type === 'report' && <FlaskConical size={16} color={es.dot} strokeWidth={2} />}
                                                                {ev.type === 'form' && <ClipboardList size={16} color={es.dot} strokeWidth={2} />}
                                                            </View>
                                                            <View style={s.eventCardInfo}>
                                                                <Text style={s.eventTitle} numberOfLines={1}>{ev.title}</Text>
                                                                <Text style={s.eventSub} numberOfLines={2}>{ev.subtitle}</Text>
                                                            </View>
                                                        </View>

                                                        {/* Footer: date + badges */}
                                                        <View style={s.eventCardFooter}>
                                                            <Text style={s.eventDate}>
                                                                {formatDate(ev.date)}  {formatTime(ev.date)}
                                                            </Text>
                                                            <View style={s.eventBadges}>
                                                                {ev.type === 'report' && ev.reportCategory && ev.reportCategory !== 'Other' && (() => {
                                                                    const cc = categoryColor(ev.reportCategory);
                                                                    return (
                                                                        <View style={[s.badge, { backgroundColor: cc.bg }]}>
                                                                            <Text style={[s.badgeTxt, { color: cc.text }]}>{ev.reportCategory}</Text>
                                                                        </View>
                                                                    );
                                                                })()}
                                                                <View style={[s.badge, { backgroundColor: ss.color + '20' }]}>
                                                                    <Text style={[s.badgeTxt, { color: ss.color }]}>{ss.label}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>
                        );
                    })}
                    <View style={{ height: 32 }} />
                </ScrollView>
            )}

            {/* ════════════════════════════════════════════════════════════════════
          EVENT DETAIL BOTTOM SHEET
      ════════════════════════════════════════════════════════════════════ */}
            <Modal
                animationType="slide"
                transparent
                visible={showDetail}
                onRequestClose={() => setShowDetail(false)}
            >
                <View style={s.overlay}>
                    <View style={s.sheet}>
                        {/* Handle */}
                        <View style={s.handle} />

                        {/* Header */}
                        <View style={s.sheetHead}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.sheetTitle} numberOfLines={2}>{selEvent?.title}</Text>
                                <Text style={s.sheetSub}>{selEvent ? formatDate(selEvent.date) : ''}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowDetail(false)} style={s.closeBtn}>
                                <X size={20} color={C.textMid} strokeWidth={2} />
                            </TouchableOpacity>
                        </View>

                        {selEvent && (
                            <ScrollView contentContainerStyle={s.sheetBody} showsVerticalScrollIndicator={false}>
                                {/* Type + status row */}
                                <View style={s.detailMeta}>
                                    {(() => {
                                        const es = eventStyle(selEvent.type);
                                        const ss = statusStyle(selEvent.status);
                                        return (
                                            <>
                                                <View style={[s.badge, { backgroundColor: es.dot + '20' }]}>
                                                    <Text style={[s.badgeTxt, { color: es.dot, textTransform: 'capitalize' }]}>{selEvent.type}</Text>
                                                </View>
                                                <View style={[s.badge, { backgroundColor: ss.color + '20' }]}>
                                                    <Text style={[s.badgeTxt, { color: ss.color }]}>{ss.label}</Text>
                                                </View>
                                                {selEvent.reportCategory && selEvent.reportCategory !== 'Other' && (() => {
                                                    const cc = categoryColor(selEvent.reportCategory);
                                                    return (
                                                        <View style={[s.badge, { backgroundColor: cc.bg }]}>
                                                            <Text style={[s.badgeTxt, { color: cc.text }]}>{selEvent.reportCategory}</Text>
                                                        </View>
                                                    );
                                                })()}
                                            </>
                                        );
                                    })()}
                                </View>

                                {/* File info */}
                                {(selEvent.fileSize || selEvent.fileType) && (
                                    <View style={s.infoBox}>
                                        <Text style={s.infoBoxRow}>
                                            <Text style={s.infoLabel}>Type  </Text>
                                            <Text style={s.infoValue}>{selEvent.fileType || '—'}</Text>
                                        </Text>
                                        {selEvent.fileSize && (
                                            <Text style={s.infoBoxRow}>
                                                <Text style={s.infoLabel}>Size  </Text>
                                                <Text style={s.infoValue}>{(selEvent.fileSize / 1024).toFixed(1)} KB</Text>
                                            </Text>
                                        )}
                                        <Text style={s.infoBoxRow}>
                                            <Text style={s.infoLabel}>Time  </Text>
                                            <Text style={s.infoValue}>{formatTime(selEvent.date)}</Text>
                                        </Text>
                                    </View>
                                )}

                                {/* View / Open button */}
                                {selEvent.fileUrl && (
                                    <TouchableOpacity
                                        style={[s.viewBtn,
                                        selEvent.type === 'report' ? { backgroundColor: C.warning } : { backgroundColor: C.primary },
                                        opening && { opacity: 0.6 },
                                        ]}
                                        onPress={() => openFile(selEvent)}
                                        disabled={opening}
                                    >
                                        {opening
                                            ? <ActivityIndicator size="small" color="#FFF" />
                                            : <Eye size={18} color="#FFF" strokeWidth={2} />
                                        }
                                        <Text style={s.viewBtnTxt}>
                                            {opening ? 'Downloading…' : `Open ${selEvent.type === 'report' ? 'Report' : 'Document'}`}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Extracted data — documents only */}
                                {selEvent.type === 'document' && selEvent.meta && (
                                    <>
                                        {(selEvent.meta.diagnoses?.length ?? 0) > 0 && (
                                            <View style={s.metaBox}>
                                                <Text style={s.metaTitle}>Diagnoses</Text>
                                                {selEvent.meta.diagnoses!.map((d, i) => (
                                                    <Text key={i} style={s.metaItem}>• {d}</Text>
                                                ))}
                                            </View>
                                        )}
                                        {(selEvent.meta.medications?.length ?? 0) > 0 && (
                                            <View style={s.metaBox}>
                                                <Text style={[s.metaTitle, { color: C.success }]}>Medications</Text>
                                                {selEvent.meta.medications!.map((m, i) => (
                                                    <Text key={i} style={[s.metaItem, { color: C.success }]}>• {m}</Text>
                                                ))}
                                            </View>
                                        )}
                                        {(selEvent.meta.allergies?.length ?? 0) > 0 && (
                                            <View style={s.metaBox}>
                                                <Text style={[s.metaTitle, { color: C.danger }]}>Allergies</Text>
                                                {selEvent.meta.allergies!.map((a, i) => (
                                                    <Text key={i} style={[s.metaItem, { color: C.danger }]}>• {a}</Text>
                                                ))}
                                            </View>
                                        )}
                                        {selEvent.meta.summary ? (
                                            <View style={s.metaBox}>
                                                <Text style={s.metaTitle}>Processing Summary</Text>
                                                <Text style={[s.metaItem, { lineHeight: 20 }]}>{selEvent.meta.summary}</Text>
                                            </View>
                                        ) : null}
                                    </>
                                )}

                                {/* Notes — reports */}
                                {selEvent.type === 'report' && selEvent.meta.notes ? (
                                    <View style={s.metaBox}>
                                        <Text style={s.metaTitle}>Notes</Text>
                                        <Text style={s.metaItem}>{selEvent.meta.notes}</Text>
                                    </View>
                                ) : null}

                                <View style={{ height: 16 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Top bar
    topBar: { backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    topTitle: { fontSize: 22, fontWeight: '800', color: C.textDark, letterSpacing: -0.4 },
    topSub: { fontSize: 13, color: C.textLight, marginTop: 2 },

    // Filter
    filterWrap: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
    filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border },
    filterChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    filterChipTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },
    filterChipTxtActive: { color: C.primary },
    filterCount: { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
    filterCountActive: { backgroundColor: C.primary },
    filterCountTxt: { fontSize: 10, fontWeight: '700', color: C.textMid },
    filterCountTxtActive: { color: '#FFF' },

    // States
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    loadingTxt: { fontSize: 14, color: C.textLight, marginTop: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textMid },
    emptySub: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

    // Year
    yearBlock: { marginBottom: 8 },
    yearHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    yearBadge: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
    yearBadgeTxt: { fontSize: 14, fontWeight: '800', color: '#FFF' },
    yearLine: { flex: 1, height: 1, backgroundColor: C.border },

    // Month
    monthBlock: { marginLeft: 8, marginBottom: 16 },
    monthLabel: { fontSize: 13, fontWeight: '700', color: C.textMid, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

    // Event row (spine + card)
    eventRow: { flexDirection: 'row', marginBottom: 12 },
    spine: { width: 28, alignItems: 'center', paddingTop: 14 },
    dot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
    line: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4 },

    // Event card
    eventCard: {
        flex: 1, marginLeft: 12, backgroundColor: C.surface, borderRadius: 16, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    eventIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    eventCardInfo: { flex: 1 },
    eventTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3 },
    eventSub: { fontSize: 12, color: C.textMid, lineHeight: 17 },
    eventCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
    eventDate: { fontSize: 11, color: C.textLight },
    eventBadges: { flexDirection: 'row', gap: 6 },

    // Badges
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeTxt: { fontSize: 11, fontWeight: '700' },

    // Modal / sheet
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 4 },
    sheetSub: { fontSize: 12, color: C.textLight },
    closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
    sheetBody: { paddingHorizontal: 22, paddingTop: 16 },

    // Detail content
    detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    infoBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 14 },
    infoBoxRow: { fontSize: 13, color: C.textMid, marginBottom: 4 },
    infoLabel: { fontWeight: '700', color: C.textDark },
    infoValue: { color: C.textMid },

    viewBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
    viewBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

    metaBox: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 12 },
    metaTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 },
    metaItem: { fontSize: 13, color: C.textMid, marginBottom: 3 },
});