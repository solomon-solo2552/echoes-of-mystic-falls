'use client';

import { useEffect, useState } from 'react';
import { Character } from '@/types/character';
import { CharacterCard } from '@/components/CharacterCard';

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/characters/');
        if (!response.ok) {
          throw new Error('Failed to load characters from Django backend.');
        }
        const data: Character[] = await response.json();
        setCharacters(data);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCharacters();
  }, []);

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <header className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
          Echoes of <span className="text-[#cc0000]">Mystic Falls</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Connect directly with supernatural inhabitants of Mystic Falls in real-time AI interactive calls.
        </p>
      </header>

      {/* Grid State Handling */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 text-center max-w-md mx-auto my-12">
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-2">Ensure Django server is running (`python manage.py runserver`)</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          {characters.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      )}
    </main>
  );
}