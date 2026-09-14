'use client';

import { useEffect, useState } from 'react';
import { Character } from '@/types/character';
import { CharacterCard } from '@/components/CharacterCard';

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/characters/', {
          signal: AbortSignal.timeout(4000),
        });
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

  const speciesList = ['All', 'Vampire', 'Witch', 'Hybrid', 'Human'];

  const filteredCharacters = characters.filter((char) => {
    const matchesSearch =
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const charSpecies = char.species || 'Vampire';
    const matchesSpecies =
      selectedSpecies === 'All' ||
      charSpecies.toLowerCase() === selectedSpecies.toLowerCase();

    return matchesSearch && matchesSpecies;
  });

  const getBadgeStyle = (species?: string) => {
    switch (species?.toLowerCase()) {
      case 'vampire':
        return 'bg-red-950/80 text-red-400 border-red-800';
      case 'witch':
        return 'bg-purple-950/80 text-purple-400 border-purple-800';
      case 'hybrid':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'human':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      default:
        return 'bg-zinc-800 text-gray-300 border-zinc-700';
    }
  };

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

      {/* Search & Species Filter Toolbar */}
      <div className="bg-[#16161a] border border-zinc-800 rounded-2xl p-4 mb-8 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search characters..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#cc0000] transition-colors"
          />
        </div>

        {/* Species Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
          {speciesList.map((species) => (
            <button
              key={species}
              onClick={() => setSelectedSpecies(species)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedSpecies === species
                  ? 'bg-[#990000] text-white border-[#cc0000] shadow-md'
                  : 'bg-zinc-900 text-gray-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              {species}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
        </div>
      )}

      {/* Backend Connection Error Notice */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 text-center max-w-md mx-auto my-12">
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-2">
            Ensure Django server is running (`python manage.py runserver`)
          </p>
        </div>
      )}

      {/* Filtered Character Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
            {filteredCharacters.map((char) => (
              <div key={char.id} className="relative group">
                <div className="absolute top-4 right-4 z-20">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${getBadgeStyle(
                      char.species
                    )}`}
                  >
                    {char.species || 'Vampire'}
                  </span>
                </div>
                <CharacterCard character={char} />
              </div>
            ))}
          </div>

          {filteredCharacters.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              <p className="text-base font-medium">
                No characters found matching "{searchQuery}"
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecies('All');
                }}
                className="mt-3 text-xs text-[#cc0000] underline hover:text-red-400"
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}