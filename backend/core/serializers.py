from rest_framework import serializers
from .models import Character

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['id', 'name', 'slug', 'title', 'system_prompt', 'avatar', 'voice_sample', 'is_active']