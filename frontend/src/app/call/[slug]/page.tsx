'use client';

import { use } from 'react';
import Link from 'next/link';

export default function CallPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl w-full bg-[#16161a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Connecting Call...</h2>
        <p className="text-[#d4af37] text-sm uppercase tracking-wider mb-6">Persona: {slug}</p>
        
        <div className="w-32 h-32 rounded-full bg-gray-800 mx-auto mb-6 border-2 border-[#cc0000] flex items-center justify-center animate-pulse">
          <span className="text-gray-400 text-xs">Video Feed</span>
        </div>

        <p className="text-gray-400 text-sm mb-8">
          WebRTC connection setup and XTTS-v2 voice engine integration coming in Day 5 & Day 6.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          ← End Call & Return Home
        </Link>
      </div>
    </div>
  );
}