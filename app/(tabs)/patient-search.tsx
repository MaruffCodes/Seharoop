import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, User, MapPin, Phone, Mail, Calendar, QrCode, X, Camera as CameraIcon } from 'lucide-react-native';
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import ApiService from '../../services/api';


interface Patient {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  bloodGroup?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  qrCode?: string;
}

export default function PatientSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a patient ID or name');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.searchPatient(searchQuery);
      if (response.success) {
        setSearchResults(response.data || []);
        if (response.data?.length === 0) {
          Alert.alert('No Results', 'No patients found matching your search');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setScanning(false);

    try {
      // Try to parse QR data if it's JSON
      let patientId = data;
      try {
        const parsed = JSON.parse(data);
        patientId = parsed.patientId || data;
      } catch {
        // Not JSON, use as is
      }

      setSearchQuery(patientId);
      await handleSearch();
    } catch (error) {
      Alert.alert('Error', 'Failed to process QR code');
    }
  };

  const viewPatientSummary = (patientId: string) => {
    router.push({
      pathname: '/(tabs)/patient-summary',
      params: { patientId }
    });
  };

  const renderPatientCard = (patient: Patient) => {
    // Safely access address fields
    const addressCity = patient.address?.city || '';
    const addressState = patient.address?.state || '';
    const addressParts = [addressCity, addressState].filter(Boolean);
    const addressString = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

    return (
      <TouchableOpacity
        key={patient._id}
        style={styles.patientCard}
        onPress={() => viewPatientSummary(patient.patientId)}
      >
        <View style={styles.patientHeader}>
          <View style={styles.avatar}>
            <User size={24} color="#FFFFFF" />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientId}>ID: {patient.patientId}</Text>
          </View>
          {patient.bloodGroup && (
            <View style={styles.bloodGroupBadge}>
              <Text style={styles.bloodGroupText}>{patient.bloodGroup}</Text>
            </View>
          )}
        </View>

        <View style={styles.patientDetails}>
          {patient.email && (
            <View style={styles.detailRow}>
              <Mail size={16} color="#64748B" />
              <Text style={styles.detailText}>{patient.email}</Text>
            </View>
          )}

          {patient.phone && (
            <View style={styles.detailRow}>
              <Phone size={16} color="#64748B" />
              <Text style={styles.detailText}>{patient.phone}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.detailText}>{addressString}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => viewPatientSummary(patient.patientId)}
          >
            <Text style={styles.viewButtonText}>View Medical Summary</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (scanning) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setScanning(false)}>
            <X size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Patient QR</Text>
          <View style={styles.placeholder} />
        </View>

        {hasPermission === null ? (
          <View style={styles.centerContent}>
            <Text>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centerContent}>
            <Text>No access to camera</Text>
            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
              <Text style={styles.scannerText}>Align QR code within the frame</Text>
            </View>
            {scanned && (
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Search</Text>
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
          <CameraIcon size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Patient ID or Name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {searchResults.length > 0 ? (
          searchResults.map(renderPatientCard)
        ) : (
          <View style={styles.emptyState}>
            <User size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Patients Found</Text>
            <Text style={styles.emptyStateText}>
              Search by patient ID or name to view medical records
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scanButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: 20,
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  patientId: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  bloodGroupBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  bloodGroupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  patientDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});