import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, User, Mail, Stethoscope, GraduationCap, Briefcase, Building2, MapPin } from 'lucide-react-native';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const C = {
    bg: '#F3F6FD',
    surface: '#FFFFFF',
    primary: '#1A56DB',
    primaryLight: '#EBF2FF',
    textDark: '#0D1B3E',
    textMid: '#4A5A7A',
    textLight: '#9AAABE',
    border: '#DDE4F5',
    danger: '#DC2626',
    success: '#059669',
};

export default function DoctorEditProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        qualification: '',
        experience: '',
        hospitalName: '',
        hospitalAddress: '',
    });

    const router = useRouter();
    const { refreshUserData } = useAuth();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await ApiService.getDoctorProfile();
            if (res.success && res.data) {
                setFormData({
                    name: res.data.name || '',
                    email: res.data.email || '',
                    phone: res.data.phone || '',
                    specialization: res.data.specialization || '',
                    qualification: res.data.qualification || '',
                    experience: res.data.experience ? String(res.data.experience) : '',
                    hospitalName: res.data.hospitalName || '',
                    hospitalAddress: res.data.hospitalAddress || '',
                });
            }
        } catch (error) {
            console.error('Load profile error:', error);
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        if (!formData.email.trim()) {
            Alert.alert('Error', 'Email is required');
            return;
        }
        if (!formData.specialization.trim()) {
            Alert.alert('Error', 'Specialization is required');
            return;
        }

        setSaving(true);
        try {
            const updates: Record<string, any> = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                specialization: formData.specialization.trim(),
                qualification: formData.qualification.trim(),
                experience: formData.experience ? parseInt(formData.experience) : 0,
                hospitalName: formData.hospitalName.trim(),
                hospitalAddress: formData.hospitalAddress.trim(),
            };

            const res = await ApiService.updateDoctorProfile(updates);
            if (res.success) {
                await refreshUserData();
                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', res.message || 'Failed to update profile');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={C.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
                        {saving ? <ActivityIndicator size="small" color={C.primary} /> : <Save size={20} color={C.primary} />}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Personal Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>

                        <View style={styles.field}>
                            <User size={18} color={C.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholderTextColor={C.textLight}
                            />
                        </View>

                        <View style={styles.field}>
                            <Mail size={18} color={C.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={C.textLight}
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.phonePrefix}>+91</Text>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                keyboardType="phone-pad"
                                placeholderTextColor={C.textLight}
                            />
                        </View>
                    </View>

                    {/* Professional Details */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Professional Details</Text>

                        <View style={styles.field}>
                            <Stethoscope size={18} color={C.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Specialization *"
                                value={formData.specialization}
                                onChangeText={(text) => setFormData({ ...formData, specialization: text })}
                                placeholderTextColor={C.textLight}
                            />
                        </View>

                        <View style={styles.field}>
                            <GraduationCap size={18} color={C.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Qualification (e.g., MBBS, MD)"
                                value={formData.qualification}
                                onChangeText={(text) => setFormData({ ...formData, qualification: text })}
                                placeholderTextColor={C.textLight}
                            />
                        </View>

                        <View style={styles.field}>
                            <Briefcase size={18} color={C.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Years of Experience"
                                value={formData.experience}
                                onChangeText={(text) => setFormData({ ...formData, experience: text })}
                                keyboardType="numeric"
                                placeholderTextColor={C.textLight}
                            />
                        </View>
                    </View>

                    {/* Hospital Details */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Hospital / Clinic Details</Text>

                        <View style={styles.field}>
                            <Building2 size={18} color={C.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Hospital / Clinic Name"
                                value={formData.hospitalName}
                                onChangeText={(text) => setFormData({ ...formData, hospitalName: text })}
                                placeholderTextColor={C.textLight}
                            />
                        </View>

                        <View style={[styles.field, styles.addressField]}>
                            <MapPin size={18} color={C.textLight} />
                            <TextInput
                                style={[styles.input, styles.multiline]}
                                placeholder="Hospital Address"
                                value={formData.hospitalAddress}
                                onChangeText={(text) => setFormData({ ...formData, hospitalAddress: text })}
                                multiline
                                numberOfLines={2}
                                placeholderTextColor={C.textLight}
                            />
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    flex: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: C.textMid },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backButton: { padding: 8, borderRadius: 8, backgroundColor: C.primaryLight },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
    saveButton: { padding: 8, borderRadius: 8, backgroundColor: C.primaryLight },

    content: { padding: 20, paddingBottom: 40 },

    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.primary,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
    },
    addressField: {
        alignItems: 'flex-start',
        paddingTop: 12,
    },
    phonePrefix: {
        fontSize: 15,
        color: C.textDark,
        fontWeight: '600',
        paddingRight: 8,
        borderRightWidth: 1,
        borderRightColor: C.border,
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: C.textDark,
    },
    multiline: {
        paddingTop: 12,
        minHeight: 60,
        textAlignVertical: 'top',
    },
});