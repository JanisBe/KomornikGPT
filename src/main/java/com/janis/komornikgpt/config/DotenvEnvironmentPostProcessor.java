package com.janis.komornikgpt.config;

import org.jspecify.annotations.NonNull;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String DOTENV_PROPERTY_SOURCE_NAME = "dotenvProperties";
    private static final String DOTENV_FILE_NAME = ".env";

    @Override
    public void postProcessEnvironment(@NonNull ConfigurableEnvironment environment, @NonNull SpringApplication application) {
        Path envPath = findDotenvFile();
        if (envPath == null || !Files.exists(envPath) || !Files.isRegularFile(envPath)) {
            return;
        }

        Map<String, Object> envProperties = new HashMap<>();

        try (BufferedReader reader = Files.newBufferedReader(envPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int separatorIndex = line.indexOf('=');
                if (separatorIndex <= 0) {
                    continue;
                }

                String key = line.substring(0, separatorIndex).trim();
                String value = line.substring(separatorIndex + 1).trim();

                if (((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) && value.length() >= 2) {
                    value = value.substring(1, value.length() - 1);
                }

                if (!value.isEmpty()) {
                    envProperties.put(key, value);
                }
            }

            if (!envProperties.isEmpty()) {
                environment.getPropertySources().addFirst(new MapPropertySource(DOTENV_PROPERTY_SOURCE_NAME, envProperties));
                System.out.println("[Dotenv] Successfully loaded " + envProperties.size() + " properties from .env file (" + envPath.toAbsolutePath() + ")");
            }
        } catch (IOException _) {
            // Ignore if .env cannot be read
        }
    }

    private Path findDotenvFile() {
        Path directPath = Paths.get(DOTENV_FILE_NAME);
        if (Files.exists(directPath)) {
            return directPath;
        }

        String userDir = System.getProperty("user.dir");
        if (userDir != null) {
            Path userDirPath = Paths.get(userDir, DOTENV_FILE_NAME);
            if (Files.exists(userDirPath)) {
                return userDirPath;
            }
        }

        return null;
    }

    @Override
    public int getOrder() {
        // Run with highest precedence so variables are available before application.properties is parsed
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
