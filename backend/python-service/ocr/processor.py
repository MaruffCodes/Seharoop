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
        """Extract text from various file formats with detailed logging"""
        logger.info("=" * 50)
        logger.info("🔍 STARTING OCR EXTRACTION")
        logger.info("=" * 50)
        logger.info(f"📂 File: {file_path}")
        logger.info(f"📄 MIME Type: {mime_type}")
        
        try:
            file_path = str(file_path)
            
            if mime_type == 'application/pdf' or file_path.lower().endswith('.pdf'):
                logger.info("📄 Detected PDF file")
                return self._extract_from_pdf(file_path)
                
            elif mime_type.startswith('image/') or file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
                logger.info("🖼️ Detected image file")
                return self._extract_from_image(file_path)
                
            elif mime_type == 'text/plain' or file_path.lower().endswith('.txt'):
                logger.info("📝 Detected text file")
                return self._extract_from_text(file_path)
                
            elif mime_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                              'application/msword'] or file_path.lower().endswith('.docx'):
                logger.info("📄 Detected Word document")
                return self._extract_from_docx(file_path)
            
            else:
                raise ValueError(f"Unsupported file type: {mime_type}")
                
        except Exception as e:
            logger.error(f"❌ OCR extraction error: {str(e)}")
            return ""
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        try:
            logger.info("🔄 Converting PDF to images...")
            images = pdf2image.convert_from_path(file_path)
            logger.info(f"✅ Converted to {len(images)} pages")
            
            text = ""
            for i, image in enumerate(images):
                logger.info(f"📄 Processing PDF page {i+1}/{len(images)}")
                page_text = pytesseract.image_to_string(image)
                text += page_text
                logger.info(f"  Page {i+1} extracted {len(page_text)} characters")
            
            logger.info(f"✅ Total extracted text length: {len(text)} characters")
            logger.info(f"📝 Text preview: {text[:500]}...")
            return text
        except Exception as e:
            logger.error(f"❌ PDF extraction error: {str(e)}")
            return ""
    
    def _extract_from_image(self, file_path: str) -> str:
        """Extract text from image"""
        try:
            logger.info("🔄 Processing image...")
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            logger.info(f"✅ Extracted {len(text)} characters from image")
            logger.info(f"📝 Text preview: {text[:500]}...")
            return text
        except Exception as e:
            logger.error(f"❌ Image OCR error: {str(e)}")
            return ""
    
    def _extract_from_text(self, file_path: str) -> str:
        """Read text file directly"""
        try:
            logger.info("🔄 Reading text file...")
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            logger.info(f"✅ Read {len(text)} characters from text file")
            logger.info(f"📝 Text preview: {text[:500]}...")
            return text
        except Exception as e:
            logger.error(f"❌ Text file error: {str(e)}")
            return ""
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        try:
            logger.info("🔄 Processing DOCX file...")
            text = docx2txt.process(file_path)
            logger.info(f"✅ Extracted {len(text)} characters from DOCX")
            logger.info(f"📝 Text preview: {text[:500]}...")
            return text
        except Exception as e:
            logger.error(f"❌ DOCX extraction error: {str(e)}")
            return ""