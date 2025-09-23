package com.janis.komornikgpt.config;

import com.janis.komornikgpt.auth.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    public static final String[] ALLOWED_GET_URLS = {
            "/",
            "/index.html",
            "/favicon.ico",
            "/*.png",
            "/*.gif",
            "/*.svg",
            "/*.jpg",
            "/*.html",
            "/*.json",
            "/*.css",
            "/*.js",
            "/api/auth/**",
            "/api/users/**",
            "/api/pwd/**",
            "/api/groups/**",
            "/.well-known/**",
            "/auth/callback",
            "/login",
            "/login/**",
            "/oauth2/**",
            "/manifest.webmanifest",
            "/api/webauthn/**",
            "/icons/**",
            "/assets/**"
    };

    public static final String[] ALLOWED_POST_URLS = {
            "/api/auth/login",
            "/api/auth/logout",
            "/api/users/**",
            "/api/pwd/**",};
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomOAuth2UserService customOAuth2UserService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, ALLOWED_GET_URLS).permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(HttpMethod.POST, ALLOWED_POST_URLS).permitAll()
                        .requestMatchers(expensesWithViewTokenMatcher()).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/expenses/group/*").authenticated()
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
//                        .userInfoEndpoint(userInfo -> userInfo
//                                .userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false))
                .headers(headers -> headers
                        .xssProtection(xss -> xss.headerValue(
                                XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                )
                .logout(logout -> logout
                        .logoutSuccessUrl(frontendUrl)
                        .invalidateHttpSession(true)
                        .deleteCookies("JWT_TOKEN", "JSESSIONID"))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(new SpaWebFilter(), BasicAuthenticationFilter.class)
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint()));
        return http.build();
    }

    private RequestMatcher expensesWithViewTokenMatcher() {
        return (HttpServletRequest request) -> {
            String uri = request.getRequestURI();
            String method = request.getMethod();
            String viewToken = request.getParameter("viewToken");

            return "GET".equals(method) &&
                    uri.matches("/api/expenses/group/\\d+") &&
                    viewToken != null &&
                    !viewToken.trim().isEmpty();
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> allowedOrigins = Arrays.asList(
                "http://localhost:4200",
                "http://localhost:80",
                "https://localhost:80",
                "https://127.0.0.1:80",
                "http://localhost",
                "http://127.0.0.1",
                "http://127.0.0.1:80");

        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}