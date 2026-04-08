'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Message, FolderInfo } from './types';
import { getFileList, ragQuery, directChat } from './lib/api';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';

// HTTP에서도 안전하게 ID 생성
const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState<FolderInfo[]>([]);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await getFileList();
      setFolders(data);
    } catch {
      // 파일 목록 로드 실패는 조용히 처리
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleSend = async (content: string, useRag: boolean) => {
    // 1. 사용자 메시지 ID 생성 (수정됨)
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let assistantMsg: Message;

      if (useRag) {
        const res = await ragQuery(content);
        // 2. RAG 응답 메시지 ID 생성 (수정됨)
        assistantMsg = {
          id: generateId(),
          role: 'assistant',
          content: res.answer,
          sources: res.relevantDocuments,
        };
      } else {
        const answer = await directChat(content);
        // 3. 일반 채팅 응답 메시지 ID 생성 (수정됨)
        assistantMsg = {
          id: generateId(),
          role: 'assistant',
          content: answer,
        };
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      // 4. 에러 메시지 ID 생성 (수정됨)
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Sidebar folders={folders} onRefresh={fetchFolders} />

      <div className="flex flex-col flex-1 min-w-0 h-full">
        <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            WriteMyWords
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">문서 기반 AI 채팅</p>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </main>

        <footer className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </footer>
      </div>
    </div>
  );
}