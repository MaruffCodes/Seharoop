// import { Tabs } from 'expo-router';
// import {
//   Stethoscope,
//   User,
//   LayoutDashboard,
//   FileText,
//   QrCode,
//   Search,
//   Scan,
//   History,
//   Settings
// } from 'lucide-react-native';
// import { useAuth } from '../../contexts/AuthContext';
// import { View, ActivityIndicator, Text } from 'react-native';

// export default function TabLayout() {
//   const { isLoggedIn, userRole, isLoading, isFirstLogin } = useAuth();

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
//         <ActivityIndicator size="large" color="#2563EB" />
//         <Text style={{ marginTop: 12, color: '#64748B', fontSize: 16 }}>Loading...</Text>
//       </View>
//     );
//   }

//   // If not logged in, don't show any tabs
//   if (!isLoggedIn) {
//     return null;
//   }

//   const commonTabOptions = {
//     headerShown: false,
//     tabBarActiveTintColor: '#2563EB',
//     tabBarInactiveTintColor: '#6B7280',
//     tabBarStyle: {
//       backgroundColor: '#FFFFFF',
//       borderTopWidth: 1,
//       borderTopColor: '#E5E7EB',
//       paddingBottom: 8,
//       paddingTop: 4,
//       height: 60,
//     },
//     tabBarLabelStyle: {
//       fontSize: 12,
//       fontWeight: '500' as const,
//     },
//   };

//   const isPatient = userRole === 'patient';
//   const isDoctor = userRole === 'doctor';

//   // If first login for patient, show only medical form
//   if (isPatient && isFirstLogin) {
//     return (
//       <Tabs screenOptions={commonTabOptions}>
//         <Tabs.Screen
//           name="patient-medicalForm"
//           options={{
//             title: 'Medical Form',
//             tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
//           }}
//         />
//         <Tabs.Screen name="patient-dashboard" options={{ href: null }} />
//         <Tabs.Screen name="FullScreenQR" options={{ href: null }} />
//         <Tabs.Screen name="patient-profile" options={{ href: null }} />
//         <Tabs.Screen name="doctor-dashboard" options={{ href: null }} />
//         <Tabs.Screen name="patient-search" options={{ href: null }} />
//         <Tabs.Screen name="patient-summary" options={{ href: null }} />
//         <Tabs.Screen name="Scanner" options={{ href: null }} />
//       </Tabs>
//     );
//   }

//   // If logged in as patient (not first login)
//   if (isPatient) {
//     return (
//       <Tabs screenOptions={commonTabOptions}>
//         <Tabs.Screen
//           name="patient-dashboard"
//           options={{
//             title: 'Dashboard',
//             tabBarIcon: ({ size, color }) => <LayoutDashboard size={size} color={color} />,
//           }}
//         />
//         <Tabs.Screen
//           name="FullScreenQR"
//           options={{
//             title: 'QR Code',
//             tabBarIcon: ({ size, color }) => <QrCode size={size} color={color} />,
//           }}
//         />
//         <Tabs.Screen
//           name="patient-profile"
//           options={{
//             title: 'Profile',
//             tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
//           }}
//         />
//         <Tabs.Screen name="patient-medicalForm" options={{ href: null }} />
//         <Tabs.Screen name="doctor-dashboard" options={{ href: null }} />
//         <Tabs.Screen name="patient-search" options={{ href: null }} />
//         <Tabs.Screen name="Scanner" options={{ href: null }} />
//         <Tabs.Screen name="patient-summary" options={{ href: null }} />
//       </Tabs>
//     );
//   }

//   // If logged in as doctor
//   if (isDoctor) {
//     return (
//       <Tabs screenOptions={commonTabOptions}>
//         <Tabs.Screen
//           name="doctor-dashboard"
//           options={{
//             title: 'Dashboard',
//             tabBarIcon: ({ size, color }) => <Stethoscope size={size} color={color} />,
//           }}
//         />
//         <Tabs.Screen
//           name="patient-search"
//           options={{
//             title: 'Search',
//             tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
//           }}
//         />
//         <Tabs.Screen name="patient-dashboard" options={{ href: null }} />
//         <Tabs.Screen name="patient-medicalForm" options={{ href: null }} />
//         <Tabs.Screen name="FullScreenQR" options={{ href: null }} />
//         <Tabs.Screen name="patient-profile" options={{ href: null }} />
//         <Tabs.Screen name="patient-summary" options={{ href: null }} />
//         <Tabs.Screen name="Scanner" options={{ href: null }} />
//       </Tabs>
//     );
//   }

//   return null;
// }

import { Tabs } from 'expo-router';
import {
  Stethoscope, User, LayoutDashboard, FileText,
  QrCode, Search, Clock,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function TabLayout() {
  const { isLoggedIn, userRole, isLoading, isFirstLogin } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) return null;

  const commonTabOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#2563EB',
    tabBarInactiveTintColor: '#6B7280',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingBottom: 8,
      paddingTop: 4,
      height: 60,
    },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '500' as const },
  };

  const isPatient = userRole === 'patient';
  const isDoctor = userRole === 'doctor';

  // ── First login: patient must fill medical form first ─────────────────────
  if (isPatient && isFirstLogin) {
    return (
      <Tabs screenOptions={commonTabOptions}>
        <Tabs.Screen
          name="patient-medicalForm"
          options={{ title: 'Medical Form', tabBarIcon: ({ size, color }) => <FileText size={size} color={color} /> }}
        />
        <Tabs.Screen name="patient-dashboard" options={{ href: null }} />
        <Tabs.Screen name="patient-timeline" options={{ href: null }} />
        <Tabs.Screen name="FullScreenQR" options={{ href: null }} />
        <Tabs.Screen name="patient-profile" options={{ href: null }} />
        <Tabs.Screen name="doctor-dashboard" options={{ href: null }} />
        <Tabs.Screen name="patient-search" options={{ href: null }} />
        <Tabs.Screen name="patient-summary" options={{ href: null }} />
        <Tabs.Screen name="Scanner" options={{ href: null }} />
      </Tabs>
    );
  }

  // ── Logged-in patient ─────────────────────────────────────────────────────
  if (isPatient) {
    return (
      <Tabs screenOptions={commonTabOptions}>
        <Tabs.Screen
          name="patient-dashboard"
          options={{ title: 'Home', tabBarIcon: ({ size, color }) => <LayoutDashboard size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="patient-timeline"
          options={{ title: 'Timeline', tabBarIcon: ({ size, color }) => <Clock size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="FullScreenQR"
          options={{ title: 'QR Code', tabBarIcon: ({ size, color }) => <QrCode size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="patient-profile"
          options={{ title: 'Profile', tabBarIcon: ({ size, color }) => <User size={size} color={color} /> }}
        />
        {/* Hidden screens */}
        <Tabs.Screen name="patient-medicalForm" options={{ href: null }} />
        <Tabs.Screen name="doctor-dashboard" options={{ href: null }} />
        <Tabs.Screen name="patient-search" options={{ href: null }} />
        <Tabs.Screen name="Scanner" options={{ href: null }} />
        <Tabs.Screen name="patient-summary" options={{ href: null }} />
        <Tabs.Screen name="doctor-edit-profile" options={{ href: null }} />
      </Tabs>
    );
  }

  // ── Logged-in doctor ──────────────────────────────────────────────────────
  if (isDoctor) {
    return (
      <Tabs screenOptions={commonTabOptions}>
        <Tabs.Screen
          name="doctor-dashboard"
          options={{ title: 'Dashboard', tabBarIcon: ({ size, color }) => <Stethoscope size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="patient-search"
          options={{ title: 'Search', tabBarIcon: ({ size, color }) => <Search size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="doctor-edit-profile"
          options={{ title: 'Profile', tabBarIcon: ({ size, color }) => <User size={size} color={color} /> }}
        />
        {/* Hidden screens */}
        <Tabs.Screen name="patient-dashboard" options={{ href: null }} />
        <Tabs.Screen name="patient-timeline" options={{ href: null }} />
        <Tabs.Screen name="patient-medicalForm" options={{ href: null }} />
        <Tabs.Screen name="FullScreenQR" options={{ href: null }} />
        <Tabs.Screen name="patient-profile" options={{ href: null }} />
        <Tabs.Screen name="patient-summary" options={{ href: null }} />
        <Tabs.Screen name="Scanner" options={{ href: null }} />
      </Tabs>
    );
  }

  return null;
}