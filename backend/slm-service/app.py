from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
import logging
from datetime import datetime
import os
from pathlib import Path

from summarizer.summary_generator import SummaryGenerator

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to store the summary generator
summary_generator = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load SLM model
    global summary_generator
    logger.info("🚀 Starting SLM service...")
    
    # Get model path from environment or use default
    model_path = os.getenv('MODEL_PATH', './models/medical-slm.gguf')
    
    # Initialize summary generator
    summary_generator = SummaryGenerator(model_path)
    success = summary_generator.initialize()
    
    if success:
        logger.info("✅ SLM model loaded successfully")
    else:
        logger.error("❌ Failed to load SLM model")
        logger.warning("⚠️ Service will continue without AI summaries")
    
    yield  # Application runs here
    
    # Shutdown: Clean up resources
    logger.info("🛑 Shutting down SLM service...")
    if summary_generator:
        # Clean up any resources if needed
        summary_generator = None
        logger.info("✅ Resources cleaned up")

# Create FastAPI app with lifespan
app = FastAPI(
    title="SEHAROOP SLM Summary Service",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class PatientData(BaseModel):
    name: str
    patientId: str
    age: Optional[str] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class ExtractedData(BaseModel):
    diagnoses: List[str] = []
    medications: List[str] = []
    labResults: List[str] = []
    allergies: List[str] = []
    pastSurgeries: List[Dict] = []
    chronicDiseases: List[str] = []
    comorbidConditions: List[str] = []

class SummaryRequest(BaseModel):
    patientData: PatientData
    extractedData: ExtractedData
    summaryType: str = "general"  # general, cardiology, orthopedic

class SummaryResponse(BaseModel):
    success: bool
    summary: str
    structured_summary: Optional[Dict] = None
    type: str
    timestamp: str

@app.get("/health")
async def health_check():
    global summary_generator
    return {
        "status": "healthy",
        "service": "slm-summary",
        "model_loaded": summary_generator.model_loaded if summary_generator else False,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """Generate medical summary using SLM"""
    global summary_generator
    
    if not summary_generator or not summary_generator.model_loaded:
        raise HTTPException(
            status_code=503, 
            detail="SLM model not loaded. Service may still be starting or model file missing."
        )
    
    try:
        logger.info(f"📝 Generating {request.summaryType} summary for patient: {request.patientData.name}")
        
        patient_dict = request.patientData.dict()
        extracted_dict = request.extractedData.dict()
        
        result = None
        
        if request.summaryType == "general":
            result = summary_generator.generate_general_summary(
                patient_dict, 
                extracted_dict
            )
        elif request.summaryType == "cardiology":
            result = summary_generator.generate_cardiology_summary(
                patient_dict,
                extracted_dict
            )
        elif request.summaryType == "orthopedic":
            result = summary_generator.generate_orthopedic_summary(
                patient_dict,
                extracted_dict
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid summary type")
        
        if not result or not result.get("success"):
            raise HTTPException(status_code=500, detail="Failed to generate summary")
        
        logger.info("✅ Summary generated successfully")
        
        return SummaryResponse(
            success=True,
            summary=result.get("raw_summary", ""),
            structured_summary=result.get("structured_summary"),
            type=result.get("type", request.summaryType),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"❌ Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-generate")
async def batch_generate(requests: List[SummaryRequest]):
    """Generate multiple summaries in batch"""
    global summary_generator
    
    if not summary_generator or not summary_generator.model_loaded:
        raise HTTPException(
            status_code=503, 
            detail="SLM model not loaded"
        )
    
    results = []
    for req in requests:
        try:
            result = await generate_summary(req)
            results.append(result)
        except Exception as e:
            results.append({
                "success": False,
                "error": str(e),
                "patient": req.patientData.name
            })
    return {"results": results}

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv('PORT', 5003))
    host = os.getenv('HOST', '0.0.0.0')
    
    # Run with proper import string for reload
    uvicorn.run(
        "app:app",  # Use import string format
        host=host,
        port=port,
        reload=True,  # Enable reload for development
        log_level="info"
    )