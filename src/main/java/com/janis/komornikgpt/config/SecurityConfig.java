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
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
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
    public static final String[] STATIC_RESOURCES = {
            "/index.html",
            "/*.ico",
            "/*.png",
            "/*.gif",
            "/*.svg",
            "/*.jpg",
            "/*.html",
            "/*.json",
            "/*.css",
            "/*.js",
            "/manifest.webmanifest",
            "/icons/**",
            "/assets/**"
    };

    public static final String[] SWAGGER_RESOURCES = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    public static final String[] PUBLIC_API_GET = {
            "/api/auth/**",
            "/api/users/**",
            "/api/pwd/**",
            "/api/groups/**",
            "/.well-known/**",
            "/api/webauthn/**"
    };

    public static final String[] PUBLIC_API_POST = {
            "/api/auth/login",
            "/api/auth/logout",
            "/api/users/**",
            "/api/pwd/**",
    };

    public static final String[] OAUTH_URLS = {
            "/auth/callback",
            "/login",
            "/login/**",
            "/oauth2/**"
    };

    public static final String[] ALLOWED_ORIGINS = {
            "http://localhost:4200",
            "http://localhost:80",
            "https://localhost:80",
            "https://127.0.0.1:80",
            "http://localhost",
            "http://127.0.0.1",
            "http://127.0.0.1:80"
    };
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> {
                    CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
                    csrfRepository.setCookiePath("/");
                    csrf.ignoringRequestMatchers("/api/auth/login", "/api/users/register")
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler());
                })
                .securityContext(context -> context
                        .securityContextRepository(new RequestAttributeSecurityContextRepository()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/index.html").permitAll()
                        .requestMatchers(STATIC_RESOURCES).permitAll()
                        .requestMatchers(SWAGGER_RESOURCES).permitAll()
                        .requestMatchers(OAUTH_URLS).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_API_GET).permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_API_POST).permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(expensesWithViewTokenMatcher()).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/expenses/group/*").authenticated()
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(auth -> auth
                                .authorizationRequestRepository(cookieAuthorizationRequestRepository))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .xssProtection(xss -> xss.headerValue(
                                XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)))
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl(frontendUrl)
                        .invalidateHttpSession(true)
                        .deleteCookies("JWT_TOKEN", "JSESSIONID"))
                .addFilterBefore(new CsrfCookieFilter(), UsernamePasswordAuthenticationFilter.class)
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

        List<String> allowedOrigins = Arrays.asList(ALLOWED_ORIGINS);

        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}