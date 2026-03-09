import pytesseract
from PIL import Image
import pdf2image
import docx2txt
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class OCRProcessor:
    def __init__(self):
        self.supported_formats = ['.pdf', '.txt', '.docx', '.jpg', '.jpeg', '.png']
        
    def extract_text(self, file_path: str, mime_type: str) -> str:
        """Extract text from various file formats"""
        try:
            file_path = str(file_path)
            
            if mime_type == 'application/pdf' or file_path.lower().endswith('.pdf'):
                return self._extract_from_pdf(file_path)
                
            elif mime_type.startswith('image/') or file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
                return self._extract_from_image(file_path)
                
            elif mime_type == 'text/plain' or file_path.lower().endswith('.txt'):
                return self._extract_from_text(file_path)
                
            elif mime_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                              'application/msword'] or file_path.lower().endswith('.docx'):
                return self._extract_from_docx(file_path)
            
            else:
                raise ValueError(f"Unsupported file type: {mime_type}")
                
        except Exception as e:
            logger.error(f"OCR extraction error: {str(e)}")
            return ""
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        try:
            images = pdf2image.convert_from_path(file_path)
            text = ""
            for i, image in enumerate(images):
                logger.info(f"Processing PDF page {i+1}/{len(images)}")
                text += pytesseract.image_to_string(image)
            return text
        except Exception as e:
            logger.error(f"PDF extraction error: {str(e)}")
            return ""
    
    def _extract_from_image(self, file_path: str) -> str:
        """Extract text from image"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            logger.error(f"Image OCR error: {str(e)}")
            return ""
    
    def _extract_from_text(self, file_path: str) -> str:
        """Read text file directly"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Text file error: {str(e)}")
            return ""
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        try:
            return docx2txt.process(file_path)
        except Exception as e:
            logger.error(f"DOCX extraction error: {str(e)}")
            return ""