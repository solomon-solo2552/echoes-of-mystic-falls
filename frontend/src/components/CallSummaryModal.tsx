'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CallSummaryModalProps {
  isOpen: boolean;
  characterName: string;
  durationFormatted: string;
  exchangeCount: number;
  onClose: () => void;
}

export default function CallSummaryModal({
  isOpen,
  characterName,
  durationFormatted,
  exchangeCount,
  onClose,
}: CallSummaryModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#16161a] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-left">
        <h2 className="text-xl font-bold text-white mb-1">
          Call Ended with <span className="text-[#cc0000]">{characterName}</span>
        </h2>
        <p className="text-xs text-gray-400 mb-6">Here is a quick summary of your voice session.</p>

        {/* Call Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="text-xs text-gray-400 block mb-1">Call Duration</span>
            <span className="text-lg font-mono font-bold text-emerald-400">⏱️ {durationFormatted}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="text-xs text-gray-400 block mb-1">Exchanges</span>
            <span className="text-lg font-mono font-bold text-gray-200">💬 {exchangeCount}</span>
          </div>
        </div>

        {/* Feedback Section */}
        {!submitted ? (
          <form onSubmit={handleSubmitFeedback} className="space-y-4 border-t border-gray-800 pt-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-2">
                Rate Voice Quality & Persona Accuracy:
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-transform ${
                      star <= rating ? 'scale-110 opacity-100' : 'opacity-30 grayscale'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Any feedback on accent, latency, or responses?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#cc0000] resize-none h-20"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!rating}
                className="flex-1 bg-[#990000] hover:bg-[#cc0000] text-white py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Submit Feedback
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-gray-300 rounded-lg text-xs font-semibold transition-colors text-center"
              >
                Skip & Return Home
              </Link>
            </div>
          </form>
        ) : (
          <div className="border-t border-gray-800 pt-6 text-center space-y-4">
            <div className="text-3xl">🎉</div>
            <p className="text-xs text-emerald-400 font-medium">
              Thank you! Your feedback has been recorded.
            </p>
            <Link
              href="/"
              className="block w-full bg-[#990000] hover:bg-[#cc0000] text-white py-2 rounded-lg text-xs font-semibold transition-colors text-center"
            >
              Return to Character Directory
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}