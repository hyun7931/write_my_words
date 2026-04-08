# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Run the application
./gradlew bootRun

# Build
./gradlew build

# Run all tests
./gradlew test

# Run a single test class
./gradlew test --tests com.example.spring_ai_tutorial.SpringAiTutorialApplicationTests

# Build executable JAR (skip tests)
./gradlew bootJar
```

**Prerequisites:**
- Java 17+
- Qdrant vector database on `localhost:6334`
- `.env` file with `OPENAI_API_KEY`

Swagger UI is available at `http://localhost:8080/swagger-ui.html` when running.

## Architecture

This is a RAG (Retrieval-Augmented Generation) system: users upload PDFs, which get chunked and stored as embeddings in Qdrant, then query questions retrieve relevant chunks to provide context for OpenAI LLM answers.

### Request Flows

**Document Upload:** `POST /api/v1/rag/documents`
1. `RagController` saves multipart upload to a temp file
2. `RagService` generates UUID + metadata
3. `DocumentVectorStore.addDocumentFile()` orchestrates:
   - `DocumentProcessingService` extracts PDF text (PDFBox)
   - `TokenTextSplitter` chunks into 512-token segments
   - OpenAI `text-embedding-3-small` converts chunks to vectors
   - Qdrant stores vectors + metadata (collection: `my_documents`)

**RAG Query:** `POST /api/v1/rag/query`
1. `RagController` → `RagService.retrieve()`
2. `DocumentVectorStore.similaritySearch()` embeds question, finds top-K similar chunks
3. `RagService.generateAnswerWithContexts()` builds prompt with context, calls `ChatService.openAiChat()`
4. Returns answer + source document references

**Direct Chat (no RAG):** `POST /api/v1/chat/query` — passes directly to OpenAI via `ChatService`

**Startup Auto-Indexing:** `StartupIndexRunner` → `FileDocumentIndexer` scans `./file/` folder for PDF/TXT/MD files on startup, using SHA-256 hashes (persisted in `./file/.index-state.json`) to skip unchanged files.

### Key Packages

| Package | Role |
|---|---|
| `controller` | REST endpoints (`RagController`, `ChatController`) |
| `service` | Business logic: `RagService`, `ChatService`, `DocumentProcessingService`, `EmbeddingService`, `FileDocumentIndexer` |
| `repository` | `DocumentVectorStore` — vector DB abstraction (chunking → embedding → Qdrant) |
| `config` | Spring beans for OpenAI client and Swagger |
| `runner` | `StartupIndexRunner` — triggers file indexing after context loads |
| `domain/dto` | Request/response DTOs; `ApiResponseDto<T>` wraps all HTTP responses |
| `exception` | `DocumentProcessingException` (HTTP 500) for pipeline failures |

### Tech Stack

- **Spring Boot 3.4.4** + **Spring AI 1.0.0-M6**
- **OpenAI** for embeddings (`text-embedding-3-small`) and chat (`gpt-3.5-turbo` default)
- **Qdrant** as the vector store
- **PDFBox** for PDF text extraction
- **dotenv-java** loads `.env` on startup in `SpringAiTutorialApplication`
