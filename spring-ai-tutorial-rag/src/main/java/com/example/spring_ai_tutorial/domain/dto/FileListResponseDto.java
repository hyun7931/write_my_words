package com.example.spring_ai_tutorial.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "폴더별 파일 목록")
public class FileListResponseDto {

    @Schema(description = "폴더명")
    private final String folder;

    @Schema(description = "파일명 목록")
    private final List<String> files;

    public FileListResponseDto(String folder, List<String> files) {
        this.folder = folder;
        this.files = files;
    }

    public String getFolder() { return folder; }
    public List<String> getFiles() { return files; }
}
