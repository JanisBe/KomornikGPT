package com.janis.komornikgpt.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

@Repository
@Slf4j
public class HttpCookieOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request";
    public static final String REDIRECT_URI_PARAM_COOKIE_NAME = "redirect_uri";
    private static final int cookieExpireSeconds = 180;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(@NonNull HttpServletRequest request) {
        return CookieUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
                .map(cookie -> CookieUtils.deserialize(cookie, OAuth2AuthorizationRequest.class))
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(@Nullable OAuth2AuthorizationRequest authorizationRequest, @NonNull HttpServletRequest request, @NonNull HttpServletResponse response) {
        if (authorizationRequest == null) {
            log.debug("Removing OAuth2 authorization request cookies");
            removeAuthorizationRequestCookies(request, response);
            return;
        }

        log.info("Saving OAuth2 auth request. ClientId: [{}], RedirectURI: [{}], AuthorizationUri: [{}]",
                authorizationRequest.getClientId(),
                authorizationRequest.getRedirectUri(),
                authorizationRequest.getAuthorizationUri());

        boolean isSecure = request.isSecure();
        Cookie authCookie = CookieUtils.createCookie(
                OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME,
                CookieUtils.serialize(authorizationRequest),
                cookieExpireSeconds,
                isSecure,
                null,
                "Lax",
                isSecure
        );
        response.addCookie(authCookie);

        String redirectUriAfterLogin = request.getParameter(REDIRECT_URI_PARAM_COOKIE_NAME);
        if (StringUtils.hasText(redirectUriAfterLogin)) {
            log.debug("Target redirect URI after login: {}", redirectUriAfterLogin);
            Cookie redirectCookie = CookieUtils.createCookie(
                    REDIRECT_URI_PARAM_COOKIE_NAME,
                    redirectUriAfterLogin,
                    cookieExpireSeconds,
                    isSecure,
                    null,
                    "Lax",
                    isSecure
            );
            response.addCookie(redirectCookie);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response) {
        OAuth2AuthorizationRequest authorizationRequest = this.loadAuthorizationRequest(request);
        if (authorizationRequest != null) {
            removeAuthorizationRequestCookies(request, response);
        }
        return authorizationRequest;
    }

    public void removeAuthorizationRequestCookies(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response) {
        CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        CookieUtils.deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
    }
}
