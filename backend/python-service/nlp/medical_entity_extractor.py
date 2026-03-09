import spacy
import re
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class MedicalEntityExtractor:
    def __init__(self):
        try:
            # Try to load medical model first
            self.nlp = spacy.load("en_core_sci_md")
            logger.info("Loaded SciSpacy medical model")
        except:
            # Fallback to general model
            self.nlp = spacy.load("en_core_web_sm")
            logger.warning("Medical model not found, using general model")
        
        # Medical patterns
        self.patterns = {
            'diagnoses': [
                r'(?:diagnos(?:ed|is)? with|suffers from|history of)\s+([A-Za-z\s]+)(?=\s|\.|,)',
                r'\b(hypertension|diabetes|asthma|copd|cancer|arthritis|heart disease|ckd|cad|chf)\b',
                r'\b(diabetes mellitus|thyroid|hyperthyroidism|hypothyroidism)\b'
            ],
            'medications': [
                r'(?:prescribed|takes?|medication|drug)\s+([A-Za-z\s]+)(?=\s|\.|,)',
                r'\b(\w+(?:icillin|mycin|oxacin|azole|vir|mab|tin|pril|olol|sartan|statin))\b',
                r'\b(metformin|lisinopril|atorvastatin|amlodipine|levothyroxine)\b'
            ],
            'lab_results': [
                r'\b(blood sugar|glucose|cholesterol|hba1c|creatinine|wbc|rbc|platelet)\s+(\d+\.?\d*)',
                r'\b(cbc|lipid panel|thyroid panel|metabolic panel)\b',
                r'\b(\d+\.?\d*\s*(mg/dl|mmol/l|mEq/l|%|g/dl))\b'
            ],
            'allergies': [
                r'(?:allerg(?:y|ic) to|reaction to)\s+([A-Za-z\s]+)(?=\s|\.|,)',
                r'\b(penicillin|sulfa|aspirin|ibuprofen|latex|peanut|shellfish)\b'
            ]
        }
        
    def extract(self, text: str) -> Dict[str, List[str]]:
        """Extract medical entities from text"""
        if not text:
            return self._empty_result()
        
        try:
            # Process with spaCy
            doc = self.nlp(text[:10000])  # Limit text length for performance
            
            entities = {
                'diagnoses': [],
                'medications': [],
                'lab_results': [],
                'allergies': [],
                'dates': [],
                'doctors': [],
                'hospitals': [],
                'vitals': {}
            }
            
            # Extract using spaCy NER
            for ent in doc.ents:
                if ent.label_ in ['CONDITION', 'DISEASE']:
                    entities['diagnoses'].append(ent.text)
                elif ent.label_ in ['CHEMICAL', 'DRUG']:
                    entities['medications'].append(ent.text)
                elif ent.label_ == 'DATE':
                    entities['dates'].append(ent.text)
                elif ent.label_ == 'PERSON' and ('Dr' in ent.text or 'Doctor' in ent.text):
                    entities['doctors'].append(ent.text)
                elif ent.label_ == 'ORG' and any(word in ent.text.lower() for word in ['hospital', 'clinic']):
                    entities['hospitals'].append(ent.text)
            
            # Extract using regex patterns
            for category, patterns in self.patterns.items():
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    for match in matches:
                        if isinstance(match, tuple):
                            match = match[-1]  # Get last capturing group
                        if match and match not in entities[category]:
                            entities[category].append(match.strip())
            
            # Extract vitals
            vitals = self._extract_vitals(text)
            if vitals:
                entities['vitals'] = vitals
            
            # Remove duplicates and limit
            for key in entities:
                if isinstance(entities[key], list):
                    entities[key] = list(set(entities[key]))[:10]
            
            return entities
            
        except Exception as e:
            logger.error(f"Entity extraction error: {str(e)}")
            return self._empty_result()
    
    def _extract_vitals(self, text: str) -> Dict[str, str]:
        """Extract vital signs"""
        vitals = {}
        
        patterns = {
            'bp': r'(\d{2,3})\/(\d{2,3})\s*(?:mm ?Hg)?',
            'hr': r'(?:HR|heart rate|pulse)[:\s]*(\d{2,3})\s*(?:bpm)?',
            'temp': r'(?:temp|temperature)[:\s]*(\d{2,3}(?:\.\d)?)\s*(?:°?[FC]?)',
            'weight': r'(?:wt|weight)[:\s]*(\d+(?:\.\d)?)\s*(?:kg|lbs?)',
            'height': r'(?:ht|height)[:\s]*(\d+(?:\.\d)?)\s*(?:cm|m|in)'
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vitals[key] = match.group(0)
        
        return vitals
    
    def _empty_result(self):
        return {
            'diagnoses': [],
            'medications': [],
            'lab_results': [],
            'allergies': [],
            'dates': [],
            'doctors': [],
            'hospitals': [],
            'vitals': {}
        }