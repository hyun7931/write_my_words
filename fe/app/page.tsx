'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Message, FolderInfo } from './types';
import { getFileList, ragQuery, directChat } from './lib/api';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';

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
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let assistantMsg: Message;

      if (useRag) {
        const res = await ragQuery(content);
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.answer,
          sources: res.relevantDocuments,
        };
      } else {
        const answer = await directChat(content);
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: answer,
        };
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // flex-1을 주어 부모(body)의 전체 높이를 차지하게 합니다.
    <div className="flex flex-1 h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* 사이드바도 내부에서 스크롤이 되도록 설정되어 있어야 합니다 */}
      <Sidebar folders={folders} onRefresh={fetchFolders} />

      <div className="flex flex-col flex-1 min-w-0 h-full">
        <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            WriteMyWords
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">문서 기반 AI 채팅</p>
        </header>

        {/* ChatWindow가 이 사이 공간을 꽉 채워야 합니다 */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
           <ChatWindow messages={messages} isLoading={isLoading} />
        </main>

        {/* 하단 입력창 영역 */}
        <footer className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </footer>
      </div>
    </div>
  );
}
