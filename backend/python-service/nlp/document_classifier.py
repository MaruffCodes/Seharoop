import re
from typing import Dict, Any

class DocumentClassifier:
    """Classifies documents into different medical types"""
    
    def __init__(self):
        self.patterns = {
            'lab_report': {
                'keywords': ['lab', 'laboratory', 'test result', 'blood test', 'urine test', 
                           'cbc', 'lipid profile', 'thyroid panel', 'hba1c', 'glucose',
                           'cholesterol', 'creatinine', 'hemoglobin', 'platelet'],
                'patterns': [r'\d+\.?\d*\s*(?:mg/dL|mmol/L|g/dL|%)', r'Reference Range'],
                'min_confidence': 0.6
            },
            'prescription': {
                'keywords': ['prescription', 'medication', 'dosage', 'take', 'daily', 
                           'sig:', 'dispense', 'refill', 'pharmacy'],
                'patterns': [r'\d+\s*(?:mg|mcg|g|ml)\s*(?:daily|bid|tid|qid|qhs|prn)'],
                'min_confidence': 0.7
            },
            'discharge_summary': {
                'keywords': ['discharge summary', 'admission', 'discharged', 'hospital stay',
                           'admitting diagnosis', 'discharge diagnosis', 'follow-up'],
                'patterns': [r'Admission Date:', r'Discharge Date:', r'Hospital Course'],
                'min_confidence': 0.6
            },
            'consultation': {
                'keywords': ['consultation', 'referred to', 'specialist', 'cardiology',
                           'orthopedic', 'neurology', 'assessment', 'impression'],
                'patterns': [r'Chief Complaint', r'History of Present Illness', r'Assessment'],
                'min_confidence': 0.6
            },
            'vaccination': {
                'keywords': ['vaccination', 'immunization', 'vaccine', 'dose', 'booster',
                           'covid-19', 'flu shot', 'hpv', 'hepatitis b'],
                'patterns': [r'Lot\s*#', r'Expiration Date', r'Administered by'],
                'min_confidence': 0.7
            },
            'imaging': {
                'keywords': ['x-ray', 'mri', 'ct scan', 'ultrasound', 'echocardiogram',
                           'radiology', 'imaging', 'sonogram'],
                'patterns': [r'Findings:', r'Impression:', r'Technique:'],
                'min_confidence': 0.6
            },
            'medical_form': {
                'keywords': ['patient information', 'medical history', 'allergies', 
                           'current medications', 'past surgeries', 'emergency contact'],
                'patterns': [r'PATIENT DEMOGRAPHICS', r'MEDICAL PROFILE', r'ALLERGIES'],
                'min_confidence': 0.5
            },
            'general_medical': {
                'keywords': ['doctor', 'patient', 'diagnosis', 'treatment', 'symptoms',
                           'prescribed', 'follow-up', 'clinic'],
                'patterns': [],
                'min_confidence': 0.4
            },
            'non_medical': {
                'keywords': ['invoice', 'bill', 'payment', 'receipt', 'insurance card',
                           'appointment reminder', 'consent form', 'hippa'],
                'patterns': [r'\$\d+', r'Total Amount', r'Payment Due'],
                'min_confidence': 0.5,
                'is_medical': False
            }
        }
    
    def classify(self, text: str) -> Dict[str, Any]:
        """Classify document type and return confidence scores"""
        text_lower = text.lower()
        scores = {}
        
        for doc_type, config in self.patterns.items():
            score = 0
            # Check keywords
            keyword_matches = sum(1 for kw in config['keywords'] if kw in text_lower)
            score += (keyword_matches / len(config['keywords'])) * 0.6
            
            # Check patterns
            pattern_matches = 0
            for pattern in config['patterns']:
                if re.search(pattern, text, re.IGNORECASE):
                    pattern_matches += 1
            if config['patterns']:
                score += (pattern_matches / len(config['patterns'])) * 0.4
            
            scores[doc_type] = min(score, 1.0)
        
        # Determine best match
        best_type = max(scores, key=scores.get)
        best_score = scores[best_type]
        
        is_medical = self.patterns.get(best_type, {}).get('is_medical', True)
        
        return {
            'document_type': best_type,
            'confidence': best_score,
            'is_medical': is_medical,
            'all_scores': scores,
            'needs_review': best_score < 0.4
        }