'use client';

import { use } from 'react';
import ChatWindow from '@/components/ChatWindow';

export default function CallPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full">
        <ChatWindow characterSlug={slug} />
      </div>
    </div>
  );
}