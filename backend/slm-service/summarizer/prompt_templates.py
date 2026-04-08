"""Prompt templates for medical summary generation"""
import json
from typing import Dict, Any, List, Optional

class PromptTemplates:
    """Collection of prompt templates for different summary types"""
    
    @staticmethod
    def _safe_string(value: Any) -> str:
        """Convert any value to a safe string, handling None and non-string types"""
        if value is None:
            return "Not available"
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        return str(value).strip()
    
    @staticmethod
    def _safe_list(items: Optional[List[Any]], default: str = "None") -> str:
        """Convert list to comma-separated string, handling empty or None"""
        if not items:
            return default
        processed = []
        for item in items:
            if isinstance(item, dict):
                if 'name' in item:
                    processed.append(item['name'])
                else:
                    processed.append(json.dumps(item))
            else:
                processed.append(PromptTemplates._safe_string(item))
        return ', '.join(processed) if processed else default
    
    @staticmethod
    def _format_medications(medications: Optional[List[Any]]) -> str:
        """Format medications list into readable string with purpose and dosage"""
        if not medications:
            return "None"
        
        formatted = []
        for med in medications:
            if isinstance(med, dict):
                name = med.get('name', 'Unknown')
                purpose = med.get('purpose', 'NA')
                dosage = med.get('dosage', 'NA')
                
                if purpose != 'NA' and dosage != 'NA':
                    formatted.append(f"{name} – {purpose} ({dosage})")
                elif purpose != 'NA':
                    formatted.append(f"{name} – {purpose}")
                elif dosage != 'NA':
                    formatted.append(f"{name} ({dosage})")
                else:
                    formatted.append(name)
            else:
                formatted.append(PromptTemplates._safe_string(med))
        
        return ', '.join(formatted)
    
    @staticmethod
    def _format_bullet_list(items_str: str) -> str:
        """Convert comma-separated string to bullet points"""
        if not items_str or items_str == "None":
            return "• None reported"
        
        items = [item.strip() for item in items_str.split(',')]
        return '\n'.join([f"• {item}" for item in items if item])
    
    @staticmethod
    def _format_medication_list(medications: List[Any]) -> str:
        """Format medications as bullet points with purpose and dosage"""
        if not medications:
            return "• No current medications"
        
        result = []
        for med in medications[:5]:
            if isinstance(med, dict):
                name = med.get('name', 'Unknown')
                purpose = med.get('purpose', 'NA')
                dosage = med.get('dosage', 'NA')
                
                if purpose != 'NA' and dosage != 'NA':
                    result.append(f"• {name} – {purpose} ({dosage})")
                elif purpose != 'NA':
                    result.append(f"• {name} – {purpose}")
                elif dosage != 'NA':
                    result.append(f"• {name} ({dosage})")
                else:
                    result.append(f"• {name}")
            else:
                result.append(f"• {med}")
        
        return '\n'.join(result)
    
    @staticmethod
    def get_general_summary_prompt(patient_data: Dict[str, Any], extracted_data: Dict[str, Any]) -> str:
        """Generate prompt for general medical summary"""
        
        patient_info = {
            'name': patient_data.get('name', 'Unknown'),
            'patient_id': patient_data.get('patientId', 'Unknown'),
            'age': patient_data.get('age', 'Unknown'),
            'gender': patient_data.get('gender', 'Unknown'),
            'blood_group': patient_data.get('bloodGroup', 'Unknown'),
            'email': patient_data.get('email', 'Not available'),
            'phone': patient_data.get('phone', 'Not available'),
            'address': patient_data.get('address', 'Not available')
        }
        
        diagnoses = PromptTemplates._safe_list(extracted_data.get('diagnoses', []))
        medications = PromptTemplates._format_medications(extracted_data.get('medications', []))
        lab_results = PromptTemplates._safe_list(extracted_data.get('labResults', []))
        allergies = PromptTemplates._safe_list(extracted_data.get('allergies', []))
        chronic_diseases = PromptTemplates._safe_list(extracted_data.get('chronicDiseases', []))
        comorbid_conditions = PromptTemplates._safe_list(extracted_data.get('comorbidConditions', []))
        
        past_surgeries = extracted_data.get('pastSurgeries', [])
        surgeries_str = ""
        if past_surgeries and len(past_surgeries) > 0:
            for surgery in past_surgeries[:3]:
                if isinstance(surgery, dict):
                    name = surgery.get('name', surgery.get('surgery', 'Unknown'))
                    date = surgery.get('date', 'Date not available')
                    hospital = surgery.get('hospital', 'Hospital not available')
                    surgeries_str += f"\n• {name}\n  Date: {date}\n  Hospital: {hospital}\n"
        else:
            surgeries_str = "\n• No past surgeries recorded"
        
        prompt = f"""You are a medical AI assistant. Generate a comprehensive patient summary in the exact format shown below. Fill in all available information. Use "Not available" for missing fields.

PATIENT INFORMATION:
- Name: {patient_info['name']}
- Patient ID: {patient_info['patient_id']}
- Age: {patient_info['age']}
- Gender: {patient_info['gender']}
- Blood Group: {patient_info['blood_group']}
- Email: {patient_info['email']}
- Phone: {patient_info['phone']}

MEDICAL DATA:
- Diagnoses: {diagnoses}
- Medications: {medications}
- Lab Results: {lab_results}
- Allergies: {allergies}
- Chronic Diseases: {chronic_diseases}
- Comorbid Conditions: {comorbid_conditions}

Generate the summary in this EXACT format:

GENERAL PATIENT SUMMARY

PATIENT DEMOGRAPHICS
Name: {patient_info['name']}
Patient ID: {patient_info['patient_id']}
Date of Birth: [DOB if available]
Age: {patient_info['age']}
Gender: {patient_info['gender']}
Email: {patient_info['email']}
Phone: {patient_info['phone']}

ADDRESS
{patient_info['address']}

---
MEDICAL PROFILE
Blood Group: {patient_info['blood_group']}
Diabetic: [Yes/No]
Diabetes Type: [Type if applicable]
Thyroid Condition: [Yes/No with details]

---
ALLERGIES
{PromptTemplates._format_bullet_list(allergies)}

---
COMORBID CONDITIONS
{PromptTemplates._format_bullet_list(comorbid_conditions)}

---
CHRONIC DISEASES
{PromptTemplates._format_bullet_list(chronic_diseases)}

---
CURRENT MEDICATIONS
{PromptTemplates._format_medication_list(extracted_data.get('medications', []))}

---
PAST SURGERIES
{surgeries_str}
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

Now generate the complete summary filling in all available information from the provided medical data:
"""
        return prompt
    
    @staticmethod
    def get_cardiology_summary_prompt(patient_data: Dict[str, Any], cardiac_data: Dict[str, Any]) -> str:
        """Generate prompt for cardiology-specific summary"""
        
        cardiac_diagnoses = PromptTemplates._safe_list(cardiac_data.get('cardiacDiagnoses', []))
        cardiac_medications = PromptTemplates._safe_list(cardiac_data.get('cardiacMedications', []))
        cardiac_tests = PromptTemplates._safe_list(cardiac_data.get('cardiacTests', []))
        risk_factors = PromptTemplates._safe_list(cardiac_data.get('riskFactors', []))
        
        vitals = cardiac_data.get('vitals', {})
        vitals_str = ""
        if vitals:
            for key, value in vitals.items():
                vitals_str += f"• {key}: {value}\n"
        else:
            vitals_str = "• No vital signs recorded"
        
        prompt = f"""You are a cardiology specialist AI. Generate a focused cardiac patient summary in the exact format shown below.

PATIENT INFORMATION:
- Name: {patient_data.get('name', 'Unknown')}
- Patient ID: {patient_data.get('patientId', 'Unknown')}
- Age: {patient_data.get('age', 'Unknown')}
- Blood Group: {patient_data.get('bloodGroup', 'Unknown')}

CARDIAC DATA:
Cardiac Diagnoses: {cardiac_diagnoses}
Cardiac Medications: {cardiac_medications}
Cardiac Tests: {cardiac_tests}
Risk Factors: {risk_factors}

Generate the summary in this EXACT format:

CARDIOLOGY SUMMARY

PATIENT INFORMATION
Name: {patient_data.get('name', 'Unknown')}
Patient ID: {patient_data.get('patientId', 'Unknown')}
Age: {patient_data.get('age', 'Unknown')}
Blood Group: {patient_data.get('bloodGroup', 'Unknown')}

CARDIAC CONDITIONS
{PromptTemplates._format_bullet_list(cardiac_diagnoses)}

CARDIAC MEDICATIONS
{PromptTemplates._format_bullet_list(cardiac_medications)}

VITAL SIGNS
{vitals_str}
CARDIAC TESTS
{PromptTemplates._format_bullet_list(cardiac_tests)}

RISK FACTORS
{PromptTemplates._format_bullet_list(risk_factors)}

RECENT CARDIAC REPORTS
• [Report 1] – [Date]
• [Report 2] – [Date]

Now generate the complete summary using the provided cardiac data:
"""
        return prompt
    
    @staticmethod
    def get_orthopedic_summary_prompt(patient_data: Dict[str, Any], orthopedic_data: Dict[str, Any]) -> str:
        """Generate prompt for orthopedic-specific summary"""
        
        orthopedic_diagnoses = PromptTemplates._safe_list(orthopedic_data.get('orthopedicDiagnoses', []))
        orthopedic_medications = PromptTemplates._safe_list(orthopedic_data.get('orthopedicMedications', []))
        imaging_results = PromptTemplates._safe_list(orthopedic_data.get('imagingResults', []))
        mobility_status = orthopedic_data.get('mobilityStatus', 'Unknown')
        
        prompt = f"""You are an orthopedic specialist AI. Generate a focused musculoskeletal patient summary in the exact format shown below.

PATIENT INFORMATION:
- Name: {patient_data.get('name', 'Unknown')}
- Patient ID: {patient_data.get('patientId', 'Unknown')}
- Age: {patient_data.get('age', 'Unknown')}
- Blood Group: {patient_data.get('bloodGroup', 'Unknown')}

ORTHOPEDIC DATA:
Orthopedic Diagnoses: {orthopedic_diagnoses}
Orthopedic Medications: {orthopedic_medications}
Imaging Results: {imaging_results}
Mobility Status: {mobility_status}

Generate the summary in this EXACT format:

ORTHOPEDIC SUMMARY

PATIENT INFORMATION
Name: {patient_data.get('name', 'Unknown')}
Patient ID: {patient_data.get('patientId', 'Unknown')}
Age: {patient_data.get('age', 'Unknown')}
Blood Group: {patient_data.get('bloodGroup', 'Unknown')}

ORTHOPEDIC CONDITIONS
{PromptTemplates._format_bullet_list(orthopedic_diagnoses)}

PAIN/INFLAMMATION MEDICATIONS
{PromptTemplates._format_bullet_list(orthopedic_medications)}

IMAGING RESULTS
{PromptTemplates._format_bullet_list(imaging_results)}

MOBILITY STATUS
{mobility_status}

RECENT ORTHOPEDIC REPORTS
• [Report 1] – [Date]
• [Report 2] – [Date]

Now generate the complete summary using the provided orthopedic data:
"""
        return prompt