import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services.gemini_service import DynamicCharacterAI
from core.models import Character 
from core.tts_service import generate_character_voice


class CharacterChatAPIView(APIView):
    def post(self, request):
        character_slug = request.data.get("character_slug")
        character_id = request.data.get("character_id")
        user_message = request.data.get("message")
        chat_history = request.data.get("history", [])

        if not user_message or not (character_slug or character_id):
            return Response(
                {"error": "A message and either character_slug or character_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if character_slug:
                character = Character.objects.get(slug=character_slug)
            else:
                character = Character.objects.get(id=character_id)
        except Character.DoesNotExist:
            return Response(
                {"error": "Character not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Generate text response using Gemini
        persona = character.system_prompt or "A dark, charming vampire."
        ai_service = DynamicCharacterAI(
            character_name=character.name,
            persona_prompt=persona
        )
        generated_text = ai_service.generate_response(
            user_message=user_message,
            chat_history=chat_history
        )

        # 2. Check for reference voice sample
        if not character.voice_sample:
            return Response(
                {"error": f"No voice reference sample uploaded for {character.name}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Synthesize generated text to audio using XTTS-v2
        speaker_wav_path = character.voice_sample.path
        filename = f"{character.slug}_{uuid.uuid4().hex[:8]}.wav"
        audio_url = generate_character_voice(generated_text, speaker_wav_path, filename)

        return Response({
            "character": character.name,
            "user_message": user_message,
            "reply_text": generated_text,
            "audio_url": audio_url
        }, status=status.HTTP_200_OK)