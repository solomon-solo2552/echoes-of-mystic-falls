from django.urls import path
from .views import CharacterChatAPIView

urlpatterns = [
    path('', CharacterChatAPIView.as_view(), name='character-chat'),
]