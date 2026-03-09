import re
from typing import Dict, List

class MedicalSummarizer:
    def generate_summary(self, text: str, entities: Dict[str, List]) -> str:
        """Generate a concise medical summary"""
        parts = []
        
        # Diagnoses
        if entities.get('diagnoses'):
            parts.append(f"Diagnoses: {', '.join(entities['diagnoses'][:3])}")
        
        # Medications
        if entities.get('medications'):
            parts.append(f"Medications: {', '.join(entities['medications'][:3])}")
        
        # Allergies
        if entities.get('allergies'):
            parts.append(f"Allergies: {', '.join(entities['allergies'])}")
        
        # Lab Results
        if entities.get('lab_results'):
            parts.append(f"Labs: {', '.join(entities['lab_results'][:3])}")
        
        # Vitals
        if entities.get('vitals'):
            vitals_str = ', '.join([f"{k}: {v}" for k, v in entities['vitals'].items()])
            parts.append(f"Vitals: {vitals_str}")
        
        # Key findings from text
        key_phrases = self._extract_key_phrases(text)
        if key_phrases:
            parts.append(f"Findings: {key_phrases}")
        
        if not parts:
            return "No medical information could be extracted from this document."
        
        return ' | '.join(parts)
    
    def _extract_key_phrases(self, text: str, max_length: int = 100) -> str:
        """Extract key phrases from text"""
        # Look for sentences with medical keywords
        keywords = ['diagnosis', 'assessment', 'impression', 'plan', 'recommendation']
        
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if any(keyword in sentence.lower() for keyword in keywords):
                if len(sentence) <= max_length:
                    return sentence
        
        # Return first sentence if no keywords found
        if sentences:
            return sentences[0].strip()[:max_length]
        
        return ""