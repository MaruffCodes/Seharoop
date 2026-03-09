import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'react-native';
import { ArrowLeft, Download, Info, FileText, X, Heart, Bone, Stethoscope, Brain } from 'lucide-react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type Specialty = 'general' | 'cardiology' | 'orthopedic' | 'slm';

interface SpecialtyQRData {
  qrCode: string;
  summary: any;
  specialty: Specialty;
}

interface SLMSummary {
  success: boolean;
  summary: string;
  structured_summary?: any;
  type: string;
  timestamp: string;
}

export default function FullScreenQR() {
  const { qrCodeUrl } = useLocalSearchParams();
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>('general');
  const [specialtyData, setSpecialtyData] = useState<Record<Specialty, SpecialtyQRData | null>>({
    general: null,
    cardiology: null,
    orthopedic: null,
    slm: null
  });
  const [slmSummary, setSlmSummary] = useState<SLMSummary | null>(null);
  const [loading, setLoading] = useState<Record<Specialty, boolean>>({
    general: true,
    cardiology: false,
    orthopedic: false,
    slm: false
  });
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const router = useRouter();
  const { userData } = useAuth();

  // Load general QR on mount
  useEffect(() => {
    loadSpecialtyQR('general');
  }, []);

  // Load QR when specialty changes
  useEffect(() => {
    if (selectedSpecialty === 'slm') {
      if (!slmSummary && !loading.slm) {
        loadSLMSummary();
      }
    } else if (!specialtyData[selectedSpecialty] && !loading[selectedSpecialty]) {
      loadSpecialtyQR(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  const loadSpecialtyQR = async (specialty: Specialty) => {
    try {
      setLoading(prev => ({ ...prev, [specialty]: true }));

      // If we have a URL from params and it's general, use it
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

      // Otherwise fetch from API
      const response = await ApiService.generateSpecialtyQR(specialty as any);
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

  const loadSLMSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, slm: true }));
      const response = await ApiService.getMySLMSummary();
      if (response.success) {
        setSlmSummary(response.data);
      }
    } catch (error) {
      console.error('Error loading SLM summary:', error);
    } finally {
      setLoading(prev => ({ ...prev, slm: false }));
    }
  };

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Storage permission is required to save the QR code.');
        return;
      }

      if (selectedSpecialty === 'slm') {
        // Download SLM summary as text
        if (!slmSummary) return;

        const fileName = `AI_Medical_Summary_${Date.now()}.txt`;
        const file = new File(new Directory(Paths.document, 'Summaries'), fileName);
        await file.write(slmSummary.summary);

        await MediaLibrary.saveToLibraryAsync(file.uri);
        Alert.alert('Success', 'AI Summary saved to your device.');
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
      console.error('Error downloading:', error);
      Alert.alert('Error', 'Failed to save: ' + (error as Error).message);
    }
  };

  const getSpecialtyIcon = (specialty: Specialty) => {
    switch (specialty) {
      case 'cardiology': return <Heart size={20} color="#DC2626" />;
      case 'orthopedic': return <Bone size={20} color="#059669" />;
      case 'slm': return <Brain size={20} color="#8B5CF6" />;
      default: return <Stethoscope size={20} color="#2563EB" />;
    }
  };

  const getSpecialtyColor = (specialty: Specialty) => {
    switch (specialty) {
      case 'cardiology': return '#DC2626';
      case 'orthopedic': return '#059669';
      case 'slm': return '#8B5CF6';
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
      {getSpecialtyIcon(specialty)}
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

  const renderSLMSummaryModal = () => {
    if (!slmSummary) return null;

    return (
      <View style={styles.modalSection}>
        <Text style={[styles.modalSectionTitle, { color: '#8B5CF6' }]}>AI GENERATED SUMMARY</Text>
        <ScrollView style={styles.slmSummaryContainer}>
          <Text style={styles.slmSummaryText}>{slmSummary.summary}</Text>
          <Text style={styles.slmTimestamp}>
            Generated: {new Date(slmSummary.timestamp).toLocaleString()}
          </Text>
        </ScrollView>
      </View>
    );
  };

  const renderGeneralSummary = (summary: any) => (
    <>
      {/* PATIENT DEMOGRAPHICS */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>PATIENT DEMOGRAPHICS</Text>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Name:</Text>
          <Text style={styles.modalValue}>{summary.patientDemographics?.name || 'NA'}</Text>
        </View>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Patient ID:</Text>
          <Text style={styles.modalValue}>{summary.patientDemographics?.patientId || 'NA'}</Text>
        </View>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Date of Birth:</Text>
          <Text style={styles.modalValue}>{summary.patientDemographics?.dateOfBirth || 'NA'}</Text>
        </View>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Age:</Text>
          <Text style={styles.modalValue}>{summary.patientDemographics?.age || 'NA'}</Text>
        </View>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Gender:</Text>
          <Text style={styles.modalValue}>{summary.patientDemographics?.gender || 'NA'}</Text>
        </View>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Email:</Text>
          <Text style={styles.modalValue}>{summary.patientDemographics?.email || 'NA'}</Text>
        </View>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Phone:</Text>
          <Text style={styles.modalValue}>{summary.patientDemographics?.phone || 'NA'}</Text>
        </View>
      </View>

      {/* ADDRESS */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>ADDRESS</Text>
        <Text style={styles.addressText}>{summary.address || 'NA'}</Text>
      </View>

      {/* MEDICAL PROFILE */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>MEDICAL PROFILE</Text>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Blood Group:</Text>
          <Text style={[styles.modalValue, styles.bloodGroup]}>{summary.medicalProfile?.bloodGroup || 'NA'}</Text>
        </View>
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Diabetic:</Text>
          <Text style={styles.modalValue}>{summary.medicalProfile?.isDiabetic || 'NA'}</Text>
        </View>
        {summary.medicalProfile?.diabetesType !== 'NA' && (
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Diabetes Type:</Text>
            <Text style={styles.modalValue}>{summary.medicalProfile?.diabetesType}</Text>
          </View>
        )}
        <View style={styles.modalRow}>
          <Text style={styles.modalLabel}>Thyroid Condition:</Text>
          <Text style={styles.modalValue}>{summary.medicalProfile?.thyroidCondition || 'NA'}</Text>
        </View>
      </View>

      {/* ALLERGIES */}
      <View style={styles.modalSection}>
        <Text style={[styles.modalSectionTitle, styles.allergyTitle]}>ALLERGIES</Text>
        {summary.allergies?.map((allergy: any, i: number) => {
          const allergyName = typeof allergy === 'string' ? allergy : allergy.name;
          return allergyName !== 'NA' ? (
            <Text key={i} style={[styles.modalListItem, styles.allergyText]}>• {allergyName}</Text>
          ) : (
            <Text key={i} style={[styles.modalListItem, styles.allergyText]}>• None reported</Text>
          );
        })}
      </View>

      {/* COMORBID CONDITIONS */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>COMORBID CONDITIONS</Text>
        {summary.comorbidConditions?.map((condition: any, i: number) => {
          const conditionName = typeof condition === 'string' ? condition : condition.name;
          return conditionName !== 'NA' ? (
            <Text key={i} style={styles.modalListItem}>• {conditionName}</Text>
          ) : (
            <Text key={i} style={styles.modalListItem}>• None reported</Text>
          );
        })}
      </View>

      {/* CHRONIC DISEASES */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>CHRONIC DISEASES</Text>
        {summary.chronicDiseases?.map((disease: any, i: number) => {
          const diseaseName = typeof disease === 'string' ? disease : disease.name;
          return diseaseName !== 'NA' ? (
            <Text key={i} style={styles.modalListItem}>• {diseaseName}</Text>
          ) : (
            <Text key={i} style={styles.modalListItem}>• None reported</Text>
          );
        })}
      </View>

      {/* CURRENT MEDICATIONS */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>CURRENT MEDICATIONS</Text>
        {summary.currentMedications?.map((med: any, i: number) => {
          if (med.name === 'NA') {
            return <Text key={i} style={styles.modalListItem}>• No current medications</Text>;
          }
          return (
            <View key={i} style={styles.medicationItem}>
              <Text style={styles.medicationName}>• {med.name}</Text>
              {med.purpose !== 'NA' && <Text style={styles.medicationDetail}>  Purpose: {med.purpose}</Text>}
              {med.dosage !== 'NA' && <Text style={styles.medicationDetail}>  Dosage: {med.dosage}</Text>}
            </View>
          );
        })}
      </View>

      {/* PAST SURGERIES */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>PAST SURGERIES</Text>
        {summary.pastSurgeries?.map((surgery: any, i: number) => {
          if (surgery.name === 'NA') {
            return <Text key={i} style={styles.modalListItem}>• No past surgeries</Text>;
          }
          return (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyTitle}>• {surgery.name}</Text>
              <Text style={styles.historyDetail}>  Date: {surgery.date}</Text>
              <Text style={styles.historyDetail}>  Hospital: {surgery.hospital}</Text>
              <Text style={styles.historyDetail}>  Surgeon: {surgery.surgeon}</Text>
            </View>
          );
        })}
      </View>

      {/* MAJOR SURGERIES / ILLNESS */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>MAJOR SURGERIES / ILLNESS</Text>
        {summary.majorSurgeriesOrIllness?.map((illness: any, i: number) => {
          if (illness.name === 'NA') {
            return <Text key={i} style={styles.modalListItem}>• No major illnesses reported</Text>;
          }
          return (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyTitle}>• {illness.name}</Text>
              <Text style={styles.historyDetail}>  Date: {illness.date}</Text>
              <Text style={styles.historyDetail}>  Hospital: {illness.hospital}</Text>
              <Text style={styles.historyDetail}>  Notes: {illness.notes}</Text>
            </View>
          );
        })}
      </View>

      {/* PREVIOUS INTERVENTIONS */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>PREVIOUS INTERVENTIONS</Text>
        {summary.previousInterventions?.map((intervention: any, i: number) => {
          if (intervention.name === 'NA') {
            return <Text key={i} style={styles.modalListItem}>• No previous interventions</Text>;
          }
          return (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyTitle}>• {intervention.name}</Text>
              <Text style={styles.historyDetail}>  Date: {intervention.date}</Text>
              <Text style={styles.historyDetail}>  Hospital: {intervention.hospital}</Text>
            </View>
          );
        })}
      </View>

      {/* BLOOD THINNER HISTORY */}
      <View style={styles.modalSection}>
        <Text style={styles.modalSectionTitle}>BLOOD THINNER HISTORY</Text>
        {summary.bloodThinnerHistory?.map((bt: any, i: number) => {
          if (bt.name === 'NA') {
            return <Text key={i} style={styles.modalListItem}>• No blood thinner history</Text>;
          }
          return (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyTitle}>• {bt.name}</Text>
              <Text style={styles.historyDetail}>  Type: {bt.type}</Text>
              <Text style={styles.historyDetail}>  Duration: {bt.duration}</Text>
              <Text style={styles.historyDetail}>  Reason: {bt.reason}</Text>
            </View>
          );
        })}
      </View>

      {/* EMERGENCY CONTACT */}
      {summary.emergencyContact && (
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionTitle}>EMERGENCY CONTACT</Text>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Name:</Text>
            <Text style={styles.modalValue}>{summary.emergencyContact.name || 'NA'}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Relationship:</Text>
            <Text style={styles.modalValue}>{summary.emergencyContact.relationship || 'NA'}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Phone:</Text>
            <Text style={styles.modalValue}>{summary.emergencyContact.phone || 'NA'}</Text>
          </View>
        </View>
      )}

      {/* MEDICAL HISTORY */}
      {summary.medicalHistory?.length > 0 && (
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionTitle}>MEDICAL HISTORY</Text>
          {summary.medicalHistory.map((yearData: any, yIndex: number) => (
            <View key={yIndex} style={styles.yearContainer}>
              <Text style={styles.yearTitle}>YEAR {yearData.year}</Text>
              {yearData.months?.map((monthData: any, mIndex: number) => (
                <View key={mIndex} style={styles.monthContainer}>
                  <Text style={styles.monthTitle}>{monthData.month}</Text>
                  {monthData.records?.map((record: any, rIndex: number) => (
                    <View key={rIndex} style={styles.recordItem}>
                      <Text style={styles.recordDate}>
                        • {record.day} {monthData.month} – {record.type}
                      </Text>
                      <Text style={styles.recordDescription}>  {record.description}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderCardiologySummary = (summary: any) => (
    <>
      {/* Cardiac Diagnoses */}
      {summary.cardiacDiagnoses?.length > 0 && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#DC2626' }]}>Cardiac Conditions</Text>
          {summary.cardiacDiagnoses.map((d: string, i: number) => (
            <Text key={i} style={styles.modalListItem}>• {d}</Text>
          ))}
        </View>
      )}

      {/* Cardiac Medications */}
      {summary.cardiacMedications?.length > 0 && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#DC2626' }]}>Cardiac Medications</Text>
          {summary.cardiacMedications.map((m: string, i: number) => (
            <Text key={i} style={styles.modalListItem}>• {m}</Text>
          ))}
        </View>
      )}

      {/* Vital Signs */}
      {summary.vitals && Object.keys(summary.vitals).length > 0 && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#DC2626' }]}>Vital Signs</Text>
          {Object.entries(summary.vitals).map(([key, value], i) => (
            <View key={i} style={styles.modalRow}>
              <Text style={styles.modalLabel}>{key}:</Text>
              <Text style={styles.modalValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cardiac Tests */}
      {summary.cardiacTests?.length > 0 && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#DC2626' }]}>Cardiac Tests</Text>
          {summary.cardiacTests.map((t: string, i: number) => (
            <Text key={i} style={styles.modalListItem}>• {t}</Text>
          ))}
        </View>
      )}

      {/* Risk Factors */}
      {summary.riskFactors?.length > 0 && (
        <View style={[styles.modalSection, styles.riskSection]}>
          <Text style={[styles.modalSectionTitle, styles.riskTitle]}>Cardiac Risk Factors</Text>
          {summary.riskFactors.map((factor: string, i: number) => (
            <Text key={i} style={styles.riskItem}>• {factor}</Text>
          ))}
        </View>
      )}
    </>
  );

  const renderOrthopedicSummary = (summary: any) => (
    <>
      {/* Orthopedic Diagnoses */}
      {summary.orthopedicDiagnoses?.length > 0 && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#059669' }]}>Orthopedic Conditions</Text>
          {summary.orthopedicDiagnoses.map((d: string, i: number) => (
            <Text key={i} style={styles.modalListItem}>• {d}</Text>
          ))}
        </View>
      )}

      {/* Orthopedic Medications */}
      {summary.orthopedicMedications?.length > 0 && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#059669' }]}>Pain/Inflammation Medications</Text>
          {summary.orthopedicMedications.map((m: string, i: number) => (
            <Text key={i} style={styles.modalListItem}>• {m}</Text>
          ))}
        </View>
      )}

      {/* Imaging Results */}
      {summary.imagingResults?.length > 0 && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#059669' }]}>Imaging Results</Text>
          {summary.imagingResults.map((img: string, i: number) => (
            <Text key={i} style={styles.modalListItem}>• {img}</Text>
          ))}
        </View>
      )}

      {/* Mobility Status */}
      {summary.mobilityStatus && (
        <View style={styles.modalSection}>
          <Text style={[styles.modalSectionTitle, { color: '#059669' }]}>Mobility Status</Text>
          <Text style={styles.modalValue}>{summary.mobilityStatus}</Text>
        </View>
      )}
    </>
  );

  const currentData = specialtyData[selectedSpecialty];
  const currentColor = getSpecialtyColor(selectedSpecialty);

  if (loading.general && selectedSpecialty === 'general' && !currentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.title}>Medical QR Codes</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading QR codes...</Text>
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
        <Text style={styles.title}>Medical QR Codes</Text>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Download size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Specialty Tabs */}
      <View style={styles.tabContainer}>
        {renderSpecialtyTab('general', 'General')}
        {renderSpecialtyTab('cardiology', 'Cardiology')}
        {renderSpecialtyTab('orthopedic', 'Orthopedic')}
        {renderSpecialtyTab('slm', 'AI Summary')}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* QR Code Display - Only show for non-SLM tabs */}
        {selectedSpecialty !== 'slm' && (
          <View style={styles.qrContainer}>
            {currentData?.qrCode ? (
              <Image source={{ uri: currentData.qrCode }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderQR}>
                <ActivityIndicator size="small" color={currentColor} />
                <Text style={[styles.placeholderText, { color: currentColor }]}>
                  Generating {selectedSpecialty} QR...
                </Text>
              </View>
            )}

            {/* View Summary Button - Always show when we have data */}
            {(currentData?.qrCode) && (
              <TouchableOpacity
                style={[styles.summaryButton, { backgroundColor: currentColor }]}
                onPress={() => {
                  if (currentData?.summary) {
                    setSummaryModalVisible(true);
                  } else {
                    Alert.alert('Info', 'Loading summary data...');
                    loadSpecialtyQR(selectedSpecialty);
                  }
                }}
              >
                <FileText size={20} color="#FFFFFF" />
                <Text style={styles.summaryButtonText}>
                  View {selectedSpecialty === 'general' ? 'General' :
                    selectedSpecialty === 'cardiology' ? 'Cardiology' : 'Orthopedic'} Summary
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* AI Summary Content */}
        {selectedSpecialty === 'slm' && (
          <View style={[styles.slmContainer, { borderColor: currentColor }]}>
            <View style={styles.slmHeader}>
              <Brain size={32} color={currentColor} />
              <Text style={[styles.slmTitle, { color: currentColor }]}>AI-Generated Medical Summary</Text>
            </View>

            {loading.slm ? (
              <View style={styles.slmLoadingContainer}>
                <ActivityIndicator size="large" color={currentColor} />
                <Text style={styles.slmLoadingText}>Generating AI summary...</Text>
              </View>
            ) : slmSummary ? (
              <>
                <ScrollView style={styles.slmContent}>
                  <Text style={styles.slmSummaryText}>{slmSummary.summary}</Text>
                  <Text style={styles.slmTimestamp}>
                    Generated: {new Date(slmSummary.timestamp).toLocaleString()}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={[styles.viewFullButton, { backgroundColor: currentColor }]}
                  onPress={() => setSummaryModalVisible(true)}
                >
                  <Text style={styles.viewFullButtonText}>View Full Summary</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.slmEmptyState}>
                <Brain size={48} color={currentColor} />
                <Text style={styles.slmEmptyTitle}>No AI Summary Yet</Text>
                <Text style={styles.slmEmptyText}>
                  Upload documents to generate AI-powered medical summaries
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Info Preview - Only for non-SLM tabs */}
        {selectedSpecialty !== 'slm' && currentData?.summary && (
          <View style={[styles.previewContainer, { borderLeftColor: currentColor }]}>
            <View style={styles.previewHeader}>
              {getSpecialtyIcon(selectedSpecialty)}
              <Text style={[styles.previewTitle, { color: currentColor }]}>
                {selectedSpecialty === 'general' ? 'General Doctor Summary' :
                  selectedSpecialty === 'cardiology' ? 'Cardiology Summary' : 'Orthopedic Summary'}
              </Text>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Patient:</Text>
              <Text style={styles.previewValue}>
                {selectedSpecialty === 'general'
                  ? currentData.summary.patientDemographics?.name
                  : currentData.summary.patientInfo?.name || userData?.name}
              </Text>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Blood Group:</Text>
              <Text style={[styles.previewValue, styles.bloodGroup]}>
                {selectedSpecialty === 'general'
                  ? currentData.summary.medicalProfile?.bloodGroup
                  : currentData.summary.patientInfo?.bloodGroup || 'Unknown'}
              </Text>
            </View>

            {selectedSpecialty === 'general' && (
              <>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Diagnoses:</Text>
                  <Text style={styles.previewValue}>{currentData.summary.diagnoses?.length || 0}</Text>
                </View>
                {currentData.summary.riskFlags?.length > 0 && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Risk Flags:</Text>
                    <Text style={[styles.previewValue, styles.riskText]}>
                      {currentData.summary.riskFlags.length}
                    </Text>
                  </View>
                )}
              </>
            )}

            {selectedSpecialty === 'cardiology' && (
              <>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Cardiac Dx:</Text>
                  <Text style={styles.previewValue}>{currentData.summary.cardiacDiagnoses?.length || 0}</Text>
                </View>
                {currentData.summary.vitals?.bp && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>BP:</Text>
                    <Text style={styles.previewValue}>{currentData.summary.vitals.bp}</Text>
                  </View>
                )}
              </>
            )}

            {selectedSpecialty === 'orthopedic' && (
              <>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Orthopedic Dx:</Text>
                  <Text style={styles.previewValue}>{currentData.summary.orthopedicDiagnoses?.length || 0}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Mobility:</Text>
                  <Text style={styles.previewValue}>
                    {currentData.summary.mobilityStatus?.substring(0, 20) || 'Unknown'}
                  </Text>
                </View>
              </>
            )}

            <Text style={styles.updateText}>
              For {selectedSpecialty === 'general' ? 'All Doctors' : `${selectedSpecialty} Specialists`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Summary Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={summaryModalVisible}
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentColor }]}>
                {selectedSpecialty === 'slm' ? 'AI GENERATED MEDICAL SUMMARY' :
                  selectedSpecialty === 'general' ? 'GENERAL PATIENT SUMMARY' :
                    selectedSpecialty === 'cardiology' ? 'CARDIOLOGY SUMMARY' : 'ORTHOPEDIC SUMMARY'}
              </Text>
              <TouchableOpacity onPress={() => setSummaryModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSpecialty === 'slm' ? (
                renderSLMSummaryModal()
              ) : currentData?.summary && (
                <>
                  {/* Patient Information - Always Show */}
                  {selectedSpecialty === 'general' && renderGeneralSummary(currentData.summary)}
                  {selectedSpecialty === 'cardiology' && (
                    <>
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>PATIENT INFORMATION</Text>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Name:</Text>
                          <Text style={styles.modalValue}>{currentData.summary.patientInfo?.name || userData?.name}</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Patient ID:</Text>
                          <Text style={styles.modalValue}>{currentData.summary.patientInfo?.patientId || userData?.patientId}</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Age:</Text>
                          <Text style={styles.modalValue}>{currentData.summary.patientInfo?.age || 'NA'}</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Blood Group:</Text>
                          <Text style={[styles.modalValue, styles.bloodGroup]}>
                            {currentData.summary.patientInfo?.bloodGroup || 'NA'}
                          </Text>
                        </View>
                      </View>
                      {renderCardiologySummary(currentData.summary)}
                    </>
                  )}
                  {selectedSpecialty === 'orthopedic' && (
                    <>
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>PATIENT INFORMATION</Text>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Name:</Text>
                          <Text style={styles.modalValue}>{currentData.summary.patientInfo?.name || userData?.name}</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Patient ID:</Text>
                          <Text style={styles.modalValue}>{currentData.summary.patientInfo?.patientId || userData?.patientId}</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Age:</Text>
                          <Text style={styles.modalValue}>{currentData.summary.patientInfo?.age || 'NA'}</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Blood Group:</Text>
                          <Text style={[styles.modalValue, styles.bloodGroup]}>
                            {currentData.summary.patientInfo?.bloodGroup || 'NA'}
                          </Text>
                        </View>
                      </View>
                      {renderOrthopedicSummary(currentData.summary)}
                    </>
                  )}

                  <Text style={styles.modalUpdateText}>
                    Last updated: {new Date(currentData.summary.lastUpdated).toLocaleString()}
                  </Text>
                  <Text style={styles.modalSpecialtyNote}>
                    Generated for: {selectedSpecialty === 'general' ? 'All Doctors' : `${selectedSpecialty} Specialists`}
                  </Text>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.closeButton, { borderColor: currentColor }]}
                onPress={() => setSummaryModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: currentColor }]}>Close</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: '#F8FAFC',
    gap: 8,
    flexWrap: 'wrap',
  },
  specialtyTab: {
    flex: 1,
    minWidth: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  specialtyTabText: {
    fontSize: 12,
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
  },
  qrImage: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  placeholderQR: {
    width: 250,
    height: 250,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  previewValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  bloodGroup: {
    color: '#2563EB',
    fontWeight: '700',
  },
  riskText: {
    color: '#DC2626',
  },
  updateText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  slmContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  slmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  slmTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  slmLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  slmLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  slmContent: {
    maxHeight: 300,
    marginBottom: 16,
  },
  slmSummaryText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
  },
  slmTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  slmEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  slmEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  slmEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  viewFullButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewFullButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  riskSection: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  riskTitle: {
    color: '#DC2626',
  },
  riskItem: {
    fontSize: 15,
    color: '#DC2626',
    marginBottom: 4,
    marginLeft: 8,
  },
  allergyTitle: {
    color: '#DC2626',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  modalListItem: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 6,
    marginLeft: 8,
  },
  allergyText: {
    color: '#DC2626',
  },
  addressText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  medicationItem: {
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  medicationDetail: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 16,
    marginTop: 2,
  },
  historyItem: {
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  historyDetail: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 16,
    marginTop: 2,
  },
  yearContainer: {
    marginBottom: 16,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 8,
    marginBottom: 8,
  },
  monthContainer: {
    marginLeft: 8,
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  recordItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  recordDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginTop: 2,
  },
  slmSummaryContainer: {
    maxHeight: 400,
  },
  modalUpdateText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  modalSpecialtyNote: {
    fontSize: 12,
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});