package com.janis.komornikgpt.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import java.util.function.Supplier;

/**
 * CSRF Request Handler for SPAs that handles both the cookie and the header.
 * Inherits from CsrfTokenRequestAttributeHandler (which doesn't XOR by default)
 * to support Angular's raw XSRF-TOKEN cookie.
 */
public class SpaCsrfTokenRequestHandler extends CsrfTokenRequestAttributeHandler {

    @Override
    public void handle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Supplier<CsrfToken> csrfToken) {
        /*
         * Always use the raw token (not XORed) for the cookie.
         * By calling super.handle(), we ensure the token is populated as a request attribute.
         */
        super.handle(request, response, csrfToken);
    }
}
