package com.janis.komornikgpt.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class SpaWebFilter extends OncePerRequestFilter {

    /**
     * Forwards any unmapped paths (except those containing a period) to the client {@code index.html}.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api") &&
                !path.startsWith("/oauth2") &&
                !path.startsWith("/login") &&
                !path.contains(".") &&
                !path.equals("/")) {
            request.getRequestDispatcher("/index.html").forward(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
