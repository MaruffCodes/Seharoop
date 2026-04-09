// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import { 
//   LogOut, 
//   Users, 
//   Calendar, 
//   FileText, 
//   Activity,
//   Stethoscope,
//   TrendingUp,
//   Clock
// } from 'lucide-react-native';
// import ApiService from '../../services/api';

// interface DoctorData {
//   name: string;
//   email: string;
//   specialization: string;
// }

// interface DashboardStats {
//   patientsToday: number;
//   appointments: number;
//   reports: number;
//   satisfaction: number;
// }

// interface ScheduleItem {
//   time: string;
//   patientName: string;
//   appointmentType: string;
// }

// interface ActivityItem {
//   text: string;
//   time: string;
// }

// export default function DoctorDashboard() {
//   const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
//   const [stats, setStats] = useState<DashboardStats>({
//     patientsToday: 0,
//     appointments: 0,
//     reports: 0,
//     satisfaction: 0,
//   });
//   const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
//   const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Load doctor profile
//       const profileResponse = await ApiService.getDoctorProfile();
//       if (profileResponse.success && profileResponse.data) {
//         setDoctorData({
//           name: profileResponse.data.name,
//           email: profileResponse.data.email,
//           specialization: profileResponse.data.specialization,
//         });
        
//         // Store user data in AsyncStorage for consistency
//         await AsyncStorage.setItem('userData', JSON.stringify({
//           name: profileResponse.data.name,
//           email: profileResponse.data.email,
//           specialization: profileResponse.data.specialization,
//         }));
//       }

//       // Load dashboard statistics (mock data - you might want to create an API endpoint for this)
//       await loadDashboardStats();
      
//       // Load today's schedule (mock data - you might want to create an API endpoint for this)
//       await loadTodaysSchedule();
      
//       // Load recent activity (mock data - you might want to create an API endpoint for this)
//       await loadRecentActivity();

//     } catch (error) {
//       console.log('Error loading dashboard data:', error);
//       Alert.alert('Error', 'Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDashboardStats = async () => {
//     try {
//       const response = await ApiService.getDoctorDashboardStats();
//       if (response.success && response.data) {
//         setStats(response.data);
//         return;
//       }
//     } catch (error) {
//       console.log('Stats API missing or failed. Using fallback.');
//     }
    
//     // Fallback Mock Data
//     setStats({ patientsToday: 24, appointments: 12, reports: 8, satisfaction: 95 });
//   };

//   const loadTodaysSchedule = async () => {
//     try {
//       const response = await ApiService.getDoctorSchedule();
//       if (response.success && response.data) {
//         setSchedule(response.data);
//         return;
//       }
//     } catch (error) {
//       console.log('Schedule API missing or failed. Using fallback.');
//     }
    
//     // Fallback Mock Data
//     setSchedule([
//       { time: '09:00 AM', patientName: 'Sarah Johnson', appointmentType: 'Regular Checkup' },
//       { time: '10:30 AM', patientName: 'Michael Davis', appointmentType: 'Follow-up' },
//       { time: '02:00 PM', patientName: 'Emily Wilson', appointmentType: 'Consultation' }
//     ]);
//   };

//   const loadRecentActivity = async () => {
//     try {
//       const response = await ApiService.getDoctorActivity();
//       if (response.success && response.data) {
//         setRecentActivity(response.data);
//         return;
//       }
//     } catch (error) {
//       console.log('Activity API missing or failed. Using fallback.');
//     }
    
//     // Fallback Mock Data
//     setRecentActivity([
//       { text: 'Updated patient record for John Smith', time: '2 hours ago' },
//       { text: 'Completed consultation with Mary Brown', time: '4 hours ago' },
//       { text: 'Uploaded lab report for David Lee', time: '6 hours ago' }
//     ]);
//   };

//   const handleLogout = async () => {
//     Alert.alert('Logout', 'Are you sure you want to logout?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Logout',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             setLoading(true);
//             await ApiService.logout();
//             // ApiService handles storage teardown and routing
//           } catch (error) {
//             console.error('Error during logout:', error);
//             Alert.alert('Error', 'Failed to logout properly');
//           } finally {
//             setLoading(false);
//           }
//         },
//       },
//     ]);
//   };

//   const handleFindPatient = () => {
//     router.push('/(tabs)/patient-search');
//   };

//   const handleAppointments = () => {
//     // Navigate to appointments screen
//     Alert.alert('Info', 'Appointments feature coming soon!');
//   };

//   const handleReports = () => {
//     // Navigate to reports screen
//     Alert.alert('Info', 'Reports feature coming soon!');
//   };

//   const handleAnalytics = () => {
//     // Navigate to analytics screen
//     Alert.alert('Info', 'Analytics feature coming soon!');
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#2563EB" />
//           <Text style={styles.loadingText}>Loading Dashboard...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.header}>
//           <View style={styles.headerContent}>
//             <View>
//               <Text style={styles.welcomeText}>Welcome back,</Text>
//               <Text style={styles.doctorName}>{doctorData?.name || 'Doctor'}</Text>
//               <Text style={styles.specialization}>{doctorData?.specialization}</Text>
//             </View>
//             <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//               <LogOut size={20} color="#DC2626" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* <View style={styles.statsGrid}>
//           <View style={styles.statCard}>
//             <View style={styles.statIconContainer}>
//               <Users size={24} color="#2563EB" />
//             </View>
//             <Text style={styles.statNumber}>{stats.patientsToday}</Text>
//             <Text style={styles.statLabel}>Patients Today</Text>
//           </View>

//           <View style={styles.statCard}>
//             <View style={styles.statIconContainer}>
//               <Calendar size={24} color="#059669" />
//             </View>
//             <Text style={styles.statNumber}>{stats.appointments}</Text>
//             <Text style={styles.statLabel}>Appointments</Text>
//           </View>

//           <View style={styles.statCard}>
//             <View style={styles.statIconContainer}>
//               <FileText size={24} color="#DC2626" />
//             </View>
//             <Text style={styles.statNumber}>{stats.reports}</Text>
//             <Text style={styles.statLabel}>Reports</Text>
//           </View>

//           <View style={styles.statCard}>
//             <View style={styles.statIconContainer}>
//               <Activity size={24} color="#7C3AED" />
//             </View>
//             <Text style={styles.statNumber}>{stats.satisfaction}%</Text>
//             <Text style={styles.statLabel}>Satisfaction</Text>
//           </View>
//         </View> */}

//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Quick Actions</Text>
//           <View style={styles.actionsGrid}>
//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={handleFindPatient}>
//               <Stethoscope size={32} color="#2563EB" />
//               <Text style={styles.actionTitle}>Find Patient</Text>
//               <Text style={styles.actionSubtitle}>Scan QR or enter ID</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={handleAppointments}>
//               <Calendar size={32} color="#059669" />
//               <Text style={styles.actionTitle}>Appointments</Text>
//               <Text style={styles.actionSubtitle}>View schedule</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={handleReports}>
//               <FileText size={32} color="#DC2626" />
//               <Text style={styles.actionTitle}>Reports</Text>
//               <Text style={styles.actionSubtitle}>Generate reports</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={handleAnalytics}>
//               <TrendingUp size={32} color="#7C3AED" />
//               <Text style={styles.actionTitle}>Analytics</Text>
//               <Text style={styles.actionSubtitle}>View insights</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
//           <View style={styles.scheduleCard}>
//             {schedule.map((item, index) => (
//               <View key={index} style={styles.scheduleItem}>
//                 <View style={styles.timeContainer}>
//                   <Clock size={16} color="#2563EB" />
//                   <Text style={styles.timeText}>{item.time}</Text>
//                 </View>
//                 <View style={styles.appointmentInfo}>
//                   <Text style={styles.patientName}>{item.patientName}</Text>
//                   <Text style={styles.appointmentType}>{item.appointmentType}</Text>
//                 </View>
//               </View>
//             ))}
//           </View>
//         </View> */}

//         {/* <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Recent Activity</Text>
//           <View style={styles.activityCard}>
//             {recentActivity.map((activity, index) => (
//               <View key={index}>
//                 <Text style={styles.activityText}>• {activity.text}</Text>
//                 <Text style={styles.activityTime}>{activity.time}</Text>
//               </View>
//             ))}
//           </View>
//         </View> */}
//       </ScrollView>
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
//   header: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 24,
//     marginVertical: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   welcomeText: {
//     fontSize: 16,
//     color: '#64748B',
//   },
//   doctorName: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginTop: 4,
//   },
//   specialization: {
//     fontSize: 14,
//     color: '#2563EB',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   logoutButton: {
//     padding: 12,
//     borderRadius: 12,
//     backgroundColor: '#FEE2E2',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 24,
//   },
//   statCard: {
//     flex: 1,
//     minWidth: '45%',
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
//   statIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#F1F5F9',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1E293B',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#64748B',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginBottom: 16,
//   },
//   actionsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   actionCard: {
//     flex: 1,
//     minWidth: '45%',
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
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E293B',
//     marginTop: 12,
//     textAlign: 'center',
//   },
//   actionSubtitle: {
//     fontSize: 12,
//     color: '#64748B',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   scheduleCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   scheduleItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   timeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: 100,
//   },
//   timeText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#2563EB',
//     marginLeft: 8,
//   },
//   appointmentInfo: {
//     flex: 1,
//     marginLeft: 16,
//   },
//   patientName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E293B',
//   },
//   appointmentType: {
//     fontSize: 14,
//     color: '#64748B',
//     marginTop: 2,
//   },
//   activityCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   activityText: {
//     fontSize: 14,
//     color: '#1E293B',
//     marginBottom: 4,
//   },
//   activityTime: {
//     fontSize: 12,
//     color: '#64748B',
//     marginBottom: 12,
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
// });

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LogOut, Stethoscope, Calendar, FileText, TrendingUp, Search, ChevronRight } from 'lucide-react-native';
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
  dangerLight: '#FEF2F2',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
};

interface DoctorData { name: string; email: string; specialization: string; }

const ACTION_CARDS = [
  {
    id: 'search',
    icon: Search,
    title: 'Find Patient',
    subtitle: 'Scan QR or enter ID',
    color: C.primary,
    bg: C.primaryLight,
    route: '/(tabs)/patient-search' as const,
  },
  {
    id: 'appointments',
    icon: Calendar,
    title: 'Appointments',
    subtitle: 'View schedule',
    color: C.success,
    bg: C.successLight,
    route: null,
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'Reports',
    subtitle: 'Generate & export',
    color: C.danger,
    bg: C.dangerLight,
    route: null,
  },
  {
    id: 'analytics',
    icon: TrendingUp,
    title: 'Analytics',
    subtitle: 'View patient insights',
    color: C.purple,
    bg: C.purpleLight,
    route: null,
  },
];

export default function DoctorDashboard() {
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getDoctorProfile();
      if (res.success && res.data) {
        const d = { name: res.data.name, email: res.data.email, specialization: res.data.specialization };
        setDoctorData(d);
        await AsyncStorage.setItem('userData', JSON.stringify(d));
      }
    } catch {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { try { await ApiService.logout(); } catch { Alert.alert('Error', 'Failed to sign out'); } },
      },
    ]);
  };

  const handleAction = (card: typeof ACTION_CARDS[0]) => {
    if (card.route) {
      router.push(card.route);
    } else {
      Alert.alert('Coming Soon', `${card.title} feature is coming soon!`);
    }
  };

  const initials = doctorData?.name
    ? doctorData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DR';

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loaderText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerInner}>
            {/* Avatar + name */}
            <View style={s.avatarRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={s.nameBlock}>
                <Text style={s.name}>{doctorData?.name || 'Doctor'}</Text>
                {doctorData?.specialization ? (
                  <View style={s.specBadge}>
                    <Stethoscope size={11} color={C.primary} strokeWidth={2} />
                    <Text style={s.specText}>{doctorData.specialization}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={18} color={C.danger} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.grid}>
            {ACTION_CARDS.map(card => {
              const Icon = card.icon;
              return (
                <TouchableOpacity
                  key={card.id}
                  style={s.actionCard}
                  onPress={() => handleAction(card)}
                  activeOpacity={0.85}
                >
                  <View style={[s.actionIcon, { backgroundColor: card.bg }]}>
                    <Icon size={26} color={card.color} strokeWidth={1.8} />
                  </View>
                  <Text style={s.actionTitle}>{card.title}</Text>
                  <Text style={s.actionSub}>{card.subtitle}</Text>
                  <View style={s.actionArrow}>
                    <ChevronRight size={14} color={C.textLight} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Tips card ── */}
        <View style={s.tipCard}>
          <View style={s.tipIconWrap}>
            <Stethoscope size={22} color={C.primary} strokeWidth={1.8} />
          </View>
          <View style={s.tipBody}>
            <Text style={s.tipTitle}>Access Patient Records</Text>
            <Text style={s.tipDesc}>Scan a patient's QR code or search by ID to instantly access their full medical history.</Text>
          </View>
          <TouchableOpacity style={s.tipBtn} onPress={() => router.push('/(tabs)/patient-search')} activeOpacity={0.85}>
            <Text style={s.tipBtnTxt}>Find Patient</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 14, fontSize: 15, color: C.textMid },

  // Header
  header: {
    backgroundColor: C.surface, borderRadius: 22, marginVertical: 18, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  nameBlock: { flex: 1 },
  greeting: { fontSize: 13, color: C.textLight, marginBottom: 2 },
  name: { fontSize: 20, fontWeight: '800', color: C.textDark, letterSpacing: -0.3 },
  specBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
    backgroundColor: C.primaryLight, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  specText: { fontSize: 12, fontWeight: '600', color: C.primary },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 14, letterSpacing: -0.2 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47.5%', backgroundColor: C.surface, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    position: 'relative',
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 3 },
  actionSub: { fontSize: 12, color: C.textLight, lineHeight: 16 },
  actionArrow: { position: 'absolute', top: 18, right: 18 },

  // Tip card
  tipCard: {
    backgroundColor: C.primaryLight, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#C7D9FF',
  },
  tipIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  tipBody: { marginBottom: 16 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 6 },
  tipDesc: { fontSize: 13, color: C.textMid, lineHeight: 19 },
  tipBtn: {
    backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  tipBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
