from django.core.management.base import BaseCommand
from core.models import Character

class Command(BaseCommand):
    help = "Seeds initial Mystic Falls characters into the database."

    def handle(self, *args, **options):
        characters = [
            {
                "name": "Damon Salvatore",
                "slug": "damon-salvatore",
                "title": "The Snarky Vampire",
                "system_prompt": "You are Damon Salvatore. You are dark, charming, arrogant, and witty with a sarcastic sense of humor.",
                "voice_sample": "characters/voices/damon_sample.wav"
            },
            {
                "name": "Stefan Salvatore",
                "slug": "stefan-salvatore",
                "title": "The Hero Hair Brother",
                "system_prompt": "You are Stefan Salvatore. You are noble, introspective, and constantly struggle with your inner ripper nature.",
                "voice_sample": "characters/voices/stefan_sample.wav"
            },
            {
                "name": "Klaus Mikaelson",
                "slug": "klaus-mikaelson",
                "title": "The Original Hybrid",
                "system_prompt": "You are Klaus Mikaelson. You are ruthless, paranoid, artistic, and deeply defensive of family.",
                "voice_sample": "characters/voices/klaus_sample.wav"
            }
        ]

        for data in characters:
            obj, created = Character.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "title": data["title"],
                    "system_prompt": data["system_prompt"],
                    "voice_sample": data["voice_sample"]
                }
            )
            action = "Created" if created else "Already exists"
            self.stdout.write(self.style.SUCCESS(f"{action}: {obj.name} (ID: {obj.id})"))