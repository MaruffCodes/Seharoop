import logging
from typing import Dict, Any, Optional
from .slm_loader import SLMLoader
from .prompt_templates import PromptTemplates
import json

logger = logging.getLogger(__name__)

class SummaryGenerator:
    """Generate medical summaries using SLM"""
    
    def __init__(self, model_path: str = None):
        self.slm_loader = SLMLoader(model_path)
        self.templates = PromptTemplates()
        self.model_loaded = False
        
    def initialize(self) -> bool:
        """Load the SLM model"""
        self.model_loaded = self.slm_loader.load_model()
        return self.model_loaded
    
    def generate_general_summary(
        self, 
        patient_data: Dict[str, Any], 
        extracted_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate general medical summary"""
        if not self.model_loaded:
            logger.error("SLM model not initialized")
            return None
        
        try:
            # Create prompt
            prompt = self.templates.get_general_summary_prompt(
                patient_data, 
                extracted_data
            )
            
            logger.info(f"📝 Prompt length: {len(prompt)} characters")
            
            # Generate summary
            raw_summary = self.slm_loader.generate_summary(
                prompt,
                temperature=0.7,
                max_tokens=1500
            )
            
            if not raw_summary:
                logger.warning("⚠️ No summary generated")
                return None
            
            # Parse and structure the summary
            structured_summary = self._parse_summary(raw_summary)
            
            return {
                "success": True,
                "raw_summary": raw_summary,
                "structured_summary": structured_summary,
                "type": "general"
            }
            
        except Exception as e:
            logger.error(f"Error generating general summary: {str(e)}")
            return None
    
    def generate_cardiology_summary(
        self,
        patient_data: Dict[str, Any],
        cardiac_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate cardiology-specific summary"""
        if not self.model_loaded:
            logger.error("SLM model not initialized")
            return None
        
        try:
            prompt = self.templates.get_cardiology_summary_prompt(
                patient_data,
                cardiac_data
            )
            
            raw_summary = self.slm_loader.generate_summary(
                prompt,
                temperature=0.7,
                max_tokens=1000
            )
            
            if not raw_summary:
                return None
            
            return {
                "success": True,
                "raw_summary": raw_summary,
                "type": "cardiology"
            }
            
        except Exception as e:
            logger.error(f"Error generating cardiology summary: {str(e)}")
            return None
    
    def generate_orthopedic_summary(
        self,
        patient_data: Dict[str, Any],
        orthopedic_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate orthopedic-specific summary"""
        if not self.model_loaded:
            logger.error("SLM model not initialized")
            return None
        
        try:
            prompt = self.templates.get_orthopedic_summary_prompt(
                patient_data,
                orthopedic_data
            )
            
            raw_summary = self.slm_loader.generate_summary(
                prompt,
                temperature=0.7,
                max_tokens=1000
            )
            
            if not raw_summary:
                return None
            
            return {
                "success": True,
                "raw_summary": raw_summary,
                "type": "orthopedic"
            }
            
        except Exception as e:
            logger.error(f"Error generating orthopedic summary: {str(e)}")
            return None
    
    def _parse_summary(self, raw_summary: str) -> Dict[str, Any]:
        """Parse raw summary into structured format"""
        sections = {}
        current_section = None
        current_content = []
        
        for line in raw_summary.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            # Check if line is a section header (all caps or ends with ':')
            if line.isupper() or line.endswith(':'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content)
                current_section = line.rstrip(':').strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Add last section
        if current_section and current_content:
            sections[current_section] = '\n'.join(current_content)
        
        return sections