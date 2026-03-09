import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    User,
    Heart,
    Pill,
    AlertCircle,
    Calendar,
    Activity,
    Phone,
    Mail,
    MapPin,
    FileText,
    Download,
    Stethoscope,
    Bone,
    AlertTriangle,
    Clock,
    Scissors,
    X
} from 'lucide-react-native';
import ApiService from '../../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type SummaryType = 'general' | 'cardiology' | 'orthopedic';

interface PatientSummary {
    // From the API response - general summary
    patientInfo?: {
        name?: string;
        patientId?: string;
        age?: string;
        sex?: string;
        bloodGroup?: string;
        phone?: string;
        email?: string;
    };
    patientDemographics?: {
        name?: string;
        patientId?: string;
        dateOfBirth?: string;
        age?: string;
        gender?: string;
        email?: string;
        phone?: string;
    };
    address?: string;
    medicalProfile?: {
        bloodGroup?: string;
        isDiabetic?: string;
        diabetesType?: string;
        hasThyroid?: string;
        thyroidCondition?: string;
    };
    allergies?: Array<{ name?: string } | string>;
    comorbidConditions?: Array<{ name?: string } | string>;
    chronicDiseases?: Array<{ name?: string } | string>;
    currentMedications?: Array<{ name?: string; purpose?: string; dosage?: string } | string>;
    pastSurgeries?: Array<{
        name?: string;
        date?: string;
        hospital?: string;
        surgeon?: string;
    }>;
    majorSurgeriesOrIllness?: Array<{
        name?: string;
        date?: string;
        hospital?: string;
        notes?: string;
    }>;
    previousInterventions?: Array<{
        name?: string;
        date?: string;
        hospital?: string;
    }>;
    bloodThinnerHistory?: Array<{
        name?: string;
        type?: string;
        duration?: string;
        reason?: string;
    }>;
    emergencyContact?: {
        name?: string;
        relationship?: string;
        phone?: string;
    };
    medicalHistory?: Array<{
        year: string;
        months: Array<{
            month: string;
            records: Array<{
                day: number;
                type: string;
                description: string;
            }>;
        }>;
    }>;

    // Cardiology specific
    cardiacDiagnoses?: string[];
    cardiacMedications?: string[];
    cardiacTests?: string[];
    vitals?: {
        bloodPressure?: string;
        heartRate?: string;
        temperature?: string;
        weight?: string;
    };
    riskFactors?: string[];

    // Orthopedic specific
    orthopedicDiagnoses?: string[];
    orthopedicMedications?: string[];
    imagingResults?: string[];
    mobilityStatus?: string;
}

export default function PatientSummary() {
    const { patientId } = useLocalSearchParams();
    const [summary, setSummary] = useState<PatientSummary | null>(null);
    const [cardiologySummary, setCardiologySummary] = useState<any>(null);
    const [orthopedicSummary, setOrthopedicSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingCardiology, setLoadingCardiology] = useState(false);
    const [loadingOrthopedic, setLoadingOrthopedic] = useState(false);
    const [activeTab, setActiveTab] = useState<SummaryType>('general');
    const router = useRouter();

    useEffect(() => {
        loadPatientSummary();
    }, [patientId]);

    const loadPatientSummary = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getPatientSummaryDoctor(patientId as string);
            console.log('📊 General Summary Response:', JSON.stringify(response.data, null, 2));
            if (response.success) {
                setSummary(response.data);
            } else {
                Alert.alert('Error', 'Failed to load patient summary');
            }
        } catch (error) {
            console.error('Error loading patient summary:', error);
            Alert.alert('Error', 'Could not load patient information');
        } finally {
            setLoading(false);
        }
    };

    const loadCardiologySummary = async () => {
        try {
            setLoadingCardiology(true);
            const response = await ApiService.getPatientCardiologySummary(patientId as string);
            console.log('❤️ Cardiology Summary Response:', JSON.stringify(response.data, null, 2));
            if (response.success) {
                setCardiologySummary(response.data);
            }
        } catch (error) {
            console.error('Error loading cardiology summary:', error);
        } finally {
            setLoadingCardiology(false);
        }
    };

    const loadOrthopedicSummary = async () => {
        try {
            setLoadingOrthopedic(true);
            const response = await ApiService.getPatientOrthopedicSummary(patientId as string);
            console.log('🦴 Orthopedic Summary Response:', JSON.stringify(response.data, null, 2));
            if (response.success) {
                setOrthopedicSummary(response.data);
            }
        } catch (error) {
            console.error('Error loading orthopedic summary:', error);
        } finally {
            setLoadingOrthopedic(false);
        }
    };

    const handleTabChange = (tab: SummaryType) => {
        setActiveTab(tab);
        if (tab === 'cardiology' && !cardiologySummary) {
            loadCardiologySummary();
        } else if (tab === 'orthopedic' && !orthopedicSummary) {
            loadOrthopedicSummary();
        }
    };

    const downloadSummary = async () => {
        if (!summary) return;

        try {
            let textSummary = `PATIENT MEDICAL SUMMARY\n`;
            textSummary += `=====================\n\n`;

            // Patient Info
            const patientName = summary.patientDemographics?.name || summary.patientInfo?.name || 'N/A';
            const patientId_ = summary.patientDemographics?.patientId || summary.patientInfo?.patientId || 'N/A';
            const bloodGroup = summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup || 'Not specified';
            const age = summary.patientDemographics?.age || summary.patientInfo?.age || 'Unknown';
            const gender = summary.patientDemographics?.gender || summary.patientInfo?.sex || 'Unknown';

            textSummary += `Patient: ${patientName}\n`;
            textSummary += `ID: ${patientId_}\n`;
            textSummary += `Blood Group: ${bloodGroup}\n`;
            textSummary += `Age/Gender: ${age}/${gender}\n\n`;

            // Address
            if (summary.address) {
                textSummary += `ADDRESS\n`;
                textSummary += `-------\n`;
                textSummary += `${summary.address}\n\n`;
            }

            // Emergency Contact
            if (summary.emergencyContact) {
                textSummary += `EMERGENCY CONTACT\n`;
                textSummary += `-----------------\n`;
                textSummary += `Name: ${summary.emergencyContact.name || 'Not provided'}\n`;
                textSummary += `Relationship: ${summary.emergencyContact.relationship || 'Not provided'}\n`;
                textSummary += `Phone: ${summary.emergencyContact.phone || 'Not provided'}\n\n`;
            }

            // Allergies
            if (summary.allergies && summary.allergies.length > 0) {
                textSummary += `ALLERGIES\n`;
                textSummary += `---------\n`;
                summary.allergies.forEach(item => {
                    const allergyName = typeof item === 'string' ? item : item.name;
                    if (allergyName && allergyName !== 'NA') {
                        textSummary += `• ${allergyName}\n`;
                    }
                });
                textSummary += '\n';
            }

            // Comorbid Conditions
            if (summary.comorbidConditions && summary.comorbidConditions.length > 0) {
                textSummary += `COMORBID CONDITIONS\n`;
                textSummary += `-------------------\n`;
                summary.comorbidConditions.forEach(item => {
                    const conditionName = typeof item === 'string' ? item : item.name;
                    if (conditionName && conditionName !== 'NA') {
                        textSummary += `• ${conditionName}\n`;
                    }
                });
                textSummary += '\n';
            }

            // Chronic Diseases
            if (summary.chronicDiseases && summary.chronicDiseases.length > 0) {
                textSummary += `CHRONIC DISEASES\n`;
                textSummary += `----------------\n`;
                summary.chronicDiseases.forEach(item => {
                    const diseaseName = typeof item === 'string' ? item : item.name;
                    if (diseaseName && diseaseName !== 'NA') {
                        textSummary += `• ${diseaseName}\n`;
                    }
                });
                textSummary += '\n';
            }

            // Current Medications
            if (summary.currentMedications && summary.currentMedications.length > 0) {
                textSummary += `CURRENT MEDICATIONS\n`;
                textSummary += `-------------------\n`;
                summary.currentMedications.forEach(item => {
                    if (typeof item === 'string') {
                        if (item !== 'NA') textSummary += `• ${item}\n`;
                    } else {
                        textSummary += `• ${item.name || 'Unknown'}`;
                        if (item.dosage && item.dosage !== 'NA') textSummary += ` (${item.dosage})`;
                        if (item.purpose && item.purpose !== 'NA') textSummary += ` - ${item.purpose}`;
                        textSummary += '\n';
                    }
                });
                textSummary += '\n';
            }

            // Past Surgeries
            if (summary.pastSurgeries && summary.pastSurgeries.length > 0) {
                textSummary += `PAST SURGERIES\n`;
                textSummary += `--------------\n`;
                summary.pastSurgeries.forEach(s => {
                    if (s.name && s.name !== 'NA') {
                        textSummary += `• ${s.name}`;
                        if (s.date && s.date !== 'NA') textSummary += ` - ${s.date}`;
                        if (s.hospital && s.hospital !== 'NA') textSummary += ` at ${s.hospital}`;
                        textSummary += '\n';
                    }
                });
                textSummary += '\n';
            }

            // Major Surgeries/Illness
            if (summary.majorSurgeriesOrIllness && summary.majorSurgeriesOrIllness.length > 0) {
                textSummary += `MAJOR SURGERIES / ILLNESS\n`;
                textSummary += `-------------------------\n`;
                summary.majorSurgeriesOrIllness.forEach(i => {
                    if (i.name && i.name !== 'NA') {
                        textSummary += `• ${i.name}`;
                        if (i.date && i.date !== 'NA') textSummary += ` - ${i.date}`;
                        if (i.notes && i.notes !== 'NA') textSummary += ` (${i.notes})`;
                        textSummary += '\n';
                    }
                });
                textSummary += '\n';
            }

            // Blood Thinner History
            if (summary.bloodThinnerHistory && summary.bloodThinnerHistory.length > 0) {
                textSummary += `BLOOD THINNER HISTORY\n`;
                textSummary += `---------------------\n`;
                summary.bloodThinnerHistory.forEach(bt => {
                    if (bt.name && bt.name !== 'NA') {
                        textSummary += `• ${bt.name}`;
                        if (bt.type && bt.type !== 'NA') textSummary += ` (${bt.type})`;
                        if (bt.reason && bt.reason !== 'NA') textSummary += ` - ${bt.reason}`;
                        textSummary += '\n';
                    }
                });
                textSummary += '\n';
            }

            const fileName = `Patient_${patientId_}_Summary.txt`;
            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, textSummary);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Success', 'Summary saved to device');
            }
        } catch (error) {
            console.error('Error downloading summary:', error);
            Alert.alert('Error', 'Could not download summary');
        }
    };

    const renderTabBar = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'general' && styles.activeTab]}
                onPress={() => handleTabChange('general')}
            >
                <Stethoscope size={16} color={activeTab === 'general' ? '#2563EB' : '#64748B'} />
                <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>General</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'cardiology' && styles.activeTab]}
                onPress={() => handleTabChange('cardiology')}
            >
                <Heart size={16} color={activeTab === 'cardiology' ? '#DC2626' : '#64748B'} />
                <Text style={[styles.tabText, activeTab === 'cardiology' && { color: '#DC2626' }]}>
                    Cardiology
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'orthopedic' && styles.activeTab]}
                onPress={() => handleTabChange('orthopedic')}
            >
                <Bone size={16} color={activeTab === 'orthopedic' ? '#059669' : '#64748B'} />
                <Text style={[styles.tabText, activeTab === 'orthopedic' && { color: '#059669' }]}>
                    Orthopedic
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderGeneralSummary = () => {
        if (!summary) return null;

        // Helper function to get string value from item that could be string or object
        const getItemName = (item: any): string => {
            if (!item) return '';
            if (typeof item === 'string') return item;
            return item.name || '';
        };

        return (
            <>
                {/* Patient Info Card */}
                <View style={styles.card}>
                    <View style={styles.patientHeader}>
                        <View style={styles.avatar}>
                            <User size={32} color="#FFFFFF" />
                        </View>
                        <View style={styles.patientHeaderInfo}>
                            <Text style={styles.patientName}>
                                {summary.patientDemographics?.name || summary.patientInfo?.name || 'Name not available'}
                            </Text>
                            <Text style={styles.patientId}>
                                ID: {summary.patientDemographics?.patientId || summary.patientInfo?.patientId || 'N/A'}
                            </Text>
                        </View>
                        {(summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup) && (
                            <View style={styles.bloodGroupBadge}>
                                <Text style={styles.bloodGroupText}>
                                    {summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.patientDetails}>
                        <View style={styles.detailItem}>
                            <Calendar size={16} color="#64748B" />
                            <Text style={styles.detailText}>
                                {summary.patientDemographics?.age || summary.patientInfo?.age || 'Age N/A'} • {' '}
                                {summary.patientDemographics?.gender || summary.patientInfo?.sex || 'Gender N/A'}
                            </Text>
                        </View>
                        {(summary.patientDemographics?.phone || summary.patientInfo?.phone) && (
                            <View style={styles.detailItem}>
                                <Phone size={16} color="#64748B" />
                                <Text style={styles.detailText}>
                                    {summary.patientDemographics?.phone || summary.patientInfo?.phone}
                                </Text>
                            </View>
                        )}
                        {(summary.patientDemographics?.email || summary.patientInfo?.email) && (
                            <View style={styles.detailItem}>
                                <Mail size={16} color="#64748B" />
                                <Text style={styles.detailText}>
                                    {summary.patientDemographics?.email || summary.patientInfo?.email}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Address */}
                {summary.address && summary.address !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>ADDRESS</Text>
                        <Text style={styles.addressText}>{summary.address}</Text>
                    </View>
                )}

                {/* Medical Profile */}
                {summary.medicalProfile && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>MEDICAL PROFILE</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Blood Group:</Text>
                            <Text style={styles.infoValue}>{summary.medicalProfile.bloodGroup || 'NA'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Diabetic:</Text>
                            <Text style={styles.infoValue}>{summary.medicalProfile.isDiabetic || 'NA'}</Text>
                        </View>
                        {summary.medicalProfile.diabetesType && summary.medicalProfile.diabetesType !== 'NA' && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Diabetes Type:</Text>
                                <Text style={styles.infoValue}>{summary.medicalProfile.diabetesType}</Text>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Thyroid Condition:</Text>
                            <Text style={styles.infoValue}>{summary.medicalProfile.thyroidCondition || 'NA'}</Text>
                        </View>
                    </View>
                )}

                {/* Allergies */}
                {summary.allergies && summary.allergies.length > 0 && (
                    <View style={[styles.card, styles.criticalCard]}>
                        <Text style={[styles.cardTitle, styles.criticalTitle]}>ALLERGIES</Text>
                        {summary.allergies.map((item, index) => {
                            const name = getItemName(item);
                            return name && name !== 'NA' ? (
                                <Text key={index} style={[styles.listItem, styles.allergyText]}>• {name}</Text>
                            ) : index === 0 ? (
                                <Text key={index} style={styles.listItem}>• None reported</Text>
                            ) : null;
                        })}
                    </View>
                )}

                {/* Comorbid Conditions */}
                {summary.comorbidConditions && summary.comorbidConditions.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>COMORBID CONDITIONS</Text>
                        {summary.comorbidConditions.map((item, index) => {
                            const name = getItemName(item);
                            return name && name !== 'NA' ? (
                                <Text key={index} style={styles.listItem}>• {name}</Text>
                            ) : index === 0 ? (
                                <Text key={index} style={styles.listItem}>• None reported</Text>
                            ) : null;
                        })}
                    </View>
                )}

                {/* Chronic Diseases */}
                {summary.chronicDiseases && summary.chronicDiseases.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>CHRONIC DISEASES</Text>
                        {summary.chronicDiseases.map((item, index) => {
                            const name = getItemName(item);
                            return name && name !== 'NA' ? (
                                <Text key={index} style={styles.listItem}>• {name}</Text>
                            ) : index === 0 ? (
                                <Text key={index} style={styles.listItem}>• None reported</Text>
                            ) : null;
                        })}
                    </View>
                )}

                {/* Current Medications */}
                {summary.currentMedications && summary.currentMedications.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>CURRENT MEDICATIONS</Text>
                        {summary.currentMedications.map((item, index) => {
                            if (typeof item === 'string') {
                                return item !== 'NA' ? (
                                    <Text key={index} style={styles.listItem}>• {item}</Text>
                                ) : null;
                            } else {
                                return item.name && item.name !== 'NA' ? (
                                    <View key={index} style={styles.medicationItem}>
                                        <Text style={styles.medicationName}>• {item.name}</Text>
                                        {item.dosage && item.dosage !== 'NA' && (
                                            <Text style={styles.medicationDetail}>  Dosage: {item.dosage}</Text>
                                        )}
                                        {item.purpose && item.purpose !== 'NA' && (
                                            <Text style={styles.medicationDetail}>  Purpose: {item.purpose}</Text>
                                        )}
                                    </View>
                                ) : null;
                            }
                        })}
                    </View>
                )}

                {/* Past Surgeries */}
                {summary.pastSurgeries && summary.pastSurgeries.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>PAST SURGERIES</Text>
                        {summary.pastSurgeries.map((surgery, index) => {
                            if (!surgery.name || surgery.name === 'NA') return null;
                            return (
                                <View key={index} style={styles.historyItem}>
                                    <Text style={styles.historyTitle}>• {surgery.name}</Text>
                                    {surgery.date && surgery.date !== 'NA' && (
                                        <Text style={styles.historyDetail}>  Date: {surgery.date}</Text>
                                    )}
                                    {surgery.hospital && surgery.hospital !== 'NA' && (
                                        <Text style={styles.historyDetail}>  Hospital: {surgery.hospital}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Major Surgeries / Illness */}
                {summary.majorSurgeriesOrIllness && summary.majorSurgeriesOrIllness.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>MAJOR SURGERIES / ILLNESS</Text>
                        {summary.majorSurgeriesOrIllness.map((illness, index) => {
                            if (!illness.name || illness.name === 'NA') return null;
                            return (
                                <View key={index} style={styles.historyItem}>
                                    <Text style={styles.historyTitle}>• {illness.name}</Text>
                                    {illness.date && illness.date !== 'NA' && (
                                        <Text style={styles.historyDetail}>  Date: {illness.date}</Text>
                                    )}
                                    {illness.notes && illness.notes !== 'NA' && (
                                        <Text style={styles.historyDetail}>  Notes: {illness.notes}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Previous Interventions */}
                {summary.previousInterventions && summary.previousInterventions.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>PREVIOUS INTERVENTIONS</Text>
                        {summary.previousInterventions.map((intervention, index) => {
                            if (!intervention.name || intervention.name === 'NA') return null;
                            return (
                                <View key={index} style={styles.historyItem}>
                                    <Text style={styles.historyTitle}>• {intervention.name}</Text>
                                    {intervention.date && intervention.date !== 'NA' && (
                                        <Text style={styles.historyDetail}>  Date: {intervention.date}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Blood Thinner History */}
                {summary.bloodThinnerHistory && summary.bloodThinnerHistory.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>BLOOD THINNER HISTORY</Text>
                        {summary.bloodThinnerHistory.map((bt, index) => {
                            if (!bt.name || bt.name === 'NA') return null;
                            return (
                                <View key={index} style={styles.historyItem}>
                                    <Text style={styles.historyTitle}>• {bt.name}</Text>
                                    {bt.type && bt.type !== 'NA' && (
                                        <Text style={styles.historyDetail}>  Type: {bt.type}</Text>
                                    )}
                                    {bt.reason && bt.reason !== 'NA' && (
                                        <Text style={styles.historyDetail}>  Reason: {bt.reason}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Emergency Contact */}
                {summary.emergencyContact && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>EMERGENCY CONTACT</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Name:</Text>
                            <Text style={styles.infoValue}>{summary.emergencyContact.name || 'NA'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Relationship:</Text>
                            <Text style={styles.infoValue}>{summary.emergencyContact.relationship || 'NA'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone:</Text>
                            <Text style={styles.infoValue}>{summary.emergencyContact.phone || 'NA'}</Text>
                        </View>
                    </View>
                )}
            </>
        );
    };

    const renderCardiologySummary = () => {
        if (loadingCardiology) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={styles.loadingText}>Loading cardiology summary...</Text>
                </View>
            );
        }

        if (!cardiologySummary) {
            return (
                <View style={styles.emptyState}>
                    <Heart size={48} color="#DC2626" />
                    <Text style={styles.emptyStateTitle}>No Cardiology Data</Text>
                    <Text style={styles.emptyStateText}>
                        No cardiology-specific information found for this patient
                    </Text>
                </View>
            );
        }

        return (
            <>
                {/* Cardiac Diagnoses */}
                {cardiologySummary.cardiacDiagnoses?.length > 0 && (
                    <View style={[styles.card, { borderLeftColor: '#DC2626', borderLeftWidth: 4 }]}>
                        <Text style={[styles.cardTitle, { color: '#DC2626' }]}>Cardiac Conditions</Text>
                        {cardiologySummary.cardiacDiagnoses.map((d: string, i: number) => (
                            <View key={i} style={styles.diagnosisItem}>
                                <Heart size={16} color="#DC2626" />
                                <Text style={styles.diagnosisText}>{d}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Cardiac Medications */}
                {cardiologySummary.cardiacMedications?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Cardiac Medications</Text>
                        {cardiologySummary.cardiacMedications.map((m: string, i: number) => (
                            <View key={i} style={styles.medicationItem}>
                                <Pill size={16} color="#DC2626" />
                                <Text style={styles.medicationName}>{m}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Vital Signs */}
                {cardiologySummary.vitals && Object.keys(cardiologySummary.vitals).length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Vital Signs</Text>
                        {Object.entries(cardiologySummary.vitals).map(([key, value], i) => (
                            <View key={i} style={styles.vitalRow}>
                                <Text style={styles.vitalLabel}>{key}:</Text>
                                <Text style={styles.vitalValue}>{String(value)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Cardiac Tests */}
                {cardiologySummary.cardiacTests?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Cardiac Tests</Text>
                        {cardiologySummary.cardiacTests.map((t: string, i: number) => (
                            <View key={i} style={styles.testItem}>
                                <Activity size={16} color="#6B7280" />
                                <Text style={styles.testText}>{t}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Risk Factors */}
                {cardiologySummary.riskFactors?.length > 0 && (
                    <View style={[styles.card, styles.riskCard]}>
                        <Text style={[styles.cardTitle, styles.riskTitle]}>Cardiac Risk Factors</Text>
                        {cardiologySummary.riskFactors.map((factor: string, i: number) => (
                            <View key={i} style={styles.riskItem}>
                                <AlertTriangle size={16} color="#DC2626" />
                                <Text style={styles.riskText}>{factor}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </>
        );
    };

    const renderOrthopedicSummary = () => {
        if (loadingOrthopedic) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#059669" />
                    <Text style={styles.loadingText}>Loading orthopedic summary...</Text>
                </View>
            );
        }

        if (!orthopedicSummary) {
            return (
                <View style={styles.emptyState}>
                    <Bone size={48} color="#059669" />
                    <Text style={styles.emptyStateTitle}>No Orthopedic Data</Text>
                    <Text style={styles.emptyStateText}>
                        No orthopedic-specific information found for this patient
                    </Text>
                </View>
            );
        }

        return (
            <>
                {/* Orthopedic Diagnoses */}
                {orthopedicSummary.orthopedicDiagnoses?.length > 0 && (
                    <View style={[styles.card, { borderLeftColor: '#059669', borderLeftWidth: 4 }]}>
                        <Text style={[styles.cardTitle, { color: '#059669' }]}>Orthopedic Conditions</Text>
                        {orthopedicSummary.orthopedicDiagnoses.map((d: string, i: number) => (
                            <View key={i} style={styles.diagnosisItem}>
                                <Bone size={16} color="#059669" />
                                <Text style={styles.diagnosisText}>{d}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Orthopedic Medications */}
                {orthopedicSummary.orthopedicMedications?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Pain/Inflammation Medications</Text>
                        {orthopedicSummary.orthopedicMedications.map((m: string, i: number) => (
                            <View key={i} style={styles.medicationItem}>
                                <Pill size={16} color="#059669" />
                                <Text style={styles.medicationName}>{m}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Imaging Results */}
                {orthopedicSummary.imagingResults?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Imaging Results</Text>
                        {orthopedicSummary.imagingResults.map((img: string, i: number) => (
                            <View key={i} style={styles.testItem}>
                                <Activity size={16} color="#6B7280" />
                                <Text style={styles.testText}>{img}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Mobility Status */}
                {orthopedicSummary.mobilityStatus && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Mobility Status</Text>
                        <View style={styles.mobilityContainer}>
                            <Clock size={16} color="#059669" />
                            <Text style={styles.mobilityText}>{orthopedicSummary.mobilityStatus}</Text>
                        </View>
                    </View>
                )}
            </>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#2563EB" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Patient Summary</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading patient information...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!summary) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#2563EB" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Patient Summary</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.errorContainer}>
                    <AlertCircle size={48} color="#DC2626" />
                    <Text style={styles.errorText}>No patient information found</Text>
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
                <Text style={styles.title}>Patient Summary</Text>
                <TouchableOpacity style={styles.downloadButton} onPress={downloadSummary}>
                    <Download size={20} color="#2563EB" />
                </TouchableOpacity>
            </View>

            {renderTabBar()}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'general' && renderGeneralSummary()}
                {activeTab === 'cardiology' && renderCardiologySummary()}
                {activeTab === 'orthopedic' && renderOrthopedicSummary()}
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        gap: 6,
    },
    activeTab: {
        backgroundColor: '#EFF6FF',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#2563EB',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#DC2626',
        marginTop: 12,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
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
        textAlign: 'center',
        marginTop: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    criticalCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
    },
    riskCard: {
        backgroundColor: '#FEF2F2',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2563EB',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    criticalTitle: {
        color: '#DC2626',
    },
    riskTitle: {
        color: '#DC2626',
    },
    patientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
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
    patientHeaderInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 18,
        fontWeight: '700',
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
        paddingVertical: 6,
        borderRadius: 20,
    },
    bloodGroupText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563EB',
    },
    patientDetails: {
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#4B5563',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
    listItem: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
        marginLeft: 4,
    },
    allergyText: {
        color: '#DC2626',
    },
    addressText: {
        fontSize: 14,
        color: '#1E293B',
        lineHeight: 20,
    },
    medicationItem: {
        marginBottom: 8,
    },
    medicationName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1E293B',
    },
    medicationDetail: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 16,
        marginTop: 2,
    },
    historyItem: {
        marginBottom: 10,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    historyDetail: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 16,
        marginTop: 2,
    },
    diagnosisItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    diagnosisText: {
        fontSize: 14,
        color: '#1E293B',
    },
    vitalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    vitalLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    vitalValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
    testItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    testText: {
        fontSize: 14,
        color: '#4B5563',
        flex: 1,
    },
    riskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    riskText: {
        fontSize: 14,
        color: '#DC2626',
        flex: 1,
    },
    mobilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mobilityText: {
        fontSize: 14,
        color: '#1E293B',
    },
});