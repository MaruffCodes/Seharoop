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
  Modal,
  ActivityIndicator,
  RefreshControl,
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
  Activity,
  Clock,
  ChevronRight,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface UserData {
  name: string;
  email: string;
  patientId: string;
  qrCode?: string;
  bloodGroup?: string;
  hasMedicalForm?: boolean;
}

interface Document {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  uploadDate: string;
  status: 'processing' | 'processed' | 'failed';
  extractedData?: ExtractedData;
}

interface ExtractedData {
  diagnoses?: string[];
  medications?: string[];
  labResults?: string[];
  allergies?: string[];
  date?: string;
  doctor?: string;
  hospital?: string;
}

interface MedicalRecord {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: string;
  extractedData?: ExtractedData;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

interface TimelineEvent {
  id: string;
  type: 'upload' | 'diagnosis' | 'medication' | 'lab' | 'allergy' | 'form_update';
  title: string;
  description: string;
  date: string;
  documentId?: string;
  documentName?: string;
  documentUri?: string;
  data?: any;
}

interface MonthRecord {
  records: Array<{
    documents: MedicalRecord[];
    date: string;
    description: string;
    type: string;
  }>;
}

interface YearRecord {
  year: string;
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
    patientInfo?: any;
    criticalInfo?: any;
    currentMedications?: any[];
    pastSurgeries?: any[];
    recentRecords?: any[];
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
  documents: number;
  diagnoses: number;
}

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'image/jpeg',
  'image/png',
  'image/jpg'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

export default function PatientDashboard(): JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<Stats>({ appointments: 0, reports: 0, documents: 0, diagnoses: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);

  const router = useRouter();
  const { completeFirstLogin, userData: authUserData } = useAuth();

  useEffect(() => {
    loadUserData();
    loadPatientData();
    loadTimeline();
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

      // Load documents from medical history
      if (historyResponse.data.medicalHistory) {
        const allDocuments: Document[] = [];
        let diagnosesCount = 0;

        historyResponse.data.medicalHistory.forEach((year: YearRecord) => {
          year.months?.forEach((month: MonthRecord) => {
            month.records?.forEach((record) => {
              if (record.documents) {
                record.documents.forEach((doc: MedicalRecord) => {
                  if (doc.extractedData?.diagnoses) {
                    diagnosesCount += doc.extractedData.diagnoses.length;
                  }

                  allDocuments.push({
                    id: doc._id || doc.filename,
                    name: doc.originalName,
                    uri: `http://192.168.1.4:5001/uploads/${doc.filename}`,
                    type: doc.mimetype,
                    size: doc.size,
                    uploadDate: new Date(doc.uploadDate).toLocaleDateString(),
                    status: doc.processingStatus === 'completed' ? 'processed' :
                      doc.processingStatus === 'failed' ? 'failed' : 'processing',
                    extractedData: doc.extractedData
                  });
                });
              }
            });
          });
        });

        setDocuments(allDocuments);
        setStats({
          appointments: 0,
          reports: allDocuments.length,
          documents: allDocuments.length,
          diagnoses: diagnosesCount
        });
      }
    } catch (error) {
      console.log('Error loading patient data:', error);
    }
  };

  const loadTimeline = async (): Promise<void> => {
    try {
      const historyResponse = await ApiService.getPatientHistory() as Promise<HistoryResponse>;
      const timelineEvents: TimelineEvent[] = [];

      if (historyResponse.data.medicalHistory) {
        historyResponse.data.medicalHistory.forEach((year: YearRecord) => {
          year.months?.forEach((month: MonthRecord) => {
            month.records?.forEach((record) => {
              // Add record as timeline event
              timelineEvents.push({
                id: `${record.date}-${record.description}`,
                type: record.type as any || 'upload',
                title: record.description,
                description: `${month.month} ${year.year}`,
                date: new Date(record.date).toISOString(),
                documentId: record.documents[0]?._id,
                documentName: record.documents[0]?.originalName,
                documentUri: record.documents[0]?.filename ?
                  `http://192.168.1.4:5001/uploads/${record.documents[0].filename}` : undefined,
                data: record
              });

              // Add extracted data as separate events
              if (record.documents[0]?.extractedData) {
                const extracted = record.documents[0].extractedData;

                extracted.diagnoses?.forEach(diagnosis => {
                  timelineEvents.push({
                    id: `${record.date}-diagnosis-${diagnosis}`,
                    type: 'diagnosis',
                    title: 'Diagnosis Added',
                    description: diagnosis,
                    date: new Date(record.date).toISOString(),
                    documentId: record.documents[0]._id,
                    documentName: record.documents[0].originalName
                  });
                });

                extracted.medications?.forEach(med => {
                  timelineEvents.push({
                    id: `${record.date}-med-${med}`,
                    type: 'medication',
                    title: 'Medication Prescribed',
                    description: med,
                    date: new Date(record.date).toISOString(),
                    documentId: record.documents[0]._id,
                    documentName: record.documents[0].originalName
                  });
                });

                extracted.labResults?.forEach(lab => {
                  timelineEvents.push({
                    id: `${record.date}-lab-${lab}`,
                    type: 'lab',
                    title: 'Lab Result Added',
                    description: lab,
                    date: new Date(record.date).toISOString(),
                    documentId: record.documents[0]._id,
                    documentName: record.documents[0].originalName
                  });
                });
              }
            });
          });
        });
      }

      // Sort by date (newest first)
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimeline(timelineEvents);
    } catch (error) {
      console.log('Error loading timeline:', error);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([
      loadPatientData(),
      loadTimeline()
    ]);
    setRefreshing(false);
  };

  const validateFile = (file: { name: string; mimeType?: string }): boolean => {
    // Check by mime type
    if (file.mimeType && ALLOWED_FILE_TYPES.includes(file.mimeType)) {
      return true;
    }

    // Check by extension
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(extension)) {
      return true;
    }

    return false;
  };

  const handleFileUpload = async (file: ApiFile): Promise<void> => {
    try {
      setLoading(true);

      // Validate file type
      const fileInfo = {
        name: file.name,
        mimeType: file.type
      };

      if (!validateFile(fileInfo)) {
        Alert.alert(
          'Invalid File Type',
          'Please upload only PDF, TXT, DOCX files.\nSupported formats: .pdf, .txt, .doc, .docx'
        );
        return;
      }

      // Add to local documents with processing status
      const tempDoc: Document = {
        id: `temp-${Date.now()}`,
        name: file.name,
        uri: file.uri,
        type: file.type,
        size: file.size || 0,
        uploadDate: new Date().toLocaleDateString(),
        status: 'processing'
      };

      setDocuments(prev => [tempDoc, ...prev]);

      // Upload file to server
      const uploadResponse = await ApiService.uploadFile(file, false);

      if (uploadResponse.success) {
        // Update the temp document with the server response
        setDocuments(prev => prev.map(doc =>
          doc.id === tempDoc.id
            ? {
              ...doc,
              id: uploadResponse.data?.fileId || doc.id,
              status: 'processing',
              uri: `http://192.168.1.4:5001/uploads/${uploadResponse.data?.fileId}.${file.name.split('.').pop()}`
            }
            : doc
        ));

        Alert.alert(
          'Processing Started',
          'Your document is being processed. This may take a few moments.',
          [{ text: 'OK' }]
        );

        // Refresh data
        await loadPatientData();
        await loadTimeline();

        // Refresh QR code with new data
        await refreshQRCode();
      } else {
        // Remove temp document on failure
        setDocuments(prev => prev.filter(d => d.id !== tempDoc.id));
        Alert.alert('Error', uploadResponse.message || 'Failed to upload document');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (docId: string, fileId?: string): Promise<void> => {
    try {
      setProcessingQueue(true);

      // Simulate processing completion
      setTimeout(async () => {
        setDocuments(prev => prev.map(doc =>
          doc.id === docId
            ? {
              ...doc,
              status: 'processed',
              extractedData: {
                diagnoses: ['Hypertension', 'Type 2 Diabetes'],
                medications: ['Metformin 500mg', 'Lisinopril 10mg'],
                labResults: ['Blood Glucose: 126 mg/dL', 'HbA1c: 7.2%'],
                date: new Date().toLocaleDateString()
              }
            }
            : doc
        ));

        // Refresh QR code after processing
        await refreshQRCode();
        await loadTimeline();

        Alert.alert(
          'Processing Complete',
          'Document has been processed and information has been added to your medical summary.',
          [{ text: 'OK' }]
        );

        setProcessingQueue(false);
      }, 5000);

    } catch (error) {
      setDocuments(prev => prev.map(doc =>
        doc.id === docId ? { ...doc, status: 'failed' } : doc
      ));
      setProcessingQueue(false);
    }
  };

  const refreshQRCode = async (): Promise<void> => {
    try {
      const response = await ApiService.refreshQRCode();
      if (response.success && userData) {
        setUserData({ ...userData, qrCode: response.data.qrCode });
        await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, qrCode: response.data.qrCode }));
      }
    } catch (error) {
      console.log('Error refreshing QR code:', error);
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
            await ApiService.logout();
            await AsyncStorage.multiRemove(['seharoop_token', 'seharoop_user_data', 'userData']);
            ApiService.token = null;
            router.replace('/login');
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

  const pickDocument = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_FILE_TYPES,
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
          name: `Medical_Record_${new Date().toLocaleDateString().replace(/\//g, '-')}.jpg`,
          size: photo.fileSize,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const viewDocument = async (document: Document): Promise<void> => {
    try {
      // For images, show in modal
      if (document.type.startsWith('image/')) {
        setSelectedDocument(document);
        setModalVisible(true);
        return;
      }

      // For PDFs and other documents, open in web browser
      let fileUri = document.uri;

      // If it's a local temp file, use it directly
      if (fileUri.startsWith('file://')) {
        await WebBrowser.openBrowserAsync(fileUri);
        return;
      }

      // Try to construct server URL
      const fileExtension = document.name.split('.').pop();
      const serverUrl = `http://192.168.1.4:5001/uploads/${document.id}.${fileExtension}`;

      // Check if we can access the file
      try {
        const response = await fetch(serverUrl, { method: 'HEAD' });
        if (response.ok) {
          await WebBrowser.openBrowserAsync(serverUrl);
        } else {
          // Fallback to the original URI
          await WebBrowser.openBrowserAsync(fileUri);
        }
      } catch {
        // Fallback to the original URI
        await WebBrowser.openBrowserAsync(fileUri);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      Alert.alert('Error', 'Could not open the document');
    }
  };

  const shareDocument = async (document: Document): Promise<void> => {
    try {
      const fileUri = document.uri;
      await shareAsync(fileUri);
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Error', 'Could not share the document');
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'diagnosis': return <Activity size={16} color="#EF4444" />;
      case 'medication': return <FileText size={16} color="#10B981" />;
      case 'lab': return <Activity size={16} color="#2563EB" />;
      case 'allergy': return <X size={16} color="#F59E0B" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userData?.name || 'Patient'}</Text>
              <Text style={styles.patientId}>ID: {userData?.patientId}</Text>
              {userData?.bloodGroup && (
                <Text style={styles.bloodGroup}>Blood Group: {userData.bloodGroup}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.qrSection}>
          <TouchableOpacity
            style={styles.qrCard}
            onPress={() => {
              if (userData?.qrCode) {
                router.push({
                  pathname: '/(tabs)/FullScreenQR',
                  params: { qrCodeUrl: userData.qrCode }
                });
              } else {
                Alert.alert('Info', 'QR code is being generated...');
              }
            }}
          >
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
            <Text style={styles.qrSubtitle}>Tap to view full QR code</Text>
            {processingQueue && (
              <View style={styles.processingBadge}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.processingText}>Updating QR...</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Medical Documents</Text>
          <Text style={styles.sectionSubtitle}>Supported formats: PDF, TXT, DOCX, Images</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
              onPress={pickDocument}
              disabled={loading}>
              <FileText size={24} color="#059669" />
              <Text style={styles.uploadButtonText}>Select Files</Text>
              <Text style={styles.uploadButtonSubtext}>PDF, TXT, DOCX</Text>
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
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.uploadingText}>Uploading document...</Text>
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
                <TouchableOpacity
                  key={doc.id}
                  style={styles.documentCard}
                  onPress={() => viewDocument(doc)}
                  activeOpacity={0.7}
                >
                  <View style={styles.documentIcon}>
                    {doc.type.startsWith('image/') ? (
                      <Image source={{ uri: doc.uri }} style={styles.documentThumbnail} />
                    ) : (
                      <FileText size={24} color="#DC2626" />
                    )}
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                    <Text style={styles.documentMeta}>
                      {doc.uploadDate} • {(doc.size / 1024).toFixed(1)} KB
                      {doc.status === 'processing' && ' • ⏳ Processing'}
                      {doc.status === 'failed' && ' • ❌ Failed'}
                    </Text>
                    {doc.status === 'processed' && doc.extractedData && (
                      <Text style={styles.documentPreviewText} numberOfLines={1}>
                        ✓ {doc.extractedData.diagnoses?.length || 0} diagnoses, {doc.extractedData.medications?.length || 0} medications
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Timeline</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/patient-timeline')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {timeline.slice(0, 5).map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.timelineItem}
              onPress={() => {
                const doc = documents.find(d => d.id === event.documentId);
                if (doc) {
                  viewDocument(doc);
                }
              }}
            >
              <View style={styles.timelineIcon}>
                {getTimelineIcon(event.type)}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{event.title}</Text>
                <Text style={styles.timelineDescription}>{event.description}</Text>
                <Text style={styles.timelineDate}>
                  {new Date(event.date).toLocaleDateString()} • {event.documentName}
                </Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}

          {timeline.length === 0 && (
            <View style={styles.emptyTimeline}>
              <Clock size={48} color="#9CA3AF" />
              <Text style={styles.emptyTimelineText}>No timeline events yet</Text>
              <Text style={styles.emptyTimelineSubtext}>
                Upload documents to start building your medical timeline
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Calendar size={24} color="#2563EB" />
            <Text style={styles.statNumber}>{stats.documents}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>

          <View style={styles.statCard}>
            <Activity size={24} color="#059669" />
            <Text style={styles.statNumber}>{stats.diagnoses}</Text>
            <Text style={styles.statLabel}>Diagnoses</Text>
          </View>

          <View style={styles.statCard}>
            <FileText size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.reports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
        </View>
      </ScrollView>

      {/* Document View Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDocument && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.documentDetailCard}>
                  <Text style={styles.documentDetailName}>{selectedDocument.name}</Text>
                  <Text style={styles.documentDetailMeta}>
                    Uploaded: {selectedDocument.uploadDate} • {(selectedDocument.size / 1024).toFixed(1)} KB
                  </Text>

                  <View style={[styles.statusBadge,
                  selectedDocument.status === 'processed' && styles.statusProcessed,
                  selectedDocument.status === 'processing' && styles.statusProcessing,
                  selectedDocument.status === 'failed' && styles.statusFailed
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedDocument.status === 'processed' ? '✓ Processed' :
                        selectedDocument.status === 'processing' ? '⏳ Processing' :
                          selectedDocument.status === 'failed' ? '✗ Failed' : 'Pending'}
                    </Text>
                  </View>

                  {/* Document Preview Section */}
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>Original Document</Text>

                    {selectedDocument.type.startsWith('image/') ? (
                      <TouchableOpacity
                        onPress={() => viewDocument(selectedDocument)}
                        style={styles.imagePreviewContainer}
                      >
                        <Image
                          source={{ uri: selectedDocument.uri }}
                          style={styles.documentPreview}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.filePreviewContainer}>
                        <FileText size={64} color="#2563EB" />
                        <Text style={styles.fileTypeText}>
                          {selectedDocument.type === 'application/pdf' ? 'PDF Document' :
                            selectedDocument.type.includes('word') ? 'Word Document' :
                              selectedDocument.type === 'text/plain' ? 'Text File' : 'Document'}
                        </Text>
                      </View>
                    )}

                    {/* View Original Button */}
                    <TouchableOpacity
                      style={styles.viewOriginalButton}
                      onPress={() => viewDocument(selectedDocument)}
                    >
                      <Eye size={20} color="#FFFFFF" />
                      <Text style={styles.viewOriginalButtonText}>View Original Document</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Extracted Information Section */}
                  {selectedDocument.extractedData && (
                    <View style={styles.extractedDataSection}>
                      <Text style={styles.extractedDataTitle}>Extracted Information</Text>

                      {selectedDocument.extractedData.diagnoses && selectedDocument.extractedData.diagnoses.length > 0 && (
                        <View style={styles.extractedItem}>
                          <Text style={styles.extractedLabel}>Diagnoses:</Text>
                          {selectedDocument.extractedData.diagnoses.map((d, i) => (
                            <Text key={i} style={styles.extractedValue}>• {d}</Text>
                          ))}
                        </View>
                      )}

                      {selectedDocument.extractedData.medications && selectedDocument.extractedData.medications.length > 0 && (
                        <View style={styles.extractedItem}>
                          <Text style={styles.extractedLabel}>Medications:</Text>
                          {selectedDocument.extractedData.medications.map((m, i) => (
                            <Text key={i} style={styles.extractedValue}>• {m}</Text>
                          ))}
                        </View>
                      )}

                      {selectedDocument.extractedData.labResults && selectedDocument.extractedData.labResults.length > 0 && (
                        <View style={styles.extractedItem}>
                          <Text style={styles.extractedLabel}>Lab Results:</Text>
                          {selectedDocument.extractedData.labResults.map((l, i) => (
                            <Text key={i} style={styles.extractedValue}>• {l}</Text>
                          ))}
                        </View>
                      )}

                      {selectedDocument.extractedData.allergies && selectedDocument.extractedData.allergies.length > 0 && (
                        <View style={styles.extractedItem}>
                          <Text style={styles.extractedLabel}>Allergies:</Text>
                          {selectedDocument.extractedData.allergies.map((a, i) => (
                            <Text key={i} style={styles.extractedValue}>• {a}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
  bloodGroup: {
    fontSize: 14,
    color: '#059669',
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
    position: 'relative',
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
  processingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 8,
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  documentPreviewText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  timelineItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  timelineDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyTimeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTimelineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyTimelineSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  documentDetailCard: {
    padding: 16,
  },
  documentDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  documentDetailMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusProcessed: {
    backgroundColor: '#D1FAE5',
  },
  statusProcessing: {
    backgroundColor: '#FEF3C7',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  filePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 12,
  },
  fileTypeText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  viewOriginalButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  viewOriginalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  extractedDataSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  extractedDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  extractedItem: {
    marginBottom: 12,
  },
  extractedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  extractedValue: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginBottom: 2,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
});