"""Prompt templates for medical summary generation"""
import json

class PromptTemplates:
    """Collection of prompt templates for different summary types"""
    
    @staticmethod
    def get_general_summary_prompt(patient_data: dict, extracted_data: dict) -> str:
        """Generate prompt for general medical summary"""
        
        # Format the extracted data nicely
        diagnoses_str = ', '.join(extracted_data.get('diagnoses', ['None'])) if extracted_data.get('diagnoses') else 'None'
        medications_str = ', '.join(extracted_data.get('medications', ['None'])) if extracted_data.get('medications') else 'None'
        lab_results_str = ', '.join(extracted_data.get('labResults', ['None'])) if extracted_data.get('labResults') else 'None'
        allergies_str = ', '.join(extracted_data.get('allergies', ['None'])) if extracted_data.get('allergies') else 'None'
        chronic_str = ', '.join(extracted_data.get('chronicDiseases', ['None'])) if extracted_data.get('chronicDiseases') else 'None'
        comorbid_str = ', '.join(extracted_data.get('comorbidConditions', ['None'])) if extracted_data.get('comorbidConditions') else 'None'
        
        prompt = f"""You are a medical AI assistant. Generate a comprehensive patient summary in the exact format shown below. Fill in all available information. Use "Not available" for missing fields.

PATIENT INFORMATION:
- Name: {patient_data.get('name', 'Unknown')}
- Patient ID: {patient_data.get('patientId', 'Unknown')}
- Age: {patient_data.get('age', 'Unknown')}
- Gender: {patient_data.get('gender', 'Unknown')}
- Blood Group: {patient_data.get('bloodGroup', 'Unknown')}
- Email: {patient_data.get('email', 'Not available')}
- Phone: {patient_data.get('phone', 'Not available')}

MEDICAL DATA:
- Diagnoses: {diagnoses_str}
- Medications: {medications_str}
- Lab Results: {lab_results_str}
- Allergies: {allergies_str}
- Chronic Diseases: {chronic_str}
- Comorbid Conditions: {comorbid_str}

Generate the summary in this EXACT format:

GENERAL PATIENT SUMMARY

PATIENT DEMOGRAPHICS
Name: [Full Name]
Patient ID: [ID]
Date of Birth: [DOB if available]
Age: [Age]
Gender: [Gender]
Email: [Email]
Phone: [Phone]

ADDRESS
[Full Address or "Not available"]

---
MEDICAL PROFILE
Blood Group: [Blood Group]
Diabetic: [Yes/No]
Diabetes Type: [Type if applicable]
Thyroid Condition: [Yes/No with details]

---
ALLERGIES
• [Allergy 1]
• [Allergy 2]

---
COMORBID CONDITIONS
• [Condition 1]
• [Condition 2]

---
CHRONIC DISEASES
• [Disease 1]
• [Disease 2]

---
CURRENT MEDICATIONS
• [Medication 1] – [Purpose] ([Dosage])
• [Medication 2] – [Purpose] ([Dosage])

---
PAST SURGERIES
• [Surgery Name]
  Date: [Date]
  Hospital: [Hospital]
  Surgeon: [Surgeon]

---
MAJOR SURGERIES / ILLNESS
• [Illness Name]
  Date: [Date]
  Hospital: [Hospital]
  Notes: [Notes]

---
PREVIOUS INTERVENTIONS
• [Intervention Name]
  Date: [Date]
  Hospital: [Hospital]

---
BLOOD THINNER HISTORY
• [Medication Name]
  Type: [Type]
  Duration: [Duration]
  Reason: [Reason]

---
EMERGENCY CONTACT
Name: [Contact Name]
Relationship: [Relationship]
Phone: [Phone]

---
MEDICAL HISTORY
YEAR [YYYY]
[Month]
• [Day] – [Event Type]
  [Description]

Now generate the complete summary:
"""
        return prompt
    
    @staticmethod
    def get_cardiology_summary_prompt(patient_data: dict, cardiac_data: dict) -> str:
        """Generate prompt for cardiology-specific summary"""
        
        prompt = f"""You are a cardiology specialist AI. Generate a focused cardiac patient summary in the exact format shown below.

PATIENT INFORMATION:
- Name: {patient_data.get('name', 'Unknown')}
- Patient ID: {patient_data.get('patientId', 'Unknown')}
- Age: {patient_data.get('age', 'Unknown')}
- Blood Group: {patient_data.get('bloodGroup', 'Unknown')}

CARDIAC DATA:
Cardiac Diagnoses: {', '.join(cardiac_data.get('cardiacDiagnoses', ['None']))}
Cardiac Medications: {', '.join(cardiac_data.get('cardiacMedications', ['None']))}
Cardiac Tests: {', '.join(cardiac_data.get('cardiacTests', ['None']))}
Vital Signs: {json.dumps(cardiac_data.get('vitals', {}))}
Risk Factors: {', '.join(cardiac_data.get('riskFactors', ['None']))}

Generate the summary in this EXACT format:

CARDIOLOGY SUMMARY

PATIENT INFORMATION
Name: [Name]
Patient ID: [ID]
Age: [Age]
Blood Group: [Blood Group]

CARDIAC CONDITIONS
• [Condition 1]
• [Condition 2]

CARDIAC MEDICATIONS
• [Medication 1] – [Purpose]
• [Medication 2] – [Purpose]

VITAL SIGNS
• Blood Pressure: [Value]
• Heart Rate: [Value]
• Temperature: [Value]
• Weight: [Value]

CARDIAC TESTS
• [Test 1]: [Result]
• [Test 2]: [Result]

RISK FACTORS
• [Factor 1]
• [Factor 2]

RECENT CARDIAC REPORTS
• [Report 1] – [Date]
• [Report 2] – [Date]

Now generate the complete summary:
"""
        return prompt
    
    @staticmethod
    def get_orthopedic_summary_prompt(patient_data: dict, orthopedic_data: dict) -> str:
        """Generate prompt for orthopedic-specific summary"""
        
        prompt = f"""You are an orthopedic specialist AI. Generate a focused musculoskeletal patient summary in the exact format shown below.

PATIENT INFORMATION:
- Name: {patient_data.get('name', 'Unknown')}
- Patient ID: {patient_data.get('patientId', 'Unknown')}
- Age: {patient_data.get('age', 'Unknown')}
- Blood Group: {patient_data.get('bloodGroup', 'Unknown')}

ORTHOPEDIC DATA:
Orthopedic Diagnoses: {', '.join(orthopedic_data.get('orthopedicDiagnoses', ['None']))}
Orthopedic Medications: {', '.join(orthopedic_data.get('orthopedicMedications', ['None']))}
Imaging Results: {', '.join(orthopedic_data.get('imagingResults', ['None']))}
Mobility Status: {orthopedic_data.get('mobilityStatus', 'Unknown')}

Generate the summary in this EXACT format:

ORTHOPEDIC SUMMARY

PATIENT INFORMATION
Name: [Name]
Patient ID: [ID]
Age: [Age]
Blood Group: [Blood Group]

ORTHOPEDIC CONDITIONS
• [Condition 1]
• [Condition 2]

PAIN/INFLAMMATION MEDICATIONS
• [Medication 1]
• [Medication 2]

IMAGING RESULTS
• [Result 1]
• [Result 2]

MOBILITY STATUS
[Status description]

RECENT ORTHOPEDIC REPORTS
• [Report 1] – [Date]
• [Report 2] – [Date]

Now generate the complete summary:
"""
        return prompt