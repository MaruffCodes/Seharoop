import os
import logging
from pathlib import Path
from llama_cpp import Llama
from typing import Optional, Dict, Any
import json
import traceback

logger = logging.getLogger(__name__)

class SLMLoader:
    """Load and manage the medical SLM model"""
    
    def __init__(self, model_path: str = None):
        """Initialize the SLM loader with model path"""
        # Use environment variable or default path
        env_model_path = os.getenv('MODEL_PATH')
        
        if model_path:
            self.model_path = model_path
        elif env_model_path:
            self.model_path = env_model_path
        else:
            # Default path - absolute path for reliability
            self.model_path = str(Path(__file__).parent.parent / "models" / "medical-slm.gguf")
        
        # Convert to absolute path
        self.model_path = str(Path(self.model_path).resolve())
        
        logger.info(f"📂 Model path set to: {self.model_path}")
        
        self.model = None
        self.model_params = {
            "n_ctx": 4096,  # Increased from 2048 for longer summaries
            "n_threads": 4,
            "n_gpu_layers": 0,
            "temperature": 0.7,
            "max_tokens": 2048,  # Increased from 1024
            "top_p": 0.95,
            "top_k": 40,
            "repeat_penalty": 1.1,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0,
        }
        
    def load_model(self) -> bool:
        """Load the SLM model from file"""
        try:
            # Log absolute path for debugging
            logger.info(f"📂 Attempting to load model from: {self.model_path}")
            
            # Check if model file exists
            if not os.path.exists(self.model_path):
                logger.error(f"❌ Model not found at: {self.model_path}")
                logger.info(f"Current working directory: {os.getcwd()}")
                if os.path.exists(os.path.dirname(self.model_path)):
                    logger.info(f"Directory contents: {os.listdir(os.path.dirname(self.model_path))}")
                return False
            
            # Check file size
            file_size = os.path.getsize(self.model_path)
            logger.info(f"📦 Model file size: {file_size / (1024*1024):.2f} MB")
            
            if file_size == 0:
                logger.error("❌ Model file is empty")
                return False
            
            logger.info(f"⚙️ Model params: {json.dumps(self.model_params, indent=2)}")
            
            # Try to load with standard settings
            try:
                self.model = Llama(
                    model_path=self.model_path,
                    n_ctx=self.model_params["n_ctx"],
                    n_threads=self.model_params["n_threads"],
                    n_gpu_layers=self.model_params["n_gpu_layers"],
                    verbose=False
                )
                logger.info("✅ SLM model loaded successfully")
                return True
                
            except Exception as e:
                logger.warning(f"⚠️ First load attempt failed: {e}")
                
                # Second attempt with lower context (for memory)
                logger.info("🔄 Trying with lower context (2048)...")
                self.model = Llama(
                    model_path=self.model_path,
                    n_ctx=2048,
                    n_threads=self.model_params["n_threads"],
                    verbose=False
                )
                logger.info("✅ SLM model loaded with lower context")
                return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load SLM model: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    def generate_summary(self, prompt: str, **kwargs) -> Optional[str]:
        """Generate summary using the loaded model"""
        if not self.model:
            logger.error("Model not loaded. Call load_model() first.")
            return None
        
        try:
            # Merge default params with any overrides
            params = {**self.model_params, **kwargs}
            
            logger.info(f"🔄 Generating with max_tokens={params['max_tokens']}, temperature={params['temperature']}")
            
            # Generate response with better parameters for longer output
            response = self.model(
                prompt,
                max_tokens=params["max_tokens"],
                temperature=params["temperature"],
                top_p=params["top_p"],
                top_k=params["top_k"],
                repeat_penalty=params["repeat_penalty"],
                frequency_penalty=params.get("frequency_penalty", 0.0),
                presence_penalty=params.get("presence_penalty", 0.0),
                stop=["\n\n\n", "Human:", "Assistant:", "<|im_end|>"],  # Less aggressive stopping
                echo=False
            )
            
            # Extract generated text
            if response and "choices" in response and len(response["choices"]) > 0:
                summary = response["choices"][0]["text"].strip()
                
                # Log first 100 chars for debugging
                logger.info(f"📝 Generated summary (first 100 chars): {summary[:100]}...")
                logger.info(f"📊 Summary length: {len(summary)} characters")
                
                return summary
            
            logger.warning("⚠️ No summary generated - empty response from model")
            return None
            
        except Exception as e:
            logger.error(f"❌ Summary generation error: {str(e)}")
            return None
    
    def update_params(self, **kwargs):
        """Update model parameters"""
        self.model_params.update(kwargs)
        logger.info(f"Updated model params: {json.dumps(kwargs, indent=2)}")