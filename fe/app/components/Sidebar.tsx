'use client';

import { useState } from 'react';
import type { FolderInfo } from '../types';
import FileUploadModal from './FileUploadModal';

interface Props {
  folders: FolderInfo[];
  onRefresh: () => void;
}

export default function Sidebar({ folders, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);

  const toggle = (folder: string) => {
    setExpanded((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  return (
    <>
      <aside className="w-60 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            인덱싱된 문서
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {folders.length === 0 ? (
            <p className="px-4 py-3 text-xs text-zinc-400">문서가 없습니다.</p>
          ) : (
            folders.map((folder) => (
              <div key={folder.folder}>
                <button
                  onClick={() => toggle(folder.folder)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-xs">{expanded[folder.folder] ? '▼' : '▶'}</span>
                  <span className="truncate font-medium">{folder.folder}</span>
                  <span className="ml-auto text-xs text-zinc-400">{folder.files.length}</span>
                </button>

                {expanded[folder.folder] && (
                  <ul className="pb-1">
                    {folder.files.length === 0 ? (
                      <li className="px-8 py-1 text-xs text-zinc-400">파일 없음</li>
                    ) : (
                      folder.files.map((file) => (
                        <li
                          key={file}
                          className="px-8 py-1 text-xs text-zinc-600 dark:text-zinc-400 truncate"
                          title={file}
                        >
                          📄 {file}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setShowModal(true)}
            className="w-full h-9 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            + PDF 업로드
          </button>
        </div>
      </aside>

      {showModal && (
        <FileUploadModal
          onClose={() => setShowModal(false)}
          onUploaded={onRefresh}
        />
      )}
    </>
  );
}
