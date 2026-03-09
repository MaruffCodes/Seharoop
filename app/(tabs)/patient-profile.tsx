import React, { useState, useEffect, JSX } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ImageSourcePropType,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Hash,
  QrCode,
  CreditCard as Edit3,
  Shield,
  Activity,
  Heart,
  Zap,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  Pill,
  Scissors,
  AlertTriangle,
  PhoneCall,
  X,
  FileText
} from 'lucide-react-native';
import ApiService from '../../services/api';
import PatientMedicalForm from './patient-medicalForm';

interface UserData {
  name: string;
  email: string;
  patientId: string;
  bloodGroup?: string;
  isDiabetic?: boolean;
  diabetesType?: string;
  hasThyroid?: boolean;
  thyroidCondition?: string;
  qrCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  hasMedicalForm?: boolean;
}

interface ApiResponse {
  data: UserData;
}

export default function PatientProfile(): JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [medicalFormModalVisible, setMedicalFormModalVisible] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await ApiService.getPatientProfile() as ApiResponse;
      setUserData(response.data);

      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    } catch (error) {
      console.log('Error loading user data:', error);
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } finally {
      setLoading(false);
    }
  };

  const showQRCode = (): void => {
    if (!userData?.qrCode) {
      Alert.alert('QR Code', `Patient ID: ${userData?.patientId}`);
      return;
    }

    Alert.alert(
      'Patient QR Code',
      `Scan this QR code to access medical records for ${userData?.name}`,
      [
        { text: 'OK' },
        {
          text: 'View Full QR',
          onPress: (): void => {
            router.push({
              pathname: '/(tabs)/FullScreenQR',
              params: { qrCodeUrl: userData.qrCode }
            });
          }
        }
      ]
    );
  };

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return 'Not provided';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return `${age} years`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>

        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.patientName}>{userData?.name || 'Patient Name'}</Text>
            <Text style={styles.patientId}>ID: {userData?.patientId}</Text>
          </View>
        </View>

        {/* MEDICAL FORM SECTION - DEDICATED AND EDITABLE */}
        <View style={styles.medicalFormSection}>
          <View style={styles.medicalFormHeader}>
            <View style={styles.medicalFormTitleContainer}>
              <FileText size={24} color="#2563EB" />
              <Text style={styles.medicalFormTitle}>Medical Form</Text>
            </View>
            <TouchableOpacity
              style={styles.editMedicalFormButton}
              onPress={() => setMedicalFormModalVisible(true)}
            >
              <Edit3 size={20} color="#FFFFFF" />
              <Text style={styles.editMedicalFormButtonText}>
                {userData?.hasMedicalForm ? 'Edit Form' : 'Complete Form'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.medicalFormPreview}>
            <Text style={styles.medicalFormPreviewText}>
              {userData?.hasMedicalForm
                ? 'Your medical information has been recorded. Tap "Edit Form" to update your details.'
                : 'You haven\'t completed your medical form yet. Tap "Complete Form" to add your medical information.'}
            </Text>
            <View style={styles.medicalFormStats}>
              <View style={styles.statItem}>
                <Heart size={16} color="#DC2626" />
                <Text style={styles.statText}>
                  Blood: {userData?.bloodGroup || 'Not set'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Activity size={16} color="#059669" />
                <Text style={styles.statText}>
                  Diabetic: {userData?.isDiabetic ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Zap size={16} color="#2563EB" />
                <Text style={styles.statText}>
                  Thyroid: {userData?.hasThyroid ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={20} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{userData?.name || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData?.email || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Phone size={20} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{userData?.phone || 'Not provided'}</Text>
              </View>
            </View>

            {userData?.dateOfBirth && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Calendar size={20} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>{calculateAge(userData.dateOfBirth)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Quick Medical Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Medical Info</Text>
          <View style={styles.medicalGrid}>
            <View style={styles.medicalCard}>
              <Heart size={24} color="#DC2626" />
              <Text style={styles.medicalLabel}>Blood Group</Text>
              <Text style={styles.medicalValue}>{userData?.bloodGroup || 'Not set'}</Text>
            </View>

            <View style={styles.medicalCard}>
              <Activity size={24} color="#059669" />
              <Text style={styles.medicalLabel}>Diabetes</Text>
              <Text style={styles.medicalValue}>
                {userData?.isDiabetic ? (userData.diabetesType || 'Yes') : 'No'}
              </Text>
            </View>

            <View style={styles.medicalCard}>
              <Zap size={24} color="#2563EB" />
              <Text style={styles.medicalLabel}>Thyroid</Text>
              <Text style={styles.medicalValue}>
                {userData?.hasThyroid ? (userData.thyroidCondition || 'Yes') : 'No'}
              </Text>
            </View>
          </View>
        </View>

        {/* QR Code Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code Access</Text>

          <TouchableOpacity style={styles.qrButton} onPress={showQRCode}>
            {userData?.qrCode ? (
              <Image
                source={{ uri: userData.qrCode } as ImageSourcePropType}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <QrCode size={32} color="#2563EB" />
            )}
            <View style={styles.qrButtonContent}>
              <Text style={styles.qrButtonTitle}>
                {userData?.qrCode ? 'Show My QR Code' : 'Generate QR Code'}
              </Text>
              <Text style={styles.qrButtonSubtitle}>
                Let doctors scan to access your medical records
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>

          <View style={styles.securityCard}>
            <Shield size={24} color="#059669" />
            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>Your data is secure</Text>
              <Text style={styles.securityDescription}>
                Your medical records are encrypted and only accessible to authorized healthcare providers.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Medical Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={medicalFormModalVisible}
        onRequestClose={() => setMedicalFormModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medical Form</Text>
              <TouchableOpacity onPress={() => setMedicalFormModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <PatientMedicalForm />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setMedicalFormModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  patientId: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
  // Medical Form Section Styles
  medicalFormSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  medicalFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicalFormTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicalFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },
  editMedicalFormButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editMedicalFormButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  medicalFormPreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  medicalFormPreviewText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  medicalFormStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  medicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  medicalCard: {
    flex: 1,
    minWidth: '30%',
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
  medicalLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  medicalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
    textAlign: 'center',
  },
  qrButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: 48,
    height: 48,
  },
  qrButtonContent: {
    marginLeft: 16,
    flex: 1,
  },
  qrButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  qrButtonSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  securityContent: {
    marginLeft: 16,
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  securityDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
    maxHeight: '70%',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  modalCloseButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
});