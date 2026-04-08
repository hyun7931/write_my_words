'use client';

import { useState } from 'react';
import type { Message } from '../types';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-1 ml-1">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showSources ? '출처 숨기기 ▲' : `출처 보기 (${message.sources.length}개) ▼`}
            </button>
            {showSources && (
              <ul className="mt-1 space-y-1">
                {message.sources.map((src, i) => (
                  <li
                    key={src.id}
                    className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
                  >
                    <span className="font-medium">[{i + 1}]</span>{' '}
                    {src.metadata?.originalFilename ?? src.metadata?.fileName ?? '알 수 없는 파일'}
                    <span className="ml-2 text-zinc-400">
                      (유사도 {(src.score * 100).toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
