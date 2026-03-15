package com.janis.komornikgpt.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class SpaWebFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Don't forward API, OAuth2, Actuator, or requests for files (containing a dot)
        if (!path.startsWith("/api") &&
                !path.startsWith("/oauth2") &&
                !path.startsWith("/actuator") &&
                !path.startsWith("/login/oauth2") &&
                !path.contains(".")) {
            request.getRequestDispatcher("/index.html").forward(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
