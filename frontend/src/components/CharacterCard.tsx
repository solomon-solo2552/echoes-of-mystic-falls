import React from 'react';
import Link from 'next/link';
import { Character } from '../types/character';

interface CharacterCardProps {
  character: Character;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  // Use uploaded avatar URL or fallback to high-quality default portrait
  const avatarUrl = character.avatar 
    ? (character.avatar.startsWith('http') ? character.avatar : `http://127.0.0.1:8000${character.avatar}`)
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500';

  return (
    <div className="bg-[#16161a] border border-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#cc0000] flex flex-col justify-between">
      <div className="relative h-64 w-full bg-gray-900">
        <img
          src={avatarUrl}
          alt={character.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16161a] via-transparent to-transparent" />
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide">{character.name}</h3>
          <p className="text-xs text-[#d4af37] font-semibold mt-1 uppercase tracking-wider">{character.title}</p>
          <p className="text-xs text-gray-400 mt-3 line-clamp-2 italic">
            "{character.system_prompt.substring(0, 85)}..."
          </p>
        </div>

        <Link
          href={`/call/${character.slug}`}
          className="mt-6 w-full py-2.5 px-4 bg-[#990000] hover:bg-[#cc0000] text-white text-sm font-semibold rounded-lg text-center transition-colors shadow-md block"
        >
          Start Video Call
        </Link>
      </div>
    </div>
  );
};