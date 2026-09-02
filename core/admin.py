from django.contrib import admin
from .models import *

# Register your models here.

@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    # Columns displayed in the admin list view
    list_display = ('name', 'title', 'is_active', 'created_at')

    # Enable filtering by active status
    list_filter = ('is_active',)

    # Enable searching by name or title
    search_fields = ('name', 'title', 'system_prompt')

    # Automatically generate slug from character name
    prepopulated_fields = {'slug': ('name',)}
    