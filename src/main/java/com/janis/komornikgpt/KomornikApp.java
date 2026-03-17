package com.janis.komornikgpt;

import com.janis.komornikgpt.mail.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@Log4j2
@RequiredArgsConstructor
public class KomornikApp {

    private final EmailService emailService;

    public static void main(String[] args) {
        SpringApplication.run(KomornikApp.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("KomornikApp initialized and ready");
        emailService.sendSimpleEmail("komornikapp@gmail.com", "Komornik uruchomiony", "Komornik uruchomiony");
    }

}
