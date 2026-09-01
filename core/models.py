from django.db import models

# Create your models here.

class Character(models.Model):
    """
    Database model representing a TVDU character.
    Stores metadata, AI personality prompts, and paths for voice/image assets.
    """
    name = models.CharField(max_length=100, help_text="Character name (e.g., Damon Salvatore)")
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier (e.g., damon-salvatore)")
    title = models.CharField(max_length=150, blank=True, help_text="e.g., The Snarky Vampire / The Original Hybrid")
    
    # System Prompt defines the AI's personality, slang, and rules
    system_prompt = models.TextField(
        help_text="Detailed instructions guiding Gemini to respond strictly in character."
    )
    
    # Media assets
    avatar = models.ImageField(upload_to='characters/avatars/', help_text="Character portrait image")
    voice_sample = models.FileField(
        upload_to='characters/voices/', 
        help_text="Clean 6-10 second .wav file of character speaking (for voice cloning)"
    )
    
    # Metadata flags
    is_active = models.BooleanField(default=True, help_text="Toggle character visibility on the frontend")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name