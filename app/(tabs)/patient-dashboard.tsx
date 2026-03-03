import React, { useState, useEffect, JSX } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { 
  Upload, 
  FileText, 
  Camera, 
  LogOut, 
  QrCode, 
  Calendar,
  Activity
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../../services/api';

interface UserData {
  name: string;
  email: string;
  patientId: string;
  qrCode?: string;
}

interface Document {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  uploadDate: string;
}

interface MedicalRecord {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: string;
}

interface MonthRecord {
  records: Array<{
    documents: MedicalRecord[];
  }>;
}

interface YearRecord {
  months: MonthRecord[];
}

interface HistoryResponse {
  data: {
    medicalHistory?: YearRecord[];
  };
}

interface SummaryResponse {
  data: {
    totalRecords?: number;
  };
}

interface ApiFile {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

interface DocumentPickerResult {
  canceled: boolean;
  assets?: Array<{
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
  }>;
}

interface ImagePickerResult {
  canceled: boolean;
  assets?: Array<{
    uri: string;
    fileName?: string;
    fileSize?: number;
  }>;
}

interface Stats {
  appointments: number;
  reports: number;
}

export default function PatientDashboard(): JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats>({ appointments: 0, reports: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    loadPatientData();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
      
      // Also fetch fresh data from API
      const response = await ApiService.getPatientProfile() as { data: UserData };
      setUserData(response.data);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const loadPatientData = async (): Promise<void> => {
    try {
      const [summaryResponse, historyResponse] = await Promise.all([
        ApiService.getPatientSummary() as Promise<SummaryResponse>,
        ApiService.getPatientHistory() as Promise<HistoryResponse>
      ]);

      setStats({
        appointments: 0, // You can add appointments functionality later
        reports: summaryResponse.data.totalRecords || 0
      });

      // Load documents from medical history
      if (historyResponse.data.medicalHistory) {
        const allDocuments: Document[] = [];
        historyResponse.data.medicalHistory.forEach((year: YearRecord) => {
          year.months.forEach((month: MonthRecord) => {
            month.records.forEach((record) => {
              record.documents.forEach((doc: MedicalRecord) => {
                allDocuments.push({
                  id: doc._id || doc.filename,
                  name: doc.originalName,
                  uri: `http://localhost:5000/uploads/${doc.filename}`, // Adjust URL as needed
                  type: doc.mimetype,
                  size: doc.size,
                  uploadDate: new Date(doc.uploadDate).toLocaleDateString()
                });
              });
            });
          });
        });
        setDocuments(allDocuments);
      }
    } catch (error) {
      console.log('Error loading patient data:', error);
    }
  };

 const handleLogout = async (): Promise<void> => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async (): Promise<void> => {
          try {
            setLoading(true);
            
            // Call API logout endpoint if available
            try {
              await ApiService.logout();
            } catch (apiError) {
              console.log('API logout failed, continuing with local logout:', apiError);
            }
            
            // Clear all authentication-related data
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            
            // Clear in-memory token
            ApiService.token = null;
            
            // Navigate to login screen
            router.replace('/(tabs)/login');
            
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout properly');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // const handleLogout = async (): Promise<void> => {
  //   Alert.alert('Logout', 'Are you sure you want to logout?', [
  //     { text: 'Cancel', style: 'cancel' },
  //     {
  //       text: 'Logout',
  //       style: 'destructive',
  //       onPress: async (): Promise<void> => {
  //         await AsyncStorage.clear();
  //         router.replace('/(tabs)/login');
  //       },
  //     },
  //   ]);
  // };

  const handleFileUpload = async (file: ApiFile): Promise<void> => {
    try {
      setLoading(true);
      const uploadResponse = await ApiService.uploadFile(file, false);
      
      // Here you would typically associate the file with a medical record
      // For now, we'll just add it to the local documents list
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        uri: file.uri,
        type: file.type,
        size: file.size || 0,
        uploadDate: new Date().toLocaleDateString(),
      };

      setDocuments(prev => [newDocument, ...prev]);
      setStats(prev => ({ ...prev, reports: prev.reports + 1 }));
      
      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      }) as DocumentPickerResult;

      if (!result.canceled && result.assets && result.assets[0]) {
        const document = result.assets[0];
        await handleFileUpload({
          uri: document.uri,
          type: document.mimeType || 'application/octet-stream',
          name: document.name,
          size: document.size,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async (): Promise<void> => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Error', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      }) as ImagePickerResult;

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = result.assets[0];
        await handleFileUpload({
          uri: photo.uri,
          type: 'image/jpeg',
          name: `Photo_${new Date().toLocaleDateString().replace(/\//g, '-')}.jpg`,
          size: photo.fileSize,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const generateQRCode = (): void => {
    if (userData?.qrCode) {
      Alert.alert(
        'Your QR Code',
        `Patient ID: ${userData.patientId}\n\nShow this QR code to healthcare providers to access your medical records.`,
        [
          { text: 'OK' },
          {
            text: 'View Full QR',
            onPress: (): void => {
              // Navigate to full QR code view
              console.log('Show full QR code');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'QR Code',
        `Your Patient ID: ${userData?.patientId}\n\nQR code generation would happen here.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userData?.name || 'Patient'}</Text>
              <Text style={styles.patientId}>ID: {userData?.patientId}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.qrSection}>
          <TouchableOpacity style={styles.qrCard} onPress={generateQRCode}>
            {userData?.qrCode ? (
              <Image 
                source={{ uri: userData.qrCode } as ImageSourcePropType} 
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <QrCode size={40} color="#2563EB" />
            )}
            <Text style={styles.qrTitle}>Your QR Code</Text>
            <Text style={styles.qrSubtitle}>Tap to show QR code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Documents</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity 
              style={[styles.uploadButton, loading && styles.uploadButtonDisabled]} 
              onPress={pickDocument}
              disabled={loading}>
              <FileText size={24} color="#059669" />
              <Text style={styles.uploadButtonText}>Select Files</Text>
              <Text style={styles.uploadButtonSubtext}>PDF, Images</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.uploadButton, loading && styles.uploadButtonDisabled]} 
              onPress={takePhoto}
              disabled={loading}>
              <Camera size={24} color="#2563EB" />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
              <Text style={styles.uploadButtonSubtext}>Camera</Text>
            </TouchableOpacity>
          </View>
          {loading && (
            <View style={styles.uploadingIndicator}>
              <Text>Uploading...</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Documents</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{documents.length}</Text>
            </View>
          </View>
          
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Upload size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No documents uploaded yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Upload your medical documents to get started
              </Text>
            </View>
          ) : (
            <View style={styles.documentsList}>
              {documents.map((doc) => (
                <View key={doc.id} style={styles.documentCard}>
                  <View style={styles.documentIcon}>
                    {doc.type.startsWith('image/') ? (
                      <Image source={{ uri: doc.uri } as ImageSourcePropType} style={styles.documentThumbnail} />
                    ) : (
                      <FileText size={24} color="#DC2626" />
                    )}
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                    <Text style={styles.documentMeta}>
                      {doc.uploadDate} • {(doc.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Calendar size={24} color="#2563EB" />
            <Text style={styles.statNumber}>{stats.appointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Activity size={24} color="#059669" />
            <Text style={styles.statNumber}>{stats.reports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
        </View>
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
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  qrSection: {
    marginBottom: 20,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: 60,
    height: 60,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  badge: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
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
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  uploadingIndicator: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  documentsList: {
    gap: 12,
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentIcon: {
    marginRight: 16,
  },
  documentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  documentMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
});