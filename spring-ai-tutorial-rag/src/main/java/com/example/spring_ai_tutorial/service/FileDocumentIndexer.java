package com.example.spring_ai_tutorial.service;

import com.example.spring_ai_tutorial.repository.DocumentVectorStore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Stream;

/**
 * 서버 시작 시 file/ 폴더를 재귀 탐색하여 문서를 Qdrant에 자동 인덱싱하는 서비스
 *
 * - PDF, TXT, MD 파일만 처리
 * - .index-state.json 기반 SHA-256 해시 비교로 중복 임베딩 방지
 * - 파일 내용이 변경되면 해시가 달라져 자동 재인덱싱
 * - 한 파일 실패 시 나머지 파일은 계속 처리
 */
@Slf4j
@Service
public class FileDocumentIndexer {

    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of(".pdf", ".txt", ".md");

    private final DocumentVectorStore documentVectorStore;
    private final ObjectMapper objectMapper;

    @Value("${app.document.base-path:./file}")
    private String basePath;

    @Value("${app.document.state-file:./file/.index-state.json}")
    private String stateFilePath;

    public FileDocumentIndexer(DocumentVectorStore documentVectorStore, ObjectMapper objectMapper) {
        this.documentVectorStore = documentVectorStore;
        this.objectMapper = objectMapper;
    }

    /**
     * 전체 인덱싱 실행 진입점.
     * file/ 폴더를 재귀 탐색하여 처리 대상 파일을 인덱싱하고 결과 통계를 반환.
     */
    public IndexingResult indexAllDocuments() {
        Path base = Paths.get(basePath).toAbsolutePath().normalize();

        if (!Files.exists(base)) {
            log.warn("문서 폴더가 존재하지 않습니다. 인덱싱 생략: {}", base);
            return new IndexingResult(0, 0, 0);
        }

        log.info("문서 인덱싱 시작 - 경로: {}", base);
        Map<String, String> state = loadState();

        int indexed = 0;
        int skipped = 0;
        int failed = 0;

        try (Stream<Path> paths = Files.walk(base)) {
            List<Path> allPaths = paths.toList(); // 일단 리스트로 받아서 로그를 찍어봅니다.
            log.info("발견된 총 경로 수(폴더 포함): {}", allPaths.size());

            for (Path path : allPaths) {
                // 디렉토리는 건너뜁니다.
                if (Files.isDirectory(path)) continue;

                log.info("검사 중인 파일명: [{}]", path.getFileName());

                // 대상 파일인지 확인
                if (!isEligibleFile(path)) {
                    log.info("-> [탈락] 확장자 불일치 혹은 숨김파일");
                    continue;
                }

                File file = path.toFile();
                try {
                    String hash = computeHash(file);
                    String relativePath = base.getParent().relativize(path).toString().replace("\\", "/");

                    if (shouldSkip(relativePath, hash, state)) {
                        log.debug("스킵 (변경 없음): {}", relativePath);
                        skipped++;
                        continue;
                    }

                    processFile(file, relativePath, hash, base);
                    state.put(relativePath, hash);
                    saveState(state);
                    indexed++;
                    log.info("인덱싱 완료: {}", relativePath);

                } catch (Exception e) {
                    log.error("파일 처리 실패 - 파일: {}, 오류: {}", file.getName(), e.getMessage(), e);
                    failed++;
                }
            }
        } catch (IOException e) {
            log.error("폴더 탐색 중 오류 발생: {}", e.getMessage(), e);
        }

        log.info("문서 인덱싱 완료 - 인덱싱: {}개, 스킵: {}개, 실패: {}개", indexed, skipped, failed);
        return new IndexingResult(indexed, skipped, failed);
    }

    /**
     * 처리 대상 파일 여부 판단.
     * - 파일이어야 함 (디렉토리 제외)
     * - 숨김 파일 제외 (. 으로 시작)
     * - 지원 확장자: .pdf, .txt, .md
     * - 빈 파일 제외
     */
    private boolean isEligibleFile(Path path) {
        String fileName = path.getFileName().toString();

        // 1. 숨김 파일 및 인덱스 상태 파일 제외
        if (fileName.startsWith(".") || fileName.equals(".index-state.json")) return false;

        // 2. 확장자 체크
        String lowerName = fileName.toLowerCase();
        boolean isSupported = SUPPORTED_EXTENSIONS.stream().anyMatch(lowerName::endsWith);

        if (!isSupported) return false;

        // 3. 실제 파일인지 다시 확인
        return Files.isRegularFile(path);
    }

    /**
     * 상태 파일의 해시와 비교하여 스킵 여부 반환.
     */
    private boolean shouldSkip(String relativePath, String currentHash, Map<String, String> state) {
        return currentHash.equals(state.get(relativePath));
    }

    /**
     * 단일 파일을 읽어 메타데이터를 구성한 뒤 DocumentVectorStore에 위임.
     * DocumentVectorStore.addDocumentFile()이 내부적으로:
     *   PDF → PDFBox 텍스트 추출
     *   TXT/MD → Files.readString()
     *   → TokenTextSplitter 청킹 → 임베딩 → Qdrant upsert
     */
    private void processFile(File file, String relativePath, String hash, Path base) {
        String documentId = UUID.randomUUID().toString();

        // 1. 파일이 속한 직계 하위 폴더명 추출 (태그로 사용)
        Path relativeToFile = base.relativize(file.toPath());
        String folderName = "root";

        if (relativeToFile.getNameCount() > 1) {
            // 첫 번째 depth의 폴더명을 가져옴 (ex: allApplications, experience)
            folderName = relativeToFile.getName(0).toString();
        }

        String fileName = file.getName();
        String fileType = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("type", folderName);
        metadata.put("filePath", relativePath);
        metadata.put("folderName", folderName);
        metadata.put("fileName", fileName);
        metadata.put("fileType", fileType);
        metadata.put("fileHash", hash);
        metadata.put("indexedAt", String.valueOf(System.currentTimeMillis()));

        log.info("인덱싱 시도 - ID: {}, 타입(폴더): {}, 파일: {}", documentId, folderName, fileName);
        documentVectorStore.addDocumentFile(documentId, file, metadata);
    }

    /**
     * 파일 내용의 SHA-256 해시를 계산하여 hex 문자열로 반환.
     */
    private String computeHash(File file) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] bytes = Files.readAllBytes(file.toPath());
        byte[] hashBytes = digest.digest(bytes);

        StringBuilder hex = new StringBuilder();
        for (byte b : hashBytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    /**
     * 상태 파일(.index-state.json)을 읽어 Map<relativePath, sha256Hash>로 반환.
     * 파일이 없거나 파싱 실패 시 빈 Map 반환.
     */
    private Map<String, String> loadState() {
        File stateFile = new File(stateFilePath);
        if (!stateFile.exists()) {
            log.debug("상태 파일 없음. 새로 생성 예정: {}", stateFilePath);
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(stateFile, new TypeReference<Map<String, String>>() {});
        } catch (IOException e) {
            log.warn("상태 파일 읽기 실패. 전체 재인덱싱 진행: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * 현재 상태를 .index-state.json에 저장.
     */
    private void saveState(Map<String, String> state) {
        try {
            File stateFile = new File(stateFilePath);
            stateFile.getParentFile().mkdirs();
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(stateFile, state);
        } catch (IOException e) {
            log.error("상태 파일 저장 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 인덱싱 결과 통계 레코드.
     */
    public record IndexingResult(int indexed, int skipped, int failed) {}
}
