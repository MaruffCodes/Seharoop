import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'react-native';
import { ArrowLeft, Download, FileText, QrCode, Stethoscope, User, Calendar, Activity } from 'lucide-react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type Specialty = 'general' | 'cardiology' | 'orthopedic';

interface SpecialtyQRData {
  qrCode: string;
  summary: any;
  specialty: Specialty;
}

export default function FullScreenQR() {
  const { qrCodeUrl } = useLocalSearchParams();
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>('general');
  const [specialtyData, setSpecialtyData] = useState<Record<Specialty, SpecialtyQRData | null>>({
    general: null,
    cardiology: null,
    orthopedic: null
  });
  const [loading, setLoading] = useState<Record<Specialty, boolean>>({
    general: true,
    cardiology: false,
    orthopedic: false
  });
  const router = useRouter();
  const { userData } = useAuth();

  // Load general QR on mount
  useEffect(() => {
    loadSpecialtyQR('general');
  }, []);

  // Load QR when specialty changes
  useEffect(() => {
    if (!specialtyData[selectedSpecialty] && !loading[selectedSpecialty]) {
      loadSpecialtyQR(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  const loadSpecialtyQR = async (specialty: Specialty) => {
    try {
      setLoading(prev => ({ ...prev, [specialty]: true }));

      if (specialty === 'general' && qrCodeUrl && !specialtyData.general) {
        setSpecialtyData(prev => ({
          ...prev,
          general: {
            qrCode: qrCodeUrl as string,
            summary: null,
            specialty: 'general'
          }
        }));
        setLoading(prev => ({ ...prev, general: false }));
        return;
      }

      const response = await ApiService.generateSpecialtyQR(specialty);
      if (response.success) {
        setSpecialtyData(prev => ({
          ...prev,
          [specialty]: {
            qrCode: response.data.qrCode,
            summary: response.data.summary,
            specialty: response.data.specialty
          }
        }));
      }
    } catch (error) {
      console.error(`Error loading ${specialty} QR:`, error);
      Alert.alert('Error', `Failed to load ${specialty} QR code`);
    } finally {
      setLoading(prev => ({ ...prev, [specialty]: false }));
    }
  };

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Storage permission is required to save the QR code.');
        return;
      }

      const currentData = specialtyData[selectedSpecialty];
      if (!currentData?.qrCode) return;

      const downloadDir = new Directory(Paths.document, 'QRDownloads');
      await downloadDir.create({ intermediates: true });

      const fileName = `QR_${selectedSpecialty}_${userData?.patientId || 'code'}_${Date.now()}.png`;
      const file = new File(downloadDir, fileName);

      const base64Data = currentData.qrCode.split(',')[1] || currentData.qrCode;
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      await file.write(bytes);

      await MediaLibrary.saveToLibraryAsync(file.uri);

      Alert.alert('Success', `${selectedSpecialty} QR code saved to your photo library.`);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      Alert.alert('Error', 'Failed to save QR code: ' + (error as Error).message);
    }
  };

  const getSpecialtyColor = (specialty: Specialty) => {
    switch (specialty) {
      case 'cardiology': return '#DC2626';
      case 'orthopedic': return '#059669';
      default: return '#2563EB';
    }
  };

  const renderSpecialtyTab = (specialty: Specialty, label: string) => (
    <TouchableOpacity
      style={[
        styles.specialtyTab,
        selectedSpecialty === specialty && {
          backgroundColor: getSpecialtyColor(specialty),
          borderColor: getSpecialtyColor(specialty)
        }
      ]}
      onPress={() => setSelectedSpecialty(specialty)}
    >
      <Text style={[
        styles.specialtyTabText,
        selectedSpecialty === specialty && styles.specialtyTabTextActive
      ]}>
        {label}
      </Text>
      {loading[specialty] && (
        <ActivityIndicator size="small" color={selectedSpecialty === specialty ? "#FFFFFF" : getSpecialtyColor(specialty)} />
      )}
    </TouchableOpacity>
  );

  const currentData = specialtyData[selectedSpecialty];
  const currentColor = getSpecialtyColor(selectedSpecialty);
  const basicInfo = currentData?.summary || {};

  if (loading.general && selectedSpecialty === 'general' && !currentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.title}>Medical QR Code</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading QR code...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.title}>Medical QR Code</Text>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Download size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Specialty Tabs */}
      <View style={styles.tabContainer}>
        {renderSpecialtyTab('general', 'General')}
        {renderSpecialtyTab('cardiology', 'Cardiology')}
        {renderSpecialtyTab('orthopedic', 'Orthopedic')}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          {currentData?.qrCode ? (
            <Image source={{ uri: currentData.qrCode }} style={styles.qrImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderQR}>
              <ActivityIndicator size="small" color={currentColor} />
              <Text style={[styles.placeholderText, { color: currentColor }]}>
                Generating QR...
              </Text>
            </View>
          )}
        </View>

        {/* Basic Patient Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <User size={20} color="#2563EB" />
            <Text style={styles.infoCardTitle}>Patient Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{basicInfo.patientDemographics?.name || basicInfo.patientInfo?.name || userData?.name || 'Loading...'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient ID:</Text>
            <Text style={styles.infoValue}>{basicInfo.patientDemographics?.patientId || basicInfo.patientInfo?.patientId || userData?.patientId || 'Loading...'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blood Group:</Text>
            <Text style={[styles.infoValue, styles.bloodGroup]}>
              {basicInfo.medicalProfile?.bloodGroup || basicInfo.patientInfo?.bloodGroup || userData?.bloodGroup || 'Unknown'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Documents:</Text>
            <Text style={styles.infoValue}>{basicInfo.documentCount || 0}</Text>
          </View>

          {basicInfo.lastUpdated && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{basicInfo.lastUpdated}</Text>
            </View>
          )}
        </View>

        {/* View Full Summary Button */}
        <TouchableOpacity
          style={[styles.viewSummaryButton, { backgroundColor: currentColor }]}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/patient-summary',
              params: { patientId: userData?.patientId }
            });
          }}
        >
          <FileText size={20} color="#FFFFFF" />
          <Text style={styles.viewSummaryButtonText}>View Full Medical Summary</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          This QR code contains your basic medical information.
          Tap the button above to view your complete medical history.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  placeholder: {
    width: 40,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  specialtyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specialtyTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  specialtyTabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  placeholderQR: {
    width: 200,
    height: 200,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  bloodGroup: {
    color: '#2563EB',
    fontWeight: '700',
  },
  viewSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  viewSummaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});