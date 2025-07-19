package com.janis.komornikgpt.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Log4j2
public class EmailService {
    private final JavaMailSender mailSender;
    private final Environment env;
    private final TemplateEngine templateEngine;

    @Async
    public void sendVerificationEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String verificationUrl = env.getProperty("url") + "/users/confirm-email?token=" + token;

            Context context = new Context();
            context.setVariable("verificationUrl", verificationUrl);

            String htmlContent = templateEngine.process("verification-email", context);

            helper.setTo(email);
            helper.setSubject("Witaj w Komorniku!");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error(ex.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String resetUrl = "https://" + env.getProperty("url") + "/users/reset-password?token=" + token;

            Context context = new Context();
            context.setVariable("resetUrl", resetUrl);

            String htmlContent = templateEngine.process("password-reset-email", context);

            helper.setTo(email);
            helper.setSubject("Reset hasła");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error(ex.getMessage());
        }
    }

    @Async
    public void sendSetPasswordEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String setUrl = "https://" + env.getProperty("url") + "/users/set-password-with-token?token=" + token;

            Context context = new Context();
            context.setVariable("setUrl", setUrl);

            String htmlContent = templateEngine.process("set-password-email", context);

            helper.setTo(email);
            helper.setSubject("Ustaw swoje hasło");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error(ex.getMessage());
        }
    }

    @Async
    public void sendGroupInvitationEmail(String toEmail, String groupName, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String joinUrl = String.format("https://%s/users/set-password?token=%s", env.getProperty("url"), token);

            Context context = new Context();
            context.setVariable("groupName", groupName);
            context.setVariable("joinUrl", joinUrl);

            String htmlContent = templateEngine.process("group-invitation-email", context);

            helper.setTo(toEmail);
            helper.setSubject("Zaproszenie do grupy");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error("Failed to send group invitation email: {}", ex.getMessage());
        }
    }
}