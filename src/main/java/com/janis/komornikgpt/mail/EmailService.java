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

@Service
@RequiredArgsConstructor
@Log4j2
public class EmailService {
    private final JavaMailSender mailSender;
    private final Environment env;

    @Async
    public void sendVerificationEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            String msg = "Kliknij link, aby aktywować konto: https://" + env.getProperty("url") + "/users/confirm-email?token=" + token;
            message.setSubject("Witaj w Komorniku!");
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(email);
            helper.setText(msg, true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error(ex.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            String msg = "Kliknij link, aby zresetować hasło: https://" + env.getProperty("url") + "/users/reset-password?token=" + token;
            message.setSubject("Reset hasła");
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(email);
            helper.setText(msg, true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error(ex.getMessage());
        }
    }

    @Async
    public void sendSetPasswordEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            String msg = "Kliknij link, aby ustawić hasło: https://" + env.getProperty("url") + "/users/set-password-with-token?token=" + token;
            message.setSubject("Ustaw swoje hasło");
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(email);
            helper.setText(msg, true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error(ex.getMessage());
        }
    }

    @Async
    public void sendGroupInvitationEmail(String toEmail, String groupName, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            String msg = String.format("Witaj!\n\nZostałeś zaproszony do grupy \"%s\".\n\nUstaw swoje hasło, aby dołączyć: https://%s/users/set-password?token=%s", groupName, env.getProperty("url"), token);
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setText(msg, true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error("Failed to send group invitation email: {}", ex.getMessage());
        }
    }
}