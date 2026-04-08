import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
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
    X,
    Brain,
} from 'lucide-react-native';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type SummaryType = 'general' | 'cardiology' | 'orthopedic' | 'slm';

interface PatientSummary {
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
    currentMedications?: Array<{ name?: string; purpose?: string; dosage?: string }>;
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
    diagnoses?: string[];
    patientInfo?: {
        name?: string;
        patientId?: string;
        age?: string;
        sex?: string;
        bloodGroup?: string;
        phone?: string;
        email?: string;
    };
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
    orthopedicDiagnoses?: string[];
    orthopedicMedications?: string[];
    imagingResults?: string[];
    mobilityStatus?: string;
    lastUpdated?: string;
    documentCount?: number;
    version?: number;
    hospitals?: string[];
    doctors?: string[];
}

interface SLMSummary {
    success: boolean;
    summary: string;
    structured_summary?: any;
    type: string;
    timestamp: string;
}

export default function PatientSummary() {
    const { patientId } = useLocalSearchParams();
    const { userRole, userData: authUserData } = useAuth();
    const [summary, setSummary] = useState<PatientSummary | null>(null);
    const [cardiologySummary, setCardiologySummary] = useState<any>(null);
    const [orthopedicSummary, setOrthopedicSummary] = useState<any>(null);
    const [slmSummary, setSlmSummary] = useState<SLMSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingCardiology, setLoadingCardiology] = useState(false);
    const [loadingOrthopedic, setLoadingOrthopedic] = useState(false);
    const [loadingSLM, setLoadingSLM] = useState(false);
    const [activeTab, setActiveTab] = useState<SummaryType>('general');
    const router = useRouter();

    const isOwnSummary = userRole === 'patient';

    useEffect(() => {
        loadPatientSummary();
    }, [patientId]);

    useEffect(() => {
        if (activeTab === 'slm' && !slmSummary && !loadingSLM) {
            loadSLMSummary();
        } else if (activeTab === 'cardiology' && !cardiologySummary && !loadingCardiology) {
            loadCardiologySummary();
        } else if (activeTab === 'orthopedic' && !orthopedicSummary && !loadingOrthopedic) {
            loadOrthopedicSummary();
        }
    }, [activeTab]);

    useEffect(() => {
        console.log('📊 Summary data updated:', summary);
    }, [summary]);

    const loadPatientSummary = async () => {
        try {
            setLoading(true);

            let response;
            if (isOwnSummary) {
                response = await ApiService.getPatientSummary();
            } else {
                response = await ApiService.getPatientSummaryDoctor(patientId as string);
            }

            console.log('📊 Full Summary Response:', JSON.stringify(response.data, null, 2));
            if (response.success && response.data) {
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

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPatientSummary();
        setRefreshing(false);
    };

    const loadCardiologySummary = async () => {
        try {
            setLoadingCardiology(true);

            let response;
            if (isOwnSummary) {
                response = await ApiService.getCardiologySummary();
            } else {
                response = await ApiService.getPatientCardiologySummary(patientId as string);
            }

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

            let response;
            if (isOwnSummary) {
                response = await ApiService.getOrthopedicSummary();
            } else {
                response = await ApiService.getPatientOrthopedicSummary(patientId as string);
            }

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

    const loadSLMSummary = async () => {
        try {
            setLoadingSLM(true);

            let response;
            if (isOwnSummary) {
                response = await ApiService.getMySLMSummary();
            } else {
                response = await ApiService.getPatientSLMSummaryDoctor(patientId as string);
            }

            if (response.success) {
                setSlmSummary(response.data);
            }
        } catch (error) {
            console.error('Error loading SLM summary:', error);
        } finally {
            setLoadingSLM(false);
        }
    };

    const handleTabChange = (tab: SummaryType) => {
        setActiveTab(tab);
    };

    const downloadSummary = async () => {
        if (!summary) return;

        try {
            let textSummary = `PATIENT MEDICAL SUMMARY\n`;
            textSummary += `=====================\n\n`;

            const patientName = summary.patientDemographics?.name || summary.patientInfo?.name || 'N/A';
            const patientId_ = summary.patientDemographics?.patientId || summary.patientInfo?.patientId || 'N/A';
            const bloodGroup = summary.medicalProfile?.bloodGroup || summary.patientInfo?.bloodGroup || 'Not specified';
            const age = summary.patientDemographics?.age || summary.patientInfo?.age || 'Unknown';
            const gender = summary.patientDemographics?.gender || summary.patientInfo?.sex || 'Unknown';

            textSummary += `Patient: ${patientName}\n`;
            textSummary += `ID: ${patientId_}\n`;
            textSummary += `Blood Group: ${bloodGroup}\n`;
            textSummary += `Age/Gender: ${age}/${gender}\n\n`;

            if (summary.address && summary.address !== 'NA') {
                textSummary += `ADDRESS\n`;
                textSummary += `-------\n`;
                textSummary += `${summary.address}\n\n`;
            }

            if (summary.emergencyContact && summary.emergencyContact.name !== 'NA') {
                textSummary += `EMERGENCY CONTACT\n`;
                textSummary += `-----------------\n`;
                textSummary += `Name: ${summary.emergencyContact.name}\n`;
                textSummary += `Relationship: ${summary.emergencyContact.relationship}\n`;
                textSummary += `Phone: ${summary.emergencyContact.phone}\n\n`;
            }

            // Allergies
            if (summary.allergies && summary.allergies.length > 0) {
                const hasRealAllergies = summary.allergies.some(item => {
                    const name = typeof item === 'string' ? item : item.name;
                    return name && name !== 'NA';
                });
                if (hasRealAllergies) {
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
            }

            // Comorbid Conditions
            if (summary.comorbidConditions && summary.comorbidConditions.length > 0) {
                const hasRealConditions = summary.comorbidConditions.some(item => {
                    const name = typeof item === 'string' ? item : item.name;
                    return name && name !== 'NA';
                });
                if (hasRealConditions) {
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
            }

            // Chronic Diseases
            if (summary.chronicDiseases && summary.chronicDiseases.length > 0) {
                const hasRealDiseases = summary.chronicDiseases.some(item => {
                    const name = typeof item === 'string' ? item : item.name;
                    return name && name !== 'NA';
                });
                if (hasRealDiseases) {
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
            }

            // Current Medications
            if (summary.currentMedications && summary.currentMedications.length > 0) {
                const hasRealMeds = summary.currentMedications.some(med => med.name && med.name !== 'NA');
                if (hasRealMeds) {
                    textSummary += `CURRENT MEDICATIONS\n`;
                    textSummary += `-------------------\n`;
                    summary.currentMedications.forEach(item => {
                        if (item.name && item.name !== 'NA') {
                            textSummary += `• ${item.name}`;
                            if (item.dosage && item.dosage !== 'NA') textSummary += ` (${item.dosage})`;
                            if (item.purpose && item.purpose !== 'NA') textSummary += ` - ${item.purpose}`;
                            textSummary += '\n';
                        }
                    });
                    textSummary += '\n';
                }
            }

            // Past Surgeries
            if (summary.pastSurgeries && summary.pastSurgeries.length > 0) {
                const hasRealSurgeries = summary.pastSurgeries.some(s => s.name && s.name !== 'NA');
                if (hasRealSurgeries) {
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
            }

            // Major Surgeries/Illness
            if (summary.majorSurgeriesOrIllness && summary.majorSurgeriesOrIllness.length > 0) {
                const hasRealMajor = summary.majorSurgeriesOrIllness.some(i => i.name && i.name !== 'NA');
                if (hasRealMajor) {
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
            }

            // Previous Interventions
            if (summary.previousInterventions && summary.previousInterventions.length > 0) {
                const hasRealInterventions = summary.previousInterventions.some(i => i.name && i.name !== 'NA');
                if (hasRealInterventions) {
                    textSummary += `PREVIOUS INTERVENTIONS\n`;
                    textSummary += `----------------------\n`;
                    summary.previousInterventions.forEach(i => {
                        if (i.name && i.name !== 'NA') {
                            textSummary += `• ${i.name}`;
                            if (i.date && i.date !== 'NA') textSummary += ` - ${i.date}`;
                            if (i.hospital && i.hospital !== 'NA') textSummary += ` at ${i.hospital}`;
                            textSummary += '\n';
                        }
                    });
                    textSummary += '\n';
                }
            }

            // Blood Thinner History
            if (summary.bloodThinnerHistory && summary.bloodThinnerHistory.length > 0) {
                const hasRealThinners = summary.bloodThinnerHistory.some(bt => bt.name && bt.name !== 'NA');
                if (hasRealThinners) {
                    textSummary += `BLOOD THINNER HISTORY\n`;
                    textSummary += `---------------------\n`;
                    summary.bloodThinnerHistory.forEach(bt => {
                        if (bt.name && bt.name !== 'NA') {
                            textSummary += `• ${bt.name}`;
                            if (bt.type && bt.type !== 'NA') textSummary += ` (${bt.type})`;
                            if (bt.duration && bt.duration !== 'NA') textSummary += ` - ${bt.duration}`;
                            if (bt.reason && bt.reason !== 'NA') textSummary += ` - ${bt.reason}`;
                            textSummary += '\n';
                        }
                    });
                    textSummary += '\n';
                }
            }

            // Hospitals
            if (summary.hospitals && summary.hospitals.length > 0 && summary.hospitals[0] !== 'NA') {
                textSummary += `HOSPITALS\n`;
                textSummary += `---------\n`;
                summary.hospitals.forEach(hospital => {
                    textSummary += `• ${hospital}\n`;
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

    const downloadSLMSummary = async () => {
        if (!slmSummary) return;

        try {
            const fileName = `AI_Medical_Summary_${Date.now()}.txt`;
            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, slmSummary.summary);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Success', 'AI Summary saved to device');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not download AI summary');
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

            <TouchableOpacity
                style={[styles.tab, activeTab === 'slm' && styles.activeSLMTab]}
                onPress={() => handleTabChange('slm')}
            >
                <Brain size={16} color={activeTab === 'slm' ? '#8B5CF6' : '#64748B'} />
                <Text style={[styles.tabText, activeTab === 'slm' && styles.activeSLMTabText]}>
                    AI Summary
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderGeneralSummary = () => {
        if (!summary) return null;

        return (
            <>
                {/* PATIENT DEMOGRAPHICS */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>PATIENT DEMOGRAPHICS</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{summary.patientDemographics?.name || 'NA'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Patient ID:</Text>
                        <Text style={styles.infoValue}>{summary.patientDemographics?.patientId || 'NA'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date of Birth:</Text>
                        <Text style={styles.infoValue}>{summary.patientDemographics?.dateOfBirth || 'NA'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Age:</Text>
                        <Text style={styles.infoValue}>{summary.patientDemographics?.age || 'NA'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Gender:</Text>
                        <Text style={styles.infoValue}>{summary.patientDemographics?.gender || 'NA'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={styles.infoValue}>{summary.patientDemographics?.email || 'NA'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={styles.infoValue}>{summary.patientDemographics?.phone || 'NA'}</Text>
                    </View>
                </View>

                {/* ADDRESS */}
                {summary.address && summary.address !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>ADDRESS</Text>
                        <Text style={styles.addressText}>{summary.address}</Text>
                    </View>
                )}

                {/* MEDICAL PROFILE */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>MEDICAL PROFILE</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Blood Group:</Text>
                        <Text style={styles.infoValue}>{summary.medicalProfile?.bloodGroup || 'NA'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Diabetic:</Text>
                        <Text style={styles.infoValue}>{summary.medicalProfile?.isDiabetic || 'NA'}</Text>
                    </View>
                    {summary.medicalProfile?.diabetesType && summary.medicalProfile?.diabetesType !== 'NA' && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Diabetes Type:</Text>
                            <Text style={styles.infoValue}>{summary.medicalProfile?.diabetesType}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Thyroid Condition:</Text>
                        <Text style={styles.infoValue}>{summary.medicalProfile?.thyroidCondition || 'NA'}</Text>
                    </View>
                </View>

                {/* ALLERGIES */}
                {summary.allergies && summary.allergies.length > 0 && summary.allergies[0]?.name !== 'NA' && (
                    <View style={[styles.card, styles.criticalCard]}>
                        <Text style={[styles.cardTitle, styles.criticalTitle]}>ALLERGIES</Text>
                        {summary.allergies.map((allergy, i) => {
                            const allergyName = typeof allergy === 'string' ? allergy : allergy.name;
                            if (allergyName && allergyName !== 'NA') {
                                return <Text key={i} style={[styles.listItem, styles.allergyText]}>• {allergyName}</Text>;
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* COMORBID CONDITIONS */}
                {summary.comorbidConditions && summary.comorbidConditions.length > 0 && summary.comorbidConditions[0]?.name !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>COMORBID CONDITIONS</Text>
                        {summary.comorbidConditions.map((condition, i) => {
                            const conditionName = typeof condition === 'string' ? condition : condition.name;
                            if (conditionName && conditionName !== 'NA') {
                                return <Text key={i} style={styles.listItem}>• {conditionName}</Text>;
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* CHRONIC DISEASES */}
                {summary.chronicDiseases && summary.chronicDiseases.length > 0 && summary.chronicDiseases[0]?.name !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>CHRONIC DISEASES</Text>
                        {summary.chronicDiseases.map((disease, i) => {
                            const diseaseName = typeof disease === 'string' ? disease : disease.name;
                            if (diseaseName && diseaseName !== 'NA') {
                                return <Text key={i} style={styles.listItem}>• {diseaseName}</Text>;
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* CURRENT MEDICATIONS */}
                {summary.currentMedications && summary.currentMedications.length > 0 && summary.currentMedications[0]?.name !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>CURRENT MEDICATIONS</Text>
                        {summary.currentMedications.map((med, i) => {
                            if (med.name && med.name !== 'NA') {
                                return (
                                    <View key={i} style={styles.medicationItem}>
                                        <Text style={styles.medicationName}>• {med.name}</Text>
                                        {med.dosage && med.dosage !== 'NA' && <Text style={styles.medicationDetail}>  Dosage: {med.dosage}</Text>}
                                        {med.purpose && med.purpose !== 'NA' && <Text style={styles.medicationDetail}>  Purpose: {med.purpose}</Text>}
                                    </View>
                                );
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* PAST SURGERIES */}
                {summary.pastSurgeries && summary.pastSurgeries.length > 0 && summary.pastSurgeries[0]?.name !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>PAST SURGERIES</Text>
                        {summary.pastSurgeries.map((surgery, i) => {
                            if (surgery.name && surgery.name !== 'NA') {
                                return (
                                    <View key={i} style={styles.historyItem}>
                                        <Text style={styles.historyTitle}>• {surgery.name}</Text>
                                        {surgery.date && surgery.date !== 'NA' && <Text style={styles.historyDetail}>  Date: {surgery.date}</Text>}
                                        {surgery.hospital && surgery.hospital !== 'NA' && <Text style={styles.historyDetail}>  Hospital: {surgery.hospital}</Text>}
                                        {surgery.surgeon && surgery.surgeon !== 'NA' && <Text style={styles.historyDetail}>  Surgeon: {surgery.surgeon}</Text>}
                                    </View>
                                );
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* MAJOR SURGERIES / ILLNESS */}
                {summary.majorSurgeriesOrIllness && summary.majorSurgeriesOrIllness.length > 0 && summary.majorSurgeriesOrIllness[0]?.name !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>MAJOR SURGERIES / ILLNESS</Text>
                        {summary.majorSurgeriesOrIllness.map((illness, i) => {
                            if (illness.name && illness.name !== 'NA') {
                                return (
                                    <View key={i} style={styles.historyItem}>
                                        <Text style={styles.historyTitle}>• {illness.name}</Text>
                                        {illness.date && illness.date !== 'NA' && <Text style={styles.historyDetail}>  Date: {illness.date}</Text>}
                                        {illness.hospital && illness.hospital !== 'NA' && <Text style={styles.historyDetail}>  Hospital: {illness.hospital}</Text>}
                                        {illness.notes && illness.notes !== 'NA' && <Text style={styles.historyDetail}>  Notes: {illness.notes}</Text>}
                                    </View>
                                );
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* PREVIOUS INTERVENTIONS */}
                {summary.previousInterventions && summary.previousInterventions.length > 0 && summary.previousInterventions[0]?.name !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>PREVIOUS INTERVENTIONS</Text>
                        {summary.previousInterventions.map((intervention, i) => {
                            if (intervention.name && intervention.name !== 'NA') {
                                return (
                                    <View key={i} style={styles.historyItem}>
                                        <Text style={styles.historyTitle}>• {intervention.name}</Text>
                                        {intervention.date && intervention.date !== 'NA' && <Text style={styles.historyDetail}>  Date: {intervention.date}</Text>}
                                        {intervention.hospital && intervention.hospital !== 'NA' && <Text style={styles.historyDetail}>  Hospital: {intervention.hospital}</Text>}
                                    </View>
                                );
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* BLOOD THINNER HISTORY */}
                {summary.bloodThinnerHistory && summary.bloodThinnerHistory.length > 0 && summary.bloodThinnerHistory[0]?.name !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>BLOOD THINNER HISTORY</Text>
                        {summary.bloodThinnerHistory.map((bt, i) => {
                            if (bt.name && bt.name !== 'NA') {
                                return (
                                    <View key={i} style={styles.historyItem}>
                                        <Text style={styles.historyTitle}>• {bt.name}</Text>
                                        {bt.type && bt.type !== 'NA' && <Text style={styles.historyDetail}>  Type: {bt.type}</Text>}
                                        {bt.duration && bt.duration !== 'NA' && <Text style={styles.historyDetail}>  Duration: {bt.duration}</Text>}
                                        {bt.reason && bt.reason !== 'NA' && <Text style={styles.historyDetail}>  Reason: {bt.reason}</Text>}
                                    </View>
                                );
                            }
                            return null;
                        })}
                    </View>
                )}

                {/* EMERGENCY CONTACT */}
                {summary.emergencyContact && summary.emergencyContact.name !== 'NA' && (
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

                {/* HOSPITALS */}
                {summary.hospitals && summary.hospitals.length > 0 && summary.hospitals[0] !== 'NA' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>HOSPITALS</Text>
                        {summary.hospitals.map((hospital, i) => (
                            <Text key={i} style={styles.listItem}>• {hospital}</Text>
                        ))}
                    </View>
                )}

                {/* MEDICAL HISTORY */}
                {summary.medicalHistory && summary.medicalHistory.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>MEDICAL HISTORY</Text>
                        {summary.medicalHistory.map((yearData, yIndex) => (
                            <View key={yIndex} style={styles.yearContainer}>
                                <Text style={styles.yearTitle}>YEAR {yearData.year}</Text>
                                {yearData.months?.map((monthData, mIndex) => (
                                    <View key={mIndex} style={styles.monthContainer}>
                                        <Text style={styles.monthTitle}>{monthData.month}</Text>
                                        {monthData.records?.map((record, rIndex) => (
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

                {cardiologySummary.cardiacMedications?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Cardiac Medications</Text>
                        {cardiologySummary.cardiacMedications.map((m: any, i: number) => {
                            if (typeof m === 'object' && m.name && m.name !== 'NA') {
                                return (
                                    <View key={i} style={styles.medicationItem}>
                                        <Text style={styles.medicationName}>• {m.name}</Text>
                                        {m.dosage && m.dosage !== 'NA' && <Text style={styles.medicationDetail}>  Dosage: {m.dosage}</Text>}
                                        {m.purpose && m.purpose !== 'NA' && <Text style={styles.medicationDetail}>  Purpose: {m.purpose}</Text>}
                                    </View>
                                );
                            } else if (typeof m === 'string' && m !== 'NA') {
                                return <Text key={i} style={styles.listItem}>• {m}</Text>;
                            }
                            return null;
                        })}
                    </View>
                )}

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

                {orthopedicSummary.orthopedicMedications?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Pain/Inflammation Medications</Text>
                        {orthopedicSummary.orthopedicMedications.map((m: any, i: number) => {
                            if (typeof m === 'object' && m.name && m.name !== 'NA') {
                                return (
                                    <View key={i} style={styles.medicationItem}>
                                        <Text style={styles.medicationName}>• {m.name}</Text>
                                        {m.dosage && m.dosage !== 'NA' && <Text style={styles.medicationDetail}>  Dosage: {m.dosage}</Text>}
                                        {m.purpose && m.purpose !== 'NA' && <Text style={styles.medicationDetail}>  Purpose: {m.purpose}</Text>}
                                    </View>
                                );
                            } else if (typeof m === 'string' && m !== 'NA') {
                                return <Text key={i} style={styles.listItem}>• {m}</Text>;
                            }
                            return null;
                        })}
                    </View>
                )}

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

                {orthopedicSummary.mobilityStatus && orthopedicSummary.mobilityStatus !== 'NA' && (
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

    const renderSLMSummary = () => {
        if (loadingSLM) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={styles.loadingText}>Generating AI summary...</Text>
                </View>
            );
        }

        if (!slmSummary) {
            return (
                <View style={styles.emptyState}>
                    <Brain size={48} color="#8B5CF6" />
                    <Text style={styles.emptyStateTitle}>No AI Summary Yet</Text>
                    <Text style={styles.emptyStateText}>
                        Upload documents to generate AI-powered medical summaries
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.slmContainer}>
                <View style={styles.slmHeader}>
                    <View style={styles.slmTitleContainer}>
                        <Brain size={24} color="#8B5CF6" />
                        <Text style={styles.slmTitle}>AI-Generated Medical Summary</Text>
                    </View>
                    <TouchableOpacity onPress={downloadSLMSummary} style={styles.slmDownloadButton}>
                        <Download size={20} color="#8B5CF6" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.slmContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.slmSummaryText}>{slmSummary.summary}</Text>
                    <Text style={styles.slmTimestamp}>
                        Generated: {new Date(slmSummary.timestamp).toLocaleString()}
                    </Text>
                </ScrollView>
            </View>
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
                <TouchableOpacity style={styles.downloadButton} onPress={activeTab === 'slm' ? downloadSLMSummary : downloadSummary}>
                    <Download size={20} color={activeTab === 'slm' ? '#8B5CF6' : '#2563EB'} />
                </TouchableOpacity>
            </View>

            {renderTabBar()}

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'general' && renderGeneralSummary()}
                {activeTab === 'cardiology' && renderCardiologySummary()}
                {activeTab === 'orthopedic' && renderOrthopedicSummary()}
                {activeTab === 'slm' && renderSLMSummary()}
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
    activeSLMTab: {
        backgroundColor: '#F3E8FF',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#2563EB',
    },
    activeSLMTabText: {
        color: '#8B5CF6',
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
        fontSize: 18,
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
        fontWeight: '600',
        color: '#1E293B',
    },
    medicationDetail: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 16,
        marginTop: 2,
    },
    historyItem: {
        marginBottom: 12,
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
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8,
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
    slmContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    slmHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    slmTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    slmTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    slmDownloadButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3E8FF',
    },
    slmContent: {
        maxHeight: 500,
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
});