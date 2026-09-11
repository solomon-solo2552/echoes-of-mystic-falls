import os
from dotenv import load_dotenv  # Fixed import (was 'from env import load_dotenv')
from google import genai
from google.genai import types

load_dotenv()  # Load environment variables from .env file

class DynamicCharacterAI:
    def __init__(self, character_name: str, persona_prompt: str):
        self.character_name = character_name
        self.persona_prompt = persona_prompt
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def generate_response(self, user_message: str, chat_history: list = None) -> str:
        system_instruction = (
            f"You are roleplaying strictly as {self.character_name}. "
            f"Persona traits and background: {self.persona_prompt}. "
            f"Respond concisely in 1-3 sentences suitable for spoken dialogue. "
            f"Do not break character or mention you are an AI."
        )

        contents = []
        if chat_history:
            for entry in chat_history:
                contents.append(types.Content(
                    role="user" if entry["sender"] == "user" else "model",
                    parts=[types.Part.from_text(text=entry["message"])]
                ))
        
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_message)]
        ))

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",  # Fixed model endpoint (was 'gemini-2.5-flash')
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=150,
            ),
        )
        return response.text