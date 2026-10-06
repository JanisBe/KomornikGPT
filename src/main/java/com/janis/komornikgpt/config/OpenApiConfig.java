package com.janis.komornikgpt.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.AntPathMatcher;

import java.util.Collections;
import java.util.List;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "cookieAuth";

    private static final List<String> PUBLIC_GET_PATHS = List.of(
            "/api/users/check/username",
            "/api/users/check/email",
            "/api/pwd/confirm-email",
            "/.well-known/**",
            "/api/webauthn/**",
            "/actuator/health",
            "/actuator/info"
    );

    private static final List<String> PUBLIC_POST_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/users/register",
            "/api/pwd/forgot-password",
            "/api/pwd/reset-password",
            "/api/pwd/set-password-with-token"
    );

    @Bean
    public OpenAPI komornikOpenAPI() {
        return new OpenAPI()
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name("JWT_TOKEN")
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.COOKIE)
                                        .description("JWT access token stored in HTTP-only cookie")))
                .info(new Info().title("KomornikGPT API")
                        .description("API documentation for KomornikGPT expense management application")
                        .version("v0.0.1")
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")));
    }

    @Bean
    public OpenApiCustomizer securityOpenApiCustomizer() {
        AntPathMatcher pathMatcher = new AntPathMatcher();
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }

            openApi.getPaths().forEach((path, pathItem) -> {
                configureOperationSecurity(pathItem.getGet(), path, PathItem.HttpMethod.GET, pathMatcher);
                configureOperationSecurity(pathItem.getPost(), path, PathItem.HttpMethod.POST, pathMatcher);
                configureOperationSecurity(pathItem.getPut(), path, PathItem.HttpMethod.PUT, pathMatcher);
                configureOperationSecurity(pathItem.getDelete(), path, PathItem.HttpMethod.DELETE, pathMatcher);
                configureOperationSecurity(pathItem.getPatch(), path, PathItem.HttpMethod.PATCH, pathMatcher);
            });
        };
    }

    private void configureOperationSecurity(Operation operation, String path, PathItem.HttpMethod method, AntPathMatcher pathMatcher) {
        if (operation == null) {
            return;
        }

        boolean isPublic = isPublicPath(path, method, pathMatcher);
        if (isPublic) {
            operation.setSecurity(Collections.emptyList());
        } else if (operation.getSecurity() == null || operation.getSecurity().isEmpty()) {
            operation.setSecurity(List.of(new SecurityRequirement().addList(SECURITY_SCHEME_NAME)));
        }
    }

    private boolean isPublicPath(String path, PathItem.HttpMethod method, AntPathMatcher pathMatcher) {
        if (method == PathItem.HttpMethod.GET) {
            return PUBLIC_GET_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
        } else if (method == PathItem.HttpMethod.POST) {
            return PUBLIC_POST_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
        }
        return false;
    }
}
