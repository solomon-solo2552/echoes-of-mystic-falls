'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  sender: 'user' | 'character' | 'system';
  text: string;
  audioUrl?: string;
}

interface ChatWindowProps {
  characterSlug: string;
}

export default function ChatWindow({ characterSlug }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Formatting display name from slug (e.g., "damon-salvatore" -> "Damon Salvatore")
  const formattedName = characterSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Auto-scroll to the latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  const playAudio = (audioUrl: string, messageId: number) => {
    if (!audioUrl) return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    const fullAudioUrl = audioUrl.startsWith('http')
      ? audioUrl
      : `http://127.0.0.1:8000${audioUrl}`;

    const audio = new Audio(fullAudioUrl);
    activeAudioRef.current = audio;
    setPlayingAudioId(messageId);

    audio.play().catch((err) => {
      console.warn('Autoplay blocked or audio failed:', err);
      setPlayingAudioId(null);
    });

    audio.onended = () => {
      setPlayingAudioId(null);
      activeAudioRef.current = null;
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage('');

    const userMsg: Message = { id: Date.now(), sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_slug: characterSlug,
          message: userText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const botMsgId = Date.now() + 1;
      const characterMsg: Message = {
        id: botMsgId,
        sender: 'character',
        text: data.response || data.reply_text || 'No response returned.',
        audioUrl: data.audio_url,
      };

      setMessages((prev) => [...prev, characterMsg]);

      if (data.audio_url) {
        playAudio(data.audio_url, botMsgId);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          text: 'Failed to communicate with Django API. Ensure backend is running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#16161a] border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[650px] w-full text-left">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4 mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">
            Call with <span className="text-[#cc0000]">{formattedName}</span>
          </h2>
          <p className="text-[#d4af37] text-xs uppercase tracking-wider mt-0.5">
            Persona: {characterSlug}
          </p>
        </div>
        <Link
          href="/"
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-colors"
        >
          ← End Call
        </Link>
      </div>

      {/* Simulated Video/Audio Status Banner */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-300 font-medium">Interactive Voice Session Active</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">127.0.0.1:8000</span>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 pr-3 scrollbar-thin scrollbar-thumb-gray-800">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm italic">
            Start the conversation by sending a message to {formattedName}.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] p-3.5 rounded-xl text-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'ml-auto bg-[#990000] text-white rounded-tr-none'
                : msg.sender === 'system'
                ? 'mx-auto bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-center'
                : 'mr-auto bg-zinc-900 text-gray-200 border border-zinc-800 rounded-tl-none'
            }`}
          >
            <p>{msg.text}</p>

            {msg.audioUrl && (
              <button
                type="button"
                onClick={() => playAudio(msg.audioUrl!, msg.id)}
                className="mt-2 text-xs bg-black/50 hover:bg-black/80 text-gray-200 px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors border border-gray-700/50"
              >
                {playingAudioId === msg.id ? (
                  <>
                    <span className="animate-pulse text-[#cc0000]">🔊</span> Playing...
                  </>
                ) : (
                  <>
                    <span>▶</span> Play Voice Response
                  </>
                )}
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="mr-auto bg-zinc-900 border border-zinc-800 p-3 rounded-xl rounded-tl-none text-xs text-gray-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#cc0000] animate-ping" />
            <span>{formattedName} is thinking & generating voice response...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 pt-2 border-t border-gray-800">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Say something to ${formattedName}...`}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#cc0000] transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="bg-[#990000] hover:bg-[#cc0000] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}Hey 