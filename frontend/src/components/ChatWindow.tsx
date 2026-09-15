'use client';

import React, { useState, useRef, useEffect } from 'react';
import AudioVisualizer from '@/components/AudioVisualizer';
import CallSummaryModal from '@/components/CallSummaryModal';

interface Message {
  id: number;
  sender: 'user' | 'character' | 'system';
  text: string;
  audioUrl?: string;
  isError?: boolean;
}

interface ChatWindowProps {
  characterSlug: string;
}

const PRESET_PROMPTS = [
  'Tell me a secret about Mystic Falls...',
  'Who do you trust the most right now?',
  'What is your biggest regret?',
  'What are your plans for tonight?',
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ChatWindow({ characterSlug }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [isCallActive, setIsCallActive] = useState<boolean>(true);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const formattedName = characterSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Call duration timer (active while in call)
  useEffect(() => {
    if (!isCallActive) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsCallActive(false);
    setShowSummaryModal(true);
  };

  // Initialize Web Speech API with cleanup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Health check server connectivity
  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/characters/`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      setBackendOnline(res.ok);
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      : `${API_BASE_URL}${audioUrl}`;

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

    audio.onerror = () => {
      console.error('Failed to load audio resource');
      setPlayingAudioId(null);
      activeAudioRef.current = null;
    };
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || inputMessage;

    if (!textToSend.trim() || loading || playingAudioId !== null || !isCallActive) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (!overrideText) setInputMessage('');

    const userMsg: Message = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          character_slug: characterSlug,
          message: textToSend,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const data = await response.json();
      const botMsgId = Date.now() + 1;
      const characterMsg: Message = {
        id: botMsgId,
        sender: 'character',
        text: data.reply_text || data.response || 'No response returned.',
        audioUrl: data.audio_url,
      };

      setMessages((prev) => [...prev, characterMsg]);

      if (data.audio_url) {
        playAudio(data.audio_url, botMsgId);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isTimeout = error.name === 'AbortError';
      const errorMsg = isTimeout
        ? 'Voice synthesis timed out (20s limit). Check Django server logs.'
        : 'Connection lost. Ensure Django is running on port 8000.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          text: errorMsg,
          isError: true,
        },
      ]);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const isSpeaking = playingAudioId !== null;
  const userMessageCount = messages.filter((m) => m.sender === 'user').length;

  return (
    <div className="bg-[#16161a] border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[700px] w-full text-left relative">
      {/* Top Header */}
      <div className="border-b border-gray-800 pb-4 mb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              Call with <span className="text-[#cc0000]">{formattedName}</span>
            </h2>
            <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-xs font-mono text-emerald-400 rounded-md">
              ⏱️ {formatDuration(callDuration)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[#d4af37] text-xs uppercase tracking-wider">
              Persona: {characterSlug}
            </p>
            <span className="text-gray-600 text-xs">•</span>
            <p className="text-gray-400 text-xs">
              Exchanges: <span className="text-gray-200 font-semibold">{userMessageCount}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AudioVisualizer isSpeaking={isSpeaking} isGenerating={loading} />

          <button
            type="button"
            onClick={handleEndCall}
            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-semibold rounded-lg transition-colors"
          >
            🔴 End Call
          </button>
        </div>
      </div>

      {/* Backend Health Status Banner */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-3 h-3 rounded-full ${
              backendOnline === true
                ? 'bg-emerald-500 animate-pulse'
                : backendOnline === false
                ? 'bg-red-500'
                : 'bg-amber-500 animate-ping'
            }`}
          />
          <span className="text-xs text-gray-300 font-medium">
            {backendOnline === true
              ? 'Voice Pipeline Connected'
              : backendOnline === false
              ? 'Backend Offline'
              : 'Checking API Status...'}
          </span>
        </div>

        {backendOnline === false && (
          <button
            onClick={checkBackendHealth}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Retry Connection
          </button>
        )}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 pr-3 scrollbar-thin scrollbar-thumb-gray-800">
        {messages.length === 0 && (
          <div className="text-center py-12 px-4 my-auto">
            <p className="text-gray-400 text-sm mb-4">
              Click 🎤 to speak, type a message, or select a preset prompt to speak with {formattedName}:
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {PRESET_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(undefined, prompt)}
                  disabled={loading || isSpeaking || !isCallActive}
                  className="bg-zinc-900 hover:bg-zinc-800 text-gray-300 hover:text-white border border-zinc-800 rounded-xl px-3.5 py-2 text-xs transition-all text-left shadow-sm hover:border-[#cc0000]"
                >
                  💬 "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] p-3.5 rounded-xl text-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'ml-auto bg-[#990000] text-white rounded-tr-none'
                : msg.isError
                ? 'mx-auto bg-red-950/60 border border-red-800 text-red-300 text-xs text-center'
                : msg.sender === 'system'
                ? 'mx-auto bg-zinc-900 text-gray-400 text-xs text-center border border-zinc-800'
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
                    <span>▶</span> Replay Audio
                  </>
                )}
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="mr-auto bg-zinc-900 border border-zinc-800 p-3 rounded-xl rounded-tl-none text-xs text-gray-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#cc0000] animate-ping" />
            <span>{formattedName} is generating response & synthesizing voice...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form with Microphone Toggle */}
      <form onSubmit={(e) => handleSendMessage(e)} className="mt-4 flex gap-2 pt-2 border-t border-gray-800">
        <button
          type="button"
          onClick={toggleMic}
          disabled={loading || isSpeaking || !isCallActive}
          className={`px-3.5 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-1.5 ${
            isListening
              ? 'bg-red-600 text-white border-red-500 animate-pulse'
              : 'bg-zinc-900 text-gray-300 border-zinc-800 hover:text-white hover:border-zinc-700 disabled:opacity-50'
          }`}
          title={isListening ? 'Stop Listening' : 'Start Voice Input'}
        >
          {isListening ? '🎙️ Listening...' : '🎤'}
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading || isSpeaking || !isCallActive}
          placeholder={
            !isCallActive
              ? 'Call ended. Rate your experience below.'
              : isSpeaking
              ? `Listening to ${formattedName}...`
              : isListening
              ? 'Listening to microphone...'
              : `Say something to ${formattedName}...`
          }
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#cc0000] transition-colors disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || isSpeaking || !inputMessage.trim() || !isCallActive}
          className="bg-[#990000] hover:bg-[#cc0000] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      {/* Summary Modal */}
      <CallSummaryModal
        isOpen={showSummaryModal}
        characterName={formattedName}
        durationFormatted={formatDuration(callDuration)}
        exchangeCount={userMessageCount}
        onClose={() => setShowSummaryModal(false)}
      />
    </div>
  );
}