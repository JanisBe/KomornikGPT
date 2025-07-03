package com.janis.komornikgpt.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.io.IOException;

@Controller
public class OAuth2Controller {

    @GetMapping("/login/oauth2/code/{provider}")
    public void handleOAuth2Redirect(@PathVariable String provider, HttpServletResponse response) throws IOException {
        // Redirect to the frontend with the provider information
        response.sendRedirect("http://localhost:4200/auth/callback/" + provider);
    }
}