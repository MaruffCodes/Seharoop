#!/usr/bin/env python3
"""
Direct test of llama-cpp-python with your model
"""

import os
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_direct_load():
    """Test loading the model directly with llama-cpp-python"""
    
    model_path = os.path.join(Path(__file__).parent, "models", "medical-slm.gguf")
    
    # Check if file exists
    if not os.path.exists(model_path):
        logger.error(f"❌ Model not found at: {model_path}")
        return False
    
    file_size = os.path.getsize(model_path)
    logger.info(f"✅ Model found at: {model_path}")
    logger.info(f"📦 File size: {file_size / (1024*1024):.2f} MB")
    
    try:
        from llama_cpp import Llama
        
        logger.info("🔄 Attempting to load model with llama-cpp-python...")
        
        # Try with minimal parameters first
        llm = Llama(
            model_path=model_path,
            n_ctx=512,  # Smaller context for testing
            n_threads=2,
            verbose=True  # Enable verbose for debugging
        )
        
        logger.info("✅ Model loaded successfully!")
        
        # Test a simple prompt
        prompt = "Generate a brief medical summary."
        logger.info(f"🔄 Testing generation with prompt: {prompt}")
        
        output = llm(
            prompt,
            max_tokens=50,
            temperature=0.7,
            echo=False
        )
        
        if output and "choices" in output:
            generated = output["choices"][0]["text"].strip()
            logger.info(f"✅ Generation successful: {generated[:100]}...")
            return True
        else:
            logger.warning("⚠️ Generation returned no result")
            return False
            
    except ImportError as e:
        logger.error(f"❌ Failed to import llama_cpp: {e}")
        logger.info("Try: pip install llama-cpp-python")
        return False
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    logger.info("🔍 Testing direct model loading...")
    success = test_direct_load()
    
    if success:
        logger.info("✅ Direct test passed!")
        sys.exit(0)
    else:
        logger.error("❌ Direct test failed")
        sys.exit(1)