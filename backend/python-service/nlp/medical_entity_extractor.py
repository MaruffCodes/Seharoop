# import spacy
# import re
# from typing import Dict, List, Any, Set, Optional
# import logging
# import json

# logger = logging.getLogger(__name__)

# class MedicalEntityExtractor:
#     def __init__(self):
#         try:
#             self.nlp = spacy.load("en_core_sci_md")
#             logger.info("✅ Loaded SciSpacy medical model")
#         except:
#             self.nlp = spacy.load("en_core_web_sm")
#             logger.warning("⚠️ Medical model not found, using general model")
        
#         self.seen_items: Dict[str, Set[str]] = {
#             'allergies': set(),
#             'comorbidConditions': set(),
#             'chronicDiseases': set(),
#             'diagnoses': set(),
#             'medications': set(),
#             'pastSurgeries': set(),
#             'majorIllnesses': set(),
#             'interventions': set(),
#             'bloodThinner': set(),
#             'hospitals': set(),
#             'doctors': set()
#         }
    
#     def reset_seen_items(self) -> None:
#         for key in self.seen_items:
#             self.seen_items[key].clear()
    
#     def _remove_bullet(self, text: str) -> str:
#         """Remove any bullet/list character from the start of a string."""
#         return re.sub(r'^[\s•*\-–—▪✓►→❯›¢£¥§©®™+|/\\«»]+', '', text).strip()
    
#     def _is_bullet(self, text: str) -> bool:
#         """Check if text starts with a bullet character."""
#         return bool(re.match(r'^[\s•*\-–—▪✓►→❯›¢£¥§©®™+|/\\«»]', text))
    
#     def _split_items(self, text: str, separators: List[str] = None) -> List[str]:
#         """Split text into items using multiple separators - IMPROVED."""
#         if separators is None:
#             separators = ['•', '*', '–', '—', '▪', '✓', '►', '→', '¢', '+', '|', '«', '»']
        
#         # Build regex pattern for separators
#         pattern = '|'.join(re.escape(s) for s in separators)
        
#         # Split by separators
#         items = re.split(f'[{pattern}]', text)
        
#         # Clean each item
#         cleaned = []
#         for item in items:
#             # Remove extra whitespace and special chars
#             item = re.sub(r'[«»]', '', item).strip()
#             item = re.sub(r'\s+', ' ', item).strip()
            
#             if item and len(item) > 1 and item.upper() != 'NA' and item != 'None':
#                 cleaned.append(item)
        
#         return cleaned if cleaned else [text.strip()] if text.strip() else []
    
#     def extract(self, text: str) -> Dict[str, Any]:
#         """Extract medical entities from any document format."""
#         if not text:
#             return self._empty_result()
        
#         logger.info("=" * 50)
#         logger.info("🔍 STARTING MEDICAL ENTITY EXTRACTION")
#         logger.info("=" * 50)
#         logger.info(f"📄 Text length: {len(text)} characters")
        
#         self.reset_seen_items()
        
#         try:
#             entities = {
#                 'diagnoses': [],
#                 'medications': [],
#                 'lab_results': [],
#                 'allergies': [],
#                 'dates': [],
#                 'doctors': [],
#                 'hospitals': [],
#                 'vitals': {},
#                 'pastSurgeries': [],
#                 'majorIllnesses': [],
#                 'interventions': [],
#                 'bloodThinner': [],
#                 'emergencyContact': {},
#                 'medicalHistory': [],
#                 'comorbidConditions': [],
#                 'chronicDiseases': [],
#                 'currentMedications': []
#             }
            
#             # Universal section extraction (handles ALL formats)
#             sections = self._extract_sections_universal(text)
#             logger.info(f"📋 Found sections: {list(sections.keys())}")
            
#             # ======= ALLERGIES ================================================
#             allergy_text = sections.get('ALLERGIES', '')
#             if allergy_text:
#                 items = self._split_items(allergy_text)
#                 for item in items:
#                     name = re.sub(r'[«»]', '', item).strip()
#                     if name and len(name) > 1:
#                         key = name.lower()
#                         if key not in self.seen_items['allergies']:
#                             self.seen_items['allergies'].add(key)
#                             entities['allergies'].append(name)
#                             logger.info(f"  Found allergy: {name}")
            
#             # ======= COMORBID CONDITIONS ======================================
#             comorbid_text = sections.get('COMORBID CONDITIONS', '')
#             if comorbid_text:
#                 items = self._split_items(comorbid_text)
#                 for item in items:
#                     name = re.sub(r'[()]', '', item).strip()
#                     if name and len(name) > 1:
#                         key = name.lower()
#                         if key not in self.seen_items['comorbidConditions']:
#                             self.seen_items['comorbidConditions'].add(key)
#                             entities['comorbidConditions'].append(name)
#                             logger.info(f"  Found comorbid condition: {name}")
            
#             # ======= CHRONIC DISEASES =========================================
#             chronic_text = sections.get('CHRONIC DISEASES', '')
#             if chronic_text:
#                 items = self._split_items(chronic_text)
#                 for item in items:
#                     name = item.strip()
#                     if name and len(name) > 1:
#                         key = name.lower()
#                         if key not in self.seen_items['chronicDiseases']:
#                             self.seen_items['chronicDiseases'].add(key)
#                             self.seen_items['diagnoses'].add(key)
#                             entities['chronicDiseases'].append(name)
#                             entities['diagnoses'].append(name)
#                             logger.info(f"  Found chronic disease: {name}")
            
#             # ======= CURRENT MEDICATIONS ======================================
#             med_text = sections.get('CURRENT MEDICATIONS', '')
#             if med_text:
#                 logger.info(f"📋 Raw medication text: {repr(med_text[:400])}")
#                 self._parse_medications_universal(med_text, entities)
            
#             # ======= PAST SURGERIES ===========================================
#             surgery_text = sections.get('PAST SURGERIES', '')
#             if surgery_text:
#                 logger.info(f"📋 Raw surgery text: {repr(surgery_text[:200])}")
#                 self._parse_surgeries_universal(surgery_text, entities)
            
#             # ======= MAJOR ILLNESSES ==========================================
#             major_text = sections.get('MAJOR SURGERIES / ILLNESS', '') or sections.get('MAJOR SURGERIES', '')
#             if major_text:
#                 self._parse_major_illnesses_universal(major_text, entities)
            
#             # ======= PREVIOUS INTERVENTIONS ===================================
#             iv_text = sections.get('PREVIOUS INTERVENTIONS', '')
#             if iv_text:
#                 self._parse_interventions_universal(iv_text, entities)
            
#             # ======= BLOOD THINNER ============================================
#             bt_text = sections.get('BLOOD THINNER HISTORY', '')
#             if bt_text:
#                 self._parse_blood_thinner_universal(bt_text, entities)
            
#             # ======= EMERGENCY CONTACT ========================================
#             ec_text = sections.get('EMERGENCY CONTACT', '')
#             if ec_text:
#                 ec_text = re.sub(r'\s+', ' ', ec_text).strip()
                
#                 name_match = re.search(r'Name:\s*([^,\n]+?)(?:\s+Relationship:|$)', ec_text, re.IGNORECASE)
#                 if name_match:
#                     entities['emergencyContact']['name'] = name_match.group(1).strip()
                
#                 rel_match = re.search(r'Relationship:\s*([^,\n]+?)(?:\s+Phone:|$)', ec_text, re.IGNORECASE)
#                 if rel_match:
#                     entities['emergencyContact']['relationship'] = rel_match.group(1).strip()
                
#                 phone_match = re.search(r'Phone:\s*([^,\n]+)', ec_text, re.IGNORECASE)
#                 if phone_match:
#                     entities['emergencyContact']['phone'] = phone_match.group(1).strip()
            
#             # ======= MEDICAL HISTORY ==========================================
#             history_text = sections.get('MEDICAL HISTORY', '')
#             if history_text:
#                 self._parse_medical_history_universal(history_text, entities)
            
#             # ======= DIAGNOSES FALLBACK =======================================
#             self._extract_diagnoses_fallback(text, entities)
            
#             # Clean entities
#             entities = self._clean_entities(entities)
            
#             logger.info("\n" + "=" * 50)
#             logger.info("📊 FINAL EXTRACTED ENTITIES:")
#             logger.info(json.dumps(entities, indent=2, default=str))
#             logger.info("=" * 50)
            
#             return entities
            
#         except Exception as e:
#             logger.error(f"❌ Entity extraction error: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             return self._empty_result()
    
#     # =========================================================================
#     # UNIVERSAL SECTION EXTRACTOR
#     # =========================================================================
    
#     def _extract_sections_universal(self, text: str) -> Dict[str, str]:
#         """Extract sections from ANY document format."""
#         sections = {}
        
#         headers = [
#             'PATIENT DEMOGRAPHICS', 'ADDRESS', 'MEDICAL PROFILE',
#             'ALLERGIES', 'COMORBID CONDITIONS', 'CHRONIC DISEASES',
#             'CURRENT MEDICATIONS', 'PAST SURGERIES', 'MAJOR SURGERIES',
#             'MAJOR SURGERIES / ILLNESS', 'PREVIOUS INTERVENTIONS',
#             'BLOOD THINNER HISTORY', 'EMERGENCY CONTACT', 'MEDICAL HISTORY'
#         ]
        
#         for i, header in enumerate(headers):
#             next_header = headers[i + 1] if i + 1 < len(headers) else None
            
#             if next_header:
#                 pattern = re.compile(
#                     rf'{re.escape(header)}(?::|\s+)(.*?)(?={re.escape(next_header)}|\Z)',
#                     re.DOTALL | re.IGNORECASE
#                 )
#             else:
#                 pattern = re.compile(
#                     rf'{re.escape(header)}(?::|\s+)(.*?)\Z',
#                     re.DOTALL | re.IGNORECASE
#                 )
            
#             match = pattern.search(text)
#             if match:
#                 content = match.group(1).strip()
#                 if content:
#                     sections[header.upper()] = content
#                     logger.info(f"  Found section {header} with content length {len(content)}")
        
#         if not sections:
#             sections = self._extract_sections_by_lines(text, headers)
        
#         return sections
    
#     def _extract_sections_by_lines(self, text: str, headers: List[str]) -> Dict[str, str]:
#         """Fallback: Extract sections by scanning line by line."""
#         sections = {}
#         lines = text.split('\n')
#         current_header = None
#         current_content = []
        
#         for line in lines:
#             line_upper = line.strip().upper()
#             matched_header = None
            
#             for header in headers:
#                 if line_upper.startswith(header.upper()) or header.upper() in line_upper:
#                     matched_header = header.upper()
#                     break
            
#             if matched_header:
#                 if current_header and current_content:
#                     sections[current_header] = ' '.join(current_content).strip()
#                 current_header = matched_header
#                 content = re.sub(rf'^{re.escape(matched_header)}', '', line, flags=re.IGNORECASE).strip()
#                 current_content = [content] if content else []
#             elif current_header:
#                 current_content.append(line.strip())
        
#         if current_header and current_content:
#             sections[current_header] = ' '.join(current_content).strip()
        
#         return sections
    
#     # =========================================================================
#     # UNIVERSAL MEDICATION PARSER
#     # =========================================================================
    
#     def _parse_medications_universal(self, med_text: str, entities: dict) -> None:
#         """Parse medications from ANY format."""
#         med_text = re.sub(r'\s+', ' ', med_text).strip()
#         meds = self._split_items(med_text)
        
#         for med in meds:
#             if not med or len(med) < 3:
#                 continue
            
#             name = None
#             purpose = None
#             dosage = None
            
#             match = re.match(r'^([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*[—–-]\s*([A-Za-z\s]+?)\s*\(([^)]+)\)', med, re.IGNORECASE)
#             if match:
#                 name = match.group(1).strip()
#                 purpose = match.group(2).strip()
#                 dosage = match.group(3).strip()
#             else:
#                 match = re.match(r'^([A-Za-z]+)\s*[—–-]\s*([A-Za-z\s]+?)\s*\(([^)]+)\)', med, re.IGNORECASE)
#                 if match:
#                     name = match.group(1).strip()
#                     purpose = match.group(2).strip()
#                     dosage = match.group(3).strip()
#                 else:
#                     match = re.match(r'^([A-Za-z]+\s+[A-Za-z]+)', med, re.IGNORECASE)
#                     if match:
#                         name = match.group(1).strip()
#                         purpose = "Prescribed"
#                         dosage = "Not specified"
#                     else:
#                         match = re.match(r'^([A-Za-z]+)', med, re.IGNORECASE)
#                         if match:
#                             name = match.group(1).strip()
#                             purpose = "Prescribed"
#                             dosage = "Not specified"
            
#             if name and len(name) >= 2 and name.lower() not in ['diabetes', 'blood', 'pressure', 'cholesterol', 'control']:
#                 name = re.sub(r'[°*]', '', name).strip()
#                 key = name.lower()
                
#                 if key not in self.seen_items['medications']:
#                     self.seen_items['medications'].add(key)
#                     entities['currentMedications'].append({
#                         'name': name,
#                         'purpose': purpose if purpose and purpose != 'Prescribed' else "Prescribed",
#                         'dosage': dosage if dosage else "Not specified"
#                     })
#                     entities['medications'].append(name)
#                     logger.info(f"  ✅ Added medication: {name}")
    
#     # =========================================================================
#     # UNIVERSAL SURGERY PARSER
#     # =========================================================================
    
#     def _parse_surgeries_universal(self, surgery_text: str, entities: dict) -> None:
#         """Parse surgeries from ANY format."""
#         surgery_text = re.sub(r'\s+', ' ', surgery_text).strip()
#         surgeries = self._split_items(surgery_text)
        
#         for surgery in surgeries:
#             if not surgery or len(surgery) < 5:
#                 continue
            
#             name = surgery.split('Date:')[0].strip() if 'Date:' in surgery else surgery
#             name = name.split('Hospital:')[0].strip()
#             name = re.sub(r'^[«»]+', '', name).strip()
#             name = re.sub(r'\s+$', '', name)
            
#             if not name or name.upper() == 'NA' or len(name) < 3:
#                 continue
            
#             key = name.lower()
#             if key not in self.seen_items['pastSurgeries']:
#                 self.seen_items['pastSurgeries'].add(key)
                
#                 surgery_obj = {
#                     'name': name,
#                     'date': 'NA',
#                     'hospital': 'NA',
#                     'surgeon': 'NA'
#                 }
                
#                 date_match = re.search(r'Date:\s*([^,\n]+?)(?:\s+Hospital:|$)', surgery, re.IGNORECASE)
#                 if date_match:
#                     surgery_obj['date'] = date_match.group(1).strip()
                
#                 hospital_match = re.search(r'Hospital:\s*([^,\n]+?)(?:\s+Surgeon:|$)', surgery, re.IGNORECASE)
#                 if hospital_match:
#                     hospital = hospital_match.group(1).strip()
#                     surgery_obj['hospital'] = hospital
#                     if hospital not in self.seen_items['hospitals']:
#                         self.seen_items['hospitals'].add(hospital)
#                         entities['hospitals'].append(hospital)
                
#                 surgeon_match = re.search(r'Surgeon:\s*([^,\n]+)', surgery, re.IGNORECASE)
#                 if surgeon_match:
#                     surgeon = surgeon_match.group(1).strip()
#                     surgery_obj['surgeon'] = surgeon
#                     if surgeon not in self.seen_items['doctors']:
#                         self.seen_items['doctors'].add(surgeon)
#                         entities['doctors'].append(surgeon)
                
#                 entities['pastSurgeries'].append(surgery_obj)
#                 logger.info(f"  ✅ Found surgery: {name}")
    
#     # =========================================================================
#     # UNIVERSAL MAJOR ILLNESS PARSER
#     # =========================================================================
    
#     def _parse_major_illnesses_universal(self, illness_text: str, entities: dict) -> None:
#         """Parse major illnesses from ANY format."""
#         illness_text = re.sub(r'\s+', ' ', illness_text).strip()
#         illnesses = self._split_items(illness_text)
        
#         for illness in illnesses:
#             if not illness or len(illness) < 5:
#                 continue
            
#             name = illness.split('Date:')[0].strip()
#             name = name.split('Hospital:')[0].strip()
#             name = re.sub(r'^[«»]+', '', name).strip()
            
#             if not name or name.upper() == 'NA' or len(name) < 3:
#                 continue
            
#             key = name.lower()
#             if key not in self.seen_items['majorIllnesses']:
#                 self.seen_items['majorIllnesses'].add(key)
                
#                 illness_obj = {
#                     'name': name,
#                     'date': 'NA',
#                     'hospital': 'NA',
#                     'notes': 'NA'
#                 }
                
#                 date_match = re.search(r'Date:\s*([^,\n]+?)(?:\s+Hospital:|$)', illness, re.IGNORECASE)
#                 if date_match:
#                     illness_obj['date'] = date_match.group(1).strip()
                
#                 hospital_match = re.search(r'Hospital:\s*([^,\n]+?)(?:\s+Notes:|$)', illness, re.IGNORECASE)
#                 if hospital_match:
#                     hospital = hospital_match.group(1).strip()
#                     illness_obj['hospital'] = hospital
#                     if hospital not in self.seen_items['hospitals']:
#                         self.seen_items['hospitals'].add(hospital)
#                         entities['hospitals'].append(hospital)
                
#                 notes_match = re.search(r'Notes:\s*([^,\n]+)', illness, re.IGNORECASE)
#                 if notes_match:
#                     illness_obj['notes'] = notes_match.group(1).strip()
                
#                 entities['majorIllnesses'].append(illness_obj)
#                 logger.info(f"  ✅ Found major illness: {name}")
    
#     # =========================================================================
#     # UNIVERSAL INTERVENTION PARSER
#     # =========================================================================
    
#     def _parse_interventions_universal(self, iv_text: str, entities: dict) -> None:
#         """Parse interventions from ANY format."""
#         iv_text = re.sub(r'\s+', ' ', iv_text).strip()
#         interventions = self._split_items(iv_text)
        
#         for iv in interventions:
#             if not iv or len(iv) < 3:
#                 continue
            
#             name = iv.split('Date:')[0].strip()
#             name = re.sub(r'^[=•*]+', '', name).strip()
            
#             if not name or name.upper() == 'NA' or len(name) < 3:
#                 continue
            
#             key = name.lower()
#             if key not in self.seen_items['interventions']:
#                 self.seen_items['interventions'].add(key)
                
#                 iv_obj = {
#                     'name': name,
#                     'date': 'NA',
#                     'hospital': 'NA'
#                 }
                
#                 date_match = re.search(r'Date:\s*([^,\n]+?)(?:\s+Hospital:|$)', iv, re.IGNORECASE)
#                 if date_match:
#                     iv_obj['date'] = date_match.group(1).strip()
                
#                 hospital_match = re.search(r'Hospital:\s*([^,\n]+)', iv, re.IGNORECASE)
#                 if hospital_match:
#                     hospital = hospital_match.group(1).strip()
#                     iv_obj['hospital'] = hospital
#                     if hospital not in self.seen_items['hospitals']:
#                         self.seen_items['hospitals'].add(hospital)
#                         entities['hospitals'].append(hospital)
                
#                 entities['interventions'].append(iv_obj)
#                 logger.info(f"  ✅ Found intervention: {name}")
    
#     # =========================================================================
#     # UNIVERSAL BLOOD THINNER PARSER
#     # =========================================================================
    
#     def _parse_blood_thinner_universal(self, bt_text: str, entities: dict) -> None:
#         """Parse blood thinners from ANY format."""
#         if 'none' in bt_text.lower():
#             return
        
#         bt_text = re.sub(r'\s+', ' ', bt_text).strip()
#         bt_items = self._split_items(bt_text)
        
#         for bt in bt_items:
#             if not bt or len(bt) < 3 or bt.upper() == 'NONE':
#                 continue
            
#             name = bt
#             bt_type = 'NA'
#             duration = 'NA'
#             reason = 'NA'
            
#             match = re.match(r'^(.+?)\s*\(([^)]+)\)', bt)
#             if match:
#                 name = match.group(1).strip()
#                 bt_type = match.group(2).strip()
            
#             duration_match = re.search(r'Duration:\s*([^,\n]+)', bt, re.IGNORECASE)
#             if duration_match:
#                 duration = duration_match.group(1).strip()
            
#             reason_match = re.search(r'Reason:\s*([^,\n]+)', bt, re.IGNORECASE)
#             if reason_match:
#                 reason = reason_match.group(1).strip()
            
#             key = name.lower()
#             if key not in self.seen_items['bloodThinner']:
#                 self.seen_items['bloodThinner'].add(key)
#                 entities['bloodThinner'].append({
#                     'name': name,
#                     'type': bt_type,
#                     'duration': duration,
#                     'reason': reason
#                 })
#                 logger.info(f"  ✅ Found blood thinner: {name}")
    
#     # =========================================================================
#     # MEDICAL HISTORY PARSER - IMPROVED
#     # =========================================================================
    
#     def _parse_medical_history_universal(self, history_text: str, entities: dict) -> None:
#         """Parse medical history from ANY format - IMPROVED."""
#         if not history_text:
#             return
        
#         logger.info(f"📋 Raw medical history text: {repr(history_text[:300])}")
        
#         # Split into lines and process
#         lines = history_text.split('\n')
        
#         current_year = None
#         current_month = None
        
#         for line in lines:
#             line = line.strip()
#             if not line:
#                 continue
            
#             # Check for YEAR
#             year_match = re.match(r'YEAR\s+(\d{4})', line, re.IGNORECASE)
#             if year_match:
#                 current_year = year_match.group(1)
#                 logger.info(f"  Found year: {current_year}")
#                 continue
            
#             # Check for month (January, February, etc.)
#             month_match = re.match(r'^(January|February|March|April|May|June|July|August|September|October|November|December)', line, re.IGNORECASE)
#             if month_match:
#                 current_month = month_match.group(1)
#                 logger.info(f"  Found month: {current_month}")
#                 continue
            
#             # Check for bullet point record
#             if self._is_bullet(line) or line.startswith('*') or line.startswith('•'):
#                 # Remove bullet
#                 record_line = self._remove_bullet(line)
                
#                 # Pattern: "15 March — CONSULTATION" or "10 January —- LAB TEST"
#                 record_match = re.match(r'^(\d+)\s+[A-Za-z]+\s*[—–-]+\s*([A-Z]+)\s*(.*?)$', record_line, re.IGNORECASE)
#                 if record_match:
#                     day = record_match.group(1)
#                     record_type = record_match.group(2).strip()
#                     description = record_match.group(3).strip() if record_match.group(3) else ""
                    
#                     if not description and len(record_line) > len(record_match.group(0)):
#                         description = record_line[len(record_match.group(0)):].strip()
                    
#                     if current_year and current_month:
#                         entities['medicalHistory'].append({
#                             'year': current_year,
#                             'month': current_month,
#                             'day': int(day),
#                             'type': record_type,
#                             'description': description[:500] if description else "No description"
#                         })
#                         logger.info(f"  Added history: {current_year}/{current_month}/{day} - {record_type}")
#                 else:
#                     # Try alternative pattern without day
#                     alt_match = re.match(r'^[A-Za-z]+\s*[—–-]+\s*([A-Z]+)\s*(.*?)$', record_line, re.IGNORECASE)
#                     if alt_match and current_year and current_month:
#                         record_type = alt_match.group(1).strip()
#                         description = alt_match.group(2).strip() if alt_match.group(2) else ""
#                         entities['medicalHistory'].append({
#                             'year': current_year,
#                             'month': current_month,
#                             'day': 0,
#                             'type': record_type,
#                             'description': description[:500] if description else "No description"
#                         })
#                         logger.info(f"  Added history: {current_year}/{current_month} - {record_type}")
    
#     # =========================================================================
#     # DIAGNOSES FALLBACK
#     # =========================================================================
    
#     def _extract_diagnoses_fallback(self, text: str, entities: dict) -> None:
#         """Extract diagnoses from various patterns."""
#         patterns = [
#             (r'Diabetes Type:\s*([^\n]+)', None),
#             (r'Type\s*2\s*Diabetes', 'Type 2 Diabetes'),
#             (r'Hypertension', 'Hypertension'),
#             (r'High Cholesterol', 'High Cholesterol'),
#             (r'Rheumatoid Arthritis', 'Rheumatoid Arthritis'),
#             (r'Ankylosing Spondylitis', 'Ankylosing Spondylitis'),
#             (r'GERD\s*\([^)]+\)', 'GERD'),
#         ]
        
#         for pattern, value in patterns:
#             matches = re.findall(pattern, text, re.IGNORECASE)
#             for match in matches:
#                 diag = value if value else (match.strip() if isinstance(match, str) else match[0].strip())
#                 if diag and diag.upper() != 'NA' and diag.lower() not in self.seen_items['diagnoses']:
#                     self.seen_items['diagnoses'].add(diag.lower())
#                     entities['diagnoses'].append(diag)
    
#     # =========================================================================
#     # CLEAN ENTITIES
#     # =========================================================================
    
#     def _clean_entities(self, entities: Dict[str, Any]) -> Dict[str, Any]:
#         """Clean extracted entities."""
#         cleaned = {}
#         for key, value in entities.items():
#             if isinstance(value, list):
#                 cleaned_list = []
#                 for item in value:
#                     if isinstance(item, dict):
#                         name_val = item.get('name', '')
#                         if name_val and str(name_val).upper() != 'NA' and len(name_val) > 1:
#                             cleaned_list.append(item)
#                         elif 'name' not in item and item:
#                             cleaned_list.append(item)
#                     elif item and (not isinstance(item, str) or item.upper() != 'NA'):
#                         cleaned_list.append(item)
#                 cleaned[key] = cleaned_list
#             elif isinstance(value, dict):
#                 cleaned[key] = value
#             else:
#                 cleaned[key] = value
#         return cleaned
    
#     def _empty_result(self) -> Dict[str, Any]:
#         return {
#             'diagnoses': [],
#             'medications': [],
#             'lab_results': [],
#             'allergies': [],
#             'dates': [],
#             'doctors': [],
#             'hospitals': [],
#             'vitals': {},
#             'pastSurgeries': [],
#             'majorIllnesses': [],
#             'interventions': [],
#             'bloodThinner': [],
#             'emergencyContact': {},
#             'medicalHistory': [],
#             'comorbidConditions': [],
#             'chronicDiseases': [],
#             'currentMedications': []
#         }

import spacy
import re
from typing import Dict, List, Any, Set, Optional
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
        
        self.seen_items: Dict[str, Set[str]] = {
            'allergies': set(),
            'comorbidConditions': set(),
            'chronicDiseases': set(),
            'diagnoses': set(),
            'medications': set(),
            'pastSurgeries': set(),
            'majorIllnesses': set(),
            'interventions': set(),
            'bloodThinner': set(),
            'hospitals': set(),
            'doctors': set()
        }
    
    def reset_seen_items(self) -> None:
        for key in self.seen_items:
            self.seen_items[key].clear()
    
    def _remove_bullet(self, text: str) -> str:
        """Remove any bullet/list character from the start of a string."""
        return re.sub(r'^[\s•*\-–—▪✓►→❯›¢£¥§©®™+|/\\«»]+', '', text).strip()
    
    def _is_bullet(self, text: str) -> bool:
        """Check if text starts with a bullet character."""
        return bool(re.match(r'^[\s•*\-–—▪✓►→❯›¢£¥§©®™+|/\\«»]', text))
    
    def _split_items(self, text: str, separators: List[str] = None) -> List[str]:
        """Split text into items using multiple separators - IMPROVED."""
        if separators is None:
            separators = ['•', '*', '–', '—', '▪', '✓', '►', '→', '¢', '+', '|', '«', '»']
        
        # Build regex pattern for separators
        pattern = '|'.join(re.escape(s) for s in separators)
        
        # Split by separators
        items = re.split(f'[{pattern}]', text)
        
        # Clean each item
        cleaned = []
        for item in items:
            # Remove extra whitespace and special chars
            item = re.sub(r'[«»]', '', item).strip()
            item = re.sub(r'\s+', ' ', item).strip()
            
            if item and len(item) > 1 and item.upper() != 'NA' and item != 'None':
                cleaned.append(item)
        
        return cleaned if cleaned else [text.strip()] if text.strip() else []
    
    def extract(self, text: str) -> Dict[str, Any]:
        """Extract medical entities from any document format."""
        if not text:
            return self._empty_result()
        
        logger.info("=" * 50)
        logger.info("🔍 STARTING MEDICAL ENTITY EXTRACTION")
        logger.info("=" * 50)
        logger.info(f"📄 Text length: {len(text)} characters")
        
        self.reset_seen_items()
        
        try:
            entities = {
                'diagnoses': [],
                'medications': [],
                'lab_results': [],
                'allergies': [],
                'dates': [],
                'doctors': [],
                'hospitals': [],
                'vitals': {},
                'pastSurgeries': [],
                'majorIllnesses': [],
                'interventions': [],
                'bloodThinner': [],
                'emergencyContact': {},
                'medicalHistory': [],
                'comorbidConditions': [],
                'chronicDiseases': [],
                'currentMedications': []
            }
            
            # Universal section extraction (handles ALL formats)
            sections = self._extract_sections_universal(text)
            logger.info(f"📋 Found sections: {list(sections.keys())}")
            
            # ======= ALLERGIES ================================================
            allergy_text = sections.get('ALLERGIES', '')
            if allergy_text:
                items = self._split_items(allergy_text)
                for item in items:
                    name = re.sub(r'[«»]', '', item).strip()
                    if name and len(name) > 1:
                        key = name.lower()
                        if key not in self.seen_items['allergies']:
                            self.seen_items['allergies'].add(key)
                            entities['allergies'].append(name)
                            logger.info(f"  Found allergy: {name}")
            
            # ======= COMORBID CONDITIONS ======================================
            comorbid_text = sections.get('COMORBID CONDITIONS', '')
            if comorbid_text:
                items = self._split_items(comorbid_text)
                for item in items:
                    name = re.sub(r'[()]', '', item).strip()
                    if name and len(name) > 1:
                        key = name.lower()
                        if key not in self.seen_items['comorbidConditions']:
                            self.seen_items['comorbidConditions'].add(key)
                            entities['comorbidConditions'].append(name)
                            logger.info(f"  Found comorbid condition: {name}")
            
            # ======= CHRONIC DISEASES =========================================
            chronic_text = sections.get('CHRONIC DISEASES', '')
            if chronic_text:
                items = self._split_items(chronic_text)
                for item in items:
                    name = item.strip()
                    if name and len(name) > 1:
                        key = name.lower()
                        if key not in self.seen_items['chronicDiseases']:
                            self.seen_items['chronicDiseases'].add(key)
                            self.seen_items['diagnoses'].add(key)
                            entities['chronicDiseases'].append(name)
                            entities['diagnoses'].append(name)
                            logger.info(f"  Found chronic disease: {name}")
            
            # ======= CURRENT MEDICATIONS ======================================
            med_text = sections.get('CURRENT MEDICATIONS', '')
            if med_text:
                logger.info(f"📋 Raw medication text: {repr(med_text[:400])}")
                self._parse_medications_universal(med_text, entities)
            
            # ======= PAST SURGERIES ===========================================
            surgery_text = sections.get('PAST SURGERIES', '')
            if surgery_text:
                logger.info(f"📋 Raw surgery text: {repr(surgery_text[:200])}")
                self._parse_surgeries_universal(surgery_text, entities)
            
            # ======= MAJOR ILLNESSES ==========================================
            major_text = sections.get('MAJOR SURGERIES / ILLNESS', '') or sections.get('MAJOR SURGERIES', '')
            if major_text:
                self._parse_major_illnesses_universal(major_text, entities)
            
            # ======= PREVIOUS INTERVENTIONS ===================================
            iv_text = sections.get('PREVIOUS INTERVENTIONS', '')
            if iv_text:
                self._parse_interventions_universal(iv_text, entities)
            
            # ======= BLOOD THINNER ============================================
            bt_text = sections.get('BLOOD THINNER HISTORY', '')
            if bt_text:
                self._parse_blood_thinner_universal(bt_text, entities)
            
            # ======= EMERGENCY CONTACT ========================================
            ec_text = sections.get('EMERGENCY CONTACT', '')
            if ec_text:
                # Clean the text first
                ec_text = re.sub(r'\s+', ' ', ec_text).strip()
                
                name_match = re.search(r'Name:\s*([^,\n]+?)(?:\s+Relationship:|$)', ec_text, re.IGNORECASE)
                if name_match:
                    entities['emergencyContact']['name'] = name_match.group(1).strip()
                
                rel_match = re.search(r'Relationship:\s*([^,\n]+?)(?:\s+Phone:|$)', ec_text, re.IGNORECASE)
                if rel_match:
                    entities['emergencyContact']['relationship'] = rel_match.group(1).strip()
                
                phone_match = re.search(r'Phone:\s*([^,\n]+)', ec_text, re.IGNORECASE)
                if phone_match:
                    entities['emergencyContact']['phone'] = phone_match.group(1).strip()
            
            # ======= DIAGNOSES FALLBACK =======================================
            self._extract_diagnoses_fallback(text, entities)
            
            # Clean entities
            entities = self._clean_entities(entities)
            
            logger.info("\n" + "=" * 50)
            logger.info("📊 FINAL EXTRACTED ENTITIES:")
            logger.info(json.dumps(entities, indent=2, default=str))
            logger.info("=" * 50)
            
            return entities
            
        except Exception as e:
            logger.error(f"❌ Entity extraction error: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._empty_result()
    
    # =========================================================================
    # UNIVERSAL SECTION EXTRACTOR
    # =========================================================================
    
    def _extract_sections_universal(self, text: str) -> Dict[str, str]:
        """Extract sections from ANY document format."""
        sections = {}
        
        # List of section headers
        headers = [
            'PATIENT DEMOGRAPHICS', 'ADDRESS', 'MEDICAL PROFILE',
            'ALLERGIES', 'COMORBID CONDITIONS', 'CHRONIC DISEASES',
            'CURRENT MEDICATIONS', 'PAST SURGERIES', 'MAJOR SURGERIES',
            'MAJOR SURGERIES / ILLNESS', 'PREVIOUS INTERVENTIONS',
            'BLOOD THINNER HISTORY', 'EMERGENCY CONTACT', 'MEDICAL HISTORY'
        ]
        
        # Method 1: Find headers with content on same line
        for i, header in enumerate(headers):
            next_header = headers[i + 1] if i + 1 < len(headers) else None
            
            if next_header:
                pattern = re.compile(
                    rf'{re.escape(header)}(?::|\s+)(.*?)(?={re.escape(next_header)}|\Z)',
                    re.DOTALL | re.IGNORECASE
                )
            else:
                pattern = re.compile(
                    rf'{re.escape(header)}(?::|\s+)(.*?)\Z',
                    re.DOTALL | re.IGNORECASE
                )
            
            match = pattern.search(text)
            if match:
                content = match.group(1).strip()
                if content:
                    sections[header.upper()] = content
                    logger.info(f"  Found section {header} with content length {len(content)}")
        
        # Method 2: If no sections found, try line-by-line
        if not sections:
            sections = self._extract_sections_by_lines(text, headers)
        
        return sections
    
    def _extract_sections_by_lines(self, text: str, headers: List[str]) -> Dict[str, str]:
        """Fallback: Extract sections by scanning line by line."""
        sections = {}
        lines = text.split('\n')
        current_header = None
        current_content = []
        
        for line in lines:
            line_upper = line.strip().upper()
            matched_header = None
            
            for header in headers:
                if line_upper.startswith(header.upper()) or header.upper() in line_upper:
                    matched_header = header.upper()
                    break
            
            if matched_header:
                if current_header and current_content:
                    sections[current_header] = ' '.join(current_content).strip()
                current_header = matched_header
                content = re.sub(rf'^{re.escape(matched_header)}', '', line, flags=re.IGNORECASE).strip()
                current_content = [content] if content else []
            elif current_header:
                current_content.append(line.strip())
        
        if current_header and current_content:
            sections[current_header] = ' '.join(current_content).strip()
        
        return sections
    
    # =========================================================================
    # UNIVERSAL MEDICATION PARSER - FIXED
    # =========================================================================
    
    def _parse_medications_universal(self, med_text: str, entities: dict) -> None:
        """Parse medications from ANY format - IMPROVED."""
        # Clean the text first
        med_text = re.sub(r'\s+', ' ', med_text).strip()
        
        # Split by bullet points
        meds = self._split_items(med_text)
        
        for med in meds:
            if not med or len(med) < 3:
                continue
            
            name = None
            purpose = None
            dosage = None
            
            # Pattern: "Methotrexate – Autoimmune (15mg once weekly)"
            match = re.match(r'^([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*[—–-]\s*([A-Za-z\s]+?)\s*\(([^)]+)\)', med, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                purpose = match.group(2).strip()
                dosage = match.group(3).strip()
            else:
                # Pattern: "Pantoprazole – Gastric Acidity (40mg before breakfast)"
                match = re.match(r'^([A-Za-z]+)\s*[—–-]\s*([A-Za-z\s]+?)\s*\(([^)]+)\)', med, re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    purpose = match.group(2).strip()
                    dosage = match.group(3).strip()
                else:
                    # Pattern: Just "Folic Acid" (two words)
                    match = re.match(r'^([A-Za-z]+\s+[A-Za-z]+)', med, re.IGNORECASE)
                    if match:
                        name = match.group(1).strip()
                        purpose = "Prescribed"
                        dosage = "Not specified"
                    else:
                        # Pattern: Single word medication
                        match = re.match(r'^([A-Za-z]+)', med, re.IGNORECASE)
                        if match:
                            name = match.group(1).strip()
                            purpose = "Prescribed"
                            dosage = "Not specified"
            
            if name and len(name) >= 2:
                # Clean the name
                name = re.sub(r'[°*]', '', name).strip()
                key = name.lower()
                
                if key not in self.seen_items['medications']:
                    self.seen_items['medications'].add(key)
                    entities['currentMedications'].append({
                        'name': name,
                        'purpose': purpose if purpose and purpose != 'Prescribed' else "Prescribed",
                        'dosage': dosage if dosage else "Not specified"
                    })
                    entities['medications'].append(name)
                    logger.info(f"  ✅ Added medication: {name} ({purpose}, {dosage})")
    
    # =========================================================================
    # UNIVERSAL SURGERY PARSER - FIXED
    # =========================================================================
    
    def _parse_surgeries_universal(self, surgery_text: str, entities: dict) -> None:
        """Parse surgeries from ANY format - IMPROVED."""
        # Clean the text
        surgery_text = re.sub(r'\s+', ' ', surgery_text).strip()
        
        # Split by bullet points
        surgeries = self._split_items(surgery_text)
        
        for surgery in surgeries:
            if not surgery or len(surgery) < 5:
                continue
            
            # Extract name - stop at "Date:" or "Hospital:"
            name = surgery.split('Date:')[0].strip() if 'Date:' in surgery else surgery
            name = name.split('Hospital:')[0].strip()
            name = re.sub(r'^[«»]+', '', name).strip()
            
            # Remove any trailing special characters
            name = re.sub(r'\s+$', '', name)
            
            if not name or name.upper() == 'NA' or len(name) < 3:
                continue
            
            key = name.lower()
            if key not in self.seen_items['pastSurgeries']:
                self.seen_items['pastSurgeries'].add(key)
                
                surgery_obj = {
                    'name': name,
                    'date': 'NA',
                    'hospital': 'NA',
                    'surgeon': 'NA'
                }
                
                # Extract date
                date_match = re.search(r'Date:\s*([^,\n]+?)(?:\s+Hospital:|$)', surgery, re.IGNORECASE)
                if date_match:
                    surgery_obj['date'] = date_match.group(1).strip()
                
                # Extract hospital
                hospital_match = re.search(r'Hospital:\s*([^,\n]+?)(?:\s+Surgeon:|$)', surgery, re.IGNORECASE)
                if hospital_match:
                    hospital = hospital_match.group(1).strip()
                    surgery_obj['hospital'] = hospital
                    if hospital not in self.seen_items['hospitals']:
                        self.seen_items['hospitals'].add(hospital)
                        entities['hospitals'].append(hospital)
                
                # Extract surgeon
                surgeon_match = re.search(r'Surgeon:\s*([^,\n]+)', surgery, re.IGNORECASE)
                if surgeon_match:
                    surgeon = surgeon_match.group(1).strip()
                    surgery_obj['surgeon'] = surgeon
                    if surgeon not in self.seen_items['doctors']:
                        self.seen_items['doctors'].add(surgeon)
                        entities['doctors'].append(surgeon)
                
                entities['pastSurgeries'].append(surgery_obj)
                logger.info(f"  ✅ Found surgery: {name}")
    
    # =========================================================================
    # UNIVERSAL MAJOR ILLNESS PARSER - FIXED
    # =========================================================================
    
    def _parse_major_illnesses_universal(self, illness_text: str, entities: dict) -> None:
        """Parse major illnesses from ANY format - IMPROVED."""
        illness_text = re.sub(r'\s+', ' ', illness_text).strip()
        illnesses = self._split_items(illness_text)
        
        for illness in illnesses:
            if not illness or len(illness) < 5:
                continue
            
            # Extract name
            name = illness.split('Date:')[0].strip()
            name = name.split('Hospital:')[0].strip()
            name = re.sub(r'^[«»]+', '', name).strip()
            
            if not name or name.upper() == 'NA' or len(name) < 3:
                continue
            
            key = name.lower()
            if key not in self.seen_items['majorIllnesses']:
                self.seen_items['majorIllnesses'].add(key)
                
                illness_obj = {
                    'name': name,
                    'date': 'NA',
                    'hospital': 'NA',
                    'notes': 'NA'
                }
                
                # Extract date
                date_match = re.search(r'Date:\s*([^,\n]+?)(?:\s+Hospital:|$)', illness, re.IGNORECASE)
                if date_match:
                    illness_obj['date'] = date_match.group(1).strip()
                
                # Extract hospital
                hospital_match = re.search(r'Hospital:\s*([^,\n]+?)(?:\s+Notes:|$)', illness, re.IGNORECASE)
                if hospital_match:
                    hospital = hospital_match.group(1).strip()
                    illness_obj['hospital'] = hospital
                    if hospital not in self.seen_items['hospitals']:
                        self.seen_items['hospitals'].add(hospital)
                        entities['hospitals'].append(hospital)
                
                # Extract notes
                notes_match = re.search(r'Notes:\s*([^,\n]+)', illness, re.IGNORECASE)
                if notes_match:
                    illness_obj['notes'] = notes_match.group(1).strip()
                
                entities['majorIllnesses'].append(illness_obj)
                logger.info(f"  ✅ Found major illness: {name}")
    
    # =========================================================================
    # UNIVERSAL INTERVENTION PARSER - FIXED
    # =========================================================================
    
    def _parse_interventions_universal(self, iv_text: str, entities: dict) -> None:
        """Parse interventions from ANY format - IMPROVED."""
        iv_text = re.sub(r'\s+', ' ', iv_text).strip()
        interventions = self._split_items(iv_text)
        
        for iv in interventions:
            if not iv or len(iv) < 3:
                continue
            
            # Extract name
            name = iv.split('Date:')[0].strip()
            name = re.sub(r'^[=•*]+', '', name).strip()
            
            if not name or name.upper() == 'NA' or len(name) < 3:
                continue
            
            key = name.lower()
            if key not in self.seen_items['interventions']:
                self.seen_items['interventions'].add(key)
                
                iv_obj = {
                    'name': name,
                    'date': 'NA',
                    'hospital': 'NA'
                }
                
                # Extract date
                date_match = re.search(r'Date:\s*([^,\n]+?)(?:\s+Hospital:|$)', iv, re.IGNORECASE)
                if date_match:
                    iv_obj['date'] = date_match.group(1).strip()
                
                # Extract hospital
                hospital_match = re.search(r'Hospital:\s*([^,\n]+)', iv, re.IGNORECASE)
                if hospital_match:
                    hospital = hospital_match.group(1).strip()
                    iv_obj['hospital'] = hospital
                    if hospital not in self.seen_items['hospitals']:
                        self.seen_items['hospitals'].add(hospital)
                        entities['hospitals'].append(hospital)
                
                entities['interventions'].append(iv_obj)
                logger.info(f"  ✅ Found intervention: {name}")
    
    # =========================================================================
    # UNIVERSAL BLOOD THINNER PARSER
    # =========================================================================
    
    def _parse_blood_thinner_universal(self, bt_text: str, entities: dict) -> None:
        """Parse blood thinners from ANY format."""
        if 'none' in bt_text.lower():
            return
        
        bt_text = re.sub(r'\s+', ' ', bt_text).strip()
        bt_items = self._split_items(bt_text)
        
        for bt in bt_items:
            if not bt or len(bt) < 3 or bt.upper() == 'NONE':
                continue
            
            name = bt
            bt_type = 'NA'
            duration = 'NA'
            reason = 'NA'
            
            # Parse "Name (Type)"
            match = re.match(r'^(.+?)\s*\(([^)]+)\)', bt)
            if match:
                name = match.group(1).strip()
                bt_type = match.group(2).strip()
            
            # Look for duration and reason
            duration_match = re.search(r'Duration:\s*([^,\n]+)', bt, re.IGNORECASE)
            if duration_match:
                duration = duration_match.group(1).strip()
            
            reason_match = re.search(r'Reason:\s*([^,\n]+)', bt, re.IGNORECASE)
            if reason_match:
                reason = reason_match.group(1).strip()
            
            key = name.lower()
            if key not in self.seen_items['bloodThinner']:
                self.seen_items['bloodThinner'].add(key)
                entities['bloodThinner'].append({
                    'name': name,
                    'type': bt_type,
                    'duration': duration,
                    'reason': reason
                })
                logger.info(f"  ✅ Found blood thinner: {name}")
    
    # =========================================================================
    # DIAGNOSES FALLBACK
    # =========================================================================
    
    def _extract_diagnoses_fallback(self, text: str, entities: dict) -> None:
        """Extract diagnoses from various patterns."""
        patterns = [
            (r'Diabetes Type:\s*([^\n]+)', None),
            (r'Type\s*2\s*Diabetes', 'Type 2 Diabetes'),
            (r'Hypertension', 'Hypertension'),
            (r'High Cholesterol', 'High Cholesterol'),
            (r'Rheumatoid Arthritis', 'Rheumatoid Arthritis'),
            (r'Ankylosing Spondylitis', 'Ankylosing Spondylitis'),
            (r'GERD\s*\([^)]+\)', 'GERD'),
        ]
        
        for pattern, value in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                diag = value if value else (match.strip() if isinstance(match, str) else match[0].strip())
                if diag and diag.upper() != 'NA' and diag.lower() not in self.seen_items['diagnoses']:
                    self.seen_items['diagnoses'].add(diag.lower())
                    entities['diagnoses'].append(diag)
    
    # =========================================================================
    # CLEAN ENTITIES
    # =========================================================================
    
    def _clean_entities(self, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Clean extracted entities."""
        cleaned = {}
        for key, value in entities.items():
            if isinstance(value, list):
                cleaned_list = []
                for item in value:
                    if isinstance(item, dict):
                        name_val = item.get('name', '')
                        if name_val and str(name_val).upper() != 'NA' and len(name_val) > 1:
                            cleaned_list.append(item)
                        elif 'name' not in item and item:
                            cleaned_list.append(item)
                    elif item and (not isinstance(item, str) or item.upper() != 'NA'):
                        cleaned_list.append(item)
                cleaned[key] = cleaned_list
            elif isinstance(value, dict):
                cleaned[key] = value
            else:
                cleaned[key] = value
        return cleaned
    
    def _empty_result(self) -> Dict[str, Any]:
        return {
            'diagnoses': [],
            'medications': [],
            'lab_results': [],
            'allergies': [],
            'dates': [],
            'doctors': [],
            'hospitals': [],
            'vitals': {},
            'pastSurgeries': [],
            'majorIllnesses': [],
            'interventions': [],
            'bloodThinner': [],
            'emergencyContact': {},
            'medicalHistory': [],
            'comorbidConditions': [],
            'chronicDiseases': [],
            'currentMedications': []
        }