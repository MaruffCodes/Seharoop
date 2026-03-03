import React, { useEffect } from 'react';
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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../services/api';

interface FormValues {
  medicationAllergy: string;
  coMorbidCondition: {
    diabetes: boolean;
    diabetesType?: string;
    hypertension: boolean;
    asthma: boolean;
    thyroid: boolean;
  };
  previousIntervention: string;
  majorSurgeries: string;
  currentMedication: string;
  bloodThinner: boolean;
  bloodThinnerDetails?: string;
  bloodGroup: string;
}

const PatientMedicalForm: React.FC = () => {
  const { control, handleSubmit, watch, setValue, reset } = useForm<FormValues>();
  const watchDiabetes = watch('coMorbidCondition.diabetes', false);
  const watchBloodThinner = watch('bloodThinner', false);

  useEffect(() => {
    const fetchMedicalForm = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          ApiService.token = token;
          const response = await ApiService.getMedicalForm();
          if (response.success && response.data) {
            reset(response.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch medical form:', error);
      }
    };

    fetchMedicalForm();
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found.');
        return;
      }

      ApiService.token = token;
      const response = await fetch('http://192.168.1.6:5000/api/medical-form/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Form submitted successfully!');
        reset(); // Reset the form after successful submission
      } else {
        Alert.alert('Error', result.message || 'Failed to submit the form.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'An error occurred while submitting the form.');
    }
  };

  const renderRadioButton = (
    fieldName: string,
    value: boolean,
    label: string
  ) => (
    <View style={styles.radioContainer}>
      <TouchableOpacity
        style={[styles.radioButton, value && styles.radioButtonSelected]}
        onPress={() => setValue(fieldName, true)}
      >
        {value && <View style={styles.radioInnerCircle} />}
      </TouchableOpacity>
      <Text style={styles.radioLabel}>{label}</Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Medical Form Heading */}
          <Text style={styles.heading}>Medical Form</Text>
          
          <Text style={styles.label}>Medication Allergy</Text>
          <Controller
            control={control}
            name="medicationAllergy"
            defaultValue=""
            rules={{ required: 'This field is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Enter medication allergy"
                  onChangeText={onChange}
                  value={value}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </>
            )}
          />

          <Text style={styles.label}>Blood Group</Text>
          <Controller
            control={control}
            name="bloodGroup"
            defaultValue=""
            rules={{ required: 'This field is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={value}
                    onValueChange={(itemValue) => onChange(itemValue)}
                    style={styles.picker}
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

          <Text style={styles.label}>Co-morbid Conditions</Text>
          <Text style={styles.subLabel}>Diabetes</Text>
          <Controller
            control={control}
            name="coMorbidCondition.diabetes"
            defaultValue={false}
            rules={{ required: 'This field is required' }}
            render={({ field: { value } }) => (
              <View style={styles.radioGroup}>
                {renderRadioButton('coMorbidCondition.diabetes', value, 'Yes')}
                {renderRadioButton('coMorbidCondition.diabetes', !value, 'No')}
              </View>
            )}
          />
          {watchDiabetes && (
            <Controller
              control={control}
              name="coMorbidCondition.diabetesType"
              defaultValue=""
              rules={{ required: 'Please specify diabetes type' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="Enter diabetes type"
                    onChangeText={onChange}
                    value={value}
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </>
              )}
            />
          )}

          <Text style={styles.subLabel}>Hypertension</Text>
          <Controller
            control={control}
            name="coMorbidCondition.hypertension"
            defaultValue={false}
            rules={{ required: 'This field is required' }}
            render={({ field: { value } }) => (
              <View style={styles.radioGroup}>
                {renderRadioButton('coMorbidCondition.hypertension', value, 'Yes')}
                {renderRadioButton('coMorbidCondition.hypertension', !value, 'No')}
              </View>
            )}
          />

          <Text style={styles.subLabel}>Asthma</Text>
          <Controller
            control={control}
            name="coMorbidCondition.asthma"
            defaultValue={false}
            rules={{ required: 'This field is required' }}
            render={({ field: { value } }) => (
              <View style={styles.radioGroup}>
                {renderRadioButton('coMorbidCondition.asthma', value, 'Yes')}
                {renderRadioButton('coMorbidCondition.asthma', !value, 'No')}
              </View>
            )}
          />

          <Text style={styles.subLabel}>Thyroid</Text>
          <Controller
            control={control}
            name="coMorbidCondition.thyroid"
            defaultValue={false}
            rules={{ required: 'This field is required' }}
            render={({ field: { value } }) => (
              <View style={styles.radioGroup}>
                {renderRadioButton('coMorbidCondition.thyroid', value, 'Yes')}
                {renderRadioButton('coMorbidCondition.thyroid', !value, 'No')}
              </View>
            )}
          />

          <Text style={styles.label}>Previous History of Any Intervention( angioplasty, angiography, etc)
</Text>
          <Controller
            control={control}
            name="previousIntervention"
            defaultValue=""
            rules={{ required: 'This field is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Enter previous interventions"
                  onChangeText={onChange}
                  value={value}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </>
            )}
          />

          <Text style={styles.label}>Previous History of Major Surgeries</Text>
          <Controller
            control={control}
            name="majorSurgeries"
            defaultValue=""
            rules={{ required: 'This field is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Enter major surgeries"
                  onChangeText={onChange}
                  value={value}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </>
            )}
          />

          <Text style={styles.label}>Current Medication Use(For htn/dm/asthma /thyroid, etc)</Text>
          <Controller
            control={control}
            name="currentMedication"
            defaultValue=""
            rules={{ required: 'This field is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Enter current medications"
                  onChangeText={onChange}
                  value={value}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </>
            )}
          />

          <Text style={styles.label}>History of Blood Thinner Use(anticoagulant/ antiplatelet, etc)</Text>
          <Controller
            control={control}
            name="bloodThinner"
            defaultValue={false}
            rules={{ required: 'This field is required' }}
            render={({ field: { value } }) => (
              <View style={styles.radioGroup}>
                {renderRadioButton('bloodThinner', value, 'Yes')}
                {renderRadioButton('bloodThinner', !value, 'No')}
              </View>
            )}
          />
          {watchBloodThinner && (
            <Controller
              control={control}
              name="bloodThinnerDetails"
              defaultValue=""
              rules={{ required: 'Please specify blood thinner details' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="Enter blood thinner details"
                    onChangeText={onChange}
                    value={value}
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </>
              )}
            />
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  subLabel: {
    fontSize: 14,
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonSelected: {
    borderColor: '#007BFF',
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#007BFF',
  },
  radioLabel: {
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PatientMedicalForm;