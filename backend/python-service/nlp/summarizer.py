import re
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class MedicalSummarizer:
    def generate_summary(self, text: str, entities: Dict[str, Any]) -> str:
        """Generate a concise medical summary from extracted entities."""
        parts = []

        # Diagnoses
        diagnoses = entities.get('diagnoses', [])
        if diagnoses:
            diag_list = [str(d) for d in diagnoses[:5] if str(d).upper() != 'NA']
            if diag_list:
                parts.append(f"Diagnoses: {', '.join(diag_list)}")

        # Current Medications (structured) — preferred
        current_meds = entities.get('currentMedications', [])
        if current_meds:
            med_details = []
            for med in current_meds[:5]:
                name = med.get('name', 'Unknown')
                purpose = med.get('purpose', '')
                dosage = med.get('dosage', '')
                if purpose and purpose not in ('NA', 'Prescribed'):
                    if dosage and dosage not in ('NA', 'Not specified'):
                        med_details.append(f"{name} – {purpose} ({dosage})")
                    else:
                        med_details.append(f"{name} – {purpose}")
                elif dosage and dosage not in ('NA', 'Not specified'):
                    med_details.append(f"{name} ({dosage})")
                else:
                    med_details.append(name)
            if med_details:
                parts.append(f"Current Medications: {', '.join(med_details)}")
        else:
            # Fallback: plain medication names
            medications = entities.get('medications', [])
            if medications:
                med_list = [str(m) for m in medications[:5] if str(m).upper() != 'NA']
                if med_list:
                    parts.append(f"Medications: {', '.join(med_list)}")

        # Allergies
        allergies = entities.get('allergies', [])
        if allergies:
            allergy_list = [str(a) for a in allergies[:5] if str(a).upper() != 'NA']
            if allergy_list:
                parts.append(f"Allergies: {', '.join(allergy_list)}")

        # Past Surgeries
        past_surgeries = entities.get('pastSurgeries', [])
        if past_surgeries:
            surgery_list = []
            for s in past_surgeries[:3]:
                name = s.get('name', 'Unknown')
                date = s.get('date', '')
                if date and date != 'NA':
                    surgery_list.append(f"{name} ({date})")
                else:
                    surgery_list.append(name)
            if surgery_list:
                parts.append(f"Past Surgeries: {', '.join(surgery_list)}")

        # Major Illnesses
        major_illnesses = entities.get('majorIllnesses', [])
        if major_illnesses:
            illness_list = []
            for ill in major_illnesses[:3]:
                name = ill.get('name', 'Unknown')
                date = ill.get('date', '')
                if date and date != 'NA':
                    illness_list.append(f"{name} ({date})")
                else:
                    illness_list.append(name)
            if illness_list:
                parts.append(f"Major Illnesses: {', '.join(illness_list)}")

        # Blood Thinner
        blood_thinner = entities.get('bloodThinner', [])
        if blood_thinner:
            bt_list = []
            for bt in blood_thinner[:2]:
                name = bt.get('name', 'Unknown')
                bt_type = bt.get('type', '')
                if bt_type and bt_type != 'NA':
                    bt_list.append(f"{name} ({bt_type})")
                else:
                    bt_list.append(name)
            if bt_list:
                parts.append(f"Blood Thinner: {', '.join(bt_list)}")

        # Lab Results
        lab_results = entities.get('lab_results', [])
        if lab_results:
            lab_list = [str(l) for l in lab_results[:3] if str(l).upper() != 'NA']
            if lab_list:
                parts.append(f"Lab Results: {', '.join(lab_list)}")

        # Key finding from raw text (brief)
        key_finding = self._extract_key_finding(text)
        if key_finding and key_finding not in str(parts):
            parts.append(f"Findings: {key_finding[:200]}")

        if not parts:
            return "No medical information could be extracted from this document."

        return ' | '.join(parts)

    def _extract_key_finding(self, text: str, max_length: int = 200) -> str:
        """Extract a key sentence from the text based on medical keywords."""
        keywords = [
            'diagnosis', 'assessment', 'impression', 'conclusion',
            'summary', 'plan', 'recommendation', 'findings'
        ]

        sentences = re.split(r'[.!?]+', text)

        for sentence in sentences:
            sentence = sentence.strip()
            if any(keyword in sentence.lower() for keyword in keywords):
                cleaned = re.sub(r'\s+', ' ', sentence)
                if len(cleaned) <= max_length:
                    return cleaned
                return cleaned[:max_length] + '...'

        if sentences and sentences[0].strip():
            first = sentences[0].strip()
            cleaned = re.sub(r'\s+', ' ', first)
            if len(cleaned) <= max_length:
                return cleaned
            return cleaned[:max_length] + '...'

        return ""