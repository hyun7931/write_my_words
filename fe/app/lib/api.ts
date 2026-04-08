import type {
  ApiResponse,
  FolderInfo,
  DocumentUploadResult,
  QueryResponse,
} from '../types';

const BASE_URL = '';

export async function getFileList(): Promise<FolderInfo[]> {
  const res = await fetch(`${BASE_URL}/api/v1/rag/files`);
  const json: ApiResponse<FolderInfo[]> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error ?? '파일 목록 조회 실패');
  return json.data;
}

export async function uploadDocument(file: File): Promise<DocumentUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/api/v1/rag/documents`, {
    method: 'POST',
    body: formData,
  });
  const json: ApiResponse<DocumentUploadResult> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error ?? '업로드 실패');
  return json.data;
}

export async function ragQuery(query: string, maxResults = 5): Promise<QueryResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, maxResults }),
  });
  const json: ApiResponse<QueryResponse> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error ?? 'RAG 질의 실패');
  return json.data;
}

export async function directChat(query: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const json: ApiResponse<{ answer: string }> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error ?? '채팅 실패');
  return json.data.answer;
}
