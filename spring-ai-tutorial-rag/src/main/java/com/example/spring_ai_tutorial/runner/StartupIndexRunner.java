package com.example.spring_ai_tutorial.runner;

import com.example.spring_ai_tutorial.service.FileDocumentIndexer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 서버 시작 시 file/ 폴더의 모든 문서를 자동으로 Qdrant에 인덱싱.
 * Spring Context 완전 초기화 후 실행되므로 VectorStore, EmbeddingModel 등 모든 빈이 준비된 상태.
 */
@Slf4j
@Component
public class StartupIndexRunner implements ApplicationRunner {

    private final FileDocumentIndexer fileDocumentIndexer;

    public StartupIndexRunner(FileDocumentIndexer fileDocumentIndexer) {
        this.fileDocumentIndexer = fileDocumentIndexer;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("========== 문서 자동 인덱싱 시작 ==========");
        try {
            FileDocumentIndexer.IndexingResult result = fileDocumentIndexer.indexAllDocuments();
            log.info("========== 문서 자동 인덱싱 완료 ==========");
            log.info("인덱싱: {}개 | 스킵: {}개 | 실패: {}개", result.indexed(), result.skipped(), result.failed());
        } catch (Exception e) {
            log.error("문서 인덱싱 중 예기치 않은 오류 발생. 서버는 정상 기동됩니다.", e);
        }
    }
}
