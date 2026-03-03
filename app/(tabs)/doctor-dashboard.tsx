import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { 
  LogOut, 
  Users, 
  Calendar, 
  FileText, 
  Activity,
  Stethoscope,
  TrendingUp,
  Clock
} from 'lucide-react-native';
import ApiService from '../../services/api';

interface DoctorData {
  name: string;
  email: string;
  specialization: string;
}

interface DashboardStats {
  patientsToday: number;
  appointments: number;
  reports: number;
  satisfaction: number;
}

interface ScheduleItem {
  time: string;
  patientName: string;
  appointmentType: string;
}

interface ActivityItem {
  text: string;
  time: string;
}

export default function DoctorDashboard() {
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    patientsToday: 0,
    appointments: 0,
    reports: 0,
    satisfaction: 0,
  });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load doctor profile
      const profileResponse = await ApiService.getDoctorProfile();
      if (profileResponse.success && profileResponse.data) {
        setDoctorData({
          name: profileResponse.data.name,
          email: profileResponse.data.email,
          specialization: profileResponse.data.specialization,
        });
        
        // Store user data in AsyncStorage for consistency
        await AsyncStorage.setItem('userData', JSON.stringify({
          name: profileResponse.data.name,
          email: profileResponse.data.email,
          specialization: profileResponse.data.specialization,
        }));
      }

      // Load dashboard statistics (mock data - you might want to create an API endpoint for this)
      await loadDashboardStats();
      
      // Load today's schedule (mock data - you might want to create an API endpoint for this)
      await loadTodaysSchedule();
      
      // Load recent activity (mock data - you might want to create an API endpoint for this)
      await loadRecentActivity();

    } catch (error) {
      console.log('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    // This would typically come from a dedicated dashboard stats API endpoint
    // For now, using mock data
    setStats({
      patientsToday: 24,
      appointments: 12,
      reports: 8,
      satisfaction: 95,
    });
  };

  const loadTodaysSchedule = async () => {
    // This would typically come from an appointments API endpoint
    // For now, using mock data
    setSchedule([
      {
        time: '09:00 AM',
        patientName: 'Sarah Johnson',
        appointmentType: 'Regular Checkup'
      },
      {
        time: '10:30 AM',
        patientName: 'Michael Davis',
        appointmentType: 'Follow-up'
      },
      {
        time: '02:00 PM',
        patientName: 'Emily Wilson',
        appointmentType: 'Consultation'
      }
    ]);
  };

  const loadRecentActivity = async () => {
    // This would typically come from an activity log API endpoint
    // For now, using mock data
    setRecentActivity([
      {
        text: 'Updated patient record for John Smith',
        time: '2 hours ago'
      },
      {
        text: 'Completed consultation with Mary Brown',
        time: '4 hours ago'
      },
      {
        text: 'Uploaded lab report for David Lee',
        time: '6 hours ago'
      }
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/(tabs)/login');
        },
      },
    ]);
  };

  const handleFindPatient = () => {
    router.push('/(tabs)/patient-search');
  };

  const handleAppointments = () => {
    // Navigate to appointments screen
    Alert.alert('Info', 'Appointments feature coming soon!');
  };

  const handleReports = () => {
    // Navigate to reports screen
    Alert.alert('Info', 'Reports feature coming soon!');
  };

  const handleAnalytics = () => {
    // Navigate to analytics screen
    Alert.alert('Info', 'Analytics feature coming soon!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.doctorName}>{doctorData?.name || 'Doctor'}</Text>
              <Text style={styles.specialization}>{doctorData?.specialization}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Users size={24} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{stats.patientsToday}</Text>
            <Text style={styles.statLabel}>Patients Today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Calendar size={24} color="#059669" />
            </View>
            <Text style={styles.statNumber}>{stats.appointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <FileText size={24} color="#DC2626" />
            </View>
            <Text style={styles.statNumber}>{stats.reports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Activity size={24} color="#7C3AED" />
            </View>
            <Text style={styles.statNumber}>{stats.satisfaction}%</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </View>
        </View> */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleFindPatient}>
              <Stethoscope size={32} color="#2563EB" />
              <Text style={styles.actionTitle}>Find Patient</Text>
              <Text style={styles.actionSubtitle}>Scan QR or enter ID</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleAppointments}>
              <Calendar size={32} color="#059669" />
              <Text style={styles.actionTitle}>Appointments</Text>
              <Text style={styles.actionSubtitle}>View schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleReports}>
              <FileText size={32} color="#DC2626" />
              <Text style={styles.actionTitle}>Reports</Text>
              <Text style={styles.actionSubtitle}>Generate reports</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleAnalytics}>
              <TrendingUp size={32} color="#7C3AED" />
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionSubtitle}>View insights</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
          <View style={styles.scheduleCard}>
            {schedule.map((item, index) => (
              <View key={index} style={styles.scheduleItem}>
                <View style={styles.timeContainer}>
                  <Clock size={16} color="#2563EB" />
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.appointmentType}>{item.appointmentType}</Text>
                </View>
              </View>
            ))}
          </View>
        </View> */}

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.map((activity, index) => (
              <View key={index}>
                <Text style={styles.activityText}>• {activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748B',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
  logoutButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 8,
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  appointmentType: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityText: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
});