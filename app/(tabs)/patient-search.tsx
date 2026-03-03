import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Search, 
  QrCode, 
  User, 
  ArrowLeft, 
  Camera,
  Hash,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Pill,
  AlertTriangle
} from 'lucide-react-native';
import ApiService from '../../services/api';

interface Patient {
  _id: string;
  role: string;
  patientId: string;
  qrCode: string;
  name: string;
  email: string;
  bloodGroup?: string;
  isDiabetic?: boolean;
  diabetesType?: string;
  hasThyroid?: boolean;
  thyroidCondition?: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  pastSurgeries: Array<{
    surgery: string;
    date: string;
    hospital: string;
    surgeon: string;
    _id: string;
  }>;
  medicalHistory: Array<{
    year: string;
    months: Array<{
      month: string;
      records: Array<{
        date: string;
        description: string;
        type: string;
        documents: any[];
        _id: string;
      }>;
      _id: string;
    }>;
    _id: string;
  }>;
  medicationAllergies: string[];
  comorbidConditions: string[];
  chronicDiseases: string[];
  previousInterventions: Array<{
    name: string;
    date: string;
    hospital: string;
    _id: string;
  }>;
  majorSurgeriesOrIllness: Array<{
    name: string;
    date: string;
    hospital: string;
    notes: string;
    _id: string;
  }>;
  currentMedications: Array<{
    name: string;
    for: string;
    dosage: string;
    _id: string;
  }>;
  bloodThinnerHistory: Array<{
    name: string;
    type: string;
    duration: string;
    reason: string;
    _id: string;
  }>;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export default function PatientSearch() {
  const [patientId, setPatientId] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!patientId.trim()) {
      Alert.alert('Error', 'Please enter a Patient ID');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.searchPatient(patientId);
      setSearchResults([response.data]);
    } catch (error: unknown) {
      const err = error as any;
      console.error('Search error:', err);
      Alert.alert('Error', err.message || 'Failed to search patient');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    router.push('/(tabs)/Scanner');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };

  const viewPatientHistory = (patient: Patient) => {
    const patientDetails = `
PATIENT DEMOGRAPHICS:
Name: ${patient.name}
Patient ID: ${patient.patientId}
Date of Birth: ${formatDate(patient.dateOfBirth)} (${calculateAge(patient.dateOfBirth)} years)
Gender: ${patient.gender}
Email: ${patient.email}
Phone: ${patient.phone}

ADDRESS:
${patient.address.street}, ${patient.address.city}
${patient.address.state} - ${patient.address.pincode}
${patient.address.country}

MEDICAL PROFILE:
Blood Group: ${patient.bloodGroup || 'Not set'}
Diabetic: ${patient.isDiabetic ? 'Yes' : 'No'}
Diabetes Type: ${patient.diabetesType || 'N/A'}
Thyroid Condition: ${patient.hasThyroid ? patient.thyroidCondition || 'Yes' : 'No'}

ALLERGIES:
${patient.medicationAllergies && patient.medicationAllergies.length > 0 
  ? patient.medicationAllergies.map(allergy => `• ${allergy}`).join('\n')
  : 'None'
}

COMORBID CONDITIONS:
${patient.comorbidConditions && patient.comorbidConditions.length > 0 
  ? patient.comorbidConditions.map(condition => `• ${condition}`).join('\n')
  : 'None'
}

CHRONIC DISEASES:
${patient.chronicDiseases && patient.chronicDiseases.length > 0 
  ? patient.chronicDiseases.map(disease => `• ${disease}`).join('\n')
  : 'None'
}

CURRENT MEDICATIONS:
${patient.currentMedications && patient.currentMedications.length > 0 
  ? patient.currentMedications.map(med => `• ${med.name} - ${med.for} (${med.dosage})`).join('\n')
  : 'None'
}

PAST SURGERIES:
${patient.pastSurgeries && patient.pastSurgeries.length > 0 
  ? patient.pastSurgeries.map(surgery => 
      `• ${surgery.surgery}\n  Date: ${formatDate(surgery.date)}\n  Hospital: ${surgery.hospital}\n  Surgeon: ${surgery.surgeon}`
    ).join('\n\n')
  : 'None'
}

MAJOR SURGERIES/ILLNESS:
${patient.majorSurgeriesOrIllness && patient.majorSurgeriesOrIllness.length > 0 
  ? patient.majorSurgeriesOrIllness.map(illness => 
      `• ${illness.name}\n  Date: ${formatDate(illness.date)}\n  Hospital: ${illness.hospital}\n  Notes: ${illness.notes}`
    ).join('\n\n')
  : 'None'
}

PREVIOUS INTERVENTIONS:
${patient.previousInterventions && patient.previousInterventions.length > 0 
  ? patient.previousInterventions.map(intervention => 
      `• ${intervention.name}\n  Date: ${formatDate(intervention.date)}\n  Hospital: ${intervention.hospital}`
    ).join('\n\n')
  : 'None'
}

BLOOD THINNER HISTORY:
${patient.bloodThinnerHistory && patient.bloodThinnerHistory.length > 0 
  ? patient.bloodThinnerHistory.map(bt => 
      `• ${bt.name} (${bt.type})\n  Duration: ${bt.duration}\n  Reason: ${bt.reason}`
    ).join('\n\n')
  : 'None'
}

EMERGENCY CONTACT:
Name: ${patient.emergencyContact?.name || 'N/A'}
Relationship: ${patient.emergencyContact?.relationship || 'N/A'}
Phone: ${patient.emergencyContact?.phone || 'N/A'}

MEDICAL HISTORY:
${
  patient.medicalHistory && patient.medicalHistory.length > 0
    ? patient.medicalHistory.map(yearData => 
        `YEAR ${yearData.year}:\n` +
        yearData.months.map(monthData => 
          `  ${monthData.month}:\n` +
          monthData.records.map(record => 
            `    • ${formatDate(record.date)} - ${record.type.toUpperCase()}\n      ${record.description}`
          ).join('\n')
        ).join('\n')
      ).join('\n\n')
    : 'No records available'
}
    `;

    Alert.alert('Complete Patient Details', patientDetails, [
      { text: 'OK', style: 'default' }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2563EB" />
        </TouchableOpacity> */}
        <Text style={styles.title}>Find Patient</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search Methods</Text>
          
          <TouchableOpacity style={styles.qrButton} onPress={handleQRScan}>
            <QrCode size={32} color="#2563EB" />
            <View style={styles.qrButtonContent}>
              <Text style={styles.qrButtonTitle}>Scan QR Code</Text>
              <Text style={styles.qrButtonSubtitle}>
                Quickly access patient records
              </Text>
            </View>
            <Camera size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Enter Patient ID</Text>
            <View style={styles.searchContainer}>
              <Hash size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                value={patientId}
                onChangeText={setPatientId}
                placeholder="Enter 5-digit Patient ID (e.g., 00001)"
                keyboardType="numeric"
                maxLength={5}
              />
              <TouchableOpacity 
                style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
                onPress={handleSearch}
                disabled={loading}>
                <Search size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text>Searching...</Text>
          </View>
        )}

        {searchResults.length > 0 && !loading && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map((patient) => (
              <TouchableOpacity
                key={patient._id}
                style={styles.patientCard}
                onPress={() => viewPatientHistory(patient)}>
                <View style={styles.patientHeader}>
                  <View style={styles.patientAvatar}>
                    <User size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientId}>ID: {patient.patientId}</Text>
                    <Text style={styles.patientDetails}>
                      {calculateAge(patient.dateOfBirth)} yrs • {patient.gender}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {patient.medicalHistory && patient.medicalHistory.length > 0 ? 'Has Records' : 'No Records'}
                    </Text>
                  </View>
                </View>

                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <Mail size={14} color="#64748B" />
                    <Text style={styles.contactText}>{patient.email}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Phone size={14} color="#64748B" />
                    <Text style={styles.contactText}>{patient.phone}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <MapPin size={14} color="#64748B" />
                    <Text style={styles.contactText}>{patient.address.city}</Text>
                  </View>
                </View>

                <View style={styles.medicalSummary}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Blood Group</Text>
                      <Text style={styles.summaryValue}>{patient.bloodGroup || 'Not set'}</Text>
                    </View>
                    
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Diabetes</Text>
                      <Text style={styles.summaryValue}>
                        {patient.isDiabetic ? (patient.diabetesType || 'Yes') : 'No'}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Thyroid</Text>
                      <Text style={styles.summaryValue}>
                        {patient.hasThyroid ? (patient.thyroidCondition || 'Yes') : 'No'}
                      </Text>
                    </View>
                  </View>

                  {(patient.medicationAllergies && patient.medicationAllergies.length > 0) && (
                    <View style={styles.allergyWarning}>
                      <AlertTriangle size={14} color="#DC2626" />
                      <Text style={styles.allergyText}>
                        {patient.medicationAllergies.length} medication allergy(s)
                      </Text>
                    </View>
                  )}

                  <View style={styles.medicationsPreview}>
                    <Pill size={14} color="#64748B" />
                    <Text style={styles.medicationsText}>
                      {patient.currentMedications ? patient.currentMedications.length : 0} current medication(s)
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.viewHistoryText}>
                    Tap to view complete medical history
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searchResults.length === 0 && patientId && !loading && (
          <View style={styles.emptyState}>
            <Users size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Patient Found</Text>
            <Text style={styles.emptyStateText}>
              No patient found with ID: {patientId}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Please check the ID and try again
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    alignContent: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  searchSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
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
    marginBottom: 24,
  },
  qrButtonContent: {
    flex: 1,
    marginLeft: 16,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  resultsSection: {
    marginBottom: 24,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  patientId: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  patientDetails: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  contactInfo: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  medicalSummary: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  allergyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  allergyText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginLeft: 8,
  },
  medicationsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 8,
  },
  medicationsText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
    marginLeft: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    alignItems: 'center',
  },
  viewHistoryText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
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
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});