'use client';

import { useState, KeyboardEvent } from 'react';

interface Props {
  onSend: (message: string, useRag: boolean) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [input, setInput] = useState('');
  const [useRag, setUseRag] = useState(true);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, useRag);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-32"
          rows={1}
          placeholder="질문을 입력하세요... (Shift+Enter: 줄바꿈)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          전송
        </button>
      </div>

      <div className="flex gap-4 mt-2">
        <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={useRag}
            onChange={() => setUseRag(true)}
            className="accent-blue-600"
          />
          RAG (문서 검색)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={!useRag}
            onChange={() => setUseRag(false)}
            className="accent-blue-600"
          />
          일반 채팅
        </label>
      </div>
    </div>
  );
}
