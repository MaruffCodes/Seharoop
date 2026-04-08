import spacy
import re
from typing import Dict, List, Optional
import logging
import json

logger = logging.getLogger(__name__)

class MedicalEntityExtractor:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_sci_md")
            logger.info("✅ Loaded SciSpacy medical model")
        except:
            self.nlp = spacy.load("en_core_web_sm")
            logger.warning("⚠️ Medical model not found, using general model")

        # Section header patterns - used for boundary detection
        self.section_headers = {
            'PATIENT DEMOGRAPHICS': 'demographics',
            'ADDRESS': 'address',
            'MEDICAL PROFILE': 'medical_profile',
            'ALLERGIES': 'allergies',
            'COMORBID CONDITIONS': 'comorbid',
            'CHRONIC DISEASES': 'chronic',
            'CURRENT MEDICATIONS': 'medications',
            'PAST SURGERIES': 'past_surgeries',
            'MAJOR SURGERIES': 'major_illnesses',
            'MAJOR SURGERIES / ILLNESS': 'major_illnesses',
            'PREVIOUS INTERVENTIONS': 'interventions',
            'BLOOD THINNER HISTORY': 'blood_thinner',
            'EMERGENCY CONTACT': 'emergency_contact',
            'MEDICAL HISTORY': 'medical_history',
        }

        # ONLY used when section-aware parsing fails to find something
        self.fallback_patterns = {
            'diagnoses': [
                r'(?:diagnosed with|suffers from|history of)\s+([A-Za-z\s]+?)(?=\s*[\.\,\n])',
                r'\b(hypertension|diabetes mellitus|type\s*[12]\s*diabetes|asthma|copd|arthritis|heart disease|ckd|cad|chf|hyperthyroidism|hypothyroidism)\b',
            ],
            'lab_results': [
                r'\b(blood sugar|glucose|cholesterol|hba1c|creatinine|wbc|rbc|platelet)\s+(\d+\.?\d*)',
                r'\b(cbc|lipid panel|thyroid panel|metabolic panel)\b',
                r'\b(\d+\.?\d*\s*(?:mg/dl|mmol/l|mEq/l|%|g/dl))\b'
            ],
        }

    # ------------------------------------------------------------------
    # PUBLIC ENTRY POINT
    # ------------------------------------------------------------------
    def extract(self, text: str) -> Dict:
        if not text:
            logger.warning("⚠️ Empty text provided for extraction")
            return self._empty_result()

        logger.info("=" * 50)
        logger.info("🔍 STARTING MEDICAL ENTITY EXTRACTION")
        logger.info(f"📄 Text length: {len(text)} characters")

        try:
            # ── Step 1: split text into labelled sections ──────────────
            sections = self._split_into_sections(text)
            logger.info(f"📑 Sections found: {list(sections.keys())}")

            # ── Step 2: parse each section independently ───────────────
            entities = self._empty_result()

            entities['demographics']     = self._parse_demographics(sections.get('demographics', ''))
            entities['address']          = self._parse_address(sections.get('address', ''))
            entities['allergies']        = self._parse_bullet_list(sections.get('allergies', ''))
            entities['comorbidConditions']= self._parse_bullet_list(sections.get('comorbid', ''))
            entities['chronicDiseases']  = self._parse_bullet_list(sections.get('chronic', ''))
            entities['medications']      = self._parse_medications(sections.get('medications', ''))
            entities['pastSurgeries']    = self._parse_structured_items(sections.get('past_surgeries', ''),
                                                                         ['Date', 'Hospital', 'Surgeon'])
            entities['majorIllnesses']   = self._parse_structured_items(sections.get('major_illnesses', ''),
                                                                         ['Date', 'Hospital', 'Notes'])
            entities['interventions']    = self._parse_structured_items(sections.get('interventions', ''),
                                                                         ['Date', 'Hospital'])
            entities['bloodThinner']     = self._parse_structured_items(sections.get('blood_thinner', ''),
                                                                         ['Type', 'Duration', 'Reason'],
                                                                         name_key='name_with_type')
            entities['emergencyContact'] = self._parse_emergency_contact(sections.get('emergency_contact', ''))
            entities['medicalHistory']   = self._parse_medical_history(sections.get('medical_history', ''))

            # ── Step 3: SpaCy NER for hospitals, doctors, dates ────────
            doc = self.nlp(text[:10000])
            for ent in doc.ents:
                if ent.label_ == 'DATE':
                    entities['dates'].append(ent.text)
                elif ent.label_ == 'PERSON' and re.search(r'\bDr\.?\b', ent.text):
                    entities['doctors'].append(ent.text)
                elif ent.label_ == 'ORG' and any(w in ent.text.lower() for w in ['hospital', 'clinic', 'centre', 'center']):
                    entities['hospitals'].append(ent.text)

            # Also pick hospitals/doctors from structured sections
            for section_text in sections.values():
                for line in section_text.split('\n'):
                    m = re.search(r'Hospital:\s*(.+)', line)
                    if m:
                        h = m.group(1).strip().rstrip(',')
                        if h and h != 'NA':
                            entities['hospitals'].append(h)
                    m = re.search(r'Surgeon:\s*(.+)', line)
                    if m:
                        d = m.group(1).strip()
                        if d and d != 'NA':
                            entities['doctors'].append(d)

            # ── Step 4: fallback regex for diagnoses / lab results ─────
            for category, patterns in self.fallback_patterns.items():
                if not entities.get(category):
                    for pattern in patterns:
                        matches = re.findall(pattern, text, re.IGNORECASE)
                        for match in matches:
                            val = match[-1] if isinstance(match, tuple) else match
                            val = val.strip()
                            if val and val not in entities[category]:
                                entities[category].append(val)

            # ── Step 5: vital signs ────────────────────────────────────
            entities['vitals'] = self._extract_vitals(text)

            # ── Step 6: deduplicate lists ──────────────────────────────
            for key in ('dates', 'doctors', 'hospitals', 'diagnoses', 'lab_results'):
                entities[key] = list(dict.fromkeys(entities[key]))[:10]

            logger.info("📊 FINAL EXTRACTED ENTITIES:")
            logger.info(json.dumps(
                {k: v for k, v in entities.items() if k != 'medicalHistory'},
                indent=2, default=str
            ))
            return entities

        except Exception as e:
            logger.error(f"❌ Entity extraction error: {str(e)}", exc_info=True)
            return self._empty_result()

    # ------------------------------------------------------------------
    # SECTION SPLITTER
    # ------------------------------------------------------------------
    def _split_into_sections(self, text: str) -> Dict[str, str]:
        """
        Split the document into named sections using header detection.
        Each section contains only the text between its header and the next header.
        """
        lines = text.split('\n')
        sections: Dict[str, str] = {}
        current_key = None
        buffer = []

        for line in lines:
            stripped = line.strip().upper()

            # Try to match a known section header
            matched_key = None
            for header, key in self.section_headers.items():
                if stripped == header or stripped.startswith(header):
                    matched_key = key
                    break

            if matched_key:
                # Save previous section
                if current_key and buffer:
                    sections[current_key] = '\n'.join(buffer).strip()
                current_key = matched_key
                buffer = []
            else:
                if current_key is not None:
                    buffer.append(line)

        # Save last section
        if current_key and buffer:
            sections[current_key] = '\n'.join(buffer).strip()

        return sections

    # ------------------------------------------------------------------
    # SECTION PARSERS
    # ------------------------------------------------------------------
    def _parse_demographics(self, text: str) -> Dict[str, str]:
        result = {
            'name': 'NA', 'patientId': 'NA', 'dateOfBirth': 'NA',
            'age': 'NA', 'gender': 'NA', 'email': 'NA', 'phone': 'NA'
        }
        if not text:
            return result

        patterns = {
            'name':        r'Name\s*:\s*(.+)',
            'patientId':   r'Patient\s*ID\s*:\s*(.+)',
            'dateOfBirth': r'Date\s*of\s*Birth\s*:\s*(.+)',
            'age':         r'\((\d+\s*years?)\)',
            'gender':      r'Gender\s*:\s*(.+)',
            'email':       r'Email\s*:\s*(\S+@\S+)',
            'phone':       r'Phone\s*:\s*([\+\d\s\-]+)',
        }
        for field, pattern in patterns.items():
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                result[field] = m.group(1).strip()

        return result

    def _parse_address(self, text: str) -> str:
        if not text:
            return 'NA'
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        return ', '.join(lines) if lines else 'NA'

    def _parse_bullet_list(self, text: str) -> List[str]:
        """Extract bullet-point items from a section."""
        if not text:
            return []
        items = []
        for line in text.split('\n'):
            line = line.strip()
            if line.startswith(('•', '*', '-', '–')):
                item = re.sub(r'^[•\*\-–]\s*', '', line).strip()
                if item and item.lower() != 'na':
                    items.append(item)
        return items

    def _parse_medications(self, text: str) -> List[Dict]:
        """
        Parse medications section.
        Handles formats like:
          • Metformin – Diabetes Control (500mg twice daily)
          • Amlodipine – Blood Pressure (5mg once daily)
        """
        if not text:
            return []

        medications = []
        for line in text.split('\n'):
            line = line.strip()
            if not line.startswith(('•', '*', '-', '–')):
                continue

            raw = re.sub(r'^[•\*\-–]\s*', '', line).strip()
            if not raw or raw.lower() == 'na':
                continue

            med = {'name': raw, 'purpose': 'NA', 'dosage': 'NA'}

            # Extract dosage from parentheses: (500mg twice daily)
            dosage_match = re.search(r'\(([^)]+(?:mg|mcg|g|ml|once|twice|daily|weekly)[^)]*)\)', raw, re.IGNORECASE)
            if dosage_match:
                med['dosage'] = dosage_match.group(1).strip()
                raw = raw[:dosage_match.start()].strip()

            # Split on dash/em-dash: "Metformin – Diabetes Control"
            parts = re.split(r'\s*[–\-—]\s*', raw, maxsplit=1)
            med['name'] = parts[0].strip()
            if len(parts) > 1:
                med['purpose'] = parts[1].strip()

            medications.append(med)

        return medications

    def _parse_structured_items(self, text: str, sub_fields: List[str],
                                 name_key: str = 'name') -> List[Dict]:
        """
        Generic parser for sections that have:
          • Item Name
            Field1: value
            Field2: value
        """
        if not text:
            return []

        items = []
        current: Optional[Dict] = None

        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue

            if line.startswith(('•', '*', '-', '–')):
                if current:
                    items.append(current)
                raw_name = re.sub(r'^[•\*\-–]\s*', '', line).strip()

                if name_key == 'name_with_type':
                    # e.g. "Aspirin (Antiplatelet)" → name=Aspirin, type=Antiplatelet
                    m = re.match(r'(.+?)\s*\(([^)]+)\)', raw_name)
                    if m:
                        current = {'name': m.group(1).strip(),
                                   'type': m.group(2).strip()}
                    else:
                        current = {'name': raw_name, 'type': 'NA'}
                else:
                    current = {'name': raw_name}

                for sf in sub_fields:
                    if sf.lower() != 'type':  # already set above if name_with_type
                        current[sf.lower()] = 'NA'
            else:
                if current is None:
                    continue
                for sf in sub_fields:
                    if line.lower().startswith(sf.lower() + ':'):
                        current[sf.lower()] = line[len(sf)+1:].strip()
                        break

        if current:
            items.append(current)

        return items

    def _parse_emergency_contact(self, text: str) -> Dict[str, str]:
        result = {'name': 'NA', 'relationship': 'NA', 'phone': 'NA'}
        if not text:
            return result

        for line in text.split('\n'):
            line = line.strip()
            m = re.match(r'Name\s*:\s*(.+)', line, re.IGNORECASE)
            if m:
                result['name'] = m.group(1).strip()
            m = re.match(r'Relationship\s*:\s*(.+)', line, re.IGNORECASE)
            if m:
                result['relationship'] = m.group(1).strip()
            m = re.match(r'Phone\s*:\s*([\+\d\s\-]+)', line, re.IGNORECASE)
            if m:
                result['phone'] = m.group(1).strip()

        return result

    def _parse_medical_history(self, text: str) -> List[Dict]:
        """
        Parse nested YEAR / Month / Day – TYPE description structure.
        """
        if not text:
            return []

        history = []
        current_year = None
        current_month = None

        month_names = {
            'january','february','march','april','may','june',
            'july','august','september','october','november','december'
        }

        for line in text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue

            # YEAR line: "YEAR 2024" or just "2024"
            year_m = re.match(r'^(?:YEAR\s+)?(\d{4})$', stripped)
            if year_m:
                current_year = year_m.group(1)
                continue

            # Month line: "March" alone
            if stripped.lower() in month_names:
                current_month = stripped.capitalize()
                continue

            # Record line: "15 March – CONSULTATION ..."  or "• 15 March – ..."
            record_m = re.match(
                r'^[•\-\*]?\s*(\d{1,2})\s+([A-Za-z]+)\s*[–\-]\s*([A-Z\s]+?)\s+(.*)',
                stripped
            )
            if record_m and current_year:
                history.append({
                    'year': current_year,
                    'month': record_m.group(2).capitalize(),
                    'day': int(record_m.group(1)),
                    'type': record_m.group(3).strip(),
                    'description': record_m.group(4).strip()
                })

        return history

    # ------------------------------------------------------------------
    # VITALS
    # ------------------------------------------------------------------
    def _extract_vitals(self, text: str) -> Dict[str, str]:
        vitals = {}
        patterns = {
            'bp':     r'(\d{2,3})\s*/\s*(\d{2,3})\s*(?:mm\s*Hg)?',
            'hr':     r'(?:HR|heart rate|pulse)[:\s]*(\d{2,3})\s*(?:bpm)?',
            'temp':   r'(?:temp|temperature)[:\s]*(\d{2,3}(?:\.\d)?)\s*(?:°?[FC]?)',
            'weight': r'(?:wt|weight)[:\s]*(\d+(?:\.\d)?)\s*(?:kg|lbs?)',
            'height': r'(?:ht|height)[:\s]*(\d+(?:\.\d)?)\s*(?:cm|m|in)'
        }
        for key, pattern in patterns.items():
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                vitals[key] = m.group(0)
        return vitals

    # ------------------------------------------------------------------
    # EMPTY RESULT
    # ------------------------------------------------------------------
    def _empty_result(self) -> Dict:
        return {
            'demographics':      {},
            'address':           'NA',
            'allergies':         [],
            'comorbidConditions':[],
            'chronicDiseases':   [],
            'medications':       [],
            'pastSurgeries':     [],
            'majorIllnesses':    [],
            'interventions':     [],
            'bloodThinner':      [],
            'emergencyContact':  {},
            'medicalHistory':    [],
            'diagnoses':         [],
            'lab_results':       [],
            'dates':             [],
            'doctors':           [],
            'hospitals':         [],
            'vitals':            {}
        }