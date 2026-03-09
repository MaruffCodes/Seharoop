import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';

interface FormValues {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;

  // Address
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  addressCountry: string;

  // Medical Profile
  bloodGroup: string;
  isDiabetic: boolean;
  diabetesType?: string;
  hasThyroid: boolean;
  thyroidCondition?: string;

  // Allergies
  medicationAllergies: string;

  // Comorbid Conditions
  comorbidConditions: string;

  // Chronic Diseases
  chronicDiseases: string;

  // Current Medications
  currentMedications: string;

  // Past Surgeries
  pastSurgeries: string;

  // Major Surgeries / Illness
  majorSurgeriesOrIllness: string;

  // Previous Interventions
  previousInterventions: string;

  // Blood Thinner History
  bloodThinner: boolean;
  bloodThinnerDetails?: string;

  // Emergency Contact
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

interface PatientMedicalFormProps {
  onSave?: () => void;
  onClose?: () => void;
}

const PatientMedicalForm: React.FC<PatientMedicalFormProps> = ({ onSave, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { completeFirstLogin, userData } = useAuth();

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        // Personal Information
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',

        // Address
        addressStreet: '',
        addressCity: '',
        addressState: '',
        addressPincode: '',
        addressCountry: 'India',

        // Medical Profile
        bloodGroup: '',
        isDiabetic: false,
        diabetesType: '',
        hasThyroid: false,
        thyroidCondition: '',

        // Allergies
        medicationAllergies: '',

        // Comorbid Conditions
        comorbidConditions: '',

        // Chronic Diseases
        chronicDiseases: '',

        // Current Medications
        currentMedications: '',

        // Past Surgeries
        pastSurgeries: '',

        // Major Surgeries / Illness
        majorSurgeriesOrIllness: '',

        // Previous Interventions
        previousInterventions: '',

        // Blood Thinner History
        bloodThinner: false,
        bloodThinnerDetails: '',

        // Emergency Contact
        emergencyName: '',
        emergencyRelationship: '',
        emergencyPhone: '',
      }
    });

  const watchIsDiabetic = watch('isDiabetic', false);
  const watchHasThyroid = watch('hasThyroid', false);
  const watchBloodThinner = watch('bloodThinner', false);

  // ✅ Fetch existing medical form
  useEffect(() => {
    const fetchMedicalForm = async () => {
      setIsLoading(true);
      try {
        const response = await ApiService.getMedicalForm();
        if (response?.success && response?.data) {
          const formData = response.data;

          // Format date of birth
          let formattedDob = '';
          if (formData.personalInfo?.dateOfBirth) {
            const dob = new Date(formData.personalInfo.dateOfBirth);
            formattedDob = dob.toISOString().split('T')[0];
          }

          reset({
            // Personal Information
            fullName: userData?.name || formData.personalInfo?.fullName || '',
            email: userData?.email || formData.personalInfo?.email || '',
            phone: formData.personalInfo?.phone || '',
            dateOfBirth: formattedDob,
            gender: formData.personalInfo?.gender || '',

            // Address
            addressStreet: formData.personalInfo?.address?.street || '',
            addressCity: formData.personalInfo?.address?.city || '',
            addressState: formData.personalInfo?.address?.state || '',
            addressPincode: formData.personalInfo?.address?.pincode || '',
            addressCountry: formData.personalInfo?.address?.country || 'India',

            // Medical Profile
            bloodGroup: formData.personalInfo?.bloodGroup || userData?.bloodGroup || '',
            isDiabetic: formData.medicalConditions?.isDiabetic || false,
            diabetesType: formData.medicalConditions?.diabetesType || '',
            hasThyroid: formData.medicalConditions?.hasThyroid || false,
            thyroidCondition: formData.medicalConditions?.thyroidCondition || '',

            // Allergies
            medicationAllergies: (formData.medicalConditions?.medicationAllergies || [])
              .map((a: any) => a.medication).join(', ') || '',

            // Comorbid Conditions
            comorbidConditions: (formData.medicalConditions?.comorbidConditions || []).join(', ') || '',

            // Chronic Diseases
            chronicDiseases: (formData.medicalConditions?.chronicDiseases || []).join(', ') || '',

            // Current Medications
            currentMedications: (formData.medications?.currentMedications || [])
              .map((m: any) => `${m.name} ${m.dosage}`).join(', ') || '',

            // Past Surgeries
            pastSurgeries: (formData.surgicalHistory?.pastSurgeries || [])
              .map((s: any) => `${s.surgery} (${s.date ? new Date(s.date).toLocaleDateString() : 'Date N/A'})`).join(', ') || '',

            // Major Surgeries / Illness
            majorSurgeriesOrIllness: (formData.surgicalHistory?.majorIllnesses || [])
              .map((i: any) => `${i.illness} (${i.year || 'Date N/A'})`).join(', ') || '',

            // Previous Interventions
            previousInterventions: (formData.surgicalHistory?.previousInterventions || [])
              .map((i: any) => i.name).join(', ') || '',

            // Blood Thinner History
            bloodThinner: (formData.medications?.bloodThinnerHistory?.length || 0) > 0,
            bloodThinnerDetails: (formData.medications?.bloodThinnerHistory || [])
              .map((b: any) => `${b.name} - ${b.reason}`).join(', ') || '',

            // Emergency Contact
            emergencyName: formData.emergencyContact?.name || '',
            emergencyRelationship: formData.emergencyContact?.relationship || '',
            emergencyPhone: formData.emergencyContact?.phone || '',
          });

          // If form exists, we're in edit mode
          setIsEditMode(true);
        }
      } catch (error) {
        console.log("Medical form fetch error:", error);
        // 404 is expected if no form exists yet - stay in create mode
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicalForm();
  }, [reset, userData]);

  // ✅ Refresh QR code after form update
  const refreshQRCode = async (): Promise<void> => {
    try {
      await ApiService.refreshQRCode();
      console.log('✅ QR code refreshed after form update');
    } catch (error) {
      console.error('Error refreshing QR code:', error);
    }
  };

  // ✅ Submit medical form
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Parse comma-separated strings into arrays
      const medicationAllergiesArray = data.medicationAllergies
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const comorbidConditionsArray = data.comorbidConditions
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const chronicDiseasesArray = data.chronicDiseases
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const currentMedicationsArray = data.currentMedications
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(med => ({
          name: med,
          dosage: 'As prescribed',
          frequency: 'As directed',
          isActive: true
        }));

      const pastSurgeriesArray = data.pastSurgeries
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(surgery => ({
          surgery: surgery,
          date: new Date(),
          hospital: 'Not specified',
          surgeon: 'Not specified'
        }));

      const majorIllnessesArray = data.majorSurgeriesOrIllness
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(illness => ({
          illness: illness,
          year: new Date().getFullYear().toString(),
          hospital: 'Not specified',
          notes: ''
        }));

      const previousInterventionsArray = data.previousInterventions
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(intervention => ({
          name: intervention,
          date: new Date(),
          hospital: 'Not specified'
        }));

      // Transform form data to match backend schema
      const formattedData = {
        personalInfo: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          address: {
            street: data.addressStreet,
            city: data.addressCity,
            state: data.addressState,
            pincode: data.addressPincode,
            country: data.addressCountry || 'India'
          }
        },
        medicalConditions: {
          isDiabetic: data.isDiabetic,
          diabetesType: data.diabetesType,
          hasThyroid: data.hasThyroid,
          thyroidCondition: data.thyroidCondition,
          comorbidConditions: comorbidConditionsArray,
          chronicDiseases: chronicDiseasesArray,
          medicationAllergies: medicationAllergiesArray.map(allergy => ({
            medication: allergy,
            reaction: 'Unknown',
            severity: 'Moderate'
          })),
        },
        medications: {
          currentMedications: currentMedicationsArray,
          bloodThinnerHistory: data.bloodThinner ? [{
            name: data.bloodThinnerDetails || 'Blood thinner',
            type: 'Anticoagulant',
            duration: 'Ongoing',
            reason: 'As prescribed'
          }] : []
        },
        surgicalHistory: {
          pastSurgeries: pastSurgeriesArray,
          majorIllnesses: majorIllnessesArray,
          previousInterventions: previousInterventionsArray
        },
        emergencyContact: {
          name: data.emergencyName,
          relationship: data.emergencyRelationship,
          phone: data.emergencyPhone
        },
        completionStatus: {
          isComplete: true,
          completionDate: new Date()
        }
      };

      const response = await ApiService.submitMedicalForm(formattedData);

      if (response && response.success) {
        // Refresh QR code to update summary
        await refreshQRCode();

        Alert.alert(
          "Success",
          isEditMode ? "Medical form updated successfully! QR code has been refreshed." : "Medical form submitted successfully!",
          [
            {
              text: "OK",
              onPress: async () => {
                if (!isEditMode) {
                  await completeFirstLogin();
                }
                // Call onSave callback if provided
                if (onSave) {
                  onSave();
                }
                // Call onClose callback if provided
                if (onClose) {
                  onClose();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response?.message || "Failed to submit form. Please try again."
        );
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      Alert.alert(
        "Error",
        error.message || "Submission failed. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Handle Save button press
  const handleSave = handleSubmit(onSubmit);

  const renderRadioButton = (
    fieldName: string,
    value: boolean,
    label: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={styles.radioContainer}
      onPress={onPress}
      disabled={isSubmitting}
    >
      <View style={[styles.radioButton, value && styles.radioButtonSelected]}>
        {value && <View style={styles.radioInnerCircle} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your information...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.heading}>
              {isEditMode ? 'Edit Medical Profile' : 'Complete Your Medical Profile'}
            </Text>
            <Text style={styles.subheading}>
              Please provide your medical information to help doctors better understand your health history.
            </Text>
          </View>

          {/* PATIENT DEMOGRAPHICS */}
          <Text style={styles.sectionTitle}>PATIENT DEMOGRAPHICS</Text>

          {/* Full Name */}
          <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
          <Controller
            control={control}
            name="fullName"
            rules={{ required: "Full name is required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Enter your full name"
                  onChangeText={onChange}
                  value={value}
                  editable={!isSubmitting}
                  placeholderTextColor="#9CA3AF"
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </>
            )}
          />

          {/* Email */}
          <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email"
              }
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Enter your email"
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  placeholderTextColor="#9CA3AF"
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </>
            )}
          />

          {/* Phone */}
          <Text style={styles.label}>Phone Number</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.picker}
                  enabled={!isSubmitting}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            )}
          />

          {/* ADDRESS */}
          <Text style={styles.sectionTitle}>ADDRESS</Text>

          {/* Street Address */}
          <Text style={styles.label}>Street Address</Text>
          <Controller
            control={control}
            name="addressStreet"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Street address"
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* City */}
          <Text style={styles.label}>City</Text>
          <Controller
            control={control}
            name="addressCity"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="City"
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* State */}
          <Text style={styles.label}>State</Text>
          <Controller
            control={control}
            name="addressState"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="State"
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* Pincode */}
          <Text style={styles.label}>Pincode</Text>
          <Controller
            control={control}
            name="addressPincode"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* Country */}
          <Text style={styles.label}>Country</Text>
          <Controller
            control={control}
            name="addressCountry"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Country"
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* MEDICAL PROFILE */}
          <Text style={styles.sectionTitle}>MEDICAL PROFILE</Text>

          {/* Blood Group */}
          <Text style={styles.label}>Blood Group <Text style={styles.required}>*</Text></Text>
          <Controller
            control={control}
            name="bloodGroup"
            rules={{ required: "Blood group is required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <View style={[styles.pickerContainer, error && styles.inputError]}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                    enabled={!isSubmitting}
                  >
                    <Picker.Item label="Select Blood Group" value="" />
                    <Picker.Item label="A+" value="A+" />
                    <Picker.Item label="A-" value="A-" />
                    <Picker.Item label="B+" value="B+" />
                    <Picker.Item label="B-" value="B-" />
                    <Picker.Item label="AB+" value="AB+" />
                    <Picker.Item label="AB-" value="AB-" />
                    <Picker.Item label="O+" value="O+" />
                    <Picker.Item label="O-" value="O-" />
                  </Picker>
                </View>
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </>
            )}
          />

          {/* Diabetes */}
          <Text style={styles.subLabel}>Diabetic</Text>
          <View style={styles.radioGroup}>
            <Controller
              control={control}
              name="isDiabetic"
              render={({ field: { value, onChange } }) => (
                <>
                  {renderRadioButton(
                    "isDiabetic",
                    value === true,
                    "Yes",
                    () => onChange(true)
                  )}
                  {renderRadioButton(
                    "isDiabetic",
                    value === false,
                    "No",
                    () => onChange(false)
                  )}
                </>
              )}
            />
          </View>

          {watchIsDiabetic && (
            <Controller
              control={control}
              name="diabetesType"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                    enabled={!isSubmitting}
                  >
                    <Picker.Item label="Select Diabetes Type" value="" />
                    <Picker.Item label="Type 1" value="Type 1" />
                    <Picker.Item label="Type 2" value="Type 2" />
                    <Picker.Item label="Gestational" value="Gestational" />
                    <Picker.Item label="Pre-diabetic" value="Pre-diabetic" />
                  </Picker>
                </View>
              )}
            />
          )}

          {/* Thyroid */}
          <Text style={styles.subLabel}>Thyroid Condition</Text>
          <View style={styles.radioGroup}>
            <Controller
              control={control}
              name="hasThyroid"
              render={({ field: { value, onChange } }) => (
                <>
                  {renderRadioButton(
                    "hasThyroid",
                    value === true,
                    "Yes",
                    () => onChange(true)
                  )}
                  {renderRadioButton(
                    "hasThyroid",
                    value === false,
                    "No",
                    () => onChange(false)
                  )}
                </>
              )}
            />
          </View>

          {watchHasThyroid && (
            <Controller
              control={control}
              name="thyroidCondition"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                    enabled={!isSubmitting}
                  >
                    <Picker.Item label="Select Thyroid Condition" value="" />
                    <Picker.Item label="Hypothyroid" value="Hypothyroid" />
                    <Picker.Item label="Hyperthyroid" value="Hyperthyroid" />
                    <Picker.Item label="Goiter" value="Goiter" />
                    <Picker.Item label="Thyroid Nodules" value="Thyroid Nodules" />
                  </Picker>
                </View>
              )}
            />
          )}

          {/* ALLERGIES */}
          <Text style={styles.sectionTitle}>ALLERGIES</Text>

          <Text style={styles.label}>Medication Allergies</Text>
          <Text style={styles.hint}>Separate multiple allergies with commas</Text>
          <Controller
            control={control}
            name="medicationAllergies"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Penicillin, Sulfa, Aspirin"
                onChangeText={onChange}
                value={value}
                multiline
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* COMORBID CONDITIONS */}
          <Text style={styles.sectionTitle}>COMORBID CONDITIONS</Text>

          <Text style={styles.hint}>Separate multiple conditions with commas</Text>
          <Controller
            control={control}
            name="comorbidConditions"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Hypertension, High Cholesterol"
                onChangeText={onChange}
                value={value}
                multiline
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* CHRONIC DISEASES */}
          <Text style={styles.sectionTitle}>CHRONIC DISEASES</Text>

          <Text style={styles.hint}>Separate multiple diseases with commas</Text>
          <Controller
            control={control}
            name="chronicDiseases"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Type 2 Diabetes, Hypertension"
                onChangeText={onChange}
                value={value}
                multiline
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* CURRENT MEDICATIONS */}
          <Text style={styles.sectionTitle}>CURRENT MEDICATIONS</Text>

          <Text style={styles.hint}>Separate multiple medications with commas (include dosage if known)</Text>
          <Controller
            control={control}
            name="currentMedications"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
                onChangeText={onChange}
                value={value}
                multiline
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* PAST SURGERIES */}
          <Text style={styles.sectionTitle}>PAST SURGERIES</Text>

          <Text style={styles.hint}>Format: Surgery Name (Date), separate with commas</Text>
          <Controller
            control={control}
            name="pastSurgeries"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Appendectomy (12 June 2015), Cholecystectomy (March 2018)"
                onChangeText={onChange}
                value={value}
                multiline
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* MAJOR SURGERIES / ILLNESS */}
          <Text style={styles.sectionTitle}>MAJOR SURGERIES / ILLNESS</Text>

          <Text style={styles.hint}>Format: Illness Name (Date), separate with commas</Text>
          <Controller
            control={control}
            name="majorSurgeriesOrIllness"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Severe Dengue Infection (September 2019)"
                onChangeText={onChange}
                value={value}
                multiline
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* PREVIOUS INTERVENTIONS */}
          <Text style={styles.sectionTitle}>PREVIOUS INTERVENTIONS</Text>

          <Text style={styles.hint}>Separate multiple interventions with commas</Text>
          <Controller
            control={control}
            name="previousInterventions"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Coronary Angiography, Stent Placement"
                onChangeText={onChange}
                value={value}
                multiline
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* BLOOD THINNER HISTORY */}
          <Text style={styles.sectionTitle}>BLOOD THINNER HISTORY</Text>

          <View style={styles.radioGroup}>
            <Controller
              control={control}
              name="bloodThinner"
              render={({ field: { value, onChange } }) => (
                <>
                  {renderRadioButton(
                    "bloodThinner",
                    value === true,
                    "Yes",
                    () => onChange(true)
                  )}
                  {renderRadioButton(
                    "bloodThinner",
                    value === false,
                    "No",
                    () => onChange(false)
                  )}
                </>
              )}
            />
          </View>

          {watchBloodThinner && (
            <Controller
              control={control}
              name="bloodThinnerDetails"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Please specify blood thinner details (name, reason)"
                  onChangeText={onChange}
                  value={value}
                  multiline
                  editable={!isSubmitting}
                  placeholderTextColor="#9CA3AF"
                />
              )}
            />
          )}

          {/* EMERGENCY CONTACT */}
          <Text style={styles.sectionTitle}>EMERGENCY CONTACT</Text>

          {/* Emergency Name */}
          <Text style={styles.label}>Contact Name</Text>
          <Controller
            control={control}
            name="emergencyName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Emergency contact name"
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* Emergency Relationship */}
          <Text style={styles.label}>Relationship</Text>
          <Controller
            control={control}
            name="emergencyRelationship"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., Spouse, Parent, Sibling"
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* Emergency Phone */}
          <Text style={styles.label}>Phone Number</Text>
          <Controller
            control={control}
            name="emergencyPhone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Emergency contact phone"
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />

          {/* Button Container */}
          <View style={styles.buttonContainer}>
            {/* Cancel Button */}
            {onClose && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Save Changes' : 'Save & Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            This information will be used to generate your medical summary and QR code.
            The QR code will automatically update when you save changes.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 24,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1F2937',
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonSelected: {
    borderColor: '#2563EB',
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  radioLabel: {
    fontSize: 15,
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 32,
    marginBottom: 16,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
});

export default PatientMedicalForm;