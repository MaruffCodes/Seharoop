from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import shutil
from datetime import datetime
from pathlib import Path
import logging

from ocr.processor import OCRProcessor
from nlp.medical_entity_extractor import MedicalEntityExtractor
from nlp.summarizer import MedicalSummarizer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SEHAROOP OCR/NLP Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
ocr_processor = OCRProcessor()
entity_extractor = MedicalEntityExtractor()
summarizer = MedicalSummarizer()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "python-ocr-nlp",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/process")
async def process_document(file: UploadFile = File(...)):
    """
    Process medical document: OCR + NLP + Summary
    """
    temp_file = None
    try:
        # Validate file type
        allowed_types = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(400, f"Unsupported file type: {file.content_type}")
        
        # Save temp file
        temp_dir = Path("uploads/temp")
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        temp_file = temp_dir / file.filename
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Processing file: {file.filename}")
        
        # Step 1: OCR - Extract text
        logger.info("📄 Running OCR...")
        text = ocr_processor.extract_text(str(temp_file), file.content_type)
        
        if not text or len(text.strip()) < 10:
            logger.warning("⚠️ Insufficient text extracted")
            text = "No readable text found in document"
        
        # Step 2: NLP - Extract medical entities
        logger.info("🧠 Extracting medical entities...")
        entities = entity_extractor.extract(text)
        
        # Step 3: Generate summary
        logger.info("📝 Generating summary...")
        summary = summarizer.generate_summary(text, entities)
        
        # Step 4: Calculate confidence
        confidence = {
            "text_length": min(len(text) / 1000 * 100, 100),
            "entity_count": min(len(entities.get("diagnoses", [])) * 20, 100),
            "overall": 85  # Default confidence
        }
        
        result = {
            "success": True,
            "text": text[:1000],  # First 1000 chars for preview
            "entities": entities,
            "summary": summary,
            "confidence": confidence,
            "metadata": {
                "filename": file.filename,
                "file_type": file.content_type,
                "file_size": temp_file.stat().st_size,
                "text_length": len(text),
                "timestamp": datetime.now().isoformat()
            }
        }
        
        logger.info("✅ Processing complete")
        return result
        
    except Exception as e:
        logger.error(f"❌ Processing error: {str(e)}")
        raise HTTPException(500, f"Processing failed: {str(e)}")
        
    finally:
        # Cleanup temp file
        if temp_file and temp_file.exists():
            temp_file.unlink()

@app.post("/ocr-only")
async def ocr_only(file: UploadFile = File(...)):
    """Extract text only (no NLP)"""
    temp_file = None
    try:
        temp_dir = Path("uploads/temp")
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        temp_file = temp_dir / file.filename
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        text = ocr_processor.extract_text(str(temp_file), file.content_type)
        
        return {
            "success": True,
            "text": text
        }
        
    finally:
        if temp_file and temp_file.exists():
            temp_file.unlink()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)