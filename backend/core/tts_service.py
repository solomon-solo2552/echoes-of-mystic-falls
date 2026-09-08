import os
import sys
import uuid
import torch
from django.conf import settings

# --- Python 3.14 Compatibility Patch ---
import transformers.pytorch_utils as p
if not hasattr(p, 'isin_mps_friendly'):
    setattr(p, 'isin_mps_friendly', getattr(p, 'isin_mps_exportable', lambda x, y: False))

from TTS.api import TTS

_tts_model = None

def get_tts_model():
    """
    Lazy loader for XTTS-v2 model. Keeps model in memory for instant reuse.
    """
    global _tts_model
    if _tts_model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading XTTS-v2 model on device: {device}...")
        _tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=(device == "cuda"))
    return _tts_model

def generate_character_voice(text: str, speaker_wav_path: str, output_filename: str) -> str:
    """
    Clones voice from speaker_wav_path, synthesizes input text, and saves to media/generated_audio/
    """
    model = get_tts_model()
    
    output_dir = os.path.join(settings.MEDIA_ROOT, 'generated_audio')
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, output_filename)
    
    model.tts_to_file(
        text=text,
        file_path=output_path,
        speaker_wav=speaker_wav_path,
        language="en"
    )
    
    return f"{settings.MEDIA_URL}generated_audio/{output_filename}"