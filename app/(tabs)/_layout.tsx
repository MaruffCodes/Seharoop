import { Tabs } from 'expo-router';
import { Stethoscope, User, UserPlus, LogIn, Search, FileUser, QrCode, FileText } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const { isLoggedIn, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const commonTabOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#2563EB',
    tabBarInactiveTintColor: '#6B7280',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingBottom: 5,
      height: 60,
    },
  };

  const isPatient = isLoggedIn && userRole === 'patient';
  const isDoctor = isLoggedIn && userRole === 'doctor';

  return (
    <Tabs screenOptions={commonTabOptions}>
      <Tabs.Screen
        name="login"
        options={{
          title: 'Login',
          tabBarIcon: ({ size, color }) => <LogIn size={size} color={color} />,
          href: !isLoggedIn ? '/(tabs)/login' : null,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: 'Register',
          tabBarIcon: ({ size, color }) => <UserPlus size={size} color={color} />,
          href: !isLoggedIn ? '/(tabs)/register' : null,
        }}
      />
      <Tabs.Screen
        name="patient-dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          href: isPatient ? '/(tabs)/patient-dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="patient-medicalForm"
        options={{
          title: 'Medical Form',
          tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
          href: isPatient ? '/(tabs)/patient-medicalForm' : null,
        }}
      />
      <Tabs.Screen
        name="FullScreenQR"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ size, color }) => <QrCode size={size} color={color} />,
          href: isPatient ? '/(tabs)/FullScreenQR' : null,
        }}
      />
      <Tabs.Screen
        name="patient-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <FileUser size={size} color={color} />,
          href: isPatient ? '/(tabs)/patient-profile' : null,
        }}
      />
      <Tabs.Screen
        name="doctor-dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => <Stethoscope size={size} color={color} />,
          href: isDoctor ? '/(tabs)/doctor-dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="patient-search"
        options={{
          title: 'Find Patient',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
          href: isDoctor ? '/(tabs)/patient-search' : null,
        }}
      />
    </Tabs>
  );
}
