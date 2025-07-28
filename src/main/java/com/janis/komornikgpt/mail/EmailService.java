package com.janis.komornikgpt.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@Log4j2
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    private final String url;
    private final String frontendUrl;

    public EmailService(JavaMailSender mailSender, @Autowired Environment env, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.url = env.getProperty("url") + "/api/pwd";
        this.frontendUrl = env.getProperty("frontend.url");
    }

    @Async
    public void sendVerificationEmail(String email, String token, String username) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            String verificationUrl = String.format("%s/confirm-email?token=%s", frontendUrl, token);

            Context context = new Context();
            context.setVariable("verificationUrl", verificationUrl);
            context.setVariable("username", username);

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

            String resetUrl = String.format("%s/reset-password?token=%s", frontendUrl, token);
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

            String setUrl = String.format("%s/set-password?token=%s", url, token);
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
    public void sendGroupInvitationEmail(String toEmail, String groupName, String creatorName, Long groupId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            Context context = new Context();
            context.setVariable("groupName", groupName);
            context.setVariable("creatorName", creatorName);
            context.setVariable("groupLink", String.format("%s/groups/%d", frontendUrl, groupId));

            String htmlContent = templateEngine.process("group-invitation-existing-user-email", context);

            helper.setTo(toEmail);
            helper.setSubject("Zaproszenie do grupy");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error("Failed to send group invitation email: {}", ex.getMessage());
        }
    }

    @Async
    public void sendGroupInvitationAndSetPasswordEmail(String toEmail, String groupName, String creatorName, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String setPasswordUrl = String.format("%s/set-password?token=%s", frontendUrl, token);

            Context context = new Context();
            context.setVariable("groupName", groupName);
            context.setVariable("creatorName", creatorName);
            context.setVariable("setPasswordUrl", setPasswordUrl);

            String htmlContent = templateEngine.process("group-invitation-email", context);

            helper.setTo(toEmail);
            helper.setSubject("Zaproszenie do grupy i ustawienie hasła");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error("Failed to send group invitation and set password email: {}", ex.getMessage());
        }
    }
}