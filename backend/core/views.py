from django.shortcuts import render
import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Character
from .serializers import CharacterSerializer
from .tts_service import generate_character_voice

# Create your views here.

@api_view(['GET'])
def character_list(request):
    """
    API endpoint that returns a JSON list of all active TVDU characters.
    """
    characters = Character.objects.filter(is_active=True)
    serializer = CharacterSerializer(characters, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def synthesize_speech(request):
    """
    POST payload:
    {
      "character_id": 1,
      "text": "Hello brother. Did you miss me?"
    }
    """
    character_id = request.data.get('character_id')
    text = request.data.get('text')
    
    if not character_id or not text:
        return Response({'error': 'Missing character_id or text payload'}, status=400)
        
    try:
        character = Character.objects.get(id=character_id)
        
        if not character.voice_sample:
            return Response({'error': f'No voice reference sample uploaded for {character.name}'}, status=400)
            
        speaker_wav_path = character.voice_sample.path
        filename = f"{character.slug}_{uuid.uuid4().hex[:8]}.wav"
        
        audio_url = generate_character_voice(text, speaker_wav_path, filename)
        
        return Response({
            'character': character.name,
            'text': text,
            'audio_url': audio_url
        })
    except Character.DoesNotExist:
        return Response({'error': 'Character not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)