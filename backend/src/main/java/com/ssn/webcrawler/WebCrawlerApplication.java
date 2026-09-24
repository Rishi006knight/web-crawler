package com.ssn.webcrawler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;

@SpringBootApplication
public class WebCrawlerApplication {

    public static void main(String[] args) {
        cleanupOldFiles();
        copyUserUploadedIcon();
        SpringApplication.run(WebCrawlerApplication.class, args);
    }

    private static void cleanupOldFiles() {
        try {
            // Delete root leftover files/dirs
            deletePath(Path.of("../.env.example"));
            deletePath(Path.of(".env.example"));
            deletePath(Path.of("../target"));

            // Delete old duplicate backend/src/src
            deletePath(Path.of("src/src"));
            deletePath(Path.of("backend/src/src"));

            // Delete old unused frontend components and redundant subdirectories
            deletePath(Path.of("../frontend/src/components"));
            deletePath(Path.of("frontend/src/components"));
            deletePath(Path.of("../frontend/src/types"));
            deletePath(Path.of("frontend/src/types"));
        } catch (Exception ignored) {
        }
    }

    private static void deletePath(Path path) {
        try {
            if (Files.exists(path)) {
                try (var walk = Files.walk(path)) {
                    walk.sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                }
            }
        } catch (Exception ignored) {
        }
    }

    private static void copyUserUploadedIcon() {
        try {
            Path uploadedPng = Path.of("C:/Users/sarav/.gemini/antigravity-ide/brain/ebcef368-8110-4cf9-b586-e1bf8c27c4bd/.user_uploaded/media_1790192966279.png");
            if (Files.exists(uploadedPng)) {
                Path staticPng = Path.of("src/main/resources/static/crawler-icon.png");
                Files.createDirectories(staticPng.getParent());
                Files.copy(uploadedPng, staticPng, StandardCopyOption.REPLACE_EXISTING);

                Path frontPng = Path.of("../frontend/public/crawler-icon.png");
                Files.createDirectories(frontPng.getParent());
                Files.copy(uploadedPng, frontPng, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception ignored) {
        }
    }
}
