# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

Mono-repo with two independent modules:
- `spring-ai-tutorial-rag/` — Spring Boot backend (RAG pipeline)
- `fe/` — Next.js frontend

## Commands

### Backend (run from `spring-ai-tutorial-rag/`)

```bash
./gradlew bootRun              # Start application on port 8080
./gradlew build                # Build (includes tests)
./gradlew test                 # Run all tests
./gradlew test --tests com.example.spring_ai_tutorial.<TestClassName>  # Run single test
./gradlew bootJar              # Build executable JAR, skip tests
```

**Prerequisites:** Java 17+, Qdrant on `localhost:6334`, `.env` file containing `OPENAI_API_KEY`

Swagger UI: `http://localhost:8080/swagger-ui.html`

### Frontend (run from `fe/`)

```bash
npm run dev    # Dev server on port 3000
npm run build  # Production build
npm run lint   # ESLint
```

> **Important:** This project uses Next.js 16 which has breaking changes from earlier versions. Read `fe/node_modules/next/dist/docs/` before writing frontend code.

## Architecture

This is a RAG (Retrieval-Augmented Generation) system. Users upload PDFs → chunks are embedded and stored in Qdrant → queries retrieve relevant chunks as context for OpenAI LLM answers.

### Backend Request Flows

**Document Upload** `POST /api/v1/rag/documents`
1. `RagController` saves multipart upload to temp file
2. `RagService` generates UUID + metadata
3. `DocumentVectorStore.addDocumentFile()` orchestrates:
   - `DocumentProcessingService` extracts text (PDFBox)
   - `TokenTextSplitter` chunks into 512-token segments
   - OpenAI `text-embedding-3-small` embeds each chunk
   - Qdrant stores vectors in collection `my_documents`

**RAG Query** `POST /api/v1/rag/query`
1. `DocumentVectorStore.similaritySearch()` embeds question, finds top-K chunks
2. `RagService.generateAnswerWithContexts()` builds contextualized prompt
3. `ChatService.openAiChat()` calls OpenAI, returns answer + source references

**Direct Chat (no RAG)** `POST /api/v1/chat/query` — forwards directly to OpenAI via `ChatService`

**Startup Auto-Indexing:** `StartupIndexRunner` → `FileDocumentIndexer` scans `./file/` for PDF/TXT/MD files, skipping unchanged files via SHA-256 hashes persisted in `./file/.index-state.json`

### Backend Key Packages

| Package | Role |
|---|---|
| `controller` | REST endpoints (`RagController`, `ChatController`) |
| `service` | Business logic: `RagService`, `ChatService`, `DocumentProcessingService`, `EmbeddingService`, `FileDocumentIndexer` |
| `repository` | `DocumentVectorStore` — vector DB abstraction (chunking → embedding → Qdrant) |
| `config` | Spring beans for OpenAI client and Swagger |
| `runner` | `StartupIndexRunner` — triggers file indexing on `ContextRefreshedEvent` |
| `domain/dto` | Request/response DTOs; all HTTP responses wrapped in `ApiResponseDto<T>` |
| `exception` | `DocumentProcessingException` (HTTP 500) for pipeline failures |

### Tech Stack

- **Spring Boot 3.4.4** + **Spring AI 1.0.0-M6** (milestone — check Spring AI milestone repo for dependencies)
- **OpenAI** for embeddings (`text-embedding-3-small`) and chat (`gpt-3.5-turbo` default)
- **Qdrant** as vector store (auto-initializes schema on first run)
- **PDFBox 2.0.27** for PDF text extraction
- **dotenv-java** loads `.env` at startup in `SpringAiTutorialApplication`
- **Next.js 16** + React 19 + TypeScript + Tailwind CSS 4 (frontend — not yet connected to backend)
