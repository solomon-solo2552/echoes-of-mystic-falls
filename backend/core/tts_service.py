import os
import sys
import types
import importlib.machinery
import importlib.metadata
import torch
from django.conf import settings

# --- 1. Python 3.14 Dataclass / Keyword Argument Fix ---
import dataclasses
_orig_post_init = dataclasses._process_class if hasattr(dataclasses, '_process_class') else None

# Patch dataclass instantiation to absorb unexpected kwargs in Python 3.14
def _patch_dataclass_init():
    orig_dataclass = dataclasses.dataclass
    def dataclass_wrapper(*args, **kwargs):
        kwargs['kw_only'] = False if 'kw_only' in kwargs else False
        def decorator(cls):
            cls = orig_dataclass(*args, **kwargs)(cls)
            orig_init = cls.__init__
            def new_init(self, *i_args, **i_kwargs):
                fields = {f.name for f in dataclasses.fields(cls)}
                filtered_kwargs = {k: v for k, v in i_kwargs.items() if k in fields}
                try:
                    orig_init(self, *i_args, **filtered_kwargs)
                except TypeError:
                    orig_init(self, *i_args)
            cls.__init__ = new_init
            return cls
        return decorator
    return dataclass_wrapper

# --- 2. Bypass TTS & transformers torchcodec checks ---
if "torchcodec" not in sys.modules:
    dummy_torchcodec = types.ModuleType("torchcodec")
    dummy_torchcodec.__spec__ = importlib.machinery.ModuleSpec("torchcodec", loader=None)
    sys.modules["torchcodec"] = dummy_torchcodec

_original_metadata_version = importlib.metadata.version

def _patched_metadata_version(distribution_name: str):
    if distribution_name == "torchcodec":
        return "0.1.0"
    return _original_metadata_version(distribution_name)

importlib.metadata.version = _patched_metadata_version

# --- 3. Soundfile backend patch for torchaudio ---
import torchaudio
import soundfile as sf

def _soundfile_load(filepath, *args, **kwargs):
    data, samplerate = sf.read(filepath, dtype='float32')
    tensor = torch.from_numpy(data)
    if tensor.ndim == 1:
        tensor = tensor.unsqueeze(0)
    else:
        tensor = tensor.T
    return tensor.to(torch.float32), samplerate

def _soundfile_info(filepath, *args, **kwargs):
    info = sf.info(filepath)
    class MetaData:
        sample_rate = info.samplerate
        num_frames = info.frames
        num_channels = info.channels
        bits_per_sample = 16
        encoding = "PCM_S"
    return MetaData()

torchaudio.load = _soundfile_load
torchaudio.info = _soundfile_info

# --- 4. MPS & Transformers PyTorch 3.14 compatibility ---
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