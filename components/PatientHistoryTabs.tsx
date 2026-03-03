import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { 
  User, 
  Clock, 
  Upload, 
  FileText, 
  Activity,
  Heart,
  Zap,
  Calendar
} from 'lucide-react-native';
import ApiService from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface PatientHistoryTabsProps {
  patientData: {
    patientId: string;
    name: string;
    bloodGroup: string;
    isDiabetic: boolean;
    diabetesType?: string;
    hasThyroid: boolean;
    thyroidCondition?: string;
    pastSurgeries: Array<{surgery: string; date: Date; hospital: string; surgeon: string}>;
  };
}
interface TimelineRecord {
  date: string;
  description: string;
  type: string;
  uploadedBy?: {
    name: string;
  };
}

interface TimelineMonth {
  month: string;
  records: TimelineRecord[];
}

interface TimelineYear {
  year: string;
  months: TimelineMonth[];
}

export default function PatientHistoryTabs({ patientData }: PatientHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'upload'>('summary');
  const [activeSummaryTab, setActiveSummaryTab] = useState<'overview' | 'timeline'>('overview');
  const [timelineData, setTimelineData] = useState<TimelineYear[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeSummaryTab === 'timeline') {
      loadTimelineData();
    }
  }, [activeSummaryTab, patientData.patientId]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPatientTimeline(patientData.patientId);
      setTimelineData(response.data.medicalHistory || []);
    } catch (error) {
      console.error('Error loading timeline:', error);
      Alert.alert('Error', 'Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file : any) => {
    try {
      setLoading(true);
      const uploadResponse = await ApiService.uploadFile(file, false);
      
      // Add record to patient's timeline
      const recordResponse = await ApiService.request(`/doctor/patient/${patientData.patientId}/record`, {
        method: 'POST',
        body: JSON.stringify({
          date: new Date().toISOString(),
          description: `Uploaded ${file.name}`,
          type: file.type.startsWith('image/') ? 'imaging' : 'lab',
          documents: [uploadResponse.data]
        }),
      });

      Alert.alert('Success', 'File uploaded successfully');
      if (activeSummaryTab === 'timeline') {
        loadTimelineData(); // Refresh timeline
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const document = result.assets[0];
        await handleFileUpload({
          uri: document.uri,
          type: document.mimeType,
          name: document.name,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async () => {
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
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        await handleFileUpload({
          uri: photo.uri,
          type: 'image/jpeg',
          name: `Photo_${new Date().toLocaleDateString().replace(/\//g, '-')}.jpg`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const renderSummaryOverview = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Medical Overview</Text>
        
        <View style={styles.medicalGrid}>
          <View style={styles.medicalCard}>
            <Heart size={24} color="#DC2626" />
            <Text style={styles.medicalLabel}>Blood Group</Text>
            <Text style={styles.medicalValue}>{patientData.bloodGroup || 'Not set'}</Text>
          </View>

          <View style={styles.medicalCard}>
            <Activity size={24} color="#059669" />
            <Text style={styles.medicalLabel}>Diabetes</Text>
            <Text style={styles.medicalValue}>
              {patientData.isDiabetic ? (patientData.diabetesType || 'Yes') : 'None'}
            </Text>
          </View>

          <View style={styles.medicalCard}>
            <Zap size={24} color="#2563EB" />
            <Text style={styles.medicalLabel}>Thyroid</Text>
            <Text style={styles.medicalValue}>
              {patientData.hasThyroid ? (patientData.thyroidCondition || 'Yes') : 'Normal'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Past Surgeries</Text>
        {patientData.pastSurgeries && patientData.pastSurgeries.length > 0 ? (
          patientData.pastSurgeries.map((surgery, index) => (
            <View key={index} style={styles.surgeryItem}>
              <Text style={styles.surgeryText}>{surgery.surgery}</Text>
              <Text style={styles.surgeryDetails}>
                {surgery.date ? new Date(surgery.date).toLocaleDateString() : ''} • {surgery.hospital}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.noSurgeries}>
            <Text style={styles.noSurgeriesText}>No past surgeries recorded</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderSummaryTimeline = () => (
    <ScrollView style={styles.tabContent}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading timeline...</Text>
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          {timelineData.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyTimelineText}>No medical records found</Text>
              <Text style={styles.emptyTimelineSubtext}>
                Upload documents to see them in the timeline
              </Text>
            </View>
          ) : (
            timelineData.map((yearData, yearIndex) => (
              <View key={yearIndex} style={styles.yearSection}>
                <Text style={styles.yearTitle}>{yearData.year}</Text>
                {yearData.months.map((monthData, monthIndex) => (
                  <View key={monthIndex} style={styles.monthSection}>
                    <Text style={styles.monthTitle}>{monthData.month}</Text>
                    {monthData.records.map((record, recordIndex) => (
                      <View key={recordIndex} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                          <Text style={styles.recordDate}>
                            {new Date(record.date).toLocaleDateString()}
                          </Text>
                          <Text style={styles.recordDescription}>{record.description}</Text>
                          <View style={styles.recordTypeBadge}>
                            <Text style={styles.recordTypeText}>{record.type}</Text>
                          </View>
                          {record.uploadedBy && (
                            <Text style={styles.uploadedBy}>
                              Uploaded by: {record.uploadedBy.name}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderUploadTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.uploadSection}>
        <Text style={styles.uploadTitle}>Upload New Reports</Text>
        <Text style={styles.uploadSubtitle}>Add medical documents for {patientData.name}</Text>
        
        <View style={styles.uploadButtons}>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickDocument}
            disabled={loading}>
            <FileText size={32} color="#2563EB" />
            <Text style={styles.uploadButtonTitle}>Upload Files</Text>
            <Text style={styles.uploadButtonSubtitle}>Select PDF or image files</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={takePhoto}
            disabled={loading}>
            <Upload size={32} color="#059669" />
            <Text style={styles.uploadButtonTitle}>Take Photo</Text>
            <Text style={styles.uploadButtonSubtitle}>Capture with camera</Text>
          </TouchableOpacity>
        </View>
        
        {loading && (
          <View style={styles.uploadingOverlay}>
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}>
          <User size={20} color={activeTab === 'summary' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
            Summary
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'upload' && styles.activeTab]}
          onPress={() => setActiveTab('upload')}>
          <Upload size={20} color={activeTab === 'upload' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'upload' && styles.activeTabText]}>
            Upload
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'summary' && (
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTab, activeSummaryTab === 'overview' && styles.activeSubTab]}
            onPress={() => setActiveSummaryTab('overview')}>
            <Activity size={16} color={activeSummaryTab === 'overview' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.subTabText, activeSummaryTab === 'overview' && styles.activeSubTabText]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTab, activeSummaryTab === 'timeline' && styles.activeSubTab]}
            onPress={() => setActiveSummaryTab('timeline')}>
            <Clock size={16} color={activeSummaryTab === 'timeline' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.subTabText, activeSummaryTab === 'timeline' && styles.activeSubTabText]}>
              Timeline
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.contentContainer}>
        {activeTab === 'summary' && activeSummaryTab === 'overview' && renderSummaryOverview()}
        {activeTab === 'summary' && activeSummaryTab === 'timeline' && renderSummaryTimeline()}
        {activeTab === 'upload' && renderUploadTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#2563EB',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeSubTab: {
    backgroundColor: '#EFF6FF',
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  activeSubTabText: {
    color: '#2563EB',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  medicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  medicalCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  medicalLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  medicalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
    textAlign: 'center',
  },
  surgeryItem: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  surgeryText: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '500',
  },
  surgeryDetails: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
  },
  noSurgeries: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noSurgeriesText: {
    fontSize: 14,
    color: '#166534',
    fontStyle: 'italic',
  },
  timelineContainer: {
    paddingBottom: 20,
  },
  yearSection: {
    marginBottom: 24,
  },
  yearTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    paddingLeft: 20,
  },
  monthSection: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    marginTop: 6,
    marginLeft: 8,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  recordTypeBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  recordTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  uploadedBy: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyTimeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTimelineText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyTimelineSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  uploadSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  uploadButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  uploadButtonSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});