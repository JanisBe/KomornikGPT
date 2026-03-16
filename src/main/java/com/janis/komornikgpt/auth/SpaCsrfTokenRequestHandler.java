package com.janis.komornikgpt.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * CSRF Request Handler for SPAs that handles both the cookie and the header.
 * Inherits from CsrfTokenRequestAttributeHandler (which doesn't XOR by default)
 * to support Angular's raw XSRF-TOKEN cookie.
 */
public class SpaCsrfTokenRequestHandler extends CsrfTokenRequestAttributeHandler {
    private final CsrfTokenRequestAttributeHandler delegate = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Supplier<CsrfToken> csrfToken) {
        /*
         * Always use the raw token (not XORed) for the cookie.
         * By calling delegate.handle(), we ensure the token is populated as a request attribute.
         */
        this.delegate.handle(request, response, csrfToken);
    }

    @Override
    public String resolveCsrfTokenValue(@NonNull HttpServletRequest request, @NonNull CsrfToken csrfToken) {
        /*
         * If the request contains a CSRF header, then Spring Security expects that the
         * token is unmasked. However, if the request is for a cookie, then Spring Security
         * expects that the token is masked (XORed). This method handles both cases.
         */
        if (StringUtils.hasText(request.getHeader(csrfToken.getHeaderName()))) {
            return super.resolveCsrfTokenValue(request, csrfToken);
        }
        return this.delegate.resolveCsrfTokenValue(request, csrfToken);
    }
}
