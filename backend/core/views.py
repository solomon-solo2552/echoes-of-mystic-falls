from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Character
from .serializers import CharacterSerializer

# Create your views here.

@api_view(['GET'])
def character_list(request):
    """
    API endpoint that returns a JSON list of all active TVDU characters.
    """
    characters = Character.objects.filter(is_active=True)
    serializer = CharacterSerializer(characters, many=True)
    return Response(serializer.data)