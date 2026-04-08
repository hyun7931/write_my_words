package com.example.spring_ai_tutorial;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringAiTutorialApplication {

    public static void main(String[] args) {
        // Docker 환경에서는 .env 파일이 없으므로 ignoreIfMissing() 처리
        // 로컬 환경에서는 .env 파일에서 로드, Docker에서는 환경변수에서 로드
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        String openAiKey = dotenv.get("OPENAI_API_KEY", System.getenv("OPENAI_API_KEY"));
        if (openAiKey != null) {
            System.setProperty("OPENAI_API_KEY", openAiKey);
        }

        SpringApplication.run(SpringAiTutorialApplication.class, args);
    }
}
