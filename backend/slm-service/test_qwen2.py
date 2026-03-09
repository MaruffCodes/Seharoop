#!/usr/bin/env python3
"""
Test script for Qwen2 model support
"""

import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_qwen2_model():
    """Test loading Qwen2 model with updated llama-cpp-python"""
    
    model_path = os.path.join(Path(__file__).parent, "models", "medical-slm.gguf")
    
    logger.info(f"📂 Testing model: {model_path}")
    
    try:
        from llama_cpp import Llama
        from llama_cpp.llama import LlamaPooling
        
        logger.info(f"🔄 llama-cpp-python version: {Llama.__version__ if hasattr(Llama, '__version__') else 'unknown'}")
        
        # Try loading with explicit architecture
        llm = Llama(
            model_path=model_path,
            n_ctx=512,  # Small context for testing
            n_threads=2,
            verbose=True,
            pooling_type=LlamaPooling.NONE  # Explicit pooling type
        )
        
        logger.info("✅ Model loaded successfully!")
        
        # Test a simple prompt
        prompt = "Generate a brief medical summary."
        logger.info(f"🔄 Testing generation...")
        
        output = llm(
            prompt,
            max_tokens=50,
            temperature=0.7,
            stop=["\n\n", "Human:", "Assistant:"]
        )
        
        if output and "choices" in output:
            generated = output["choices"][0]["text"].strip()
            logger.info(f"✅ Generated: {generated[:100]}...")
            return True
        else:
            logger.warning("⚠️ No output generated")
            return False
            
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_qwen2_model()
    if success:
        logger.info("✅ Test passed!")
    else:
        logger.error("❌ Test failed")