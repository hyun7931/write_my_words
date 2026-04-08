export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface FolderInfo {
  folder: string;
  files: string[];
}

export interface DocumentResponse {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, string>;
}

export interface QueryResponse {
  query: string;
  answer: string;
  relevantDocuments: DocumentResponse[];
}

export interface DocumentUploadResult {
  documentId: string;
  message: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentResponse[];
}
