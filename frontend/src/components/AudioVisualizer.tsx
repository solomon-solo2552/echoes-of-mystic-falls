'use client';

import React from 'react';

interface AudioVisualizerProps {
  isSpeaking: boolean;
  isGenerating?: boolean;
}

export default function AudioVisualizer({ isSpeaking, isGenerating }: AudioVisualizerProps) {
  if (!isSpeaking && !isGenerating) {
    return (
      <div className="flex items-center justify-center gap-1 h-8 px-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
        <span className="text-[11px] text-gray-500 font-medium">Idle</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-inner">
      <div className="flex items-end gap-1 h-5">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isSpeaking
                ? 'bg-[#cc0000] animate-pulse'
                : 'bg-amber-500 animate-bounce'
            }`}
            style={{
              height: isSpeaking ? `${Math.floor(Math.random() * 14) + 6}px` : '10px',
              animationDelay: `${i * 150}ms`,
              animationDuration: isSpeaking ? '0.4s' : '0.8s',
            }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-300 ml-1.5">
        {isSpeaking ? (
          <span className="text-red-400">Speaking...</span>
        ) : (
          <span className="text-amber-400">Synthesizing...</span>
        )}
      </span>
    </div>
  );
}